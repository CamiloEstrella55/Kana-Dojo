'use client';

import { useEffect, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/components/dialog';
import { Button } from '@/shared/ui/components/button';
import { Input } from '@/shared/ui/components/input';
import { useAuth } from './AuthProvider';
import useAuthModalStore, { type AuthModalView } from './useAuthModalStore';

const TITLES: Record<AuthModalView, string> = {
  signin: 'Welcome back',
  signup: 'Create your account',
  reset: 'Reset your password',
  account: 'Your account',
};

const DESCRIPTIONS: Record<AuthModalView, string> = {
  signin: 'Sign in to sync your progress, stats, and streaks across devices.',
  signup: 'Sign up so your progress is saved and follows you everywhere.',
  reset: 'Enter your email and we’ll send you a reset link.',
  account: 'Your progress syncs automatically while you’re signed in.',
};

export default function AuthModal() {
  const { open, view, openModal, setView, closeModal } = useAuthModalStore();
  const {
    configured,
    user,
    syncStatus,
    signIn,
    signUp,
    signOut,
    resetPassword,
    syncNow,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Signed-in users always see the account view.
  useEffect(() => {
    if (user && open && view !== 'account') setView('account');
    if (!user && view === 'account') setView('signin');
  }, [user, open, view, setView]);

  useEffect(() => {
    if (open) {
      setError(null);
      setNotice(null);
      setPassword('');
    }
  }, [open, view]);

  if (!configured) return null;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (view === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.error) setError(res.error);
        else closeModal();
      } else if (view === 'signup') {
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) setError(res.error);
        else if (res.needsEmailConfirmation)
          setNotice('Check your email to confirm your account, then sign in.');
        else closeModal();
      } else if (view === 'reset') {
        const res = await resetPassword(email.trim());
        if (res.error) setError(res.error);
        else setNotice('If that email exists, a reset link is on its way.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => (o ? openModal(view) : closeModal())}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{TITLES[view]}</DialogTitle>
          <DialogDescription>{DESCRIPTIONS[view]}</DialogDescription>
        </DialogHeader>

        {view === 'account' && user ? (
          <AccountPanel
            email={user.email ?? ''}
            syncStatus={syncStatus}
            onSyncNow={syncNow}
            onSignOut={async () => {
              await signOut();
              closeModal();
            }}
          />
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            {view === 'signup' && (
              <Field
                label="Display name (optional)"
                type="text"
                value={displayName}
                onChange={setDisplayName}
                autoComplete="nickname"
              />
            )}
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
              required
            />
            {view !== 'reset' && (
              <Field
                label="Password"
                type="password"
                value={password}
                onChange={setPassword}
                autoComplete={
                  view === 'signup' ? 'new-password' : 'current-password'
                }
                required
                minLength={6}
              />
            )}

            {error && (
              <p className="text-sm text-(--wrong-color,#ef4444)" role="alert">
                {error}
              </p>
            )}
            {notice && (
              <p className="text-sm text-(--main-color)" role="status">
                {notice}
              </p>
            )}

            <Button type="submit" disabled={busy} className="mt-1 w-full">
              {busy
                ? 'Please wait…'
                : view === 'signin'
                  ? 'Sign in'
                  : view === 'signup'
                    ? 'Create account'
                    : 'Send reset link'}
            </Button>

            <AuthSwitcher view={view} onSwitch={setView} />
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  ...rest
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange'>) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="opacity-80">{label}</span>
      <Input value={value} onChange={e => onChange(e.target.value)} {...rest} />
    </label>
  );
}

function AuthSwitcher({
  view,
  onSwitch,
}: {
  view: AuthModalView;
  onSwitch: (v: AuthModalView) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-1 text-sm opacity-90">
      {view === 'signin' && (
        <>
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => onSwitch('signup')}
          >
            Create an account
          </button>
          <span aria-hidden>·</span>
          <button
            type="button"
            className="underline underline-offset-4"
            onClick={() => onSwitch('reset')}
          >
            Forgot password?
          </button>
        </>
      )}
      {view === 'signup' && (
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => onSwitch('signin')}
        >
          Already have an account? Sign in
        </button>
      )}
      {view === 'reset' && (
        <button
          type="button"
          className="underline underline-offset-4"
          onClick={() => onSwitch('signin')}
        >
          Back to sign in
        </button>
      )}
    </div>
  );
}

function AccountPanel({
  email,
  syncStatus,
  onSyncNow,
  onSignOut,
}: {
  email: string;
  syncStatus: string;
  onSyncNow: () => void;
  onSignOut: () => void;
}) {
  const label =
    syncStatus === 'syncing'
      ? 'Syncing…'
      : syncStatus === 'synced'
        ? 'All progress synced'
        : syncStatus === 'error'
          ? 'Sync error — will retry'
          : 'Idle';
  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-(--card-color,rgba(128,128,128,0.3)) p-3 text-sm">
        <div className="opacity-70">Signed in as</div>
        <div className="font-medium break-all">{email}</div>
        <div
          className={clsx(
            'mt-2 flex items-center gap-2',
            syncStatus === 'error' && 'text-(--wrong-color,#ef4444)',
          )}
        >
          <span
            className={clsx(
              'inline-block h-2 w-2 rounded-full',
              syncStatus === 'synced'
                ? 'bg-green-500'
                : syncStatus === 'syncing'
                  ? 'animate-pulse bg-yellow-500'
                  : syncStatus === 'error'
                    ? 'bg-red-500'
                    : 'bg-gray-400',
            )}
          />
          {label}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" className="flex-1" onClick={onSyncNow}>
          Sync now
        </Button>
        <Button variant="destructive" className="flex-1" onClick={onSignOut}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
