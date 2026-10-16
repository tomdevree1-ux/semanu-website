-- 0024_catalog_items.sql
-- P7 Products & Services Catalog (Ring D). GREENFIELD: creates public.catalog_items — the internal
-- single source of truth for what amai sells. ADDITIVE. No changes to orders/subscriptions/customers/
-- payment_links/payments/checkout/Stripe/promo or any other table. ROLLBACK notes inline.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Decisions P7-D1..D10/Q1/Q2.
-- Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0024_catalog_items).

create table if not exists public.catalog_items (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  name             text not null,
  code             text,
  description      text,
  item_type        text not null,
  status           text not null default 'draft',
  category         text,
  base_price       numeric(12,2),
  currency         text not null default 'CHF',
  price_is_from    boolean not null default false,
  billing_interval text not null default 'one_time',
  setup_fee        numeric(12,2),
  is_public        boolean not null default false,
  archived_at      timestamptz,
  archived_by      uuid references public.profiles(id) on delete set null,
  created_by       uuid references public.profiles(id) on delete set null,
  updated_by       uuid references public.profiles(id) on delete set null,
  constraint catalog_items_item_type_check        check (item_type in ('subscription','service','addon','product')),
  constraint catalog_items_status_check           check (status in ('draft','active','inactive','archived')),
  constraint catalog_items_billing_interval_check check (billing_interval in ('monthly','yearly','one_time')),
  constraint catalog_items_currency_check         check (currency = 'CHF'),
  constraint catalog_items_base_price_check       check (base_price is null or base_price >= 0),
  constraint catalog_items_setup_fee_check        check (setup_fee is null or setup_fee >= 0)
);
-- ROLLBACK: drop table public.catalog_items;

-- updated_at trigger (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='catalog_items_touch_updated_at') then
    create trigger catalog_items_touch_updated_at before update on public.catalog_items
      for each row execute function public.touch_updated_at();
  end if;
end $$;

create unique index if not exists catalog_items_code_lower_uidx on public.catalog_items (lower(code)) where code is not null;
create index if not exists catalog_items_status_idx           on public.catalog_items (status) where archived_at is null;
create index if not exists catalog_items_item_type_idx        on public.catalog_items (item_type);
create index if not exists catalog_items_category_idx         on public.catalog_items (category);
create index if not exists catalog_items_name_idx             on public.catalog_items (name);
create index if not exists catalog_items_billing_interval_idx on public.catalog_items (billing_interval);
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads (P7-D8). No write policies — writes are service-role only via actions.
alter table public.catalog_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='catalog_items' and policyname='catalog_items_select') then
    execute $p$create policy catalog_items_select on public.catalog_items for select to authenticated
      using (has_permission('catalog.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: drops with the table (or: drop policy catalog_items_select on public.catalog_items;).

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('catalog.read',    'catalog', 'View catalog'),
  ('catalog.create',  'catalog', 'Create catalog items'),
  ('catalog.update',  'catalog', 'Update catalog items'),
  ('catalog.archive', 'catalog', 'Archive catalog items')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('catalog.read','catalog.create','catalog.update','catalog.archive');

-- role grants (P7-Q1: catalog writes are ADMIN-ONLY). admin: all; everyone else: read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('catalog.read','catalog.create','catalog.update','catalog.archive'))
    or (r.key in ('sales','analyst','reviewer','read_only') and p.key in ('catalog.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('catalog.read','catalog.create','catalog.update','catalog.archive');
