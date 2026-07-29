import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getStatsOverviewDisplayValues } from '../components/stats/StatsPage';

/**
 * Arbitrary for generating valid stats overview data
 */
const statsOverviewArb = fc.record({
  totalSessions: fc.integer({ min: 0, max: 10000 }),
  totalCorrect: fc.integer({ min: 0, max: 100000 }),
  totalIncorrect: fc.integer({ min: 0, max: 100000 }),
  overallAccuracy: fc.float({ min: 0, max: 100, noNaN: true }),
  bestStreak: fc.integer({ min: 0, max: 10000 }),
  uniqueCharactersLearned: fc.integer({ min: 0, max: 500 }),
});

describe('Stats Overview Display', () => {
  /**
   * **Feature: revamped-stats-page, Property 1: Stats Overview Display Completeness**
   * For any valid stats data containing sessions, correct/incorrect counts, best streak,
   * and character mastery, the rendered Stats_Dashboard output should contain all key metrics:
   * total sessions, overall accuracy percentage, best streak, unique characters count,
   * and total correct/incorrect answers.
   * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
   */
  describe('Property 1: Stats Overview Display Completeness', () => {
    it('displays all required metrics', () => {
      fc.assert(
        fc.property(statsOverviewArb, stats => {
          const displayValues = getStatsOverviewDisplayValues(stats);

          // Verify total sessions is displayed (Requirement 1.1)
          expect(displayValues.totalSessions).toBe(stats.totalSessions);

          // Verify overall accuracy is displayed (Requirement 1.2)
          expect(displayValues.overallAccuracy).toBe(
            `${stats.overallAccuracy.toFixed(1)}%`,
          );

          // Verify best streak is displayed (Requirement 1.3)
          expect(displayValues.bestStreak).toBe(stats.bestStreak);

          // Verify unique characters learned is displayed (Requirement 1.4)
          expect(displayValues.uniqueCharactersLearned).toBe(
            stats.uniqueCharactersLearned,
          );

          // Verify total correct and incorrect are displayed (Requirement 1.5)
          expect(displayValues.totalCorrect).toBe(stats.totalCorrect);
          expect(displayValues.totalIncorrect).toBe(stats.totalIncorrect);

          // Verify all metrics are present
          expect(displayValues.hasAllMetrics).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it('accuracy percentage is always formatted correctly', () => {
      fc.assert(
        fc.property(statsOverviewArb, stats => {
          const displayValues = getStatsOverviewDisplayValues(stats);

          // Accuracy should end with %
          expect(displayValues.overallAccuracy).toMatch(/^\d+\.\d%$/);
        }),
        { numRuns: 100 },
      );
    });

    it('all numeric values are non-negative', () => {
      fc.assert(
        fc.property(statsOverviewArb, stats => {
          const displayValues = getStatsOverviewDisplayValues(stats);

          expect(displayValues.totalSessions).toBeGreaterThanOrEqual(0);
          expect(displayValues.bestStreak).toBeGreaterThanOrEqual(0);
          expect(displayValues.uniqueCharactersLearned).toBeGreaterThanOrEqual(
            0,
          );
          expect(displayValues.totalCorrect).toBeGreaterThanOrEqual(0);
          expect(displayValues.totalIncorrect).toBeGreaterThanOrEqual(0);
        }),
        { numRuns: 100 },
      );
    });

    it('accuracy percentage is between 0% and 100%', () => {
      fc.assert(
        fc.property(statsOverviewArb, stats => {
          const displayValues = getStatsOverviewDisplayValues(stats);
          const percentValue = parseFloat(
            displayValues.overallAccuracy.replace('%', ''),
          );

          expect(percentValue).toBeGreaterThanOrEqual(0);
          expect(percentValue).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('handles zero sessions (empty state)', () => {
      const stats = {
        totalSessions: 0,
        totalCorrect: 0,
        totalIncorrect: 0,
        overallAccuracy: 0,
        bestStreak: 0,
        uniqueCharactersLearned: 0,
      };

      const displayValues = getStatsOverviewDisplayValues(stats);

      expect(displayValues.totalSessions).toBe(0);
      expect(displayValues.overallAccuracy).toBe('0.0%');
      expect(displayValues.bestStreak).toBe(0);
      expect(displayValues.uniqueCharactersLearned).toBe(0);
      expect(displayValues.totalCorrect).toBe(0);
      expect(displayValues.totalIncorrect).toBe(0);
      expect(displayValues.hasAllMetrics).toBe(true);
    });

    it('handles perfect accuracy (100%)', () => {
      const stats = {
        totalSessions: 10,
        totalCorrect: 100,
        totalIncorrect: 0,
        overallAccuracy: 100,
        bestStreak: 100,
        uniqueCharactersLearned: 50,
      };

      const displayValues = getStatsOverviewDisplayValues(stats);

      expect(displayValues.overallAccuracy).toBe('100.0%');
    });

    it('handles zero accuracy (0%)', () => {
      const stats = {
        totalSessions: 5,
        totalCorrect: 0,
        totalIncorrect: 50,
        overallAccuracy: 0,
        bestStreak: 0,
        uniqueCharactersLearned: 10,
      };

      const displayValues = getStatsOverviewDisplayValues(stats);

      expect(displayValues.overallAccuracy).toBe('0.0%');
    });

    it('handles large values', () => {
      const stats = {
        totalSessions: 9999,
        totalCorrect: 99999,
        totalIncorrect: 1,
        overallAccuracy: 99.9,
        bestStreak: 5000,
        uniqueCharactersLearned: 500,
      };

      const displayValues = getStatsOverviewDisplayValues(stats);

      expect(displayValues.totalSessions).toBe(9999);
      expect(displayValues.totalCorrect).toBe(99999);
      expect(displayValues.bestStreak).toBe(5000);
      expect(displayValues.uniqueCharactersLearned).toBe(500);
    });

    it('handles fractional accuracy values', () => {
      const stats = {
        totalSessions: 3,
        totalCorrect: 33,
        totalIncorrect: 67,
        overallAccuracy: 33.333,
        bestStreak: 5,
        uniqueCharactersLearned: 20,
      };

      const displayValues = getStatsOverviewDisplayValues(stats);

      // Should be formatted to 1 decimal place
      expect(displayValues.overallAccuracy).toBe('33.3%');
    });
  });
});
