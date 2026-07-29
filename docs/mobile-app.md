# KanaDojo native mobile app (Capacitor)

The web app is wrapped in a [Capacitor](https://capacitorjs.com) native shell to
ship real installable iOS and Android apps.

## Architecture: hybrid remote-URL

Because KanaDojo is a server-rendered Next.js app (API routes, i18n SSR, OG
images, Sentry), the native shell **loads the deployed site** rather than a
static export. This keeps every server feature working while Capacitor adds:

- **Secure session storage** — the Supabase auth session is stored in Capacitor
  Preferences on device (see `shared/infra/client/native/initNative.ts`).
- **Deep links** — `com.kanadojo.app://` / `kanadojo://` for OAuth &
  email-confirmation redirects.
- **Native chrome** — status bar styling, splash screen, keyboard handling.

The URL is controlled by `CAP_SERVER_URL` (build-time). It defaults to
`https://kanadojo.com` so a built app runs out of the box — **set it to your own
deployment of this repo** (e.g. your Vercel URL) so the auth + cross-device sync
from Phase 1 is present.

## Layout

| Path | What |
| --- | --- |
| `capacitor.config.ts` | App id (`com.kanadojo.app`), name, server URL, plugins |
| `mobile/www/` | Local fallback/splash shown while the remote app loads |
| `ios/` | Generated Xcode project (SPM-based, no CocoaPods) |
| `android/` | Generated Gradle project |
| `shared/infra/client/native/initNative.ts` | Native bootstrap (storage, deep links, status bar) |

## Local development

```bash
# Point the shell at your deployment (or leave unset for kanadojo.com)
export CAP_SERVER_URL="https://your-deployment.example.com"

npm run cap:sync           # copy config + web assets, update native deps
npm run cap:open:ios       # open in Xcode  (macOS only)
npm run cap:open:android   # open in Android Studio
```

Then Run from Xcode / Android Studio onto a simulator or device.

## CI builds (GitHub Actions)

Two workflows produce installable artifacts. They are **manual-only** — trigger
them from the repo **Actions** tab → select the workflow → **Run workflow**.
Artifacts are retained for **1 day**.

- **`.github/workflows/ios-unsigned-ipa.yml`** → `KanaDojo-unsigned-ipa`
  (an **unsigned** `.ipa`). Unsigned IPAs must be signed before installing on a
  stock device (your own cert, AltStore, Sideloadly). Signing needs an Apple
  Developer account.
- **`.github/workflows/android-debug-apk.yml`** → `KanaDojo-debug-apk`
  (a debug-signed `.apk` that installs directly on any Android device with
  "unknown sources" enabled).

Set a repo **Actions variable** `CAP_SERVER_URL` (Settings → Secrets and
variables → Actions → Variables) to bake your deployment URL into the builds.

Download artifacts from the workflow run's **Summary → Artifacts** section.

## Going to production

- **iOS App Store / Google Play** require signing with your own developer
  accounts and app icons/splash assets. Replace the placeholder icons under
  `ios/App/App/Assets.xcassets` and `android/app/src/main/res`.
- Add your app's redirect URLs (`com.kanadojo.app://`) to Supabase Auth →
  URL Configuration before enabling OAuth providers.
