import type { CapacitorConfig } from '@capacitor/cli';

/**
 * KanaDojo native shell (Capacitor).
 *
 * Hybrid model: the native iOS/Android app loads the deployed Next.js site so
 * all server features (API routes, i18n SSR, OG images) keep working, while
 * Capacitor adds native storage, haptics, status bar, splash, and deep links.
 *
 * Point CAP_SERVER_URL at YOUR deployment of this repo (e.g. your Vercel URL)
 * so the auth + cross-device sync built in Phase 1 is present. It defaults to
 * the public site so a freshly built IPA still runs out of the box.
 */
const serverUrl = process.env.CAP_SERVER_URL || 'https://kanadojo.com';

const config: CapacitorConfig = {
  appId: 'com.kanadojo.app',
  appName: 'KanaDojo',
  webDir: 'mobile/www',
  ios: {
    contentInset: 'always',
    backgroundColor: '#0b0b0f',
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
    backgroundColor: '#0b0b0f',
  },
  server: {
    url: serverUrl,
    cleartext: false,
    // Allow the deployed origin to be treated as the app's own for navigation.
    allowNavigation: ['*.supabase.co'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: '#0b0b0f',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    Keyboard: {
      resize: 'native',
    },
  },
};

export default config;
