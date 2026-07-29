'use client';

import { useEffect } from 'react';

/**
 * Registers the audio caching service worker
 * This component should be included in the root layout
 */
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    let updateInterval: ReturnType<typeof setInterval> | undefined;
    let cancelled = false;
    let onLoad: (() => void) | undefined;

    // The on-device mobile bundle serves everything locally, so a service
    // worker is unnecessary and can interfere with the Capacitor WebView.
    const skipOnNative = process.env.NEXT_PUBLIC_MOBILE_EXPORT === '1';

    if (
      skipOnNative &&
      typeof navigator !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
      // Remove any worker left over from a previous build.
      void navigator.serviceWorker
        .getRegistrations()
        .then(regs => regs.forEach(r => void r.unregister()))
        .catch(() => {});
    }

    if (
      !skipOnNative &&
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator
    ) {
    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        if (cancelled) return;
        updateInterval = setInterval(() => {
          void registration.update();
        }, 60 * 60 * 1000);
      } catch (error) {
        console.warn('SW registration failed:', error);
      }
    };

    onLoad = () => void registerServiceWorker();
    if (document.readyState === 'complete') onLoad();
    else window.addEventListener('load', onLoad, { once: true });
    }

    return () => {
      cancelled = true;
      if (onLoad) window.removeEventListener('load', onLoad);
      if (updateInterval) clearInterval(updateInterval);
    };
  }, []);

  return null;
}

/**
 * Utility to manually cache an audio file
 */
export const cacheAudioFile = (url: string) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_AUDIO',
      url,
    });
  }
};

/**
 * Utility to clear the audio cache
 */
export const clearAudioCache = () => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CLEAR_AUDIO_CACHE',
    });
  }
};
