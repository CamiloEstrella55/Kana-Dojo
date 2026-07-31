import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface IKanaState {
  selectedGameModeKana: string;
  kanaGroupIndices: number[];
  setSelectedGameModeKana: (mode: string) => void;
  addKanaGroupIndex: (kanaGroupIndex: number) => void;
  addKanaGroupIndices: (kanaGroupIndices: number[]) => void;
}

const sameArray = (a: number[], b: number[]) =>
  a.length === b.length && a.every((v, i) => v === b[i]);

const toggleNumber = (arr: number[], v: number): number[] => {
  const present = arr.includes(v);
  if (present) {
    const next = arr.filter(i => i !== v);
    return next.length === arr.length ? arr : next;
  } else {
    return [...arr, v];
  }
};

const toggleNumbers = (arr: number[], input: number[]): number[] => {
  if (!input.length) return arr;

  const dedupInput: number[] = [];
  const seenIn = new Set<number>();
  for (const v of input) {
    if (!seenIn.has(v)) {
      seenIn.add(v);
      dedupInput.push(v);
    }
  }

  const current = new Set(arr);
  const incoming = new Set(dedupInput);

  const allPresent = dedupInput.every(v => current.has(v));
  if (allPresent) {
    let changed = false;
    const next = arr.filter(v => {
      const drop = incoming.has(v);
      if (drop) changed = true;
      return !drop;
    });
    return changed ? next : arr;
  }

  let changed = false;
  const next = arr.slice();
  for (const v of dedupInput) {
    if (!current.has(v)) {
      next.push(v);
      current.add(v);
      changed = true;
    }
  }
  return changed ? next : arr;
};

/**
 * The character selection must survive a document load: in the native bundle
 * every in-app navigation is a real page load (see NativeNavigation), which
 * destroys in-memory state. Without persistence the training screen opens with
 * an empty selection and renders nothing at all — a blank game.
 *
 * sessionStorage is the right scope: it survives navigation within the running
 * app but still clears when the app is closed, matching the original in-memory
 * behaviour (a selection is per-session, not remembered forever).
 */
const useKanaStore = create<IKanaState>()(
  persist(
    set => ({
      selectedGameModeKana: 'Pick',
      kanaGroupIndices: [],
      setSelectedGameModeKana: gameMode =>
        set({ selectedGameModeKana: gameMode }),

      addKanaGroupIndex: kanaGroupIndex =>
        set(state => {
          const next = toggleNumber(state.kanaGroupIndices, kanaGroupIndex);
          return sameArray(next, state.kanaGroupIndices)
            ? state
            : { kanaGroupIndices: next };
        }),

      addKanaGroupIndices: kanaGroupIndices =>
        set(state => {
          const next = toggleNumbers(state.kanaGroupIndices, kanaGroupIndices);
          return sameArray(next, state.kanaGroupIndices)
            ? state
            : { kanaGroupIndices: next };
        }),
    }),
    {
      name: 'kanadojo-kana-selection',
      storage:
        typeof window !== 'undefined'
          ? createJSONStorage(() => sessionStorage)
          : undefined,
      partialize: state => ({
        selectedGameModeKana: state.selectedGameModeKana,
        kanaGroupIndices: state.kanaGroupIndices,
      }),
    },
  ),
);

export default useKanaStore;
