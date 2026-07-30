'use client';

import { useEffect } from 'react';
import clsx from 'clsx';
import { useAuth } from './AuthProvider';
import useAuthModalStore from './useAuthModalStore';
import { useAuthFeedback } from './useAuthFeedback';
import useOnboardingStore from '@/shared/store/useOnboardingStore';

/**
 * First-run sign-in / sign-up screen for the native app.
 *
 * The on-device build syncs progress through Supabase, so a returning user
 * should be able to restore their data before they start training rather than
 * discovering a small account button in the corner. This greets signed-out
 * users once, then never again (whichever way they answer).
 *
 * Deliberately native-only: the website is a public, indexable landing page and
 * must not be put behind an interstitial.
 *
 * Skipping is always allowed — training, progress, and stats all work fully
 * offline, so an account is an upgrade rather than a requirement.
 */
export default function AuthGate() {
  const { configured, loading, user } = useAuth();
  const openModal = useAuthModalStore(state => state.open);
  const openAuthModal = useAuthModalStore(state => state.openModal);
  const feedback = useAuthFeedback();
  const hasSeenAuthGate = useOnboardingStore(state => state.hasSeenAuthGate);
  const setHasSeenAuthGate = useOnboardingStore(
    state => state.setHasSeenAuthGate,
  );

  // Signing in satisfies the gate permanently.
  useEffect(() => {
    if (user && !hasSeenAuthGate) setHasSeenAuthGate(true);
  }, [user, hasSeenAuthGate, setHasSeenAuthGate]);

  const shouldShow = configured && !loading && !user && !hasSeenAuthGate;
  if (!shouldShow) return null;

  const dismiss = () => {
    feedback.tap();
    setHasSeenAuthGate(true);
  };

  const start = (view: 'signin' | 'signup') => {
    feedback.tap();
    openAuthModal(view);
  };

  return (
    <div
      // Hidden (not unmounted) while the auth form is open, so the gate is not
      // torn down mid-flow and does not stack behind the modal.
      className={clsx(
        'fixed inset-0 z-[9998] flex flex-col items-center justify-center',
        'bg-(--background-color) px-6 text-(--main-color)',
        openModal && 'invisible',
      )}
      style={{
        paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)',
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)',
      }}
    >
      <div className='flex w-full max-w-sm flex-col items-center gap-2 text-center'>
        <div
          aria-hidden
          className='mb-2 grid h-20 w-20 place-items-center rounded-3xl bg-(--card-color) text-3xl font-bold'
        >
          仮名
        </div>
        <h1 className='text-3xl font-bold'>KanaDojo</h1>
        <p className='text-lg text-(--secondary-color)'>かな道場</p>
        <p className='mt-3 text-pretty text-(--secondary-color)'>
          Sign in to keep your progress, stats, and streaks in sync across your
          devices.
        </p>

        <div className='mt-7 flex w-full flex-col gap-3'>
          <button
            onClick={() => start('signup')}
            className={clsx(
              'w-full cursor-pointer rounded-2xl px-6 py-4 text-lg font-semibold',
              'bg-(--main-color) text-(--background-color)',
              'border-b-6 border-(--main-color-accent)',
              'transition-all duration-150 active:translate-y-[3px] active:border-b-0',
            )}
          >
            Create account
          </button>
          <button
            onClick={() => start('signin')}
            className={clsx(
              'w-full cursor-pointer rounded-2xl px-6 py-4 text-lg font-semibold',
              'bg-(--card-color) text-(--main-color)',
              'border-b-6 border-(--border-color)',
              'transition-all duration-150 active:translate-y-[3px] active:border-b-0',
            )}
          >
            Sign in
          </button>
          <button
            onClick={dismiss}
            className={clsx(
              'mt-1 w-full cursor-pointer rounded-xl px-6 py-3',
              'text-(--secondary-color) underline underline-offset-4',
              'transition-opacity duration-150 active:opacity-70',
            )}
          >
            Continue without an account
          </button>
        </div>
      </div>
    </div>
  );
}
