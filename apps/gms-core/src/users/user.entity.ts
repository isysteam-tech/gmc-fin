import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tbl_users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column({ unique: true })
    password: string;

    @Column()
    role: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;
}
