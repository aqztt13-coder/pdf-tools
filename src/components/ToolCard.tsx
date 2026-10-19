import React from 'react';
import {
  Combine,
  Scissors,
  LayoutGrid,
  FileEdit,
  Stamp,
  ListOrdered,
  EyeOff,
  PenTool,
  Image,
  FileImage,
  FileText,
  PlusSquare,
  Minimize2,
  ScanText,
  Sparkles,
  LucideIcon
} from 'lucide-react';
import { ToolItem } from '../types';

const ICON_MAP: Record<string, LucideIcon> = {
  Combine,
  Scissors,
  LayoutGrid,
  FileEdit,
  Stamp,
  ListOrdered,
  EyeOff,
  PenTool,
  Image,
  FileImage,
  FileText,
  PlusSquare,
  Minimize2,
  ScanText,
  Sparkles,
};

interface ToolCardProps {
  tool: ToolItem;
  onSelect: (toolId: string) => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onSelect }) => {
  const IconComponent = ICON_MAP[tool.iconName] || FileText;

  return (
    <div
      onClick={() => onSelect(tool.id)}
      className="group relative bg-white rounded-2xl p-5 border border-slate-200/90 hover:border-emerald-500/80 shadow-xs hover:shadow-xl hover:shadow-emerald-950/5 transition-all duration-200 flex flex-col justify-between cursor-pointer overflow-hidden text-right"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(tool.id);
        }
      }}
    >
      {/* Top accent bar on hover */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-600 opacity-0 group-hover:opacity-100 transition-opacity" />

      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-slate-100 text-emerald-800 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-700 transition-colors">
            <IconComponent className="w-6 h-6 stroke-[2]" />
          </div>

          <div className="flex items-center gap-1.5">
            {tool.badge && (
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                {tool.badge}
              </span>
            )}
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                tool.offlineReady
                  ? 'bg-slate-100 text-slate-600 border-slate-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}
            >
              {tool.offlineReady ? 'أوفلاين' : 'يتطلب تحميل'}
            </span>
          </div>
        </div>

        <h3 className="text-base font-bold text-slate-900 group-hover:text-emerald-800 transition-colors mb-2">
          {tool.title}
        </h3>

        <p className="text-xs text-slate-600 leading-relaxed">
          {tool.description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
        <span>فتح الأداة</span>
        <span className="transform group-hover:-translate-x-1 transition-transform">←</span>
      </div>
    </div>
  );
};
