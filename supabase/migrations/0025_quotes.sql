-- 0025_quotes.sql
-- P8 Quotes Core (Ring D). GREENFIELD: creates public.quotes + public.quote_items — the internal
-- quote/proposal document. ADDITIVE. No changes to orders/subscriptions/customers/payments/
-- payment_links/checkout/Stripe/promo/catalog or any other table. ROLLBACK notes inline.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Decisions P8-D1..D10/Q2/Q3.
-- Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0025_quotes).

create sequence if not exists public.quote_number_seq;
-- ROLLBACK: drop sequence public.quote_number_seq;

create table if not exists public.quotes (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  quote_number    text not null default ('Q-' || lpad(nextval('public.quote_number_seq')::text, 5, '0')),
  title           text not null,
  company_id      uuid not null references public.companies(id) on delete restrict,
  contact_id      uuid references public.company_contacts(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  status          text not null default 'draft',
  currency        text not null default 'CHF',
  subtotal        numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total_amount    numeric(12,2) not null default 0,
  valid_until     date,
  notes           text,
  internal_notes  text,
  archived_at     timestamptz,
  archived_by     uuid references public.profiles(id) on delete set null,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  constraint quotes_status_check   check (status in ('draft','sent','accepted','declined','expired','archived')),
  constraint quotes_currency_check check (currency = 'CHF'),
  constraint quotes_subtotal_check check (subtotal >= 0),
  constraint quotes_discount_check check (discount_amount >= 0),
  constraint quotes_tax_check      check (tax_amount >= 0),
  constraint quotes_total_check    check (total_amount >= 0)
);
-- ROLLBACK: drop table public.quotes;

create table if not exists public.quote_items (
  id               uuid primary key default gen_random_uuid(),
  quote_id         uuid not null references public.quotes(id) on delete cascade,
  catalog_item_id  uuid references public.catalog_items(id) on delete set null,
  position         integer not null default 1,
  name             text not null,
  description      text,
  quantity         numeric(12,2) not null default 1,
  unit_price       numeric(12,2) not null default 0,
  billing_interval text,
  line_subtotal    numeric(12,2) not null default 0,
  line_total       numeric(12,2) not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint quote_items_quantity_check         check (quantity > 0),
  constraint quote_items_unit_price_check       check (unit_price >= 0),
  constraint quote_items_line_subtotal_check    check (line_subtotal >= 0),
  constraint quote_items_line_total_check       check (line_total >= 0),
  constraint quote_items_billing_interval_check check (billing_interval is null or billing_interval in ('monthly','yearly','one_time'))
);
-- ROLLBACK: drop table public.quote_items;

-- updated_at triggers (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='quotes_touch_updated_at') then
    create trigger quotes_touch_updated_at before update on public.quotes for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='quote_items_touch_updated_at') then
    create trigger quote_items_touch_updated_at before update on public.quote_items for each row execute function public.touch_updated_at();
  end if;
end $$;

create unique index if not exists quotes_quote_number_uidx       on public.quotes (quote_number);
create index        if not exists quotes_company_id_idx          on public.quotes (company_id);
create index        if not exists quotes_contact_id_idx          on public.quotes (contact_id);
create index        if not exists quotes_project_id_idx          on public.quotes (project_id);
create index        if not exists quotes_status_idx              on public.quotes (status) where archived_at is null;
create index        if not exists quotes_created_at_idx          on public.quotes (created_at desc);
create index        if not exists quote_items_quote_position_idx on public.quote_items (quote_id, position);
create index        if not exists quote_items_catalog_item_idx   on public.quote_items (catalog_item_id);
-- ROLLBACK: indexes drop with the tables.

-- RLS: permission-gated reads on BOTH tables (P8-D9). No write policies — service-role writes only.
alter table public.quotes      enable row level security;
alter table public.quote_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quotes' and policyname='quotes_select') then
    execute $p$create policy quotes_select on public.quotes for select to authenticated
      using (has_permission('quotes.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='quote_items' and policyname='quote_items_select') then
    execute $p$create policy quote_items_select on public.quote_items for select to authenticated
      using (has_permission('quotes.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policies drop with the tables.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('quotes.read',    'quotes', 'View quotes'),
  ('quotes.create',  'quotes', 'Create quotes'),
  ('quotes.update',  'quotes', 'Update quotes'),
  ('quotes.archive', 'quotes', 'Archive quotes'),
  ('quotes.send',    'quotes', 'Mark quotes as sent'),
  ('quotes.accept',  'quotes', 'Mark quotes accepted or declined')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('quotes.read','quotes.create','quotes.update','quotes.archive','quotes.send','quotes.accept');

-- role grants: admin all; sales read/create/update/send/accept (no archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('quotes.read','quotes.create','quotes.update','quotes.archive','quotes.send','quotes.accept'))
    or (r.key = 'sales' and p.key in ('quotes.read','quotes.create','quotes.update','quotes.send','quotes.accept'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('quotes.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('quotes.read','quotes.create','quotes.update','quotes.archive','quotes.send','quotes.accept');
