import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class PdfService {
    async extractText(buffer: Buffer): Promise<string> {
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
}