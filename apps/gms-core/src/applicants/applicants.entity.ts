import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne } from 'typeorm';
import { PersonIdentity } from './person-identity.entity';
import { Company } from './company.entity';
import { Project } from './project.entity';

export enum SalaryBand {
    A = 'A',
    B = 'B',
    C = 'C',
    D = 'D',
}

@Entity('tbl_applicant_profile')
export class ApplicantProfile {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    name: string;

    @Column()
    email: string;

    @Column({ nullable: true })
    phone: string;

    @Column({
        name: 'salary_band',
        type: 'enum',
        enum: SalaryBand,
    })
    salaryBand: SalaryBand;

    @Column({ nullable: true })
    designation: string

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToOne(() => PersonIdentity, (identity) => identity.applicant)
    identity: PersonIdentity;

    @OneToOne(() => Company, (company) => company.applicant)
    company: Company

    @OneToOne(() => Project, (project) => project.applicant)
    project: Project
}