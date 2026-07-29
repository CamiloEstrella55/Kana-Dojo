import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  classifyCharacter,
  MASTERED_MIN_ATTEMPTS,
  MASTERED_MIN_ACCURACY,
  NEEDS_PRACTICE_MIN_ATTEMPTS,
  NEEDS_PRACTICE_MAX_ACCURACY,
} from '../lib/classifyCharacter';

describe('Character Classification', () => {
  /**
   * **Feature: revamped-stats-page, Property 2: Character Mastery Classification - Mastered Threshold**
   * For any character with correct count C and incorrect count I where (C + I) >= 10
   * and C / (C + I) >= 0.9, the classifyCharacter function should return 'mastered'.
   * **Validates: Requirements 2.2**
   */
  describe('Property 2: Character Mastery Classification - Mastered Threshold', () => {
    it('classifies as mastered when accuracy >= 90% and attempts >= 10', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: MASTERED_MIN_ATTEMPTS, max: 1000 }),
          total => {
            const minCorrect = Math.ceil(total * MASTERED_MIN_ACCURACY);
            const correct = fc.sample(
              fc.integer({ min: minCorrect, max: total }),
              1,
            )[0];
            const incorrect = total - correct;

            const result = classifyCharacter(correct, incorrect);
            expect(result).toBe('mastered');
          },
        ),
        { numRuns: 25 },
      );
    });

    it('does not classify as mastered when attempts < 10 even with high accuracy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: MASTERED_MIN_ATTEMPTS - 1 }),
          total => {
            const result = classifyCharacter(total, 0);
            expect(result).not.toBe('mastered');
          },
        ),
        { numRuns: 9 },
      );
    });
  });

  /**
   * **Feature: revamped-stats-page, Property 3: Character Mastery Classification - Needs Practice Threshold**
   * For any character with correct count C and incorrect count I where (C + I) >= 5
   * and C / (C + I) < 0.7, the classifyCharacter function should return 'needs-practice'.
   * **Validates: Requirements 2.3**
   */
  describe('Property 3: Character Mastery Classification - Needs Practice Threshold', () => {
    it('classifies as needs-practice when accuracy < 70% and attempts >= 5', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: NEEDS_PRACTICE_MIN_ATTEMPTS, max: 100 }),
          total => {
            const maxCorrect =
              Math.floor(total * NEEDS_PRACTICE_MAX_ACCURACY) - 1;
            if (maxCorrect < 0) {
              const result = classifyCharacter(0, total);
              expect(result).toBe('needs-practice');
              return;
            }

            const correct = fc.sample(
              fc.integer({ min: 0, max: maxCorrect }),
              1,
            )[0];
            const incorrect = total - correct;

            const result = classifyCharacter(correct, incorrect);
            expect(result).toBe('needs-practice');
          },
        ),
        { numRuns: 25 },
      );
    });

    it('does not classify as needs-practice when attempts < 5 even with low accuracy', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 1, max: NEEDS_PRACTICE_MIN_ATTEMPTS - 1 }),
          total => {
            const result = classifyCharacter(0, total);
            expect(result).not.toBe('needs-practice');
          },
        ),
        { numRuns: 4 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('returns learning for zero attempts', () => {
      expect(classifyCharacter(0, 0)).toBe('learning');
    });

    it('handles boundary case: exactly 90% accuracy with exactly 10 attempts', () => {
      expect(classifyCharacter(9, 1)).toBe('mastered');
    });

    it('handles boundary case: exactly 70% accuracy is NOT needs-practice', () => {
      expect(classifyCharacter(7, 3)).toBe('learning');
    });

    it('handles boundary case: just under 70% accuracy', () => {
      expect(classifyCharacter(69, 31)).toBe('needs-practice');
    });
  });
});
