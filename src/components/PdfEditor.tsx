import React, { useState, useRef } from 'react';
import {
  Type,
  EyeOff,
  PenTool,
  Stamp,
  ListOrdered,
  Download,
  Trash2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Undo2,
  Image as ImageIcon,
  Square
} from 'lucide-react';
import { LoadedPdfFile, PageAnnotation, TextAnnotation, VisualCoverAnnotation, SignatureAnnotation } from '../types';
import { applyAnnotationsToPdf, addWatermarkToPdf, addPageNumbersToPdf } from '../services/pdf/pdfService';
import { downloadBlob, createPdfBlob } from '../utils/fileUtils';

interface PdfEditorProps {
  file: LoadedPdfFile;
  currentPage: number;
  onUpdateFile: (updatedFile: LoadedPdfFile) => void;
}

export const PdfEditor: React.FC<PdfEditorProps> = ({
  file,
  currentPage,
  onUpdateFile,
}) => {
  const [activeTool, setActiveTool] = useState<'text' | 'cover' | 'signature' | 'watermark' | 'page_numbers' | null>('text');
  const [annotations, setAnnotations] = useState<PageAnnotation[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'info' | 'warn'; text: string } | null>(null);

  // Text tool options
  const [textInput, setTextInput] = useState<string>('نص جديد للتجربة');
  const [textColor, setTextColor] = useState<string>('#0f172a');
  const [textSize, setTextSize] = useState<number>(16);

  // Watermark options
  const [watermarkText, setWatermarkText] = useState<string>('مسودة غير معتمدة - DRAFT');
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.25);
  const [watermarkColor, setWatermarkColor] = useState<string>('#ef4444');

  // Page numbers options
  const [pageNumPosition, setPageNumPosition] = useState<'bottom-center' | 'bottom-right' | 'bottom-left'>('bottom-center');
  const [pageNumFormat, setPageNumFormat] = useState<'page_of_total' | 'simple_number'>('page_of_total');

  // Signature pad states
  const [showSignModal, setShowSignModal] = useState<boolean>(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawingSig, setIsDrawingSig] = useState<boolean>(false);

  // Add text annotation to current page
  const handleAddText = () => {
    if (!textInput.trim()) return;
    const newAnn: TextAnnotation = {
      id: 'text-' + Date.now(),
      pageNumber: currentPage,
      type: 'text',
      text: textInput,
      fontSize: textSize,
      color: textColor,
      backgroundColor: '#ffffff',
      x: 0.1, // 10% from left
      y: 0.2 + (annotations.filter(a => a.pageNumber === currentPage).length * 0.08), // stagger
      width: 0.4,
      height: 0.06,
    };
    setAnnotations([...annotations, newAnn]);
    setStatusMsg({ type: 'success', text: `تمت إضافة النص في صفحة ${currentPage}. يمكنك حفظ وتنزيل التعديلات.` });
  };

  // Add visual cover box (تغطية بصرية)
  const handleAddCoverBox = (color: string = '#ffffff') => {
    const newAnn: VisualCoverAnnotation = {
      id: 'cover-' + Date.now(),
      pageNumber: currentPage,
      type: 'visual_cover',
      color,
      x: 0.1,
      y: 0.3 + (annotations.filter(a => a.pageNumber === currentPage).length * 0.08),
      width: 0.35,
      height: 0.05,
    };
    setAnnotations([...annotations, newAnn]);
    setStatusMsg({
      type: 'warn',
      text: 'تنبيه: التغطية البصرية تخفي البيانات بصرياً ولكنها لا تحذف النص من بنية الملف الأصلية.'
    });
  };

  // Add current date stamp
  const handleAddDateStamp = () => {
    const today = new Date().toISOString().split('T')[0];
    const newAnn: TextAnnotation = {
      id: 'date-' + Date.now(),
      pageNumber: currentPage,
      type: 'text',
      text: `التاريخ: ${today}`,
      fontSize: 14,
      color: '#065f46',
      backgroundColor: '#ecfdf5',
      x: 0.6,
      y: 0.1,
      width: 0.3,
      height: 0.05,
    };
    setAnnotations([...annotations, newAnn]);
    setStatusMsg({ type: 'success', text: 'تمت إضافة ختم التاريخ إلى الصفحة.' });
  };

  // Add image stamp / logo
  const handleUploadImageStamp = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const newAnn: SignatureAnnotation = {
        id: 'img-' + Date.now(),
        pageNumber: currentPage,
        type: 'signature',
        imageDataUrl: dataUrl,
        x: 0.6,
        y: 0.65,
        width: 0.25,
        height: 0.15,
      };
      setAnnotations(prev => [...prev, newAnn]);
      setStatusMsg({ type: 'success', text: `تم إدراج الصورة / الختم في صفحة ${currentPage}.` });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawingSig(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingSig) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0284c7'; // Nice signature ink blue
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawingSig(false);
  };

  const clearSigPad = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');

    const newAnn: SignatureAnnotation = {
      id: 'sig-' + Date.now(),
      pageNumber: currentPage,
      type: 'signature',
      imageDataUrl: dataUrl,
      x: 0.3,
      y: 0.7,
      width: 0.4,
      height: 0.15,
    };

    setAnnotations([...annotations, newAnn]);
    setShowSignModal(false);
    setStatusMsg({
      type: 'info',
      text: 'تم إدراج التوقيع في الصفحة. (توضيح: التوقيع المرسوم هو توقيع بصري وليس شهادة رقمية تشفيرية).'
    });
  };

  // Apply watermark to document
  const handleApplyWatermark = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const newBytes = await addWatermarkToPdf(file.arrayBuffer, {
        text: watermarkText,
        color: watermarkColor,
        opacity: watermarkOpacity,
        fontSize: 38,
        rotation: 45,
      });

      onUpdateFile({
        ...file,
        arrayBuffer: newBytes.buffer as ArrayBuffer,
        size: newBytes.byteLength,
      });

      const blob = createPdfBlob(newBytes);
      downloadBlob(blob, `علامة_مائية_${file.name}`);
      setStatusMsg({ type: 'success', text: 'تمت إضافة العلامة المائية وتنزيل الملف بنجاح.' });
    } catch (err: any) {
      setStatusMsg({ type: 'warn', text: 'فشل تطبيق العلامة المائية: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Apply page numbering
  const handleApplyPageNumbers = async () => {
    setIsProcessing(true);
    setStatusMsg(null);
    try {
      const newBytes = await addPageNumbersToPdf(file.arrayBuffer, {
        position: pageNumPosition,
        format: pageNumFormat,
        fontSize: 11,
        color: '#334155',
      });

      onUpdateFile({
        ...file,
        arrayBuffer: newBytes.buffer as ArrayBuffer,
        size: newBytes.byteLength,
      });

      const blob = createPdfBlob(newBytes);
      downloadBlob(blob, `مرقم_${file.name}`);
      setStatusMsg({ type: 'success', text: 'تم ترقيم صفحات المستند بالكامل وتنزيله.' });
    } catch (err: any) {
      setStatusMsg({ type: 'warn', text: 'فشل ترقيم الصفحات: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  // Save all active annotations to the PDF
  const handleSaveAnnotations = async () => {
    if (annotations.length === 0) {
      setStatusMsg({ type: 'info', text: 'لا توجد إضافات جديدة لحفظها.' });
      return;
    }

    setIsProcessing(true);
    setStatusMsg(null);

    try {
      const newBytes = await applyAnnotationsToPdf(file.arrayBuffer, annotations);
      onUpdateFile({
        ...file,
        arrayBuffer: newBytes.buffer as ArrayBuffer,
        size: newBytes.byteLength,
      });

      const blob = createPdfBlob(newBytes);
      downloadBlob(blob, `معدل_${file.name}`);
      setStatusMsg({ type: 'success', text: `تم حفظ ${annotations.length} تعديل وتنزيل المستند بنجاح.` });
      setAnnotations([]); // Clear applied annotations
    } catch (err: any) {
      setStatusMsg({ type: 'warn', text: 'فشل حفظ الإضافات: ' + err.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const currentPageAnnotations = annotations.filter(a => a.pageNumber === currentPage);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      {/* Editor Tool Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-200">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTool('text')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'text'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>إضافة نص</span>
          </button>

          <button
            onClick={() => setActiveTool('cover')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'cover'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span>تغطية بصرية</span>
          </button>

          <button
            onClick={() => setShowSignModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all border border-transparent hover:border-emerald-300"
          >
            <PenTool className="w-3.5 h-3.5 text-blue-600" />
            <span>رسم توقيع</span>
          </button>

          <button
            onClick={handleAddDateStamp}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            title="إضافة ختم التاريخ الحالي"
          >
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>ختم التاريخ</span>
          </button>

          <label
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-all cursor-pointer border border-transparent hover:border-emerald-300"
            title="إدراج صورة أو ختم رسمي على الصفحة"
          >
            <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
            <span>ختم صورة</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleUploadImageStamp}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setActiveTool('watermark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'watermark'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Stamp className="w-3.5 h-3.5" />
            <span>علامة مائية</span>
          </button>

          <button
            onClick={() => setActiveTool('page_numbers')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTool === 'page_numbers'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            <span>ترقيم الصفحات</span>
          </button>
        </div>

        {/* Action Controls: Undo, Reset, and Save */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (annotations.length > 0) {
                setAnnotations(prev => prev.slice(0, -1));
                setStatusMsg({ type: 'info', text: 'تم التراجع عن آخر تعديل.' });
              }
            }}
            disabled={annotations.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors disabled:opacity-40"
            title="تراجع عن آخر إضافة"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>تراجع</span>
          </button>

          <button
            onClick={() => {
              if (annotations.length > 0) {
                setAnnotations([]);
                setStatusMsg({ type: 'info', text: 'تمت إعادة ضبط وإلغاء جميع التعديلات الحالية.' });
              }
            }}
            disabled={annotations.length === 0}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 text-xs font-bold transition-colors disabled:opacity-40"
            title="إعادة ضبط جميع التعديلات"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط</span>
          </button>

          <button
            onClick={handleSaveAnnotations}
            disabled={isProcessing || annotations.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>حفظ وتنزيل التعديلات ({annotations.length})</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div
          className={`mt-3 p-3 rounded-xl text-xs flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : statusMsg.type === 'warn'
              ? 'bg-amber-50 text-amber-800 border-amber-200'
              : 'bg-blue-50 text-blue-800 border-blue-200'
          }`}
        >
          {statusMsg.type === 'warn' ? (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Active Tool Sub-Bar */}
      <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
        {activeTool === 'text' && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="اكتب النص المراد إضافته..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              className="flex-1 min-w-[200px] text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">الحجم:</span>
              <input
                type="number"
                min={10}
                max={48}
                value={textSize}
                onChange={(e) => setTextSize(parseInt(e.target.value, 10) || 14)}
                className="w-14 text-xs text-center py-1.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">اللون:</span>
              <input
                type="color"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border border-slate-300"
              />
            </div>
            <button
              onClick={handleAddText}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
            >
              إدراج في صفحة {currentPage}
            </button>
          </div>
        )}

        {activeTool === 'cover' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-700 flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-slate-500" />
              <span>إخفاء منطقة أو معلومات حساسة بتغطية بصرية مصمتة:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddCoverBox('#ffffff')}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-bold hover:bg-slate-50"
              >
                مربع أبيض
              </button>
              <button
                onClick={() => handleAddCoverBox('#000000')}
                className="px-3 py-1.5 rounded-lg border border-slate-900 bg-black text-white text-xs font-bold hover:bg-slate-800"
              >
                مربع أسود (تعتيم)
              </button>
            </div>
          </div>
        )}

        {activeTool === 'watermark' && (
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="text"
              placeholder="نص العلامة المائية..."
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              className="flex-1 min-w-[180px] text-xs px-3 py-2 rounded-lg border border-slate-300 bg-white focus:outline-emerald-600"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600">الشفافية:</span>
              <input
                type="range"
                min={0.1}
                max={0.8}
                step={0.05}
                value={watermarkOpacity}
                onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                className="w-24 accent-emerald-600"
              />
              <span className="text-xs font-bold text-slate-700">{Math.round(watermarkOpacity * 100)}%</span>
            </div>
            <button
              onClick={handleApplyWatermark}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              تطبيق على كل الصفحات وتنزيل
            </button>
          </div>
        )}

        {activeTool === 'page_numbers' && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-700 font-bold">الموضع:</span>
              <select
                value={pageNumPosition}
                onChange={(e: any) => setPageNumPosition(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="bottom-center">أسفل المنتصف</option>
                <option value="bottom-right">أسفل اليمين</option>
                <option value="bottom-left">أسفل اليسار</option>
              </select>

              <span className="text-xs text-slate-700 font-bold mr-2">التنسيق:</span>
              <select
                value={pageNumFormat}
                onChange={(e: any) => setPageNumFormat(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
              >
                <option value="page_of_total">Page X of Y</option>
                <option value="simple_number">X فقط</option>
              </select>
            </div>

            <button
              onClick={handleApplyPageNumbers}
              disabled={isProcessing}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
            >
              ترقيم وتنزيل
            </button>
          </div>
        )}
      </div>

      {/* Current Page Annotations List */}
      {currentPageAnnotations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-600 mb-2">الإضافات في هذه الصفحة ({currentPageAnnotations.length}):</div>
          <div className="flex flex-wrap gap-2">
            {currentPageAnnotations.map((ann) => (
              <div
                key={ann.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800"
              >
                <span>
                  {ann.type === 'text' ? `نص: "${(ann as TextAnnotation).text.substring(0, 15)}..."` :
                   ann.type === 'visual_cover' ? 'تغطية بصرية' :
                   ann.type === 'signature' ? 'توقيع مرسوم' : 'إضافة'}
                </span>
                <button
                  onClick={() => setAnnotations(annotations.filter(a => a.id !== ann.id))}
                  className="p-1 rounded-md hover:bg-rose-100 text-rose-600 transition-colors"
                  title="حذف الإضافة"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Signature Draw Modal */}
      {showSignModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <PenTool className="w-5 h-5 text-emerald-700" />
                <span>لوحة رسم التوقيع الإلكتروني</span>
              </h3>
              <button
                onClick={() => setShowSignModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 mb-3">
              استخدم الفأرة أو شاشة اللمس لرسم توقيعك بدقة:
            </p>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl overflow-hidden bg-slate-50/50 flex items-center justify-center">
              <canvas
                ref={sigCanvasRef}
                width={380}
                height={160}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="cursor-crosshair bg-white w-full h-[160px]"
              />
            </div>

            <div className="flex items-center justify-between mt-4">
              <button
                onClick={clearSigPad}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>مسح وإعادة</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                >
                  إلغاء
                </button>
                <button
                  onClick={saveSignature}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-md shadow-emerald-900/10"
                >
                  إدراج التوقيع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
