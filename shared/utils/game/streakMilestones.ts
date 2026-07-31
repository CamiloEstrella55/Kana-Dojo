export const STREAK_MILESTONES = [
  10, 25, 50, 75, 100, 125, 150, 175, 200, 225, 250,
] as const;

export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export const isStreakMilestone = (streak: number): streak is StreakMilestone =>
  STREAK_MILESTONES.includes(streak as StreakMilestone);

/**
 * The mid-session overlay is a streak celebration only.
 *
 * It previously doubled as an ad interstitial: a flag forced it to appear every
 * 15 answers with the title "Advertisement" regardless of streak. That is gone —
 * the overlay now appears solely on a genuine streak milestone.
 */
export const shouldShowStreakMilestoneOverlay = (streak: number): boolean =>
  isStreakMilestone(streak);
