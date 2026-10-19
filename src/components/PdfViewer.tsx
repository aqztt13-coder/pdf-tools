import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Search,
  RefreshCw,
  FileText
} from 'lucide-react';
import { LoadedPdfFile } from '../types';
import {
  getPdfJsDocument,
  renderPageToCanvas,
  renderPageThumbnail,
  searchInPdf
} from '../services/pdf/pdfViewerService';

interface PdfViewerProps {
  file: LoadedPdfFile;
  currentPage: number;
  onPageChange: (page: number) => void;
  children?: React.ReactNode; // Optional overlay for annotations/editor
}

export const PdfViewer: React.FC<PdfViewerProps> = ({
  file,
  currentPage,
  onPageChange,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [loading, setLoading] = useState<boolean>(true);
  const [pdfJsDoc, setPdfJsDoc] = useState<any>(null);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(true);

  // Search in document
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ pageNumber: number; matchesCount: number; snippet: string }[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchBox, setShowSearchBox] = useState<boolean>(false);

  // Load PDF.js Document
  useEffect(() => {
    let active = true;

    async function loadDoc() {
      setLoading(true);
      try {
        const doc = await getPdfJsDocument(file.arrayBuffer);
        if (!active) return;
        setPdfJsDoc(doc);
        setTotalPages(doc.numPages);

        // Load thumbnails lazily
        const thumbs: string[] = [];
        for (let i = 1; i <= Math.min(doc.numPages, 30); i++) {
          const t = await renderPageThumbnail(doc, i, 120);
          thumbs.push(t);
        }
        if (active) setThumbnails(thumbs);
      } catch (err) {
        console.error('Error loading PDF document:', err);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDoc();
    return () => {
      active = false;
    };
  }, [file.arrayBuffer]);

  // Render current page when page or scale changes
  useEffect(() => {
    if (!pdfJsDoc || !canvasRef.current) return;

    let cancel = false;
    async function render() {
      setLoading(true);
      try {
        if (canvasRef.current) {
          await renderPageToCanvas(pdfJsDoc, currentPage, canvasRef.current, scale);
        }
      } catch (err) {
        console.error('Render page error:', err);
      } finally {
        if (!cancel) setLoading(false);
      }
    }

    render();
    return () => {
      cancel = true;
    };
  }, [pdfJsDoc, currentPage, scale]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 3.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));
  const handleFitWidth = () => setScale(1.4);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const results = await searchInPdf(file.arrayBuffer, searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
      {/* Top Viewer Control Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-sm">
        {/* Page Navigation */}
        <div className="flex items-center gap-2">
          {/* Note in RTL: next is visually left, prev is visually right */}
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="الصفحة السابقة"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 font-bold text-slate-800">
            <span>صفحة</span>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= totalPages) {
                  onPageChange(val);
                }
              }}
              className="w-14 text-center py-1 px-1.5 border border-slate-300 rounded-md bg-slate-50 text-xs font-bold"
            />
            <span className="text-slate-500 font-normal">من {totalPages}</span>
          </div>

          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 disabled:opacity-30 transition-colors"
            title="الصفحة التالية"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <button
            onClick={handleZoomOut}
            disabled={scale <= 0.5}
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition-colors"
            title="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-bold px-2 text-slate-700 min-w-14 text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={handleZoomIn}
            disabled={scale >= 3.0}
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 disabled:opacity-30 transition-colors"
            title="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            onClick={handleFitWidth}
            className="p-1.5 rounded-lg hover:bg-white text-slate-700 transition-colors"
            title="ملاءمة العرض"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Sidebar Toggles */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSearchBox(!showSearchBox)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showSearchBox ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            <span>البحث بالنص</span>
          </button>

          <button
            onClick={() => setShowThumbnails(!showThumbnails)}
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
              showThumbnails ? 'bg-slate-100 text-slate-900 border-slate-300' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>المصغرات</span>
          </button>
        </div>
      </div>

      {/* In-Document Search Box Bar */}
      {showSearchBox && (
        <div className="bg-emerald-50/70 border-b border-emerald-100 p-3 flex flex-wrap items-center gap-3">
          <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-emerald-200">
            <Search className="w-4 h-4 text-emerald-600 shrink-0" />
            <input
              type="text"
              placeholder="ابحث عن كلمة أو عبارة داخل المستند..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full text-xs bg-transparent focus:outline-hidden"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors"
          >
            {isSearching ? 'جارٍ البحث...' : 'بحث'}
          </button>

          {searchResults.length > 0 && (
            <div className="w-full flex items-center gap-2 overflow-x-auto py-1 text-xs">
              <span className="font-bold text-emerald-900">النتائج:</span>
              {searchResults.map((res) => (
                <button
                  key={res.pageNumber}
                  onClick={() => onPageChange(res.pageNumber)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold border transition-colors ${
                    currentPage === res.pageNumber
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  صفحة {res.pageNumber} ({res.matchesCount})
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Content Area: Thumbnails + Canvas View */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Thumbnails Sidebar */}
        {showThumbnails && (
          <aside className="hidden sm:block w-36 bg-slate-50 border-l border-slate-200 overflow-y-auto p-3 shrink-0">
            <div className="text-[11px] font-bold text-slate-500 mb-2 px-1">الصفحات</div>
            <div className="space-y-3">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                const isCurrent = pageNum === currentPage;
                const thumb = thumbnails[i];
                return (
                  <div
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`cursor-pointer rounded-xl p-1.5 border-2 transition-all flex flex-col items-center text-center ${
                      isCurrent
                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-full aspect-[1/1.4] bg-white rounded-md border border-slate-100 flex items-center justify-center overflow-hidden mb-1">
                      {thumb ? (
                        <img src={thumb} alt={`ص ${pageNum}`} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400">...</span>
                      )}
                    </div>
                    <span className={`text-[10px] font-bold ${isCurrent ? 'text-emerald-800' : 'text-slate-600'}`}>
                      {pageNum}
                    </span>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* Canvas Display Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-auto p-4 sm:p-8 flex items-start justify-center relative bg-slate-200/70"
        >
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-xs flex items-center justify-center z-20">
              <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-lg border border-slate-200 text-xs font-bold text-slate-700">
                <RefreshCw className="w-4 h-4 text-emerald-600 animate-spin" />
                <span>جارٍ العرض...</span>
              </div>
            </div>
          )}

          {/* Canvas Wrapper with optional overlay children */}
          <div className="relative shadow-2xl rounded-lg overflow-hidden bg-white">
            <canvas ref={canvasRef} className="block max-w-none" />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
