-- 0037_marketing_acquisition.sql
-- Acquisition Dashboard Fase 1 (closed-loop attribution + acquisition economics). ADDITIVE.
-- New: marketing_touchpoints, marketing_spend_daily, marketing_change_log, acquisition_targets,
-- plus attribution columns on the existing public.leads. Reuses (never duplicates) companies,
-- company_contacts, leads, funnel_submissions, customers, customer_subscriptions, orders.
-- Mirrors the 0032 RLS/permission posture: permission-gated SELECT, NO write policies
-- (service-role writes only via permission-checked server actions). Authority:
-- AMAI_PORTAL_MASTER_PLAN.md + PORTAL_ACQUISITION_SPEC.md. Never edit an applied migration; add a new one.

-- ── marketing_touchpoints: first/last/conversion/manual-origin snapshot at conversion time ──
create table if not exists public.marketing_touchpoints (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  occurred_at          timestamptz not null default now(),
  touch_type           text not null,
  company_id           uuid references public.companies(id) on delete set null,
  contact_id           uuid references public.company_contacts(id) on delete set null,
  lead_id              uuid references public.leads(id) on delete set null,
  funnel_submission_id uuid references public.funnel_submissions(id) on delete set null,
  subscription_id      uuid references public.customer_subscriptions(id) on delete set null,
  order_id             uuid references public.orders(id) on delete set null,
  anonymous_id         text,
  session_id           text,
  source               text,
  medium               text,
  campaign             text,
  campaign_id          text,
  ad_group             text,
  ad_group_id          text,
  keyword              text,
  search_term          text,
  match_type           text,
  landing_page_url     text,
  referrer             text,
  gclid                text,
  utm_source           text,
  utm_medium           text,
  utm_campaign         text,
  utm_term             text,
  utm_content          text,
  country              text,
  region               text,
  language             text,
  device               text,
  metadata             jsonb,
  constraint marketing_touchpoints_touch_type_check
    check (touch_type in ('first_touch','last_touch','conversion_touch','manual_origin'))
);
create index if not exists marketing_touchpoints_lead_idx     on public.marketing_touchpoints (lead_id);
create index if not exists marketing_touchpoints_funnel_idx   on public.marketing_touchpoints (funnel_submission_id);
create index if not exists marketing_touchpoints_company_idx  on public.marketing_touchpoints (company_id);
create index if not exists marketing_touchpoints_source_idx   on public.marketing_touchpoints (source);
create index if not exists marketing_touchpoints_campaign_idx on public.marketing_touchpoints (campaign_id);
create index if not exists marketing_touchpoints_occurred_idx on public.marketing_touchpoints (occurred_at desc);

-- ── marketing_spend_daily: manual ad spend (until the Google Ads API arrives in Fase 2) ──
create table if not exists public.marketing_spend_daily (
  id                        uuid primary key default gen_random_uuid(),
  date                      date not null,
  channel                   text not null,
  source                    text,
  medium                    text,
  campaign                  text,
  campaign_id               text,
  currency                  text not null,
  spend_amount              numeric(12,2) not null,
  exchange_rate_to_base     numeric(18,8),
  spend_amount_base         numeric(12,2),
  impressions               integer,
  clicks                    integer,
  notes                     text,
  created_by                uuid references public.profiles(id) on delete set null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint marketing_spend_amount_check check (spend_amount >= 0)
);
create index if not exists marketing_spend_daily_date_idx     on public.marketing_spend_daily (date desc);
create index if not exists marketing_spend_daily_channel_idx  on public.marketing_spend_daily (channel);
create index if not exists marketing_spend_daily_campaign_idx on public.marketing_spend_daily (campaign_id);

-- ── marketing_change_log: anti-doom-loop record of marketing changes ──
create table if not exists public.marketing_change_log (
  id              uuid primary key default gen_random_uuid(),
  changed_at      timestamptz not null default now(),
  changed_by      uuid references public.profiles(id) on delete set null,
  channel         text not null,
  campaign        text,
  campaign_id     text,
  change_type     text not null,
  description     text,
  reason          text,
  expected_impact text,
  cooldown_until  timestamptz,
  next_review_at  timestamptz,
  status          text not null default 'open',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists marketing_change_log_changed_idx  on public.marketing_change_log (changed_at desc);
create index if not exists marketing_change_log_channel_idx  on public.marketing_change_log (channel);

-- ── acquisition_targets: single config row (economics + guardrail thresholds) ──
create table if not exists public.acquisition_targets (
  id                            uuid primary key default gen_random_uuid(),
  base_currency                 text not null default 'CHF',
  default_subscription_price    numeric(10,2) not null default 80,
  expected_retention_months     integer not null default 24,
  target_ltv_cac_ratio          numeric(6,2) not null default 3,
  target_payback_months         integer not null default 3,
  max_healthy_cac               numeric(10,2),
  min_clicks_before_judgement   integer not null default 100,
  min_leads_before_judgement    integer not null default 10,
  min_customers_before_judgement integer not null default 3,
  early_churn_window_days       integer not null default 90,
  campaign_cooldown_days        integer not null default 14,
  min_conversions_to_scale      integer not null default 30,
  scale_step_pct                integer not null default 20,
  stable_window_days            integer not null default 14,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now()
);

-- ── attribution columns on the existing leads table (contact/start forms had none) ──
alter table public.leads add column if not exists utm_source      text;
alter table public.leads add column if not exists utm_medium      text;
alter table public.leads add column if not exists utm_campaign    text;
alter table public.leads add column if not exists utm_term        text;
alter table public.leads add column if not exists utm_content     text;
alter table public.leads add column if not exists gclid           text;
alter table public.leads add column if not exists referrer        text;
alter table public.leads add column if not exists page_path       text;
alter table public.leads add column if not exists creation_source text;
alter table public.leads add column if not exists sales_motion    text;
alter table public.leads add column if not exists source          text;
alter table public.leads add column if not exists medium          text;
alter table public.leads add column if not exists campaign        text;
alter table public.leads add column if not exists campaign_id     text;
alter table public.leads add column if not exists first_touch_id  uuid references public.marketing_touchpoints(id) on delete set null;
alter table public.leads add column if not exists last_touch_id   uuid references public.marketing_touchpoints(id) on delete set null;

-- updated_at touch triggers (reuse the existing helper)
do $$ begin
  if not exists (select 1 from pg_trigger where tgname='marketing_spend_daily_touch_updated_at') then
    create trigger marketing_spend_daily_touch_updated_at before update on public.marketing_spend_daily for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='marketing_change_log_touch_updated_at') then
    create trigger marketing_change_log_touch_updated_at before update on public.marketing_change_log for each row execute function public.touch_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname='acquisition_targets_touch_updated_at') then
    create trigger acquisition_targets_touch_updated_at before update on public.acquisition_targets for each row execute function public.touch_updated_at();
  end if;
end $$;

-- ── RLS: permission-gated SELECT only. No write policies → service-role writes via server actions. ──
alter table public.marketing_touchpoints enable row level security;
alter table public.marketing_spend_daily enable row level security;
alter table public.marketing_change_log  enable row level security;
alter table public.acquisition_targets   enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marketing_touchpoints' and policyname='marketing_touchpoints_select') then
    execute $p$create policy marketing_touchpoints_select on public.marketing_touchpoints for select to authenticated using (has_permission('acquisition.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marketing_spend_daily' and policyname='marketing_spend_daily_select') then
    execute $p$create policy marketing_spend_daily_select on public.marketing_spend_daily for select to authenticated using (has_permission('acquisition.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='marketing_change_log' and policyname='marketing_change_log_select') then
    execute $p$create policy marketing_change_log_select on public.marketing_change_log for select to authenticated using (has_permission('acquisition.read') or is_platform_super_admin())$p$;
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='acquisition_targets' and policyname='acquisition_targets_select') then
    execute $p$create policy acquisition_targets_select on public.acquisition_targets for select to authenticated using (has_permission('acquisition.read') or is_platform_super_admin())$p$;
  end if;
end $$;

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('acquisition.read',   'acquisition', 'View the acquisition dashboard'),
  ('acquisition.manage', 'acquisition', 'Enter ad spend, change log and targets')
on conflict (key) do nothing;

-- role grants: admin both; analyst/reviewer/read_only read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('acquisition.read','acquisition.manage'))
    or (r.key in ('analyst','reviewer','read_only') and p.key = 'acquisition.read')
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);

-- seed the single targets config row (idempotent: only if none exists)
insert into public.acquisition_targets (base_currency, default_subscription_price, expected_retention_months, target_ltv_cac_ratio, target_payback_months, max_healthy_cac, min_clicks_before_judgement, min_leads_before_judgement, min_customers_before_judgement, early_churn_window_days, campaign_cooldown_days, min_conversions_to_scale, scale_step_pct, stable_window_days)
select 'CHF', 80, 24, 3, 3, 640, 100, 10, 3, 90, 14, 30, 20, 14
where not exists (select 1 from public.acquisition_targets);

-- ROLLBACK:
--   drop table public.marketing_touchpoints, public.marketing_spend_daily, public.marketing_change_log, public.acquisition_targets cascade;
--   alter table public.leads drop column if exists utm_source, ... (all added columns);
--   delete from public.permissions where key in ('acquisition.read','acquisition.manage');
