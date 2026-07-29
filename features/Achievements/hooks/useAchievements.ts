import { useEffect, useCallback, useMemo, useRef } from 'react';
import useAchievementStore, {
  type Achievement,
} from '../store/useAchievementStore';
import { useStatsStore } from '@/features/Progress';

const FIRST_VISIT_ACHIEVEMENT_GATE_KEY =
  'kanadojo-achievements-initial-visit-complete';

interface UseAchievementsReturn {
  checkForNewAchievements: () => Achievement[];
  totalPoints: number;
  level: number;
  unlockedCount: number;
  hasUnseenNotifications: boolean;
}

/**
 * Hook to integrate achievements with the game flow
 * Automatically checks for new achievements when stats change
 */
export const useAchievements = (): UseAchievementsReturn => {
  const stats = useStatsStore();
  const achievementStore = useAchievementStore();
  const shouldSkipInitialAutoCheck = useMemo(() => {
    if (typeof window === 'undefined') return false;
    try {
      const hasCompletedInitialVisitGate =
        window.localStorage.getItem(FIRST_VISIT_ACHIEVEMENT_GATE_KEY) ===
        'true';

      if (!hasCompletedInitialVisitGate) {
        window.localStorage.setItem(FIRST_VISIT_ACHIEVEMENT_GATE_KEY, 'true');
        return true;
      }
    } catch {
      return false;
    }

    return false;
  }, []);
  const hasSkippedInitialAutoCheck = useRef(false);

  // Check for new achievements based on current stats
  const checkForNewAchievements = useCallback(() => {
    return achievementStore.checkAchievements(stats);
  }, [stats, achievementStore]);

  // Auto-check achievements when relevant stats change
  useEffect(() => {
    if (shouldSkipInitialAutoCheck && !hasSkippedInitialAutoCheck.current) {
      hasSkippedInitialAutoCheck.current = true;
      return;
    }

    checkForNewAchievements();
  }, [stats.allTimeStats, checkForNewAchievements, shouldSkipInitialAutoCheck]);

  const unlockedCount = Object.keys(
    achievementStore.unlockedAchievements,
  ).length;
  const hasUnseenNotifications = useAchievementStore(
    state => state.hasUnseenNotifications,
  );

  return {
    checkForNewAchievements,
    totalPoints: achievementStore.totalPoints,
    level: achievementStore.level,
    unlockedCount,
    hasUnseenNotifications,
  };
};

/**
 * Hook specifically for triggering achievement checks after game actions
 */
export const useAchievementTrigger = () => {
  const achievementStore = useAchievementStore();
  const stats = useStatsStore();

  const triggerAchievementCheck = useCallback(() => {
    const newAchievements = achievementStore.checkAchievements(stats);
    return newAchievements;
  }, [achievementStore, stats]);

  return { triggerAchievementCheck };
};

export default useAchievements;
