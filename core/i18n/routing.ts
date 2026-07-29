import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';

// The on-device mobile bundle is a static export with no middleware, so locale
// prefixes must be present in the URLs (and in generated links) for in-app
// navigation to resolve to the exported /en/* and /es/* files. On the web the
// middleware handles prefixes, so we keep them hidden ('never').
// The on-device mobile bundle is a static export with no middleware, so locale
// prefixes must be present in URLs/links for navigation to resolve to the
// exported files. On the web, middleware hides them ('never'). The English-only
// trimming for mobile is done by removing the /es output in scripts/mobile-build.mjs.
const mobileExport = process.env.NEXT_PUBLIC_MOBILE_EXPORT === '1';

export const routing = defineRouting({
  // All supported locales
  locales: ['en', 'es'],
  defaultLocale: 'en',
  localePrefix: mobileExport ? 'always' : 'never',
});

export type Locale = (typeof routing.locales)[number];

// Lightweight wrappers around Next.js' navigation APIs
// that will consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
