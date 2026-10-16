-- 0027_invoice_payments.sql
-- P10 Payments / Stripe Bridge Core (Ring D). GREENFIELD: creates public.invoice_payments — internal
-- payment records linked to a P9 invoice. ADDITIVE. The legacy Stripe-webhook `payments` table and
-- `payment_links`/`stripe_events`/`orders`/`subscriptions`/`customers`/checkout/Stripe code are NOT
-- modified. Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Decisions P10-D1..D20.
-- Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0027_invoice_payments).
-- Note: `legacy_payment_id` and `payment_link_id` are nullable SOFT references (no FK) so the new
-- table never couples to the legacy webhook tables' lifecycle (P10-D10).

create table if not exists public.invoice_payments (
  id                           uuid primary key default gen_random_uuid(),
  created_at                   timestamptz not null default now(),
  updated_at                   timestamptz not null default now(),
  invoice_id                   uuid not null references public.invoices(id) on delete restrict,
  company_id                   uuid not null references public.companies(id) on delete restrict,
  amount                       numeric(12,2) not null,
  currency                     text not null default 'CHF',
  status                       text not null default 'pending',
  method                       text not null default 'manual',
  provider                     text not null default 'manual',
  provider_payment_id          text,
  provider_checkout_session_id text,
  provider_payment_intent_id   text,
  legacy_payment_id            uuid,
  payment_link_id              uuid,
  paid_at                      timestamptz,
  failed_at                    timestamptz,
  refunded_at                  timestamptz,
  notes                        text,
  internal_notes               text,
  archived_at                  timestamptz,
  archived_by                  uuid references public.profiles(id) on delete set null,
  created_by                   uuid references public.profiles(id) on delete set null,
  updated_by                   uuid references public.profiles(id) on delete set null,
  constraint invoice_payments_status_check   check (status in ('pending','succeeded','failed','cancelled','refunded','archived')),
  constraint invoice_payments_currency_check check (currency = 'CHF'),
  constraint invoice_payments_amount_check   check (amount > 0),
  constraint invoice_payments_method_check   check (method in ('manual','bank_transfer','cash','card','stripe','other')),
  constraint invoice_payments_provider_check check (provider in ('manual','stripe','bank','other'))
);
-- ROLLBACK: drop table public.invoice_payments;

-- updated_at trigger (reuse the existing touch_updated_at function)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='invoice_payments_touch_updated_at') then
    create trigger invoice_payments_touch_updated_at before update on public.invoice_payments for each row execute function public.touch_updated_at();
  end if;
end $$;

create index if not exists invoice_payments_invoice_id_idx  on public.invoice_payments (invoice_id);
create index if not exists invoice_payments_company_id_idx  on public.invoice_payments (company_id);
create index if not exists invoice_payments_status_idx      on public.invoice_payments (status) where archived_at is null;
create index if not exists invoice_payments_created_at_idx  on public.invoice_payments (created_at desc);
create index if not exists invoice_payments_provider_pi_idx on public.invoice_payments (provider_payment_intent_id) where provider_payment_intent_id is not null;
create index if not exists invoice_payments_provider_cs_idx on public.invoice_payments (provider_checkout_session_id) where provider_checkout_session_id is not null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only.
alter table public.invoice_payments enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='invoice_payments' and policyname='invoice_payments_select') then
    execute $p$create policy invoice_payments_select on public.invoice_payments for select to authenticated
      using (has_permission('payments.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('payments.read',           'payments', 'View payments'),
  ('payments.create',         'payments', 'Create payments'),
  ('payments.update',         'payments', 'Update payments'),
  ('payments.archive',        'payments', 'Archive payments'),
  ('payments.mark_succeeded', 'payments', 'Mark payments succeeded'),
  ('payments.refund',         'payments', 'Refund payments'),
  ('payments.cancel',         'payments', 'Cancel payments')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('payments.read','payments.create','payments.update','payments.archive','payments.mark_succeeded','payments.refund','payments.cancel');

-- role grants: admin all; sales read/create/update (no confirm/refund/cancel/archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('payments.read','payments.create','payments.update','payments.archive','payments.mark_succeeded','payments.refund','payments.cancel'))
    or (r.key = 'sales' and p.key in ('payments.read','payments.create','payments.update'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('payments.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('payments.read','payments.create','payments.update','payments.archive','payments.mark_succeeded','payments.refund','payments.cancel');
