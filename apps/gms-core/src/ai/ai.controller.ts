import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { AiService } from './ai.service';
import { RateLimitGuard } from '../common/rate-limiter/rate-limit.guard';
import type { ApplicantData, SupportedModels } from './types';
import { ApplicantsService } from '../applicants/applicants.service'

@Controller('ai')
export class AiController {
    constructor(
        private readonly aiService: AiService,
        private readonly applicantService: ApplicantsService
    ) { }

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
        // let applicant = {
        //     "name": "Tanman",
        //     "email": "emtt77@gmail.com",
        //     "phone": "9123456790",
        //     "salary": 10500,
        //     "nric": "S87654321D",
        //     "bank_acc": "9876543210",
        //     "bank_code": "7339",
        //     "designation": "Senior Software Engineer",
        //     "company": {
        //         "company_name": "Isys Ltd",
        //         "uen": "202245678Z",
        //         "reg_address": "45 Science Park Drive, Singapore",
        //         "business_sector": "Information Technology",
        //         "employee_count": 50
        //     },
        //     "project": {
        //         "title": "Cloud Data Integration System",
        //         "desc": "An enterprise platform enabling seamless integration and synchronization of multi-cloud data sources.",
        //         "timeline": "Aug 2025 - Feb 2026",
        //         "total_cost": 690000,
        //         "funding_amount": 410000
        //     }
        // }
            const uuidRegex = /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/i;
            const qnstr = question.match(uuidRegex);
            if(!qnstr) return { answer: "No Applicant Id found in the question" };
            console.log(qnstr[0], 'match1'); 

            
            // const match = question.match(/applicantid\s+([a-f0-9\-]{36})/i);
            let applicantData: ApplicantData | null = null;

            if (qnstr) {
                const applicantId = qnstr[0];

                // Step 2: Fetch applicant data from your service or repository
                applicantData = await this.applicantService.getApplicantByIdForAi(applicantId);

                if (!applicantData) {
                    return { answer: "applicant not found" }
                }
            } else {
                    return { answer: "No Applicant Id found in the question" }

            }

            console.log(applicantData, 'applicantData');
            

            return {
                answer: await this.aiService.askApplicant(applicantData, question, model),
            };
    }
}
