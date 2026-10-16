-- ============================================================
-- amai.ch · 0003 · portal (auth linkage, documents, requests)
-- Backs the Phase-4 Premium customer portal (magic-link auth).
--
-- Linkage: Supabase Auth creates an auth.users row on first login.
-- Two triggers keep public.customers.user_id in sync with the
-- matching auth user (by email), in both directions, so the owner
-- RLS policies from 0002 (customers_select_own, subscriptions_…)
-- resolve. A one-off backfill links any rows that already exist.
--
-- RLS posture: documents are read-only for the owning customer
-- (admin writes via the service role). requests are insert + read
-- for their own auth user. A private Storage bucket holds the files.
-- ============================================================

-- ── prerequisites (idempotent) ──────────────────────────────
-- 0002's customers table may predate the user_id column: a plain
-- `create table if not exists` does NOT add columns to a table that
-- already exists, so ensure it here. Also (re)create the shared
-- updated_at trigger function in case it is missing.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

alter table public.customers
  add column if not exists user_id uuid references auth.users (id) on delete set null;
create index if not exists customers_user_id_idx on public.customers (user_id);

-- ── auth user  ->  customer (fires when a user logs in) ─────
create or replace function public.link_customer_to_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.customers
     set user_id = new.id
   where user_id is null
     and lower(email) = lower(new.email);
  return new;
end;
$$;

drop trigger if exists on_auth_user_link_customer on auth.users;
create trigger on_auth_user_link_customer
  after insert on auth.users
  for each row execute function public.link_customer_to_user();

-- ── customer  ->  auth user (fires when the webhook upserts a
--    customer for someone who has already logged in) ─────────
create or replace function public.link_user_to_customer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.user_id is null then
    select id into new.user_id
      from auth.users
     where lower(email) = lower(new.email)
     limit 1;
  end if;
  return new;
end;
$$;

drop trigger if exists customers_link_user on public.customers;
create trigger customers_link_user
  before insert or update of email on public.customers
  for each row execute function public.link_user_to_customer();

-- one-off backfill for rows that pre-date these triggers
update public.customers c
   set user_id = u.id
  from auth.users u
 where c.user_id is null
   and lower(c.email) = lower(u.email);

-- The two portal tables below are new in Phase 4 and hold no production
-- data yet. Drop any partial or older-draft versions first so they are
-- recreated with the current schema — this is what repairs a stale
-- `requests`/`documents` table that predates the user_id column (a plain
-- `create table if not exists` would otherwise leave the old shape in place).
drop table if exists public.documents cascade;
drop table if exists public.requests cascade;

-- ── documents ───────────────────────────────────────────────
-- Metadata for files an admin shares with a customer. The file
-- itself lives in the private 'customer-documents' Storage bucket
-- at path '{customer_id}/{filename}'.
create table if not exists public.documents (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),

  customer_id  uuid not null references public.customers (id) on delete cascade,
  name         text not null,
  storage_path text not null,
  size_bytes   bigint,
  mime_type    text
);

comment on table public.documents is
  'Files shared with a customer in the portal. Written by the service role; customer reads own via RLS.';

create index if not exists documents_customer_id_idx on public.documents (customer_id);

-- ── requests (quote / change / question) ────────────────────
create table if not exists public.requests (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),

  user_id     uuid not null references auth.users (id) on delete cascade,
  customer_id uuid references public.customers (id) on delete set null,

  type        text not null default 'question'
                check (type in ('question', 'change', 'quote')),
  subject     text not null,
  message     text not null,
  status      text not null default 'new'
                check (status in ('new', 'in_progress', 'done')),
  locale      text not null default 'de' check (locale in ('de', 'fr', 'en'))
);

comment on table public.requests is
  'Portal requests (question / change / quote) submitted by a logged-in user. Insert + read own via RLS.';

create index if not exists requests_user_id_idx on public.requests (user_id);
create index if not exists requests_status_idx  on public.requests (status);

drop trigger if exists requests_touch on public.requests;
create trigger requests_touch before update on public.requests
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.documents enable row level security;
alter table public.requests  enable row level security;

-- documents: owner reads their own; writes are service-role only.
drop policy if exists documents_select_own on public.documents;
create policy documents_select_own
  on public.documents
  for select
  to authenticated
  using (
    customer_id in (
      select c.id from public.customers c
      where c.user_id = (select auth.uid())
    )
  );

-- requests: a user reads and inserts only their own rows.
drop policy if exists requests_select_own on public.requests;
create policy requests_select_own
  on public.requests
  for select
  to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists requests_insert_own on public.requests;
create policy requests_insert_own
  on public.requests
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

-- ============================================================
-- Storage: private bucket for customer documents
-- Object path convention: '{customer_id}/{filename}'.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('customer-documents', 'customer-documents', false)
on conflict (id) do nothing;

-- a logged-in user may read objects under their own customer folder
drop policy if exists "customer docs read own" on storage.objects;
create policy "customer docs read own"
  on storage.objects
  for select
  to authenticated
  using (
    bucket_id = 'customer-documents'
    and (storage.foldername(name))[1] in (
      select c.id::text from public.customers c
      where c.user_id = (select auth.uid())
    )
  );
