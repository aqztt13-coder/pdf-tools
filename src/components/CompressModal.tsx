import React, { useState, useRef } from 'react';
import { Minimize2, Download, AlertTriangle, CheckCircle2, RefreshCw, Zap, Sliders, StopCircle, Sparkles } from 'lucide-react';
import { PDFDocument } from 'pdf-lib';
import { LoadedPdfFile } from '../types';
import { formatBytes, downloadBlob, createPdfBlob } from '../utils/fileUtils';
import { compressPdfDeep, CompressionProgress } from '../services/pdf/pdfViewerService';

interface CompressModalProps {
  file: LoadedPdfFile;
  onClose: () => void;
  onUpdateFile: (updatedFile: LoadedPdfFile) => void;
}

export const CompressModal: React.FC<CompressModalProps> = ({
  file,
  onClose,
  onUpdateFile,
}) => {
  // Method: 'deep' (real raster/image compression 50%-90%) vs 'structural' (object streams only)
  const [method, setMethod] = useState<'deep' | 'structural'>('deep');
  const [level, setLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressInfo, setProgressInfo] = useState<CompressionProgress | null>(null);
  const isCancelledRef = useRef<boolean>(false);

  const [result, setResult] = useState<{
    originalSize: number;
    compressedSize: number;
    savingsPercent: number;
    compressedBytes: Uint8Array;
  } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStartCompress = async () => {
    setIsProcessing(true);
    setErrorMsg(null);
    setResult(null);
    setProgressInfo(null);
    isCancelledRef.current = false;

    try {
      if (method === 'deep') {
        // Deep Real Compression using Canvas & PDF.js + pdf-lib JPEG encoding
        const deepRes = await compressPdfDeep(
          file.arrayBuffer,
          level,
          (prog) => setProgressInfo(prog),
          () => isCancelledRef.current
        );

        setResult(deepRes);
      } else {
        // Structural metadata compression only
        const doc = await PDFDocument.load(file.arrayBuffer, { ignoreEncryption: true });
        const compressedBytes = await doc.save({
          useObjectStreams: true,
          addDefaultPage: false,
        });

        const originalSize = file.size;
        const compressedSize = compressedBytes.byteLength;
        const savings = originalSize > 0
          ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
          : 0;

        setResult({
          originalSize,
          compressedSize,
          savingsPercent: savings,
          compressedBytes,
        });
      }
    } catch (err: any) {
      if (err.message && err.message.includes('إلغاء')) {
        setErrorMsg('تم إيقاف عملية الضغط.');
      } else {
        setErrorMsg('حدث خطأ أثناء معالجة ضغط المستند: ' + err.message);
      }
    } finally {
      setIsProcessing(false);
      setProgressInfo(null);
    }
  };

  const handleCancelProcess = () => {
    isCancelledRef.current = true;
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = createPdfBlob(result.compressedBytes);
    downloadBlob(blob, `مضغوط_${file.name}`);

    onUpdateFile({
      ...file,
      arrayBuffer: result.compressedBytes.buffer as ArrayBuffer,
      size: result.compressedSize,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
              <Minimize2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900">ضغط وتصغير حجم PDF</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  محلي 100%
                </span>
              </div>
              <p className="text-xs text-slate-500">تقليص فعلي لأحجام الملفات الكبيرة والصور والماسحات الضوئية</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
          {/* Current File Info */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-800 truncate max-w-[240px]">{file.name}</div>
              <div className="text-[11px] text-slate-500">{file.pageCount} صفحة</div>
            </div>
            <div className="text-left">
              <div className="text-xs font-bold text-slate-900">الحجم الأصلي:</div>
              <div className="text-base font-black text-rose-700">{formatBytes(file.size)}</div>
            </div>
          </div>

          {/* Explanation Alert for multi-megabyte files */}
          {file.size > 2 * 1024 * 1024 && (
            <div className="p-3 bg-emerald-50/80 border border-emerald-200 text-emerald-950 rounded-2xl text-xs flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="font-bold">ملاحظة تقنية:</strong> الملفات الكبيرة (مثل ملفك بحجم {formatBytes(file.size)}) تتكون بنسبة تتجاوز 90% من صور ومستندات ممسوحة ضوئياً بدقة عالية. استخدام <strong className="underline decoration-emerald-500">«الضغط العميق للصور»</strong> هو الذي يحقق تخفيضاً حقيقياً يقلص الحجم بنسبة تصل إلى 85% مع الحفاظ على وضوح القراءة.
              </p>
            </div>
          )}

          {/* Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">طريقة الضغط:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('deep')}
                disabled={isProcessing}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  method === 'deep'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-emerald-950 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>ضغط عميق حقيقي (موصى به)</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-200 text-emerald-900">
                    توفير 50% - 90%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  يعيد تحسين دقة الصور وتدفقات الماسح الضوئي، مثالي للمستندات الكبيرة والصور.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setMethod('structural')}
                disabled={isProcessing}
                className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between ${
                  method === 'structural'
                    ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/20'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>ضغط هيكلي سريع</span>
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-200 text-slate-700">
                    توفير خفيف
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  ضغط فهارس الكائنات دون إعادة تحويل الصور، سريع جداً لكنه لا يقلص الصور الكبيرة.
                </p>
              </button>
            </div>
          </div>

          {/* Level Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">
              قوة الضغط المطلوبة {method === 'deep' ? '(دقة الصور)' : ''}:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setLevel('high')}
                disabled={isProcessing}
                className={`p-3 rounded-xl border text-center transition-all ${
                  level === 'high'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold mb-1">أقصى ضغط</div>
                <div className="text-[10px] text-emerald-700 font-semibold">توفير فائق (~85%)</div>
                <div className="text-[9px] text-slate-400 mt-0.5">للواتساب ومواقع التقديم</div>
              </button>

              <button
                type="button"
                onClick={() => setLevel('medium')}
                disabled={isProcessing}
                className={`p-3 rounded-xl border text-center transition-all ${
                  level === 'medium'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold mb-1">متوازن</div>
                <div className="text-[10px] text-emerald-700 font-semibold">توفير عالي (~65%)</div>
                <div className="text-[9px] text-slate-400 mt-0.5">توازن مثالي للوضوح</div>
              </button>

              <button
                type="button"
                onClick={() => setLevel('low')}
                disabled={isProcessing}
                className={`p-3 rounded-xl border text-center transition-all ${
                  level === 'low'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold ring-2 ring-emerald-600/20 shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="text-xs font-extrabold mb-1">خفيف</div>
                <div className="text-[10px] text-slate-600 font-semibold">توفير معتدل (~40%)</div>
                <div className="text-[9px] text-slate-400 mt-0.5">أعلى جودة طباعة</div>
              </button>
            </div>
          </div>

          {/* Live Progress Bar when Processing */}
          {isProcessing && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-900">
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                  <span>{progressInfo?.status || 'جارٍ تهيئة محرك الضغط...'}</span>
                </span>
                <span>{progressInfo?.percent || 0}%</span>
              </div>
              <div className="w-full h-2.5 bg-emerald-200/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-300"
                  style={{ width: `${progressInfo?.percent || 5}%` }}
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleCancelProcess}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-white border border-rose-300 text-rose-700 text-xs font-bold hover:bg-rose-50 shadow-2xs"
                >
                  <StopCircle className="w-3.5 h-3.5" />
                  <span>إلغاء العملية</span>
                </button>
              </div>
            </div>
          )}

          {/* Error Notification */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Results Area */}
          {result && (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">الحجم بعد الضغط:</span>
                <span className="text-lg font-black text-emerald-800">{formatBytes(result.compressedSize)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700">نسبة التوفير المحققة:</span>
                <span className="text-base font-extrabold text-emerald-700">
                  {result.savingsPercent > 0
                    ? `وفرت ${result.savingsPercent}% من الحجم الأصلي!`
                    : 'المستند بأصغر حجم ممكن بالفعل'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs text-slate-600 flex items-center justify-between">
                <span>تم تقليص الحجم من <strong className="text-rose-600">{formatBytes(result.originalSize)}</strong> إلى <strong className="text-emerald-700">{formatBytes(result.compressedSize)}</strong></span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>

              {result.savingsPercent <= 5 && method === 'structural' && (
                <div className="flex items-center gap-2 p-2 bg-amber-100/80 rounded-lg text-amber-900 text-[11px]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>لم ينخفض الحجم كثيراً لأن هذا الملف يحتوي على صور كبيرة. اختر «الضغط العميق للصور» لتخفيض الحجم الحقيقي.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 mt-4 pt-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            إغلاق
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleStartCompress}
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>جارٍ الضغط الفعلي...</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-4 h-4" />
                  <span>بدء الضغط الحقيقي الآن</span>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/10 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>تنزيل الملف المضغوط ({formatBytes(result.compressedSize)})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
