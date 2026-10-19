import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, Sparkles, AlertCircle } from 'lucide-react';
import { readFileAsArrayBuffer } from '../utils/fileUtils';
import { createSamplePdf } from '../services/pdf/pdfService';
import { LoadedPdfFile } from '../types';

interface FileDropzoneProps {
  onFileLoaded: (file: LoadedPdfFile) => void;
  onMultipleFilesLoaded?: (files: LoadedPdfFile[]) => void;
  allowMultiple?: boolean;
  title?: string;
  subtitle?: string;
}

export const FileDropzone: React.FC<FileDropzoneProps> = ({
  onFileLoaded,
  onMultipleFilesLoaded,
  allowMultiple = false,
  title = 'اسحب وأفلت ملف PDF هنا',
  subtitle = 'أو انقر لاختيار ملف من جهازك (تتم المعالجة محلياً في متصفحك بنسبة 100%)',
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const processFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    try {
      const loadedFiles: LoadedPdfFile[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
          setErrorMsg('يرجى اختيار ملفات ذات صيغة PDF فقط');
          continue;
        }

        if (file.size === 0) {
          setErrorMsg(`الملف "${file.name}" فارغ بحجم 0 بايت.`);
          continue;
        }

        const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024; // 150 MB safety threshold
        if (file.size > MAX_FILE_SIZE_BYTES) {
          setErrorMsg(`الملف "${file.name}" يتجاوز الحد الأقصى للمعالجة المحلية داخل المتصفح (150 ميغابايت) لتفادي استهلاك ذاكرة الجهاز.`);
          continue;
        }

        const buffer = await readFileAsArrayBuffer(file);

        // Validate PDF magic number
        const header = new Uint8Array(buffer.slice(0, 5));
        const headerStr = String.fromCharCode(...header);
        if (!headerStr.startsWith('%PDF-')) {
          setErrorMsg(`الملف "${file.name}" ليس ملف PDF حقيقيًا صالحًا (رأس الملف تالف أو غير متطابق).`);
          continue;
        }

        let actualPageCount = 1;
        try {
          const { PDFDocument } = await import('pdf-lib');
          const doc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
          actualPageCount = doc.getPageCount();
        } catch {
          // If encrypted or partially corrupted, default to 1 and let viewer handle
        }

        loadedFiles.push({
          id: Math.random().toString(36).substring(2, 9),
          name: file.name,
          size: file.size,
          arrayBuffer: buffer,
          pageCount: actualPageCount,
          uploadedAt: new Date(),
        });
      }

      if (loadedFiles.length === 0) return;

      if (allowMultiple && onMultipleFilesLoaded && loadedFiles.length > 1) {
        onMultipleFilesLoaded(loadedFiles);
      } else {
        onFileLoaded(loadedFiles[0]);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء قراءة الملف');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    await processFiles(e.dataTransfer.files);
  };

  const handleSampleClick = async () => {
    setIsLoadingSample(true);
    setErrorMsg(null);
    try {
      const sampleBytes = await createSamplePdf();
      onFileLoaded({
        id: 'sample-' + Date.now(),
        name: 'مستند_تجريبي_PDF_عربي.pdf',
        size: sampleBytes.byteLength,
        arrayBuffer: sampleBytes.buffer as ArrayBuffer,
        pageCount: 3,
        uploadedAt: new Date(),
      });
    } catch (err: any) {
      setErrorMsg('تعذر إنشاء العينة التجريبية: ' + err.message);
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 cursor-pointer ${
          isDragging
            ? 'border-emerald-600 bg-emerald-50/80 scale-[1.01]'
            : 'border-slate-300 hover:border-emerald-500 bg-white hover:bg-slate-50/50 shadow-sm'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple={allowMultiple}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4 ring-8 ring-emerald-50/60 shadow-sm">
            <UploadCloud className="w-8 h-8 stroke-[2]" />
          </div>

          <h3 className="text-xl font-bold text-slate-900 mb-2">{title}</h3>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">{subtitle}</p>

          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm shadow-md shadow-emerald-900/10 hover:shadow-lg transition-all flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>اختر ملفاً من جهازك</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Quick sample PDF button for zero-friction testing */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
        <span>ليس لديك ملف الآن؟</span>
        <button
          type="button"
          data-testid="open-sample-pdf"
          onClick={handleSampleClick}
          disabled={isLoadingSample}
          className="inline-flex items-center gap-1.5 font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 decoration-emerald-400 hover:decoration-emerald-700 disabled:opacity-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{isLoadingSample ? 'جارٍ إنشاء المستند التجريبي...' : 'افتح مستنداً تجريبياً جاهزاً (3 صفحات)'}</span>
        </button>
      </div>
    </div>
  );
};
