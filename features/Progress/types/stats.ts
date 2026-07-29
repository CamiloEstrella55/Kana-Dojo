/**
 * Stats Types and Interfaces
 *
 * Type definitions for the revamped Stats page dashboard.
 * These types support comprehensive statistics display including
 * character mastery, timed mode stats, gauntlet performance, and achievements.
 */

/**
 * Content type categories for filtering and classification
 */
export type ContentType = 'kana' | 'kanji' | 'vocabulary';

/**
 * Content filter including 'all' option for UI filtering
 */
export type ContentFilter = 'all' | ContentType;

/**
 * Mastery level classification based on accuracy and attempt thresholds
 * - mastered: 90%+ accuracy with 10+ attempts
 * - needs-practice: <70% accuracy with 5+ attempts
 * - learning: all other cases
 */
export type MasteryLevel = 'mastered' | 'learning' | 'needs-practice';

/**
 * Individual character mastery data with calculated metrics
 */
export interface CharacterMasteryItem {
  /** The character being tracked */
  character: string;
  /** Number of correct answers */
  correct: number;
  /** Number of incorrect answers */
  incorrect: number;
  /** Total attempts (correct + incorrect) */
  total: number;
  /** Accuracy percentage (0-100) */
  accuracy: number;
  /** Calculated mastery level */
  masteryLevel: MasteryLevel;
  /** Detected content type */
  contentType: ContentType;
}

/**
 * Timed mode statistics for a single content type
 */
export interface TimedModeStats {
  /** Number of correct answers */
  correct: number;
  /** Number of wrong answers */
  wrong: number;
  /** Current streak */
  streak: number;
  /** Best streak achieved */
  bestStreak: number;
  /** Calculated accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Overall gauntlet mode statistics
 */
export interface GauntletOverallStats {
  /** Total gauntlet sessions attempted */
  totalSessions: number;
  /** Number of completed sessions */
  completedSessions: number;
  /** Completion rate percentage (0-100) */
  completionRate: number;
  /** Total correct answers across all sessions */
  totalCorrect: number;
  /** Total wrong answers across all sessions */
  totalWrong: number;
  /** Best streak achieved in gauntlet mode */
  bestStreak: number;
  /** Fastest completion time in milliseconds, null if no completions */
  fastestTime: number | null;
  /** Overall accuracy percentage (0-100) */
  accuracy: number;
}

/**
 * Mastery distribution counts for visualization
 */
export interface MasteryDistribution {
  /** Count of mastered characters */
  mastered: number;
  /** Count of characters being learned */
  learning: number;
  /** Count of characters needing practice */
  needsPractice: number;
  /** Total character count */
  total: number;
}

/**
 * Achievement summary data for display
 */
export interface AchievementSummary {
  /** Total achievement points earned */
  totalPoints: number;
  /** Current achievement level */
  level: number;
  /** Number of unlocked achievements */
  unlockedCount: number;
  /** Total number of available achievements */
  totalAchievements: number;
}

/**
 * Aggregated statistics combining all data sources
 * Used by the main StatsPage component
 */
export interface AggregatedStats {
  // Overview statistics
  /** Total training sessions completed */
  totalSessions: number;
  /** Total correct answers across all sessions */
  totalCorrect: number;
  /** Total incorrect answers across all sessions */
  totalIncorrect: number;
  /** Overall accuracy percentage (0-100) */
  overallAccuracy: number;
  /** Best answer streak achieved */
  bestStreak: number;
  /** Count of unique characters practiced */
  uniqueCharactersLearned: number;

  // Character mastery data
  /** Array of character mastery items with calculated metrics */
  characterMastery: CharacterMasteryItem[];
  /** Mastery distribution counts */
  masteryDistribution: MasteryDistribution;

  // Timed mode statistics by content type
  /** Kana timed mode stats */
  timedKana: TimedModeStats;
  /** Kanji timed mode stats */
  timedKanji: TimedModeStats;
  /** Vocabulary timed mode stats */
  timedVocabulary: TimedModeStats;

  // Gauntlet mode statistics
  /** Gauntlet stats, null if not loaded or unavailable */
  gauntlet: GauntletOverallStats | null;

  // Achievement data
  /** Achievement summary */
  achievements: AchievementSummary;
}

/**
 * Raw character mastery data from the stats store
 */
export interface RawCharacterMastery {
  correct: number;
  incorrect: number;
}
