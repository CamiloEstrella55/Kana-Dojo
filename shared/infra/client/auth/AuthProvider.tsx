'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  getSupabaseClientOrNull,
  isSupabaseConfigured,
} from '@/shared/infra/client/supabaseClient';
import {
  startAutoSync,
  stopAutoSync,
  syncNow,
} from '@/shared/infra/client/progressSync/syncEngine';
import { ensureNativeInit } from '@/shared/infra/client/native/initNative';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface AuthResult {
  error: string | null;
  /** True for sign-up when email confirmation is required before a session. */
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  /** True only when Supabase env vars are present. */
  configured: boolean;
  /** True until the initial session check resolves. */
  loading: boolean;
  user: User | null;
  session: Session | null;
  syncStatus: SyncStatus;
  signUp: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<AuthResult>;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<AuthResult>;
  syncNow: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function toMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'Something went wrong. Please try again.';
}

function redirectBase(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.location.origin;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured();
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const stopRef = useRef<(() => void) | null>(null);

  const beginSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      stopRef.current = await startAutoSync();
      setSyncStatus('synced');
    } catch (err) {
      console.warn('[auth] startAutoSync failed:', err);
      setSyncStatus('error');
    }
  }, []);

  const endSync = useCallback(() => {
    stopAutoSync();
    stopRef.current = null;
    setSyncStatus('idle');
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    let subscription: { unsubscribe: () => void } | null = null;

    // Await native init first so a returning native session is read from
    // Capacitor secure storage before the initial getSession() call.
    ensureNativeInit().then(() => {
      if (!active) return;

      supabase.auth.getSession().then(({ data }) => {
        if (!active) return;
        setSession(data.session);
        setLoading(false);
        if (data.session) void beginSync();
      });

      subscription = supabase.auth.onAuthStateChange((event, nextSession) => {
        setSession(nextSession);
        if (event === 'SIGNED_IN' && nextSession) {
          if (!stopRef.current) void beginSync();
        } else if (event === 'SIGNED_OUT') {
          endSync();
        }
      }).data.subscription;
    });

    return () => {
      active = false;
      subscription?.unsubscribe();
      endSync();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signUp = useCallback<AuthContextValue['signUp']>(
    async (email, password, displayName) => {
      const supabase = getSupabaseClientOrNull();
      if (!supabase) return { error: 'Sync is not configured.' };
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: displayName ? { display_name: displayName } : undefined,
          emailRedirectTo: redirectBase(),
        },
      });
      if (error) return { error: toMessage(error) };
      return {
        error: null,
        needsEmailConfirmation: !data.session,
      };
    },
    [],
  );

  const signIn = useCallback<AuthContextValue['signIn']>(
    async (email, password) => {
      const supabase = getSupabaseClientOrNull();
      if (!supabase) return { error: 'Sync is not configured.' };
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { error: toMessage(error) };
      return { error: null };
    },
    [],
  );

  const signOut = useCallback(async () => {
    const supabase = getSupabaseClientOrNull();
    if (!supabase) return;
    endSync();
    await supabase.auth.signOut();
  }, [endSync]);

  const resetPassword = useCallback<AuthContextValue['resetPassword']>(
    async email => {
      const supabase = getSupabaseClientOrNull();
      if (!supabase) return { error: 'Sync is not configured.' };
      const base = redirectBase();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: base ? `${base}/reset-password` : undefined,
      });
      if (error) return { error: toMessage(error) };
      return { error: null };
    },
    [],
  );

  const manualSync = useCallback(async () => {
    setSyncStatus('syncing');
    try {
      await syncNow();
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      configured,
      loading,
      user: session?.user ?? null,
      session,
      syncStatus,
      signUp,
      signIn,
      signOut,
      resetPassword,
      syncNow: manualSync,
    }),
    [
      configured,
      loading,
      session,
      syncStatus,
      signUp,
      signIn,
      signOut,
      resetPassword,
      manualSync,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}
