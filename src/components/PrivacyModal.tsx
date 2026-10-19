import React from 'react';
import { ShieldCheck, Lock, EyeOff, ServerOff, WifiOff, FileCheck, CheckCircle2 } from 'lucide-react';

interface PrivacyModalProps {
  onClose: () => void;
}

export const PrivacyModal: React.FC<PrivacyModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 text-right max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-slate-900">ميثاق الخصوصية والأمان الصارم</h3>
              <p className="text-xs text-slate-500">معالجة محلية متطورة تضمن سرية مستنداتك دون خوادم</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1 text-xs text-slate-700 leading-relaxed">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex items-start gap-3">
            <ServerOff className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">معالجة داخل متصفحك بنسبة 100%</h4>
              <p className="text-slate-600 leading-relaxed">
                تتم جميع عمليات قراءة ملفات PDF، دمجها، تقسيمها، تدويرها، ضغطها، وإضافة التوقيعات والعلامات المائية داخل ذاكرة الرام (RAM) الخاصة بمتصفحك فقط عبر تقنيات JavaScript وWeb Workers وWASM. لا يتم رفع أي بايت واحد إلى خوادم خارجية.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">جلسة مؤقتة بدون تخزين دائم</h4>
              <p className="text-slate-600 leading-relaxed">
                لا نقوم بتخزين ملفاتك أو نصوصها في قاعدة بيانات، ولا في التخزين المحلي (LocalStorage أو IndexedDB) افتراضياً. بمجرد النقر على زر «مسح الجلسة» أو إغلاق لسان التبويب، يتم تحرير الذاكرة فوراً وإتلاف المراجع المؤقتة.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <EyeOff className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">الشفافية في التغطية البصرية والتوقيع</h4>
              <p className="text-slate-600 leading-relaxed">
                نحن نميز بدقة بين:
                <br />• <strong>التغطية البصرية:</strong> تغطي المناطق الحساسة بمربعات معتمة، لكن النص الأصلي قد يبقى في بنية الملف الرقمية ما لم يتم تحويل الصفحة إلى صورة.
                <br />• <strong>التوقيع الإلكتروني المرسوم:</strong> هو ختم وتوقيع بصري يعبر عن موافقة المستخدم، وليس شهادة رقمية مشفرة (Digital Certificate) صادرة من جهة تصديق حكومية.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <WifiOff className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">العمل دون إنترنت (Offline Ready)</h4>
              <p className="text-slate-600 leading-relaxed">
                يدعم التطبيق العمل كتطبيق ويب تقدمي (PWA). بعد زيارتك الأولى للموقع، تصبح جميع أدوات PDF الأساسية متاحة وتعمل بكفاءة حتى عند انقطاع الاتصال بالإنترنت تماماً.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-slate-700 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-slate-900 text-sm mb-1">ذكاء اصطناعي محلي خوارزمي دون نماذج سحابية</h4>
              <p className="text-slate-600 leading-relaxed">
                المساعد الذكي للمستندات يعتمد على خوارزميات معالجة لغات طبيعية (NLP) محلية واستدلالات قائمة على قواعد لا تستخدم أي استدعاءات لواجهات برمجة تطبيقات خارجية (APIs)، مما يضمن عدم تسرب أي بيانات تجارية أو شخصية.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end mt-4 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all"
          >
            فهمت، استمرار
          </button>
        </div>
      </div>
    </div>
  );
};
