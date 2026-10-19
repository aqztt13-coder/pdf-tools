import test from 'node:test';
import assert from 'node:assert/strict';
import { parsePageRanges } from './pageRangeParser.ts';

test('parsePageRanges handles single pages', () => {
  const result = parsePageRanges('1, 3, 5', 10);
  assert.deepEqual(result, [1, 3, 5]);
});

test('parsePageRanges handles ranges correctly', () => {
  const result = parsePageRanges('1-4, 7-9', 10);
  assert.deepEqual(result, [1, 2, 3, 4, 7, 8, 9]);
});

test('parsePageRanges handles Arabic comma and spaces', () => {
  const result = parsePageRanges('2، 4، 6-8', 10);
  assert.deepEqual(result, [2, 4, 6, 7, 8]);
});

test('parsePageRanges clamps to maxPages and ignores invalid entries', () => {
  const result = parsePageRanges('0, 2-5, 12, abc, -3', 5);
  assert.deepEqual(result, [2, 3, 4, 5]);
});

test('parsePageRanges removes duplicates and sorts results', () => {
  const result = parsePageRanges('5, 1, 3, 1-3', 10);
  assert.deepEqual(result, [1, 2, 3, 5]);
});
