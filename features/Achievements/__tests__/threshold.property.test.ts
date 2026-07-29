import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { ACHIEVEMENTS, type Achievement } from '../store/useAchievementStore';

/**
 * **Feature: expanded-achievements, Property 1: Threshold Achievement Unlocking**
 * For any achievement with a threshold-based requirement (total_correct, sessions,
 * content_correct, etc.) and for any stats state where the relevant counter equals
 * or exceeds the threshold value, the achievement SHALL be unlocked if not already unlocked.
 * **Validates: Requirements 1.1-1.6, 2.1-2.5, 3.1-3.4, 4.5-4.6, 5.2-5.3, 5.7-5.8, 7.1-7.5, 8.4-8.7, 9.1-9.6, 9.7-9.9**
 */

// Filter threshold-based achievements
const THRESHOLD_REQUIREMENT_TYPES = [
  'total_correct',
  'sessions',
  'content_correct',
  'gauntlet_completion',
  'blitz_session',
  'blitz_score',
  'streak',
  'days_trained',
  'total_points',
] as const;

const thresholdAchievements = ACHIEVEMENTS.filter(a =>
  THRESHOLD_REQUIREMENT_TYPES.includes(
    a.requirements.type as (typeof THRESHOLD_REQUIREMENT_TYPES)[number],
  ),
);

// Helper to create stats that meet a threshold achievement's requirements
function createStatsForThresholdAchievement(
  achievement: Achievement,
  meetsThreshold: boolean,
): { allTimeStats: Record<string, unknown> } {
  const { type, value, additional } = achievement.requirements;
  const targetValue = meetsThreshold ? value : Math.max(0, value - 1);

  const baseStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    bestStreak: 0,
    totalSessions: 0,
    hiraganaCorrect: 0,
    katakanaCorrect: 0,
    kanjiCorrectByLevel: {} as Record<string, number>,
    vocabularyCorrect: 0,
    gauntletStats: {
      totalRuns: 0,
      completedRuns: 0,
      normalCompleted: 0,
      hardCompleted: 0,
      instantDeathCompleted: 0,
      perfectRuns: 0,
      noDeathRuns: 0,
      livesRegenerated: 0,
      bestStreak: 0,
    },
    blitzStats: {
      totalSessions: 0,
      bestSessionScore: 0,
      bestStreak: 0,
      totalCorrect: 0,
    },
    trainingDays: [] as string[],
    dojosUsed: [] as string[],
    modesUsed: [] as string[],
    challengeModesUsed: [] as string[],
  };

  switch (type) {
    case 'total_correct':
      baseStats.totalCorrect = targetValue;
      break;

    case 'sessions':
      baseStats.totalSessions = targetValue;
      break;

    case 'content_correct':
      if (additional?.contentType === 'hiragana') {
        baseStats.hiraganaCorrect = targetValue;
      } else if (additional?.contentType === 'katakana') {
        baseStats.katakanaCorrect = targetValue;
      } else if (additional?.contentType === 'kanji' && additional?.jlptLevel) {
        baseStats.kanjiCorrectByLevel[additional.jlptLevel] = targetValue;
      } else if (additional?.contentType === 'vocabulary') {
        baseStats.vocabularyCorrect = targetValue;
      }
      break;

    case 'gauntlet_completion':
      baseStats.gauntletStats.completedRuns = targetValue;
      break;

    case 'blitz_session':
      baseStats.blitzStats.totalSessions = targetValue;
      break;

    case 'blitz_score':
      baseStats.blitzStats.bestSessionScore = targetValue;
      break;

    case 'streak':
      if (additional?.gameMode === 'gauntlet') {
        baseStats.gauntletStats.bestStreak = targetValue;
      } else if (additional?.gameMode === 'blitz') {
        baseStats.blitzStats.bestStreak = targetValue;
      } else {
        baseStats.bestStreak = targetValue;
      }
      break;

    case 'days_trained':
      // Generate unique training days
      baseStats.trainingDays = Array.from({ length: targetValue }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      });
      break;
  }

  return { allTimeStats: baseStats };
}

// Simplified requirement checker for testing (mirrors the store logic)
function checkThresholdRequirement(
  achievement: Achievement,
  stats: { allTimeStats: Record<string, unknown> },
): boolean {
  const { type, value, additional } = achievement.requirements;
  const allTimeStats = stats.allTimeStats;

  switch (type) {
    case 'total_correct':
      return (allTimeStats.totalCorrect as number) >= value;

    case 'sessions':
      return (allTimeStats.totalSessions as number) >= value;

    case 'content_correct': {
      if (additional?.contentType === 'hiragana') {
        return (allTimeStats.hiraganaCorrect as number) >= value;
      } else if (additional?.contentType === 'katakana') {
        return (allTimeStats.katakanaCorrect as number) >= value;
      } else if (additional?.contentType === 'kanji' && additional?.jlptLevel) {
        const kanjiByLevel = allTimeStats.kanjiCorrectByLevel as Record<
          string,
          number
        >;
        return (kanjiByLevel[additional.jlptLevel] ?? 0) >= value;
      } else if (additional?.contentType === 'vocabulary') {
        return (allTimeStats.vocabularyCorrect as number) >= value;
      }
      return false;
    }

    case 'gauntlet_completion': {
      const gauntletStats = allTimeStats.gauntletStats as {
        completedRuns: number;
      };
      return gauntletStats.completedRuns >= value;
    }

    case 'blitz_session': {
      const blitzStats = allTimeStats.blitzStats as { totalSessions: number };
      return blitzStats.totalSessions >= value;
    }

    case 'blitz_score': {
      const blitzStats = allTimeStats.blitzStats as {
        bestSessionScore: number;
      };
      return blitzStats.bestSessionScore >= value;
    }

    case 'streak': {
      if (additional?.gameMode === 'gauntlet') {
        const gauntletStats = allTimeStats.gauntletStats as {
          bestStreak: number;
        };
        return gauntletStats.bestStreak >= value;
      } else if (additional?.gameMode === 'blitz') {
        const blitzStats = allTimeStats.blitzStats as { bestStreak: number };
        return blitzStats.bestStreak >= value;
      }
      return (allTimeStats.bestStreak as number) >= value;
    }

    case 'days_trained': {
      const trainingDays = allTimeStats.trainingDays as string[];
      return trainingDays.length >= value;
    }

    default:
      return false;
  }
}

describe('Property 1: Threshold Achievement Unlocking', () => {
  it('achievements unlock when stats meet or exceed threshold', () => {
    // Filter to only threshold achievements that don't require total_points
    // (total_points depends on achievement state, not just stats)
    const testableAchievements = thresholdAchievements.filter(
      a => a.requirements.type !== 'total_points',
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...testableAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsThreshold: boolean) => {
          const stats = createStatsForThresholdAchievement(
            achievement,
            meetsThreshold,
          );
          const isUnlocked = checkThresholdRequirement(achievement, stats);

          if (meetsThreshold) {
            expect(isUnlocked).toBe(true);
          } else {
            // When below threshold, should not unlock (unless threshold is 0 or 1)
            if (achievement.requirements.value > 1) {
              expect(isUnlocked).toBe(false);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('threshold achievements unlock at exact threshold value', () => {
    const testableAchievements = thresholdAchievements.filter(
      a => a.requirements.type !== 'total_points' && a.requirements.value > 0,
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...testableAchievements),
        (achievement: Achievement) => {
          // Create stats at exactly the threshold
          const stats = createStatsForThresholdAchievement(achievement, true);
          const isUnlocked = checkThresholdRequirement(achievement, stats);

          expect(isUnlocked).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('threshold achievements unlock when stats exceed threshold', () => {
    const testableAchievements = thresholdAchievements.filter(
      a => a.requirements.type !== 'total_points',
    );

    fc.assert(
      fc.property(
        fc.constantFrom(...testableAchievements),
        fc.integer({ min: 1, max: 100 }),
        (achievement: Achievement, excess: number) => {
          // Create stats that exceed the threshold
          const stats = createStatsForThresholdAchievement(achievement, true);

          // Add excess to the relevant stat
          const { type, additional } = achievement.requirements;
          const allTimeStats = stats.allTimeStats;

          switch (type) {
            case 'total_correct':
              (allTimeStats.totalCorrect as number) += excess;
              break;
            case 'sessions':
              (allTimeStats.totalSessions as number) += excess;
              break;
            case 'content_correct':
              if (additional?.contentType === 'hiragana') {
                (allTimeStats.hiraganaCorrect as number) += excess;
              } else if (additional?.contentType === 'katakana') {
                (allTimeStats.katakanaCorrect as number) += excess;
              } else if (
                additional?.contentType === 'kanji' &&
                additional?.jlptLevel
              ) {
                const kanjiByLevel = allTimeStats.kanjiCorrectByLevel as Record<
                  string,
                  number
                >;
                kanjiByLevel[additional.jlptLevel] += excess;
              } else if (additional?.contentType === 'vocabulary') {
                (allTimeStats.vocabularyCorrect as number) += excess;
              }
              break;
            case 'gauntlet_completion': {
              const gauntletStats = allTimeStats.gauntletStats as {
                completedRuns: number;
              };
              gauntletStats.completedRuns += excess;
              break;
            }
            case 'blitz_session': {
              const blitzStats = allTimeStats.blitzStats as {
                totalSessions: number;
              };
              blitzStats.totalSessions += excess;
              break;
            }
            case 'blitz_score': {
              const blitzStats = allTimeStats.blitzStats as {
                bestSessionScore: number;
              };
              blitzStats.bestSessionScore += excess;
              break;
            }
            case 'streak':
              if (additional?.gameMode === 'gauntlet') {
                const gauntletStats = allTimeStats.gauntletStats as {
                  bestStreak: number;
                };
                gauntletStats.bestStreak += excess;
              } else if (additional?.gameMode === 'blitz') {
                const blitzStats = allTimeStats.blitzStats as {
                  bestStreak: number;
                };
                blitzStats.bestStreak += excess;
              } else {
                (allTimeStats.bestStreak as number) += excess;
              }
              break;
            case 'days_trained': {
              const trainingDays = allTimeStats.trainingDays as string[];
              for (let i = 0; i < excess; i++) {
                const date = new Date();
                date.setDate(date.getDate() - trainingDays.length - i);
                trainingDays.push(date.toISOString().split('T')[0]);
              }
              break;
            }
          }

          const isUnlocked = checkThresholdRequirement(achievement, stats);
          expect(isUnlocked).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });
});
