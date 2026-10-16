-- ============================================================
-- amai.ch · 0046 · assign a lead to a portal user (owner)
-- Sales + admin users are assignable. Applied to production 2026-08-06.
-- ============================================================
alter table public.leads add column if not exists assigned_to uuid references public.profiles(id) on delete set null;
create index if not exists leads_assigned_to_idx on public.leads (assigned_to);
