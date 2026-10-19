export type ToolCategory = 'organize' | 'edit' | 'convert' | 'security' | 'assistant';

export interface ToolItem {
  id: string;
  title: string;
  description: string;
  category: ToolCategory;
  iconName: string;
  badge?: string;
  offlineReady: boolean;
}

export interface LoadedPdfFile {
  id: string;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
  uploadedAt: Date;
}

export interface PageInfo {
  pageNumber: number; // 1-indexed
  originalIndex: number; // 0-indexed
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
  thumbnailUrl?: string;
  width: number;
  height: number;
}

export type AnnotationType = 'text' | 'visual_cover' | 'drawing' | 'signature' | 'watermark' | 'page_number';

export interface BaseAnnotation {
  id: string;
  pageNumber: number; // 1-indexed
  type: AnnotationType;
  x: number; // relative [0, 1] or points
  y: number; // relative [0, 1] or points
  width: number;
  height: number;
}

export interface TextAnnotation extends BaseAnnotation {
  type: 'text';
  text: string;
  fontSize: number;
  color: string; // hex
  backgroundColor?: string;
  isBold?: boolean;
}

export interface VisualCoverAnnotation extends BaseAnnotation {
  type: 'visual_cover';
  color: string; // usually #ffffff or #000000
}

export interface DrawingAnnotation extends BaseAnnotation {
  type: 'drawing';
  svgPath: string;
  strokeColor: string;
  strokeWidth: number;
}

export interface SignatureAnnotation extends BaseAnnotation {
  type: 'signature';
  imageDataUrl: string; // png data url
}

export type PageAnnotation = TextAnnotation | VisualCoverAnnotation | DrawingAnnotation | SignatureAnnotation;

export interface WatermarkOptions {
  text: string;
  color: string;
  opacity: number;
  fontSize: number;
  rotation: number; // e.g. 45 degrees
}

export interface PageNumberOptions {
  position: 'bottom-center' | 'bottom-right' | 'bottom-left' | 'top-center' | 'top-right' | 'top-left';
  format: 'page_of_total' | 'simple_number' | 'arabic_words'; // "صفحة X من Y" or "X"
  fontSize: number;
  color: string;
}

export interface ExtractedEntity {
  type: 'date' | 'phone' | 'email' | 'number' | 'currency' | 'keyword';
  value: string;
  label: string;
  context?: string;
}

export interface DocumentAnalysisResult {
  totalWords: number;
  totalCharacters: number;
  estimatedReadingTimeMinutes: number;
  pagesWithText: number;
  totalPages: number;
  summary: string[];
  keyTopics: { word: string; count: number }[];
  entities: ExtractedEntity[];
}

export interface CompressPreset {
  id: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  targetDpi: number;
  jpegQuality: number;
}
