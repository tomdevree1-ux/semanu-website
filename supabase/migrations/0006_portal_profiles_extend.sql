-- ============================================================
-- amai.ch · 0006 · portal: extend profiles (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_profiles_extend`
-- (applied 2026-06-09 to amai prod, ref bkwwlmflsbhrsfwydbnv).
--
-- ADDITIVE ONLY — ALTER ADD COLUMN + CREATE OR REPLACE. Drops nothing,
-- recreates nothing. Builds on the EXISTING `profiles` (full_name, is_active).
-- Never touches leads/customers/orders/subscriptions/documents/requests.
-- ============================================================
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name  text,
  add column if not exists status     text not null default 'invited'
                                       check (status in ('active','disabled','invited')),
  add column if not exists avatar_url text,
  add column if not exists created_by uuid references auth.users(id) on delete set null;

update public.profiles set status = case when is_active then 'active' else 'disabled' end;
update public.profiles
   set first_name = nullif(split_part(coalesce(full_name,''),' ',1),''),
       last_name  = nullif(trim(substr(coalesce(full_name,''),
                      length(split_part(coalesce(full_name,''),' ',1)) + 1)), '')
 where first_name is null and full_name is not null;

create or replace function public.profiles_sync_active()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if tg_op = 'INSERT' then
    new.is_active := (new.status = 'active');
  elsif new.status is distinct from old.status then
    new.is_active := (new.status = 'active');
  elsif new.is_active is distinct from old.is_active then
    new.status := case when new.is_active then 'active' else 'disabled' end;
  end if;
  return new;
end; $$;
drop trigger if exists profiles_sync_active on public.profiles;
create trigger profiles_sync_active before insert or update on public.profiles
  for each row execute function public.profiles_sync_active();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, status, created_by)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name',
      nullif(trim(coalesce(new.raw_user_meta_data->>'first_name','')||' '||
                  coalesce(new.raw_user_meta_data->>'last_name','')),'')),
    nullif(new.raw_user_meta_data ->> 'first_name',''),
    nullif(new.raw_user_meta_data ->> 'last_name',''),
    coalesce(nullif(new.raw_user_meta_data ->> 'status',''), 'invited'),
    nullif(new.raw_user_meta_data ->> 'created_by','')::uuid
  )
  on conflict (id) do nothing;
  return new;
end; $$;

-- ROLLBACK (corrective migration only; never destructive on prod):
--   drop trigger if exists profiles_sync_active on public.profiles;
--   drop function if exists public.profiles_sync_active();
--   alter table public.profiles
--     drop column if exists first_name, drop column if exists last_name,
--     drop column if exists status, drop column if exists avatar_url, drop column if exists created_by;
--   -- restore the prior handle_new_user() body (insert id,email,full_name only).
