/**
 * Parses user page range input like "1-3, 5, 8-10" or "1, 2, 4"
 * into a unique, sorted list of 1-indexed page numbers.
 * Clamps to 1..maxPages and ignores invalid tokens.
 */
export function parsePageRanges(input: string, maxPages: number): number[] {
  if (!input || typeof input !== 'string' || maxPages < 1) return [];

  const parts = input.split(/[,،\s]+/); // split by comma, Arabic comma،, or whitespace
  const pageSet = new Set<number>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Check for range like "1-5" or "1..5"
    const rangeMatch = trimmed.match(/^(\d+)[\-\.]{1,2}(\d+)$/);
    if (rangeMatch) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (!isNaN(start) && !isNaN(end)) {
        const from = Math.max(1, Math.min(start, end));
        const to = Math.min(maxPages, Math.max(start, end));
        for (let p = from; p <= to; p++) {
          pageSet.add(p);
        }
      }
      continue;
    }

    // Check for single number
    const single = parseInt(trimmed, 10);
    if (!isNaN(single) && single >= 1 && single <= maxPages) {
      pageSet.add(single);
    }
  }

  return Array.from(pageSet).sort((a, b) => a - b);
}
