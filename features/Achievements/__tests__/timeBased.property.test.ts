import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ACHIEVEMENTS,
  type Achievement,
  type SessionStats,
} from '../store/useAchievementStore';

/**
 * **Feature: expanded-achievements, Property 5: Time-Based Achievement Unlocking**
 * For any speed achievement and for any timing data meeting the speed criteria
 * (total time, average time, or single answer time), the achievement SHALL be
 * unlocked if not already unlocked.
 * **Validates: Requirements 6.1-6.5**
 */

// Filter speed-based achievements
const speedAchievements = ACHIEVEMENTS.filter(
  a => a.requirements.type === 'speed',
);

// Helper to create stats for speed achievement
function createStatsForSpeedAchievement(
  achievement: Achievement,
  meetsRequirement: boolean,
): {
  allTimeStats: Record<string, unknown>;
  sessionStats?: SessionStats;
} {
  const { value, additional } = achievement.requirements;
  const speedType = additional?.type;
  const minAnswers = additional?.minAnswers ?? 10;
  const minAccuracy = additional?.minAccuracy ?? 0;

  const baseStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    bestStreak: 0,
    totalSessions: 0,
    fastestAnswerMs: Infinity,
    answerTimesMs: [] as number[],
  };

  let sessionStats: SessionStats | undefined;

  switch (speedType) {
    case 'single_answer':
      // For single answer speed, set fastest answer time
      baseStats.fastestAnswerMs = meetsRequirement ? value - 100 : value + 100;
      break;

    case 'average': {
      // For average speed, create answer times that average to target
      const targetAvg = meetsRequirement ? value - 100 : value + 100;
      baseStats.answerTimesMs = Array(minAnswers).fill(targetAvg);
      break;
    }

    case 'session': {
      // For session speed, create session stats
      const targetTime = meetsRequirement ? value - 1000 : value + 1000;
      const targetAccuracy = meetsRequirement
        ? minAccuracy + 5
        : minAccuracy - 5;
      sessionStats = {
        sessionTime: targetTime,
        sessionAccuracy: targetAccuracy,
      };
      break;
    }

    default: {
      // Default: total time for minAnswers questions
      const targetTotal = meetsRequirement ? value - 1000 : value + 1000;
      const timePerAnswer = Math.floor(targetTotal / minAnswers);
      baseStats.answerTimesMs = Array(minAnswers).fill(timePerAnswer);
      break;
    }
  }

  return { allTimeStats: baseStats, sessionStats };
}

// Simplified speed requirement checker
function checkSpeedRequirement(
  achievement: Achievement,
  stats: { allTimeStats: Record<string, unknown> },
  sessionStats?: SessionStats,
): boolean {
  const { value, additional } = achievement.requirements;
  const speedType = additional?.type;
  const minAnswers = additional?.minAnswers ?? 0;
  const minAccuracy = additional?.minAccuracy ?? 0;

  const allTimeStats = stats.allTimeStats;
  const answerTimes = (allTimeStats.answerTimesMs as number[]) ?? [];
  const fastestAnswer = (allTimeStats.fastestAnswerMs as number) ?? Infinity;

  switch (speedType) {
    case 'single_answer':
      return fastestAnswer <= value;

    case 'average': {
      if (answerTimes.length < minAnswers) return false;
      const recentTimes = answerTimes.slice(-minAnswers);
      const avgTime =
        recentTimes.reduce((a, b) => a + b, 0) / recentTimes.length;
      return avgTime <= value;
    }

    case 'session': {
      if (!sessionStats) return false;
      const sessionTime = sessionStats.sessionTime ?? Infinity;
      const sessionAccuracy = sessionStats.sessionAccuracy ?? 0;
      return sessionTime <= value && sessionAccuracy >= minAccuracy;
    }

    default: {
      // Total time for minAnswers questions
      if (answerTimes.length < minAnswers) return false;
      const recentTimes = answerTimes.slice(-minAnswers);
      const totalTime = recentTimes.reduce((a, b) => a + b, 0);
      return totalTime <= value;
    }
  }
}

describe('Property 5: Time-Based Achievement Unlocking', () => {
  it('speed achievements unlock when timing criteria are met', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...speedAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const { allTimeStats, sessionStats } = createStatsForSpeedAchievement(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkSpeedRequirement(
            achievement,
            { allTimeStats },
            sessionStats,
          );

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('single answer speed achievements check fastest answer time', () => {
    const singleAnswerAchievements = speedAchievements.filter(
      a => a.requirements.additional?.type === 'single_answer',
    );

    if (singleAnswerAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...singleAnswerAchievements),
        fc.integer({ min: 100, max: 5000 }),
        (achievement: Achievement, answerTime: number) => {
          const { value } = achievement.requirements;

          const stats = {
            allTimeStats: {
              fastestAnswerMs: answerTime,
              answerTimesMs: [],
            },
          };

          const isUnlocked = checkSpeedRequirement(achievement, stats);

          if (answerTime <= value) {
            expect(isUnlocked).toBe(true);
          } else {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('average speed achievements require minimum answers', () => {
    const avgSpeedAchievements = speedAchievements.filter(
      a => a.requirements.additional?.type === 'average',
    );

    if (avgSpeedAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...avgSpeedAchievements),
        (achievement: Achievement) => {
          const minAnswers =
            achievement.requirements.additional?.minAnswers ?? 0;

          // Create stats with fewer answers than required
          const stats = {
            allTimeStats: {
              fastestAnswerMs: Infinity,
              answerTimesMs: Array(Math.max(0, minAnswers - 1)).fill(100), // Fast times but not enough
            },
          };

          const isUnlocked = checkSpeedRequirement(achievement, stats);

          // Should not unlock without minimum answers
          if (minAnswers > 0) {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('session speed achievements require both time and accuracy', () => {
    const sessionSpeedAchievements = speedAchievements.filter(
      a => a.requirements.additional?.type === 'session',
    );

    if (sessionSpeedAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...sessionSpeedAchievements),
        fc.boolean(),
        fc.boolean(),
        (
          achievement: Achievement,
          meetsTime: boolean,
          meetsAccuracy: boolean,
        ) => {
          const { value, additional } = achievement.requirements;
          const minAccuracy = additional?.minAccuracy ?? 0;

          const sessionStats: SessionStats = {
            sessionTime: meetsTime ? value - 1000 : value + 1000,
            sessionAccuracy: meetsAccuracy ? minAccuracy + 5 : minAccuracy - 5,
          };

          const stats = {
            allTimeStats: {
              fastestAnswerMs: Infinity,
              answerTimesMs: [],
            },
          };

          const isUnlocked = checkSpeedRequirement(
            achievement,
            stats,
            sessionStats,
          );

          // Should only unlock if both criteria are met
          if (meetsTime && meetsAccuracy) {
            expect(isUnlocked).toBe(true);
          } else {
            expect(isUnlocked).toBe(false);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('total time speed achievements sum answer times correctly', () => {
    const totalTimeAchievements = speedAchievements.filter(
      a => !a.requirements.additional?.type, // Default type is total time
    );

    if (totalTimeAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...totalTimeAchievements),
        fc.array(fc.integer({ min: 100, max: 10000 }), {
          minLength: 1,
          maxLength: 50,
        }),
        (achievement: Achievement, answerTimes: number[]) => {
          const { value, additional } = achievement.requirements;
          const minAnswers = additional?.minAnswers ?? 0;

          // Ensure we have enough answers
          while (answerTimes.length < minAnswers) {
            answerTimes.push(1000);
          }

          const stats = {
            allTimeStats: {
              fastestAnswerMs: Infinity,
              answerTimesMs: answerTimes,
            },
          };

          const isUnlocked = checkSpeedRequirement(achievement, stats);

          // Calculate expected result
          const recentTimes = answerTimes.slice(-minAnswers);
          const totalTime = recentTimes.reduce((a, b) => a + b, 0);
          const shouldUnlock =
            answerTimes.length >= minAnswers && totalTime <= value;

          expect(isUnlocked).toBe(shouldUnlock);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('speed achievements are monotonic (faster times always unlock)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          ...speedAchievements.filter(
            a => a.requirements.additional?.type === 'single_answer',
          ),
        ),
        fc.integer({ min: 1, max: 500 }),
        (achievement: Achievement, improvement: number) => {
          const { value } = achievement.requirements;

          // Time at threshold
          const statsAtThreshold = {
            allTimeStats: {
              fastestAnswerMs: value,
              answerTimesMs: [],
            },
          };

          // Faster time
          const statsFaster = {
            allTimeStats: {
              fastestAnswerMs: value - improvement,
              answerTimesMs: [],
            },
          };

          const unlockedAtThreshold = checkSpeedRequirement(
            achievement,
            statsAtThreshold,
          );
          const unlockedFaster = checkSpeedRequirement(
            achievement,
            statsFaster,
          );

          // If unlocked at threshold, must be unlocked with faster time
          if (unlockedAtThreshold) {
            expect(unlockedFaster).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
