-- ============================================================
-- amai.ch · 0045 · add the 'to_contact' pipeline stage
-- A cold-prospect pool that sits BEFORE New. Leads in this stage are NOT mirrored
-- into the CRM (not in CRM_LINK_STATUSES), so they never reach the Companies page.
-- Applied to production 2026-08-06.
-- ============================================================
alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads
  add constraint leads_status_check
  check (status in ('to_contact', 'new', 'assigned', 'contacting', 'proposal', 'won', 'lost', 'on_hold'));
