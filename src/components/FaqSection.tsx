import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'هل يتم رفع مستنداتي أو صوري إلى أي خادم خارجي؟',
    a: 'قطعاً لا. تعمل منصة «PDF عربي» بالكامل داخل متصفح الإنترنت على جهازك عبر JavaScript وWeb Workers وWASM. لا يوجد أي خادم يستقبل ملفاتك أو يخزنها، مما يوفر أقصى معايير الأمان المالي والقانوني والشخصي.'
  },
  {
    q: 'هل المنصة مجانية بالكامل، وهل تتطلب اشتراكاً أو تسجيلاً؟',
    a: 'المنصة مجانية 100% لجميع الأدوات دون أي رسوم أو اشتراكات، ولا تتطلب إنشاء حساب أو تسجيل دخول، ولا توجد حدود تعسفية لعدد العمليات اليومية.'
  },
  {
    q: 'هل يمكن استخدام الموقع في وضع عدم الاتصال (Offline)؟',
    a: 'نعم! يدعم الموقع تقنية تطبيقات الويب التقدمية (PWA) مع Service Worker. بعد زيارة الموقع لأول مرة، يمكنك تشغيل جميع الأدوات الأساسية (الدمج، التقسيم، التدوير، إضافة النصوص والعلامات المائية، التوقيع، وضغط الملفات) دون وجود اتصال بالإنترنت.'
  },
  {
    q: 'ما هو الفرق بين إضافة نص جديد وتعديل النص الأصلي للـ PDF؟',
    a: 'ملفات PDF ليست ملفات معالجة نصوص مثل Word؛ فهي رسومات متجهة وأسطر مطبوعة ثابتة. تتيح أداتنا إضافة نصوص وعناوين جديدة فوق المستند، أو تغطية مناطق وإضافة نصوص بديلة. أما تعديل حروف النص الأصلي مع الحفاظ على الخطوط الدفينة الخاصة فغير مدعوم لتجنب تلف المستندات.'
  },
  {
    q: 'كيف يعمل التعرف الضوئي على النصوص (OCR) للغة العربية؟',
    a: 'يقوم التطبيق بتحويل صفحات PDF المطلوبة إلى صور فائقة الدقة داخل المتصفح، ثم يمررها إلى محرك Tesseract.js المدرب على قراءة الحروف والكلمات العربية. يتطلب النموذج تنزيل ملف اللغة لأول مرة فقط، ثم يتم حفظه محلياً في متصفحك.'
  },
  {
    q: 'كيف يعمل المساعد الذكي للمستندات دون ذكاء اصطناعي سحابي؟',
    a: 'يعتمد المساعد على خوارزميات معالجة لغة طبيعية (NLP) محلية تحسب تردد الكلمات المفتاحية وأوزان الجمل لإنشاء ملخص منظم، وتستخرج التواريخ وأرقام الهواتف والمبالغ المالية والبريد الإلكتروني باستخدام تعابير نمطية منتظمة وتحليل سياقي فوري دون رفع أي بيانات.'
  },
];

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs">
      <div className="text-center max-w-2xl mx-auto mb-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">الأسئلة الشائعة حول منصة PDF عربي</h2>
        <p className="text-xs text-slate-500 mt-2">إجابات شفافة ومفصلة حول طريقة المعالجة والخصوصية والأمان</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((faq, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen ? 'border-emerald-500 bg-emerald-50/20 shadow-xs' : 'border-slate-200 bg-slate-50 hover:bg-slate-100/70'
              }`}
            >
              <button
                onClick={() => toggle(index)}
                className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 font-bold text-sm text-slate-900"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-emerald-700 shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-slate-600 leading-relaxed border-t border-emerald-100/60 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
