-- 0023_projects.sql
-- P6 Projects Core (Ring D — the bridge from CRM to later ERP modules). GREENFIELD: creates
-- public.projects. ADDITIVE. No changes to companies/company_contacts or any business table
-- (leads/customers/orders/subscriptions/old documents/old requests). ROLLBACK notes inline.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Decisions P6-D2..D9/Q1/Q2.
-- Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0023_projects).

create table if not exists public.projects (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  name               text not null,
  description        text,
  company_id         uuid not null references public.companies(id) on delete restrict,
  primary_contact_id uuid references public.company_contacts(id) on delete set null,
  owner_id           uuid references public.profiles(id) on delete set null,
  status             text not null default 'draft',
  start_date         date,
  due_date           date,
  archived_at        timestamptz,
  archived_by        uuid references public.profiles(id) on delete set null,
  created_by         uuid references public.profiles(id) on delete set null,
  updated_by         uuid references public.profiles(id) on delete set null,
  constraint projects_status_check check (status in ('draft','active','on_hold','completed','cancelled','archived'))
);
-- ROLLBACK: drop table public.projects;

-- updated_at trigger (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='projects_touch_updated_at') then
    create trigger projects_touch_updated_at before update on public.projects
      for each row execute function public.touch_updated_at();
  end if;
end $$;

create index if not exists projects_company_id_idx         on public.projects (company_id);
create index if not exists projects_primary_contact_id_idx on public.projects (primary_contact_id);
create index if not exists projects_owner_id_idx           on public.projects (owner_id);
create index if not exists projects_status_idx             on public.projects (status) where archived_at is null;
create index if not exists projects_name_idx               on public.projects (name);
create index if not exists projects_due_date_idx           on public.projects (due_date) where archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads (P6-D8). No write policies — writes are service-role only via actions.
alter table public.projects enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='projects' and policyname='projects_select') then
    execute $p$create policy projects_select on public.projects for select to authenticated
      using (has_permission('projects.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: drops with the table (or: drop policy projects_select on public.projects;).

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('projects.read',    'projects', 'View projects'),
  ('projects.create',  'projects', 'Create projects'),
  ('projects.update',  'projects', 'Update projects'),
  ('projects.archive', 'projects', 'Archive projects')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('projects.read','projects.create','projects.update','projects.archive');

-- role grants: admin all; sales read/create/update (no archive); analyst/reviewer/read_only read.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('projects.read','projects.create','projects.update','projects.archive'))
    or (r.key = 'sales' and p.key in ('projects.read','projects.create','projects.update'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('projects.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('projects.read','projects.create','projects.update','projects.archive');
