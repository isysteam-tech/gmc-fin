import { Controller, Post, UploadedFile, UseInterceptors, Body, InternalServerErrorException, Get, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { UploadDocumentDto } from './upload-document.dto';
import { MinioService } from 'src/storage/minio/minio.service';
import express from 'express';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService, private readonly minioService: MinioService) {}

  @Get('download/:docId/:fileName')
  async downloadFile(
    @Param('docId') docId: string,
    @Param('fileName') fileName: string,
    @Res() res: express.Response,
  ) {
    try {
      
      const filePath = `${docId}/${fileName}`;
      const fileStream = await this.minioService.downloadFile(filePath);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

      fileStream.pipe(res);
    } catch (err) {
      console.error(err);
      throw new InternalServerErrorException('Failed to download file');
    }
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: UploadDocumentDto
  ) {
    return await this.documentsService.handleDocumentUpload(file, body.applicantId);
  }
}
