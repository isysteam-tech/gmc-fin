import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApplicantProfile, SalaryBand } from './applicants.entity';
import { PersonIdentity } from './person-identity.entity';
// import { SecurityAudit } from './securityAudit.entity';
import { VaultService } from '../vault/vault.service';
import { Company } from './company.entity';
import { Project } from './project.entity';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ApplicantsService {
    private readonly logger = new Logger(ApplicantsService.name);
    private readonly TRANSIT_KEY_NAME = process.env.TRANSIT_KEY_NAME || 'applicant-data-key';

    constructor(
        @InjectRepository(ApplicantProfile)
        private applicantsRepository: Repository<ApplicantProfile>,
        @InjectRepository(PersonIdentity)
        private personIdentityRepository: Repository<PersonIdentity>,
        // @InjectRepository(SecurityAudit)
        // private securityAuditRepository: Repository<SecurityAudit>,
        private readonly vaultService: VaultService,
        @InjectRepository(Company)
        private companyRepository: Repository<Company>,
        @InjectRepository(Project)
        private projectRepository: Repository<Project>,
    ) {
        // this.initializeTransitKey();
    }

    // private async initializeTransitKey() {
    //     try {
    //         await this.vaultService.createTransitKey(this.TRANSIT_KEY_NAME);
    //         this.logger.log('Transit key initialized successfully');
    //     } catch (err) {
    //         this.logger.error('Failed to initialize transit key:', err);
    //     }
    // }

    private mapSalaryToBand(salary: number): SalaryBand {
        if (salary < 3000) return SalaryBand.A;
        if (salary < 6000) return SalaryBand.B;
        if (salary < 10000) return SalaryBand.C;
        return SalaryBand.D;
    }



    private maskNric(nric: string): string {
        if (!nric) return '';
        return nric.charAt(0) + '*'.repeat(nric.length - 2) + nric.charAt(nric.length - 1);
    }

    async createApplicant(data: any, userId?: string) {
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
            // await this.securityAuditRepository.save({
            //     actor_id: userId || 'system',
            //     action: 'tokenise',
            //     resource: 'applicant',
            //     resource_id: savedApplicant.id,
            //     purpose: 'create-applicant',
            //     decision: 'allow',
            //     request_ctx: { source: 'API', role: userId ? 'authenticated' : 'system' },
            // });

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
        });

        if (!applicant) {
            throw new NotFoundException(`Applicant with ID ${applicantId} not found`);
        }

        // Security audit log
        // await this.securityAuditRepository.save({
        //     actor_id: userId || 'anonymous',
        //     action: 'read',
        //     resource: 'applicant',
        //     resource_id: applicantId,
        //     purpose: 'view-profile',
        //     decision: 'allow',
        //     request_ctx: { role: userRole || 'unknown', source: 'API' },
        // });

        this.logger.log(`User ${userId} (role: ${userRole}) viewed applicant ${applicantId}`);

        // Return basic info only (no sensitive data)
        return {
            id: applicant.id,
            name: applicant.name,
            email: applicant.email,
            phone_masked: await this.vaultService.makeMask('phone', applicant.phone),
            salary_band: applicant.salaryBand,
        };
    }

    // Cron job to run every 30 minutes
    @Cron(CronExpression.EVERY_5_MINUTES)
    async rotateKeysAndRetokenize() {
        this.logger.log('Fetching current keys...');

        this.logger.log('Fetching all applicants...');
        const applicants = await this.personIdentityRepository.find();

        console.log(applicants, 'applicants');

        for (const applicant of applicants) {
        try {

            // console.log(applicant.nric_token, 'before...........');
            
            // Detokenize current values
            const [nric_token, bank_acc_token, bank_code_token] = await Promise.all([
                this.vaultService.detokenise('nric', applicant.nric_token),
                this.vaultService.detokenise('bank', applicant.bank_acc_token),
                this.vaultService.detokenise('bank_code', applicant.bank_code_token),
            ]);

            // console.log(nric_token, 'detoken.........');
            

            // Rotate keys in Vault
            this.logger.log('Rotating keys...');
            await this.vaultService.rotateKey()

            // 6️⃣ Re-tokenize data with new keys
            const [new_nric_token, new_bank_acc_token, new_bank_code_token] = await Promise.all([
                this.vaultService.tokenise('nric', nric_token),
                this.vaultService.tokenise('bank', bank_acc_token),
                this.vaultService.tokenise('bank_code', bank_code_token),
            ]);

            // console.log(new_nric_token, 'after....................');
            

            // Update DB with new tokenized values
            await this.personIdentityRepository.update(applicant.id, {
                nric_token: new_nric_token,
                bank_acc_token: new_bank_acc_token,
                bank_code_token: new_bank_code_token,
            });

            this.logger.log(`Updated tokens for applicant ID ${applicant.id}`);
        } catch (err) {
            this.logger.error(`Failed to rotate tokens for applicant ID ${applicant.id}`, err);
        }
        }

        this.logger.log('Key rotation and re-tokenization complete!');
    }
}