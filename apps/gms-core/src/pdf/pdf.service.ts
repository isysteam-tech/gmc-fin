import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LocalStorageService } from 'src/ai/local-storage.service';

@Injectable()
export class PdfService {
    constructor(private readonly localStorage: LocalStorageService) {}

    async extractText(buffer: Buffer): Promise<string> {
        try {
            const pdfParse = await import('pdf-parse');
            const PDFParse = pdfParse.PDFParse;
            const uint8Array = new Uint8Array(buffer);
            const instance = new PDFParse(uint8Array);
            const result = await instance.getText();
            const text = (result as any).text || result.toString() || 'No text extracted';
            this.localStorage.setItem('text', text);            
            return text;
        } catch (err) {
            console.error('PDF extraction failed:', err.message);
            throw new InternalServerErrorException('Failed to extract text from PDF');
        }
    }
}