import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { ApplicantData, SupportedModels } from './types';

console.log(process.env.OPENAI_API_KEY, 'process.env.OPENAI_API_KEY');


@Injectable()
export class AiService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async askApplicant(
    applicantData: ApplicantData,
    question: string,
    model: SupportedModels = "chatgpt"
  ): Promise<string> {
    switch (model) {
      case "chatgpt":
        return this.askChatGpt(applicantData, question);
      case "gemini":
        // Placeholder for Gemini AI integration later
        return "Gemini integration not implemented yet.";
      default:
        return "Unsupported model";
    }
  }

  private async askChatGpt(applicantData: ApplicantData, question: string) {
    const prompt = `
        You are a helpful assistant. Use only the data provided to answer the user's question.
        If the information is missing, respond exactly with: "I don't know."

        Applicant Data:
        ${JSON.stringify(applicantData, null, 2)}

        User Question: ${question}

        Answer:
        `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You answer only based on provided data.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 512,
      });

      console.log(response, 'response');
      

      return response.choices?.[0]?.message?.content?.trim() || "I don't know.";
    } catch (error) {
      console.error('ChatGPT AI Error:', error);
      return "I don't know.";
    }
  }
}
