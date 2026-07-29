import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getTimedModeDisplayValues } from '../components/stats/TimedModeStatsPanel';
import type { TimedModeStats } from '../types/stats';

/**
 * Arbitrary for generating valid TimedModeStats
 */
const timedModeStatsArb = fc
  .record({
    correct: fc.integer({ min: 0, max: 10000 }),
    wrong: fc.integer({ min: 0, max: 10000 }),
    streak: fc.integer({ min: 0, max: 1000 }),
    bestStreak: fc.integer({ min: 0, max: 1000 }),
  })
  .map(({ correct, wrong, streak, bestStreak }) => {
    const total = correct + wrong;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;
    return {
      correct,
      wrong,
      streak,
      bestStreak,
      accuracy,
    } as TimedModeStats;
  });

describe('Timed Mode Stats Display', () => {
  /**
   * **Feature: revamped-stats-page, Property 6: Timed Mode Stats Display**
   * For any timed mode stats containing correct, wrong, streak, and bestStreak values,
   * the rendered Timed_Mode_Panel should display all these values plus a correctly
   * calculated accuracy percentage (correct / (correct + wrong) * 100).
   * **Validates: Requirements 3.2, 3.3, 3.4**
   */
  describe('Property 6: Timed Mode Stats Display', () => {
    it('displays all required values correctly', () => {
      fc.assert(
        fc.property(timedModeStatsArb, stats => {
          const displayValues = getTimedModeDisplayValues(stats);

          // Verify correct value is displayed
          expect(displayValues.correct).toBe(stats.correct);

          // Verify wrong value is displayed
          expect(displayValues.wrong).toBe(stats.wrong);

          // Verify streak value is displayed
          expect(displayValues.streak).toBe(stats.streak);

          // Verify best streak value is displayed
          expect(displayValues.bestStreak).toBe(stats.bestStreak);

          // Verify total is calculated correctly
          expect(displayValues.total).toBe(stats.correct + stats.wrong);
        }),
        { numRuns: 100 },
      );
    });

    it('calculates accuracy percentage correctly', () => {
      fc.assert(
        fc.property(timedModeStatsArb, stats => {
          const displayValues = getTimedModeDisplayValues(stats);
          const total = stats.correct + stats.wrong;

          if (total === 0) {
            // When no attempts, accuracy should be 0%
            expect(displayValues.accuracy).toBe('0.0%');
          } else {
            // Accuracy should be (correct / total) * 100
            const expectedAccuracy = (stats.correct / total) * 100;
            expect(displayValues.accuracy).toBe(
              `${expectedAccuracy.toFixed(1)}%`,
            );
          }
        }),
        { numRuns: 100 },
      );
    });

    it('accuracy is always between 0% and 100%', () => {
      fc.assert(
        fc.property(timedModeStatsArb, stats => {
          const displayValues = getTimedModeDisplayValues(stats);
          const accuracyValue = parseFloat(
            displayValues.accuracy.replace('%', ''),
          );

          expect(accuracyValue).toBeGreaterThanOrEqual(0);
          expect(accuracyValue).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });

    it('streak values are non-negative', () => {
      fc.assert(
        fc.property(timedModeStatsArb, stats => {
          const displayValues = getTimedModeDisplayValues(stats);

          expect(displayValues.streak).toBeGreaterThanOrEqual(0);
          expect(displayValues.bestStreak).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('handles zero attempts correctly', () => {
      const stats: TimedModeStats = {
        correct: 0,
        wrong: 0,
        streak: 0,
        bestStreak: 0,
        accuracy: 0,
      };

      const displayValues = getTimedModeDisplayValues(stats);

      expect(displayValues.correct).toBe(0);
      expect(displayValues.wrong).toBe(0);
      expect(displayValues.accuracy).toBe('0.0%');
      expect(displayValues.total).toBe(0);
    });

    it('handles perfect accuracy (100%)', () => {
      const stats: TimedModeStats = {
        correct: 100,
        wrong: 0,
        streak: 100,
        bestStreak: 100,
        accuracy: 100,
      };

      const displayValues = getTimedModeDisplayValues(stats);

      expect(displayValues.accuracy).toBe('100.0%');
    });

    it('handles zero accuracy (0%)', () => {
      const stats: TimedModeStats = {
        correct: 0,
        wrong: 100,
        streak: 0,
        bestStreak: 5,
        accuracy: 0,
      };

      const displayValues = getTimedModeDisplayValues(stats);

      expect(displayValues.accuracy).toBe('0.0%');
    });

    it('handles large numbers', () => {
      const stats: TimedModeStats = {
        correct: 9999,
        wrong: 1,
        streak: 500,
        bestStreak: 1000,
        accuracy: 99.99,
      };

      const displayValues = getTimedModeDisplayValues(stats);

      expect(displayValues.correct).toBe(9999);
      expect(displayValues.wrong).toBe(1);
      expect(displayValues.total).toBe(10000);
    });
  });
});
