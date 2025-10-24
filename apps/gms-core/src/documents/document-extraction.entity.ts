import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('tbl_doc_extractions')
export class DocumentExtraction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  applicant_id: string;

  @Column()
  doc_id: string;

  @Column({ type: 'jsonb' })
  extracted_data: any;

  @Column()
  version: number;

  @Column()
  file_path: string;

  @CreateDateColumn()
  created_at: Date;
}
