import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface OnboardingState {
  hasSeenWelcome: boolean;
  setHasSeenWelcome: (hasSeenWelcome: boolean) => void;
  /** True once the native sign-in/sign-up screen has been answered or skipped. */
  hasSeenAuthGate: boolean;
  setHasSeenAuthGate: (hasSeenAuthGate: boolean) => void;
}

const useOnboardingStore = create<OnboardingState>()(
  persist(
    set => ({
      hasSeenWelcome: false,
      setHasSeenWelcome: (hasSeenWelcome: boolean) => set({ hasSeenWelcome }),
      hasSeenAuthGate: false,
      setHasSeenAuthGate: (hasSeenAuthGate: boolean) =>
        set({ hasSeenAuthGate }),
    }),
    {
      name: 'welcome-storage',
      version: 0,
    },
  ),
);

export default useOnboardingStore;
