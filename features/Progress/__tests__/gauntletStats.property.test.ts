import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getGauntletDisplayValues } from '../components/stats/GauntletStatsPanel';
import type { GauntletOverallStats } from '../types/stats';

/**
 * Arbitrary for generating valid GauntletOverallStats
 */
const gauntletStatsArb = fc
  .record({
    totalSessions: fc.integer({ min: 1, max: 1000 }),
    completedSessions: fc.integer({ min: 0, max: 1000 }),
    totalCorrect: fc.integer({ min: 0, max: 10000 }),
    totalWrong: fc.integer({ min: 0, max: 10000 }),
    bestStreak: fc.integer({ min: 0, max: 1000 }),
    fastestTime: fc.oneof(
      fc.constant(null),
      fc.integer({ min: 1000, max: 600000 }),
    ),
  })
  .chain(
    ({
      totalSessions,
      completedSessions,
      totalCorrect,
      totalWrong,
      bestStreak,
      fastestTime,
    }) => {
      // Ensure completedSessions <= totalSessions
      const validCompletedSessions = Math.min(completedSessions, totalSessions);
      const completionRate =
        totalSessions > 0 ? (validCompletedSessions / totalSessions) * 100 : 0;
      const total = totalCorrect + totalWrong;
      const accuracy = total > 0 ? (totalCorrect / total) * 100 : 0;

      return fc.constant({
        totalSessions,
        completedSessions: validCompletedSessions,
        completionRate,
        totalCorrect,
        totalWrong,
        bestStreak,
        fastestTime,
        accuracy,
      } as GauntletOverallStats);
    },
  );

describe('Gauntlet Stats Display', () => {
  /**
   * **Feature: revamped-stats-page, Property 7: Gauntlet Stats Display**
   * For any gauntlet stats containing totalSessions, completedSessions, totalCorrect,
   * totalWrong, bestStreak, and fastestTime, the rendered Gauntlet_Stats_Panel should
   * display all these values plus correctly calculated completion rate and accuracy percentages.
   * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
   */
  describe('Property 7: Gauntlet Stats Display', () => {
    it('displays all required values correctly', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);

          // Verify total sessions is displayed
          expect(displayValues.totalSessions).toBe(stats.totalSessions);

          // Verify completed sessions is displayed
          expect(displayValues.completedSessions).toBe(stats.completedSessions);

          // Verify total correct is displayed
          expect(displayValues.totalCorrect).toBe(stats.totalCorrect);

          // Verify total wrong is displayed
          expect(displayValues.totalWrong).toBe(stats.totalWrong);

          // Verify best streak is displayed
          expect(displayValues.bestStreak).toBe(stats.bestStreak);
        }),
        { numRuns: 100 },
      );
    });

    it('calculates completion rate correctly', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);

          // Completion rate should be (completedSessions / totalSessions) * 100
          const expectedRate =
            stats.totalSessions > 0
              ? (stats.completedSessions / stats.totalSessions) * 100
              : 0;

          expect(displayValues.completionRate).toBe(
            `${expectedRate.toFixed(1)}%`,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('calculates accuracy correctly', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);
          const total = stats.totalCorrect + stats.totalWrong;

          if (total === 0) {
            expect(displayValues.accuracy).toBe('0.0%');
          } else {
            const expectedAccuracy = (stats.totalCorrect / total) * 100;
            expect(displayValues.accuracy).toBe(
              `${expectedAccuracy.toFixed(1)}%`,
            );
          }
        }),
        { numRuns: 100 },
      );
    });

    it('formats fastest time correctly', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);

          if (stats.fastestTime === null) {
            expect(displayValues.fastestTime).toBe('--');
          } else {
            // Should be formatted as time string
            expect(displayValues.fastestTime).toMatch(/^\d+[ms]|\d+m \d+s$/);
          }
        }),
        { numRuns: 100 },
      );
    });

    it('completion rate is always between 0% and 100%', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);
          const rateValue = parseFloat(
            displayValues.completionRate.replace('%', ''),
          );

          expect(rateValue).toBeGreaterThanOrEqual(0);
          expect(rateValue).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });

    it('accuracy is always between 0% and 100%', () => {
      fc.assert(
        fc.property(gauntletStatsArb, stats => {
          const displayValues = getGauntletDisplayValues(stats);
          const accuracyValue = parseFloat(
            displayValues.accuracy.replace('%', ''),
          );

          expect(accuracyValue).toBeGreaterThanOrEqual(0);
          expect(accuracyValue).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('handles zero sessions correctly', () => {
      const stats: GauntletOverallStats = {
        totalSessions: 1,
        completedSessions: 0,
        completionRate: 0,
        totalCorrect: 0,
        totalWrong: 0,
        bestStreak: 0,
        fastestTime: null,
        accuracy: 0,
      };

      const displayValues = getGauntletDisplayValues(stats);

      expect(displayValues.totalSessions).toBe(1);
      expect(displayValues.completionRate).toBe('0.0%');
      expect(displayValues.accuracy).toBe('0.0%');
      expect(displayValues.fastestTime).toBe('--');
    });

    it('handles perfect completion rate (100%)', () => {
      const stats: GauntletOverallStats = {
        totalSessions: 10,
        completedSessions: 10,
        completionRate: 100,
        totalCorrect: 100,
        totalWrong: 0,
        bestStreak: 100,
        fastestTime: 60000,
        accuracy: 100,
      };

      const displayValues = getGauntletDisplayValues(stats);

      expect(displayValues.completionRate).toBe('100.0%');
      expect(displayValues.accuracy).toBe('100.0%');
    });

    it('handles time formatting for seconds only', () => {
      const stats: GauntletOverallStats = {
        totalSessions: 1,
        completedSessions: 1,
        completionRate: 100,
        totalCorrect: 10,
        totalWrong: 0,
        bestStreak: 10,
        fastestTime: 45000, // 45 seconds
        accuracy: 100,
      };

      const displayValues = getGauntletDisplayValues(stats);

      expect(displayValues.fastestTime).toBe('45s');
    });

    it('handles time formatting for minutes and seconds', () => {
      const stats: GauntletOverallStats = {
        totalSessions: 1,
        completedSessions: 1,
        completionRate: 100,
        totalCorrect: 10,
        totalWrong: 0,
        bestStreak: 10,
        fastestTime: 125000, // 2 minutes 5 seconds
        accuracy: 100,
      };

      const displayValues = getGauntletDisplayValues(stats);

      expect(displayValues.fastestTime).toBe('2m 5s');
    });

    it('handles large numbers', () => {
      const stats: GauntletOverallStats = {
        totalSessions: 999,
        completedSessions: 500,
        completionRate: 50.05,
        totalCorrect: 9999,
        totalWrong: 1,
        bestStreak: 500,
        fastestTime: 30000,
        accuracy: 99.99,
      };

      const displayValues = getGauntletDisplayValues(stats);

      expect(displayValues.totalSessions).toBe(999);
      expect(displayValues.completedSessions).toBe(500);
      expect(displayValues.totalCorrect).toBe(9999);
    });
  });
});
