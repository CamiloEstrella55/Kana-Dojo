import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getTopCharacters } from '../components/stats/CharacterMasteryPanel';
import type {
  CharacterMasteryItem,
  ContentType,
  MasteryLevel,
} from '../types/stats';

/**
 * Helper to generate a CharacterMasteryItem with specific properties
 */
function createCharacterItem(
  character: string,
  correct: number,
  incorrect: number,
  masteryLevel: MasteryLevel,
  contentType: ContentType = 'kana',
): CharacterMasteryItem {
  const total = correct + incorrect;
  const accuracy = total > 0 ? (correct / total) * 100 : 0;
  return {
    character,
    correct,
    incorrect,
    total,
    accuracy,
    masteryLevel,
    contentType,
  };
}

/**
 * Arbitrary for generating valid CharacterMasteryItem
 */
const characterMasteryItemArb = fc
  .record({
    character: fc.string({ minLength: 1, maxLength: 3 }),
    correct: fc.integer({ min: 0, max: 100 }),
    incorrect: fc.integer({ min: 0, max: 100 }),
  })
  .map(({ character, correct, incorrect }) => {
    const total = correct + incorrect;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Determine mastery level based on thresholds
    let masteryLevel: MasteryLevel = 'learning';
    if (total >= 10 && accuracy >= 90) {
      masteryLevel = 'mastered';
    } else if (total >= 5 && accuracy < 70) {
      masteryLevel = 'needs-practice';
    }

    const contentTypes: ContentType[] = ['kana', 'kanji', 'vocabulary'];
    const contentType =
      contentTypes[Math.floor(Math.random() * contentTypes.length)];

    return {
      character,
      correct,
      incorrect,
      total,
      accuracy,
      masteryLevel,
      contentType,
    } as CharacterMasteryItem;
  });

describe('Top Characters Identification', () => {
  /**
   * **Feature: revamped-stats-page, Property 5: Top Characters Identification**
   * For any set of characters with accuracy data, the top 5 most difficult characters
   * should be the 5 characters with the lowest accuracy (among those with sufficient attempts),
   * and the top 5 mastered characters should be the 5 characters with the highest accuracy
   * (among those meeting mastery criteria).
   * **Validates: Requirements 2.6, 2.7**
   */
  describe('Property 5: Top Characters Identification', () => {
    it('top difficult characters have lowest accuracy among those with >= 5 attempts', () => {
      fc.assert(
        fc.property(
          fc.array(characterMasteryItemArb, { minLength: 1, maxLength: 20 }),
          characters => {
            const topDifficult = getTopCharacters(characters, 5, 'difficult');

            // Filter characters with >= 5 attempts
            const eligibleForDifficult = characters.filter(c => c.total >= 5);

            if (eligibleForDifficult.length === 0) {
              // No eligible characters, should return empty
              expect(topDifficult).toHaveLength(0);
              return;
            }

            // Top difficult should be sorted by lowest accuracy
            for (let i = 1; i < topDifficult.length; i++) {
              expect(topDifficult[i - 1].accuracy).toBeLessThanOrEqual(
                topDifficult[i].accuracy,
              );
            }

            // All returned characters should have >= 5 attempts
            topDifficult.forEach(char => {
              expect(char.total).toBeGreaterThanOrEqual(5);
            });

            // Should return at most 5 characters
            expect(topDifficult.length).toBeLessThanOrEqual(5);

            // Should return at most the number of eligible characters
            expect(topDifficult.length).toBeLessThanOrEqual(
              eligibleForDifficult.length,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('top mastered characters have highest accuracy among mastered characters', () => {
      fc.assert(
        fc.property(
          fc.array(characterMasteryItemArb, { minLength: 1, maxLength: 20 }),
          characters => {
            const topMastered = getTopCharacters(characters, 5, 'mastered');

            // Filter characters that are mastered
            const eligibleForMastered = characters.filter(
              c => c.masteryLevel === 'mastered',
            );

            if (eligibleForMastered.length === 0) {
              // No mastered characters, should return empty
              expect(topMastered).toHaveLength(0);
              return;
            }

            // Top mastered should be sorted by highest accuracy (descending)
            for (let i = 1; i < topMastered.length; i++) {
              expect(topMastered[i - 1].accuracy).toBeGreaterThanOrEqual(
                topMastered[i].accuracy,
              );
            }

            // All returned characters should be mastered
            topMastered.forEach(char => {
              expect(char.masteryLevel).toBe('mastered');
            });

            // Should return at most 5 characters
            expect(topMastered.length).toBeLessThanOrEqual(5);

            // Should return at most the number of eligible characters
            expect(topMastered.length).toBeLessThanOrEqual(
              eligibleForMastered.length,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it('returns exactly N characters when more than N eligible exist', () => {
      // Create 10 characters that all qualify as difficult (>= 5 attempts)
      const characters: CharacterMasteryItem[] = [];
      for (let i = 0; i < 10; i++) {
        characters.push(
          createCharacterItem(
            `char${i}`,
            i + 1, // varying correct counts
            10, // 10 incorrect for all
            'learning',
          ),
        );
      }

      const topDifficult = getTopCharacters(characters, 5, 'difficult');
      expect(topDifficult).toHaveLength(5);
    });

    it('returns fewer than N characters when fewer eligible exist', () => {
      // Create only 3 characters that qualify as difficult
      const characters: CharacterMasteryItem[] = [
        createCharacterItem('a', 2, 8, 'needs-practice'), // 10 attempts, 20% accuracy
        createCharacterItem('b', 3, 7, 'needs-practice'), // 10 attempts, 30% accuracy
        createCharacterItem('c', 4, 6, 'needs-practice'), // 10 attempts, 40% accuracy
        createCharacterItem('d', 1, 1, 'learning'), // Only 2 attempts - not eligible
      ];

      const topDifficult = getTopCharacters(characters, 5, 'difficult');
      expect(topDifficult).toHaveLength(3);
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('returns empty array for empty input', () => {
      expect(getTopCharacters([], 5, 'difficult')).toHaveLength(0);
      expect(getTopCharacters([], 5, 'mastered')).toHaveLength(0);
    });

    it('returns empty array when no characters meet difficult criteria', () => {
      const characters: CharacterMasteryItem[] = [
        createCharacterItem('a', 2, 2, 'learning'), // Only 4 attempts
        createCharacterItem('b', 1, 1, 'learning'), // Only 2 attempts
      ];

      expect(getTopCharacters(characters, 5, 'difficult')).toHaveLength(0);
    });

    it('returns empty array when no characters are mastered', () => {
      const characters: CharacterMasteryItem[] = [
        createCharacterItem('a', 5, 5, 'learning'),
        createCharacterItem('b', 3, 7, 'needs-practice'),
      ];

      expect(getTopCharacters(characters, 5, 'mastered')).toHaveLength(0);
    });

    it('handles characters with same accuracy correctly', () => {
      const characters: CharacterMasteryItem[] = [
        createCharacterItem('a', 5, 5, 'learning'), // 50% accuracy
        createCharacterItem('b', 5, 5, 'learning'), // 50% accuracy
        createCharacterItem('c', 5, 5, 'learning'), // 50% accuracy
      ];

      const topDifficult = getTopCharacters(characters, 5, 'difficult');
      expect(topDifficult).toHaveLength(3);
    });
  });
});
