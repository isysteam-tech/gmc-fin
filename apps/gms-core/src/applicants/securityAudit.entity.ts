import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tbl_security_audit')
export class SecurityAudit {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'uuid', nullable: true })
    actor_id?: string | null;

    @Column()
    action: string;

    @Column()
    resource: string;

    @Column({ type: 'uuid', nullable: true })
    resource_id?: string | null;

    @Column()
    purpose: string;

    @Column()
    decision: string;

    @Column({ type: 'jsonb', nullable: true })
    request_ctx?: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;
}