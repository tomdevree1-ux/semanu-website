-- 0032_funnel_submissions.sql
-- P13 Website Sales Funnels / Lead Magnets → CRM (Ring E). GREENFIELD: creates public.funnel_submissions —
-- a generic public-to-portal funnel ingestion record (workflow/request layer; CRM companies/contacts stay
-- the source of truth). One table serves all four funnels via source_type + per-source payload. ADDITIVE.
-- The legacy `leads` / `/api/leads` / checkout / Stripe / P10/P11/P12 billing tables and old `/admin` are
-- NOT modified. Public ingestion writes via the service role only (no anon write policy). Authority:
-- AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI (§VI.9 funnel roadmap). Never edit an applied migration; add a
-- new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0032_funnel_submissions).

create table if not exists public.funnel_submissions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  source_type       text not null,
  status            text not null default 'new',
  spam_status       text not null default 'pending',
  spam_score        numeric,
  contact_id        uuid references public.company_contacts(id) on delete set null,
  company_id        uuid references public.companies(id) on delete set null,
  owner_id          uuid references public.profiles(id) on delete set null,
  first_name        text,
  last_name         text,
  email             text not null,
  phone             text,
  website_url       text,
  normalized_domain text,
  company_name      text,
  payload           jsonb not null default '{}'::jsonb,
  utm_source        text,
  utm_medium        text,
  utm_campaign      text,
  utm_term          text,
  utm_content       text,
  referrer          text,
  page_path         text,
  locale            text,
  user_agent_hash   text,
  ip_hash           text,
  consent_privacy   boolean not null default false,
  consent_marketing boolean not null default false,
  archived_at       timestamptz,
  archived_by       uuid references public.profiles(id) on delete set null,
  created_by        uuid references public.profiles(id) on delete set null,
  updated_by        uuid references public.profiles(id) on delete set null,
  notes             text,
  internal_notes    text,
  constraint funnel_submissions_source_type_check check (source_type in ('website_analysis','website_cost_calculator','strategy_call','maintenance_security_scan')),
  constraint funnel_submissions_status_check      check (status in ('new','to_review','qualified','in_progress','analyzed','report_sent','contacted','follow_up_planned','converted','closed_not_relevant','archived')),
  constraint funnel_submissions_spam_status_check check (spam_status in ('pending','ham','suspected','spam')),
  constraint funnel_submissions_locale_check      check (locale is null or locale in ('de','fr','en'))
);
-- ROLLBACK: drop table public.funnel_submissions;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='funnel_submissions_touch_updated_at') then
    create trigger funnel_submissions_touch_updated_at before update on public.funnel_submissions for each row execute function public.touch_updated_at();
  end if;
end $$;

create index if not exists funnel_submissions_source_type_idx on public.funnel_submissions (source_type);
create index if not exists funnel_submissions_status_idx      on public.funnel_submissions (status);
create index if not exists funnel_submissions_email_idx       on public.funnel_submissions (lower(email));
create index if not exists funnel_submissions_domain_idx      on public.funnel_submissions (normalized_domain);
create index if not exists funnel_submissions_company_idx     on public.funnel_submissions (company_id);
create index if not exists funnel_submissions_contact_idx     on public.funnel_submissions (contact_id);
create index if not exists funnel_submissions_owner_idx       on public.funnel_submissions (owner_id);
create index if not exists funnel_submissions_spam_idx        on public.funnel_submissions (spam_status);
create index if not exists funnel_submissions_created_at_idx  on public.funnel_submissions (created_at desc);
create index if not exists funnel_submissions_active_idx      on public.funnel_submissions (status) where archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only (public API + portal actions).
alter table public.funnel_submissions enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='funnel_submissions' and policyname='funnel_submissions_select') then
    execute $p$create policy funnel_submissions_select on public.funnel_submissions for select to authenticated
      using (has_permission('funnels.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL)
insert into public.permissions (key, module, label) values
  ('funnels.read',   'funnels', 'View funnel submissions'),
  ('funnels.update', 'funnels', 'Update funnel submissions'),
  ('funnels.assign', 'funnels', 'Assign funnel owners'),
  ('funnels.archive','funnels', 'Archive funnel submissions')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('funnels.read','funnels.update','funnels.assign','funnels.archive');

-- role grants: admin all; sales read/update/assign (no archive); analyst/reviewer/read_only read only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
       (r.key = 'admin' and p.key in ('funnels.read','funnels.update','funnels.assign','funnels.archive'))
    or (r.key = 'sales' and p.key in ('funnels.read','funnels.update','funnels.assign'))
    or (r.key in ('analyst','reviewer','read_only') and p.key in ('funnels.read'))
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('funnels.read','funnels.update','funnels.assign','funnels.archive');
