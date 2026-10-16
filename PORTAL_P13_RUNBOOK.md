# PORTAL P13 Runbook — Website Sales Funnels / Lead Magnets to CRM

Operator guide for the P13 feature. Pairs with `PORTAL_P13_SPEC.md` (design) and
migration `supabase/migrations/0032_funnel_submissions.sql`.

## What shipped

A public lead magnet (Free Website Analysis) that captures a visitor on the marketing site
and lands the submission in a new internal **funnels** module, where staff triage it and
link or create a CRM contact or company. The CRM stays the source of truth: the funnel never
overwrites a contact or company, and creating from a submission fills empty fields only.

Only the **Free Website Analysis** form is exposed publicly. Three more sources
(`website_cost_calculator`, `strategy_call`, `maintenance_security_scan`) are modelled in the
same table and status set, ready for later phases, with no public surface yet.

Public entry points (DE/FR/EN, no Dutch public locale):

- Page `/[locale]/website-analyse` (copy + form).
- Header navigation entry (Website Analyse / Analyse du site / Website analysis).
- Footer "Free tools" group link.

Portal (gated on `funnels.read`):

- `/app/funnels` list (search, source/status/spam/owner/company filters, archived toggle, paging).
- `/app/funnels/[id]` detail (snapshot, attribution, CRM link + create, status, owner, notes,
  archive/restore, duplicate hint, history).
- Topbar "Funnels" entry.

## Data and pipeline

- New table `public.funnel_submissions` (migration `0032`). RLS on; one read policy
  `funnel_submissions_select` = `has_permission('funnels.read') or is_platform_super_admin()`.
  No write policies: every write is a service role server action.
- Public ingest: `POST /api/funnels/submit` validates with `funnelSubmitSchema`, drops on the
  `companyUrl` honeypot, rate limits per IP (10 / hour) and per email (5 / hour), verifies
  Turnstile, then `ingestFunnelSubmission()` inserts the row and best effort links to an
  existing contact (by email) or company (by domain) when there is exactly one match. It never
  creates CRM rows from the public path.
- Only hashed IP and User Agent are stored (`ip_hash`, `user_agent_hash`, salted with
  `RATE_LIMIT_SALT`). Privacy consent is recorded; the API always answers `{ ok: true }` on a
  valid passing request so it never reveals whether a contact already exists.

## Permissions (seeded by migration 0032)

`funnels.read`, `funnels.update`, `funnels.assign`, `funnels.archive`. Grants: admin gets all
four; sales gets read, update, assign; the other roles get read. CRM create actions reuse the
existing `companies.create` / `contacts.create` permissions on top of `funnels.update`.

No environment variables are added in P13. It reuses the existing Turnstile keys
(`TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) and `RATE_LIMIT_SALT`. With Turnstile
unconfigured the verifier fails safe (open) exactly as `/api/leads` does today.

## Smoke test

1. Visit `/de/website-analyse` (also `/fr` and `/en`), submit Vorname, Name, Email, Website with
   the privacy box ticked. Expect the success panel.
2. In the portal as an admin, open `/app/funnels`. The submission appears with status New.
3. Open it. Confirm the snapshot, any auto link, and the duplicate hint when you submit the same
   email twice.
4. Link or create a company, then create a contact, set a status, assign an owner, add notes.
   Each action shows a saved or linked confirmation.
5. Archive, confirm it leaves the default list, toggle Show archived, restore it.
6. Honeypot: a POST to `/api/funnels/submit` with a non empty `companyUrl` returns `{ ok: true }`
   and writes nothing.

## Verification (all green on delivery)

- `npx tsc --noEmit` clean.
- `npx vitest run` 323 tests pass (27 new in `src/modules/funnels/funnels.test.ts`).
- `npm run build` exit 0, 122 / 122 static pages, all four P13 routes present.
- Security advisors unchanged from baseline (6 INFO `rls_enabled_no_policy`, 11 WARN
  security definer). `funnel_submissions` is not flagged: it has its read policy.
- RLS probe: a permission less user sees 0 rows; an admin sees the row.

## Rollback

Code: revert the P13 commit. Data: the table is additive and isolated. To remove it,
`drop table public.funnel_submissions;` then delete the four `funnels.*` permission rows and their
role grants. Nothing else references the table. `/api/leads`, `/api/checkout`, the Stripe webhook
and the billing tables are untouched by P13.

## Out of scope (not in P13)

No AI, no website crawling, no PDF generation, no email automation, no checkout or Stripe change,
no edits to `/api/leads` or the legacy `/[locale]/admin`. Those remain for later phases.

## P14 / WAF-2 crawling security note (forward-looking, documentation only)

P13 (WAF-1) **does not crawl, fetch or scan** the submitted website. The public ingestion path
stores the submitted URL and a normalized domain only, so there is no server-side request to an
attacker-controlled address and therefore **no SSRF surface** today. This note is documentation for
the future phase; nothing here is implemented in P13.

If P14 (WAF-2) adds server-side website analysis that fetches the submitted URL, that fetch must be
hardened against SSRF before it ships:

- allow only the `http` and `https` schemes; reject everything else (no `file`, `ftp`, `gopher`,
  `data`, `blob` or other non-web protocols, and no fetching of local files).
- block private, internal, loopback, link-local and cloud-metadata address ranges (for example
  `127.0.0.0/8`, `10/8`, `172.16/12`, `192.168/16`, `169.254/16` incl. `169.254.169.254`, `::1`,
  `fc00::/7`, `fe80::/10`).
- resolve DNS first and re-check the resolved IP against those blocklists, then pin/connect to the
  validated address to defeat DNS-rebinding (re-validate after every redirect hop).
- enforce a strict redirect limit, hard connect/read timeouts, a maximum response size and an
  allowed `content-type` set; abort as soon as any limit is exceeded.
- run server-side only (never from the browser), and log only safe metadata (status, host, bytes,
  duration) — never response bodies, secrets or raw IPs.

This must be designed and approved as part of the P14 spec; do not add crawling in P13.

## P14 handoff — contact-link decision

P13 public ingestion is intentionally **link-only**: it links to exactly one matching CRM contact
(by email) or company (by domain) and otherwise leaves the submission **unlinked**. It **never
auto-creates** a contact or company and never overwrites CRM fields. Staff link or create from the
funnel detail view (create is gated by `contacts.create` / `companies.create`, fill-empty-only).

Because a submission can be unlinked, **P14 report generation must not assume a contact/request
link already exists.** Before a report is generated for a submission, P14 must require one of:

- a linked existing CRM contact, or
- a contact manually created from the funnel (which also links it), or
- an explicit staff override, only if the future P14 spec approves that path.

This resolves the audit finding that WAF-2 may assume a contact/request link while P13 deliberately
allows unlinked submissions. The P13 public ingestion behavior is **not** changed by this note — it
remains link-only, no auto-create, no overwrite.
