import type { CapacitorConfig } from '@capacitor/cli';

/**
 * KanaDojo native shell (Capacitor).
 *
 * On-device model: the Next.js app is built as a static export (`npm run
 * build:mobile` → ./out) and bundled inside the app. It runs entirely on the
 * device and talks directly to Supabase for auth + cross-device sync — no web
 * hosting required.
 */
const config: CapacitorConfig = {
  appId: 'com.kanadojo.app',
  appName: 'KanaDojo',
  webDir: 'out',
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
    // Bundled files are served locally; only allow outbound nav to Supabase.
    androidScheme: 'https',
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
