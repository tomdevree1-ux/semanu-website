-- ============================================================
-- amai.ch · 0042 · versioned internal notes per lead
-- Multiple notes per lead, each with an author + timestamp and a full edit
-- history (one lead_note_versions row per edit). Applied to production 2026-08-05.
-- ============================================================
create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  body text not null,
  current_version int not null default 1,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_by uuid,
  updated_at timestamptz not null default now()
);
create index if not exists lead_notes_lead_idx on public.lead_notes (lead_id, created_at desc);

create table if not exists public.lead_note_versions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.lead_notes(id) on delete cascade,
  version int not null,
  body text not null,
  created_by uuid,
  created_at timestamptz not null default now(),
  unique (note_id, version)
);
create index if not exists lead_note_versions_note_idx on public.lead_note_versions (note_id, version desc);

alter table public.lead_notes enable row level security;
alter table public.lead_note_versions enable row level security;

-- Reads for anyone with leads.read; writes go through the service role only.
create policy lead_notes_read on public.lead_notes for select using (has_permission('leads.read'));
create policy lead_note_versions_read on public.lead_note_versions for select using (has_permission('leads.read'));
