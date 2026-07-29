'use client';

import { create } from 'zustand';

export type AuthModalView = 'signin' | 'signup' | 'reset' | 'account';

interface AuthModalState {
  open: boolean;
  view: AuthModalView;
  openModal: (view?: AuthModalView) => void;
  setView: (view: AuthModalView) => void;
  closeModal: () => void;
}

const useAuthModalStore = create<AuthModalState>(set => ({
  open: false,
  view: 'signin',
  openModal: view => set({ open: true, view: view ?? 'signin' }),
  setView: view => set({ view }),
  closeModal: () => set({ open: false }),
}));

export default useAuthModalStore;
