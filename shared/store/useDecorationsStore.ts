import { create } from 'zustand';

interface DecorationsState {
  expandDecorations: boolean;
  setExpandDecorations: (value: boolean) => void;
  toggleExpandDecorations: () => void;
}

const useDecorationsStore = create<DecorationsState>()(set => ({
  expandDecorations: false,
  setExpandDecorations: value => set({ expandDecorations: value }),
  toggleExpandDecorations: () =>
    set(state => ({ expandDecorations: !state.expandDecorations })),
}));

export default useDecorationsStore;
