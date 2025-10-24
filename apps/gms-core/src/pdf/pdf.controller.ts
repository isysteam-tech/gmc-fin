import {
    BadRequestException,
    Controller,
    Post,
    Query,
    Req,
    Res,
    UploadedFile,
    UploadedFiles,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PdfService } from './pdf.service';

@Controller('pdf')
export class PdfController {
    constructor(private readonly pdfService: PdfService) { }

    @Post('upload')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: memoryStorage(),
            limits: { fileSize: 20 * 1024 * 1024 }
        })
    )
    async uploadPdfWithCitations(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const citations = await this.pdfService.extractWithSentenceCitations(file.buffer);
        return { citations, totalSentences: citations.length };
    }

}