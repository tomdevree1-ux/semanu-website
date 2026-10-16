-- 0022_crm_companies_contacts.sql
-- P5 CRM Core (Companies + Contacts). ADDITIVE only. Builds the CRM lifecycle layer on the
-- EXISTING live `companies` (prospecting master) and promotes `company_contacts` into the
-- first-class contact entity. The prospecting `lead_status` machine and all pipeline columns/
-- tables (scans, analyses, emails, payments, customers, leads, orders, ...) are UNTOUCHED.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Option A (approved).
-- Never edit an applied migration (Part IV L2); add a new one. ROLLBACK notes inline.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0022_crm_companies_contacts).

-- 1) companies: CRM lifecycle layer (orthogonal to the pipeline `lead_status`)
alter table public.companies
  add column if not exists crm_status  text not null default 'lead',
  add column if not exists owner_id    uuid references public.profiles(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null;
-- ROLLBACK: alter table public.companies drop column crm_status, drop column owner_id, drop column archived_at, drop column archived_by;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'companies_crm_status_check') then
    alter table public.companies add constraint companies_crm_status_check
      check (crm_status in ('lead','qualified','active','dormant','lost','blocked','archived'));
  end if;
end $$;
-- ROLLBACK: alter table public.companies drop constraint companies_crm_status_check;

create index if not exists companies_crm_status_idx   on public.companies (crm_status) where archived_at is null;
create index if not exists companies_company_name_idx on public.companies (company_name);
create index if not exists companies_domain_lower_idx on public.companies (lower(domain)) where domain is not null;
-- ROLLBACK: drop index if exists public.companies_crm_status_idx, public.companies_company_name_idx, public.companies_domain_lower_idx;

-- 2) company_contacts: promote to the first-class CRM contact entity
alter table public.company_contacts
  add column if not exists contact_status text not null default 'lead',
  add column if not exists updated_at  timestamptz not null default now(),
  add column if not exists is_primary  boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archived_by uuid references public.profiles(id) on delete set null,
  add column if not exists created_by  uuid references public.profiles(id) on delete set null,
  add column if not exists updated_by  uuid references public.profiles(id) on delete set null;
-- ROLLBACK: alter table public.company_contacts drop column contact_status, drop column updated_at, drop column is_primary, drop column archived_at, drop column archived_by, drop column created_by, drop column updated_by;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'company_contacts_status_check') then
    alter table public.company_contacts add constraint company_contacts_status_check
      check (contact_status in ('lead','qualified','active','dormant','blocked','archived'));
  end if;
end $$;
-- ROLLBACK: alter table public.company_contacts drop constraint company_contacts_status_check;

-- updated_at trigger (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'company_contacts_touch_updated_at') then
    create trigger company_contacts_touch_updated_at
      before update on public.company_contacts
      for each row execute function public.touch_updated_at();
  end if;
end $$;
-- ROLLBACK: drop trigger if exists company_contacts_touch_updated_at on public.company_contacts;

create index if not exists company_contacts_company_id_idx  on public.company_contacts (company_id);
create index if not exists company_contacts_status_idx      on public.company_contacts (contact_status) where archived_at is null;
create index if not exists company_contacts_email_lower_idx on public.company_contacts (lower(email)) where email is not null;
-- ROLLBACK: drop index if exists public.company_contacts_company_id_idx, public.company_contacts_status_idx, public.company_contacts_email_lower_idx;

-- 3) permissions seed (module + label are NOT NULL on this table)
insert into public.permissions (key, module, label) values
  ('companies.read',    'companies', 'View companies'),
  ('companies.create',  'companies', 'Create companies'),
  ('companies.update',  'companies', 'Update companies'),
  ('companies.archive', 'companies', 'Archive companies'),
  ('contacts.read',     'contacts',  'View contacts'),
  ('contacts.create',   'contacts',  'Create contacts'),
  ('contacts.update',   'contacts',  'Update contacts'),
  ('contacts.archive',  'contacts',  'Archive contacts')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('companies.read','companies.create','companies.update','companies.archive','contacts.read','contacts.create','contacts.update','contacts.archive');

-- 4) role_permissions grants (idempotent via NOT EXISTS).
-- admin: all; sales: read/create/update (NO archive); analyst/reviewer/read_only: read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('companies.read','companies.create','companies.update','companies.archive','contacts.read','contacts.create','contacts.update','contacts.archive'))
    or (r.key = 'sales' and p.key in ('companies.read','companies.create','companies.update','contacts.read','contacts.create','contacts.update'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('companies.read','contacts.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('companies.read','companies.create','companies.update','companies.archive','contacts.read','contacts.create','contacts.update','contacts.archive');
