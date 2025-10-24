import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { MinioModule } from '../storage/minio/minio.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentExtraction } from './document-extraction.entity';
import { MinioService } from 'src/storage/minio/minio.service';

@Module({
  imports: [
    MinioModule,
    TypeOrmModule.forFeature([DocumentExtraction]),
  ],
  controllers: [DocumentsController],
  providers: [DocumentsService, MinioService],
  exports: [DocumentsService],
})
export class DocumentsModule {}
