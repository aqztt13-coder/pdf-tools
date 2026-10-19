import test from 'node:test';
import assert from 'node:assert/strict';
import {
  tokenizeWords,
  calculateKeywordFrequency,
  extractEntities,
  generateExtractiveSummary,
  answerQuestionFromText
} from './textAnalysis.ts';

test('tokenizeWords splits Arabic words properly and ignores punctuation', () => {
  const text = 'مرحباً بكم في منصة PDF عربي المتكاملة!';
  const words = tokenizeWords(text);
  assert.ok(words.includes('مرحباً') || words.includes('مرحبا'));
  assert.ok(words.includes('منصة'));
  assert.ok(words.includes('عربي'));
});

test('calculateKeywordFrequency ignores stop words and counts terms', () => {
  const text = 'هذا مستند تجريبي. المستند يحتوي على تقرير هام. المستند هو ملف رقمي.';
  const keywords = calculateKeywordFrequency(text, 5);
  assert.ok(keywords.length > 0);
  assert.equal(keywords[0].word, 'المستند');
  assert.equal(keywords[0].count, 2);
});

test('extractEntities detects email, phone, date, and currency', () => {
  const text = 'يرجى التواصل عبر info@pdf-arabi.com أو الاتصال على 0501234567 بتاريخ 2025-01-15 لإيداع 5000 ريال.';
  const entities = extractEntities(text);

  const email = entities.find(e => e.type === 'email');
  assert.ok(email);
  assert.equal(email.value, 'info@pdf-arabi.com');

  const phone = entities.find(e => e.type === 'phone');
  assert.ok(phone);
  assert.ok(phone.value.includes('0501234567'));

  const date = entities.find(e => e.type === 'date');
  assert.ok(date);
  assert.equal(date.value, '2025-01-15');

  const currency = entities.find(e => e.type === 'currency');
  assert.ok(currency);
  assert.ok(currency.value.includes('5000'));
});

test('generateExtractiveSummary extracts relevant sentences', () => {
  const text = `
    تعد منصة PDF عربي أول أداة عربية شاملة تعمل بالكامل داخل متصفح المستخدم دون أي خوادم خارجية.
    توفر المنصة إمكانية دمج وتقسيم وتدوير المستندات بكل سهولة وسرعة فائقة.
    يعتمد التطبيق على معالجة محلية لضمان الخصوصية التامة لجميع المستندات الحكومية والشخصية.
    يمكنك أيضاً استخدام التعرف الضوئي OCR على النصوص العربية المصورة بدقة عالية.
  `;
  const summary = generateExtractiveSummary(text, 2);
  assert.ok(summary.length <= 2);
  assert.ok(summary.length > 0);
});

test('answerQuestionFromText matches relevant sentence', () => {
  const doc = 'تاريخ توقيع العقد النهائي هو 2025-10-01 في مدينة الرياض. رسوم التسجيل تبلغ 250 ريال.';
  const res = answerQuestionFromText('ما هو تاريخ العقد؟', doc);
  assert.equal(res.found, true);
  assert.ok(res.answer.includes('2025-10-01'));
});
