-- 0028_invoice_payment_links.sql
-- P11 Stripe Payment Links from Invoices (Ring D). GREENFIELD: creates public.invoice_payment_links —
-- a Stripe Checkout Session reference generated for an invoice's balance_due. ADDITIVE. The legacy
-- payment_links / payments / stripe_events / orders / subscriptions / customers / checkout / Stripe
-- code are NOT modified. Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema.
-- Decisions P11-D1..D18. Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0028_invoice_payment_links).

create table if not exists public.invoice_payment_links (
  id                           uuid primary key default gen_random_uuid(),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  invoice_id                   uuid not null references public.invoices(id) on delete restrict,
  company_id                   uuid not null references public.companies(id) on delete restrict,
  invoice_payment_id           uuid references public.invoice_payments(id) on delete set null,
  amount                       numeric(12,2) not null,
  currency                     text not null default 'CHF',
  status                       text not null default 'draft',
  provider                     text not null default 'stripe',
  provider_payment_link_id     text,
  provider_checkout_session_id text,
  provider_payment_intent_id   text,
  url                          text,
  expires_at                   timestamptz,
  paid_at                      timestamptz,
  cancelled_at                 timestamptz,
  failed_at                    timestamptz,
  archived_at                  timestamptz,
  archived_by                  uuid references public.profiles(id) on delete set null,
  created_by                   uuid references public.profiles(id) on delete set null,
  updated_by                   uuid references public.profiles(id) on delete set null,
  notes                        text,
  internal_notes               text,
  constraint invoice_payment_links_status_check   check (status in ('draft','active','paid','expired','cancelled','failed','archived')),
  constraint invoice_payment_links_currency_check check (currency = 'CHF'),
  constraint invoice_payment_links_amount_check   check (amount > 0),
  constraint invoice_payment_links_provider_check check (provider = 'stripe')
);
-- ROLLBACK: drop table public.invoice_payment_links;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='invoice_payment_links_touch_updated_at') then
    create trigger invoice_payment_links_touch_updated_at before update on public.invoice_payment_links for each row execute function public.touch_updated_at();
  end if;
end $$;

create index        if not exists invoice_payment_links_invoice_id_idx  on public.invoice_payment_links (invoice_id);
create index        if not exists invoice_payment_links_company_id_idx  on public.invoice_payment_links (company_id);
create index        if not exists invoice_payment_links_payment_id_idx  on public.invoice_payment_links (invoice_payment_id);
create index        if not exists invoice_payment_links_status_idx      on public.invoice_payment_links (status) where archived_at is null;
create index        if not exists invoice_payment_links_created_at_idx  on public.invoice_payment_links (created_at desc);
create unique index if not exists invoice_payment_links_session_uidx    on public.invoice_payment_links (provider_checkout_session_id) where provider_checkout_session_id is not null;
create index        if not exists invoice_payment_links_intent_idx      on public.invoice_payment_links (provider_payment_intent_id) where provider_payment_intent_id is not null;
-- one ACTIVE, non-archived link per invoice (P11-D8)
create unique index if not exists invoice_payment_links_one_active_uidx on public.invoice_payment_links (invoice_id) where status = 'active' and archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only.
alter table public.invoice_payment_links enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invoice_payment_links' and policyname='invoice_payment_links_select') then
    execute $p$create policy invoice_payment_links_select on public.invoice_payment_links for select to authenticated
      using (has_permission('payment_links.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('payment_links.read',    'payment_links', 'View payment links'),
  ('payment_links.create',  'payment_links', 'Generate payment links'),
  ('payment_links.cancel',  'payment_links', 'Cancel payment links'),
  ('payment_links.archive', 'payment_links', 'Archive payment links')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('payment_links.read','payment_links.create','payment_links.cancel','payment_links.archive');

-- role grants: admin all; sales read/create/cancel (no archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('payment_links.read','payment_links.create','payment_links.cancel','payment_links.archive'))
    or (r.key = 'sales' and p.key in ('payment_links.read','payment_links.create','payment_links.cancel'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('payment_links.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('payment_links.read','payment_links.create','payment_links.cancel','payment_links.archive');
