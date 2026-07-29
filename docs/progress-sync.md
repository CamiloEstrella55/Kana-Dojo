# Cross-device progress sync (Supabase)

Authenticated cloud sync for learning progress, statistics, and streaks so a
user's data follows them across devices. Replaces the legacy anonymous
`x-sync-key` → Redis endpoint (`app/api/progress-sync`), which had no login and
no client integration.

## Pieces

| Concern | Location |
| --- | --- |
| DB schema, RLS, LWW upsert RPC | `supabase/migrations/20260729000000_auth_and_progress_sync.sql` |
| Browser/native Supabase client | `shared/infra/client/supabaseClient.ts` |
| Auth session storage (pluggable) | `shared/infra/client/authStorage.ts` |
| Auth provider + hook | `shared/infra/client/auth/AuthProvider.tsx` |
| Auth/account UI | `shared/infra/client/auth/AuthModal.tsx`, `AccountButton.tsx` |
| Per-store sync adapters | `shared/infra/client/progressSync/adapters.ts` |
| Sync engine (pull/push/merge/realtime) | `shared/infra/client/progressSync/syncEngine.ts` |

## Synced stores

| Server `store_key` | Source store | Backend | Merge |
| --- | --- | --- | --- |
| `kanadojo-stats` | `useStatsStore` | localStorage (persist) | last-write-wins |
| `kanadojo-achievements` | `useAchievementStore` | localStorage (persist) | last-write-wins |
| `kanadojo-goal-timers` | `useGoalTimersStore` | localStorage (persist) | last-write-wins |
| `vocabulary-storage` | `useVocabStore` | localStorage (persist) | last-write-wins |
| `kanadojo-set-progress` | `useSetProgressStore` | localforage | per-item **max** (lossless) |
| `kanadojo-visits` | `useVisitStore` | localforage | date-set **union** (lossless) |

Derived caches (`kanji-cache`, `vocab-cache`), UI/session state, and onboarding
flags are intentionally **not** synced.

## Model

- Each store has an **adapter** (`read` / `applyRemote` / optional `merge` /
  `subscribe`) so the engine never touches store internals.
- Timestamps drive last-write-wins. Stores without their own `updatedAt` use a
  sidecar `kanadojo-sync-meta` localStorage map bumped on every local mutation.
- On sign-in: `syncNow()` reconciles every store two-way. Streaks and set
  progress are **merged losslessly**; the rest use last-write-wins.
- While signed in: local changes are pushed (debounced 3s) via the
  `sync_progress` RPC (atomic server-side LWW), and remote changes arrive via
  Supabase Realtime + on focus/online.
- Signed out or unconfigured → the app runs exactly as before (local-only).

## Setup

1. Create a Supabase project.
2. Run the migration (`supabase db push`, or paste the SQL into the SQL editor).
3. Enable Realtime for `public.user_progress` (Database → Publications →
   `supabase_realtime` → add the table).
4. Set env vars (see `.env.local.example`):
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. In Supabase Auth settings, add your app origins to the redirect allow-list
   (web origin now; the native `kanadojo://` scheme in Phase 2).

## Known follow-ups

- Password-reset landing route (`/reset-password`) is not built yet; the reset
  email currently links to a placeholder path.
- `kanadojo-stats` uses last-write-wins; a field-aware additive merge would
  further reduce loss when the same account trains offline on two devices
  simultaneously. The adapter `merge` hook is the extension point.
