import type { DocumentAnalysisResult, ExtractedEntity } from '../types/index.ts';

// Arabic common stop words to filter out for frequency analysis
const ARABIC_STOP_WORDS = new Set([
  'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'تم', 'كان', 'كانت',
  'ذلك', 'تلك', 'التي', 'الذي', 'الذين', 'هو', 'هي', 'أن', 'إن', 'ما', 'لا',
  'قد', 'كل', 'بعد', 'قبل', 'حيث', 'بين', 'خلال', 'ثم', 'أو', 'و', 'فإن',
  'كما', 'لأن', 'حتى', 'إذا', 'نحو', 'ضد', 'غير', 'بعض', 'أي', 'فقد', 'وقد',
  'يكون', 'تكون', 'أنه', 'أنها', 'بها', 'فيه', 'منها', 'عليه', 'إليها',
  'the', 'and', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'this', 'that', 'is', 'are'
]);

/**
 * Clean and tokenize words
 */
export function tokenizeWords(text: string): string[] {
  if (!text) return [];
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map(w => w.trim().toLowerCase())
    .filter(w => w.length >= 2);
}

/**
 * Split text into sentences for Arabic and English
 */
export function splitSentences(text: string): string[] {
  if (!text) return [];
  // Split on '.', '؟', '!', '؛', '?', '\n\n'
  return text
    .split(/[\.\؟\!\?؛\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // filter out tiny sentence fragments
}

/**
 * Calculate word frequency excluding stop words
 */
export function calculateKeywordFrequency(text: string, limit: number = 10): { word: string; count: number }[] {
  const words = tokenizeWords(text);
  const freq: Record<string, number> = {};

  for (const word of words) {
    if (ARABIC_STOP_WORDS.has(word) || word.length < 3) continue;
    freq[word] = (freq[word] || 0) + 1;
  }

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

/**
 * Extract entities (dates, numbers, emails, phone numbers, currencies)
 */
export function extractEntities(text: string): ExtractedEntity[] {
  const entities: ExtractedEntity[] = [];
  const seen = new Set<string>();

  // 1. Emails
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  let match: RegExpExecArray | null;
  while ((match = emailRegex.exec(text)) !== null) {
    const val = match[0];
    if (!seen.has(val)) {
      seen.add(val);
      entities.push({ type: 'email', value: val, label: 'بريد إلكتروني' });
    }
  }

  // 2. Phone numbers (Arabic / international formats)
  const phoneRegex = /(?:\+?(\d{1,3})[-.\s]?)?\(?0?\d{1,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}/g;
  while ((match = phoneRegex.exec(text)) !== null) {
    const val = match[0].trim();
    if (val.length >= 8 && !seen.has(val) && !val.includes('@')) {
      seen.add(val);
      entities.push({ type: 'phone', value: val, label: 'رقم هاتف' });
    }
  }

  // 3. Dates (YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY, Hijri/Gregorian patterns)
  const dateRegex = /\b(\d{1,4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,4})\b/g;
  while ((match = dateRegex.exec(text)) !== null) {
    const val = match[0];
    if (!seen.has(val)) {
      seen.add(val);
      entities.push({ type: 'date', value: val, label: 'تاريخ' });
    }
  }

  // 4. Currencies & monetary amounts (SAR, USD, ر.س, ريال, دولار, جنيه, درهم)
  const currencyRegex = /(\d+[\d,\.]*)\s*(?:ريال|ر\.س|SAR|دولار|USD|درهم|AED|جنيه|EGP|EUR|يورو)/g;
  while ((match = currencyRegex.exec(text)) !== null) {
    const val = match[0].trim();
    if (!seen.has(val)) {
      seen.add(val);
      entities.push({ type: 'currency', value: val, label: 'مبلغ مالي' });
    }
  }

  return entities;
}

/**
 * Extractive summarization: Ranks sentences based on key term density
 */
export function generateExtractiveSummary(text: string, sentenceCount: number = 4): string[] {
  const sentences = splitSentences(text);
  if (sentences.length <= sentenceCount) {
    return sentences;
  }

  const keywords = calculateKeywordFrequency(text, 25);
  const keywordWeights = new Map(keywords.map(k => [k.word, k.count]));

  // Score each sentence
  const scored = sentences.map((sentence, index) => {
    const words = tokenizeWords(sentence);
    let score = 0;
    for (const w of words) {
      score += keywordWeights.get(w) || 0;
    }
    // Give slight boost to earlier sentences (introduction/main topic)
    const positionBoost = 1 + 1 / (index + 1);
    const normalizedScore = words.length > 0 ? (score / Math.sqrt(words.length)) * positionBoost : 0;
    return { sentence, score: normalizedScore, originalIndex: index };
  });

  // Pick top scoring sentences
  scored.sort((a, b) => b.score - a.score);
  const topSentences = scored.slice(0, sentenceCount);

  // Return in original chronological order for readability
  topSentences.sort((a, b) => a.originalIndex - b.originalIndex);
  return topSentences.map(s => s.sentence);
}

/**
 * Answer a question using local semantic/keyword matching against document text
 */
export function answerQuestionFromText(question: string, documentText: string): {
  answer: string;
  found: boolean;
  matchingSentences: string[];
} {
  if (!question || !documentText) {
    return { answer: 'يرجى إدخال سؤال وتوفير نص مستند للإجابة عنه.', found: false, matchingSentences: [] };
  }

  const queryWords = tokenizeWords(question).filter(w => !ARABIC_STOP_WORDS.has(w));
  if (queryWords.length === 0) {
    return { answer: 'لم نتمكن من تحديد كلمات مفتاحية في السؤال.', found: false, matchingSentences: [] };
  }

  const sentences = splitSentences(documentText);
  const scored = sentences.map(sentence => {
    const sWords = new Set(tokenizeWords(sentence));
    let matchCount = 0;
    for (const qw of queryWords) {
      if (sWords.has(qw) || sentence.toLowerCase().includes(qw)) {
        matchCount++;
      }
    }
    return { sentence, score: matchCount / queryWords.length };
  });

  const bestMatches = scored.filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3);

  if (bestMatches.length === 0 || bestMatches[0].score === 0) {
    return {
      answer: 'لم يتم العثور على إجابة مباشرة متطابقة في النص المستخرج من المستند. جرب صياغة السؤال باستخدام كلمات أخرى موجودة في المستند.',
      found: false,
      matchingSentences: []
    };
  }

  const matchedTexts = bestMatches.map(m => m.sentence);
  const answer = `بناءً على محتوى المستند:\n\n• ${matchedTexts.join('\n\n• ')}`;

  return {
    answer,
    found: true,
    matchingSentences: matchedTexts
  };
}

/**
 * Full document analysis for Smart Assistant
 */
export function analyzeDocumentText(
  pageTexts: { pageNumber: number; text: string }[],
  totalPages: number
): DocumentAnalysisResult {
  const fullText = pageTexts.map(p => p.text).join('\n\n');
  const words = tokenizeWords(fullText);
  const totalWords = words.length;
  const totalCharacters = fullText.length;
  const estimatedReadingTimeMinutes = Math.max(1, Math.ceil(totalWords / 180)); // 180 wpm for Arabic
  const pagesWithText = pageTexts.filter(p => p.text.trim().length > 0).length;

  const keyTopics = calculateKeywordFrequency(fullText, 10);
  const entities = extractEntities(fullText);
  const summary = generateExtractiveSummary(fullText, 4);

  return {
    totalWords,
    totalCharacters,
    estimatedReadingTimeMinutes,
    pagesWithText,
    totalPages,
    summary,
    keyTopics,
    entities
  };
}
