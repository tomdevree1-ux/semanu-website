-- ============================================================
-- amai.ch · 0044 · lost reason + CRM link on a lead
-- lost_reason: required when a lead is marked Lost.
-- company_id / contact_id: the CRM records a lead links to once it reaches
-- the Contacting stage (created/deduped automatically). Applied 2026-08-05.
-- ============================================================
alter table public.leads add column if not exists lost_reason text;
alter table public.leads add column if not exists company_id uuid references public.companies(id) on delete set null;
alter table public.leads add column if not exists contact_id uuid references public.company_contacts(id) on delete set null;
create index if not exists leads_company_idx on public.leads (company_id);
