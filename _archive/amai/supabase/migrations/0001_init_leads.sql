-- ============================================================
-- amai.ch · 0001 · leads table
-- Stores submissions from the start modal and the contact form.
-- ============================================================

create table if not exists public.leads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),

  form_type     text not null check (form_type in ('start', 'contact')),

  firstname     text not null,
  lastname      text not null,
  email         text not null,
  company       text,
  phone         text,
  message       text,
  lang          text not null default 'de' check (lang in ('de', 'fr', 'en')),
  consent       boolean not null default false,

  -- request metadata (for spam triage / analytics)
  source_locale text,
  user_agent    text,
  ip_hash       text,

  status        text not null default 'new'
                  check (status in ('new', 'read', 'archived', 'spam'))
);

comment on table public.leads is
  'Contact + start-modal form submissions for amai.ch. Written via the service-role key from /api/leads.';

create index if not exists leads_created_at_idx on public.leads (created_at desc);
create index if not exists leads_status_idx     on public.leads (status);
create index if not exists leads_email_idx      on public.leads (email);

-- ------------------------------------------------------------
-- Row Level Security
-- Lock the table down completely. No policies = no access for the
-- anon or authenticated roles. The API route writes with the
-- service-role key, which bypasses RLS. Admins read via the
-- dashboard or a future authenticated admin area (Phase 4) with a
-- dedicated, explicit SELECT policy.
-- ------------------------------------------------------------
alter table public.leads enable row level security;
