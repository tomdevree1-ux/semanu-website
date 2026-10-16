-- ============================================================
-- amai.ch · 0002 · billing (customers, orders, subscriptions)
-- Backs the Stripe Checkout flow. Orders are created (status
-- 'pending') by /api/checkout, then advanced by the Stripe
-- webhook (/api/stripe/webhook) as payment + subscription events
-- arrive.
--
-- RLS posture: everything is written via the service-role key
-- (bypasses RLS). `customers` and `subscriptions` additionally
-- carry owner SELECT policies so the Phase-4 portal can show a
-- logged-in customer their own data. `orders` stays fully locked
-- (service-role only) — it holds raw lead/PII and is read by an
-- admin area behind an explicit policy later.
-- ============================================================

-- ── customers ───────────────────────────────────────────────
-- One row per Stripe customer. `user_id` links to a Supabase Auth
-- user once the Phase-4 portal exists; null until then.
create table if not exists public.customers (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),

  stripe_customer_id text unique not null,
  email              text not null,
  name               text,

  user_id            uuid references auth.users (id) on delete set null
);

comment on table public.customers is
  'Stripe customers for amai.ch. Linked to an auth user (user_id) once the portal exists.';

create index if not exists customers_email_idx   on public.customers (email);
create index if not exists customers_user_id_idx on public.customers (user_id);

-- ── orders ──────────────────────────────────────────────────
-- One row per checkout attempt. Created 'pending' before redirect
-- to Stripe; the webhook flips it to 'paid' / 'failed' and fills
-- in the Stripe ids.
create table if not exists public.orders (
  id                     uuid primary key default gen_random_uuid(),
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  status                 text not null default 'pending'
                           check (status in ('pending', 'paid', 'failed', 'canceled')),

  plan                   text not null check (plan in ('starter', 'business')),
  addon                  boolean not null default false,

  -- customer details captured by the subscribe form
  firstname              text not null,
  lastname               text not null,
  email                  text not null,
  company                text,
  phone                  text,
  consent                boolean not null default false,
  locale                 text not null default 'de' check (locale in ('de', 'fr', 'en')),

  -- amounts mirrored from Stripe for a readable record (CHF)
  amount_plan_chf        integer not null,
  amount_addon_chf       integer not null default 0,

  -- Stripe linkage
  stripe_session_id      text unique,
  stripe_customer_id     text,
  stripe_subscription_id text,

  customer_id            uuid references public.customers (id) on delete set null
);

comment on table public.orders is
  'Checkout attempts for amai.ch subscriptions. Written by the service role; RLS-locked (admin reads via an explicit policy later).';

create index if not exists orders_created_at_idx  on public.orders (created_at desc);
create index if not exists orders_status_idx      on public.orders (status);
create index if not exists orders_email_idx       on public.orders (email);
create index if not exists orders_customer_id_idx on public.orders (customer_id);

-- ── subscriptions ───────────────────────────────────────────
-- Mirror of the Stripe subscription state, keyed by the Stripe
-- subscription id. Kept current by the webhook.
create table if not exists public.subscriptions (
  id                     text primary key,            -- Stripe subscription id (sub_…)
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),

  customer_id            uuid not null references public.customers (id) on delete cascade,

  status                 text not null,               -- Stripe status (active, past_due, canceled, …)
  plan                   text check (plan in ('starter', 'business')),
  current_period_end     timestamptz,
  cancel_at_period_end   boolean not null default false
);

comment on table public.subscriptions is
  'Mirror of Stripe subscription state for amai.ch, kept current by the webhook.';

create index if not exists subscriptions_customer_id_idx on public.subscriptions (customer_id);
create index if not exists subscriptions_status_idx      on public.subscriptions (status);

-- ── keep updated_at fresh ───────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists customers_touch     on public.customers;
drop trigger if exists orders_touch        on public.orders;
drop trigger if exists subscriptions_touch on public.subscriptions;

create trigger customers_touch     before update on public.customers
  for each row execute function public.touch_updated_at();
create trigger orders_touch        before update on public.orders
  for each row execute function public.touch_updated_at();
create trigger subscriptions_touch before update on public.subscriptions
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.customers     enable row level security;
alter table public.orders        enable row level security;
alter table public.subscriptions enable row level security;

-- orders: NO policies → fully locked. Only the service role (which
-- bypasses RLS) can read/write. Admin SELECT policy added later.

-- customers: a logged-in user may read only their own row (Phase 4).
drop policy if exists customers_select_own on public.customers;
create policy customers_select_own
  on public.customers
  for select
  to authenticated
  using (user_id = (select auth.uid()));

-- subscriptions: a logged-in user may read subscriptions belonging
-- to their own customer row.
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own
  on public.subscriptions
  for select
  to authenticated
  using (
    customer_id in (
      select c.id from public.customers c
      where c.user_id = (select auth.uid())
    )
  );
