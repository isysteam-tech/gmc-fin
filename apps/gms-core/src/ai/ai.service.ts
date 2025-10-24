import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { ApplicantData, SupportedModels } from './types';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import pdfParse from 'pdf-parse';

@Injectable()
export class AiService {
  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private openai = new OpenAI({ apiKey: this.OPENAI_API_KEY });

  async askApplicant(
    applicantData: any,
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


    // const prompt = `
    //   You are a helpful assistant. Use only the data provided to answer the user's question.
    //   Each part of your answer must include the source citation in the following format: (Page X, Citation: DOC_INDEX-Y-SENTENCE-Z)
    //   If the information is missing, respond exactly with: "I don't know."

    //   Applicant Data:
    //   ${JSON.stringify(applicantData, null, 2)}

    //   User Question: ${question}

    //   Answer:
    // `;


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

  // **************************************************
  async uploadFile(file: Express.Multer.File) {
    try {
      const form = new FormData();
      form.append('purpose', 'fine-tune');
      form.append('file', file.buffer, { filename: file.originalname });

      const response = await axios.post('https://api.openai.com/v1/files', form, {
        headers: {
          Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          ...form.getHeaders(),
        },
      });

      return response.data;
    } catch (error: any) {
      console.error('File upload failed:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to upload file to OpenAI');
    }
  }

  // Extract text from PDF
  async extractTextFromBuffer(buffer: Buffer): Promise<string> {
    try {
      const pdfParse = await import('pdf-parse');
      const PDFParse = pdfParse.PDFParse;
      const uint8Array = new Uint8Array(buffer);
      const instance = new PDFParse(uint8Array);
      const result = await instance.getText();
      const text = (result as any).text || result.toString() || 'No text extracted';
      return text;
    } catch (err) {
      console.error('PDF extraction failed:', err.message);
      throw new InternalServerErrorException('Failed to extract text from PDF');
    }
  }

  // Create embedding (vector) from text
  async createEmbedding(text: string) {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/embeddings',
        {
          input: text,
          model: 'text-embedding-3-large',
        },
        {
          headers: {
            Authorization: `Bearer ${this.OPENAI_API_KEY}`,
          },
        }
      );
      return response.data.data[0].embedding;
    } catch (error: any) {
      console.error('Embedding creation failed:', error.response?.data || error.message);
      throw new InternalServerErrorException('Failed to create embedding');
    }
  }
  //******************************************************************
}
