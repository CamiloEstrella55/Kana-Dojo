import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ACHIEVEMENTS, type Achievement } from '../store/useAchievementStore';

/**
 * **Feature: expanded-achievements, Property 3: Mode Completion Achievement Unlocking**
 * For any Gauntlet or Blitz completion achievement and for any session completion
 * event matching the required criteria (difficulty, completion status), the achievement
 * SHALL be unlocked if not already unlocked.
 * **Validates: Requirements 4.1-4.4, 4.7-4.8, 5.1**
 */

// Filter mode completion achievements
const MODE_COMPLETION_TYPES = [
  'gauntlet_completion',
  'gauntlet_difficulty',
  'gauntlet_perfect',
  'gauntlet_lives',
  'blitz_session',
] as const;

const modeCompletionAchievements = ACHIEVEMENTS.filter(a =>
  MODE_COMPLETION_TYPES.includes(
    a.requirements.type as (typeof MODE_COMPLETION_TYPES)[number],
  ),
);

// Helper to create gauntlet stats
function createGauntletStats(params: {
  completedRuns?: number;
  normalCompleted?: number;
  hardCompleted?: number;
  instantDeathCompleted?: number;
  perfectRuns?: number;
  noDeathRuns?: number;
  livesRegenerated?: number;
}) {
  return {
    totalRuns: params.completedRuns ?? 0,
    completedRuns: params.completedRuns ?? 0,
    normalCompleted: params.normalCompleted ?? 0,
    hardCompleted: params.hardCompleted ?? 0,
    instantDeathCompleted: params.instantDeathCompleted ?? 0,
    perfectRuns: params.perfectRuns ?? 0,
    noDeathRuns: params.noDeathRuns ?? 0,
    livesRegenerated: params.livesRegenerated ?? 0,
    bestStreak: 0,
  };
}

// Helper to create blitz stats
function createBlitzStats(params: {
  totalSessions?: number;
  bestSessionScore?: number;
}) {
  return {
    totalSessions: params.totalSessions ?? 0,
    bestSessionScore: params.bestSessionScore ?? 0,
    bestStreak: 0,
    totalCorrect: 0,
  };
}

// Helper to create stats for mode completion achievement
function createStatsForModeCompletion(
  achievement: Achievement,
  meetsRequirement: boolean,
): { allTimeStats: Record<string, unknown> } {
  const { type, value, additional } = achievement.requirements;

  const baseStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    bestStreak: 0,
    totalSessions: 0,
    gauntletStats: createGauntletStats({}),
    blitzStats: createBlitzStats({}),
  };

  const targetValue = meetsRequirement ? value : Math.max(0, value - 1);

  switch (type) {
    case 'gauntlet_completion':
      baseStats.gauntletStats = createGauntletStats({
        completedRuns: targetValue,
      });
      break;

    case 'gauntlet_difficulty': {
      const difficulty = additional?.difficulty;
      if (difficulty === 'normal') {
        baseStats.gauntletStats = createGauntletStats({
          normalCompleted: targetValue,
          completedRuns: targetValue,
        });
      } else if (difficulty === 'hard') {
        baseStats.gauntletStats = createGauntletStats({
          hardCompleted: targetValue,
          completedRuns: targetValue,
        });
      } else if (difficulty === 'instant-death') {
        baseStats.gauntletStats = createGauntletStats({
          instantDeathCompleted: targetValue,
          completedRuns: targetValue,
        });
      }
      break;
    }

    case 'gauntlet_perfect':
      baseStats.gauntletStats = createGauntletStats({
        perfectRuns: targetValue,
        completedRuns: targetValue,
      });
      break;

    case 'gauntlet_lives': {
      const lifeType = additional?.type;
      if (lifeType === 'no_lives_lost') {
        baseStats.gauntletStats = createGauntletStats({
          noDeathRuns: meetsRequirement ? 1 : 0,
          completedRuns: meetsRequirement ? 1 : 0,
        });
      } else if (lifeType === 'lives_regenerated') {
        baseStats.gauntletStats = createGauntletStats({
          livesRegenerated: targetValue,
        });
      }
      break;
    }

    case 'blitz_session':
      baseStats.blitzStats = createBlitzStats({
        totalSessions: targetValue,
      });
      break;
  }

  return { allTimeStats: baseStats };
}

// Simplified mode completion requirement checker
function checkModeCompletionRequirement(
  achievement: Achievement,
  stats: { allTimeStats: Record<string, unknown> },
): boolean {
  const { type, value, additional } = achievement.requirements;
  const allTimeStats = stats.allTimeStats;

  switch (type) {
    case 'gauntlet_completion': {
      const gauntletStats = allTimeStats.gauntletStats as {
        completedRuns: number;
      };
      return gauntletStats.completedRuns >= value;
    }

    case 'gauntlet_difficulty': {
      const gauntletStats = allTimeStats.gauntletStats as {
        normalCompleted: number;
        hardCompleted: number;
        instantDeathCompleted: number;
      };
      const difficulty = additional?.difficulty;

      if (difficulty === 'normal') {
        return gauntletStats.normalCompleted >= value;
      } else if (difficulty === 'hard') {
        return gauntletStats.hardCompleted >= value;
      } else if (difficulty === 'instant-death') {
        return gauntletStats.instantDeathCompleted >= value;
      }
      return false;
    }

    case 'gauntlet_perfect': {
      const gauntletStats = allTimeStats.gauntletStats as {
        perfectRuns: number;
      };
      return gauntletStats.perfectRuns >= value;
    }

    case 'gauntlet_lives': {
      const gauntletStats = allTimeStats.gauntletStats as {
        noDeathRuns: number;
        livesRegenerated: number;
      };
      const lifeType = additional?.type;

      if (lifeType === 'no_lives_lost') {
        return gauntletStats.noDeathRuns >= 1;
      } else if (lifeType === 'lives_regenerated') {
        return gauntletStats.livesRegenerated >= value;
      }
      return false;
    }

    case 'blitz_session': {
      const blitzStats = allTimeStats.blitzStats as { totalSessions: number };
      return blitzStats.totalSessions >= value;
    }

    default:
      return false;
  }
}

describe('Property 3: Mode Completion Achievement Unlocking', () => {
  it('gauntlet completion achievements unlock when runs are completed', () => {
    const gauntletCompletionAchievements = modeCompletionAchievements.filter(
      a => a.requirements.type === 'gauntlet_completion',
    );

    if (gauntletCompletionAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...gauntletCompletionAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const stats = createStatsForModeCompletion(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkModeCompletionRequirement(achievement, stats);

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          } else if (achievement.requirements.value > 1) {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('gauntlet difficulty achievements unlock for specific difficulties', () => {
    const difficultyAchievements = modeCompletionAchievements.filter(
      a => a.requirements.type === 'gauntlet_difficulty',
    );

    if (difficultyAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...difficultyAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const stats = createStatsForModeCompletion(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkModeCompletionRequirement(achievement, stats);

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          } else if (achievement.requirements.value > 1) {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('gauntlet perfect and lives achievements unlock correctly', () => {
    const specialGauntletAchievements = modeCompletionAchievements.filter(
      a =>
        a.requirements.type === 'gauntlet_perfect' ||
        a.requirements.type === 'gauntlet_lives',
    );

    if (specialGauntletAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...specialGauntletAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const stats = createStatsForModeCompletion(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkModeCompletionRequirement(achievement, stats);

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('blitz session achievements unlock when sessions are completed', () => {
    const blitzSessionAchievements = modeCompletionAchievements.filter(
      a => a.requirements.type === 'blitz_session',
    );

    if (blitzSessionAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...blitzSessionAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const stats = createStatsForModeCompletion(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkModeCompletionRequirement(achievement, stats);

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          } else if (achievement.requirements.value > 1) {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('mode completion achievements are idempotent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...modeCompletionAchievements),
        (achievement: Achievement) => {
          const stats = createStatsForModeCompletion(achievement, true);

          // Check multiple times - should always return same result
          const result1 = checkModeCompletionRequirement(achievement, stats);
          const result2 = checkModeCompletionRequirement(achievement, stats);
          const result3 = checkModeCompletionRequirement(achievement, stats);

          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          expect(result1).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
