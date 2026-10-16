-- 0026_invoices.sql
-- P9 Invoices Core (Ring D). GREENFIELD: creates public.invoices + public.invoice_items — the
-- internal invoice document. ADDITIVE. No changes to payments/payment_links/orders/subscriptions/
-- customers/checkout/Stripe/promo/plans/catalog/quotes or any other table. ROLLBACK notes inline.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Decisions P9-D1..D10/Q1..Q4.
-- Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0026_invoices).

create sequence if not exists public.invoice_number_seq;
-- ROLLBACK: drop sequence public.invoice_number_seq;

create table if not exists public.invoices (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  invoice_number  text not null default ('INV-' || lpad(nextval('public.invoice_number_seq')::text, 5, '0')),
  title           text not null,
  company_id      uuid not null references public.companies(id) on delete restrict,
  contact_id      uuid references public.company_contacts(id) on delete set null,
  project_id      uuid references public.projects(id) on delete set null,
  quote_id        uuid references public.quotes(id) on delete set null,
  status          text not null default 'draft',
  currency        text not null default 'CHF',
  subtotal        numeric(12,2) not null default 0,
  discount_amount numeric(12,2) not null default 0,
  tax_amount      numeric(12,2) not null default 0,
  total_amount    numeric(12,2) not null default 0,
  amount_paid     numeric(12,2) not null default 0,
  balance_due     numeric(12,2) not null default 0,
  issue_date      date,
  due_date        date,
  paid_at         timestamptz,
  notes           text,
  internal_notes  text,
  archived_at     timestamptz,
  archived_by     uuid references public.profiles(id) on delete set null,
  created_by      uuid references public.profiles(id) on delete set null,
  updated_by      uuid references public.profiles(id) on delete set null,
  constraint invoices_status_check       check (status in ('draft','issued','paid','overdue','void','archived')),
  constraint invoices_currency_check     check (currency = 'CHF'),
  constraint invoices_subtotal_check     check (subtotal >= 0),
  constraint invoices_discount_check     check (discount_amount >= 0),
  constraint invoices_tax_check          check (tax_amount >= 0),
  constraint invoices_total_check        check (total_amount >= 0),
  constraint invoices_amount_paid_check  check (amount_paid >= 0),
  constraint invoices_balance_due_check  check (balance_due >= 0)
);
-- ROLLBACK: drop table public.invoices;

create table if not exists public.invoice_items (
  id               uuid primary key default gen_random_uuid(),
  invoice_id       uuid not null references public.invoices(id) on delete cascade,
  quote_item_id    uuid references public.quote_items(id) on delete set null,
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
  constraint invoice_items_quantity_check         check (quantity > 0),
  constraint invoice_items_unit_price_check       check (unit_price >= 0),
  constraint invoice_items_line_subtotal_check    check (line_subtotal >= 0),
  constraint invoice_items_line_total_check       check (line_total >= 0),
  constraint invoice_items_billing_interval_check check (billing_interval is null or billing_interval in ('monthly','yearly','one_time'))
);
-- ROLLBACK: drop table public.invoice_items;

-- updated_at triggers (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='invoices_touch_updated_at') then
    create trigger invoices_touch_updated_at before update on public.invoices for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='invoice_items_touch_updated_at') then
    create trigger invoice_items_touch_updated_at before update on public.invoice_items for each row execute function public.touch_updated_at();
  end if;
end $$;

create unique index if not exists invoices_invoice_number_uidx       on public.invoices (invoice_number);
create index        if not exists invoices_company_id_idx            on public.invoices (company_id);
create index        if not exists invoices_contact_id_idx            on public.invoices (contact_id);
create index        if not exists invoices_project_id_idx            on public.invoices (project_id);
create index        if not exists invoices_quote_id_idx              on public.invoices (quote_id);
create index        if not exists invoices_status_idx                on public.invoices (status) where archived_at is null;
create index        if not exists invoices_created_at_idx            on public.invoices (created_at desc);
create index        if not exists invoices_due_date_idx              on public.invoices (due_date) where status in ('issued','overdue');
create index        if not exists invoice_items_invoice_position_idx on public.invoice_items (invoice_id, position);
create index        if not exists invoice_items_catalog_item_idx     on public.invoice_items (catalog_item_id);
create index        if not exists invoice_items_quote_item_idx       on public.invoice_items (quote_item_id);
-- ROLLBACK: indexes drop with the tables.

-- RLS: permission-gated reads on BOTH tables (P9-D RLS). No write policies — service-role writes only.
alter table public.invoices      enable row level security;
alter table public.invoice_items enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invoices' and policyname='invoices_select') then
    execute $p$create policy invoices_select on public.invoices for select to authenticated
      using (has_permission('invoices.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invoice_items' and policyname='invoice_items_select') then
    execute $p$create policy invoice_items_select on public.invoice_items for select to authenticated
      using (has_permission('invoices.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policies drop with the tables.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('invoices.read',      'invoices', 'View invoices'),
  ('invoices.create',    'invoices', 'Create invoices'),
  ('invoices.update',    'invoices', 'Update invoices'),
  ('invoices.archive',   'invoices', 'Archive invoices'),
  ('invoices.issue',     'invoices', 'Issue invoices'),
  ('invoices.mark_paid', 'invoices', 'Mark invoices as paid'),
  ('invoices.void',      'invoices', 'Void invoices')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('invoices.read','invoices.create','invoices.update','invoices.archive','invoices.issue','invoices.mark_paid','invoices.void');

-- role grants: admin all; sales read/create/update/issue (no mark_paid/void/archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('invoices.read','invoices.create','invoices.update','invoices.archive','invoices.issue','invoices.mark_paid','invoices.void'))
    or (r.key = 'sales' and p.key in ('invoices.read','invoices.create','invoices.update','invoices.issue'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('invoices.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('invoices.read','invoices.create','invoices.update','invoices.archive','invoices.issue','invoices.mark_paid','invoices.void');
