-- =============================================================================
-- KanaDojo: authenticated cross-device progress sync
-- -----------------------------------------------------------------------------
-- Adds:
--   1. public.profiles      - one row per auth user (display metadata)
--   2. public.user_progress - per-user, per-store JSONB snapshots (the synced
--                             data: stats, streaks, SRS set-progress, achievements,
--                             vocab, preferences, etc.)
--   3. Row-Level Security so a user can only ever read/write their own rows.
--   4. sync_progress()      - atomic last-write-wins upsert RPC that mirrors the
--                             existing Redis Lua behaviour but is authenticated.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Profiles
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (
    display_name is null or char_length(display_name) <= 64
  )
);

comment on table public.profiles is
  'Public profile data for each authenticated KanaDojo user.';

-- -----------------------------------------------------------------------------
-- 2. Per-store progress snapshots
-- -----------------------------------------------------------------------------
-- One row per (user, store_key). store_key matches the Zustand persist name,
-- e.g. 'kanadojo-stats', 'kanadojo', 'kanadojo-achievements',
-- 'vocabulary-storage', 'kanadojo-visits', etc. `data` is the persisted store
-- payload; `updated_at_ms` is the client clock used for last-write-wins.
create table if not exists public.user_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  store_key text not null,
  data jsonb not null,
  schema_version integer not null default 1,
  updated_at_ms bigint not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, store_key),
  constraint user_progress_store_key_length check (
    char_length(store_key) between 1 and 128
  ),
  -- guard against a single oversized snapshot (~1 MB)
  constraint user_progress_data_size check (
    pg_column_size(data) <= 1048576
  )
);

comment on table public.user_progress is
  'Per-user, per-store JSONB progress snapshots synced across devices.';

create index if not exists user_progress_user_id_idx
  on public.user_progress (user_id);

create index if not exists user_progress_updated_at_idx
  on public.user_progress (user_id, updated_at desc);

-- -----------------------------------------------------------------------------
-- 3. Row-Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_progress enable row level security;

-- profiles: owner-only access
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- user_progress: owner-only access
drop policy if exists "user_progress_select_own" on public.user_progress;
create policy "user_progress_select_own" on public.user_progress
  for select using (auth.uid() = user_id);

drop policy if exists "user_progress_insert_own" on public.user_progress;
create policy "user_progress_insert_own" on public.user_progress
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_progress_update_own" on public.user_progress;
create policy "user_progress_update_own" on public.user_progress
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_progress_delete_own" on public.user_progress;
create policy "user_progress_delete_own" on public.user_progress
  for delete using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- 4. updated_at maintenance
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- 5. Auto-create a profile row when a new auth user signs up
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'display_name',
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- -----------------------------------------------------------------------------
-- 6. Atomic last-write-wins upsert RPC
-- -----------------------------------------------------------------------------
-- Stores the incoming snapshot only if it is newer than what's on the server
-- (by updated_at_ms). Returns the row that is authoritative after the call:
--   stored = true  -> the incoming snapshot won and was persisted
--   stored = false -> the server already had a newer snapshot (returned in data)
-- This mirrors the Redis Lua UPSERT used by the legacy anonymous sync, but is
-- scoped to the authenticated user via auth.uid().
create or replace function public.sync_progress(
  p_store_key text,
  p_data jsonb,
  p_updated_at_ms bigint,
  p_schema_version integer default 1
)
returns table (
  stored boolean,
  store_key text,
  data jsonb,
  updated_at_ms bigint,
  updated_at timestamptz
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_current public.user_progress%rowtype;
begin
  if v_uid is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  if p_updated_at_ms is null then
    raise exception 'updated_at_ms is required' using errcode = '22004';
  end if;

  select * into v_current
  from public.user_progress up
  where up.user_id = v_uid and up.store_key = p_store_key
  for update;

  -- Server already has a newer (or equal) snapshot: reject, return latest.
  if found and v_current.updated_at_ms >= p_updated_at_ms then
    return query
      select false, v_current.store_key, v_current.data,
             v_current.updated_at_ms, v_current.updated_at;
    return;
  end if;

  insert into public.user_progress as up
    (user_id, store_key, data, schema_version, updated_at_ms, updated_at)
  values
    (v_uid, p_store_key, p_data, p_schema_version, p_updated_at_ms, now())
  on conflict (user_id, store_key) do update
    set data = excluded.data,
        schema_version = excluded.schema_version,
        updated_at_ms = excluded.updated_at_ms,
        updated_at = now()
  returning up.store_key, up.data, up.updated_at_ms, up.updated_at
    into store_key, data, updated_at_ms, updated_at;

  stored := true;
  return next;
end;
$$;

comment on function public.sync_progress is
  'Atomic last-write-wins upsert of a single progress store for the current user.';

revoke all on function public.sync_progress(text, jsonb, bigint, integer) from public;
grant execute on function public.sync_progress(text, jsonb, bigint, integer) to authenticated;
