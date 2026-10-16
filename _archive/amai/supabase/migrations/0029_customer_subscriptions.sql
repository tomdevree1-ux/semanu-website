-- 0029_customer_subscriptions.sql
-- P12A Stripe Subscription Registry / Read & Link (Ring D). GREENFIELD: creates
-- public.customer_subscriptions — a PORTAL-OWNED registry that links an existing Stripe
-- subscription to a CRM company/contact/customer and stores a synced SNAPSHOT of its Stripe
-- state. Stripe remains AUTHORITATIVE for subscription state; this table is never the billing
-- authority. ADDITIVE. The legacy subscriptions / customers / orders / payments / payment_links /
-- stripe_events / invoice_payments / invoice_payment_links / checkout / Stripe webhook code are
-- NOT modified. P12A is read/link/sync only — NO Stripe mutations, NO webhook reconciliation.
-- Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI + the live schema. Never edit an applied
-- migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0029_customer_subscriptions).

create table if not exists public.customer_subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  -- CRM links (portal-owned; CRM is the source of truth for the relationship). All nullable:
  -- a Stripe subscription may be linked before a company/contact match is known.
  company_id             uuid references public.companies(id) on delete set null,
  contact_id             uuid references public.company_contacts(id) on delete set null,
  customer_id            uuid references public.customers(id) on delete set null,
  -- Stripe identifiers (non-secret references; Stripe is authoritative for state).
  stripe_customer_id     text not null,
  stripe_subscription_id text not null,
  stripe_product_id      text,
  stripe_price_id        text,
  plan_key               text,
  -- Synced Stripe snapshot (refreshed by the manual sync action; never authoritative).
  status                 text not null default 'unknown',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false,
  cancelled_at           timestamptz,
  trial_start            timestamptz,
  trial_end              timestamptz,
  quantity               integer,
  currency               text,
  amount                 numeric(12,2),
  interval               text,
  metadata               jsonb not null default '{}'::jsonb,
  last_synced_at         timestamptz,
  sync_status            text not null default 'pending',
  -- portal soft-archive + provenance
  archived_at            timestamptz,
  archived_by            uuid references public.profiles(id) on delete set null,
  created_by             uuid references public.profiles(id) on delete set null,
  updated_by             uuid references public.profiles(id) on delete set null,
  notes                  text,
  internal_notes         text,
  -- NOTE: no strict CHECK on `status` on purpose — Stripe may add subscription statuses and a
  -- sync must never fail on an unseen value (the legacy `subscriptions` mirror is likewise raw).
  constraint customer_subscriptions_sync_status_check check (sync_status in ('pending','synced','failed','stale')),
  constraint customer_subscriptions_quantity_check    check (quantity is null or quantity > 0),
  constraint customer_subscriptions_amount_check      check (amount is null or amount >= 0),
  constraint customer_subscriptions_interval_check    check (interval is null or interval in ('day','week','month','year'))
);
-- ROLLBACK: drop table public.customer_subscriptions;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='customer_subscriptions_touch_updated_at') then
    create trigger customer_subscriptions_touch_updated_at before update on public.customer_subscriptions for each row execute function public.touch_updated_at();
  end if;
end $$;

-- one registry row per Stripe subscription (duplicate-link guard, P12A)
create unique index if not exists customer_subscriptions_stripe_sub_uidx on public.customer_subscriptions (stripe_subscription_id);
create index        if not exists customer_subscriptions_stripe_cust_idx on public.customer_subscriptions (stripe_customer_id);
create index        if not exists customer_subscriptions_company_idx     on public.customer_subscriptions (company_id);
create index        if not exists customer_subscriptions_contact_idx     on public.customer_subscriptions (contact_id);
create index        if not exists customer_subscriptions_customer_idx    on public.customer_subscriptions (customer_id);
create index        if not exists customer_subscriptions_status_idx      on public.customer_subscriptions (status) where archived_at is null;
create index        if not exists customer_subscriptions_sync_status_idx on public.customer_subscriptions (sync_status);
create index        if not exists customer_subscriptions_period_end_idx  on public.customer_subscriptions (current_period_end);
create index        if not exists customer_subscriptions_created_at_idx  on public.customer_subscriptions (created_at desc);
-- fast company-detail lookup of live, non-archived subscriptions
create index        if not exists customer_subscriptions_company_active_idx on public.customer_subscriptions (company_id) where archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only.
alter table public.customer_subscriptions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='customer_subscriptions' and policyname='customer_subscriptions_select') then
    execute $p$create policy customer_subscriptions_select on public.customer_subscriptions for select to authenticated
      using (has_permission('subscriptions.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL). P12A = read/link/sync/archive only.
-- NOTE: subscriptions.update / subscriptions.cancel are intentionally NOT seeded — they are P12B-only.
insert into public.permissions (key, module, label) values
  ('subscriptions.read',    'subscriptions', 'View subscriptions'),
  ('subscriptions.link',    'subscriptions', 'Link subscriptions to CRM'),
  ('subscriptions.sync',    'subscriptions', 'Sync subscriptions from Stripe'),
  ('subscriptions.archive', 'subscriptions', 'Archive subscription links')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('subscriptions.read','subscriptions.link','subscriptions.sync','subscriptions.archive');

-- role grants: admin all; sales read/link/sync (no archive); others read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('subscriptions.read','subscriptions.link','subscriptions.sync','subscriptions.archive'))
    or (r.key = 'sales' and p.key in ('subscriptions.read','subscriptions.link','subscriptions.sync'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('subscriptions.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('subscriptions.read','subscriptions.link','subscriptions.sync','subscriptions.archive');
