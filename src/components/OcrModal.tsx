import React, { useState, useRef } from 'react';
import { ScanText, Download, Copy, RefreshCw, StopCircle, CheckCircle2, Globe, FileText } from 'lucide-react';
import { LoadedPdfFile } from '../types';
import { OcrController, OcrProgress, OcrResult } from '../services/ocr/ocrService';
import { createPdfFromText } from '../services/pdf/pdfService';
import { downloadBlob, createPdfBlob } from '../utils/fileUtils';

interface OcrModalProps {
  file: LoadedPdfFile;
  onClose: () => void;
}

export const OcrModal: React.FC<OcrModalProps> = ({ file, onClose }) => {
  const [language, setLanguage] = useState<'ara' | 'eng' | 'ara+eng'>('ara+eng');
  const [selectedPageNum, setSelectedPageNum] = useState<number>(1);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<OcrProgress | null>(null);
  const [result, setResult] = useState<OcrResult | null>(null);
  const [editableText, setEditableText] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const ocrControllerRef = useRef<OcrController | null>(null);

  const handleStartOcr = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setResult(null);

    const controller = new OcrController();
    ocrControllerRef.current = controller;

    try {
      const res = await controller.recognizePdf(
        file.arrayBuffer,
        language,
        [selectedPageNum],
        (prog) => setProgressInfo(prog)
      );

      setResult(res);
      setEditableText(res.fullText);
      setSuccessMsg('اكتمل التعرف الضوئي على النصوص بنجاح!');
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ أثناء تشغيل التعرف الضوئي');
    } finally {
      setIsProcessing(false);
      setProgressInfo(null);
      ocrControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (ocrControllerRef.current) {
      ocrControllerRef.current.cancel();
      setIsProcessing(false);
      setProgressInfo(null);
      setErrorMsg('تم إيقاف عملية التعرف الضوئي بطلب من المستخدم.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(editableText);
    setSuccessMsg('تم نسخ النص إلى الحافظة.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([editableText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `نص_مستخرج_${file.name}.txt`);
  };

  const handleExportPdf = async () => {
    try {
      const pdfBytes = await createPdfFromText(editableText, `نص مستخرج عبر OCR - ${file.name}`);
      const blob = createPdfBlob(pdfBytes);
      downloadBlob(blob, `OCR_مستخرج_${file.name}`);
    } catch (err: any) {
      setErrorMsg('فشل تصدير PDF: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ScanText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">التعرف الضوئي على النصوص (OCR)</h3>
              <p className="text-xs text-slate-500">استخراج النصوص العربية والإنجليزية من الصفحات الممسوحة ضوئياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Offline & Model Note */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-2xl flex items-center gap-2 shrink-0">
          <Globe className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            تنبيه: يتطلب تشغيل OCR لأول مرة اتصالاً بالإنترنت لتنزيل أوزان نموذج اللغة محلياً إلى متصفحك، ولا يتم إرسال مستندك إطلاقاً.
          </span>
        </div>

        {/* Configuration Bar */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">لغة النصوص:</span>
            <select
              value={language}
              onChange={(e: any) => setLanguage(e.target.value)}
              disabled={isProcessing}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600 font-medium"
            >
              <option value="ara+eng">عربي + إنجليزي (موصى به)</option>
              <option value="ara">عربي فقط</option>
              <option value="eng">إنجليزي فقط</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700">الصفحة:</span>
            <select
              value={selectedPageNum}
              onChange={(e) => setSelectedPageNum(parseInt(e.target.value, 10))}
              disabled={isProcessing}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
            >
              {Array.from({ length: file.pageCount || 1 }).map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  صفحة {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status & Progress Indicator */}
        {isProcessing && progressInfo && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 shrink-0">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-900 mb-2">
              <span>{progressInfo.status}</span>
              <span>{progressInfo.progress}%</span>
            </div>
            <div className="w-full h-2 bg-emerald-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressInfo.progress}%` }}
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={handleStop}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50"
              >
                <StopCircle className="w-3.5 h-3.5" />
                <span>إيقاف العملية</span>
              </button>
            </div>
          </div>
        )}

        {/* Notifications */}
        {successMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Output Text Editor */}
        {result && (
          <div className="mt-4 flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center justify-between pb-2 shrink-0">
              <span className="text-xs font-bold text-slate-700">النص المستخرج عبر OCR:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ</span>
                </button>
                <button
                  onClick={handleDownloadTxt}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-2xs"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>تنزيل TXT</span>
                </button>
                <button
                  onClick={handleExportPdf}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تصدير كـ PDF جديد</span>
                </button>
              </div>
            </div>

            <textarea
              value={editableText}
              onChange={(e) => setEditableText(e.target.value)}
              className="flex-1 w-full text-xs p-3 rounded-2xl border border-slate-300 bg-slate-50 focus:outline-emerald-600 font-sans leading-relaxed resize-none"
            />
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            إغلاق
          </button>
          {!result && !isProcessing && (
            <button
              onClick={handleStartOcr}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all"
            >
              <ScanText className="w-4 h-4" />
              <span>بدء التعرف الضوئي للصفحة {selectedPageNum}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
