import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateMasteryDistribution } from '../hooks/useStatsAggregator';
import { classifyCharacter } from '../lib/classifyCharacter';
import { detectContentType } from '../lib/detectContentType';
import { calculateAccuracy } from '../lib/calculateAccuracy';
import type {
  CharacterMasteryItem,
  MasteryLevel,
  ContentType,
} from '../types/stats';

/**
 * Generates a random CharacterMasteryItem for testing
 */
const characterMasteryItemArb = fc
  .record({
    character: fc.string({ minLength: 1, maxLength: 3 }),
    correct: fc.integer({ min: 0, max: 1000 }),
    incorrect: fc.integer({ min: 0, max: 1000 }),
  })
  .map(({ character, correct, incorrect }) => {
    const total = correct + incorrect;
    const accuracy = calculateAccuracy(correct, incorrect);
    const masteryLevel = classifyCharacter(correct, incorrect);
    const contentType = detectContentType(character);

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

/**
 * Generates an array of CharacterMasteryItems
 */
const characterMasteryArrayArb = fc.array(characterMasteryItemArb, {
  minLength: 0,
  maxLength: 100,
});

describe('Mastery Distribution Calculation', () => {
  /**
   * **Feature: revamped-stats-page, Property 8: Mastery Distribution Calculation**
   * For any set of character mastery data, the sum of mastered + learning + needsPractice
   * counts should equal the total number of characters, and the percentage proportions
   * should sum to 100%.
   * **Validates: Requirements 5.1, 5.2**
   */
  describe('Property 8: Mastery Distribution Calculation', () => {
    it('sum of mastered + learning + needsPractice equals total character count', () => {
      fc.assert(
        fc.property(characterMasteryArrayArb, items => {
          const distribution = calculateMasteryDistribution(items);

          const sum =
            distribution.mastered +
            distribution.learning +
            distribution.needsPractice;

          expect(sum).toBe(distribution.total);
          expect(distribution.total).toBe(items.length);
        }),
        { numRuns: 100 },
      );
    });

    it('distribution counts match actual mastery level counts in input', () => {
      fc.assert(
        fc.property(characterMasteryArrayArb, items => {
          const distribution = calculateMasteryDistribution(items);

          const expectedMastered = items.filter(
            i => i.masteryLevel === 'mastered',
          ).length;
          const expectedLearning = items.filter(
            i => i.masteryLevel === 'learning',
          ).length;
          const expectedNeedsPractice = items.filter(
            i => i.masteryLevel === 'needs-practice',
          ).length;

          expect(distribution.mastered).toBe(expectedMastered);
          expect(distribution.learning).toBe(expectedLearning);
          expect(distribution.needsPractice).toBe(expectedNeedsPractice);
        }),
        { numRuns: 100 },
      );
    });

    it('percentage proportions sum to 100% when total > 0', () => {
      fc.assert(
        fc.property(
          fc.array(characterMasteryItemArb, { minLength: 1, maxLength: 100 }),
          items => {
            const distribution = calculateMasteryDistribution(items);

            if (distribution.total > 0) {
              const masteredPercent =
                (distribution.mastered / distribution.total) * 100;
              const learningPercent =
                (distribution.learning / distribution.total) * 100;
              const needsPracticePercent =
                (distribution.needsPractice / distribution.total) * 100;

              const totalPercent =
                masteredPercent + learningPercent + needsPracticePercent;

              // Allow for floating point precision issues
              expect(totalPercent).toBeCloseTo(100, 10);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it('all distribution counts are non-negative', () => {
      fc.assert(
        fc.property(characterMasteryArrayArb, items => {
          const distribution = calculateMasteryDistribution(items);

          expect(distribution.mastered).toBeGreaterThanOrEqual(0);
          expect(distribution.learning).toBeGreaterThanOrEqual(0);
          expect(distribution.needsPractice).toBeGreaterThanOrEqual(0);
          expect(distribution.total).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('returns all zeros for empty array', () => {
      const distribution = calculateMasteryDistribution([]);

      expect(distribution.mastered).toBe(0);
      expect(distribution.learning).toBe(0);
      expect(distribution.needsPractice).toBe(0);
      expect(distribution.total).toBe(0);
    });

    it('handles single mastered character', () => {
      const items: CharacterMasteryItem[] = [
        {
          character: 'あ',
          correct: 10,
          incorrect: 0,
          total: 10,
          accuracy: 100,
          masteryLevel: 'mastered',
          contentType: 'kana',
        },
      ];

      const distribution = calculateMasteryDistribution(items);

      expect(distribution.mastered).toBe(1);
      expect(distribution.learning).toBe(0);
      expect(distribution.needsPractice).toBe(0);
      expect(distribution.total).toBe(1);
    });

    it('handles single needs-practice character', () => {
      const items: CharacterMasteryItem[] = [
        {
          character: '日',
          correct: 1,
          incorrect: 9,
          total: 10,
          accuracy: 10,
          masteryLevel: 'needs-practice',
          contentType: 'kanji',
        },
      ];

      const distribution = calculateMasteryDistribution(items);

      expect(distribution.mastered).toBe(0);
      expect(distribution.learning).toBe(0);
      expect(distribution.needsPractice).toBe(1);
      expect(distribution.total).toBe(1);
    });

    it('handles mixed mastery levels', () => {
      const items: CharacterMasteryItem[] = [
        {
          character: 'あ',
          correct: 10,
          incorrect: 0,
          total: 10,
          accuracy: 100,
          masteryLevel: 'mastered',
          contentType: 'kana',
        },
        {
          character: 'い',
          correct: 3,
          incorrect: 2,
          total: 5,
          accuracy: 60,
          masteryLevel: 'learning',
          contentType: 'kana',
        },
        {
          character: 'う',
          correct: 1,
          incorrect: 9,
          total: 10,
          accuracy: 10,
          masteryLevel: 'needs-practice',
          contentType: 'kana',
        },
      ];

      const distribution = calculateMasteryDistribution(items);

      expect(distribution.mastered).toBe(1);
      expect(distribution.learning).toBe(1);
      expect(distribution.needsPractice).toBe(1);
      expect(distribution.total).toBe(3);
    });
  });
});
