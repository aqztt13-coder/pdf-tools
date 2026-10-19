import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib';
import type { WatermarkOptions, PageNumberOptions, PageAnnotation } from '../../types/index.ts';

/**
 * Creates a valid, clean sample PDF document for instant demonstration
 */
export async function createSamplePdf(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const regularFont = await doc.embedFont(StandardFonts.Helvetica);

  // Page 1: Welcome & Overview
  const page1 = doc.addPage([595.28, 841.89]); // A4
  const { width: p1W, height: p1H } = page1.getSize();

  // Top header banner
  page1.drawRectangle({
    x: 0,
    y: p1H - 90,
    width: p1W,
    height: 90,
    color: rgb(0.02, 0.31, 0.23), // Dark emerald
  });

  page1.drawText('PDF ARABI - SAMPLE DOCUMENT', {
    x: 50,
    y: p1H - 55,
    size: 22,
    font,
    color: rgb(0.95, 0.99, 0.97),
  });

  page1.drawText('Page 1 of 3: Overview & Introduction', {
    x: 50,
    y: p1H - 130,
    size: 15,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  const lines1 = [
    'Welcome to PDF Arabi - The Free Arabic PDF Platform.',
    'All processing happens 100% locally in your browser with zero server uploads.',
    'This sample document contains 3 pages designed for testing tools:',
    '- Merge, Split, Reorder, Rotate, and Delete pages.',
    '- Add Text, Visual Redaction Boxes, Watermarks, and Page Numbers.',
    '- Draw signatures and fill form fields.',
    '- Compress PDF and analyze document statistics with the Local Smart Assistant.',
    'Date: 2025-05-15 | Contact: info@pdf-arabi.com | Ref: SA-99201'
  ];

  let yPos = p1H - 170;
  for (const line of lines1) {
    page1.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: regularFont,
      color: rgb(0.2, 0.25, 0.3),
    });
    yPos -= 24;
  }

  // Page 2: Table / Data for extraction testing
  const page2 = doc.addPage([595.28, 841.89]);
  const { height: p2H } = page2.getSize();

  page2.drawRectangle({
    x: 0,
    y: p2H - 70,
    width: p1W,
    height: 70,
    color: rgb(0.05, 0.45, 0.33),
  });

  page2.drawText('Page 2 of 3: Financial & Metadata Sample', {
    x: 50,
    y: p2H - 45,
    size: 18,
    font,
    color: rgb(1, 1, 1),
  });

  const lines2 = [
    'This page includes structured numbers and data for the Local Assistant to extract:',
    'Contract Value: 25000 SAR (Saudi Riyals)',
    'Consulting Fees: 4500 SAR',
    'Customer Support Hotline: 0501234567 or +966501234567',
    'Email Address: support@pdf-arabi.com',
    'Contract Renewal Date: 2025-12-31',
    'Terms & Conditions:',
    '1. The client retains full confidentiality and data privacy.',
    '2. No document content is transmitted across public networks.',
    '3. Offline mode enables processing without an active internet connection.'
  ];

  yPos = p2H - 110;
  for (const line of lines2) {
    page2.drawText(line, {
      x: 50,
      y: yPos,
      size: 11,
      font: regularFont,
      color: rgb(0.15, 0.2, 0.25),
    });
    yPos -= 24;
  }

  // Page 3: Signature & Authorization
  const page3 = doc.addPage([595.28, 841.89]);
  const { height: p3H } = page3.getSize();

  page3.drawRectangle({
    x: 0,
    y: p3H - 70,
    width: p1W,
    height: 70,
    color: rgb(0.1, 0.2, 0.3),
  });

  page3.drawText('Page 3 of 3: Verification & Signatures', {
    x: 50,
    y: p3H - 45,
    size: 18,
    font,
    color: rgb(1, 1, 1),
  });

  page3.drawText('Authorization and Sign-off Section:', {
    x: 50,
    y: p3H - 120,
    size: 13,
    font,
    color: rgb(0.1, 0.1, 0.1),
  });

  page3.drawText('You can test the Signature tool on this page by drawing or placing your signature below:', {
    x: 50,
    y: p3H - 150,
    size: 11,
    font: regularFont,
    color: rgb(0.3, 0.35, 0.4),
  });

  // Signature box
  page3.drawRectangle({
    x: 50,
    y: p3H - 280,
    width: 250,
    height: 100,
    borderColor: rgb(0.6, 0.7, 0.8),
    borderWidth: 1.5,
    color: rgb(0.98, 0.99, 1),
  });

  page3.drawText('Place signature here [Authorized Signatory]', {
    x: 65,
    y: p3H - 270,
    size: 10,
    font: regularFont,
    color: rgb(0.6, 0.65, 0.7),
  });

  return await doc.save();
}

/**
 * Merge multiple PDF ArrayBuffers into a single PDF
 */
export async function mergePdfs(pdfBuffers: ArrayBuffer[]): Promise<Uint8Array> {
  if (pdfBuffers.length === 0) {
    throw new Error('يرجى تحديد ملف واحد على الأقل للدمج');
  }

  const mergedDoc = await PDFDocument.create();

  for (const buffer of pdfBuffers) {
    const doc = await PDFDocument.load(buffer.slice(0), { ignoreEncryption: true });
    const copiedPages = await mergedDoc.copyPages(doc, doc.getPageIndices());
    for (const page of copiedPages) {
      mergedDoc.addPage(page);
    }
  }

  return await mergedDoc.save({ useObjectStreams: true });
}

/**
 * Extract specific pages into a new PDF
 */
export async function extractPages(pdfBuffer: ArrayBuffer, pageNumbers1Indexed: number[]): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const totalPages = srcDoc.getPageCount();
  const validIndices = pageNumbers1Indexed
    .map(p => p - 1)
    .filter(idx => idx >= 0 && idx < totalPages);

  if (validIndices.length === 0) {
    throw new Error('لم يتم تحديد صفحات صالحة للاستخراج');
  }

  const newDoc = await PDFDocument.create();
  const copiedPages = await newDoc.copyPages(srcDoc, validIndices);
  for (const page of copiedPages) {
    newDoc.addPage(page);
  }

  return await newDoc.save({ useObjectStreams: true });
}

/**
 * Reorder, rotate, or delete pages
 */
export async function reorderAndModifyPages(
  pdfBuffer: ArrayBuffer,
  pageModifications: { originalIndex: number; rotation: number; deleted: boolean }[]
): Promise<Uint8Array> {
  const srcDoc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const newDoc = await PDFDocument.create();

  const activePages = pageModifications.filter(p => !p.deleted);
  if (activePages.length === 0) {
    throw new Error('لا يمكن حفظ مستند فارغ بدون صفحات');
  }

  for (const mod of activePages) {
    const [copiedPage] = await newDoc.copyPages(srcDoc, [mod.originalIndex]);
    if (mod.rotation !== 0) {
      const currentRotation = copiedPage.getRotation().angle;
      copiedPage.setRotation(degrees((currentRotation + mod.rotation) % 360));
    }
    newDoc.addPage(copiedPage);
  }

  return await newDoc.save({ useObjectStreams: true });
}

/**
 * Duplicate a page and place it after the original
 */
export async function duplicatePage(pdfBuffer: ArrayBuffer, pageIndex0Indexed: number): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const [copiedPage] = await doc.copyPages(doc, [pageIndex0Indexed]);
  doc.insertPage(pageIndex0Indexed + 1, copiedPage);
  return await doc.save({ useObjectStreams: true });
}

/**
 * Renders text (especially Arabic RTL) to a high-res transparent PNG data URL using canvas
 */
export function renderTextToPngDataUrl(
  text: string,
  fontSize: number = 18,
  color: string = '#000000',
  backgroundColor?: string,
  isBold?: boolean
): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const scale = 2; // 2x for retina sharpness
    const scaledSize = fontSize * scale;
    const fontStyle = `${isBold ? 'bold ' : ''}${scaledSize}px 'Cairo', system-ui, sans-serif`;
    ctx.font = fontStyle;
    const metrics = ctx.measureText(text);
    const textWidth = Math.ceil(metrics.width) + (24 * scale);
    const textHeight = Math.ceil(scaledSize * 2.2);

    canvas.width = textWidth;
    canvas.height = textHeight;

    ctx.font = fontStyle;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'right';
    ctx.direction = 'rtl';

    if (backgroundColor && backgroundColor !== 'transparent') {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, textWidth, textHeight);
    }

    ctx.fillStyle = color;
    ctx.fillText(text, textWidth - (12 * scale), textHeight / 2);

    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

/**
 * Add watermark text to all or specific pages with full Arabic support
 */
export async function addWatermarkToPdf(
  pdfBuffer: ArrayBuffer,
  options: WatermarkOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const pages = doc.getPages();
  const isBrowser = typeof document !== 'undefined';
  const hasNonAscii = /[^\x20-\x7E]/.test(options.text);

  // If in browser and text has Arabic or non-ASCII characters, render as high-DPI transparent PNG
  if (isBrowser && hasNonAscii) {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const scaledSize = options.fontSize * 2;
        ctx.font = `bold ${scaledSize}px 'Cairo', system-ui, sans-serif`;
        const metrics = ctx.measureText(options.text);
        const w = Math.ceil(metrics.width) + 40;
        const h = Math.ceil(scaledSize * 2);
        canvas.width = w;
        canvas.height = h;

        ctx.font = `bold ${scaledSize}px 'Cairo', system-ui, sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.direction = 'rtl';
        ctx.fillStyle = options.color;
        ctx.fillText(options.text, w / 2, h / 2);

        const pngUrl = canvas.toDataURL('image/png');
        const pngImg = await doc.embedPng(pngUrl);
        const drawW = pngImg.width / 2;
        const drawH = pngImg.height / 2;

        for (const page of pages) {
          const { width, height } = page.getSize();
          page.drawImage(pngImg, {
            x: width / 2 - drawW / 2,
            y: height / 2 - drawH / 2,
            width: drawW,
            height: drawH,
            opacity: options.opacity,
            rotate: degrees(options.rotation || 45),
          });
        }

        return await doc.save({ useObjectStreams: true });
      }
    } catch (err) {
      console.warn('Canvas watermark fallback:', err);
    }
  }

  // Fallback for standard ASCII or Node test runner
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const hex = options.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.8;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.2;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.2;

  // Safe ASCII representation for standard font
  const safeText = options.text.replace(/[^\x20-\x7E]/g, '?');

  for (const page of pages) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(safeText, options.fontSize);
    const textHeight = font.heightAtSize(options.fontSize);

    page.drawText(safeText, {
      x: width / 2 - textWidth / 2,
      y: height / 2 - textHeight / 2,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
      opacity: options.opacity,
      rotate: degrees(options.rotation || 45),
    });
  }

  return await doc.save({ useObjectStreams: true });
}

/**
 * Add page numbers to all pages
 */
export async function addPageNumbersToPdf(
  pdfBuffer: ArrayBuffer,
  options: PageNumberOptions
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const total = pages.length;

  const hex = options.color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255 || 0.2;
  const g = parseInt(hex.substring(2, 4), 16) / 255 || 0.2;
  const b = parseInt(hex.substring(4, 6), 16) / 255 || 0.2;

  for (let i = 0; i < total; i++) {
    const page = pages[i];
    const { width, height } = page.getSize();
    const pageNum = i + 1;

    let numStr = `${pageNum} / ${total}`;
    if (options.format === 'simple_number') {
      numStr = `${pageNum}`;
    } else if (options.format === 'page_of_total') {
      numStr = `Page ${pageNum} of ${total}`;
    }

    const textWidth = font.widthOfTextAtSize(numStr, options.fontSize);
    let x = width / 2 - textWidth / 2;
    let y = 30; // bottom margin

    if (options.position.includes('left')) x = 40;
    if (options.position.includes('right')) x = width - textWidth - 40;
    if (options.position.startsWith('top')) y = height - 40;

    page.drawText(numStr, {
      x,
      y,
      size: options.fontSize,
      font,
      color: rgb(r, g, b),
    });
  }

  return await doc.save({ useObjectStreams: true });
}

/**
 * Apply annotations (Text, Visual Cover, Signature, Shapes)
 */
export async function applyAnnotationsToPdf(
  pdfBuffer: ArrayBuffer,
  annotations: PageAnnotation[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBuffer.slice(0), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const ann of annotations) {
    const pageIndex = ann.pageNumber - 1;
    if (pageIndex < 0 || pageIndex >= pages.length) continue;
    const page = pages[pageIndex];
    const { width, height } = page.getSize();

    // Coordinates in our app are relative [0, 1] from top-left,
    // whereas PDF coordinates are points from bottom-left
    const ptX = ann.x * width;
    const ptW = ann.width * width;
    const ptH = ann.height * height;
    const ptY = height - (ann.y * height) - ptH;

    if (ann.type === 'text') {
      const isBrowser = typeof document !== 'undefined';
      const hasNonAscii = /[^\x20-\x7E]/.test(ann.text || '');

      if (isBrowser && hasNonAscii) {
        try {
          const textPng = renderTextToPngDataUrl(
            ann.text || '',
            ann.fontSize || 14,
            ann.color || '#000000',
            ann.backgroundColor,
            ann.isBold
          );
          if (textPng) {
            const pngImg = await doc.embedPng(textPng);
            const drawW = pngImg.width / 2;
            const drawH = pngImg.height / 2;
            page.drawImage(pngImg, {
              x: ptX,
              y: ptY,
              width: drawW,
              height: drawH,
            });
            continue;
          }
        } catch (err) {
          console.warn('Canvas text fallback:', err);
        }
      }

      const hex = (ann.color || '#000000').replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
      const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
      const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

      if (ann.backgroundColor && ann.backgroundColor !== 'transparent') {
        page.drawRectangle({
          x: ptX,
          y: ptY,
          width: ptW,
          height: ptH,
          color: rgb(1, 1, 1),
          opacity: 0.9,
        });
      }

      const safeText = (ann.text || '').replace(/[^\x20-\x7E]/g, '?');
      page.drawText(safeText, {
        x: ptX + 4,
        y: ptY + ptH - ann.fontSize - 2,
        size: ann.fontSize || 14,
        font: ann.isBold ? boldFont : font,
        color: rgb(r, g, b),
      });
    } else if (ann.type === 'visual_cover') {
      const isBlack = ann.color === '#000000';
      page.drawRectangle({
        x: ptX,
        y: ptY,
        width: ptW,
        height: ptH,
        color: isBlack ? rgb(0, 0, 0) : rgb(1, 1, 1),
      });
    } else if (ann.type === 'signature') {
      try {
        if (ann.imageDataUrl.startsWith('data:image/png')) {
          const pngImage = await doc.embedPng(ann.imageDataUrl);
          page.drawImage(pngImage, {
            x: ptX,
            y: ptY,
            width: ptW,
            height: ptH,
          });
        } else if (ann.imageDataUrl.startsWith('data:image/jpeg') || ann.imageDataUrl.startsWith('data:image/jpg')) {
          const jpgImage = await doc.embedJpg(ann.imageDataUrl);
          page.drawImage(jpgImage, {
            x: ptX,
            y: ptY,
            width: ptW,
            height: ptH,
          });
        }
      } catch (err) {
        console.warn('Could not embed signature image:', err);
      }
    }
  }

  return await doc.save({ useObjectStreams: true });
}

/**
 * Converts image files (data URLs) into a single PDF
 */
export async function imagesToPdf(
  images: { dataUrl: string; width: number; height: number }[]
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  for (const img of images) {
    let embeddedImg;
    if (img.dataUrl.startsWith('data:image/png')) {
      embeddedImg = await doc.embedPng(img.dataUrl);
    } else {
      embeddedImg = await doc.embedJpg(img.dataUrl);
    }

    // Standard A4 aspect or custom image aspect
    const imgWidth = embeddedImg.width;
    const imgHeight = embeddedImg.height;

    // Use page sized to image, capped at reasonable resolution
    const page = doc.addPage([imgWidth, imgHeight]);
    page.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: imgWidth,
      height: imgHeight,
    });
  }

  return await doc.save({ useObjectStreams: true });
}

/**
 * Creates a brand new PDF from arbitrary user text with clean typography and layout
 */
export async function createPdfFromText(text: string, title?: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const boldFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const lines = text.split('\n');
  let page = doc.addPage([595.28, 841.89]); // A4
  const { width, height } = page.getSize();

  // Header banner
  page.drawRectangle({
    x: 0,
    y: height - 70,
    width,
    height: 70,
    color: rgb(0.02, 0.31, 0.23),
  });

  page.drawText(title || 'Document Created with PDF Arabi', {
    x: 40,
    y: height - 45,
    size: 16,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  let y = height - 110;
  const margin = 40;
  const maxLineLength = 80;

  for (const rawLine of lines) {
    // Basic text wrapping for long lines
    const lineChunks = [];
    if (rawLine.length > maxLineLength) {
      for (let i = 0; i < rawLine.length; i += maxLineLength) {
        lineChunks.push(rawLine.substring(i, i + maxLineLength));
      }
    } else {
      lineChunks.push(rawLine);
    }

    for (const chunk of lineChunks) {
      if (y < 50) {
        // Add new page
        page = doc.addPage([595.28, 841.89]);
        y = height - 60;
      }

      page.drawText(chunk, {
        x: margin,
        y,
        size: 11,
        font,
        color: rgb(0.15, 0.2, 0.25),
      });

      y -= 18;
    }
  }

  return await doc.save({ useObjectStreams: true });
}
