'use client';

/**
 * Cross-platform key/value storage used to persist the Supabase auth session.
 *
 * On the web (and inside the Capacitor WebView) this is backed by localStorage.
 * Phase 2 (native shell) can register a more durable/secure backend — e.g.
 * Capacitor Preferences or SecureStorage — by calling `setAuthStorageBackend`
 * once at app startup, without any auth code needing to change.
 *
 * The Supabase auth client accepts a storage object whose methods may be async,
 * so this interface returns promises to stay forward-compatible with native
 * secure-storage plugins.
 */
export interface AuthStorageBackend {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

const memoryStore = new Map<string, string>();

/** Safe fallback for SSR / environments without localStorage. */
const memoryBackend: AuthStorageBackend = {
  getItem: key => memoryStore.get(key) ?? null,
  setItem: (key, value) => {
    memoryStore.set(key, value);
  },
  removeItem: key => {
    memoryStore.delete(key);
  },
};

/**
 * Capacitor Preferences reached through the bridge that is already on `window`,
 * rather than a dynamic `import()`.
 *
 * This must be resolvable *synchronously*: the Supabase client starts reading
 * the persisted session as soon as it is constructed, which happens before the
 * async native bootstrap can install a backend. Resolving the native store
 * lazily-but-synchronously means the very first read already hits the same
 * storage the session was written to. Otherwise that first read falls back to
 * localStorage, finds nothing, and the user is treated as signed out on every
 * document load — which, now that in-app navigation is a real page load, means
 * the session appears to vanish constantly and sync never runs.
 */
interface CapacitorPreferencesPlugin {
  get: (options: { key: string }) => Promise<{ value: string | null }>;
  set: (options: { key: string; value: string }) => Promise<void>;
  remove: (options: { key: string }) => Promise<void>;
}

function resolveNativePreferences(): AuthStorageBackend | null {
  if (typeof window === 'undefined') return null;
  const cap = (
    window as unknown as {
      Capacitor?: {
        isNativePlatform?: () => boolean;
        Plugins?: { Preferences?: CapacitorPreferencesPlugin };
      };
    }
  ).Capacitor;

  if (!cap?.isNativePlatform?.()) return null;
  const preferences = cap.Plugins?.Preferences;
  if (!preferences) return null;

  return {
    getItem: async key => (await preferences.get({ key })).value,
    setItem: async (key, value) => {
      await preferences.set({ key, value });
    },
    removeItem: async key => {
      await preferences.remove({ key });
    },
  };
}

function resolveDefaultBackend(): AuthStorageBackend {
  // Prefer native secure storage when running inside the Capacitor WebView.
  const native = resolveNativePreferences();
  if (native) return native;

  if (typeof window === 'undefined' || !window.localStorage) {
    return memoryBackend;
  }
  try {
    // Probe: some embedded WebViews throw on access in private mode.
    const probeKey = '__kanadojo_auth_probe__';
    window.localStorage.setItem(probeKey, '1');
    window.localStorage.removeItem(probeKey);
  } catch {
    return memoryBackend;
  }
  return {
    getItem: key => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: key => window.localStorage.removeItem(key),
  };
}

let backend: AuthStorageBackend | null = null;

/** Override the storage backend (call once at startup, e.g. for native). */
export function setAuthStorageBackend(next: AuthStorageBackend): void {
  backend = next;
}

/** The active auth-session storage backend (lazily initialised). */
export const authStorage: AuthStorageBackend = {
  getItem: key => (backend ??= resolveDefaultBackend()).getItem(key),
  setItem: (key, value) =>
    (backend ??= resolveDefaultBackend()).setItem(key, value),
  removeItem: key => (backend ??= resolveDefaultBackend()).removeItem(key),
};
