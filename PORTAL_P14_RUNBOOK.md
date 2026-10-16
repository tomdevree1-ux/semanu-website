# PORTAL P14 Runbook — Website Analysis Report Engine

Operator guide for P14 (WAF-2). Pairs with `PORTAL_P14_SPEC.md` and migration
`supabase/migrations/0033_website_analysis_reports.sql`.

## What shipped

Staff can generate an internal AI website analysis report for a P13 `website_analysis` funnel submission.
The engine fetches the submitted homepage (SSRF-safe), runs an AI analysis that returns a zod-validated
structured JSON report (scorecard + sections + impact/effort + an internal sales note), renders markdown from
it, and stores it for review. Reports are versioned and soft-archived. **Nothing is sent**: no email, no PDF,
no public URL. Approval only marks a report ready for a future P15 delivery phase.

## Migration (applied live)

`0033_website_analysis_reports.sql` — greenfield `public.website_analysis_reports` (41 cols). Linked to
`funnel_submissions(id)` ON DELETE CASCADE; nullable CRM links + an `input_snapshot` so the report is
reproducible while the CRM stays source of truth. Versioned (`version` + `is_current`, partial unique
`(funnel_submission_id) where is_current`); two status fields; 0–10 `numeric(4,1)` scores (CHECK 0..10);
`report_json`/`report_markdown`, `crawl_snapshot`, `recommendations`, `token_usage`, `cost_estimate`. RLS on,
one SELECT policy `has_permission('website_reports.read') or is_platform_super_admin()`, **no write
policies** (service-role writes only). `touch_updated_at` trigger; 8 indexes.

## Permissions

`website_reports.read / generate / review / archive`. Grants: admin all four; sales read/generate/review;
analyst + reviewer read/review; read_only read. Generation is admin/sales only. Archive and the **contact
override** are admin-only (the override is gated on `website_reports.archive`, which only admin holds).

## Environment / feature flag

```
WEBSITE_REPORTS_ENABLED=false        # master switch (default OFF). Generation hard-blocks when not 'true'.
AI_PROVIDER=anthropic
AI_MODEL=<model id>                  # e.g. a Claude Sonnet model. Empty → generation fails safely.
ANTHROPIC_API_KEY=<server-only key>  # never exposed to the client.
WEBSITE_REPORT_MAX_COST=1            # optional hard per-report cost ceiling (CHF/USD). Default 1.
```

The flag is server-authoritative: with it off, the generate/retry/regenerate actions return a disabled error
and the UI shows a disabled state. If provider/key/model are missing, generation fails with a safe
`ai_not_configured` error (no crash, no secret leak). The AI key is read only in `src/lib/ai/provider.ts`
(server-only) and is never imported into a client component.

## SSRF / crawl security (mandatory)

P14 fetches the **homepage only** (no extra pages, no assets, no sitemaps, no screenshots, no browser). The
guard `src/lib/security/url-guard.ts` runs before the initial request **and re-runs on every redirect hop**
(max 3): http/https only; reject userinfo, non-80/443 ports, raw IP-literal hosts, and internal hostnames
(localhost, *.local, single-label); DNS-resolve and reject if any resolved IP is private/internal/loopback/
link-local/shared/metadata (`127/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16` incl.
`169.254.169.254`, `100.64/10`, `0/8`, `::1`, `fc00::/7`, `fe80::/10`, IPv4-mapped IPv6). Hard timeout, 2 MB
size cap, `text/html`/`application/xhtml+xml` content-type allowlist. `crawl_snapshot` stores only safe,
bounded data (final URL, status, title, meta description, headings, capped visible text, counts, viewport/OG
flags, language, same-domain links). Raw HTML beyond the cap, scripts, styles, cookies, headers and binaries
are never stored. Residual note: per-hop re-resolution mitigates DNS rebinding; a socket-pinned agent would
remove the remaining TOCTOU window and can be added if needed.

## Generation workflow

From a `website_analysis` funnel detail (`/app/funnels/[id]`), a sales/admin user clicks Generate. The action
requires a linked contact (or an admin override with a reason). It creates a new version row (`queued`),
flips any prior current version to `is_current=false`, then runs the pipeline:
`queued → fetching → analyzing → succeeded | failed`. On success the report is stored with scores, markdown,
recommendations, token usage and cost, `review_status='review_needed'`, and the funnel advances forward to
`analyzed` (only from new/to_review/qualified/in_progress; never backward) with a `funnel.report_generated`
audit. On failure the row is `failed` with a safe `error_summary` and a Retry control (retry is allowed only
before success; Regenerate creates a new version).

## Review workflow

On `/app/website-reports/[id]`, reviewers see the scorecard, report body, recommendations, internal sales
note, the safe crawl summary, and token/cost. Approve or Reject sets `review_status` + `reviewed_at/by`.
Approve = ready for a future P15 send. There is **no send/PDF/public-link control** in P14.

## Cost / rate controls

Per-report cost ceiling (`WEBSITE_REPORT_MAX_COST`, fail-closed above it); one automatic repair retry on
invalid AI JSON then fail; max output tokens; input size guard (fail closed on oversized crawl); 2 MB fetch
cap; safe `error_summary` codes only. `cost_estimate` + `token_usage` are stored per report. No automatic or
bulk generation — one submission at a time, staff-initiated.

## Audit events

`website_report.generation_requested / fetch_started / fetch_failed / analysis_started / generated / failed /
reviewed / approved / rejected / archived / restored` (entity_type `website_report`), plus
`funnel.report_generated` (entity_type `funnel`). Metadata is safe only (domain, report id, version, model
provider/name, prompt_version, token counts, cost, duration, status transitions, and `override_reason` when
used). Never logged: the AI key, full prompt/response, full `report_json`/markdown, raw crawl HTML/text, raw
IPs, response headers, stack traces. Raw technical fields are gated by `audit.read_technical`.

## Manual smoke

1. Set `WEBSITE_REPORTS_ENABLED=true` and configure `AI_PROVIDER`/`AI_MODEL`/`ANTHROPIC_API_KEY`.
2. Create a `website_analysis` funnel submission; link or create a contact.
3. Generate; watch `queued → fetching → analyzing → succeeded`; verify scores + sections + sales note.
4. Approve one; reject another. Retry a failed one; regenerate a succeeded one and confirm a new version.
5. As sales, try generating without a contact → blocked; as admin, override with a reason → allowed.
6. Try a bad URL → safe failure. Try `http://127.0.0.1` / `http://169.254.169.254` → blocked, nothing fetched.
7. Confirm no email/PDF/public URL anywhere. Confirm read_only views only; sales cannot archive.
8. Confirm P13 ingestion, `/api/leads`, checkout, the Stripe webhook and old `/admin` are unchanged.

## Rollback

Code: revert the P14 commit. Flag: set `WEBSITE_REPORTS_ENABLED` unset/false to disable generation and hide
the controls without a deploy. Data: additive + isolated — `drop table public.website_analysis_reports;`
then delete the four `website_reports.*` permissions + their grants. No Stripe/billing rollback is involved.

## Deferred to P15 (not in P14)

PDF rendering, email/report delivery (via the existing outbox + Resend), open/click tracking, follow-up
tasks, quote/project creation, public report sharing, customer portal. The report is stored as validated JSON
+ markdown + scores so P15 can render and send without re-running the AI; `review_status='approved'` is the
P15 readiness signal.

## Unchanged by P14

`funnel_submissions` and P13 ingestion behavior, the CRM tables (no field mutation), `/api/leads`, checkout,
the Stripe webhook, P10/P11/P12 billing, and the legacy `/[locale]/admin`. P14 is additive: one new table,
one new module, new portal routes, new permissions, plus status/audit display additions.
