import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getAchievementDisplayValues } from '../components/stats/AchievementSummaryBar';
import type { AchievementSummary } from '../types/stats';

/**
 * Arbitrary for generating valid AchievementSummary
 */
const achievementSummaryArb = fc
  .record({
    totalPoints: fc.integer({ min: 0, max: 100000 }),
    level: fc.integer({ min: 1, max: 100 }),
    unlockedCount: fc.integer({ min: 0, max: 100 }),
    totalAchievements: fc.integer({ min: 1, max: 100 }),
  })
  .chain(({ totalPoints, level, unlockedCount, totalAchievements }) => {
    // Ensure unlockedCount <= totalAchievements
    const validUnlockedCount = Math.min(unlockedCount, totalAchievements);

    return fc.constant({
      totalPoints,
      level,
      unlockedCount: validUnlockedCount,
      totalAchievements,
    } as AchievementSummary);
  });

describe('Achievement Summary Display', () => {
  /**
   * **Feature: revamped-stats-page, Property 9: Achievement Summary Display**
   * For any achievement data containing totalPoints, level, unlockedCount, and totalAchievements,
   * the rendered achievement summary should display all these values correctly.
   * **Validates: Requirements 8.1, 8.2, 8.3**
   */
  describe('Property 9: Achievement Summary Display', () => {
    it('displays all required values correctly', () => {
      fc.assert(
        fc.property(achievementSummaryArb, summary => {
          const displayValues = getAchievementDisplayValues(summary);

          // Verify total points is displayed
          expect(displayValues.totalPoints).toBe(summary.totalPoints);

          // Verify level is displayed
          expect(displayValues.level).toBe(summary.level);

          // Verify unlocked count is displayed
          expect(displayValues.unlockedCount).toBe(summary.unlockedCount);

          // Verify total achievements is displayed
          expect(displayValues.totalAchievements).toBe(
            summary.totalAchievements,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('calculates progress percentage correctly', () => {
      fc.assert(
        fc.property(achievementSummaryArb, summary => {
          const displayValues = getAchievementDisplayValues(summary);

          const expectedPercent =
            summary.totalAchievements > 0
              ? (summary.unlockedCount / summary.totalAchievements) * 100
              : 0;

          expect(displayValues.progressPercent).toBe(
            `${expectedPercent.toFixed(0)}%`,
          );
        }),
        { numRuns: 100 },
      );
    });

    it('progress percentage is always between 0% and 100%', () => {
      fc.assert(
        fc.property(achievementSummaryArb, summary => {
          const displayValues = getAchievementDisplayValues(summary);
          const percentValue = parseInt(
            displayValues.progressPercent.replace('%', ''),
            10,
          );

          expect(percentValue).toBeGreaterThanOrEqual(0);
          expect(percentValue).toBeLessThanOrEqual(100);
        }),
        { numRuns: 100 },
      );
    });

    it('level is always positive', () => {
      fc.assert(
        fc.property(achievementSummaryArb, summary => {
          const displayValues = getAchievementDisplayValues(summary);

          expect(displayValues.level).toBeGreaterThanOrEqual(1);
        }),
        { numRuns: 100 },
      );
    });

    it('unlocked count never exceeds total achievements', () => {
      fc.assert(
        fc.property(achievementSummaryArb, summary => {
          const displayValues = getAchievementDisplayValues(summary);

          expect(displayValues.unlockedCount).toBeLessThanOrEqual(
            displayValues.totalAchievements,
          );
        }),
        { numRuns: 100 },
      );
    });
  });

  /**
   * Edge case tests
   */
  describe('Edge Cases', () => {
    it('handles zero unlocked achievements', () => {
      const summary: AchievementSummary = {
        totalPoints: 0,
        level: 1,
        unlockedCount: 0,
        totalAchievements: 16,
      };

      const displayValues = getAchievementDisplayValues(summary);

      expect(displayValues.totalPoints).toBe(0);
      expect(displayValues.unlockedCount).toBe(0);
      expect(displayValues.progressPercent).toBe('0%');
    });

    it('handles all achievements unlocked (100%)', () => {
      const summary: AchievementSummary = {
        totalPoints: 5000,
        level: 10,
        unlockedCount: 16,
        totalAchievements: 16,
      };

      const displayValues = getAchievementDisplayValues(summary);

      expect(displayValues.progressPercent).toBe('100%');
    });

    it('handles large point values', () => {
      const summary: AchievementSummary = {
        totalPoints: 99999,
        level: 50,
        unlockedCount: 15,
        totalAchievements: 16,
      };

      const displayValues = getAchievementDisplayValues(summary);

      expect(displayValues.totalPoints).toBe(99999);
      expect(displayValues.level).toBe(50);
    });

    it('handles partial progress correctly', () => {
      const summary: AchievementSummary = {
        totalPoints: 1000,
        level: 3,
        unlockedCount: 8,
        totalAchievements: 16,
      };

      const displayValues = getAchievementDisplayValues(summary);

      expect(displayValues.progressPercent).toBe('50%');
    });

    it('rounds progress percentage correctly', () => {
      const summary: AchievementSummary = {
        totalPoints: 500,
        level: 2,
        unlockedCount: 1,
        totalAchievements: 3,
      };

      const displayValues = getAchievementDisplayValues(summary);

      // 1/3 = 33.33...% should round to 33%
      expect(displayValues.progressPercent).toBe('33%');
    });
  });
});
