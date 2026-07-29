/**
 * Gauntlet Settings Store
 *
 * Stores all Gauntlet mode settings (game mode, difficulty, repetitions)
 * in a centralized store that persists across navigation and sessions.
 *
 * This store solves the bug where settings selected in PreGameScreen were
 * not persisting when navigating to the Gauntlet game route, because they
 * were stored in local component state.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type GauntletDifficulty = 'normal' | 'hard' | 'instant-death';
export type GauntletGameMode = 'Pick' | 'Type';
export type RepetitionCount = 3 | 5 | 10 | 15 | 20;

interface GauntletSettingsState {
  // Settings per dojo type
  kanaGameMode: GauntletGameMode;
  kanaDifficulty: GauntletDifficulty;
  kanaRepetitions: RepetitionCount;
  kanjiGameMode: GauntletGameMode;
  kanjiDifficulty: GauntletDifficulty;
  kanjiRepetitions: RepetitionCount;
  vocabularyGameMode: GauntletGameMode;
  vocabularyDifficulty: GauntletDifficulty;
  vocabularyRepetitions: RepetitionCount;

  // Actions
  setGameMode: (
    dojoType: 'kana' | 'kanji' | 'vocabulary',
    gameMode: GauntletGameMode,
  ) => void;
  setDifficulty: (
    dojoType: 'kana' | 'kanji' | 'vocabulary',
    difficulty: GauntletDifficulty,
  ) => void;
  setRepetitions: (
    dojoType: 'kana' | 'kanji' | 'vocabulary',
    repetitions: RepetitionCount,
  ) => void;
  getGameMode: (dojoType: 'kana' | 'kanji' | 'vocabulary') => GauntletGameMode;
  getDifficulty: (
    dojoType: 'kana' | 'kanji' | 'vocabulary',
  ) => GauntletDifficulty;
  getRepetitions: (
    dojoType: 'kana' | 'kanji' | 'vocabulary',
  ) => RepetitionCount;
}

const useGauntletSettingsStore = create<GauntletSettingsState>()(
  persist(
    (set, get) => ({
      // Default settings - Pick mode is the default as it's easier for beginners
      kanaGameMode: 'Pick',
      kanaDifficulty: 'normal',
      kanaRepetitions: 10,
      kanjiGameMode: 'Pick',
      kanjiDifficulty: 'normal',
      kanjiRepetitions: 10,
      vocabularyGameMode: 'Pick',
      vocabularyDifficulty: 'normal',
      vocabularyRepetitions: 10,

      setGameMode: (dojoType, gameMode) => {
        switch (dojoType) {
          case 'kana':
            set({ kanaGameMode: gameMode });
            break;
          case 'kanji':
            set({ kanjiGameMode: gameMode });
            break;
          case 'vocabulary':
            set({ vocabularyGameMode: gameMode });
            break;
        }
      },

      setDifficulty: (dojoType, difficulty) => {
        switch (dojoType) {
          case 'kana':
            set({ kanaDifficulty: difficulty });
            break;
          case 'kanji':
            set({ kanjiDifficulty: difficulty });
            break;
          case 'vocabulary':
            set({ vocabularyDifficulty: difficulty });
            break;
        }
      },

      setRepetitions: (dojoType, repetitions) => {
        switch (dojoType) {
          case 'kana':
            set({ kanaRepetitions: repetitions });
            break;
          case 'kanji':
            set({ kanjiRepetitions: repetitions });
            break;
          case 'vocabulary':
            set({ vocabularyRepetitions: repetitions });
            break;
        }
      },

      getGameMode: dojoType => {
        const state = get();
        switch (dojoType) {
          case 'kana':
            return state.kanaGameMode;
          case 'kanji':
            return state.kanjiGameMode;
          case 'vocabulary':
            return state.vocabularyGameMode;
          default:
            return 'Pick';
        }
      },

      getDifficulty: dojoType => {
        const state = get();
        switch (dojoType) {
          case 'kana':
            return state.kanaDifficulty;
          case 'kanji':
            return state.kanjiDifficulty;
          case 'vocabulary':
            return state.vocabularyDifficulty;
          default:
            return 'normal';
        }
      },

      getRepetitions: dojoType => {
        const state = get();
        switch (dojoType) {
          case 'kana':
            return state.kanaRepetitions;
          case 'kanji':
            return state.kanjiRepetitions;
          case 'vocabulary':
            return state.vocabularyRepetitions;
          default:
            return 10;
        }
      },
    }),
    {
      name: 'gauntlet-settings-storage',
    },
  ),
);

export default useGauntletSettingsStore;
