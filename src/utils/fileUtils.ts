/**
 * Format bytes to human readable Arabic format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 بايت';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${value} ${sizes[i] || 'بايت'}`;
}

/**
 * Sanitize filename to ensure safe download across all filesystems,
 * preserving Arabic characters, spaces, and safe dashes/underscores.
 */
export function sanitizeFileName(name: string, fallback: string = 'document.pdf'): string {
  if (!name || typeof name !== 'string') return fallback;
  
  // Remove dangerous control characters and filesystem reserved symbols: / \ : * ? " < > |
  const cleaned = name
    .replace(/[\/\\:*?"<>|\x00-\x1F\x7F]/g, '_')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned || cleaned === '.' || cleaned === '..') {
    return fallback;
  }

  // Ensure it has .pdf extension if it's meant to be a PDF
  return cleaned;
}

/**
 * Create PDF Blob safely with strict TypeScript types
 */
export function createPdfBlob(bytes: Uint8Array): Blob {
  return new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' });
}

/**
 * Triggers client-side download without server involvement
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  const safeName = sanitizeFileName(fileName);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = safeName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

/**
 * Safely read File to ArrayBuffer
 */
export function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('فشل قراءة الملف كـ ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('خطأ أثناء قراءة الملف'));
    reader.readAsArrayBuffer(file);
  });
}
