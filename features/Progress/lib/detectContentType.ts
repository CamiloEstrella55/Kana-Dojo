/**
 * Content Type Detection
 *
 * Detects the content type (kana, kanji, vocabulary) of a character or string
 * based on Unicode ranges.
 *
 * Unicode ranges:
 * - Hiragana: U+3040 - U+309F
 * - Katakana: U+30A0 - U+30FF
 * - Kanji (CJK Unified Ideographs): U+4E00 - U+9FAF
 */

import type { ContentType } from '../types/stats';

/** Hiragana Unicode range start */
export const HIRAGANA_START = 0x3040;
/** Hiragana Unicode range end */
export const HIRAGANA_END = 0x309f;

/** Katakana Unicode range start */
export const KATAKANA_START = 0x30a0;
/** Katakana Unicode range end */
export const KATAKANA_END = 0x30ff;

/** Kanji (CJK Unified Ideographs) Unicode range start */
export const KANJI_START = 0x4e00;
/** Kanji (CJK Unified Ideographs) Unicode range end */
export const KANJI_END = 0x9faf;

/**
 * Checks if a character code is in the Hiragana range
 */
export function isHiragana(code: number): boolean {
  return code >= HIRAGANA_START && code <= HIRAGANA_END;
}

/**
 * Checks if a character code is in the Katakana range
 */
export function isKatakana(code: number): boolean {
  return code >= KATAKANA_START && code <= KATAKANA_END;
}

/**
 * Checks if a character code is in the Kanji range
 */
export function isKanji(code: number): boolean {
  return code >= KANJI_START && code <= KANJI_END;
}

/**
 * Checks if a character code is Kana (Hiragana or Katakana)
 */
export function isKana(code: number): boolean {
  return isHiragana(code) || isKatakana(code);
}

/**
 * Detects the content type of a character or string
 *
 * Classification rules:
 * - Single hiragana or katakana character → 'kana'
 * - Single kanji character → 'kanji'
 * - Multi-character strings → 'vocabulary'
 * - Unknown single characters default to 'kanji'
 *
 * @param character - The character or string to classify
 * @returns The detected content type
 *
 * @example
 * detectContentType('あ')  // 'kana' (hiragana)
 * detectContentType('ア')  // 'kana' (katakana)
 * detectContentType('日')  // 'kanji'
 * detectContentType('日本') // 'vocabulary' (multi-character)
 */
export function detectContentType(character: string): ContentType {
  // Empty string defaults to vocabulary
  if (!character || character.length === 0) {
    return 'vocabulary';
  }

  // Multi-character strings are vocabulary
  if (character.length > 1) {
    return 'vocabulary';
  }

  const code = character.charCodeAt(0);

  // Check for kana (hiragana or katakana)
  if (isKana(code)) {
    return 'kana';
  }

  // Check for kanji
  if (isKanji(code)) {
    return 'kanji';
  }

  // Default unknown single characters to kanji
  return 'kanji';
}

/**
 * Filters an array of characters by content type
 *
 * @param characters - Array of characters to filter
 * @param contentType - The content type to filter by
 * @returns Filtered array containing only characters of the specified type
 */
export function filterByContentType(
  characters: string[],
  contentType: ContentType,
): string[] {
  return characters.filter(char => detectContentType(char) === contentType);
}
