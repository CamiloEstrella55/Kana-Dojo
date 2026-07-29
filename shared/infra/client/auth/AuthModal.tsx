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
import { useAuthFeedback } from './useAuthFeedback';

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
  const feedback = useAuthFeedback();

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

  const switchView = (next: AuthModalView) => {
    feedback.tap();
    setView(next);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    feedback.tap();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (view === 'signin') {
        const res = await signIn(email.trim(), password);
        if (res.error) {
          feedback.error();
          setError(res.error);
        } else {
          feedback.success();
          closeModal();
        }
      } else if (view === 'signup') {
        const res = await signUp(email.trim(), password, displayName.trim());
        if (res.error) {
          feedback.error();
          setError(res.error);
        } else if (res.needsEmailConfirmation) {
          feedback.success();
          setNotice('Check your email to confirm your account, then sign in.');
        } else {
          feedback.success();
          closeModal();
        }
      } else if (view === 'reset') {
        const res = await resetPassword(email.trim());
        if (res.error) {
          feedback.error();
          setError(res.error);
        } else {
          feedback.success();
          setNotice('If that email exists, a reset link is on its way.');
        }
      }
    } finally {
      setBusy(false);
    }
  };

  const submitLabel = busy
    ? 'Please wait…'
    : view === 'signin'
      ? 'Sign in'
      : view === 'signup'
        ? 'Create account'
        : 'Send reset link';

  return (
    <Dialog open={open} onOpenChange={o => (o ? openModal(view) : closeModal())}>
      <DialogContent className="max-w-md gap-0 rounded-2xl border-(--border-color,rgba(128,128,128,0.25)) bg-(--background-color) p-0 text-(--main-color)">
        <div className="flex flex-col items-center gap-1 px-6 pt-7 pb-2">
          <div
            aria-hidden
            className="mb-1 grid h-14 w-14 place-items-center rounded-2xl bg-(--card-color) text-2xl font-bold"
          >
            仮名
          </div>
          <DialogHeader className="items-center text-center">
            <DialogTitle className="text-xl">{TITLES[view]}</DialogTitle>
            <DialogDescription className="text-(--secondary-color) opacity-90">
              {DESCRIPTIONS[view]}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6">
          {view === 'account' && user ? (
            <AccountPanel
              email={user.email ?? ''}
              syncStatus={syncStatus}
              onSyncNow={() => {
                feedback.tap();
                void syncNow();
              }}
              onSignOut={async () => {
                feedback.tap();
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
                  placeholder="Sensei"
                />
              )}
              <Field
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                autoComplete="email"
                placeholder="you@example.com"
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
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              )}

              {error && (
                <p
                  className="rounded-lg bg-(--wrong-color,#ef4444)/10 px-3 py-2 text-sm text-(--wrong-color,#ef4444)"
                  role="alert"
                >
                  {error}
                </p>
              )}
              {notice && (
                <p
                  className="rounded-lg bg-(--right-color,#22c55e)/10 px-3 py-2 text-sm text-(--right-color,#22c55e)"
                  role="status"
                >
                  {notice}
                </p>
              )}

              <Button
                type="submit"
                disabled={busy}
                className="mt-1 h-11 w-full rounded-xl text-base"
              >
                {submitLabel}
              </Button>

              <AuthSwitcher view={view} onSwitch={switchView} />
            </form>
          )}
        </div>
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
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium opacity-80">{label}</span>
      <Input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-11 rounded-xl bg-(--card-color) text-base"
        {...rest}
      />
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
  const link =
    'font-medium text-(--secondary-color) underline underline-offset-4 hover:text-(--main-color)';
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 pt-2 text-sm opacity-90">
      {view === 'signin' && (
        <>
          <button type="button" className={link} onClick={() => onSwitch('signup')}>
            Create an account
          </button>
          <span aria-hidden className="opacity-40">
            ·
          </span>
          <button type="button" className={link} onClick={() => onSwitch('reset')}>
            Forgot password?
          </button>
        </>
      )}
      {view === 'signup' && (
        <button type="button" className={link} onClick={() => onSwitch('signin')}>
          Already have an account? Sign in
        </button>
      )}
      {view === 'reset' && (
        <button type="button" className={link} onClick={() => onSwitch('signin')}>
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
      <div className="rounded-xl bg-(--card-color) p-4 text-sm">
        <div className="opacity-70">Signed in as</div>
        <div className="font-semibold break-all">{email}</div>
        <div
          className={clsx(
            'mt-3 flex items-center gap-2',
            syncStatus === 'error' && 'text-(--wrong-color,#ef4444)',
          )}
        >
          <span
            className={clsx(
              'inline-block h-2.5 w-2.5 rounded-full',
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
        <Button
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onClick={onSyncNow}
        >
          Sync now
        </Button>
        <Button
          variant="destructive"
          className="h-11 flex-1 rounded-xl"
          onClick={onSignOut}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
