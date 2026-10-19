import React, { useState, useEffect } from 'react';
import {
  RotateCw,
  Trash2,
  Copy,
  ArrowRight,
  ArrowLeft,
  Download,
  CheckCircle2,
  RefreshCcw,
  Scissors
} from 'lucide-react';
import { PageInfo, LoadedPdfFile } from '../types';
import { getPdfJsDocument, renderPageThumbnail } from '../services/pdf/pdfViewerService';
import { reorderAndModifyPages, duplicatePage, extractPages } from '../services/pdf/pdfService';
import { downloadBlob, createPdfBlob } from '../utils/fileUtils';
import { parsePageRanges } from '../utils/pageRangeParser';

interface PageOrganizerProps {
  file: LoadedPdfFile;
  onUpdateFile: (updatedFile: LoadedPdfFile) => void;
  onClose?: () => void;
}

export const PageOrganizer: React.FC<PageOrganizerProps> = ({
  file,
  onUpdateFile,
}) => {
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedPages, setSelectedPages] = useState<number[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [splitInput, setSplitInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load pages and generate initial thumbnails
  useEffect(() => {
    let isMounted = true;

    async function loadThumbnails() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const pdfJsDoc = await getPdfJsDocument(file.arrayBuffer);
        const count = pdfJsDoc.numPages;
        const initialPages: PageInfo[] = [];

        for (let i = 1; i <= count; i++) {
          const thumb = await renderPageThumbnail(pdfJsDoc, i, 160);
          initialPages.push({
            pageNumber: i,
            originalIndex: i - 1,
            rotation: 0,
            deleted: false,
            thumbnailUrl: thumb,
            width: 160,
            height: 226,
          });
        }

        if (isMounted) {
          setPages(initialPages);
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setErrorMsg('تعذر إنشاء مصغرات الصفحات: ' + err.message);
          setLoading(false);
        }
      }
    }

    loadThumbnails();
    return () => {
      isMounted = false;
    };
  }, [file.arrayBuffer]);

  // Rotate a single page by 90 degrees clockwise
  const handleRotate = (pageNumber: number) => {
    setPages(prev =>
      prev.map(p =>
        p.pageNumber === pageNumber
          ? { ...p, rotation: (p.rotation + 90) % 360 }
          : p
      )
    );
  };

  // Toggle page deletion status
  const handleDeleteToggle = (pageNumber: number) => {
    setPages(prev =>
      prev.map(p =>
        p.pageNumber === pageNumber
          ? { ...p, deleted: !p.deleted }
          : p
      )
    );
  };

  // Move page position in sequence
  const handleMove = (index: number, direction: 'prev' | 'next') => {
    const targetIndex = direction === 'prev' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;

    const newPages = [...pages];
    const [moved] = newPages.splice(index, 1);
    newPages.splice(targetIndex, 0, moved);
    setPages(newPages);
  };

  // Duplicate a page
  const handleDuplicate = async (page: PageInfo) => {
    setIsProcessing(true);
    setErrorMsg(null);
    try {
      const newBytes = await duplicatePage(file.arrayBuffer, page.originalIndex);
      onUpdateFile({
        ...file,
        arrayBuffer: newBytes.buffer as ArrayBuffer,
        size: newBytes.byteLength,
        pageCount: file.pageCount + 1,
      });
      setSuccessMsg('تم تكرار الصفحة بنجاح.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg('فشل تكرار الصفحة: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save changes to current file & download
  const handleSaveAndDownload = async () => {
    const active = pages.filter(p => !p.deleted);
    if (active.length === 0) {
      setErrorMsg('لا يمكن حفظ مستند فارغ، يرجى إبقاء صفحة واحدة على الأقل');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const mods = pages.map(p => ({
        originalIndex: p.originalIndex,
        rotation: p.rotation,
        deleted: p.deleted,
      }));

      const newBytes = await reorderAndModifyPages(file.arrayBuffer, mods);
      const updatedBuffer = newBytes.buffer as ArrayBuffer;

      onUpdateFile({
        ...file,
        arrayBuffer: updatedBuffer,
        size: newBytes.byteLength,
        pageCount: active.length,
      });

      const blob = createPdfBlob(newBytes);
      downloadBlob(blob, `مستند_منظم_${file.name}`);
      setSuccessMsg(`تم تجهيز وتنزيل المستند المعدل بنجاح (${active.length} صفحة).`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('خطأ أثناء حفظ التعديلات: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract selected pages or split by range
  const handleExtractRange = async () => {
    let pagesToExtract: number[] = [];

    if (splitInput.trim()) {
      pagesToExtract = parsePageRanges(splitInput, pages.length);
    } else if (selectedPages.length > 0) {
      pagesToExtract = selectedPages;
    }

    if (pagesToExtract.length === 0) {
      setErrorMsg('يرجى كتابة نطاق صفحات (مثال: 1-2) أو تحديد الصفحات من المربعات');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const newBytes = await extractPages(file.arrayBuffer, pagesToExtract);
      const blob = createPdfBlob(newBytes);
      downloadBlob(blob, `مستخرج_صفحات_${file.name}`);
      setSuccessMsg(`تم استخراج ${pagesToExtract.length} صفحة وتنزيلها كملف PDF مستقل.`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg('فشل استخراج الصفحات: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const activePagesCount = pages.filter(p => !p.deleted).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Header and Toolbar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span>تنظيم صفحات المستند</span>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {activePagesCount} صفحة نشطة
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            أعد ترتيب الصفحات بالأسهم، أو دوّرها، أو احذفها، ثم حمّل المستند المعدّل مباشرة.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={handleSaveAndDownload}
            disabled={isProcessing || activePagesCount === 0}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-sm transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>حفظ وتنزيل المستند</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Range Split & Extract Toolbar */}
      <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex-1 flex items-center gap-2">
          <Scissors className="w-4 h-4 text-emerald-700 shrink-0" />
          <span className="text-xs font-bold text-slate-700 whitespace-nowrap">تقسيم واستخراج صفحات:</span>
          <input
            type="text"
            placeholder="مثال: 1-2, 3"
            value={splitInput}
            onChange={(e) => setSplitInput(e.target.value)}
            className="w-full max-w-xs text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600"
          />
        </div>
        <button
          onClick={handleExtractRange}
          disabled={isProcessing}
          className="px-4 py-1.5 rounded-lg bg-white border border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold transition-colors shadow-2xs"
        >
          استخراج وتنزيل كـ PDF
        </button>
      </div>

      {/* Pages Grid */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCcw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-600">جارٍ إعداد مصغرات الصفحات عالية الدقة...</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
          {pages.map((page, index) => {
            const isSelected = selectedPages.includes(page.pageNumber);
            return (
              <div
                key={page.pageNumber}
                className={`relative group bg-slate-50 rounded-2xl border-2 transition-all p-3 flex flex-col items-center ${
                  page.deleted
                    ? 'border-rose-200 opacity-40 bg-rose-50/30'
                    : isSelected
                    ? 'border-emerald-600 bg-emerald-50/20 shadow-md ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:border-emerald-400 hover:shadow-md'
                }`}
              >
                {/* Top Badge: Page number & Selection checkbox */}
                <div className="w-full flex items-center justify-between mb-2">
                  <span className="text-xs font-extrabold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 shadow-2xs">
                    صفحة {index + 1}
                  </span>

                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {
                      setSelectedPages(prev =>
                        prev.includes(page.pageNumber)
                          ? prev.filter(p => p !== page.pageNumber)
                          : [...prev, page.pageNumber]
                      );
                    }}
                    title="تحديد الصفحة للاستخراج"
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                </div>

                {/* Page Thumbnail with Rotation */}
                <div className="w-full aspect-[1/1.4] bg-white rounded-lg border border-slate-200 flex items-center justify-center overflow-hidden p-1 relative shadow-inner">
                  {page.thumbnailUrl ? (
                    <img
                      src={page.thumbnailUrl}
                      alt={`صفحة ${index + 1}`}
                      className="max-w-full max-h-full object-contain transition-transform duration-200"
                      style={{ transform: `rotate(${page.rotation}deg)` }}
                    />
                  ) : (
                    <div className="text-xs text-slate-400">جارٍ التحميل...</div>
                  )}

                  {page.deleted && (
                    <div className="absolute inset-0 bg-rose-900/40 backdrop-blur-[1px] flex items-center justify-center">
                      <span className="text-xs font-bold text-white bg-rose-700 px-2 py-1 rounded-md shadow-sm">
                        محذوفة
                      </span>
                    </div>
                  )}
                </div>

                {/* Bottom Page Controls */}
                <div className="w-full mt-3 grid grid-cols-4 gap-1 pt-2 border-t border-slate-200/80">
                  {/* Move Prev */}
                  <button
                    onClick={() => handleMove(index, 'prev')}
                    disabled={index === 0}
                    className="p-1.5 rounded-md hover:bg-slate-200 text-slate-600 disabled:opacity-30 transition-colors flex items-center justify-center"
                    title="تحريك للأمام (يمين)"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Rotate */}
                  <button
                    onClick={() => handleRotate(page.pageNumber)}
                    className="p-1.5 rounded-md hover:bg-emerald-100 text-emerald-700 transition-colors flex items-center justify-center"
                    title="تدوير 90 درجة باتجاه عقارب الساعة"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(page)}
                    className="p-1.5 rounded-md hover:bg-blue-100 text-blue-700 transition-colors flex items-center justify-center"
                    title="تكرار الصفحة"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete / Restore */}
                  <button
                    onClick={() => handleDeleteToggle(page.pageNumber)}
                    className={`p-1.5 rounded-md transition-colors flex items-center justify-center ${
                      page.deleted
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'hover:bg-rose-100 text-rose-600'
                    }`}
                    title={page.deleted ? 'استعادة الصفحة' : 'حذف الصفحة'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
