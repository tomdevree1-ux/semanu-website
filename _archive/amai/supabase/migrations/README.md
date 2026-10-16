# Migrations — mirroring policy & numbering note

The amai Supabase project was built **additively on a pre-existing, hand-made schema** (no original
migration history — see `AMAI_PORTAL_MASTER_PLAN.md` Part IV L1/L2). These files are **mirrors** of
what was applied to the **live** database via the Supabase MCP `apply_migration`; the live database is
the source of truth, not these filenames.

**Rules**
- Migrations are **additive only**. Never edit an applied migration; add a new one.
- Each migration carries `-- ROLLBACK:` notes.
- **Do not rename migrations that were already applied live** (the live `supabase_migrations` history
  records the name used at apply time; renaming the repo file does not change that record).
- Always inspect the live schema/repo before writing a new migration.

## Known numbering note (P4)

A naming overlap exists at `0018` and is intentional/safe:

| Repo file | Applied live as | Notes |
|---|---|---|
| `0018_orders_subscriptions_allow_webshop.sql` | (separate change) | Widens `orders.plan` CHECK to include `webshop`. **Applied live** (`orders.plan` CHECK = starter/business/webshop — verified). |
| `0019_function_grants_hardening.sql` | **`0018_function_grants_hardening`** | P4 advisor hardening (search_path + revoke anon/authenticated on trigger fns, `grant_role`, `hit_rate_limit`). The mirror was renamed to **0019** so two files don't both claim `0018`. |
| `0020_grant_role_public_lockdown.sql` | `0020_grant_role_public_lockdown` | Corrective (P4 review): revoke the **PUBLIC** grant on `grant_role` + trigger fns (0019 alone left them callable via PUBLIC). |
| `0021_rbac_predicate_grants_hardening.sql` | `0021_rbac_predicate_grants_hardening` | Lock RBAC predicates to `authenticated` + `service_role` (revoke PUBLIC/anon); RLS verified still working. |

**Live DB state is correct.** The only discrepancy is cosmetic: the function-grants hardening is
recorded in the live migration history as `0018_function_grants_hardening` while its repo mirror is
`0019_function_grants_hardening`. For a fresh rebuild, apply the repo files in ascending numeric order
(`0006` → `0021`); the result matches the live schema.

## P4 migration set (applied live)

`0016_portal_user_archive` · `0017_security_hardening` · `0018_function_grants_hardening`
(repo `0019`) · `0020_grant_role_public_lockdown` · `0021_rbac_predicate_grants_hardening`.
(Plus the independent `0018_orders_subscriptions_allow_webshop`.)

## P5 migration (applied live)

`0022_crm_companies_contacts` — CRM Core (Companies + Contacts), **additive on the existing
`companies`/`company_contacts`** (Option A). Adds the CRM lifecycle layer (`crm_status`,
`contact_status`, `archived_at/by`, contact provenance + `is_primary`, indexes), seeds
`companies.*`/`contacts.*` permissions and role grants. The prospecting `lead_status` and pipeline
tables are untouched; no new RLS policies or SECURITY DEFINER functions (no new advisor surface).
Repo file number matches the live name. Next migration: `0023`.

## P6 migration (applied live)

`0023_projects` — **greenfield** Projects Core (Ring D). Creates `public.projects` (company-required,
optional same-company contact, single `owner_id`, status `draft/active/on_hold/completed/cancelled/
archived`, dates, archive provenance), RLS on with a **permission-gated** `projects_select` policy,
and seeds `projects.*` permissions + grants (admin all / sales read·create·update / others read).
No business-table changes; no new SECURITY DEFINER functions (no new advisor surface). Rollback is a
clean `drop table public.projects`. Repo file number matches the live name. Next migration: `0024`.

## P7 migration (applied live)

`0024_catalog_items` — **greenfield** Products & Services Catalog (Ring D). Creates
`public.catalog_items` (name/code/description, `item_type`, `status` draft/active/inactive/archived,
`category`, `base_price` net-nullable + `price_is_from` + `currency` CHF + `billing_interval` +
`setup_fee`, `is_public` inert, archive provenance), unique `lower(code)`, RLS on with a
**permission-gated** `catalog_items_select` policy, and seeds `catalog.*` permissions + grants
(**admin-only writes**; sales/analyst/reviewer/read_only read-only — decision P7-Q1). No business-
table/checkout/Stripe changes; no new SECURITY DEFINER functions. Rollback is a clean
`drop table public.catalog_items`. Repo file number matches the live name. Next migration: `0025`.

## P8 migration (applied live)

`0025_quotes` — **greenfield** Quotes Core (Ring D), first parent-child. Creates `public.quotes`
(company-required, optional same-company contact/project, generated `quote_number` Q-#####, status
draft/sent/accepted/declined/expired/archived, stored money `numeric(12,2)` subtotal/discount/tax/
total, notes/internal_notes, archive provenance) + `public.quote_items` (snapshot name/unit_price/
billing_interval, `quote_id → quotes ON DELETE CASCADE`, optional `catalog_item_id`, position,
line math) + a `quote_number_seq` sequence. RLS on with **permission-gated** select policies on both
tables; seeds `quotes.*` (6 perms) + grants (admin all; sales read/create/update/send/accept, no
archive; others read). No business-table/checkout/Stripe changes; no new SECURITY DEFINER functions.
Rollback: drop `quote_items` then `quotes` then the sequence. Next migration: `0026`.

## P9 migration (applied live)

`0026_invoices` — **greenfield** Invoices Core (Ring D), parent-child. Creates `public.invoices`
(company-required, optional same-company contact/project/quote, generated `invoice_number` INV-#####,
status draft/issued/paid/overdue/void/archived, stored money `numeric(12,2)` subtotal/discount/tax/
total + `amount_paid`/`balance_due`, `issue_date`/`due_date`/`paid_at`, notes/internal_notes, archive
provenance) + `public.invoice_items` (snapshot name/unit_price/billing_interval, `invoice_id → invoices
ON DELETE CASCADE`, optional `quote_item_id`/`catalog_item_id` SET NULL, position, line math) + an
`invoice_number_seq` sequence. RLS on with **permission-gated** select policies on both tables; seeds
`invoices.*` (7 perms) + grants (admin all; sales read/create/update/issue — no mark_paid/void/archive;
others read). No business-table/checkout/Stripe/quotes changes; no new SECURITY DEFINER functions.
Rollback: drop `invoice_items` then `invoices` then the sequence. Next migration: `0027`.

## P10 migration (applied live)

`0027_invoice_payments` — **greenfield** Payments Core (Ring D). Creates `public.invoice_payments`
(internal payment records linked to a P9 invoice: `invoice_id → invoices ON DELETE RESTRICT`,
`company_id → companies RESTRICT` denormalized, `amount numeric(12,2) > 0`, status
pending/succeeded/failed/cancelled/refunded/archived, method + provider enums, Stripe **reference**
fields, soft `legacy_payment_id`/`payment_link_id` **no-FK**, paid/failed/refunded timestamps, archive
provenance). RLS on with a **permission-gated** `invoice_payments_select` policy; seeds `payments.*`
(7 perms incl. `mark_succeeded`/`refund`/`cancel`) + grants (admin all; **sales read/create/update**;
others read). **No Stripe calls; the legacy `payments`/`payment_links`/`stripe_events`/`orders`/
`subscriptions`/`customers`/checkout are NOT modified.** Invoice `amount_paid`/`balance_due`/`paid_at`
are recomputed from succeeded payments (server-side `recalculateInvoicePaymentState`); a P9 guard
blocks manual mark-paid/un-pay when payment records exist. Rollback: drop `invoice_payments`. Next
migration: `0028`.

## P11 migration (applied live)

`0028_invoice_payment_links` — **greenfield** Stripe Payment Links from invoices (Ring D). Creates
`public.invoice_payment_links` (a **Stripe Checkout Session reference** generated for an invoice's
`balance_due`: `invoice_id → invoices RESTRICT`, `company_id → companies RESTRICT` denormalized,
optional `invoice_payment_id → invoice_payments SET NULL`, `amount numeric(12,2) > 0`, status
draft/active/paid/expired/cancelled/failed/archived, `provider='stripe'`, `provider_checkout_session_id`
/`provider_payment_intent_id`/`url`, expiry + lifecycle stamps, archive provenance). Unique
`provider_checkout_session_id`; **partial unique one-active-link-per-invoice**; RLS on with a
**permission-gated** `invoice_payment_links_select` policy; seeds `payment_links.*` (4 perms) + grants
(admin all; **sales read/create/cancel**; others read). **Stripe is called server-side only; the legacy
`payment_links`/`payments`/`stripe_events`/`orders`/`subscriptions`/`customers`/`/api/checkout` are NOT
modified** (one additive defensive guard added to the webhook so invoice-payment sessions skip the
legacy order/email logic). Rollback: drop `invoice_payment_links`. Next migration: `0029`.

## P12A migration (applied live)

`0029_customer_subscriptions` — **greenfield** Stripe Subscription Registry / Read & Link (Ring D, P12A).
Creates `public.customer_subscriptions` — a **portal-owned registry** that links an existing Stripe
subscription to a CRM company/contact/customer and stores a **synced snapshot** of its Stripe state
(`company_id`/`contact_id`/`customer_id` all → `… SET NULL`, all nullable; `stripe_customer_id` NOT NULL;
`stripe_subscription_id` NOT NULL **unique**; `stripe_product_id`/`stripe_price_id`/`plan_key`; mirrored
`status` (**no strict CHECK** — Stripe may add statuses), `current_period_start/end`,
`cancel_at_period_end`, `cancelled_at`, `trial_start/end`, `quantity`, `currency`, `amount numeric(12,2)`,
`interval`, `metadata jsonb`; `last_synced_at` + `sync_status` (pending/synced/failed/stale); archive
provenance). CHECKs on sync_status/quantity/amount/interval. RLS on with a **permission-gated**
`customer_subscriptions_select` policy (`subscriptions.read` or super-admin); **no write policies**. Seeds
`subscriptions.*` (4 perms: read/link/sync/archive — `subscriptions.update`/`.cancel` are **NOT** seeded;
they are P12B-only) + grants (admin all; **sales read/link/sync**; others read). **Stripe stays
authoritative for subscription state; this table is never the billing authority. P12A is read/link/sync
only — NO Stripe mutations, NO webhook changes.** The legacy `subscriptions`/`customers`/`orders`/
`payments`/`payment_links`/`stripe_events`/`invoice_payments`/`invoice_payment_links`/`/api/checkout`/
Stripe webhook are **NOT** modified. Rollback: drop `customer_subscriptions` + delete the 4 perms/grants.
Next migration: `0030`.

## P12B1 migration (applied live)

`0030_subscription_change_requests` — **greenfield** Subscription Change Requests + Preview (Ring D, P12B1).
Creates `public.subscription_change_requests` — the portal **request/log layer** for subscription
mutations, entered through a P12A `customer_subscriptions` row (`customer_subscription_id → customer_subscriptions
RESTRICT`; `company_id`/`contact_id → … SET NULL`; `stripe_subscription_id`; `action_type` (CHECK: the 7
actions); `status` (CHECK draft/previewed/approved/**executing/executed (P12B2-reserved)**/failed/cancelled/
archived); `proration_behavior` (CHECK null/create_prorations/none/always_invoice); `subscription_item_id`;
request/approve/execute provenance + stamps; `request_payload`/`preview_payload`/`result_payload`/
`safe_summary` jsonb; `error_summary`; **unique** `idempotency_key`; archive provenance; notes). RLS on with
a **permission-gated** `subscription_change_requests_select` policy (`subscriptions.read` or super-admin);
**no write policies**. Seeds **`subscriptions.request_change` + `subscriptions.preview_change`** (2 perms) +
grants (**admin + sales** both; analyst/reviewer/read_only none). **P12B1 is request + preview ONLY — NO
Stripe writes, NO live execution; `subscriptions.change_plan/change_quantity/cancel/pause/resume` are NOT
seeded (P12B2).** The legacy `subscriptions`/`customers`/`orders`/`payments`/`payment_links`/`stripe_events`/
`invoice_payments`/`invoice_payment_links`/`/api/checkout`/Stripe webhook are **NOT** modified. Rollback:
drop `subscription_change_requests` + delete the 2 perms/grants. Next migration: `0031`.

## P12B2 migration (applied live)

`0031_subscription_execution_permissions` — **permission seed ONLY** (Ring D, P12B2). **No table/column
change** (the P12B1 `subscription_change_requests` already carries `executed_by`/`executed_at`/`approved_by`/
`approved_at`/`failed_at`/`result_payload`/`idempotency_key` + the `executing`/`executed` statuses). Seeds
the **3 admin-only** execution permissions `subscriptions.change_plan`, `subscriptions.change_quantity`,
`subscriptions.cancel` (the last gates cancel_at_period_end / undo / cancel_immediately) + grants **to
admin only** (no sales/analyst/reviewer/read_only). **`subscriptions.pause`/`subscriptions.resume` are NOT
seeded (pause/resume deferred).** Live execution is additionally gated by the
`ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` env flag (default off). **No legacy table, checkout route or webhook
is modified.** Rollback: delete the 3 perms + admin grants. Next migration: `0032`.

## P13 migration (applied live)

`0032_funnel_submissions` — **greenfield** Website Sales Funnels / Lead Magnets → CRM (Ring E, P13).
Creates `public.funnel_submissions` — a generic public-to-portal funnel ingestion record (36 cols;
`source_type` CHECK website_analysis/website_cost_calculator/strategy_call/maintenance_security_scan;
`status` CHECK 11 values incl. `analyzed`/`report_sent` reserved for P14/P15; `spam_status` CHECK
pending/ham/suspected/spam; `locale` null or de/fr/en; CRM links `contact_id → company_contacts SET NULL`,
`company_id → companies SET NULL` (both nullable — CRM stays source of truth); `owner_id`/`archived_by`/
`created_by`/`updated_by → profiles SET NULL`; snapshots; `payload jsonb`; UTM + referrer/page_path/locale;
**hashed** `ip_hash`/`user_agent_hash`; consent; archive provenance; notes). 10 indexes incl. `lower(email)`
+ a partial active-status one. RLS on with a **permission-gated** `funnel_submissions_select` policy
(`funnels.read` or super-admin); **no write policies** (public API + portal actions write via the service
role). Seeds `funnels.read/update/assign/archive` + grants (admin all; **sales read/update/assign**; others
read). **The legacy `leads`/`/api/leads`/checkout/Stripe/P10/P11/P12 billing tables + old `/admin` are NOT
modified; the companies `source` enum is unchanged.** Rollback: drop `funnel_submissions` + delete the 4
perms/grants. Next migration: `0033`.

## P14 migration (applied live)

**`0033_website_analysis_reports.sql`** — GREENFIELD `public.website_analysis_reports` (Ring E, P14 / WAF-2):
an internal, staff-reviewable website analysis report generated from a P13 `website_analysis`
`funnel_submission`. 41 columns; `funnel_submission_id → funnel_submissions(id) ON DELETE CASCADE`; nullable
CRM links `company_id → companies`, `contact_id → company_contacts` (both SET NULL) plus an `input_snapshot`
so the report is reproducible while the live CRM stays source of truth. **Versioned** (`version` +
`is_current`, partial unique `(funnel_submission_id) where is_current`); two status fields
(`generation_status` queued/fetching/analyzing/succeeded/failed; `review_status`
review_needed/approved/rejected); 0–10 `numeric(4,1)` scores (CHECK 0..10); `report_json`/`report_markdown`,
`crawl_snapshot`, `recommendations`, `token_usage`, `cost_estimate`; soft archive only. 8 indexes incl. the
partial-current unique + a `(review_status) where archived_at is null` active index + `touch_updated_at`
trigger. RLS on with a **permission-gated** `website_analysis_reports_select` policy (`website_reports.read`
or super-admin); **no write policies** (service-role generation + portal actions only). Seeds
`website_reports.read/generate/review/archive` + grants (admin all; **sales read/generate/review**;
analyst+reviewer read/review; read_only read). **No change to `funnel_submissions`, CRM tables, `leads`/
`/api/leads`, checkout, Stripe, P10/P11/P12 or old `/admin`.** Rollback: drop `website_analysis_reports` +
delete the 4 perms/grants. Next migration: `0034`.

## P15 migration (applied live)

**`0034_website_report_deliveries.sql`** — GREENFIELD `public.website_report_deliveries` (Ring E, P15 / WAF-3):
one row per delivery attempt of an APPROVED P14 report (a PDF emailed to the report's linked CRM contact via
the existing outbox + Resend). 26 columns; `report_id → website_analysis_reports` + `funnel_submission_id →
funnel_submissions` (both CASCADE); `contact_id`/`company_id` SET NULL; `outbox_id → outbox` SET NULL;
`to_email` NOT NULL; `status` (queued/rendering/sending/sent/failed/bounced/cancelled), `channel` (email),
`follow_up_status` (none/planned/done), pdf bucket/path/size, provider refs, follow-up + archive provenance;
soft archive only. 10 indexes incl. a `(status) where archived_at is null` active index + a follow-up partial
+ `touch_updated_at` trigger. RLS on with a **permission-gated** `website_report_deliveries_select` policy
(`website_reports.read` or super-admin); **no write policies** (delivery actions + outbox worker write via the
service role). Also creates the **PRIVATE** storage bucket `website-reports` (no public policy; service-role
access only; staff preview via a 300s signed URL; the customer email carries the PDF as an attachment, never a
link). Seeds `website_reports.deliver` + grants (admin, sales). Ships dark behind
`WEBSITE_REPORT_DELIVERY_ENABLED` (default off). **No change to `website_analysis_reports`,
`funnel_submissions`, CRM tables, the `documents` table, `leads`/`/api/leads`, checkout, Stripe, P10/P11/P12 or
old `/admin`.** Rollback: drop `website_report_deliveries` + delete the `website_reports.deliver` perm/grant +
(after removing its objects) the `website-reports` bucket. Next migration: `0035`.

## P16 migration (applied live)

**`0035_resend_engagement.sql`** — ADDITIVE Email Engagement Tracking (Ring E, P16 / WAF-3.1). Creates
**`public.resend_events`** — a service-role-only **dedup sink** for Resend (Svix) webhook deliveries
(`id text PK` = the `svix-id`, `type`, `created_at`); **RLS on, no policies** (mirror of `stripe_events`;
RLS-on-no-policy denies anon/authenticated — verified identical to `stripe_events`, no new advisor surface).
Adds **11 additive engagement columns** to `public.website_report_deliveries` (all nullable / defaulted, **no
CHECK change** — `bounced` is already an allowed status): `delivered_at`, `bounced_at`, `complained_at`,
`first_opened_at`, `opened_at`, `clicked_at`, `open_count int not null default 0`, `click_count int not null
default 0`, `last_event_at`, `bounce_type`, `engagement jsonb not null default '{}'`. Adds 5 indexes
(`delivered_at`, `bounced_at`, `opened_at`, `clicked_at`, and `provider_message_id` — the webhook match key).
The signature-verified `/api/webhooks/resend` route reflects `delivered`/`bounced`/`complained` (always) and,
behind `ENABLE_EMAIL_OPEN_CLICK_TRACKING` (default off), the **indicative** `opened`/`clicked` onto these
columns by `provider_message_id`, and reflects reliable state onto `email_log.status`. Ships dark behind
`ENABLE_RESEND_WEBHOOK` (default off). **No new permission** (viewing reuses `website_reports.read`; the webhook
is service-role). **No change to `website_analysis_reports`, `funnel_submissions`, CRM tables, the `documents`
table, `outbox`, `leads`/`/api/leads`, checkout, Stripe (incl. its webhook), P10/P11/P12 or old `/admin`; no
funnel-status change; no CRM mutation.** Rollback: drop the 11 engagement columns + the `provider_message_id`
index, then `drop table public.resend_events`. Next migration: `0036`.
