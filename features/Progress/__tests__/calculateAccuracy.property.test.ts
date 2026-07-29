import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  calculateAccuracy,
  calculateAccuracyRounded,
  formatAccuracy,
} from '../lib/calculateAccuracy';

describe('Accuracy Calculation', () => {
  /**
   * **Feature: revamped-stats-page, Property 10: Accuracy Calculation Correctness**
   * For any correct count C and incorrect count I where (C + I) > 0,
   * the calculated accuracy should equal C / (C + I) * 100, rounded appropriately.
   * When (C + I) = 0, accuracy should be 0.
   * **Validates: Requirements 1.2, 3.4, 4.4**
   */
  describe('Property 10: Accuracy Calculation Correctness', () => {
    it('calculates accuracy correctly for non-zero totals', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (correct, incorrect) => {
            const total = correct + incorrect;
            if (total === 0) return; // Skip zero total case

            const result = calculateAccuracy(correct, incorrect);
            const expected = (correct / total) * 100;

            expect(result).toBeCloseTo(expected, 10);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('returns 0 when total is 0', () => {
      expect(calculateAccuracy(0, 0)).toBe(0);
    });

    it('accuracy is always between 0 and 100', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 0, max: 1000 }),
          fc.integer({ min: 0, max: 1000 }),
          (correct, incorrect) => {
            const result = calculateAccuracy(correct, incorrect);
            expect(result).toBeGreaterThanOrEqual(0);
            expect(result).toBeLessThanOrEqual(100);
          },
        ),
        { numRuns: 50 },
      );
    });

    it('100% accuracy when all correct', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), correct => {
          const result = calculateAccuracy(correct, 0);
          expect(result).toBe(100);
        }),
        { numRuns: 20 },
      );
    });

    it('0% accuracy when all incorrect', () => {
      fc.assert(
        fc.property(fc.integer({ min: 1, max: 1000 }), incorrect => {
          const result = calculateAccuracy(0, incorrect);
          expect(result).toBe(0);
        }),
        { numRuns: 20 },
      );
    });
  });

  describe('Rounded Accuracy', () => {
    it('rounds to specified decimal places', () => {
      expect(calculateAccuracyRounded(1, 2, 1)).toBeCloseTo(33.3, 1);
      expect(calculateAccuracyRounded(1, 2, 2)).toBeCloseTo(33.33, 2);
      expect(calculateAccuracyRounded(1, 2, 0)).toBe(33);
    });

    it('defaults to 1 decimal place', () => {
      const result = calculateAccuracyRounded(7, 3);
      expect(result).toBe(70);
    });
  });

  describe('Format Accuracy', () => {
    it('formats with percentage sign', () => {
      expect(formatAccuracy(9, 1)).toBe('90.0%');
      expect(formatAccuracy(0, 0)).toBe('0.0%');
      expect(formatAccuracy(1, 1)).toBe('50.0%');
    });

    it('respects decimal places parameter', () => {
      expect(formatAccuracy(1, 2, 2)).toBe('33.33%');
      expect(formatAccuracy(1, 2, 0)).toBe('33%');
    });
  });
});
