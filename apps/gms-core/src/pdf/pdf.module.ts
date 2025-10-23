import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
// import { OpenAIService } from '../openai/openai.service';

@Module({
    controllers: [PdfController],
    providers: [
        PdfService,
        // OpenAIService
    ],
})
export class PdfModule { }
