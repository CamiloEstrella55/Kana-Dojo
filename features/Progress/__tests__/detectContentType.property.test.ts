import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  detectContentType,
  filterByContentType,
  isHiragana,
  isKatakana,
  isKanji,
  HIRAGANA_START,
  HIRAGANA_END,
  KATAKANA_START,
  KATAKANA_END,
  KANJI_START,
  KANJI_END,
} from '../lib/detectContentType';

// Arbitraries for generating characters in specific Unicode ranges
const hiraganaCharArb = fc
  .integer({ min: HIRAGANA_START, max: HIRAGANA_END })
  .map(code => String.fromCharCode(code));

const katakanaCharArb = fc
  .integer({ min: KATAKANA_START, max: KATAKANA_END })
  .map(code => String.fromCharCode(code));

const kanjiCharArb = fc
  .integer({ min: KANJI_START, max: KANJI_END })
  .map(code => String.fromCharCode(code));

const kanaCharArb = fc.oneof(hiraganaCharArb, katakanaCharArb);

describe('Content Type Detection', () => {
  /**
   * **Feature: revamped-stats-page, Property 4: Character Filtering by Content Type**
   * For any set of characters with mixed content types (kana, kanji, vocabulary),
   * when filtered by a specific content type, the result should only contain
   * characters of that type, and the count should equal the number of characters
   * of that type in the original set.
   * **Validates: Requirements 2.5**
   */
  describe('Property 4: Character Filtering by Content Type', () => {
    it('filters kana characters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(kanaCharArb, kanjiCharArb), {
            minLength: 1,
            maxLength: 20,
          }),
          characters => {
            const filtered = filterByContentType(characters, 'kana');
            const expectedCount = characters.filter(
              c => detectContentType(c) === 'kana',
            ).length;

            expect(filtered.length).toBe(expectedCount);
            filtered.forEach(char => {
              expect(detectContentType(char)).toBe('kana');
            });
          },
        ),
        { numRuns: 25 },
      );
    });

    it('filters kanji characters correctly', () => {
      fc.assert(
        fc.property(
          fc.array(fc.oneof(kanaCharArb, kanjiCharArb), {
            minLength: 1,
            maxLength: 20,
          }),
          characters => {
            const filtered = filterByContentType(characters, 'kanji');
            const expectedCount = characters.filter(
              c => detectContentType(c) === 'kanji',
            ).length;

            expect(filtered.length).toBe(expectedCount);
            filtered.forEach(char => {
              expect(detectContentType(char)).toBe('kanji');
            });
          },
        ),
        { numRuns: 25 },
      );
    });

    it('filters vocabulary (multi-char strings) correctly', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              kanaCharArb,
              kanjiCharArb,
              fc
                .array(kanjiCharArb, { minLength: 2, maxLength: 4 })
                .map(arr => arr.join('')),
            ),
            { minLength: 1, maxLength: 10 },
          ),
          characters => {
            const filtered = filterByContentType(characters, 'vocabulary');
            const expectedCount = characters.filter(
              c => detectContentType(c) === 'vocabulary',
            ).length;

            expect(filtered.length).toBe(expectedCount);
            filtered.forEach(char => {
              expect(detectContentType(char)).toBe('vocabulary');
            });
          },
        ),
        { numRuns: 25 },
      );
    });

    it('sum of filtered counts equals total count', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.oneof(
              kanaCharArb,
              kanjiCharArb,
              fc
                .array(kanjiCharArb, { minLength: 2, maxLength: 3 })
                .map(arr => arr.join('')),
            ),
            { minLength: 0, maxLength: 15 },
          ),
          characters => {
            const kanaCount = filterByContentType(characters, 'kana').length;
            const kanjiCount = filterByContentType(characters, 'kanji').length;
            const vocabCount = filterByContentType(
              characters,
              'vocabulary',
            ).length;

            expect(kanaCount + kanjiCount + vocabCount).toBe(characters.length);
          },
        ),
        { numRuns: 25 },
      );
    });
  });

  describe('Unicode Range Detection', () => {
    it('detects hiragana characters as kana', () => {
      fc.assert(
        fc.property(hiraganaCharArb, char => {
          expect(detectContentType(char)).toBe('kana');
          expect(isHiragana(char.charCodeAt(0))).toBe(true);
        }),
        { numRuns: 20 },
      );
    });

    it('detects katakana characters as kana', () => {
      fc.assert(
        fc.property(katakanaCharArb, char => {
          expect(detectContentType(char)).toBe('kana');
          expect(isKatakana(char.charCodeAt(0))).toBe(true);
        }),
        { numRuns: 20 },
      );
    });

    it('detects kanji characters correctly', () => {
      fc.assert(
        fc.property(kanjiCharArb, char => {
          expect(detectContentType(char)).toBe('kanji');
          expect(isKanji(char.charCodeAt(0))).toBe(true);
        }),
        { numRuns: 20 },
      );
    });
  });

  describe('Edge Cases', () => {
    it('classifies empty string as vocabulary', () => {
      expect(detectContentType('')).toBe('vocabulary');
    });

    it('classifies multi-character strings as vocabulary', () => {
      expect(detectContentType('日本')).toBe('vocabulary');
      expect(detectContentType('あい')).toBe('vocabulary');
      expect(detectContentType('hello')).toBe('vocabulary');
    });

    it('classifies known hiragana correctly', () => {
      expect(detectContentType('あ')).toBe('kana');
      expect(detectContentType('ん')).toBe('kana');
    });

    it('classifies known katakana correctly', () => {
      expect(detectContentType('ア')).toBe('kana');
      expect(detectContentType('ン')).toBe('kana');
    });

    it('classifies known kanji correctly', () => {
      expect(detectContentType('日')).toBe('kanji');
      expect(detectContentType('本')).toBe('kanji');
    });
  });
});
