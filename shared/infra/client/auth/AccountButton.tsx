'use client';

import { UserRound, UserRoundCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';
import useAuthModalStore from './useAuthModalStore';
import { useAuthFeedback } from './useAuthFeedback';

/**
 * Entry point for auth/account. Renders nothing when Supabase sync isn't
 * configured, so the app degrades gracefully to local-only mode.
 *
 * Signed out → a labelled "Sign in" pill so it's easy to find.
 * Signed in  → a compact avatar-style button.
 */
export default function AccountButton({
  className,
}: {
  className?: string;
}) {
  const { configured, user, loading } = useAuth();
  const openModal = useAuthModalStore(s => s.openModal);
  const feedback = useAuthFeedback();

  if (!configured) return null;

  const signedIn = Boolean(user);
  const Icon = signedIn ? UserRoundCheck : UserRound;
  const label = signedIn ? 'Account' : 'Sign in';

  const initial =
    (user?.user_metadata?.display_name as string | undefined)?.[0] ??
    user?.email?.[0] ??
    '';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={loading}
      onClick={() => {
        feedback.tap();
        openModal(signedIn ? 'account' : 'signin');
      }}
      className={
        className ??
        clsxPill(signedIn)
      }
    >
      {signedIn && initial ? (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-(--main-color) text-xs font-bold text-(--background-color) uppercase">
          {initial}
        </span>
      ) : (
        <Icon className="h-[18px] w-[18px]" aria-hidden />
      )}
      {!signedIn && <span>{label}</span>}
    </button>
  );
}

function clsxPill(signedIn: boolean): string {
  const base =
    'inline-flex items-center gap-2 rounded-full bg-(--card-color) font-medium text-(--main-color) shadow-sm backdrop-blur-sm transition-all hover:brightness-110 active:scale-95 disabled:opacity-50';
  return signedIn
    ? `${base} h-10 w-10 justify-center p-0`
    : `${base} h-10 px-4 text-sm`;
}
