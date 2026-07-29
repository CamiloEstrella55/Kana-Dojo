# KanaDojo native mobile app (Capacitor)

The app runs **entirely on-device**: the Next.js frontend is built as a static
export and bundled inside the iOS/Android app, which talks **directly to
Supabase** for auth + cross-device sync. No web hosting is required.

## How it works

`npm run build:mobile` produces a static export in `./out`, which Capacitor
bundles as the app's web assets (`webDir: 'out'`).

The mobile build (`scripts/mobile-build.mjs`, gated by `MOBILE_EXPORT=1`):

1. Temporarily moves aside server-only code that can't be statically exported
   (`app/api`, `app/llms.txt`, `app/security.txt`, `proxy.ts`,
   `instrumentation.ts`), then restores it afterwards.
2. Runs `next build` with `output: 'export'` (see `next.config.ts`):
   - image optimization off, no `headers()`, Sentry disabled.
   - i18n uses `localePrefix: 'always'` (via `NEXT_PUBLIC_MOBILE_EXPORT`) so
     in-app links resolve to the exported `/en/*` files without middleware.
3. Ships **English only** (removes `out/es`) to keep the bundle ~90 MB smaller.
4. Writes `out/index.html` that redirects to `./en/` (the app's entry).

Supabase credentials are read from `NEXT_PUBLIC_SUPABASE_URL` /
`NEXT_PUBLIC_SUPABASE_ANON_KEY` at build time and baked into the bundle, so
login/signup + sync work offline-first against Supabase.

### Trade-offs (on-device vs. hosted)

Server-only features are **not** in the on-device build: the translator proxy,
live community stats, server-rendered SEO/OG, and the bug-report webhook. The
core experience — all training modes, progress, stats, streaks, achievements,
preferences, and Supabase auth/sync — works fully offline.

## Local development

```bash
npm run build:mobile          # → ./out  (needs .env.local with NEXT_PUBLIC_SUPABASE_*)
node scripts/serve-out.mjs    # preview the bundle at http://localhost:5055
npm run cap:sync              # copy ./out into ios/ and android/
npm run cap:open:ios          # open in Xcode (macOS)
npm run cap:open:android      # open in Android Studio
```

## CI builds (GitHub Actions)

Both workflows build `./out` (with Supabase env), `cap sync`, then package an
installable artifact. **Manual only** — Actions tab → select workflow → **Run
workflow**. Artifacts retained 1 day.

- `.github/workflows/ios-unsigned-ipa.yml` → `KanaDojo-unsigned-ipa`
  (unsigned `.ipa`; sign before installing on a device — Apple Developer
  account required).
- `.github/workflows/android-debug-apk.yml` → `KanaDojo-debug-apk`
  (installs directly with "unknown sources" enabled).

### Required repo secrets

Add these under **Settings → Secrets and variables → Actions → Secrets** so the
CI bundle has working auth/sync:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

(The anon key is safe to embed — it's protected by Row-Level Security.)

## Follow-ups

- Bundle is ~240 MB (mostly prerendered HTML). Trimming unused `experiments/*`
  routes and precompressing would cut this substantially.
- Replace placeholder app icons/splash under `ios/App/App/Assets.xcassets` and
  `android/app/src/main/res` before store submission.
