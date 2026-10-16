-- 0035_resend_engagement.sql
-- P16 Email Engagement Tracking (Resend webhook, WAF-3.1, Ring E). ADDITIVE. Ships dark behind
-- ENABLE_RESEND_WEBHOOK (default off; open/click additionally behind ENABLE_EMAIL_OPEN_CLICK_TRACKING).
-- Creates public.resend_events (a service-role-only dedup sink, mirror of stripe_events) and adds engagement
-- columns to public.website_report_deliveries (delivered/bounced/complained/opened/clicked timestamps + counts,
-- last_event_at, bounce_type, engagement jsonb). The Resend webhook reflects reliable delivery state onto these
-- columns (and email_log.status) by provider_message_id. No status CHECK change ('bounced' already allowed).
-- Does NOT modify website_analysis_reports, funnel_submissions, CRM, the documents table, outbox, leads/
-- checkout/Stripe/P10-12 or old /admin. Authority: AMAI_PORTAL_MASTER_PLAN.md §VI (WAF-3.1). Never edit an
-- applied migration; add a new one.
--
-- Mirror of the live apply (Supabase MCP apply_migration, name 0035_resend_engagement).

-- 1) Dedup sink for Resend (Svix) webhook events. Service-role only (RLS on, no policies), like stripe_events.
create table if not exists public.resend_events (
  id         text primary key,           -- the svix-id (unique per event delivery; retries reuse it)
  type       text not null,
  created_at timestamptz not null default now()
);
alter table public.resend_events enable row level security;
-- No policies: only the service role (webhook) inserts/reads. RLS-on-no-policy denies anon/authenticated.
-- ROLLBACK: drop table public.resend_events;

-- 2) Engagement columns on website_report_deliveries (all additive/nullable/defaulted; no CHECK change).
alter table public.website_report_deliveries
  add column if not exists delivered_at    timestamptz,
  add column if not exists bounced_at      timestamptz,
  add column if not exists complained_at   timestamptz,
  add column if not exists first_opened_at timestamptz,
  add column if not exists opened_at       timestamptz,
  add column if not exists clicked_at      timestamptz,
  add column if not exists open_count      integer not null default 0,
  add column if not exists click_count     integer not null default 0,
  add column if not exists last_event_at   timestamptz,
  add column if not exists bounce_type     text,
  add column if not exists engagement      jsonb not null default '{}'::jsonb;
-- ROLLBACK: alter table public.website_report_deliveries
--   drop column engagement, drop column bounce_type, drop column last_event_at, drop column click_count,
--   drop column open_count, drop column clicked_at, drop column opened_at, drop column first_opened_at,
--   drop column complained_at, drop column bounced_at, drop column delivered_at;

create index if not exists website_report_deliveries_delivered_at_idx  on public.website_report_deliveries (delivered_at);
create index if not exists website_report_deliveries_bounced_at_idx    on public.website_report_deliveries (bounced_at);
create index if not exists website_report_deliveries_opened_at_idx     on public.website_report_deliveries (opened_at);
create index if not exists website_report_deliveries_clicked_at_idx    on public.website_report_deliveries (clicked_at);
-- provider_message_id is the webhook match key → index it for the lookup (existing column; index drops on rollback).
create index if not exists website_report_deliveries_provider_msg_idx  on public.website_report_deliveries (provider_message_id);
-- ROLLBACK: drop index public.website_report_deliveries_provider_msg_idx; (the engagement-column indexes drop with their columns.)
