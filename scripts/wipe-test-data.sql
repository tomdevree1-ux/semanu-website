-- wipe-test-data.sql
-- One-off: clear ALL test business/operational data from the amai.ch production DB,
-- keeping auth, roles, permissions and config. Run in the Supabase SQL editor
-- (project bkwwlmflsbhrsfwydbnv) when you are ready to start from a clean slate.
--
-- REVIEW BEFORE RUNNING. This permanently deletes rows. It is wrapped in a
-- transaction: if anything looks wrong, ROLLBACK instead of COMMIT.
--
-- KEPT (NOT touched): profiles, roles, permissions, role_permissions, user_roles,
--   organizations, organization_members, platform_admins, settings, acquisition_targets.
-- WIPED: every inbound / CRM / sales / finance / funnel / marketing / ops table below.

begin;

truncate table
  -- inbound + CRM
  public.leads,
  public.funnel_submissions,
  public.companies,
  public.company_contacts,
  public.do_not_contact,
  public.opt_outs,
  public.import_batches,
  public.import_rows,
  -- sales + finance
  public.quotes,
  public.quote_items,
  public.invoices,
  public.invoice_items,
  public.invoice_payments,
  public.payments,
  public.payment_links,
  public.invoice_payment_links,
  public.orders,
  public.customers,
  public.subscriptions,
  public.customer_subscriptions,
  public.subscription_change_requests,
  public.projects,
  public.catalog_items,
  public.requests,
  public.documents,
  -- website analysis funnel
  public.website_analysis_reports,
  public.website_report_deliveries,
  public.report_files,
  public.scans,
  public.scan_pages,
  public.analyses,
  public.daily_queue,
  -- marketing / acquisition (config row in acquisition_targets is kept)
  public.marketing_touchpoints,
  public.marketing_spend_daily,
  public.marketing_change_log,
  -- ops / logs / queues
  public.outbox,
  public.email_log,
  public.emails,
  public.resend_events,
  public.stripe_events,
  public.audit_logs,
  public.rate_limit
restart identity cascade;

-- Verify the keepers are still present (should all be > 0 except where noted):
--   select 'profiles' t, count(*) from public.profiles
--   union all select 'roles', count(*) from public.roles
--   union all select 'permissions', count(*) from public.permissions
--   union all select 'acquisition_targets', count(*) from public.acquisition_targets;

commit;
