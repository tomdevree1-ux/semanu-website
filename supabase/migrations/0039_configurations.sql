-- 0039_configurations.sql
-- P9 Website configurator (ERP). ADDITIVE. Creates public.configurations +
-- public.configuration_versions: a versioned pricing configuration built from the
-- public website configurator or inside the portal, convertible to a quote. Each
-- edit is a new immutable version (who + when), so the full history stays available.
-- No changes to any existing table. ROLLBACK notes inline. Never edit an applied
-- migration (Part IV L2); add a new one.

create sequence if not exists public.configuration_number_seq;
-- ROLLBACK: drop sequence public.configuration_number_seq;

create table if not exists public.configurations (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  config_number   text not null default ('C-' || lpad(nextval('public.configuration_number_seq')::text, 5, '0')),
  title           text not null default 'Website Konfiguration',
  situation       text not null default 'new',
  status          text not null default 'draft',
  current_version integer not null default 1,
  lead_id         uuid references public.leads(id) on delete set null,
  company_id      uuid references public.companies(id) on delete set null,
  quote_id        uuid references public.quotes(id) on delete set null,
  source          text not null default 'inbound_web',
  archived_at     timestamptz,
  archived_by     uuid references public.profiles(id) on delete set null,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  constraint configurations_situation_check check (situation in ('new','existing')),
  constraint configurations_status_check    check (status in ('draft','quoted','archived')),
  constraint configurations_source_check    check (source in ('inbound_web','portal')),
  constraint configurations_version_check   check (current_version >= 1)
);
-- ROLLBACK: drop table public.configurations;

-- One immutable snapshot per edit. payload holds the full ConfigState plus the
-- computed price lines, so any version can be rendered or turned into a quote.
create table if not exists public.configuration_versions (
  id                uuid primary key default gen_random_uuid(),
  configuration_id  uuid not null references public.configurations(id) on delete cascade,
  version           integer not null,
  payload           jsonb not null,
  monthly_total     numeric(12,2) not null default 0,
  onetime_total     numeric(12,2) not null default 0,
  note              text,
  created_at        timestamptz not null default now(),
  created_by        uuid references public.profiles(id) on delete set null,
  constraint configuration_versions_version_check check (version >= 1),
  constraint configuration_versions_monthly_check check (monthly_total >= 0),
  constraint configuration_versions_onetime_check check (onetime_total >= 0),
  constraint configuration_versions_unique unique (configuration_id, version)
);
-- ROLLBACK: drop table public.configuration_versions;

-- updated_at trigger (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='configurations_touch_updated_at') then
    create trigger configurations_touch_updated_at before update on public.configurations for each row execute function public.touch_updated_at();
  end if;
end $$;

create unique index if not exists configurations_number_uidx    on public.configurations (config_number);
create index        if not exists configurations_lead_id_idx    on public.configurations (lead_id);
create index        if not exists configurations_company_id_idx on public.configurations (company_id);
create index        if not exists configurations_status_idx     on public.configurations (status) where archived_at is null;
create index        if not exists configurations_created_at_idx on public.configurations (created_at desc);
create index        if not exists config_versions_config_idx    on public.configuration_versions (configuration_id, version desc);
-- ROLLBACK: indexes drop with the tables.

-- RLS: permission-gated reads on BOTH tables. No write policies — service-role
-- (server action) writes only, exactly like quotes.
alter table public.configurations         enable row level security;
alter table public.configuration_versions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='configurations' and policyname='configurations_select') then
    execute $p$create policy configurations_select on public.configurations for select to authenticated
      using (has_permission('configurations.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='configuration_versions' and policyname='configuration_versions_select') then
    execute $p$create policy configuration_versions_select on public.configuration_versions for select to authenticated
      using (has_permission('configurations.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policies drop with the tables.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('configurations.read',    'configurations', 'View configurations'),
  ('configurations.create',  'configurations', 'Create configurations'),
  ('configurations.update',  'configurations', 'Update configurations'),
  ('configurations.archive', 'configurations', 'Archive configurations')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('configurations.read','configurations.create','configurations.update','configurations.archive');

-- role grants: admin all; sales read/create/update (no archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('configurations.read','configurations.create','configurations.update','configurations.archive'))
    or (r.key = 'sales' and p.key in ('configurations.read','configurations.create','configurations.update'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('configurations.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('configurations.read','configurations.create','configurations.update','configurations.archive');
