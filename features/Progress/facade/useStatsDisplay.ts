'use client';

import { useMemo } from 'react';
import useStatsStore from '../store/useStatsStore';

export interface StatsDisplay {
  correctAnswers: number;
  wrongAnswers: number;
  currentStreak: number;
  bestStreak: number;
  stars: number;
  characterHistory: string[];
  characterScores: Record<string, { correct: number; wrong: number }>;
  showStats: boolean;
  toggleStats: () => void;
  iconIndices: number[];
  score: number;
  setScore: (score: number) => void;
  setStars: (stars: number) => void;
  addIconIndex: (index: number) => void;
  setNewTotalMilliseconds: (ms: number) => void;
  saveSession: () => void;
  totalMilliseconds: number;
  correctAnswerTimes: number[];
  totalSessions: number;
  totalCorrect: number;
  totalIncorrect: number;
  characterMastery: Record<string, { correct: number; incorrect: number }>;
}

/**
 * Read-only stats access for display components
 *
 * Use this facade when components only need to display stats,
 * not modify them.
 */
export function useStatsDisplay(): StatsDisplay {
  const correctAnswers = useStatsStore(state => state.numCorrectAnswers);
  const wrongAnswers = useStatsStore(state => state.numWrongAnswers);
  const currentStreak = useStatsStore(state => state.currentStreak);
  const bestStreak = useStatsStore(state => state.allTimeStats.bestStreak);
  const stars = useStatsStore(state => state.stars);
  const characterHistory = useStatsStore(state => state.characterHistory);
  const characterScores = useStatsStore(state => state.characterScores);
  const showStats = useStatsStore(state => state.showStats);
  const toggleStats = useStatsStore(state => state.toggleStats);
  const iconIndices = useStatsStore(state => state.iconIndices);
  const score = useStatsStore(state => state.score);
  const setScore = useStatsStore(state => state.setScore);
  const setStars = useStatsStore(state => state.setStars);
  const addIconIndex = useStatsStore(state => state.addIconIndex);
  const setNewTotalMilliseconds = useStatsStore(
    state => state.setNewTotalMilliseconds,
  );
  const saveSession = useStatsStore(state => state.saveSession);
  const totalMilliseconds = useStatsStore(state => state.totalMilliseconds);
  const correctAnswerTimes = useStatsStore(state => state.correctAnswerTimes);
  const totalSessions = useStatsStore(
    state => state.allTimeStats.totalSessions,
  );
  const totalCorrect = useStatsStore(state => state.allTimeStats.totalCorrect);
  const totalIncorrect = useStatsStore(
    state => state.allTimeStats.totalIncorrect,
  );
  const characterMastery = useStatsStore(
    state => state.allTimeStats.characterMastery,
  );

  return useMemo<StatsDisplay>(
    () => ({
      correctAnswers,
      wrongAnswers,
      currentStreak,
      bestStreak,
      stars,
      characterHistory,
      characterScores,
      showStats,
      toggleStats,
      iconIndices,
      score,
      setScore,
      setStars,
      addIconIndex,
      setNewTotalMilliseconds,
      saveSession,
      totalMilliseconds,
      correctAnswerTimes,
      totalSessions,
      totalCorrect,
      totalIncorrect,
      characterMastery,
    }),
    [
      correctAnswers,
      wrongAnswers,
      currentStreak,
      bestStreak,
      stars,
      characterHistory,
      characterScores,
      showStats,
      toggleStats,
      iconIndices,
      score,
      setScore,
      setStars,
      addIconIndex,
      setNewTotalMilliseconds,
      saveSession,
      totalMilliseconds,
      correctAnswerTimes,
      totalSessions,
      totalCorrect,
      totalIncorrect,
      characterMastery,
    ],
  );
}

export interface SessionStats {
  sessionCorrect: number;
  sessionWrong: number;
  sessionStreak: number;
}

/**
 * Read-only session stats for in-game UI
 */
export function useSessionStats(): SessionStats {
  const sessionCorrect = useStatsStore(state => state.numCorrectAnswers);
  const sessionWrong = useStatsStore(state => state.numWrongAnswers);
  const sessionStreak = useStatsStore(state => state.currentStreak);

  return useMemo<SessionStats>(
    () => ({
      sessionCorrect,
      sessionWrong,
      sessionStreak,
    }),
    [sessionCorrect, sessionWrong, sessionStreak],
  );
}

export interface TimedStats {
  correct: number;
  wrong: number;
  streak: number;
  bestStreak: number;
  reset: () => void;
}

/**
 * Read-only timed mode stats (Blitz/Gauntlet)
 */
export function useTimedStats(
  contentType: 'kana' | 'kanji' | 'vocabulary',
): TimedStats {
  // Select based on content type
  const correct = useStatsStore(state => {
    switch (contentType) {
      case 'kana':
        return state.timedCorrectAnswers;
      case 'kanji':
        return state.timedKanjiCorrectAnswers;
      case 'vocabulary':
        return state.timedVocabCorrectAnswers;
    }
  });

  const wrong = useStatsStore(state => {
    switch (contentType) {
      case 'kana':
        return state.timedWrongAnswers;
      case 'kanji':
        return state.timedKanjiWrongAnswers;
      case 'vocabulary':
        return state.timedVocabWrongAnswers;
    }
  });

  const streak = useStatsStore(state => {
    switch (contentType) {
      case 'kana':
        return state.timedStreak;
      case 'kanji':
        return state.timedKanjiStreak;
      case 'vocabulary':
        return state.timedVocabStreak;
    }
  });

  const bestStreak = useStatsStore(state => {
    switch (contentType) {
      case 'kana':
        return state.timedBestStreak;
      case 'kanji':
        return state.timedKanjiBestStreak;
      case 'vocabulary':
        return state.timedVocabBestStreak;
    }
  });

  const reset = useStatsStore(state => {
    switch (contentType) {
      case 'kana':
        return state.resetTimedStats;
      case 'kanji':
        return state.resetTimedKanjiStats;
      case 'vocabulary':
        return state.resetTimedVocabStats;
    }
  });

  return useMemo<TimedStats>(
    () => ({
      correct,
      wrong,
      streak,
      bestStreak,
      reset,
    }),
    [correct, wrong, streak, bestStreak, reset],
  );
}
