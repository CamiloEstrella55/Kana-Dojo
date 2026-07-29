/**
 * Accuracy Calculation Utility
 *
 * Calculates accuracy percentage from correct and incorrect counts.
 * Handles division by zero edge case by returning 0.
 */

/**
 * Calculates accuracy as a percentage (0-100)
 *
 * @param correct - Number of correct answers
 * @param incorrect - Number of incorrect answers
 * @returns Accuracy percentage (0-100), or 0 if no attempts
 *
 * @example
 * calculateAccuracy(9, 1)   // 90
 * calculateAccuracy(0, 0)   // 0 (no attempts)
 * calculateAccuracy(50, 50) // 50
 */
export function calculateAccuracy(correct: number, incorrect: number): number {
  const total = correct + incorrect;

  // Handle division by zero
  if (total === 0) {
    return 0;
  }

  return (correct / total) * 100;
}

/**
 * Calculates accuracy as a percentage with rounding
 *
 * @param correct - Number of correct answers
 * @param incorrect - Number of incorrect answers
 * @param decimals - Number of decimal places (default: 1)
 * @returns Rounded accuracy percentage (0-100)
 *
 * @example
 * calculateAccuracyRounded(7, 3)     // 70
 * calculateAccuracyRounded(2, 3, 2)  // 40
 */
export function calculateAccuracyRounded(
  correct: number,
  incorrect: number,
  decimals: number = 1,
): number {
  const accuracy = calculateAccuracy(correct, incorrect);
  const factor = Math.pow(10, decimals);
  return Math.round(accuracy * factor) / factor;
}

/**
 * Formats accuracy as a display string with percentage sign
 *
 * @param correct - Number of correct answers
 * @param incorrect - Number of incorrect answers
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted accuracy string (e.g., "90.0%")
 *
 * @example
 * formatAccuracy(9, 1)  // "90.0%"
 * formatAccuracy(0, 0)  // "0.0%"
 */
export function formatAccuracy(
  correct: number,
  incorrect: number,
  decimals: number = 1,
): string {
  const accuracy = calculateAccuracyRounded(correct, incorrect, decimals);
  return `${accuracy.toFixed(decimals)}%`;
}
