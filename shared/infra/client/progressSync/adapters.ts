'use client';

import localforage from 'localforage';
import type { StoreApi } from 'zustand';
import type { ProgressSyncAdapter } from './types';
import { getLocalMutationMs, setLocalMutationMs } from './syncMeta';

import useStatsStore from '@/features/Progress/store/useStatsStore';
import useAchievementStore from '@/features/Achievements/store/useAchievementStore';
import useGoalTimersStore from '@/features/Preferences/store/useGoalTimersStore';
import useVocabStore from '@/features/Vocabulary/store/useVocabStore';
import useSetProgressStore, {
  type AllTimeSetProgress,
} from '@/features/Progress/store/useSetProgressStore';
import useVisitStore from '@/features/Progress/store/useVisitStore';

/** Minimal shape of a Zustand store with the persist middleware attached. */
type PersistStore = StoreApi<unknown> & {
  persist: { rehydrate: () => Promise<void> | void };
  subscribe: (listener: () => void) => () => void;
};

/**
 * Adapter for a Zustand-persist store backed by localStorage. The synced
 * payload is the raw persisted wrapper (`{ state, version }`), which
 * `persist.rehydrate()` knows how to re-read.
 */
function persistLocalStorageAdapter(
  store: PersistStore,
  key: string,
): ProgressSyncAdapter {
  return {
    key,
    async read() {
      if (typeof window === 'undefined') return null;
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      let data: unknown;
      try {
        data = JSON.parse(raw);
      } catch {
        return null;
      }
      return { data, updatedAtMs: getLocalMutationMs(key) };
    },
    async applyRemote(payload) {
      if (typeof window === 'undefined') return;
      window.localStorage.setItem(key, JSON.stringify(payload.data));
      setLocalMutationMs(key, payload.updatedAtMs);
      await store.persist.rehydrate();
    },
    subscribe(onChange) {
      return store.subscribe(onChange);
    },
  };
}

/**
 * Set-progress (SRS) store. Uses a dedicated localforage instance and carries
 * its own `updatedAt`. Merge keeps the higher `correct` count per item so
 * concurrent offline practice on two devices never loses ground.
 */
const setProgressLf = localforage.createInstance({
  name: 'kanadojo',
  storeName: 'set_progress',
});
const SET_PROGRESS_KEY = 'kanadojo-set-progress-v1';

function isSetProgress(v: unknown): v is AllTimeSetProgress {
  return (
    !!v &&
    typeof v === 'object' &&
    'kanji' in v &&
    'vocabulary' in v &&
    'updatedAt' in v
  );
}

const setProgressAdapter: ProgressSyncAdapter = {
  key: 'kanadojo-set-progress',
  async read() {
    const data = useSetProgressStore.getState().data;
    return { data, updatedAtMs: data.updatedAt ?? 0 };
  },
  async applyRemote(payload) {
    if (!isSetProgress(payload.data)) return;
    const data = payload.data;
    await setProgressLf.setItem(SET_PROGRESS_KEY, data);
    useSetProgressStore.setState({ data, isHydrated: true });
  },
  merge(local, remote) {
    if (!isSetProgress(local.data)) return remote;
    if (!isSetProgress(remote.data)) return local;
    const kanji: AllTimeSetProgress['kanji'] = { ...remote.data.kanji };
    for (const [k, v] of Object.entries(local.data.kanji)) {
      kanji[k] = {
        correct: Math.max(v.correct, remote.data.kanji[k]?.correct ?? 0),
      };
    }
    const vocabulary: AllTimeSetProgress['vocabulary'] = {
      ...remote.data.vocabulary,
    };
    for (const [k, v] of Object.entries(local.data.vocabulary)) {
      const r = remote.data.vocabulary[k];
      vocabulary[k] = {
        meaningCorrect: Math.max(v.meaningCorrect, r?.meaningCorrect ?? 0),
        readingCorrect: Math.max(v.readingCorrect, r?.readingCorrect ?? 0),
      };
    }
    const updatedAtMs = Math.max(local.updatedAtMs, remote.updatedAtMs);
    const merged: AllTimeSetProgress = {
      version: 1,
      updatedAt: updatedAtMs,
      kanji,
      vocabulary,
    };
    return { data: merged, updatedAtMs };
  },
  subscribe(onChange) {
    return useSetProgressStore.subscribe(onChange);
  },
};

/**
 * Visit history (streaks). Raw `string[]` of ISO dates in localforage. Merge is
 * a lossless union so streaks survive syncing across devices.
 */
const VISITS_KEY = 'kanadojo-visits';

function asDateArray(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter(
        (d): d is string =>
          typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d),
      )
    : [];
}

const visitsAdapter: ProgressSyncAdapter = {
  key: 'kanadojo-visits',
  async read() {
    const visits = useVisitStore.getState().getVisits();
    return { data: visits, updatedAtMs: getLocalMutationMs('kanadojo-visits') };
  },
  async applyRemote(payload) {
    const visits = asDateArray(payload.data);
    await localforage.setItem(VISITS_KEY, visits);
    setLocalMutationMs('kanadojo-visits', payload.updatedAtMs);
    await useVisitStore.getState().loadVisits();
  },
  merge(local, remote) {
    const union = Array.from(
      new Set([...asDateArray(local.data), ...asDateArray(remote.data)]),
    ).sort();
    return {
      data: union,
      updatedAtMs: Math.max(local.updatedAtMs, remote.updatedAtMs),
    };
  },
  subscribe(onChange) {
    return useVisitStore.subscribe(onChange);
  },
};

/**
 * The stores that sync across devices: progress, statistics, streaks,
 * achievements, goals, and saved vocabulary. Derived caches (kanji-cache,
 * vocab-cache), UI/session state, and onboarding flags are intentionally
 * excluded.
 */
export const SYNC_ADAPTERS: ProgressSyncAdapter[] = [
  persistLocalStorageAdapter(
    useStatsStore as unknown as PersistStore,
    'kanadojo-stats',
  ),
  persistLocalStorageAdapter(
    useAchievementStore as unknown as PersistStore,
    'kanadojo-achievements',
  ),
  persistLocalStorageAdapter(
    useGoalTimersStore as unknown as PersistStore,
    'kanadojo-goal-timers',
  ),
  persistLocalStorageAdapter(
    useVocabStore as unknown as PersistStore,
    'vocabulary-storage',
  ),
  setProgressAdapter,
  visitsAdapter,
];
