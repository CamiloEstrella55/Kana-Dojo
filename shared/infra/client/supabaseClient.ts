'use client';

import {
  createClient,
  type SupabaseClient,
  type SupabaseClientOptions,
} from '@supabase/supabase-js';
import { authStorage } from './authStorage';

/**
 * Browser/native Supabase client (anon key, user-scoped by RLS).
 *
 * This is distinct from the server-side admin client in
 * `shared/infra/server/bugReports/supabaseAdmin.ts`, which uses the
 * service-role key and must never reach the client bundle.
 *
 * Env vars (public — safe to expose; the anon key is protected by RLS):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** True when the public Supabase env vars are present. */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

const clientOptions: SupabaseClientOptions<'public'> = {
  auth: {
    // Persist + auto-refresh the session so users stay logged in across
    // app launches and devices.
    persistSession: true,
    autoRefreshToken: true,
    // PKCE is the correct flow for public clients (native + SPA) and is
    // required for mobile OAuth deep-link redirects in Phase 2.
    flowType: 'pkce',
    storage: authStorage,
    storageKey: 'kanadojo-auth',
    detectSessionInUrl: typeof window !== 'undefined',
  },
};

/**
 * Returns the shared Supabase client, or throws if the env vars are missing.
 * Use `isSupabaseConfigured()` first when the caller can degrade gracefully
 * (e.g. render the app in offline/local-only mode).
 */
export function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and ' +
        'NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.',
    );
  }
  client ??= createClient(supabaseUrl, supabaseAnonKey, clientOptions);
  return client;
}

/** Non-throwing accessor: returns null when Supabase is not configured. */
export function getSupabaseClientOrNull(): SupabaseClient | null {
  return isSupabaseConfigured() ? getSupabaseClient() : null;
}
