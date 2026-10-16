-- ============================================================
-- amai.ch · 0007 · portal: organizations + membership (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_organizations`.
-- organization_members.role_id -> the EXISTING smallint `roles`. Drops nothing.
-- ============================================================
create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  slug        text not null unique,
  name        text not null,
  status      text not null default 'active' check (status in ('active','disabled'))
);
drop trigger if exists organizations_touch on public.organizations;
create trigger organizations_touch before update on public.organizations
  for each row execute function public.touch_updated_at();

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  role_id         smallint not null references public.roles(id),
  member_type     text not null default 'internal' check (member_type in ('internal','external')),
  status          text not null default 'active' check (status in ('active','disabled','invited')),
  unique (organization_id, user_id)
);
create index if not exists organization_members_user_idx on public.organization_members(user_id);
create index if not exists organization_members_org_idx  on public.organization_members(organization_id);
drop trigger if exists organization_members_touch on public.organization_members;
create trigger organization_members_touch before update on public.organization_members
  for each row execute function public.touch_updated_at();

-- V1 ASSUMPTION ONLY: a user has exactly one active organization. Replace with an
-- explicit active-org context before enabling multi-org.
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path to 'public' as $$
  select organization_id from public.organization_members
  where user_id = auth.uid() and status = 'active' limit 1
$$;

insert into public.organizations (slug, name) values ('amai','amai')
on conflict (slug) do nothing;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations
  for select to authenticated using (id = public.current_org() or public.is_admin());
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- ROLLBACK: drop table if exists public.organization_members;
--           drop table if exists public.organizations;
--           drop function if exists public.current_org();
