'use client';

import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClientOrNull } from '../supabaseClient';
import { SYNC_ADAPTERS } from './adapters';
import { setLocalMutationMs } from './syncMeta';
import type { ProgressSyncAdapter, SyncPayload } from './types';

const PUSH_DEBOUNCE_MS = 3000; // must exceed the stores' 2s persist debounce
const SCHEMA_VERSION = 1;

interface RemoteRow {
  store_key: string;
  data: unknown;
  updated_at_ms: number;
}

/** Guards against feedback loops while we apply remote data to local stores. */
let applyingRemoteDepth = 0;

const pushTimers = new Map<string, ReturnType<typeof setTimeout>>();
let unsubscribers: Array<() => void> = [];
let realtimeChannel: RealtimeChannel | null = null;
let running = false;

function adapterByKey(key: string): ProgressSyncAdapter | undefined {
  return SYNC_ADAPTERS.find(a => a.key === key);
}

async function applyRemote(
  adapter: ProgressSyncAdapter,
  payload: SyncPayload,
): Promise<void> {
  applyingRemoteDepth += 1;
  try {
    await adapter.applyRemote(payload);
  } finally {
    // Release on the next tick so the store's own change events (from
    // rehydrate/setState) are still suppressed.
    setTimeout(() => {
      applyingRemoteDepth = Math.max(0, applyingRemoteDepth - 1);
    }, 0);
  }
}

/** Push one store to the cloud, resolving conflicts via merge or adopt-remote. */
async function pushAdapter(
  supabase: SupabaseClient,
  adapter: ProgressSyncAdapter,
): Promise<void> {
  const local = await adapter.read();
  if (!local) return;

  const { data, error } = await supabase.rpc('sync_progress', {
    p_store_key: adapter.key,
    p_data: local.data,
    p_updated_at_ms: local.updatedAtMs,
    p_schema_version: SCHEMA_VERSION,
  });

  if (error) {
    // Surfaced to the caller so a failed "Sync now" reports an error instead of
    // silently claiming success (e.g. when the sync_progress migration has not
    // been applied to the Supabase project).
    throw new Error(`push failed for ${adapter.key}: ${error.message}`);
  }

  const row = Array.isArray(data) ? (data[0] as RowResult | undefined) : null;
  if (!row || row.stored) return; // stored === true → our write won

  // Server had a newer snapshot. Merge if we can, otherwise adopt it.
  const remote: SyncPayload = {
    data: row.data,
    updatedAtMs: row.updated_at_ms,
  };
  if (adapter.merge) {
    const merged = adapter.merge(local, remote);
    const bumped: SyncPayload = { data: merged.data, updatedAtMs: Date.now() };
    await applyRemote(adapter, bumped);
    await supabase.rpc('sync_progress', {
      p_store_key: adapter.key,
      p_data: bumped.data,
      p_updated_at_ms: bumped.updatedAtMs,
      p_schema_version: SCHEMA_VERSION,
    });
  } else {
    await applyRemote(adapter, remote);
  }
}

interface RowResult {
  stored: boolean;
  store_key: string;
  data: unknown;
  updated_at_ms: number;
}

/** Reconcile one adapter against its (possibly absent) remote row. */
async function reconcile(
  supabase: SupabaseClient,
  adapter: ProgressSyncAdapter,
  remoteRow: RemoteRow | undefined,
): Promise<void> {
  const local = await adapter.read();
  const remote: SyncPayload | null = remoteRow
    ? { data: remoteRow.data, updatedAtMs: remoteRow.updated_at_ms }
    : null;

  if (!remote) {
    if (local) await pushAdapter(supabase, adapter);
    return;
  }
  if (!local) {
    await applyRemote(adapter, remote);
    return;
  }

  if (adapter.merge) {
    const merged = adapter.merge(local, remote);
    // Adopt merged locally; push with a fresh clock so the cloud converges.
    const bumped: SyncPayload = { data: merged.data, updatedAtMs: Date.now() };
    await applyRemote(adapter, bumped);
    await supabase.rpc('sync_progress', {
      p_store_key: adapter.key,
      p_data: bumped.data,
      p_updated_at_ms: bumped.updatedAtMs,
      p_schema_version: SCHEMA_VERSION,
    });
    return;
  }

  // Last-write-wins.
  if (remote.updatedAtMs >= local.updatedAtMs) {
    await applyRemote(adapter, remote);
  } else {
    await pushAdapter(supabase, adapter);
  }
}

/** Full two-way reconciliation of every synced store. Run on sign-in. */
export async function syncNow(): Promise<void> {
  const supabase = getSupabaseClientOrNull();
  if (!supabase) return;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: rows, error } = await supabase
    .from('user_progress')
    .select('store_key,data,updated_at_ms');
  if (error) {
    throw new Error(`pull failed: ${error.message}`);
  }

  const remoteByKey = new Map<string, RemoteRow>();
  for (const row of (rows ?? []) as RemoteRow[]) {
    remoteByKey.set(row.store_key, row);
  }

  // Reconcile every store even if one fails, then report if any did — a silent
  // partial sync is how progress goes missing without anyone noticing.
  const failures: string[] = [];
  let firstReason = '';
  for (const adapter of SYNC_ADAPTERS) {
    try {
      await reconcile(supabase, adapter, remoteByKey.get(adapter.key));
    } catch (err) {
      console.warn(`[sync] reconcile failed for ${adapter.key}:`, err);
      failures.push(adapter.key);
      if (!firstReason) {
        firstReason = err instanceof Error ? err.message : String(err);
      }
    }
  }

  if (failures.length > 0) {
    // Keep the underlying reason: the store list alone says nothing about why,
    // and there is no console to inspect on a sideloaded device.
    throw new Error(
      `sync failed for ${failures.length}/${SYNC_ADAPTERS.length} stores (${failures.join(', ')}) — ${firstReason}`,
    );
  }
}

function schedulePush(adapter: ProgressSyncAdapter): void {
  const existing = pushTimers.get(adapter.key);
  if (existing) clearTimeout(existing);
  pushTimers.set(
    adapter.key,
    setTimeout(() => {
      pushTimers.delete(adapter.key);
      const supabase = getSupabaseClientOrNull();
      if (supabase) {
        pushAdapter(supabase, adapter).catch(err => {
          console.warn(`[sync] background push failed:`, err);
        });
      }
    }, PUSH_DEBOUNCE_MS),
  );
}

/**
 * Push every pending (debounced) change immediately.
 *
 * In the native bundle each in-app navigation is a real document load, which
 * destroys the page — and with it any pending push timer. Finishing a lesson
 * and leaving the screen within the debounce window would otherwise drop the
 * write entirely, so progress silently never reached Supabase. Flush on the
 * way out (page hide / app backgrounded) instead.
 *
 * `keepalive` is not available through the Supabase client, so this is
 * best-effort; the next launch still reconciles from the persisted local
 * mutation timestamps, which is what guarantees eventual consistency.
 */
function flushPendingPushes(): void {
  if (pushTimers.size === 0) return;
  const supabase = getSupabaseClientOrNull();
  const pending = Array.from(pushTimers.keys());
  for (const timer of pushTimers.values()) clearTimeout(timer);
  pushTimers.clear();
  if (!supabase) return;

  for (const key of pending) {
    const adapter = adapterByKey(key);
    if (!adapter) continue;
    pushAdapter(supabase, adapter).catch(err => {
      console.warn(`[sync] flush push failed for ${key}:`, err);
    });
  }
}

async function handleRemoteRow(row: RemoteRow): Promise<void> {
  const adapter = adapterByKey(row.store_key);
  if (!adapter) return;
  const local = await adapter.read();
  const remote: SyncPayload = {
    data: row.data,
    updatedAtMs: row.updated_at_ms,
  };
  if (!local || remote.updatedAtMs > local.updatedAtMs) {
    if (adapter.merge && local) {
      await applyRemote(adapter, adapter.merge(local, remote));
    } else {
      await applyRemote(adapter, remote);
    }
  }
}

/**
 * Begin live syncing: reconcile once, then push local changes (debounced) and
 * pull remote changes (realtime + on focus/online). Returns a stop function.
 */
export async function startAutoSync(): Promise<() => void> {
  const supabase = getSupabaseClientOrNull();
  if (!supabase || running) return () => {};
  running = true;

  // A failed first reconcile must not prevent the live listeners below from
  // being wired up; the next focus/online event retries it.
  let initialSyncError: unknown = null;
  try {
    await syncNow();
  } catch (err) {
    initialSyncError = err;
    console.warn('[sync] initial reconcile failed:', err);
  }

  // Push local mutations.
  for (const adapter of SYNC_ADAPTERS) {
    const unsub = adapter.subscribe(() => {
      if (applyingRemoteDepth > 0) return;
      setLocalMutationMs(adapter.key, Date.now());
      schedulePush(adapter);
    });
    unsubscribers.push(unsub);
  }

  // Pull remote mutations in real time.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    realtimeChannel = supabase
      .channel(`user_progress:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress',
          filter: `user_id=eq.${user.id}`,
        },
        payload => {
          const row = payload.new as RemoteRow | undefined;
          if (row?.store_key) void handleRemoteRow(row);
        },
      )
      .subscribe();
  }

  // Opportunistic re-sync when the app regains focus / connectivity, and a
  // flush when it goes away (navigation is a full page load on native, so a
  // pending debounced push would otherwise die with the page).
  const onFocus = () => {
    syncNow().catch(err => console.warn('[sync] refresh failed:', err));
  };
  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') onFocus();
    else flushPendingPushes();
  };
  window.addEventListener('online', onFocus);
  document.addEventListener('visibilitychange', onVisibilityChange);
  window.addEventListener('pagehide', flushPendingPushes);
  unsubscribers.push(() => {
    window.removeEventListener('online', onFocus);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', flushPendingPushes);
  });

  // Listeners are live either way, but let the caller show a failed state.
  if (initialSyncError) throw initialSyncError;

  return stopAutoSync;
}

/** Tear down live syncing (call on sign-out). */
export function stopAutoSync(): void {
  running = false;
  for (const unsub of unsubscribers) {
    try {
      unsub();
    } catch {
      /* ignore */
    }
  }
  unsubscribers = [];
  for (const timer of pushTimers.values()) clearTimeout(timer);
  pushTimers.clear();
  if (realtimeChannel) {
    void realtimeChannel.unsubscribe();
    realtimeChannel = null;
  }
}
