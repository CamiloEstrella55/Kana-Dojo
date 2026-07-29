'use client';

import { setAuthStorageBackend } from '@/shared/infra/client/authStorage';

/**
 * One-time native (Capacitor) bootstrap. Memoised so it is safe to await from
 * multiple places. On the web this resolves immediately as a no-op.
 *
 * Critically, this swaps the Supabase auth-session storage to Capacitor
 * Preferences BEFORE the first session read, so a returning native user's
 * session is restored from secure storage rather than the (empty) WebView
 * localStorage.
 */
let initPromise: Promise<void> | null = null;

/** True when running inside the Capacitor native runtime. */
export function isNativeApp(): boolean {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } })
    .Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

export function ensureNativeInit(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    if (!isNativeApp()) return;

    // 1. Persist the auth session in native storage (survives app updates and
    //    is isolated from the WebView cache).
    try {
      const { Preferences } = await import('@capacitor/preferences');
      setAuthStorageBackend({
        getItem: async key => (await Preferences.get({ key })).value,
        setItem: async (key, value) => {
          await Preferences.set({ key, value });
        },
        removeItem: async key => {
          await Preferences.remove({ key });
        },
      });
    } catch (err) {
      console.warn('[native] Preferences storage unavailable:', err);
    }

    // 2. Style the status bar to match the app's dark chrome.
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
    } catch {
      /* status bar plugin not available on this platform */
    }

    // 3. Handle auth deep links (OAuth PKCE / email confirmation). The
    //    Supabase client (detectSessionInUrl + PKCE) consumes the code once we
    //    route the WebView to the returned URL.
    try {
      const { App } = await import('@capacitor/app');
      await App.addListener('appUrlOpen', ({ url }) => {
        if (!url) return;
        if (url.includes('code=') || url.includes('access_token')) {
          try {
            const parsed = new URL(url);
            window.location.replace(
              `${parsed.pathname}${parsed.search}${parsed.hash}`,
            );
          } catch {
            /* ignore malformed deep link */
          }
        }
      });
    } catch {
      /* App plugin not available */
    }
  })();
  return initPromise;
}
