'use client';

/**
 * Sidecar last-mutation timestamps for stores that don't carry their own
 * `updatedAt`. Kept in a single localStorage entry so we can do last-write-wins
 * without modifying each store's persisted shape.
 */
const META_KEY = 'kanadojo-sync-meta';

type MetaMap = Record<string, number>;

function readMeta(): MetaMap {
  if (typeof window === 'undefined' || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(META_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === 'object' ? (parsed as MetaMap) : {};
  } catch {
    return {};
  }
}

function writeMeta(meta: MetaMap): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** Last known local mutation time for a store (0 if never recorded). */
export function getLocalMutationMs(key: string): number {
  return readMeta()[key] ?? 0;
}

/** Record a local mutation time for a store. */
export function setLocalMutationMs(key: string, ms: number): void {
  const meta = readMeta();
  meta[key] = ms;
  writeMeta(meta);
}

/** Mark a store as mutated "now". */
export function touchLocalMutation(key: string): number {
  const ms = Date.now();
  setLocalMutationMs(key, ms);
  return ms;
}
