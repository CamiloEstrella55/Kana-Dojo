'use client';

import { useCallback, useEffect } from 'react';
import { useRouter } from '@/core/i18n/routing';

const isMobileExport = process.env.NEXT_PUBLIC_MOBILE_EXPORT === '1';

/**
 * Maps an app path onto the file the static export actually wrote.
 *
 * `/kana/train` → `/en/kana/train/index.html`. The locale prefix is required
 * because the export is generated with `localePrefix: 'always'`, and the
 * explicit `index.html` avoids the WebView's html5mode fallback (see below).
 */
export function toExportedPath(href: string): string {
  const [pathAndQuery = '', hash = ''] = href.split('#');
  const [rawPath = '', query = ''] = pathAndQuery.split('?');

  let path = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  if (!/^\/(en|es)(\/|$)/.test(path)) path = `/en${path}`;
  if (!/\.[a-z0-9]+$/i.test(path)) {
    path = path.endsWith('/') ? `${path}index.html` : `${path}/index.html`;
  }

  return `${path}${query ? `?${query}` : ''}${hash ? `#${hash}` : ''}`;
}

/**
 * Navigate programmatically. Client-side routing does not commit inside the
 * Capacitor WebView (see the note below), so the on-device bundle performs a
 * real document load instead; on the web this is a normal router push.
 */
export function useAppNavigate(): (href: string) => void {
  const router = useRouter();
  return useCallback(
    (href: string) => {
      if (isMobileExport && typeof window !== 'undefined') {
        window.location.assign(toExportedPath(href));
        return;
      }
      router.push(href);
    },
    [router],
  );
}

/**
 * Full-page navigation for the on-device bundle.
 *
 * In the Capacitor WebView the App Router's client-side navigation does not
 * commit: `<Link>` cancels the click, the RSC segment payload is fetched
 * successfully, and then nothing happens — every in-app link is a dead tap
 * while external `<a>` links keep working. Rather than depend on RSC routing
 * inside a WebView, internal links become real document loads. Every asset is
 * bundled on the device, so a full load is a local file read.
 *
 * Two details make this work:
 *
 * 1. The listener runs in the CAPTURE phase and stops propagation, so Next's
 *    own click handler (which would preventDefault and hand off to the broken
 *    router) never sees the event.
 * 2. It navigates to an explicit `index.html` rather than the directory. The
 *    Android WebView's html5mode routes every extension-less request back to
 *    the root redirect stub, so `/en/kana/` would bounce to the entry page —
 *    the same trap the app entry already avoids (see scripts/mobile-build.mjs).
 *    The head script in app/layout.tsx strips `index.html` back off before
 *    React hydrates, so the URL and the pre-rendered markup still agree.
 */
export default function NativeNavigation() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // Let the browser handle anything that isn't a plain left click.
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const anchor = (event.target as Element | null)?.closest?.('a');
      if (!anchor) return;

      const href = anchor.getAttribute('href');
      if (!href) return;

      // Leave downloads, new tabs, and non-navigational schemes alone.
      if (anchor.hasAttribute('download')) return;
      const target = anchor.getAttribute('target');
      if (target && target !== '_self') return;
      if (/^(mailto:|tel:|blob:|data:)/i.test(href)) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }

      // External links must keep their normal behaviour.
      if (url.origin !== window.location.origin) return;

      // In-page anchors stay client-side.
      if (
        url.pathname === window.location.pathname &&
        url.hash &&
        url.hash !== '#'
      ) {
        return;
      }

      // Resolve directory paths to the real exported file.
      let pathname = url.pathname;
      if (!/\.[a-z0-9]+$/i.test(pathname)) {
        pathname = pathname.endsWith('/')
          ? `${pathname}index.html`
          : `${pathname}/index.html`;
      }

      // Beat Next's Link handler to the event.
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(`${pathname}${url.search}${url.hash}`);
    };

    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  return null;
}
