-- 0034_website_report_deliveries.sql
-- P15 Website Report Delivery & Sales Follow-up (WAF-3, Ring E). GREENFIELD: creates
-- public.website_report_deliveries — one row per delivery attempt of an APPROVED P14 report (PDF emailed to
-- the report's linked CRM contact via the existing outbox + Resend). ADDITIVE. Ships dark behind
-- WEBSITE_REPORT_DELIVERY_ENABLED (default off). Writes are service-role only (server actions + outbox
-- worker). Also creates the PRIVATE storage bucket `website-reports` (no public policy; service-role
-- access only; staff preview via short-TTL signed URLs). Does NOT modify website_analysis_reports,
-- funnel_submissions, CRM, the `documents` table, leads/checkout/Stripe/P10-12 or old /admin. Authority:
-- AMAI_PORTAL_MASTER_PLAN.md §VI.9 (WAF-3). Never edit an applied migration; add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0034_website_report_deliveries).

create table if not exists public.website_report_deliveries (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  report_id            uuid not null references public.website_analysis_reports(id) on delete cascade,
  funnel_submission_id uuid not null references public.funnel_submissions(id) on delete cascade,
  contact_id           uuid references public.company_contacts(id) on delete set null,
  company_id           uuid references public.companies(id) on delete set null,
  to_email             text not null,
  channel              text not null default 'email',
  status               text not null default 'queued',
  pdf_bucket           text,
  pdf_path             text,
  pdf_size_bytes       bigint,
  outbox_id            uuid references public.outbox(id) on delete set null,
  provider_message_id  text,
  subject              text,
  error_summary        text,
  sent_at              timestamptz,
  failed_at            timestamptz,
  follow_up_at         timestamptz,
  follow_up_status     text not null default 'none',
  archived_at          timestamptz,
  archived_by          uuid references public.profiles(id) on delete set null,
  created_by           uuid references public.profiles(id) on delete set null,
  updated_by           uuid references public.profiles(id) on delete set null,
  notes                text,
  constraint website_report_deliveries_channel_check check (channel in ('email')),
  constraint website_report_deliveries_status_check check (status in ('queued','rendering','sending','sent','failed','bounced','cancelled')),
  constraint website_report_deliveries_follow_up_status_check check (follow_up_status in ('none','planned','done')),
  constraint website_report_deliveries_pdf_size_check check (pdf_size_bytes is null or pdf_size_bytes >= 0)
);
-- ROLLBACK: drop table public.website_report_deliveries;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='website_report_deliveries_touch_updated_at') then
    create trigger website_report_deliveries_touch_updated_at before update on public.website_report_deliveries for each row execute function public.touch_updated_at();
  end if;
end $$;

create index if not exists website_report_deliveries_report_idx     on public.website_report_deliveries (report_id);
create index if not exists website_report_deliveries_submission_idx on public.website_report_deliveries (funnel_submission_id);
create index if not exists website_report_deliveries_contact_idx    on public.website_report_deliveries (contact_id);
create index if not exists website_report_deliveries_company_idx    on public.website_report_deliveries (company_id);
create index if not exists website_report_deliveries_outbox_idx     on public.website_report_deliveries (outbox_id);
create index if not exists website_report_deliveries_status_idx     on public.website_report_deliveries (status);
create index if not exists website_report_deliveries_created_at_idx on public.website_report_deliveries (created_at desc);
create index if not exists website_report_deliveries_active_idx     on public.website_report_deliveries (status) where archived_at is null;
create index if not exists website_report_deliveries_followup_idx   on public.website_report_deliveries (follow_up_at) where follow_up_status='planned' and archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads. No write policies — service-role writes only (delivery actions + outbox worker).
alter table public.website_report_deliveries enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='website_report_deliveries' and policyname='website_report_deliveries_select') then
    execute $p$create policy website_report_deliveries_select on public.website_report_deliveries for select to authenticated
      using (has_permission('website_reports.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- PRIVATE storage bucket for report PDFs. No public policy; service-role access only (staff preview uses a
-- short-TTL signed URL minted server-side; the customer email carries the PDF as an attachment, never a link).
insert into storage.buckets (id, name, public) values ('website-reports','website-reports', false)
on conflict (id) do nothing;
-- ROLLBACK: delete from storage.buckets where id='website-reports'; (only after removing its objects)

-- permission (module website_reports; deliver = send/resend/cancel/follow-up). Read + archive reuse P14 perms.
insert into public.permissions (key, module, label) values
  ('website_reports.deliver', 'website_reports', 'Deliver website analysis reports')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key='website_reports.deliver';

-- grants: admin + sales may deliver. (read via website_reports.read; archive via website_reports.archive.)
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.key in ('admin','sales') and p.key = 'website_reports.deliver'
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key='website_reports.deliver';
