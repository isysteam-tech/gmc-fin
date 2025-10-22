import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { RateLimitGuard } from '../common/rate-limiter/rate-limit.guard';
import type { ApplicantData, SupportedModels } from './types';

@Controller('ai')
export class AiController {
    constructor(private readonly aiService: AiService) { }

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
        let applicant = {
            "name": "Tanman",
            "email": "emtt77@gmail.com",
            "phone": "9123456790",
            "salary": 10500,
            "nric": "S87654321D",
            "bank_acc": "9876543210",
            "bank_code": "7339",
            "designation": "Senior Software Engineer",
            "company": {
                "company_name": "Isys Ltd",
                "uen": "202245678Z",
                "reg_address": "45 Science Park Drive, Singapore",
                "business_sector": "Information Technology",
                "employee_count": 50
            },
            "project": {
                "title": "Cloud Data Integration System",
                "desc": "An enterprise platform enabling seamless integration and synchronization of multi-cloud data sources.",
                "timeline": "Aug 2025 - Feb 2026",
                "total_cost": 690000,
                "funding_amount": 410000
            }
        }
        return {
            answer: await this.aiService.askApplicant(applicant, question, model),
        };
    }
}
