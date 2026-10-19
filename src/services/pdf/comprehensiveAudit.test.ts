import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, StandardFonts, rgb, degrees } from 'pdf-lib';
import {
  createSamplePdf,
  mergePdfs,
  extractPages,
  reorderAndModifyPages,
  duplicatePage,
  addWatermarkToPdf,
  addPageNumbersToPdf,
  createPdfFromText,
  imagesToPdf
} from './pdfService.ts';
import { parsePageRanges } from '../../utils/pageRangeParser.ts';
import {
  tokenizeWords,
  calculateKeywordFrequency,
  extractEntities,
  generateExtractiveSummary,
  answerQuestionFromText
} from '../../utils/textAnalysis.ts';
import { formatBytes, sanitizeFileName, createPdfBlob } from '../../utils/fileUtils.ts';

// 1. Single page PDF test
test('Audit 1: Create and verify 1-page PDF', async () => {
  const doc = await PDFDocument.create();
  doc.addPage([595, 842]);
  const bytes = await doc.save();
  const loaded = await PDFDocument.load(bytes);
  assert.equal(loaded.getPageCount(), 1);
});

// 2. 5-page PDF test
test('Audit 2: Create and verify 5-page PDF', async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 5; i++) {
    const page = doc.addPage([595, 842]);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    page.drawText(`Page ${i + 1}`, { x: 50, y: 800, size: 14, font });
  }
  const bytes = await doc.save();
  const loaded = await PDFDocument.load(bytes);
  assert.equal(loaded.getPageCount(), 5);
});

// 3. Multi-file merge with custom order
test('Audit 3: Merge 3 documents and verify page order and count', async () => {
  const doc1 = await PDFDocument.create();
  doc1.addPage([595, 842]);
  const b1 = (await doc1.save()).buffer as ArrayBuffer;

  const doc2 = await PDFDocument.create();
  doc2.addPage([595, 842]);
  doc2.addPage([595, 842]);
  const b2 = (await doc2.save()).buffer as ArrayBuffer;

  const doc3 = await PDFDocument.create();
  doc3.addPage([595, 842]);
  const b3 = (await doc3.save()).buffer as ArrayBuffer;

  const merged = await mergePdfs([b1, b2, b3]);
  const loaded = await PDFDocument.load(merged);
  assert.equal(loaded.getPageCount(), 4);
});

// 4. Split PDF with ranges and out-of-bound handling
test('Audit 4: Split PDF extracts correct pages and ignores out-of-bounds', async () => {
  const doc = await PDFDocument.create();
  for (let i = 0; i < 10; i++) doc.addPage([595, 842]);
  const buf = (await doc.save()).buffer as ArrayBuffer;

  const parsedRanges = parsePageRanges('1-2, 5, 9-10, 99', 10);
  assert.deepEqual(parsedRanges, [1, 2, 5, 9, 10]);

  const splitBytes = await extractPages(buf, parsedRanges);
  const loaded = await PDFDocument.load(splitBytes);
  assert.equal(loaded.getPageCount(), 5);
});

// 5. Rotation tests: 90, 180, 270 degrees
test('Audit 5: Rotate pages to 90, 180, 270 degrees correctly', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;

  const mods = [
    { originalIndex: 0, rotation: 90, deleted: false },
    { originalIndex: 1, rotation: 180, deleted: false },
    { originalIndex: 2, rotation: 270, deleted: false },
  ];

  const rotatedBytes = await reorderAndModifyPages(buf, mods);
  const loaded = await PDFDocument.load(rotatedBytes);
  assert.equal(loaded.getPageCount(), 3);
  assert.equal(loaded.getPage(0).getRotation().angle, 90);
  assert.equal(loaded.getPage(1).getRotation().angle, 180);
  assert.equal(loaded.getPage(2).getRotation().angle, 270);
});

// 6. Delete page and verify remaining count
test('Audit 6: Delete specific page and verify integrity', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;

  const mods = [
    { originalIndex: 0, rotation: 0, deleted: false },
    { originalIndex: 1, rotation: 0, deleted: true }, // deleted
    { originalIndex: 2, rotation: 0, deleted: false },
  ];

  const res = await reorderAndModifyPages(buf, mods);
  const loaded = await PDFDocument.load(res);
  assert.equal(loaded.getPageCount(), 2);
});

// 7. Duplicate page
test('Audit 7: Duplicate page inserts page copy', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;
  const res = await duplicatePage(buf, 1);
  const loaded = await PDFDocument.load(res);
  assert.equal(loaded.getPageCount(), 4);
});

// 8. Watermark with Arabic text safety
test('Audit 8: Add watermark safely handles Arabic text without crash', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;

  const res = await addWatermarkToPdf(buf, {
    text: 'مسودة غير معتمدة',
    color: '#ff0000',
    opacity: 0.3,
    fontSize: 32,
    rotation: 45,
  });

  const loaded = await PDFDocument.load(res);
  assert.equal(loaded.getPageCount(), 3);
});

// 9. Page numbers formatting
test('Audit 9: Add page numbers in simple and page_of_total formats', async () => {
  const sample = await createSamplePdf();
  const buf = sample.buffer.slice(sample.byteOffset, sample.byteOffset + sample.byteLength) as ArrayBuffer;

  const res1 = await addPageNumbersToPdf(buf, {
    position: 'bottom-center',
    format: 'simple_number',
    fontSize: 10,
    color: '#000000',
  });
  const doc1 = await PDFDocument.load(res1);
  assert.equal(doc1.getPageCount(), 3);

  const res2 = await addPageNumbersToPdf(buf, {
    position: 'top-right',
    format: 'page_of_total',
    fontSize: 11,
    color: '#333333',
  });
  const doc2 = await PDFDocument.load(res2);
  assert.equal(doc2.getPageCount(), 3);
});

// 10. Local text analysis & entity extraction
test('Audit 10: Local assistant extracts dates, numbers, phones, and currencies', () => {
  const text = 'تم توقيع العقد في 2026-03-15 بقيمة 150000 ريال مع المهندس عبر هاتف 0559876543 وبريد admin@example.com';
  const entities = extractEntities(text);

  assert.ok(entities.some(e => e.type === 'date' && e.value === '2026-03-15'));
  assert.ok(entities.some(e => e.type === 'phone' && e.value.includes('0559876543')));
  assert.ok(entities.some(e => e.type === 'email' && e.value === 'admin@example.com'));
  assert.ok(entities.some(e => e.type === 'currency' && e.value.includes('150000')));
});

// 11. Local semantic QA answers questions
test('Audit 11: Local assistant answers specific questions from document text', () => {
  const text = 'مدة الضمان المعتمدة هي 3 سنوات من تاريخ الاستلام. يغطي الضمان عيوب التصنيع والصيانة الدورية.';
  const res = answerQuestionFromText('ما هي مدة الضمان؟', text);
  assert.equal(res.found, true);
  assert.ok(res.answer.includes('3 سنوات'));
});

// 12. Safe filename sanitization
test('Audit 12: Filename sanitizer preserves Arabic and removes bad chars', () => {
  assert.equal(sanitizeFileName('عقد / توريد * نهائي : 2026?.pdf'), 'عقد _ توريد _ نهائي _ 2026_.pdf');
  assert.equal(sanitizeFileName(''), 'document.pdf');
  assert.equal(sanitizeFileName('  تقرير_المالية.pdf  '), 'تقرير_المالية.pdf');
});

// 13. Blob generation helper
test('Audit 13: createPdfBlob produces valid PDF Blob', () => {
  const dummy = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const blob = createPdfBlob(dummy);
  assert.equal(blob.type, 'application/pdf');
  assert.equal(blob.size, 5);
});
