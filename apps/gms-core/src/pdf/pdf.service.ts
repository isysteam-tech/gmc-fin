import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { LocalStorageService } from 'src/ai/local-storage.service';
import Tesseract from 'tesseract.js';

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
    // Main function to handle PDF extraction
    async extractPdf(fileBuffer: Buffer): Promise<any> {
        let text = '';

        try {
            // First try text-based extraction
            const pdfParse = await import('pdf-parse');
            const PDFParse = pdfParse.PDFParse;
            const uint8Array = new Uint8Array(fileBuffer);
            const instance = new PDFParse(uint8Array);
            const result = await instance.getText();
            text = (result as any).text || result.toString() || 'No text extracted';

            // If text is empty, fall back to OCR
            if (!text || text.trim().length < 10) {
                const { data: ocrData } = await Tesseract.recognize(fileBuffer, 'eng');
                text = ocrData.text;
            }
        } catch (err) {
            console.error('Error extracting PDF text:', err);
            throw new Error('PDF extraction failed');
        }

        return this.mapToSchema(text);
    }

    // Map extracted text to structured JSON
    private mapToSchema(text: string) {
        const applicant = {
            name: text.match(/Name:\s*(.*)/i)?.[1] || null,
            email: text.match(/Email:\s*(.*)/i)?.[1] || null,
            phone: text.match(/Phone:\s*(.*)/i)?.[1] || null,
            salary: text.match(/Salary:\s*(.*)/i)?.[1] || null,
            nric: text.match(/NRIC\/FIN:\s*(.*)/i)?.[1] || null,
            designation: text.match(/Designation:\s*(.*)/i)?.[1] || null,
            bank: {
                accountNo: text.match(/Bank Account:\s*(.*)/i)?.[1] || null,
                branchCode: text.match(/Bank Branch Code:\s*(.*)/i)?.[1] || null,
            },
        };

        const company = {
            name: text.match(/Company Name:\s*(.*)/i)?.[1] || null,
            uen: text.match(/UEN:\s*(.*)/i)?.[1] || null,
            regAddress: text.match(/Registered Address:\s*(.*)/i)?.[1] || null,
            businessSector: text.match(/Business Sector:\s*(.*)/i)?.[1] || null,
            employeeCount: text.match(/Employee Count:\s*(.*)/i)?.[1] || null,
        };

        const project = {
            title: text.match(/Project Title:\s*(.*)/i)?.[1] || null,
            description: text.match(/Project Description:\s*([\s\S]*?)\nProject Timeline:/i)?.[1]?.trim() || null,
            timeline: text.match(/Project Timeline:\s*(.*)/i)?.[1] || null,
            totalCost: text.match(/Total Project Cost:\s*(.*)/i)?.[1] || null,
            fundingAmount: text.match(/Requested Funding Amount:\s*(.*)/i)?.[1] || null,
        };

        return { applicant, company, project };
    }

}