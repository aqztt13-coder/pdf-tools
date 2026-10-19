import React, { useState, useEffect } from 'react';
import { FileText, ShieldCheck, Wifi, WifiOff, Trash2, HelpCircle, Sparkles, Grid } from 'lucide-react';

interface NavbarProps {
  currentTab: 'tools' | 'workspace' | 'assistant' | 'privacy' | 'faq';
  onSelectTab: (tab: 'tools' | 'workspace' | 'assistant' | 'privacy' | 'faq') => void;
  hasActiveFile: boolean;
  onClearSession: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  hasActiveFile,
  onClearSession,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onSelectTab('tools')}>
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 flex items-center justify-center text-white shadow-md shadow-emerald-900/10 ring-2 ring-emerald-600/20">
              <FileText className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-2xl text-slate-900 tracking-tight">PDF عربي</span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  مجاني 100%
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">معالجة محلية آمنة داخل المتصفح بدون خوادم</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('tools')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'tools'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Grid className="w-4 h-4 text-emerald-700" />
              <span>الأدوات</span>
            </button>

            {hasActiveFile && (
              <button
                onClick={() => onSelectTab('workspace')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentTab === 'workspace'
                    ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>المستند الحالي</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('assistant')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'assistant'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>المساعد الذكي</span>
            </button>

            <button
              onClick={() => onSelectTab('privacy')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'privacy'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>الخصوصية والأمان</span>
            </button>

            <button
              onClick={() => onSelectTab('faq')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'faq'
                  ? 'bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <HelpCircle className="w-4 h-4 text-slate-500" />
              <span>الأسئلة الشائعة</span>
            </button>
          </nav>

          {/* Right Side Status & Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Offline Status */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                isOnline
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
              title={isOnline ? 'متصل بالإنترنت — كل العمليات تتم محلياً' : 'وضع عدم الاتصال — الأدوات الأساسية تعمل دون إنترنت'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">متصل</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>دون إنترنت</span>
                </>
              )}
            </div>

            {/* Clear Session Button */}
            {hasActiveFile && (
              <button
                onClick={onClearSession}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-colors"
                title="مسح المستند المؤقت من ذاكرة المتصفح تماماً"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">مسح الجلسة</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
