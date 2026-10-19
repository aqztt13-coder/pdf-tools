import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes, sanitizeFileName } from './fileUtils.ts';

test('formatBytes formats 0 bytes', () => {
  assert.equal(formatBytes(0), '0 بايت');
});

test('formatBytes formats kilobytes and megabytes in Arabic', () => {
  assert.equal(formatBytes(1024), '1 كيلوبايت');
  assert.equal(formatBytes(1024 * 1024 * 2.5), '2.5 ميغابايت');
});

test('sanitizeFileName removes dangerous filesystem characters', () => {
  assert.equal(sanitizeFileName('report/2024:final*.pdf'), 'report_2024_final_.pdf');
});

test('sanitizeFileName preserves Arabic characters and spaces', () => {
  assert.equal(sanitizeFileName('تقرير المبيعات السنوي.pdf'), 'تقرير المبيعات السنوي.pdf');
});

test('sanitizeFileName returns fallback for empty or invalid names', () => {
  assert.equal(sanitizeFileName(''), 'document.pdf');
  assert.equal(sanitizeFileName('..'), 'document.pdf');
});
