'use client';

import { UserRound, UserRoundCheck } from 'lucide-react';
import { useAuth } from './AuthProvider';
import useAuthModalStore from './useAuthModalStore';

/**
 * Compact entry point for auth/account. Renders nothing when Supabase sync
 * isn't configured, so the app degrades gracefully to local-only mode.
 * Drop it into any nav/toolbar.
 */
export default function AccountButton({
  className,
  showLabel = false,
}: {
  className?: string;
  showLabel?: boolean;
}) {
  const { configured, user, loading } = useAuth();
  const openModal = useAuthModalStore(s => s.openModal);

  if (!configured) return null;

  const signedIn = Boolean(user);
  const Icon = signedIn ? UserRoundCheck : UserRound;
  const label = signedIn ? 'Account' : 'Sign in';

  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={loading}
      onClick={() => openModal(signedIn ? 'account' : 'signin')}
      className={
        className ??
        'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-(--main-color) transition-colors hover:bg-(--card-color,rgba(128,128,128,0.15)) disabled:opacity-50'
      }
    >
      <Icon className="h-5 w-5" aria-hidden />
      {showLabel && <span className="text-sm">{label}</span>}
    </button>
  );
}
