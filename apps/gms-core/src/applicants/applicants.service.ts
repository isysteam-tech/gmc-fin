import { Injectable, NotFoundException, ForbiddenException, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ApplicantProfile, SalaryBand } from './applicants.entity';
import { PersonIdentity } from './person-identity.entity';
import { SecurityAudit } from './securityAudit.entity';
import { VaultService } from '../vault/vault.service';
import { Company } from './company.entity';
import { Project } from './project.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as XLSX from 'xlsx'
import { KeyRotationBatch } from './key_rotation_batches.entity';
import moment from 'moment-timezone';

@Injectable()
export class ApplicantsService {
    private readonly logger = new Logger(ApplicantsService.name);
    // private readonly TRANSIT_KEY_NAME = process.env.TRANSIT_KEY_NAME || 'applicant-data-key';

    constructor(
        @InjectRepository(ApplicantProfile)
        private applicantsRepository: Repository<ApplicantProfile>,
        @InjectRepository(PersonIdentity)
        private personIdentityRepository: Repository<PersonIdentity>,
        @InjectRepository(SecurityAudit)
        private securityAuditRepository: Repository<SecurityAudit>,
        private readonly vaultService: VaultService,
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
        @InjectRepository(KeyRotationBatch)
        private readonly batchRepository: Repository<KeyRotationBatch>,
    ) {
    }

    private mapSalaryToBand(salary: number): SalaryBand {
        if (salary < 3000) return SalaryBand.A;
        if (salary < 6000) return SalaryBand.B;
        if (salary < 10000) return SalaryBand.C;
        return SalaryBand.D;
    }

    async createApplicant(data: any, role?: string, userId?: string) {
        const { name, email, phone, salary, nric, bank_acc, bank_code, designation, company, project } = data;

        try {
            const salaryBand = this.mapSalaryToBand(Number(salary));

            // Tokenize sensitive data using Vault Transit encryption
            const [nric_token, bank_acc_token, bank_code_token] = await Promise.all([
                this.vaultService.tokenise('nric', nric),
                this.vaultService.tokenise('bank', bank_acc),
                this.vaultService.tokenise('bank_code', bank_code),
            ]);
            // Create applicant profile
            const applicant = this.applicantsRepository.create({
                name,
                email,
                phone,
                salaryBand,
                designation
            });

            const savedApplicant = await this.applicantsRepository.save(applicant);

            // Create person identity with tokenized (encrypted) data
            const identity = this.personIdentityRepository.create({
                nric_token,
                bank_acc_token,
                bank_code_token,
                applicant: savedApplicant,

            });
            await this.personIdentityRepository.save(identity);
            if (company) {
                const companyEntity = this.companyRepository.create({
                    companyName: company.company_name,
                    uen: company.uen,
                    regAddress: company.reg_address,
                    businessSector: company.business_sector,
                    employeeCount: company.employee_count,
                    applicant: savedApplicant,
                });
                await this.companyRepository.save(companyEntity);
            }

            if (project) {
                const projectEntity = this.projectRepository.create({
                    title: project.title,
                    desc: project.desc,
                    timeline: project.timeline,
                    totalCost: project.total_cost,
                    fundingAmount: project.funding_amount,
                    applicant: savedApplicant,
                });
                await this.projectRepository.save(projectEntity);
            }

            // Security audit log
            await this.securityAuditRepository.save({
                actor_id: userId || null,
                action: 'tokenise',
                resource: 'applicant',
                resource_id: savedApplicant.id,
                purpose: 'create-applicant',
                decision: 'allow',
                request_ctx: { source: 'API', role: role ? role : 'system' },
            });

            this.logger.log(`Applicant ${savedApplicant.id} created by user ${userId || 'system'}`);

            // Return response with masked sensitive data
            return {
                id: savedApplicant.id,
                name,
                email,
                phone_masked: await this.vaultService.makeMask('phone', phone),
                salary_band: salaryBand,
                message: 'Applicant created successfully',
            };
        } catch (err) {
            this.logger.error('Failed to create applicant:', err);
            throw err;
        }
    }

    async getApplicantById(applicantId: string, userRole?: string, userId?: string): Promise<any> {
        const applicant = await this.applicantsRepository.findOne({
            where: { id: applicantId },
            relations: ['identity', 'company', 'project'],
        });

        if (!applicant) {
            throw new NotFoundException(`Applicant with ID ${applicantId} not found`);
        }
        // Security audit log
        await this.securityAuditRepository.save({
            actor_id: userId || null,
            action: 'read-view',
            resource: 'applicant',
            resource_id: applicantId,
            purpose: 'view-profile',
            decision: 'allow',
            request_ctx: { role: userRole || 'unknown', source: 'API' },
        });
        this.logger.log(`User ${userId} (role: ${userRole}) viewed applicant ${applicantId}`);

        return {
            id: applicant.id,
            name: applicant.name,
            email: applicant.email ? await this.vaultService.makeMask('email', applicant.email) : null,
            phone: applicant.phone ? await this.vaultService.makeMask('phone', applicant.phone) : null,
            salaryBand: applicant.salaryBand,
            designation: applicant.designation,
            createdAt: applicant.createdAt,
            identity: applicant.identity
                ? {
                    id: applicant.identity.id,
                    nric_token: applicant.identity.nric_token ? await this.vaultService.makeMask('nric', applicant.identity.nric_token) : null,
                    bank_acc_token: applicant.identity.bank_acc_token ? await this.vaultService.makeMask('bank', applicant.identity.bank_acc_token) : null,
                    bank_code_token: applicant.identity.bank_code_token ? await this.vaultService.makeMask('bank_code', applicant.identity.bank_code_token) : null,
                    createdAt: applicant.identity.createdAt,
                }
                : null,
            company: applicant.company
                ? {
                    id: applicant.company.id,
                    companyName: applicant.company.companyName,
                    uen: applicant.company.uen,
                    regAddress: applicant.company.regAddress,
                    businessSector: applicant.company.businessSector,
                    employeeCount: applicant.company.employeeCount,
                    createdAt: applicant.company.createdAt,
                }
                : null,
            project: applicant.project
                ? {
                    id: applicant.project.id,
                    title: applicant.project.title,
                    desc: applicant.project.desc,
                    timeline: applicant.project.timeline,
                    totalCost: applicant.project.totalCost,
                    fundingAmount: applicant.project.fundingAmount,
                    createdAt: applicant.project.createdAt,
                }
                : null,
        };
    }

    async getApplicantList(limit: number, skip: number, userRole: string, userId: string) {
        try {
            const query = this.applicantsRepository
                .createQueryBuilder('applicant')
                .leftJoin('applicant.identity', 'identity')
                .select([
                    'applicant.id',
                    'applicant.salaryBand',
                    'applicant.createdAt',
                    'identity.nric_token',
                    'identity.bank_acc_token',
                    'identity.bank_code_token',
                ])
                .orderBy('applicant.createdAt', 'DESC')
                .skip(skip)
                .take(limit);

            const [data, totalCount] = await query.getManyAndCount();

            // Security audit log
            await this.securityAuditRepository.save({
                actor_id: userId || null,
                action: 'read',
                resource: 'applicants',
                resource_id: null,
                purpose: 'list-view',
                decision: 'allow',
                request_ctx: { role: userRole || 'unknown', source: 'API' },
            });

            this.logger.log(`User ${userId} (role: ${userRole}) viewed identity list`);

            return {
                totalCount,
                limit,
                skip,
                data,
            };
        } catch (error) {
            this.logger.log('Error fetching identity list:', error);
            throw new Error('Failed to fetch identity list');
        }
    }

    async getAuditlogList(limit: number, skip: number) {
        const [data, totalCount] = await this.securityAuditRepository.findAndCount({
            order: { created_at: 'DESC' },
            take: limit,
            skip: skip,
        });

        return { data, totalCount, skip, limit };
    }


    async getFinanceExports(applicantIds: string[], purpose: boolean, userRole?: string, userId?: string,): Promise<any> {
        const startTime = Date.now();
        const exportContext = {
            applicantCount: applicantIds.length,
            purpose: 'finance-export-csv',
            detokenizationPerformed: purpose,
        };

        try {
            // Validate input
            if (!applicantIds || applicantIds.length === 0) {
                throw new BadRequestException('Applicant IDs are required');
            }

            // Fetch all records
            const getDatas = await this.applicantsRepository
                .createQueryBuilder('applicant')
                .leftJoin('applicant.identity', 'identity')
                .leftJoin('applicant.company', 'company')
                .leftJoin('applicant.project', 'project')
                .select([
                    'applicant.id AS id',
                    'applicant.name AS name',
                    'applicant.phone AS phone',
                    'applicant.email AS email',
                    'applicant.salaryBand AS salaryband',
                    'identity.nric_token AS nric_token',
                    'identity.bank_acc_token AS bank_acc_token',
                    'identity.bank_code_token AS bank_code_token',
                    'company.companyName AS companyname',
                    'project.title AS title',
                    'project.timeline AS timeline',
                    'project.totalCost AS totalcost',
                    'project.fundingAmount AS fundingamount',
                ])
                .where('applicant.id IN (:...ids)', { ids: applicantIds })
                .getRawMany();

            if (getDatas.length === 0) {
                throw new NotFoundException(`No applicants found for provided IDs`);
            }
            let rows: any = [];
            let detokenizationAttempts = 0;
            let detokenizationSuccesses = 0;
            if (purpose) {
                rows = await Promise.all(
                    getDatas.map(async (identity, index) => {
                        try {
                            detokenizationAttempts++;
                            const [nric, bankAcc, bankCode] = await Promise.all([
                                this.vaultService.detokenise('nric', identity.nric_token, true),
                                this.vaultService.detokenise('bank', identity.bank_acc_token, true),
                                this.vaultService.detokenise('bank_code', identity.bank_code_token, true),
                            ]);
                            detokenizationSuccesses++;

                            return {
                                SI: index + 1,
                                ID: identity.id,
                                NAME: identity.name,
                                PHONE: identity.phone,
                                EMAIL: identity.email,
                                'SALARY BAND': identity.salaryband,
                                'COMPANY NAME': identity.companyname,
                                TITLE: identity.title,
                                TIMELINE: identity.timeline,
                                ' TOTAL COST': identity.totalcost,
                                'FUNDING AMOUNT': identity.fundingamount,
                                NRIC: nric,
                                'BANK ACC': bankAcc,
                                'BANK CODE': bankCode,
                            };
                        } catch (error) {
                            this.logger.error(`Detokenization failed for applicant ${identity.applicant.id}:`, error);
                            throw error;
                        }
                    }),
                );
            } else {
                rows = await Promise.all(
                    getDatas.map((identity, index) => {
                        return {
                            SI: index + 1,
                            ID: identity.id,
                            NAME: identity.name,
                            PHONE: identity.phone,
                            EMAIL: identity.email,
                            'SALARY BAND': identity.salaryband,
                            'COMPANY NAME': identity.companyname,
                            TITLE: identity.title,
                            TIMELINE: identity.timeline,
                            'TOTAL COST': identity.totalcost,
                            'FUNDING AMOUNT': identity.fundingamount,
                            NRIC: identity.nric_token,
                            'BANK ACC': identity.bank_acc_token,
                            'BANK CODE': identity.bank_code_token,
                        }
                    }),
                );
            }
            // Log successful audit trail
            await this.securityAuditRepository.save({
                actor_id: userId || null,
                action: 'export',
                resource: 'applicant',
                resource_id: applicantIds.join(','),
                purpose: 'finance-export-csv',
                decision: 'allow',
                request_ctx: {
                    role: userRole || 'unknown',
                    source: 'API',
                    exportContext,
                },
                metadata: {
                    recordsExported: rows.length,
                    detokenizationAttempts,
                    detokenizationSuccesses,
                    executionTimeMs: Date.now() - startTime,
                },
            });

            this.logger.log(
                `User ${userId} (role: ${userRole}) exported financial data for ${applicantIds.length} applicants. ` +
                `Purpose: finance-export-csv. Detokenization: ${detokenizationSuccesses}/${detokenizationAttempts}`,
            );

            return rows;
        } catch (error) {
            // Log failed audit trail
            await this.securityAuditRepository.save({
                actor_id: userId || null,
                action: 'export',
                resource: 'applicant',
                resource_id: applicantIds.join(','),
                purpose: 'finance-export-csv',
                decision: 'deny',
                request_ctx: {
                    role: userRole || 'unknown',
                    source: 'API',
                    exportContext,
                },
                metadata: {
                    error: error.message,
                    errorCode: error.constructor.name,
                    executionTimeMs: Date.now() - startTime,
                },
            }).catch((auditError) => {
                this.logger.error('Failed to log security audit for failed export:', auditError);
            });

            this.logger.error(
                `User ${userId} (role: ${userRole}) attempted to export financial data but failed. Purpose: ${purpose}. Error: ${error.message}`,
                error.stack,
            );

            throw error;
        }
    }

    async parseExcel(buffer: Buffer): Promise<any[]> {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        return jsonData;
    }

    // Cron job to run every 30 minutes
    @Cron(CronExpression.EVERY_12_HOURS)
    @Cron(CronExpression.EVERY_5_HOURS)
    @Cron('0 22 * * 5')
    async rotateKeysAndRetokenize() {

        // Alternate Friday at 10 PM
        const tz = process.env.TIMEZONE || ''
        const currentWeek = moment().tz(tz).week(); // get current week number
        if (currentWeek % 2 !== 0) return

        const BATCH_SIZE = Number(process.env.BATCH_SIZE) || 0;
        // console.log(BATCH_SIZE, 'BATCH_SIZE');

        this.logger.log('Starting global key rotation...');

        // const oldKeys = await this.vaultService.getKeys();
        await this.vaultService.rotateKey();
        //  const newKeys = await this.vaultService.getKeys();

        let skip = 0;
        let batchNumber = 1;

        while (true) {
            // console.log(skip, BATCH_SIZE, 'BATCH_SIZE-----');

            const applicants = await this.personIdentityRepository.find({
                skip,
                take: BATCH_SIZE,
                order: { createdAt: 'ASC' },
            });

            // console.log(applicants, 'applicants---------------');


            if (!applicants.length) break;

            const batchLog = this.batchRepository.create({
                batchNumber,
                totalUsers: applicants.length,
                status: 'pending',
            });
            await this.batchRepository.save(batchLog);

            try {
                const decryptedData = await Promise.all(
                    applicants.map(async (applicant) => {
                        const [nric, bankAcc, bankCode] = await Promise.all([
                            this.vaultService.detokenise('nric', applicant.nric_token, false),
                            this.vaultService.detokenise('bank', applicant.bank_acc_token, false),
                            this.vaultService.detokenise('bank_code', applicant.bank_code_token, false),
                        ]);
                        return { id: applicant.id, nric, bankAcc, bankCode };
                    })
                );

                // console.log(decryptedData, 'decryptedData');


                // Retokenise using NEW keys
                for (const data of decryptedData) {
                    const [newNric, newBankAcc, newBankCode] = await Promise.all([
                        this.vaultService.tokenise('nric', data.nric),
                        this.vaultService.tokenise('bank', data.bankAcc),
                        this.vaultService.tokenise('bank_code', data.bankCode),
                    ]);

                    // console.log(newNric, 'newNric------------');


                    await this.personIdentityRepository.update(data.id, {
                        nric_token: newNric,
                        bank_acc_token: newBankAcc,
                        bank_code_token: newBankCode,
                    });
                }

                batchLog.status = 'success';
                await this.batchRepository.save(batchLog);
                this.logger.log(`Batch ${batchNumber} completed successfully.`);
            } catch (err) {
                batchLog.status = 'failed';
                batchLog.errorMessage = err.message;
                await this.batchRepository.save(batchLog);
                this.logger.error(`Batch ${batchNumber} failed: ${err.message}`);
            }

            skip += BATCH_SIZE;
            batchNumber++;
        }

        this.logger.log('Key rotation job complete.');
    }


    @Cron(CronExpression.EVERY_HOUR) // Retry failed batches every hour
    async retryFailedBatches() {
        this.logger.log('Checking for failed batches to retry...');

        const failedBatches = await this.batchRepository.find({ where: { status: 'failed' } });

        for (const batch of failedBatches) {
            this.logger.log(`Retrying failed batch ${batch.batchNumber}`);
            try {
                await this.rotateKeysAndRetokenizeBatch(batch.batchNumber);
                this.logger.log(`Batch ${batch.batchNumber} retried successfully`);
            } catch (err) {
                this.logger.error(`Batch ${batch.batchNumber} retry failed: ${err.message}`);
            }
        }

        this.logger.log('Failed batches retry job complete.');
    }

    /**
  * Rotate and retokenize a specific batch by batchNumber
  */
    private async rotateKeysAndRetokenizeBatch(batchNumber: number): Promise<void> {
        const batchLog = await this.batchRepository.findOneBy({ batchNumber });
        if (!batchLog) return;

        const skip = (batchNumber - 1) * Number(process.env.BATCH_SIZE || 100);
        const applicants = await this.personIdentityRepository.find({
            skip,
            take: batchLog.totalUsers,
            order: { createdAt: 'ASC' },
        });

        try {
            const decryptedData = await Promise.all(
                applicants.map(async (applicant) => {
                    const [nric, bankAcc, bankCode] = await Promise.all([
                        this.vaultService.detokenise('nric', applicant.nric_token, false),
                        this.vaultService.detokenise('bank', applicant.bank_acc_token, false),
                        this.vaultService.detokenise('bank_code', applicant.bank_code_token, false),
                    ]);
                    return { id: applicant.id, nric, bankAcc, bankCode };
                }),
            );

            for (const data of decryptedData) {
                const [newNric, newBankAcc, newBankCode] = await Promise.all([
                    this.vaultService.tokenise('nric', data.nric),
                    this.vaultService.tokenise('bank', data.bankAcc),
                    this.vaultService.tokenise('bank_code', data.bankCode),
                ]);

                await this.personIdentityRepository.update(data.id, {
                    nric_token: newNric,
                    bank_acc_token: newBankAcc,
                    bank_code_token: newBankCode,
                });
            }

            batchLog.status = 'success';
            await this.batchRepository.save(batchLog);
            this.logger.log(`Batch ${batchNumber} retried successfully.`);
        } catch (err) {
            batchLog.status = 'failed';
            batchLog.errorMessage = err.message;
            await this.batchRepository.save(batchLog);
            this.logger.error(`Retry for batch ${batchNumber} failed: ${err.message}`);
        }
    }

}