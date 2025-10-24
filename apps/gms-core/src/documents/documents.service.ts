import { Injectable } from '@nestjs/common';
import { MinioService } from '../storage/minio/minio.service';
import { randomUUID } from 'crypto';
import { DataSource } from 'typeorm';
import { DocumentExtraction } from './document-extraction.entity';
const pdfParse = require('pdf-parse');

@Injectable()
export class DocumentsService {
  constructor(
    private readonly minioService: MinioService,
    private readonly dataSource: DataSource,
  ) {}

  async handleDocumentUpload(file: Express.Multer.File, applicantId: string) {
    const docId = randomUUID();
    const bucket = 'gms-docs';
    console.log(file, 'file');
    
    const filePath = `${docId}/${file.originalname}`;

    // Step 1: Store file in MinIO
    const fileUrl = await this.minioService.uploadFile(bucket, filePath, file.buffer, file.mimetype);

    // Step 2: Extract text from PDF
    // const pdfData = await pdfParse(file.buffer);
    const pdfParse = await import('pdf-parse');
    const PDFParse = pdfParse.PDFParse;
    const uint8Array = new Uint8Array(file.buffer);
    const instance = new PDFParse(uint8Array);
    const result = await instance.getText();
    const text = (result as any).text || result.toString() || 'No text extracted';
    const extractedText = text;

    // Step 3: Convert extracted info → JSON (simple version)
    const extractedJson = { raw_text: extractedText, length: extractedText.length };

    // Step 4: Save to Postgres (with versioning)
    const repo = this.dataSource.getRepository(DocumentExtraction);
    await repo.save({
      applicant_id: applicantId,
      doc_id: docId,
      version: 1,
      extracted_data: extractedJson,
      file_path: fileUrl,
    });

    return { docId, fileUrl, message: 'Document uploaded and extracted successfully' };
  }
}
