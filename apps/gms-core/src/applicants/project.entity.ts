import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, OneToOne, } from 'typeorm';
import { ApplicantProfile } from './applicants.entity';

@Entity('tbl_project')
export class Project {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    desc: string;

    @Column({ nullable: true })
    timeline: string;

    @Column({ name: 'total_cost', type: 'decimal', precision: 15, scale: 2 })
    totalCost: number;

    @Column({ name: 'funding_amount', type: 'decimal', precision: 15, scale: 2 })
    fundingAmount: number;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @OneToOne(() => ApplicantProfile, (applicant) => applicant.identity, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'applicant_id' })
    applicant: ApplicantProfile;
}
