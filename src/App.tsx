/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  Zap,
  Lock,
  Layers,
  Sparkles,
  ArrowRight,
  ChevronRight,
  RotateCw,
  SlidersHorizontal
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { FileDropzone } from './components/FileDropzone';
import { ToolCard } from './components/ToolCard';
import { PdfViewer } from './components/PdfViewer';
import { PageOrganizer } from './components/PageOrganizer';
import { PdfEditor } from './components/PdfEditor';
import { MergeModal } from './components/MergeModal';
import { ConvertModal } from './components/ConvertModal';
import { CompressModal } from './components/CompressModal';
import { OcrModal } from './components/OcrModal';
import { SmartAssistantModal } from './components/SmartAssistantModal';
import { PrivacyModal } from './components/PrivacyModal';
import { FaqSection } from './components/FaqSection';
import { TOOLS_DATA } from './data/toolsData';
import { LoadedPdfFile, ToolCategory } from './types';
import { formatBytes } from './utils/fileUtils';

export default function App() {
  const [activeTab, setActiveTab] = useState<'tools' | 'workspace' | 'assistant' | 'privacy' | 'faq'>('tools');
  const [activeFile, setActiveFile] = useState<LoadedPdfFile | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [workspaceSubTab, setWorkspaceSubTab] = useState<'view' | 'organize' | 'edit'>('view');

  // Search & Filter in Tools
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<ToolCategory | 'all'>('all');

  // Modals state
  const [activeModal, setActiveModal] = useState<
    'merge' | 'convert_img_pdf' | 'convert_pdf_img' | 'extract_text' | 'text_to_pdf' | 'compress' | 'ocr' | 'assistant' | 'privacy' | null
  >(null);

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  // Register PWA service worker
  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(err => {
          console.warn('Service worker registration failed:', err);
        });
      });
    }
  }, []);

  // Handle when a file is dropped or loaded
  const handleFileLoaded = (file: LoadedPdfFile) => {
    setActiveFile(file);
    setCurrentPage(1);
    setActiveTab('workspace');
  };

  // Clear current session and free memory
  const handleClearSession = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = () => {
    setActiveFile(null);
    setCurrentPage(1);
    setActiveTab('tools');
    setActiveModal(null);
    setShowClearConfirm(false);
  };

  // Handle clicking a tool card
  const handleSelectTool = (toolId: string) => {
    switch (toolId) {
      case 'merge':
        setActiveModal('merge');
        break;
      case 'split':
      case 'reorder':
      case 'duplicate':
        if (activeFile) {
          setActiveTab('workspace');
          setWorkspaceSubTab('organize');
        } else {
          setActiveTab('workspace');
          setWorkspaceSubTab('organize');
        }
        break;
      case 'edit_annotate':
      case 'watermark':
      case 'page_numbers':
      case 'visual_cover':
      case 'sign':
        if (activeFile) {
          setActiveTab('workspace');
          setWorkspaceSubTab('edit');
        } else {
          setActiveTab('workspace');
          setWorkspaceSubTab('edit');
        }
        break;
      case 'img_to_pdf':
        setActiveModal('convert_img_pdf');
        break;
      case 'pdf_to_img':
        setActiveModal('convert_pdf_img');
        break;
      case 'extract_text':
        setActiveModal('extract_text');
        break;
      case 'text_to_pdf':
        setActiveModal('text_to_pdf');
        break;
      case 'compress':
        if (activeFile) {
          setActiveModal('compress');
        } else {
          setActiveTab('tools');
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
        break;
      case 'ocr':
        if (activeFile) {
          setActiveModal('ocr');
        } else {
          setActiveTab('tools');
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
        break;
      case 'assistant':
        if (activeFile) {
          setActiveModal('assistant');
        } else {
          setActiveTab('assistant');
        }
        break;
      default:
        break;
    }
  };

  // Filter tools by search query and category
  const filteredTools = TOOLS_DATA.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || tool.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-right" dir="rtl">
      {/* Global Navigation */}
      <Navbar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'privacy') setActiveModal('privacy');
          else if (tab === 'assistant' && activeFile) setActiveModal('assistant');
          else setActiveTab(tab);
        }}
        hasActiveFile={!!activeFile}
        onClearSession={handleClearSession}
      />

      {/* Main Body View */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        {/* ===================== VIEW 1: TOOLS & DASHBOARD ===================== */}
        {activeTab === 'tools' && (
          <div className="space-y-12">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto pt-4 sm:pt-8">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-900 border border-emerald-200/80 text-xs font-bold mb-4 shadow-2xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>المنصة العربية لأدوات PDF — معالجة محلية 100% دون خوادم</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-tight">
                أدوات PDF متكاملة واحترافية{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-700 to-teal-700">
                  مجانية وسرية تماماً
                </span>
              </h1>

              <p className="mt-4 text-sm sm:text-base text-slate-600 leading-relaxed max-w-2xl mx-auto">
                عدّل، ادمج، قسّم، وقّع، واضغط مستنداتك دون رفعها إلى أي خادم خارجي. جميع العمليات تتم داخل متصفحك للحفاظ على سرية ملفاتك الشخصية والحكومية.
              </p>

              {/* Badges Bar */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                  <span>بدون رفع للملفات</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>بدون تسجيل حساب</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>مجاني وغير محدود</span>
                </span>
                <span className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>يعمل دون إنترنت (PWA)</span>
                </span>
              </div>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div className="max-w-2xl mx-auto">
              {activeFile ? (
                <div className="bg-white rounded-3xl p-6 border-2 border-emerald-500/80 shadow-lg shadow-emerald-950/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5 truncate">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-emerald-800">المستند الحالي في الذاكرة:</div>
                      <div className="text-sm font-extrabold text-slate-900 truncate">{activeFile.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {formatBytes(activeFile.size)} • {activeFile.pageCount} صفحة
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => setActiveTab('workspace')}
                      className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-sm transition-all"
                    >
                      فتح في المحرر والمستعرض
                    </button>
                    <button
                      onClick={handleClearSession}
                      className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
                      title="استبدال أو مسح المستند"
                    >
                      تغيير
                    </button>
                  </div>
                </div>
              ) : (
                <FileDropzone onFileLoaded={handleFileLoaded} />
              )}
            </div>

            {/* Tools Directory Section */}
            <div className="space-y-6">
              {/* Category Filters and Search Bar */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    جميع الأدوات ({TOOLS_DATA.length})
                  </button>

                  <button
                    onClick={() => setSelectedCategory('organize')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'organize'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تنظيم وتقسيم
                  </button>

                  <button
                    onClick={() => setSelectedCategory('edit')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'edit'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تحرير وإضافة
                  </button>

                  <button
                    onClick={() => setSelectedCategory('security')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'security'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    توقيع ونماذج
                  </button>

                  <button
                    onClick={() => setSelectedCategory('convert')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'convert'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    تحويل
                  </button>

                  <button
                    onClick={() => setSelectedCategory('assistant')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      selectedCategory === 'assistant'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    ذكاء اصطناعي وOCR
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="ابحث عن أداة..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs pr-10 pl-4 py-2 rounded-xl border border-slate-300 bg-white focus:outline-emerald-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Tools Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTools.map((tool) => (
                  <ToolCard key={tool.id} tool={tool} onSelect={handleSelectTool} />
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="py-16 text-center text-slate-400 text-sm">
                  لم يتم العثور على أداة مطابقة لبحثك "{searchQuery}".
                </div>
              )}
            </div>

            {/* Why PDF Arabi Features */}
            <div className="bg-gradient-to-br from-emerald-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 shadow-xl relative overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-800/80 text-emerald-200 text-xs font-bold mb-4 border border-emerald-700">
                  <ShieldCheck className="w-4 h-4" />
                  <span>الأمان أولاً وقبل كل شيء</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">
                  لماذا تختار معالجة ملفاتك محلياً مع PDF عربي؟
                </h2>

                <p className="text-sm text-emerald-100/90 leading-relaxed mb-8">
                  معظم مواقع PDF ترفع مستنداتك إلى خوادم غير معروفة مما قد يعرض العقود السرية والبيانات المالية للخطر. في «PDF عربي»، يتم تنفيذ 100% من الشيفرة البرمجية داخل متصفحك عبر تقنيات حديثة تضمن بقاء ملفاتك على جهازك فقط.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4 border-t border-emerald-800/60">
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">سرية مطلقة</h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      لا توجد خوادم تخزن مستنداتك ولا استدعاءات API خارجية.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">سرعة فورية</h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      لا تنتظر رفع الملفات الكبيرة أو تحميلها عبر الإنترنت.
                    </p>
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white mb-1">مجاني بلا قيود</h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      لا نطلب بريدك الإلكتروني ولا توجد خطط مدفوعة أو إعلانات مزعجة.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Section */}
            <FaqSection />
          </div>
        )}

        {/* ===================== VIEW 2: WORKSPACE (VIEWER & EDITOR) ===================== */}
        {activeTab === 'workspace' && (
          <div className="space-y-4">
            {/* Top Workspace Header & Document Info */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3 truncate">
                <button
                  onClick={() => setActiveTab('tools')}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                  title="العودة للأدوات الرئيسية"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {activeFile?.name || 'مستند بدون اسم'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      محلي
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {activeFile ? formatBytes(activeFile.size) : ''} • صفحة {currentPage} من {activeFile?.pageCount || 1}
                  </div>
                </div>
              </div>

              {/* Workspace Navigation Subtabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setWorkspaceSubTab('view')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    workspaceSubTab === 'view'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  استعراض وبحث
                </button>

                <button
                  onClick={() => setWorkspaceSubTab('organize')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    workspaceSubTab === 'organize'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  تنظيم الصفحات
                </button>

                <button
                  onClick={() => setWorkspaceSubTab('edit')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    workspaceSubTab === 'edit'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  إضافة نصوص وتوقيع
                </button>
              </div>

              {/* Quick Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveModal('compress')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  ضغط PDF
                </button>
                <button
                  onClick={() => setActiveModal('ocr')}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition-colors"
                >
                  التعرف الضوئي OCR
                </button>
                <button
                  onClick={() => setActiveModal('assistant')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>المساعد الذكي</span>
                </button>
              </div>
            </div>

            {/* Sub-view switcher */}
            {activeFile ? (
              <div className="space-y-4">
                {workspaceSubTab === 'organize' && (
                  <PageOrganizer
                    file={activeFile}
                    onUpdateFile={(updated) => setActiveFile(updated)}
                  />
                )}

                {workspaceSubTab === 'edit' && (
                  <div className="space-y-4">
                    <PdfEditor
                      file={activeFile}
                      currentPage={currentPage}
                      onUpdateFile={(updated) => setActiveFile(updated)}
                    />
                    <div className="h-[600px]">
                      <PdfViewer
                        file={activeFile}
                        currentPage={currentPage}
                        onPageChange={setCurrentPage}
                      />
                    </div>
                  </div>
                )}

                {workspaceSubTab === 'view' && (
                  <div className="h-[750px]">
                    <PdfViewer
                      file={activeFile}
                      currentPage={currentPage}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center max-w-xl mx-auto">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800 mb-2">لا يوجد مستند مفتوح حالياً</h3>
                <p className="text-xs text-slate-500 mb-6">يرجى اختيار أو سحب ملف PDF من جهازك لبدء العمل عليه</p>
                <FileDropzone onFileLoaded={handleFileLoaded} />
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 3: SMART ASSISTANT DIRECT ===================== */}
        {activeTab === 'assistant' && (
          <div className="space-y-6">
            <div className="text-center max-w-2xl mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-slate-900">المساعد الذكي للمستندات</h2>
              <p className="text-xs text-slate-500 mt-2">
                تحليل دلالي محلي بالكامل داخل جهازك: تلخيص المستند، استخراج البيانات، إحصاءات الكلمات، وإجابة الأسئلة
              </p>
            </div>

            {activeFile ? (
              <SmartAssistantModal
                file={activeFile}
                onClose={() => setActiveTab('workspace')}
              />
            ) : (
              <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 border border-slate-200 text-center shadow-xs">
                <p className="text-xs text-slate-600 mb-4 font-bold">
                  يرجى فتح ملف PDF لتشغيل المساعد الذكي عليه محلياً:
                </p>
                <FileDropzone onFileLoaded={handleFileLoaded} />
              </div>
            )}
          </div>
        )}

        {/* ===================== VIEW 4: FAQ DIRECT ===================== */}
        {activeTab === 'faq' && <FaqSection />}
      </main>

      {/* ===================== MODALS ===================== */}
      {activeModal === 'merge' && (
        <MergeModal
          initialFile={activeFile}
          onClose={() => setActiveModal(null)}
          onFileMerged={(merged) => {
            setActiveFile(merged);
            setActiveTab('workspace');
          }}
        />
      )}

      {(activeModal === 'convert_img_pdf' ||
        activeModal === 'convert_pdf_img' ||
        activeModal === 'extract_text' ||
        activeModal === 'text_to_pdf') && (
        <ConvertModal
          initialMode={
            activeModal === 'convert_img_pdf'
              ? 'img_to_pdf'
              : activeModal === 'convert_pdf_img'
              ? 'pdf_to_img'
              : activeModal === 'extract_text'
              ? 'extract_text'
              : 'text_to_pdf'
          }
          file={activeFile}
          onClose={() => setActiveModal(null)}
          onFileLoaded={(newFile) => {
            setActiveFile(newFile);
            setActiveTab('workspace');
          }}
        />
      )}

      {activeModal === 'compress' && activeFile && (
        <CompressModal
          file={activeFile}
          onClose={() => setActiveModal(null)}
          onUpdateFile={(updated) => setActiveFile(updated)}
        />
      )}

      {activeModal === 'ocr' && activeFile && (
        <OcrModal
          file={activeFile}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'assistant' && activeFile && (
        <SmartAssistantModal
          file={activeFile}
          onClose={() => setActiveModal(null)}
        />
      )}

      {activeModal === 'privacy' && (
        <PrivacyModal onClose={() => setActiveModal(null)} />
      )}

      {/* Clear Session Confirmation Dialog */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-right">
            <h3 className="font-extrabold text-base text-slate-900 mb-2">تأكيد مسح الجلسة والذاكرة</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              هل أنت متأكد من رغبتك في إغلاق المستند ومسح جميع البيانات المؤقتة من ذاكرة المتصفح؟ لن يتم حفظ أي تعديلات غير منزلة.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleConfirmClear}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-900/10 transition-colors"
              >
                مسح الجلسة فوراً
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 bg-white border-t border-slate-200 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>PDF عربي — المنصة العربية المجانية لأدوات PDF</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium">
            <button
              onClick={() => setActiveModal('privacy')}
              className="hover:text-emerald-800 transition-colors"
            >
              ميثاق الخصوصية
            </button>
            <span>•</span>
            <button
              onClick={() => setActiveTab('faq')}
              className="hover:text-emerald-800 transition-colors"
            >
              الأسئلة الشائعة
            </button>
            <span>•</span>
            <span>معالجة محلية داخل المتصفح بنسبة 100%</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
