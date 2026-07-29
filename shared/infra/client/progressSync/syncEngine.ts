'use client';

import type {
  RealtimeChannel,
  SupabaseClient,
} from '@supabase/supabase-js';
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
    console.warn(`[sync] push failed for ${adapter.key}:`, error.message);
    return;
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
    console.warn('[sync] pull failed:', error.message);
    return;
  }

  const remoteByKey = new Map<string, RemoteRow>();
  for (const row of (rows ?? []) as RemoteRow[]) {
    remoteByKey.set(row.store_key, row);
  }

  for (const adapter of SYNC_ADAPTERS) {
    try {
      await reconcile(supabase, adapter, remoteByKey.get(adapter.key));
    } catch (err) {
      console.warn(`[sync] reconcile failed for ${adapter.key}:`, err);
    }
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
      if (supabase) void pushAdapter(supabase, adapter);
    }, PUSH_DEBOUNCE_MS),
  );
}

async function handleRemoteRow(row: RemoteRow): Promise<void> {
  const adapter = adapterByKey(row.store_key);
  if (!adapter) return;
  const local = await adapter.read();
  const remote: SyncPayload = { data: row.data, updatedAtMs: row.updated_at_ms };
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

  await syncNow();

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

  // Opportunistic re-sync when the app regains focus / connectivity.
  const onFocus = () => void syncNow();
  window.addEventListener('online', onFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') onFocus();
  });
  unsubscribers.push(() => window.removeEventListener('online', onFocus));

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
