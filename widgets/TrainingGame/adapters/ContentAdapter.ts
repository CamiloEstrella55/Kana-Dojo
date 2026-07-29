// ============================================================================
// Content Adapter Interface - Abstraction for different content types
// ============================================================================

export type GameMode = 'pick' | 'reverse-pick' | 'input' | 'reverse-input';

export interface ContentAdapter<T> {
  /**
   * Get the question to display to the user
   */
  getQuestion(item: T, mode: GameMode): string;

  /**
   * Get the correct answer for validation
   */
  getCorrectAnswer(item: T, mode: GameMode): string;

  /**
   * Generate wrong answer options for multiple choice
   */
  generateOptions(item: T, pool: T[], mode: GameMode, count: number): string[];

  /**
   * Validate user answer (case-insensitive, trimmed)
   */
  validateAnswer(userAnswer: string, item: T, mode: GameMode): boolean;

  /**
   * Get display metadata (readings, translations, etc.)
   */
  getMetadata?(item: T): {
    primary: string;
    secondary?: string;
    readings?: string[];
    meanings?: string[];
  };
}
