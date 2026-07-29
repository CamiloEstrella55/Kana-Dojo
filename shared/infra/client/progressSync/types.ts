'use client';

/**
 * A single unit of syncable progress. `data` is the semantic payload persisted
 * for one store; `updatedAtMs` is the client clock used for last-write-wins.
 */
export interface SyncPayload {
  data: unknown;
  updatedAtMs: number;
}

/**
 * Adapter that bridges one local store (Zustand-persist, localforage, etc.) to
 * the cloud. Each store shape is different, so every synced store supplies one
 * of these. The sync engine never touches store internals directly.
 */
export interface ProgressSyncAdapter {
  /** Server store_key — matches the store's persisted name where possible. */
  readonly key: string;

  /** Read the current local payload, or null when there is nothing to sync. */
  read(): Promise<SyncPayload | null>;

  /**
   * Apply a remote payload locally (write to storage + refresh the live store
   * so the UI updates). Called on pull and on push conflicts.
   */
  applyRemote(payload: SyncPayload): Promise<void>;

  /**
   * Optional loss-avoiding merge of a local and remote payload. When provided,
   * the engine merges rather than blindly replacing, then pushes the result.
   * Omit for stores where last-write-wins is acceptable.
   */
  merge?(local: SyncPayload, remote: SyncPayload): SyncPayload;

  /** Subscribe to local changes; return an unsubscribe fn. */
  subscribe(onChange: () => void): () => void;
}
