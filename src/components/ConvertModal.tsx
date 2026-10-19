import React, { useState } from 'react';
import {
  FileImage,
  Image,
  FileText,
  PlusSquare,
  Download,
  Copy,
  RefreshCw,
  CheckCircle2,
  Trash2,
  Plus,
  Archive
} from 'lucide-react';
import JSZip from 'jszip';
import { LoadedPdfFile } from '../types';
import { imagesToPdf, createPdfFromText } from '../services/pdf/pdfService';
import { convertPdfToImages, extractAllTextFromPdf } from '../services/pdf/pdfViewerService';
import { downloadBlob, createPdfBlob, formatBytes } from '../utils/fileUtils';

interface ConvertModalProps {
  initialMode: 'img_to_pdf' | 'pdf_to_img' | 'extract_text' | 'text_to_pdf';
  file?: LoadedPdfFile | null;
  onClose: () => void;
  onFileLoaded?: (file: LoadedPdfFile) => void;
}

export const ConvertModal: React.FC<ConvertModalProps> = ({
  initialMode,
  file,
  onClose,
  onFileLoaded,
}) => {
  const [activeTab, setActiveTab] = useState<'img_to_pdf' | 'pdf_to_img' | 'extract_text' | 'text_to_pdf'>(initialMode);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- 1. Images to PDF state ---
  const [uploadedImages, setUploadedImages] = useState<{ id: string; name: string; dataUrl: string; width: number; height: number; size: number }[]>([]);

  // --- 2. PDF to Images state ---
  const [imageFormat, setImageFormat] = useState<'png' | 'jpeg'>('png');
  const [extractedImages, setExtractedImages] = useState<{ pageNumber: number; dataUrl: string; filename: string }[]>([]);

  // --- 3. Extract Text state ---
  const [extractedText, setExtractedText] = useState<string>('');
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);

  // --- 4. Text to PDF state ---
  const [docTitle, setDocTitle] = useState<string>('مستند جديد - PDF عربي');
  const [rawTextContent, setRawTextContent] = useState<string>(
    'بسم الله الرحمن الرحيم\n\nهذا مستند تم إنشاؤه عبر منصة PDF عربي المجانية.\nتتم جميع العمليات محلياً بنسبة 100% داخل متصفحك للحفاظ على خصوصيتك وأمان بياناتك.'
  );

  // Handle image upload for Image -> PDF
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (!f.type.startsWith('image/')) continue;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const img = new window.Image();
        img.onload = () => {
          setUploadedImages(prev => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: f.name,
              dataUrl,
              width: img.width,
              height: img.height,
              size: f.size,
            }
          ]);
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(f);
    }
  };

  // Convert uploaded images to PDF
  const handleConvertImagesToPdf = async () => {
    if (uploadedImages.length === 0) {
      setErrorMsg('يرجى إضافة صورة واحدة على الأقل');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const pdfBytes = await imagesToPdf(uploadedImages);
      const blob = createPdfBlob(pdfBytes);
      downloadBlob(blob, 'صور_مجمعة.pdf');

      if (onFileLoaded) {
        onFileLoaded({
          id: 'img-pdf-' + Date.now(),
          name: 'صور_مجمعة.pdf',
          size: pdfBytes.byteLength,
          arrayBuffer: pdfBytes.buffer as ArrayBuffer,
          pageCount: uploadedImages.length,
          uploadedAt: new Date(),
        });
      }

      setSuccessMsg(`تم تحويل ${uploadedImages.length} صور إلى مستند PDF وتنزيله بنجاح.`);
    } catch (err: any) {
      setErrorMsg('فشل تحويل الصور إلى PDF: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Convert PDF to Images
  const handleConvertPdfToImages = async () => {
    if (!file) {
      setErrorMsg('يرجى فتح ملف PDF أولاً من الصفحة الرئيسية');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const images = await convertPdfToImages(file.arrayBuffer, imageFormat);
      setExtractedImages(images);
      setSuccessMsg(`تم استخراج ${images.length} صفحة كصور بنجاح.`);
    } catch (err: any) {
      setErrorMsg('فشل استخراج الصور: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Download all extracted images as a ZIP archive using JSZip
  const handleDownloadAllZip = async () => {
    if (extractedImages.length === 0) return;
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      for (const img of extractedImages) {
        // Strip data url prefix
        const base64Data = img.dataUrl.split(',')[1];
        zip.file(img.filename, base64Data, { base64: true });
      }

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `صور_${file?.name || 'مستند'}.zip`);
      setSuccessMsg('تم إنشاء وتحميل ملف ZIP المضغوط بنجاح.');
    } catch (err: any) {
      setErrorMsg('فشل إنشاء ملف ZIP: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract text from current PDF
  const handleExtractText = async () => {
    if (!file) {
      setErrorMsg('يرجى فتح ملف PDF أولاً');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const pages = await extractAllTextFromPdf(file.arrayBuffer);
      const combined = pages
        .map(p => `=== صفحة ${p.pageNumber} ===\n${p.text}`)
        .join('\n\n');
      setExtractedText(combined);
      setHasExtracted(true);
      setSuccessMsg(`تم استخراج النص من ${pages.length} صفحة.`);
    } catch (err: any) {
      setErrorMsg('فشل استخراج النص: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Copy extracted text
  const handleCopyText = () => {
    navigator.clipboard.writeText(extractedText);
    setSuccessMsg('تم نسخ النص المستخرج إلى الحافظة.');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  // Download extracted text as .txt
  const handleDownloadTxt = () => {
    const blob = new Blob([extractedText], { type: 'text/plain;charset=utf-8' });
    downloadBlob(blob, `نص_${file?.name || 'مستند'}.txt`);
  };

  // Generate new PDF from text
  const handleCreatePdfFromText = async () => {
    if (!rawTextContent.trim()) {
      setErrorMsg('يرجى كتابة نص المستند');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const pdfBytes = await createPdfFromText(rawTextContent, docTitle);
      const blob = createPdfBlob(pdfBytes);
      downloadBlob(blob, `${docTitle}.pdf`);

      if (onFileLoaded) {
        onFileLoaded({
          id: 'text-pdf-' + Date.now(),
          name: `${docTitle}.pdf`,
          size: pdfBytes.byteLength,
          arrayBuffer: pdfBytes.buffer as ArrayBuffer,
          pageCount: 1,
          uploadedAt: new Date(),
        });
      }

      setSuccessMsg('تم توليد وتحميل ملف PDF الجديد بنجاح.');
    } catch (err: any) {
      setErrorMsg('فشل توليد المستند: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right max-h-[90vh] flex flex-col">
        {/* Header Tabs */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto">
            <button
              onClick={() => { setActiveTab('img_to_pdf'); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'img_to_pdf' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Image className="w-4 h-4" />
              <span>صور إلى PDF</span>
            </button>

            <button
              onClick={() => { setActiveTab('pdf_to_img'); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pdf_to_img' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileImage className="w-4 h-4" />
              <span>PDF إلى صور</span>
            </button>

            <button
              onClick={() => { setActiveTab('extract_text'); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'extract_text' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>استخراج نصوص</span>
            </button>

            <button
              onClick={() => { setActiveTab('text_to_pdf'); setErrorMsg(null); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'text_to_pdf' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <PlusSquare className="w-4 h-4" />
              <span>نص إلى PDF</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl shrink-0">
            {errorMsg}
          </div>
        )}

        {/* Tab 1: Images to PDF */}
        {activeTab === 'img_to_pdf' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            <p className="text-xs text-slate-500">
              اختر صور JPG أو PNG لتحويلها إلى مستند PDF واحد أنيق:
            </p>

            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-emerald-300 rounded-2xl bg-emerald-50/40 hover:bg-emerald-50 cursor-pointer transition-colors">
              <Plus className="w-8 h-8 text-emerald-700 mb-2" />
              <span className="text-xs font-bold text-emerald-900">انقر لاختيار الصور من جهازك</span>
              <span className="text-[10px] text-slate-500 mt-1">يدعم صيغ JPG وPNG المتعددة</span>
              <input
                type="file"
                multiple
                accept="image/png,image/jpeg,image/jpg"
                onChange={handleImageUpload}
                className="hidden"
              />
            </label>

            {uploadedImages.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-bold text-slate-700">الصور المحددة ({uploadedImages.length}):</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {uploadedImages.map((img, i) => (
                    <div key={img.id} className="relative bg-slate-50 rounded-xl p-2 border border-slate-200 flex flex-col items-center">
                      <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-white mb-2 border border-slate-100 flex items-center justify-center">
                        <img src={img.dataUrl} alt={img.name} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">{img.name}</span>
                      <button
                        onClick={() => setUploadedImages(uploadedImages.filter(x => x.id !== img.id))}
                        className="absolute top-1 right-1 p-1 bg-white/90 rounded-full text-rose-600 hover:bg-rose-100 shadow-xs"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleConvertImagesToPdf}
                disabled={isProcessing || uploadedImages.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold disabled:opacity-40 shadow-sm"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>تحويل وتنزيل PDF ({uploadedImages.length} صور)</span>
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: PDF to Images */}
        {activeTab === 'pdf_to_img' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">صيغة الصور المطلوبة:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setImageFormat('png')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    imageFormat === 'png' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  PNG عالية الدقة
                </button>
                <button
                  onClick={() => setImageFormat('jpeg')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors ${
                    imageFormat === 'jpeg' ? 'bg-emerald-700 text-white border-emerald-700' : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  JPEG مضغوط
                </button>
              </div>
            </div>

            {extractedImages.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 mb-4">
                  سيتم تحويل كل صفحة في مستند "{file?.name || 'الحالي'}" إلى صورة مستقلة.
                </p>
                <button
                  onClick={handleConvertPdfToImages}
                  disabled={isProcessing || !file}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'جارٍ تحويل الصفحات...' : 'بدء استخراج صفحات PDF كصور'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">الصور المستخرجة ({extractedImages.length}):</span>
                  <button
                    onClick={handleDownloadAllZip}
                    disabled={isProcessing}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-2xs"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>تنزيل الكل في ملف ZIP</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-60 overflow-y-auto">
                  {extractedImages.map((img) => (
                    <div key={img.pageNumber} className="bg-slate-50 rounded-xl p-2 border border-slate-200 flex flex-col items-center">
                      <div className="w-full aspect-[1/1.4] rounded-lg overflow-hidden bg-white mb-2 border border-slate-100 flex items-center justify-center">
                        <img src={img.dataUrl} alt={img.filename} className="max-w-full max-h-full object-contain" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-700 mb-1">صفحة {img.pageNumber}</span>
                      <a
                        href={img.dataUrl}
                        download={img.filename}
                        className="text-[10px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                      >
                        تنزيل الصورة
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Extract Text */}
        {activeTab === 'extract_text' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            {!hasExtracted ? (
              <div className="text-center py-8">
                <p className="text-xs text-slate-500 mb-4">
                  استخراج النص المباشر من طبقات ملف "{file?.name || 'الحالي'}" وتصديره كملف نصي.
                </p>
                <button
                  onClick={handleExtractText}
                  disabled={isProcessing || !file}
                  className="px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'جارٍ استخراج النصوص...' : 'استخراج جميع النصوص الآن'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700">النص المستخرج:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyText}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ النص</span>
                    </button>
                    <button
                      onClick={handleDownloadTxt}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تنزيل TXT</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={extractedText}
                  onChange={(e) => setExtractedText(e.target.value)}
                  rows={10}
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-slate-50 font-mono focus:outline-emerald-600"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Text to PDF */}
        {activeTab === 'text_to_pdf' && (
          <div className="flex-1 overflow-y-auto mt-4 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">عنوان المستند:</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">محتوى النص:</label>
              <textarea
                value={rawTextContent}
                onChange={(e) => setRawTextContent(e.target.value)}
                rows={8}
                className="w-full text-xs p-3 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={handleCreatePdfFromText}
                disabled={isProcessing || !rawTextContent.trim()}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-40"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                <span>إنشاء وتنزيل مستند PDF</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
