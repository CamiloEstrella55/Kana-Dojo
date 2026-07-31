-- =============================================================================
-- Fix: public.sync_progress() failed on every call
-- -----------------------------------------------------------------------------
-- `RETURNS TABLE (stored, store_key, data, updated_at_ms, updated_at)` declares
-- PL/pgSQL OUT variables with those exact names. They collide with the
-- identically named columns of public.user_progress, and PL/pgSQL's default
-- #variable_conflict is `error`, so the ON CONFLICT index-inference clause
--
--     on conflict (user_id, store_key) do update ...
--
-- raised:
--
--     column reference "store_key" is ambiguous
--     DETAIL: It could refer to either a PL/pgSQL variable or a table column.
--
-- Every push therefore failed, the client surfaced "sync error", and
-- public.user_progress stayed empty.
--
-- This replaces the body with explicit UPDATE / INSERT branches so no column
-- reference is ever ambiguous, and assigns the OUT variables directly instead
-- of using RETURNING ... INTO. The signature and returned shape are unchanged,
-- so no client change is required.
--
-- Concurrency is preserved: the row is still locked with SELECT ... FOR UPDATE,
-- and the INSERT branch additionally catches unique_violation and retries as an
-- UPDATE, covering the race where two sessions insert the same key at once.
-- =============================================================================

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
  v_now timestamptz := now();
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

  -- Server already has a newer (or equal) snapshot: reject, return the latest.
  if found and v_current.updated_at_ms >= p_updated_at_ms then
    stored := false;
    store_key := v_current.store_key;
    data := v_current.data;
    updated_at_ms := v_current.updated_at_ms;
    updated_at := v_current.updated_at;
    return next;
    return;
  end if;

  if found then
    update public.user_progress up
       set data = p_data,
           schema_version = p_schema_version,
           updated_at_ms = p_updated_at_ms,
           updated_at = v_now
     where up.user_id = v_uid
       and up.store_key = p_store_key;
  else
    begin
      insert into public.user_progress
        (user_id, store_key, data, schema_version, updated_at_ms, updated_at)
      values
        (v_uid, p_store_key, p_data, p_schema_version, p_updated_at_ms, v_now);
    exception
      when unique_violation then
        update public.user_progress up
           set data = p_data,
               schema_version = p_schema_version,
               updated_at_ms = p_updated_at_ms,
               updated_at = v_now
         where up.user_id = v_uid
           and up.store_key = p_store_key;
    end;
  end if;

  stored := true;
  store_key := p_store_key;
  data := p_data;
  updated_at_ms := p_updated_at_ms;
  updated_at := v_now;
  return next;
end;
$$;

comment on function public.sync_progress is
  'Atomic last-write-wins upsert of a single progress store for the current user.';

revoke all on function public.sync_progress(text, jsonb, bigint, integer) from public;
grant execute on function public.sync_progress(text, jsonb, bigint, integer) to authenticated;

-- PostgREST caches the schema; make the replaced function visible immediately.
notify pgrst, 'reload schema';
