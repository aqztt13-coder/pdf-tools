import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  BookOpen,
  Calendar,
  Mail,
  Phone,
  DollarSign,
  Clock,
  FileCheck,
  Send,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import { LoadedPdfFile, DocumentAnalysisResult } from '../types';
import { extractAllTextFromPdf } from '../services/pdf/pdfViewerService';
import { analyzeDocumentText, answerQuestionFromText } from '../utils/textAnalysis';

interface SmartAssistantModalProps {
  file: LoadedPdfFile;
  onClose: () => void;
}

export const SmartAssistantModal: React.FC<SmartAssistantModalProps> = ({
  file,
  onClose,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [analysis, setAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [fullExtractedText, setFullExtractedText] = useState<string>('');

  // Interactive Q&A state
  const [questionInput, setQuestionInput] = useState<string>('');
  const [chatHistory, setChatHistory] = useState<{ sender: 'user' | 'assistant'; text: string }[]>([
    {
      sender: 'assistant',
      text: 'مرحباً بك! أنا مساعد المستندات الذكي المحلي. أعمل داخل متصفحك بالكامل دون إرسال أي نص إلى خوادم خارجية. يمكنك سؤالي عن تواريخ، مبالغ، أسماء، أو تفاصيل واردة في هذا المستند.',
    },
  ]);

  useEffect(() => {
    let isMounted = true;

    async function runLocalAnalysis() {
      setLoading(true);
      try {
        const pageTexts = await extractAllTextFromPdf(file.arrayBuffer);
        const combined = pageTexts.map(p => p.text).join('\n\n');

        if (isMounted) {
          setFullExtractedText(combined);
          const result = analyzeDocumentText(pageTexts, file.pageCount || 1);
          setAnalysis(result);
        }
      } catch (err) {
        console.error('Error analyzing document:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    runLocalAnalysis();
    return () => {
      isMounted = false;
    };
  }, [file.arrayBuffer, file.pageCount]);

  const handleAskQuestion = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!questionInput.trim() || !fullExtractedText) return;

    const userQ = questionInput.trim();
    setQuestionInput('');

    // Append user question
    const updatedHistory = [...chatHistory, { sender: 'user' as const, text: userQ }];
    setChatHistory(updatedHistory);

    // Run local semantic matching
    const answerResult = answerQuestionFromText(userQ, fullExtractedText);

    setTimeout(() => {
      setChatHistory(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: answerResult.answer,
        },
      ]);
    }, 150);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-900/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-lg text-slate-900">المساعد الذكي للمستندات</h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  محلي 100% بدون خوادم
                </span>
              </div>
              <p className="text-xs text-slate-500">تحليل المحتوى، استخراج الأرقام والتواريخ، وتلخيص المستند محلياً</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">جارٍ قراءة وفحص نصوص المستند محلياً...</p>
            <p className="text-xs text-slate-400 mt-1">تتم المعالجة دون إرسال أي معلومة إلى أي خادم خارجي</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto mt-4 space-y-6 pr-1">
            {/* Quick Stats Grid */}
            {analysis && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">عدد الكلمات</div>
                    <div className="text-sm font-extrabold text-slate-900">{analysis.totalWords}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">وقت القراءة المقدر</div>
                    <div className="text-sm font-extrabold text-slate-900">{analysis.estimatedReadingTimeMinutes} دقيقة</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
                    <FileCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">صفحات بها نصوص</div>
                    <div className="text-sm font-extrabold text-slate-900">{analysis.pagesWithText} من {analysis.totalPages}</div>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Lightbulb className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500 font-medium">بيانات مستخرجة</div>
                    <div className="text-sm font-extrabold text-slate-900">{analysis.entities.length} عنصر</div>
                  </div>
                </div>
              </div>
            )}

            {/* Extractive Summary */}
            {analysis && analysis.summary.length > 0 && (
              <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                <h4 className="text-xs font-extrabold text-emerald-950 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-700" />
                  <span>الملخص المنظم لأهم فقرات المستند:</span>
                </h4>
                <div className="space-y-2">
                  {analysis.summary.map((sentence, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-emerald-900 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0"></span>
                      <span>{sentence}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Entities Section */}
            {analysis && analysis.entities.length > 0 && (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-extrabold text-slate-900 mb-3">
                  البيانات والمعلومات الرقمية المستخرجة:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.entities.map((ent, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-800 shadow-2xs"
                    >
                      {ent.type === 'email' && <Mail className="w-3.5 h-3.5 text-blue-600" />}
                      {ent.type === 'phone' && <Phone className="w-3.5 h-3.5 text-emerald-600" />}
                      {ent.type === 'date' && <Calendar className="w-3.5 h-3.5 text-purple-600" />}
                      {ent.type === 'currency' && <DollarSign className="w-3.5 h-3.5 text-amber-600" />}
                      <span className="font-bold text-slate-500">{ent.label}:</span>
                      <span className="font-semibold text-slate-900" dir="ltr">{ent.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggested Search Keywords */}
            {analysis && analysis.keyTopics.length > 0 && (
              <div>
                <span className="text-xs font-bold text-slate-700 block mb-2">الكلمات المفتاحية الأكثر تكراراً:</span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.keyTopics.map((k, i) => (
                    <button
                      key={i}
                      onClick={() => setQuestionInput(`ما هو سياق كلمة ${k.word} في المستند؟`)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 text-xs font-medium text-slate-700 transition-colors"
                    >
                      #{k.word} ({k.count})
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Interactive Q&A Assistant Chat */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50 flex flex-col">
              <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>اسأل عن أي معلومة داخل المستند (بحث دلالي محلي):</span>
                <span className="text-[10px] text-slate-500">لا يتم استخدام نماذج سحابية</span>
              </div>

              {/* Chat Messages */}
              <div className="p-4 space-y-3 max-h-56 overflow-y-auto">
                {chatHistory.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-start' : 'items-end'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-emerald-700 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
              </div>

              {/* Question Input Form */}
              <form onSubmit={handleAskQuestion} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="مثال: ما هو تاريخ العقد؟ أو ما هي الرسوم المذكورة؟"
                  value={questionInput}
                  onChange={(e) => setQuestionInput(e.target.value)}
                  className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:outline-emerald-600"
                />
                <button
                  type="submit"
                  disabled={!questionInput.trim()}
                  className="p-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white disabled:opacity-40 transition-colors"
                  title="إرسال السؤال"
                >
                  <Send className="w-4 h-4 transform rotate-180" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
