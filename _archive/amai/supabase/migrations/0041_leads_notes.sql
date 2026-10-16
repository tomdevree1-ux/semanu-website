-- ============================================================
-- amai.ch · 0041 · internal notes on a lead
-- Free-text internal note shown and edited on the lead detail view.
-- Applied to production 2026-08-05.
-- ============================================================
alter table public.leads add column if not exists notes text;
