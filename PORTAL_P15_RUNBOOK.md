# PORTAL P15 Runbook — Website Report Delivery & Sales Follow-up

Operator guide for P15 (WAF-3). Pairs with `PORTAL_P15_SPEC.md` and migration
`0034_website_report_deliveries.sql`. Ships **dark** behind `WEBSITE_REPORT_DELIVERY_ENABLED` (default off).

## What shipped

Staff can deliver an **approved** P14 report to its linked CRM contact: a branded PDF is rendered from the
validated report JSON, stored privately, and emailed as a **PDF attachment** (no link) via the existing
outbox + Resend. Each send is tracked, the funnel advances forward to `report_sent`, and a lightweight
follow-up reminder is available. Delivery is staff-initiated, one report at a time, behind a default-off flag.
**Nothing is sent automatically; nothing is shared via a public or signed URL to the customer.**

## Migration + bucket

`0034_website_report_deliveries.sql` (applied live) — `public.website_report_deliveries` (26 cols), RLS on,
one read policy (`website_reports.read` or super-admin), no write policies; seeds `website_reports.deliver`
(admin, sales). It also creates the **private** storage bucket `website-reports` (`public=false`, no object
policy → service-role access only). If your environment provisions storage separately, create a private
bucket named `website-reports` with **no public access** and **no anon/authenticated object policies**; the
app reads/writes it via the service role and mints 300 s signed URLs for staff preview only.

## Environment

```
WEBSITE_REPORT_DELIVERY_ENABLED=false   # master switch (default OFF). Delivery/PDF/send hard-block when off.
WEBSITE_REPORT_PDF_MAX_BYTES=10000000   # optional; PDF size cap (default 10 MB).
RESEND_API_KEY=...                      # existing; without it the worker no-ops (fails safe, never sends).
```

Plus existing Supabase + `CRON_SECRET` (the `/api/cron/outbox` route drives the send). No new secret beyond
the flag/cap. The flag is server-authoritative; the UI shows a disabled state when off.

## Permissions

`website_reports.deliver` (deliver/re-send/cancel/follow-up) — admin + sales. Viewing deliveries reuses
`website_reports.read`; archive/restore reuse `website_reports.archive` (admin). PDF preview requires
`website_reports.read`.

## PDF generation

Server-only `@react-pdf/renderer` (no headless browser). Rendered deterministically from the **validated**
`report_json` (re-validated at delivery) — never AI, never a fetch, never arbitrary HTML. The **internal
sales note is excluded** from the customer PDF. Locale-aware headings (de/fr/en); body text is already in the
report locale. Stored at `website-reports/<report_id>/<delivery_id>.pdf`; filename
`website-analysis-<domain>-<YYYY-MM-DD>.pdf`. Over the size cap → fails closed (`pdf_too_large`). `@react-pdf/
renderer` is in `serverExternalPackages` so Next does not bundle its native deps.

## Email / outbox delivery + attachment

The deliver action renders + stores the PDF, creates a delivery row (`sending`), and enqueues a
`website_report` outbox job whose payload carries an **attachment pointer** (`{bucket, path, filename,
mimeType}`) — never the bytes. The cron worker downloads the PDF via the service role at send time and
attaches it to the Resend email (base64). The email body is a short localized message; it contains **no
report link and no signed URL**. Reply-to is the existing notification reply address. The
invite/password_reset flows are unchanged.

## Feature flag behavior

`WEBSITE_REPORT_DELIVERY_ENABLED=false` (default): the deliver/re-send/cancel/follow-up actions return a
disabled error and the report-detail Deliver panel shows a disabled note. P15 is safe to deploy with the flag
off — no PDF is generated, no email is sent. Enabling it in production is gated behind the **combined P14+P15
live smoke** (P15 has no report source of its own — it only acts on approved P14 reports).

## Delivery workflow

On a report detail page, when `review_status='approved'`, the Deliver panel shows the recipient (the linked
contact), a Deliver / Re-send button, Cancel (while pending), Preview PDF (staff signed URL), and follow-up
controls. The pipeline drives the row `queued → rendering → sending`, then the worker marks it
`sent` (with the Resend id + `sent_at`) or `failed` (safe `error_summary`). On the first successful send the
funnel advances forward to `report_sent` (never backward, never from converted/closed/archived). Re-send
appends a new delivery row (history is kept). Only `approved` + `is_current` + non-archived reports with a
linked-contact email are deliverable; there is no send-to-arbitrary-address.

## Follow-up workflow

Set a follow-up date on a delivery → `follow_up_status='planned'` + `follow_up_at`, and the funnel may advance
forward to `follow_up_planned`. The deliveries list has a "Follow up due" filter
(`follow_up_status='planned' and follow_up_at <= now()`). Mark done → `done`; clear → `none`. No general task
system, no automated outreach.

## Cost / rate / abuse controls

Actor-scoped delivery/re-send throttle (shared `website_report_delivery` bucket, **10 per actor per hour**,
fail-open); one report → one recipient; no bulk/scheduled send; dedupe key
`website_report:<report_id>:<delivery_id>` prevents double-send on a retried action; PDF size cap; fails safe
on storage/outbox/provider errors. The whole feature is flag-gated; the worker no-ops without `RESEND_API_KEY`.

## Audit events

`report_delivery.requested / pdf_generated / email_enqueued / sent / failed / cancelled / bounced (reserved) /
follow_up_set / follow_up_cleared / archived / restored` (entity_type `report_delivery`) + `funnel.report_sent`
(entity_type `funnel`). Safe metadata only (report_id, delivery_id, contact_id, domain, outbox_id,
provider_message_id, status transitions, pdf_size_bytes, follow_up_at). Never: PDF bytes, report content/
markdown, AI/Resend keys, raw provider payloads, raw email body. Technical fields gated by
`audit.read_technical`.

## Combined P14 + P15 live smoke (non-production, before enabling either flag in prod)

Prereqs: `WEBSITE_REPORTS_ENABLED=true`, `WEBSITE_REPORT_DELIVERY_ENABLED=true`, AI provider/model/key,
Resend non-production sending, admin/sales/read_only users.
Steps: create a `website_analysis` submission → link/create a contact → generate the P14 report → approve it →
Deliver → confirm the email arrives **with the PDF attached and no link**; verify the PDF content and that the
**internal sales note is absent**; confirm `status='sent'` and funnel `status='report_sent'`; set a follow-up
→ `follow_up_planned`; verify P14 SSRF blocks (`127.0.0.1`, `169.254.169.254`) and the P14 + P15 rate limits;
confirm role gating (sales delivers, read_only cannot); confirm **no public report URL** anywhere; confirm
P13 ingestion, `/api/leads`, checkout, the Stripe webhook/P12 and old `/admin` are unchanged.

## Rollback

Code: revert the P15 commit. Flag: `WEBSITE_REPORT_DELIVERY_ENABLED=false` disables delivery with no DB
rollback. Data: `drop table public.website_report_deliveries;` + delete the `website_reports.deliver`
permission/grant + (after removing its objects) the `website-reports` bucket. The outbox/worker extensions are
backward-compatible (the new template + attachment are additive). No Stripe/billing rollback.

## Deferred (not in P15 v1)

Open/click/bounce tracking (would need a Resend webhook), quote/project/invoice creation on conversion, public
report URLs, a customer portal, SMS/other channels. The report PDF + delivery state are stored so a later
phase can extend tracking without re-sending.

## Unchanged by P15

P13 ingestion, P14 generation logic (only the funnel `report_sent` advance + the delivery integration are
added), `funnel_submissions`/`website_analysis_reports` schemas, the CRM tables, the `documents` table,
`/api/leads`, checkout, the Stripe webhook, P10/P11/P12 and the legacy `/[locale]/admin`. No hard deletes.
