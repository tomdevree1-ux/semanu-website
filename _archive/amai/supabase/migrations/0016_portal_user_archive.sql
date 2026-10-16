-- 0016_portal_user_archive.sql
-- P4: foundation for safe user archive / restore / anonymize. Additive + safe.
-- Build ON the live schema (Part IV L1/L2). No business-table changes, no
-- destructive SQL (CHECK changes only WIDEN the allowed set). profiles_sync_active
-- needs no change: `archived` → is_active=false via its status-driven branch.
--
-- ROLLBACK (in reverse order; the CHECK narrowing is only safe when no row has
-- status='archived' — restore/disable such users first):
--   delete from public.role_permissions where permission_id in
--     (select id from public.permissions where key in ('users.archive','users.anonymize'));
--   delete from public.permissions where key in ('users.archive','users.anonymize');
--   alter table public.organization_members drop constraint organization_members_status_check;
--   alter table public.organization_members add constraint organization_members_status_check
--     check (status in ('active','disabled','invited'));
--   alter table public.profiles drop column if exists archived_by;
--   alter table public.profiles drop column if exists archived_at;
--   alter table public.profiles drop constraint if exists profiles_status_check;
--   alter table public.profiles add constraint profiles_status_check
--     check (status in ('active','disabled','invited'));

-- Pre-validate: every existing status must be in the new allowed set (it is).
do $$
begin
  if exists (select 1 from public.profiles where status not in ('active','disabled','invited','archived')) then
    raise exception 'profiles has a status outside the new allowed set; aborting';
  end if;
end $$;

-- 1. Widen profiles.status to include 'archived'.
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active','disabled','invited','archived'));

-- 2. Provenance columns (nullable; safe FK to profiles).
alter table public.profiles add column if not exists archived_at timestamptz;
alter table public.profiles add column if not exists archived_by uuid
  references public.profiles(id) on delete set null;

-- 3. Widen organization_members.status to include 'archived' (constraint name
--    discovered dynamically, then recreated with a stable name).
do $$
declare cname text;
begin
  select conname into cname
  from pg_constraint
  where conrelid='public.organization_members'::regclass and contype='c'
    and pg_get_constraintdef(oid) ilike '%status%';
  if cname is not null then
    execute format('alter table public.organization_members drop constraint %I', cname);
  end if;
  alter table public.organization_members add constraint organization_members_status_check
    check (status in ('active','disabled','invited','archived'));
end $$;

-- 4. Seed archive permissions (module + label are NOT NULL in the live catalog).
insert into public.permissions(key, module, label) values
  ('users.archive', 'users', 'Archive users'),
  ('users.anonymize', 'users', 'Anonymize users (GDPR)')
on conflict (key) do nothing;

-- 5. Grant ONLY users.archive to the admin role. users.anonymize is intentionally
--    not granted to any role; the anonymize action is gated by is_platform_super_admin()
--    in code. (The permission row exists for completeness/auditing.)
insert into public.role_permissions(role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on p.key = 'users.archive'
where r.key = 'admin'
on conflict do nothing;
