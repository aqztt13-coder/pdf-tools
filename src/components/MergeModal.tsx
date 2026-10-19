import React, { useState } from 'react';
import { Combine, ArrowUp, ArrowDown, Trash2, Plus, Download, RefreshCw, CheckCircle2 } from 'lucide-react';
import { LoadedPdfFile } from '../types';
import { mergePdfs } from '../services/pdf/pdfService';
import { readFileAsArrayBuffer, formatBytes, downloadBlob, createPdfBlob } from '../utils/fileUtils';

interface MergeModalProps {
  initialFile?: LoadedPdfFile | null;
  onClose: () => void;
  onFileMerged?: (newFile: LoadedPdfFile) => void;
}

export const MergeModal: React.FC<MergeModalProps> = ({
  initialFile,
  onClose,
  onFileMerged,
}) => {
  const [files, setFiles] = useState<LoadedPdfFile[]>(
    initialFile ? [initialFile] : []
  );
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    setErrorMsg(null);

    const newLoaded: LoadedPdfFile[] = [];
    const MAX_FILE_SIZE_BYTES = 150 * 1024 * 1024;

    for (let i = 0; i < fileList.length; i++) {
      const f = fileList[i];
      if (!f.name.toLowerCase().endsWith('.pdf') && f.type !== 'application/pdf') {
        setErrorMsg(`الملف "${f.name}" ليس بصيغة PDF صالحة.`);
        continue;
      }

      if (f.size === 0) {
        setErrorMsg(`الملف "${f.name}" فارغ.`);
        continue;
      }

      if (f.size > MAX_FILE_SIZE_BYTES) {
        setErrorMsg(`الملف "${f.name}" يتجاوز الحد الأقصى (150 ميغابايت).`);
        continue;
      }

      try {
        const buffer = await readFileAsArrayBuffer(f);
        const header = new Uint8Array(buffer.slice(0, 5));
        const headerStr = String.fromCharCode(...header);
        if (!headerStr.startsWith('%PDF-')) {
          setErrorMsg(`الملف "${f.name}" تالف أو ليس مستند PDF حقيقي.`);
          continue;
        }

        let actualPageCount = 1;
        try {
          const { PDFDocument } = await import('pdf-lib');
          const doc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
          actualPageCount = doc.getPageCount();
        } catch {
          // Fallback if encrypted
        }

        newLoaded.push({
          id: Math.random().toString(36).substring(2, 9),
          name: f.name,
          size: f.size,
          arrayBuffer: buffer,
          pageCount: actualPageCount,
          uploadedAt: new Date(),
        });
      } catch (err: any) {
        setErrorMsg(`تعذر قراءة الملف "${f.name}": ` + err.message);
      }
    }

    setFiles(prev => [...prev, ...newLoaded]);
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= files.length) return;
    const updated = [...files];
    const [moved] = updated.splice(index, 1);
    updated.splice(target, 0, moved);
    setFiles(updated);
  };

  const handleRemove = (id: string) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setErrorMsg('يرجى إضافة ملفين على الأقل لدمجهما معاً');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      const buffers = files.map(f => f.arrayBuffer);
      const mergedBytes = await mergePdfs(buffers);

      const mergedFile: LoadedPdfFile = {
        id: 'merged-' + Date.now(),
        name: 'مستند_مدمج_شامل.pdf',
        size: mergedBytes.byteLength,
        arrayBuffer: mergedBytes.buffer as ArrayBuffer,
        pageCount: files.reduce((acc, f) => acc + (f.pageCount || 1), 0),
        uploadedAt: new Date(),
      };

      if (onFileMerged) {
        onFileMerged(mergedFile);
      }

      const blob = createPdfBlob(mergedBytes);
      downloadBlob(blob, 'مستند_مدمج_شامل.pdf');

      setSuccessMsg(`تم دمج ${files.length} ملفات بنجاح وحجم الملف الناتج ${formatBytes(mergedBytes.byteLength)}.`);
      setTimeout(() => {
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg('حدث خطأ أثناء دمج الملفات: ' + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Combine className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">دمج ملفات PDF</h3>
              <p className="text-xs text-slate-500">حدد الملفات ورتّبها حسب رغبتك قبل الدمج</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Notifications */}
        {successMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
            {errorMsg}
          </div>
        )}

        {/* Files List */}
        <div className="mt-5 space-y-2 max-h-60 overflow-y-auto pr-1">
          {files.map((f, idx) => (
            <div
              key={f.id}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200"
            >
              <div className="flex items-center gap-2.5 truncate">
                <span className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-800 truncate">{f.name}</div>
                  <div className="text-[10px] text-slate-500">{formatBytes(f.size)}</div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0 mr-2">
                <button
                  onClick={() => handleMove(idx, 'up')}
                  disabled={idx === 0}
                  className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                  title="تحريك لأعلى"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMove(idx, 'down')}
                  disabled={idx === files.length - 1}
                  className="p-1 rounded hover:bg-slate-200 text-slate-600 disabled:opacity-30"
                  title="تحريك لأسفل"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleRemove(f.id)}
                  className="p-1 rounded hover:bg-rose-100 text-rose-600"
                  title="إزالة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {files.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">
              لم تتم إضافة أي ملفات بعد. انقر على الزر أدناه لإضافة ملفات PDF.
            </div>
          )}
        </div>

        {/* Add more files input */}
        <label className="mt-4 flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 text-xs font-bold cursor-pointer transition-colors">
          <Plus className="w-4 h-4" />
          <span>إضافة ملفات PDF إضافية</span>
          <input
            type="file"
            multiple
            accept=".pdf,application/pdf"
            onChange={handleAddFiles}
            className="hidden"
          />
        </label>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
          >
            إلغاء
          </button>
          <button
            onClick={handleMerge}
            disabled={isProcessing || files.length < 2}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/10 disabled:opacity-40 transition-all"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>جارٍ الدمج...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>دمج وتنزيل ({files.length} ملفات)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
