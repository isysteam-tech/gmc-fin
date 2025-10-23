import { Controller, Post, Body, UseGuards, Get, UseInterceptors, UploadedFiles, Req, Res, UploadedFile, BadRequestException } from '@nestjs/common';
import { AiService } from './ai.service';
import { RateLimitGuard } from '../common/rate-limiter/rate-limit.guard';
import type { ApplicantData, SupportedModels } from './types';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { LocalStorageService } from './local-storage.service';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService, private readonly localStorage: LocalStorageService) { }

    @Get('ping')
    ping() {
        return { message: 'AI module is active' };
    }

    @Post('ask')
    @UseGuards(RateLimitGuard)
    async askQuestion(
        @Body('question') question: string,
        @Body('model') model: SupportedModels = "chatgpt",
    ) {
        // let ls = localStorage.getItem('text')
        console.log(this.localStorage.getItem('text'), 'this.localStorage.getItem(----------)');
        
        let applicant = this.localStorage.getItem('text')
        console.log(applicant, 'applicant');
        
        return {
            answer: await this.aiService.askApplicant(applicant, question, model),
        };
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: Express.Multer.File) {
        if (!file || !file.mimetype.includes('pdf')) {
            throw new BadRequestException('Only PDF files are allowed');
        }

        try {
            // Extract text locally
            const text = await this.aiService.extractTextFromBuffer(file.buffer);

            if (!text) {
                throw new BadRequestException('Failed to extract text from PDF');
            }

            console.log(text, 'text');
            

            // Create vector (embedding)
            const vector = await this.aiService.createEmbedding(text);

            return {
                fileName: file.originalname,
                textLength: text.length,
                vectorLength: vector.length,
                vector,
            };
        } catch (error) {
            throw new BadRequestException(`Processing failed: ${error.message || error}`);
        }
    }
}
