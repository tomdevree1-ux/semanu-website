-- ============================================================
-- amai.ch · 0043 · lead submissions timeline (deduplication)
-- One lead = one person/organisation. Each website form submission becomes an
-- interaction row here instead of a duplicate lead. Applied to production 2026-08-05.
-- ============================================================
create table if not exists public.lead_submissions (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  form_type text,
  channel text,
  message text,
  lang text,
  page_path text,
  source text,
  created_at timestamptz not null default now()
);
create index if not exists lead_submissions_lead_idx on public.lead_submissions (lead_id, created_at desc);
alter table public.lead_submissions enable row level security;
create policy lead_submissions_read on public.lead_submissions for select using (has_permission('leads.read'));

-- Backfill: every existing lead becomes its own first submission.
insert into public.lead_submissions (lead_id, form_type, channel, message, lang, created_at)
select id, form_type, channel, message, lang, created_at from public.leads;
