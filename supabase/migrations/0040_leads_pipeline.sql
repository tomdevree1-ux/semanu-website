-- ============================================================
-- amai.ch · 0040 · leads sales pipeline + channel
-- Widen the lead status from the old triage set (new/read/archived/spam)
-- to a real sales pipeline, and add a channel column describing how the
-- lead came in / is being worked. Applied to production 2026-08-05.
-- ============================================================

-- 1. Status: reset every existing lead to 'new' (owner decision) then swap the check.
alter table public.leads drop constraint if exists leads_status_check;
update public.leads set status = 'new';
alter table public.leads
  add constraint leads_status_check
  check (status in ('new', 'assigned', 'contacting', 'proposal', 'won', 'lost', 'on_hold'));

-- 2. Channel: infer from the source form for existing rows, default for new inserts.
--    The start modal is the "Website SEO Analyse" CTA -> website_seo_analysis.
alter table public.leads add column if not exists channel text;
update public.leads
  set channel = case when form_type = 'start' then 'website_seo_analysis' else 'contact_form' end
  where channel is null;
alter table public.leads alter column channel set default 'contact_form';
alter table public.leads drop constraint if exists leads_channel_check;
alter table public.leads
  add constraint leads_channel_check
  check (channel in (
    'call_inbound', 'call_outbound', 'email_inbound', 'email_outbound',
    'contact_form', 'website_seo_analysis', 'social', 'referral', 'partner', 'event', 'import'
  ));
create index if not exists leads_channel_idx on public.leads (channel);
