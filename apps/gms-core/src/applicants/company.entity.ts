import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne, } from 'typeorm';
import { ApplicantProfile } from './applicants.entity';

@Entity('tbl_company')
export class Company {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ name: 'company_name' })
    companyName: string;

    @Column()
    uen: string;

    @Column({ name: 'reg_address' })
    regAddress: string;

    @Column({ name: 'business_sector' })
    businessSector: string;

    @Column({ name: 'employee_count', type: 'int', nullable: true })
    employeeCount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToOne(() => ApplicantProfile, (applicant) => applicant.identity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'applicant_id' })
    applicant: ApplicantProfile;
}
