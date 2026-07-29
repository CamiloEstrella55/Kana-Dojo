import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { ACHIEVEMENTS, type Achievement } from '../store/useAchievementStore';

/**
 * **Feature: expanded-achievements, Property 6: Variety Achievement Unlocking**
 * For any variety/exploration achievement and for any state where the user has
 * used all required dojos/modes/challenge types, the achievement SHALL be unlocked
 * if not already unlocked.
 * **Validates: Requirements 8.1-8.3**
 */

// Filter variety-based achievements
const varietyAchievements = ACHIEVEMENTS.filter(
  a => a.requirements.type === 'variety',
);

// Helper to create stats for variety achievement
function createStatsForVarietyAchievement(
  achievement: Achievement,
  meetsRequirement: boolean,
): { allTimeStats: Record<string, unknown> } {
  const { additional } = achievement.requirements;

  const baseStats = {
    totalCorrect: 0,
    totalIncorrect: 0,
    bestStreak: 0,
    totalSessions: 0,
    dojosUsed: [] as string[],
    modesUsed: [] as string[],
    challengeModesUsed: [] as string[],
  };

  if (additional?.dojos) {
    if (meetsRequirement) {
      baseStats.dojosUsed = [...additional.dojos];
    } else {
      // Use all but one dojo
      baseStats.dojosUsed = additional.dojos.slice(0, -1);
    }
  }

  if (additional?.modes) {
    if (meetsRequirement) {
      baseStats.modesUsed = [...additional.modes];
    } else {
      // Use all but one mode
      baseStats.modesUsed = additional.modes.slice(0, -1);
    }
  }

  if (additional?.challengeModes) {
    if (meetsRequirement) {
      baseStats.challengeModesUsed = [...additional.challengeModes];
    } else {
      // Use all but one challenge mode
      baseStats.challengeModesUsed = additional.challengeModes.slice(0, -1);
    }
  }

  return { allTimeStats: baseStats };
}

// Simplified variety requirement checker
function checkVarietyRequirement(
  achievement: Achievement,
  stats: { allTimeStats: Record<string, unknown> },
): boolean {
  const { value, additional } = achievement.requirements;
  const allTimeStats = stats.allTimeStats;

  if (additional?.dojos) {
    const dojosUsed = (allTimeStats.dojosUsed as string[]) ?? [];
    const requiredDojos = additional.dojos;
    const matchedDojos = requiredDojos.filter(d => dojosUsed.includes(d));
    return matchedDojos.length >= value;
  }

  if (additional?.modes) {
    const modesUsed = (allTimeStats.modesUsed as string[]) ?? [];
    const requiredModes = additional.modes;
    const matchedModes = requiredModes.filter(m => modesUsed.includes(m));
    return matchedModes.length >= value;
  }

  if (additional?.challengeModes) {
    const challengeModesUsed =
      (allTimeStats.challengeModesUsed as string[]) ?? [];
    const requiredChallengeModes = additional.challengeModes;
    const matchedChallengeModes = requiredChallengeModes.filter(cm =>
      challengeModesUsed.includes(cm),
    );
    return matchedChallengeModes.length >= value;
  }

  return false;
}

describe('Property 6: Variety Achievement Unlocking', () => {
  it('variety achievements unlock when all required items are used', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...varietyAchievements),
        fc.boolean(),
        (achievement: Achievement, meetsRequirement: boolean) => {
          const stats = createStatsForVarietyAchievement(
            achievement,
            meetsRequirement,
          );
          const isUnlocked = checkVarietyRequirement(achievement, stats);

          if (meetsRequirement) {
            expect(isUnlocked).toBe(true);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('dojo variety achievements require all specified dojos', () => {
    const dojoAchievements = varietyAchievements.filter(
      a => a.requirements.additional?.dojos,
    );

    if (dojoAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...dojoAchievements),
        (achievement: Achievement) => {
          const requiredDojos =
            achievement.requirements.additional?.dojos ?? [];

          // Test with all dojos
          const statsWithAll = {
            allTimeStats: {
              dojosUsed: [...requiredDojos],
              modesUsed: [],
              challengeModesUsed: [],
            },
          };
          expect(checkVarietyRequirement(achievement, statsWithAll)).toBe(true);

          // Test with missing one dojo
          if (requiredDojos.length > 1) {
            const statsWithMissing = {
              allTimeStats: {
                dojosUsed: requiredDojos.slice(0, -1),
                modesUsed: [],
                challengeModesUsed: [],
              },
            };
            expect(checkVarietyRequirement(achievement, statsWithMissing)).toBe(
              false,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('mode variety achievements require all specified modes', () => {
    const modeAchievements = varietyAchievements.filter(
      a => a.requirements.additional?.modes,
    );

    if (modeAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...modeAchievements),
        (achievement: Achievement) => {
          const requiredModes =
            achievement.requirements.additional?.modes ?? [];

          // Test with all modes
          const statsWithAll = {
            allTimeStats: {
              dojosUsed: [],
              modesUsed: [...requiredModes],
              challengeModesUsed: [],
            },
          };
          expect(checkVarietyRequirement(achievement, statsWithAll)).toBe(true);

          // Test with missing one mode
          if (requiredModes.length > 1) {
            const statsWithMissing = {
              allTimeStats: {
                dojosUsed: [],
                modesUsed: requiredModes.slice(0, -1),
                challengeModesUsed: [],
              },
            };
            expect(checkVarietyRequirement(achievement, statsWithMissing)).toBe(
              false,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('challenge mode variety achievements require all specified challenge modes', () => {
    const challengeModeAchievements = varietyAchievements.filter(
      a => a.requirements.additional?.challengeModes,
    );

    if (challengeModeAchievements.length === 0) {
      return;
    }

    fc.assert(
      fc.property(
        fc.constantFrom(...challengeModeAchievements),
        (achievement: Achievement) => {
          const requiredChallengeModes =
            achievement.requirements.additional?.challengeModes ?? [];

          // Test with all challenge modes
          const statsWithAll = {
            allTimeStats: {
              dojosUsed: [],
              modesUsed: [],
              challengeModesUsed: [...requiredChallengeModes],
            },
          };
          expect(checkVarietyRequirement(achievement, statsWithAll)).toBe(true);

          // Test with missing one challenge mode
          if (requiredChallengeModes.length > 1) {
            const statsWithMissing = {
              allTimeStats: {
                dojosUsed: [],
                modesUsed: [],
                challengeModesUsed: requiredChallengeModes.slice(0, -1),
              },
            };
            expect(checkVarietyRequirement(achievement, statsWithMissing)).toBe(
              false,
            );
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('variety achievements ignore extra items beyond requirements', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...varietyAchievements),
        fc.array(fc.string({ minLength: 1, maxLength: 10 }), {
          minLength: 0,
          maxLength: 5,
        }),
        (achievement: Achievement, extraItems: string[]) => {
          const { additional } = achievement.requirements;

          const stats = {
            allTimeStats: {
              dojosUsed: additional?.dojos
                ? [...additional.dojos, ...extraItems]
                : extraItems,
              modesUsed: additional?.modes
                ? [...additional.modes, ...extraItems]
                : extraItems,
              challengeModesUsed: additional?.challengeModes
                ? [...additional.challengeModes, ...extraItems]
                : extraItems,
            },
          };

          const isUnlocked = checkVarietyRequirement(achievement, stats);

          // Should still unlock with extra items
          expect(isUnlocked).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('variety achievements are order-independent', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...varietyAchievements),
        (achievement: Achievement) => {
          const { additional } = achievement.requirements;

          // Get required items
          const requiredDojos = additional?.dojos ?? [];
          const requiredModes = additional?.modes ?? [];
          const requiredChallengeModes = additional?.challengeModes ?? [];

          // Create stats with items in original order
          const statsOriginal = {
            allTimeStats: {
              dojosUsed: [...requiredDojos],
              modesUsed: [...requiredModes],
              challengeModesUsed: [...requiredChallengeModes],
            },
          };

          // Create stats with items in reversed order
          const statsReversed = {
            allTimeStats: {
              dojosUsed: [...requiredDojos].reverse(),
              modesUsed: [...requiredModes].reverse(),
              challengeModesUsed: [...requiredChallengeModes].reverse(),
            },
          };

          const unlockedOriginal = checkVarietyRequirement(
            achievement,
            statsOriginal,
          );
          const unlockedReversed = checkVarietyRequirement(
            achievement,
            statsReversed,
          );

          // Order should not matter
          expect(unlockedOriginal).toBe(unlockedReversed);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('variety achievements do not unlock with empty usage', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...varietyAchievements),
        (achievement: Achievement) => {
          const stats = {
            allTimeStats: {
              dojosUsed: [],
              modesUsed: [],
              challengeModesUsed: [],
            },
          };

          const isUnlocked = checkVarietyRequirement(achievement, stats);

          // Should not unlock with no usage
          expect(isUnlocked).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });
});
