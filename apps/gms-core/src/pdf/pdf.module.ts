import { Module } from '@nestjs/common';
import { PdfController } from './pdf.controller';
import { PdfService } from './pdf.service';
import { AiModule } from 'src/ai/ai.module';
// import { OpenAIService } from '../openai/openai.service';

@Module({
    imports: [AiModule],
    controllers: [PdfController],
    providers: [
        PdfService
        // OpenAIService
    ],
})
export class PdfModule { }
