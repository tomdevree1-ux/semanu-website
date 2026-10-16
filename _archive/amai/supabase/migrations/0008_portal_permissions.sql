-- ============================================================
-- amai.ch · 0008 · portal: permissions + platform_admins + authz fns (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_permissions`.
-- Builds on the EXISTING roles/user_roles + is_admin()/has_role(). Drops nothing.
-- ============================================================
create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  key text not null unique, module text not null, label text not null,
  created_at timestamptz not null default now()
);
create table if not exists public.role_permissions (
  role_id smallint not null references public.roles(id) on delete cascade,
  permission_id uuid not null references public.permissions(id) on delete cascade,
  primary key (role_id, permission_id)
);
create table if not exists public.platform_admins (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  reason text
);

create or replace function public.is_platform_super_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.platform_admins pa join public.profiles p on p.id = pa.user_id
                 where pa.user_id = auth.uid() and p.status = 'active');
$$;
create or replace function public.has_permission(p_key text)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_platform_super_admin()
      or exists (
        select 1 from public.user_roles ur
        join public.role_permissions rp on rp.role_id = ur.role_id
        join public.permissions perm on perm.id = rp.permission_id
        join public.profiles p on p.id = ur.user_id
        where ur.user_id = auth.uid() and p.status = 'active' and perm.key = p_key);
$$;
create or replace function public.is_org_admin()
returns boolean language sql stable security definer set search_path to 'public' as $$
  select public.is_admin() or public.is_platform_super_admin();
$$;
create or replace function public.get_user_permissions()
returns setof text language sql stable security definer set search_path to 'public' as $$
  select perm.key from public.user_roles ur
  join public.role_permissions rp on rp.role_id = ur.role_id
  join public.permissions perm on perm.id = rp.permission_id
  where ur.user_id = auth.uid()
  union
  select key from public.permissions where public.is_platform_super_admin();
$$;
grant execute on function public.get_user_permissions() to authenticated, service_role;

alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.platform_admins enable row level security;
drop policy if exists permissions_select_admin on public.permissions;
create policy permissions_select_admin on public.permissions for select to authenticated
  using (public.is_admin() or public.is_platform_super_admin());
drop policy if exists role_permissions_select_admin on public.role_permissions;
create policy role_permissions_select_admin on public.role_permissions for select to authenticated
  using (public.is_admin() or public.is_platform_super_admin());
drop policy if exists platform_admins_select on public.platform_admins;
create policy platform_admins_select on public.platform_admins for select to authenticated
  using (public.is_platform_super_admin());

insert into public.permissions (key,module,label) values
 ('users.read','users','View users'),('users.create','users','Create users'),
 ('users.update','users','Update users'),('users.disable','users','Disable users'),
 ('users.change_role','users','Change user roles'),
 ('audit.read','audit','Read audit history'),('audit.read_technical','audit','Read technical audit fields'),
 ('org.manage','org','Manage organization'),('roles.manage','org','Manage roles')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r cross join public.permissions p where r.key = 'admin'
on conflict do nothing;
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id from public.roles r join public.permissions p on p.key = 'audit.read'
where r.key in ('analyst','sales','reviewer','read_only')
on conflict do nothing;

-- Owner bootstrap (run once, after the owner auth user exists):
--   insert into public.platform_admins(user_id,reason)
--     select id,'founder/bootstrap' from auth.users where lower(email)=lower('OWNER_EMAIL') on conflict do nothing;
--   insert into public.user_roles(user_id,role_id)
--     select u.id, r.id from auth.users u, public.roles r where lower(u.email)=lower('OWNER_EMAIL') and r.key='admin' on conflict do nothing;
--   insert into public.organization_members(organization_id,user_id,role_id,member_type,status)
--     select o.id,u.id,r.id,'internal','active' from public.organizations o, auth.users u, public.roles r
--     where o.slug='amai' and lower(u.email)=lower('OWNER_EMAIL') and r.key='admin'
--     on conflict (organization_id,user_id) do update set status='active';

-- ROLLBACK: drop function if exists public.get_user_permissions(), public.is_org_admin(),
--   public.has_permission(text), public.is_platform_super_admin();
--   drop table if exists public.role_permissions, public.platform_admins, public.permissions;
