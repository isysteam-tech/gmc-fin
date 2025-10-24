import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LocalStorageService } from 'src/ai/local-storage.service';

export interface CitationData {
    pageNumber: number;
    sentenceIndex: number;
    text: string;
    citation: string;
}
@Injectable()
export class PdfService {
    constructor(private readonly localStorage: LocalStorageService) { }

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

    async extractWithSentenceCitations(buffer: Buffer): Promise<CitationData[]> {
        try {
            const pdfParse = await import('pdf-parse');
            const PDFParse = pdfParse.PDFParse;
            const uint8Array = new Uint8Array(buffer);
            const instance = new PDFParse(uint8Array);
            const result = await instance.getText();
            const text = (result as any).text || result.toString() || 'No text extracted';

            // Split text into pages
            const pages = result.pages || [text];

            // Extract sentences with citations
            const citationData: CitationData[] = pages.flatMap((pageData: any, pageIndex: number) => {
                // Handle both string and PageTextResult object
                const pageText = typeof pageData === 'string' ? pageData : pageData.text || pageData.toString();

                // Split text into sentences
                const sentences = pageText.match(/[^.!?]+[.!?]+/g) || [pageText];

                return sentences.map((sentence: string, sentenceIndex: number) => ({
                    pageNumber: pageIndex + 1,
                    sentenceIndex: sentenceIndex,
                    text: sentence.trim(),
                    citation: `DOC_INDEX-${pageIndex + 1}-SENTENCE-${sentenceIndex}`
                }));
            });

            // Store in localStorage
            this.localStorage.setItem('citationData', JSON.stringify(citationData));

            return citationData;
        } catch (err) {
            console.error('Citation extraction failed:', err.message);
            throw new InternalServerErrorException('Failed to extract citations');
        }
    }

}