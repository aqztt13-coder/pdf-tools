import { createWorker } from 'tesseract.js';
import { getPdfJsDocument } from '../pdf/pdfViewerService';

export interface OcrProgress {
  status: string;
  progress: number;
  currentPage: number;
  totalPages: number;
}

export interface OcrResult {
  fullText: string;
  pages: { pageNumber: number; text: string; confidence: number }[];
}

export class OcrController {
  private isCancelled: boolean = false;
  private currentWorker: any = null;

  public cancel() {
    this.isCancelled = true;
    if (this.currentWorker) {
      try {
        this.currentWorker.terminate();
      } catch (err) {
        console.warn('Error terminating OCR worker:', err);
      }
    }
  }

  /**
   * Run OCR on specified PDF pages using Tesseract.js with Arabic/English models
   */
  public async recognizePdf(
    pdfBuffer: ArrayBuffer,
    languages: 'ara' | 'eng' | 'ara+eng' = 'ara+eng',
    pageNumbers: number[] = [],
    onProgress?: (progress: OcrProgress) => void
  ): Promise<OcrResult> {
    this.isCancelled = false;
    const pdfJsDoc = await getPdfJsDocument(pdfBuffer);
    const totalDocPages = pdfJsDoc.numPages;

    const targetPages = pageNumbers.length > 0
      ? pageNumbers.filter(p => p >= 1 && p <= totalDocPages)
      : Array.from({ length: totalDocPages }, (_, i) => i + 1);

    if (targetPages.length === 0) {
      throw new Error('لم يتم تحديد صفحات صالحة للتعرف الضوئي');
    }

    const worker = await createWorker(languages, 1, {
      logger: m => {
        if (onProgress && m.status === 'recognizing text') {
          onProgress({
            status: 'جارٍ استخراج النصوص من الصفحة...',
            progress: Math.round((m.progress || 0) * 100),
            currentPage: 1,
            totalPages: targetPages.length,
          });
        }
      },
    });

    this.currentWorker = worker;

    const pageResults: { pageNumber: number; text: string; confidence: number }[] = [];

    try {
      for (let idx = 0; idx < targetPages.length; idx++) {
        if (this.isCancelled) {
          throw new Error('تم إلغاء عملية التعرف الضوئي من قبل المستخدم');
        }

        const pageNum = targetPages[idx];
        if (onProgress) {
          onProgress({
            status: `جارٍ تحويل الصفحة ${pageNum} إلى صورة عالية الدقة...`,
            progress: 10,
            currentPage: idx + 1,
            totalPages: targetPages.length,
          });
        }

        // Render page to canvas at 2.5x scale for optimal OCR accuracy
        const page = await pdfJsDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: 2.2 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('فشل إنشاء سياق المعالجة البصرية');

        await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

        if (this.isCancelled) {
          throw new Error('تم إلغاء عملية التعرف الضوئي من قبل المستخدم');
        }

        if (onProgress) {
          onProgress({
            status: `جارٍ التعرف الضوئي على نصوص الصفحة ${pageNum} (${languages === 'ara' ? 'عربي' : languages === 'eng' ? 'إنجليزي' : 'عربي وإنجليزي'})...`,
            progress: 40,
            currentPage: idx + 1,
            totalPages: targetPages.length,
          });
        }

        const res = await worker.recognize(canvas);
        pageResults.push({
          pageNumber: pageNum,
          text: res.data.text.trim(),
          confidence: Math.round(res.data.confidence),
        });
      }
    } finally {
      await worker.terminate();
      this.currentWorker = null;
    }

    const fullText = pageResults.map(p => `--- صفحة ${p.pageNumber} ---\n${p.text}`).join('\n\n');

    return {
      fullText,
      pages: pageResults,
    };
  }
}
