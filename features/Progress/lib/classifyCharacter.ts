/**
 * Character Mastery Classification
 *
 * Classifies characters into mastery levels based on accuracy and attempt thresholds.
 *
 * Classification rules:
 * - mastered: 90%+ accuracy with 10+ attempts
 * - needs-practice: <70% accuracy with 5+ attempts
 * - learning: all other cases
 */

import type { MasteryLevel } from '../types/stats';

/** Minimum attempts required for mastered classification */
export const MASTERED_MIN_ATTEMPTS = 10;

/** Minimum accuracy (as decimal) required for mastered classification */
export const MASTERED_MIN_ACCURACY = 0.9;

/** Minimum attempts required for needs-practice classification */
export const NEEDS_PRACTICE_MIN_ATTEMPTS = 5;

/** Maximum accuracy (as decimal) for needs-practice classification */
export const NEEDS_PRACTICE_MAX_ACCURACY = 0.7;

/**
 * Classifies a character's mastery level based on correct/incorrect counts
 *
 * @param correct - Number of correct answers
 * @param incorrect - Number of incorrect answers
 * @returns The mastery level classification
 *
 * @example
 * classifyCharacter(18, 2) // 'mastered' (90% accuracy, 20 attempts)
 * classifyCharacter(3, 7)  // 'needs-practice' (30% accuracy, 10 attempts)
 * classifyCharacter(5, 2)  // 'learning' (71% accuracy, 7 attempts)
 */
export function classifyCharacter(
  correct: number,
  incorrect: number,
): MasteryLevel {
  const total = correct + incorrect;

  // No attempts yet - default to learning
  if (total === 0) {
    return 'learning';
  }

  const accuracy = correct / total;

  // Check mastered threshold first (90%+ accuracy with 10+ attempts)
  if (total >= MASTERED_MIN_ATTEMPTS && accuracy >= MASTERED_MIN_ACCURACY) {
    return 'mastered';
  }

  // Check needs-practice threshold (<70% accuracy with 5+ attempts)
  if (
    total >= NEEDS_PRACTICE_MIN_ATTEMPTS &&
    accuracy < NEEDS_PRACTICE_MAX_ACCURACY
  ) {
    return 'needs-practice';
  }

  // Default to learning
  return 'learning';
}
