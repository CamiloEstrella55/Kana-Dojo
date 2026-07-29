'use client';

import StatsPage from './stats/StatsPage';

/**
 * SimpleProgress Component
 *
 * This component serves as a wrapper for the new StatsPage component.
 * It maintains backward compatibility with existing code that imports SimpleProgress.
 *
 * The new StatsPage provides a comprehensive dashboard displaying:
 * - Overview statistics (sessions, accuracy, streak, characters learned)
 * - Character mastery visualization with filtering
 * - Timed mode statistics
 * - Gauntlet mode statistics
 * - Mastery distribution chart
 * - Achievement summary
 *
 * @requirements 1.1-8.4
 */
export default function SimpleProgress() {
  return <StatsPage />;
}
