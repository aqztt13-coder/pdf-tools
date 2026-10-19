import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument } from 'pdf-lib';
import {
  createSamplePdf,
  mergePdfs,
  extractPages,
  reorderAndModifyPages,
  duplicatePage,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  createPdfFromText
} from './pdfService.ts';

test('createSamplePdf generates a valid 3-page PDF', async () => {
  const bytes = await createSamplePdf();
  assert.ok(bytes instanceof Uint8Array);
  assert.ok(bytes.length > 1000);

  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 3);
});

test('mergePdfs combines multiple PDFs and preserves all pages', async () => {
  const sample1 = await createSamplePdf();
  const sample2 = await createSamplePdf();

  const buf1 = sample1.buffer.slice(sample1.byteOffset, sample1.byteOffset + sample1.byteLength) as ArrayBuffer;
  const buf2 = sample2.buffer.slice(sample2.byteOffset, sample2.byteOffset + sample2.byteLength) as ArrayBuffer;

  const mergedBytes = await mergePdfs([buf1, buf2]);
  const doc = await PDFDocument.load(mergedBytes);
  assert.equal(doc.getPageCount(), 6);
});

test('extractPages extracts specified pages correctly', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const extractedBytes = await extractPages(buf, [1, 3]);
  const doc = await PDFDocument.load(extractedBytes);
  assert.equal(doc.getPageCount(), 2);
});

test('reorderAndModifyPages removes deleted pages and applies rotation', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const mods = [
    { originalIndex: 0, rotation: 90, deleted: false },
    { originalIndex: 1, rotation: 0, deleted: true },
    { originalIndex: 2, rotation: 0, deleted: false },
  ];

  const resultBytes = await reorderAndModifyPages(buf, mods);
  const doc = await PDFDocument.load(resultBytes);
  assert.equal(doc.getPageCount(), 2);
  assert.equal(doc.getPage(0).getRotation().angle, 90);
});

test('duplicatePage inserts a copy of the specified page', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const resultBytes = await duplicatePage(buf, 0);
  const doc = await PDFDocument.load(resultBytes);
  assert.equal(doc.getPageCount(), 4);
});

test('addWatermarkToPdf applies watermark to all pages', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const resultBytes = await addWatermarkToPdf(buf, {
    text: 'CONFIDENTIAL',
    color: '#ff0000',
    opacity: 0.3,
    fontSize: 40,
    rotation: 45,
  });
  const doc = await PDFDocument.load(resultBytes);
  assert.equal(doc.getPageCount(), 3);
});

test('addPageNumbersToPdf adds numbering to all pages', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const resultBytes = await addPageNumbersToPdf(buf, {
    position: 'bottom-center',
    format: 'page_of_total',
    fontSize: 12,
    color: '#333333',
  });
  const doc = await PDFDocument.load(resultBytes);
  assert.equal(doc.getPageCount(), 3);
});

test('createPdfFromText creates valid PDF with pages', async () => {
  const text = 'Line 1: Arabic Document\nLine 2: Test content\nLine 3: End of file.';
  const bytes = await createPdfFromText(text, 'My Custom Document');
  const doc = await PDFDocument.load(bytes);
  assert.equal(doc.getPageCount(), 1);
});
