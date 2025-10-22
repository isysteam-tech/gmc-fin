import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('tbl_key_rotation_batches')
export class KeyRotationBatch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  batchNumber: number;

  @Column()
  totalUsers: number;

  @Column({ default: 'pending' }) // pending | success | failed
  status: string;

  @Column({ type: 'text', nullable: true })
  errorMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
