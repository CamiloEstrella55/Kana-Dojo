import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import '@fortawesome/fontawesome-svg-core/styles.css';
import GoogleAnalytics from '@/core/analytics/GoogleAnalytics';
// Performance rescue: Microsoft Clarity is intentionally disabled for now.
// import MSClarity from '@/core/analytics/MSClarity';
import {
  StructuredData,
  kanaDojoSchema,
} from '@/shared/ui-composite/SEO/StructuredData';
import { Metadata, Viewport } from 'next';
import { headers } from 'next/headers';
import Script from 'next/script';
import SessionPrefetch from '@/shared/ui-composite/Performance/SessionPrefetch';

const googleVerificationToken = process.env.GOOGLE_VERIFICATION_TOKEN || '';
const msVerificationToken = process.env.MS_VERIFICATION_TOKEN || '';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1.0,
  maximumScale: 5.0,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://kanadojo.com'),
  manifest: '/manifest.json',
  title: {
    default:
      'KanaDojo - Learn Japanese Hiragana, Katakana, Kanji & Vocabulary Online',
    template: '%s | KanaDojo',
  },
  description:
    'Master Japanese with KanaDojo - a fun, aesthetic platform for learning Hiragana, Katakana, Kanji, and Vocabulary. Practice with interactive games, track progress, and customize your learning experience.',
  icons: {
    icon: [
      { url: '/favicon.ico?v=2' },
      { url: '/favicon.ico?v=2', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.ico?v=2', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico?v=2',
    apple: '/favicon.ico?v=2',
  },
  verification: {
    google: googleVerificationToken,
    other: {
      'msvalidate.01': msVerificationToken,
      'msapplication-TileColor': '#667eea',
      'msapplication-config': '/browserconfig.xml',
    },
  },
  keywords: [
    'learn japanese',
    'learn hiragana',
    'learn katakana',
    'learn kana',
    'learn kanji',
    'japanese vocabulary',
    'hiragana practice',
    'katakana practice',
    'kanji practice',
    'japanese learning app',
    'japanese online lessons',
    'japanese writing system',
    'JLPT preparation',
    'japanese language learning',
    'kana dojo',
    'japanese study tool',
    'free japanese lessons',
  ],
  authors: [{ name: 'LingDojo', url: 'https://kanadojo.com' }],
  creator: 'LingDojo',
  publisher: 'LingDojo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'KanaDojo - Learn Japanese Hiragana, Katakana, Kanji & Vocabulary',
    description:
      'Master Japanese with KanaDojo - an aesthetic, minimalist platform for learning Hiragana, Katakana, Kanji, and Vocabulary. Interactive games, progress tracking, and 100+ themes.',
    url: 'https://kanadojo.com',
    siteName: 'KanaDojo',
    type: 'website',
    locale: 'en_US',
    alternateLocale: ['es_ES'],
  },
  twitter: {
    card: 'summary',
    title: 'KanaDojo - Learn Japanese Online',
    description:
      'Master Japanese Hiragana, Katakana, Kanji & Vocabulary with interactive games and beautiful themes.',
    creator: '@kanadojo',
  },
  alternates: {
    canonical: 'https://kanadojo.com',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'education',
};

// Move analytics condition to a constant to avoid repeated evaluation
const isAnalyticsEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.ANALYTICS_DISABLED !== 'true';

const isAdSenseEnabled =
  process.env.NODE_ENV === 'production' &&
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production';

// Only bundled into the on-device mobile export.
const isMobileExport = process.env.MOBILE_EXPORT === '1';

// TEMPORARY on-device startup diagnostic. When the native WebView shows a blank
// screen, remote debugging isn't always available, so this paints any startup
// failure (uncaught errors, promise rejections, and — crucially — failed CSS/JS
// chunk loads, caught in the capture phase) directly onto the screen. Registered
// as the very first thing in <head> so it catches failures in later tags too.
// Remove once the blank-screen cause is fixed.
const MOBILE_STARTUP_DIAGNOSTIC = `(function(){var L=[];function render(){var el=document.getElementById('kd-diag');if(!el){el=document.createElement('div');el.id='kd-diag';el.style.cssText='position:fixed;inset:0;z-index:2147483647;background:#111;color:#0f0;font:12px/1.5 monospace;padding:14px;overflow:auto;white-space:pre-wrap;word-break:break-word';el.addEventListener('click',function(){el.style.display='none';});(document.body||document.documentElement).appendChild(el);}el.style.display='block';el.textContent='KanaDojo diagnostics (tap to dismiss)\\nUA: '+navigator.userAgent+'\\nURL: '+location.href+'\\n\\n'+(L.length?L.join('\\n\\n'):'No JS errors captured. If the screen was blank, the document or its chunks failed to load before this ran (a load/navigation failure, not a JS crash).');}window.__kdDiag=render;window.addEventListener('error',function(e){var t=e.target;if(t&&(t.tagName==='LINK'||t.tagName==='SCRIPT'||t.tagName==='IMG')){var u=t.src||t.href||'';L.push('RESOURCE FAILED:\\n'+u);if(u.indexOf('/_next/')>-1)render();}else{L.push('ERROR: '+(e.message||e.error)+'\\n'+((e.error&&e.error.stack)||''));render();}},true);window.addEventListener('unhandledrejection',function(e){var r=e.reason;L.push('PROMISE REJECTION: '+((r&&r.message)||r)+'\\n'+((r&&r.stack)||''));render();});window.addEventListener('load',function(){setTimeout(function(){if(document.querySelectorAll('body *').length<40)render();},6000);});})();`;

interface RootLayoutProps {
  readonly children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Get locale from the middleware-set header. The mobile static export has no
  // middleware/server, so fall back to the default locale there.
  let locale = 'en';
  if (process.env.MOBILE_EXPORT !== '1') {
    const headersList = await headers();
    locale = headersList.get('x-locale') || 'en';
  }

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* TEMPORARY on-device startup diagnostic — mobile export only. */}
        {isMobileExport && (
          <script
            dangerouslySetInnerHTML={{ __html: MOBILE_STARTUP_DIAGNOSTIC }}
          />
        )}
        {/* Anti-flash: paint the persisted theme background before hydration so
            the native WebView never shows a white frame between the (dark)
            splash screen and React's first paint. Falls back to the dark app
            chrome color via CSS when nothing is cached yet. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var b=localStorage.getItem('kd-theme-bg');if(b)document.documentElement.style.setProperty('--background-color',b);}catch(e){}`,
          }}
        />
        <StructuredData data={kanaDojoSchema} />
        {/* DNS prefetch for external domains - resolve DNS early */}
        {isAnalyticsEnabled && (
          <>
            <link rel='dns-prefetch' href='https://www.googletagmanager.com' />
            <link rel='dns-prefetch' href='https://www.clarity.ms' />
            <link rel='dns-prefetch' href='https://vercel-analytics.com' />
            <link
              rel='dns-prefetch'
              href='https://vitals.vercel-insights.com'
            />
          </>
        )}
        <link rel='dns-prefetch' href='https://translation.googleapis.com' />
        {/* Preconnect to critical domains - establish early connections */}
        {isAnalyticsEnabled && (
          <>
            <link
              rel='preconnect'
              href='https://www.googletagmanager.com'
              crossOrigin='anonymous'
            />
            <link
              rel='preconnect'
              href='https://vercel-analytics.com'
              crossOrigin='anonymous'
            />
          </>
        )}
        <link
          rel='preconnect'
          href='https://translation.googleapis.com'
          crossOrigin='anonymous'
        />
        {isAdSenseEnabled && (
          <Script
            async
            src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-5494430364707020'
            crossOrigin='anonymous'
            strategy='afterInteractive'
          />
        )}
      </head>
      <body>
        <SessionPrefetch />
        {isAnalyticsEnabled && (
          <>
            <GoogleAnalytics />
            {/* <MSClarity /> */}
            <Analytics />
            <SpeedInsights />
          </>
        )}
        {children}
      </body>
    </html>
  );
}
