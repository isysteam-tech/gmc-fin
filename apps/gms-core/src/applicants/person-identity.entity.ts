import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { ApplicantProfile } from './applicants.entity';

@Entity('tbl_person_identity')
export class PersonIdentity {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    nric_token: string;

    @Column()
    bank_acc_token: string;

    @Column()
    bank_code_token: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Column({ name: 'applicant_id', type: 'uuid', nullable: true })
    applicantId: string;

    @OneToOne(() => ApplicantProfile, (applicant) => applicant.identity, {
        onDelete: 'CASCADE',
    })

    @JoinColumn({ name: 'applicant_id' })
    applicant: ApplicantProfile;

    @Column({ default: 'pending' })
    rotation_status: 'pending' | 'success' | 'failed';
}