-- 0033_website_analysis_reports.sql
-- P14 Website Analysis Report Engine (WAF-2, Ring E). GREENFIELD: creates public.website_analysis_reports —
-- an internal, staff-reviewable website analysis report generated from a P13 `website_analysis`
-- funnel_submission. ADDITIVE. The CRM (companies/company_contacts) stays the source of truth; the report
-- snapshots its inputs. P13 `funnel_submissions`, legacy `leads`/`/api/leads`, checkout, Stripe and the
-- P10/P11/P12 billing tables and old `/admin` are NOT modified. Writes are service-role only (no anon/write
-- RLS policy). Reports are versioned (regenerate → new version; one is_current per submission) and soft
-- archived (no hard delete). Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI (§VI.9 WAF-2). Never edit
-- an applied migration; add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0033_website_analysis_reports).

create table if not exists public.website_analysis_reports (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  funnel_submission_id uuid not null references public.funnel_submissions(id) on delete cascade,
  version              int not null default 1,
  is_current           boolean not null default true,
  company_id           uuid references public.companies(id) on delete set null,
  contact_id           uuid references public.company_contacts(id) on delete set null,
  website_url          text not null,
  normalized_domain    text,
  generation_status    text not null default 'queued',
  review_status        text not null default 'review_needed',
  model_provider       text,
  model_name           text,
  prompt_version       text,
  input_snapshot       jsonb not null default '{}'::jsonb,
  crawl_snapshot       jsonb not null default '{}'::jsonb,
  report_json          jsonb,
  report_markdown      text,
  score_overall        numeric(4,1),
  score_seo            numeric(4,1),
  score_ux             numeric(4,1),
  score_conversion     numeric(4,1),
  score_performance    numeric(4,1),
  score_trust          numeric(4,1),
  score_content        numeric(4,1),
  score_mobile         numeric(4,1),
  recommendations      jsonb not null default '[]'::jsonb,
  internal_sales_notes text,
  error_summary        text,
  cost_estimate        numeric(8,4),
  token_usage          jsonb not null default '{}'::jsonb,
  generated_at         timestamptz,
  reviewed_at          timestamptz,
  reviewed_by          uuid references public.profiles(id) on delete set null,
  archived_at          timestamptz,
  archived_by          uuid references public.profiles(id) on delete set null,
  created_by           uuid references public.profiles(id) on delete set null,
  updated_by           uuid references public.profiles(id) on delete set null,
  notes                text,
  internal_notes       text,
  constraint website_analysis_reports_generation_status_check check (generation_status in ('queued','fetching','analyzing','succeeded','failed')),
  constraint website_analysis_reports_review_status_check      check (review_status in ('review_needed','approved','rejected')),
  constraint website_analysis_reports_version_check            check (version >= 1),
  constraint website_analysis_reports_cost_check               check (cost_estimate is null or cost_estimate >= 0),
  constraint website_analysis_reports_scores_check check (
       (score_overall     is null or score_overall     between 0 and 10)
   and (score_seo         is null or score_seo         between 0 and 10)
   and (score_ux          is null or score_ux          between 0 and 10)
   and (score_conversion  is null or score_conversion  between 0 and 10)
   and (score_performance is null or score_performance between 0 and 10)
   and (score_trust       is null or score_trust       between 0 and 10)
   and (score_content     is null or score_content     between 0 and 10)
   and (score_mobile      is null or score_mobile      between 0 and 10)
  )
);
-- ROLLBACK: drop table public.website_analysis_reports;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='website_analysis_reports_touch_updated_at') then
    create trigger website_analysis_reports_touch_updated_at before update on public.website_analysis_reports for each row execute function public.touch_updated_at();
  end if;
end $$;

create index if not exists website_analysis_reports_submission_idx on public.website_analysis_reports (funnel_submission_id);
create unique index if not exists website_analysis_reports_current_uidx on public.website_analysis_reports (funnel_submission_id) where is_current;
create index if not exists website_analysis_reports_genstatus_idx  on public.website_analysis_reports (generation_status);
create index if not exists website_analysis_reports_revstatus_idx  on public.website_analysis_reports (review_status);
create index if not exists website_analysis_reports_domain_idx     on public.website_analysis_reports (normalized_domain);
create index if not exists website_analysis_reports_created_at_idx on public.website_analysis_reports (created_at desc);
create index if not exists website_analysis_reports_active_idx     on public.website_analysis_reports (review_status) where archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only (portal actions + generation).
alter table public.website_analysis_reports enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='website_analysis_reports' and policyname='website_analysis_reports_select') then
    execute $p$create policy website_analysis_reports_select on public.website_analysis_reports for select to authenticated
      using (has_permission('website_reports.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('website_reports.read',     'website_reports', 'View website analysis reports'),
  ('website_reports.generate', 'website_reports', 'Generate website analysis reports'),
  ('website_reports.review',   'website_reports', 'Review website analysis reports'),
  ('website_reports.archive',  'website_reports', 'Archive website analysis reports')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('website_reports.read','website_reports.generate','website_reports.review','website_reports.archive');

-- role grants: admin all; sales read/generate/review; analyst+reviewer read/review; read_only read.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('website_reports.read','website_reports.generate','website_reports.review','website_reports.archive'))
    or (r.key = 'sales' and p.key in ('website_reports.read','website_reports.generate','website_reports.review'))
    or (r.key in ('analyst','reviewer') and p.key in ('website_reports.read','website_reports.review'))
    or (r.key = 'read_only' and p.key in ('website_reports.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('website_reports.read','website_reports.generate','website_reports.review','website_reports.archive');
