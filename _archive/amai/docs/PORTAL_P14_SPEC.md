# PORTAL P14 — Website Analysis Report Engine — Technical Specification

Status: specification only. Do not build. Do not create migrations. Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Part IV / V / VI (VI.9 WAF-2) plus the live Supabase schema and current repo, which override theoretical
names. P14 is the WAF-2 phase of the independent Website Analysis Funnel branch.

---

## 1. P14 objective

P14 turns a P13 `website_analysis` funnel submission into a structured, **internal** website analysis
report that staff review inside the portal. For a chosen submission, P14 (optionally) fetches the
submitted website under strict SSRF controls, runs an AI analysis that returns a schema validated JSON
report (scorecard + sections + impact/effort recommendations + an internal sales note), stores that report
against the submission, and exposes it for staff review with an approve / reject workflow.

Core principle: **P14 never delivers anything.** No email, no PDF, no public URL, no customer portal, no
quote/invoice. Generation is staff initiated, the result is reviewable and re-generatable, and approval
only marks a report ready for a future P15 delivery phase. P14 is additive and greenfield: a new table, a
new permission gated module, new server actions, new portal UI, no change to P13 ingestion, CRM tables,
checkout, Stripe or the legacy admin.

---

## 2. Current-state dependency check (inspected live + repo)

**P13 funnel layer (live + repo, unchanged by P14):**
- `public.funnel_submissions` (migration `0032`, live): 36 columns, `source_type` CHECK includes
  `website_analysis`; `status` CHECK 11 values; `spam_status`; nullable CRM links `contact_id →
  company_contacts`, `company_id → companies` (both `ON DELETE SET NULL`); `website_url`,
  `normalized_domain`; hashed `ip_hash` / `user_agent_hash`; consent flags; soft archive. RLS on, single
  `funnel_submissions_select` policy `has_permission('funnels.read') OR is_platform_super_admin()`, no write
  policies. P14 reads this table and writes only its own table.
- `/api/funnels/submit` (Node runtime, honeypot + rate limit + Turnstile + service role insert + best
  effort link). P14 does not touch it. P13 stores the URL but **does not fetch** it.
- `src/modules/funnels/{schema,types,status,guards,format,queries,ingest,actions}.ts`, `/app/funnels`,
  `/app/funnels/[id]`. P14 adds a generation entry point on the funnel detail page and reuses the funnels
  read permission for context.
- P13 runbook handoff: ingestion stays link only (no auto create, no overwrite); P14 report generation
  requires a linked or manually created contact, or an explicit approved staff override; P14 is the first
  phase that may fetch the website, so SSRF hardening is mandatory.

**CRM (live, source of truth, unchanged by P14):**
- `companies`: `id, company_name (NOT NULL), domain, website_url, email, contact_person, phone, city,
  canton, country (NOT NULL), language_pref (de/fr/it/en), industry, source (csv/manual/contact_form/
  daily_audit/external), notes, lead_status, lead_priority, crm_status (lead/qualified/active/dormant/
  lost/blocked/archived), owner_id, archived_at/by`. Note: `companies.lead_status` is a **separate
  outbound daily-audit pipeline** (imported … report_generated … approved_for_sending … sent). P14 is the
  **inbound funnel** report engine and must not reuse or mutate `companies.lead_status` (see §15 + Risks).
- `company_contacts`: `id, company_id (NOT NULL), name, email, phone, role, contact_status, is_primary,
  archived_at/by, created_by, updated_by`. A contact always belongs to a company.
- CRM link/create actions live in `src/modules/funnels/actions.ts` (`linkFunnelToContact/Company`,
  `createContactFromFunnel` requires a company, `createCompanyFromFunnel` uses `source='contact_form'`,
  fill empty only). P14 reuses these as is; it does not add CRM writes.

**Public website + locale (unchanged by P14):** `src/app/[locale]/…` with `next-intl` (DE default, FR, EN,
`localePrefix:'always'`), `SiteShell`, `Header`/`Footer`, public funnel page `/[locale]/website-analyse`.
P14 adds no public route and no public copy.

**API / server patterns (reused):** service role via `createAdminClient()`; server actions `'use server'`
→ zod → `requireAuth()` + `hasPermission()` → service role write → `logEvent` → `revalidatePath`; queries
`import 'server-only'`; `src/lib/security/ratelimit.ts` (`checkRateLimit`, `ipIdentifier`); `src/lib/
security/turnstile.ts`; `src/lib/validation.ts` (zod); `src/lib/env.ts` lazy getters.

**Audit / history (reused):** append only `audit_logs` via `logEvent()` (`src/lib/audit/log.ts`, RPC
`log_event`, fields `actorType`, `source`, `severity`, `oldStatus`/`newStatus`, `metadata`); display in
`src/lib/audit/display.ts` (`AUDIT_LABELS` / `AUDIT_COLORS`); raw before/after gated by
`audit.read_technical`; `getHistory` / `getHistoryTechnical`; `HistoryButton` / `HistoryTimeline` /
`TechnicalDetail`.

**Status helpers (reused):** `src/lib/status/colors.ts` tokens (`draft, sent, waiting, opened, done,
cancelled, revoked, failed, system, warning, critical`) + per entity token mappers; `StatusBadge` keyed by
a `StatusEntity` union.

**Storage (existing pattern, mostly deferred):** two **private** buckets `avatars` and `customer-documents`
with `supabase.storage.from(bucket).createSignedUrl(path, ttl)` (`src/modules/profile/queries.ts`). P14
stores the report in the DB (json + markdown) and needs **no** bucket. Screenshots / PDF / files are
deferred to P15 and would use a private bucket + signed URL then.

**Job / background pattern (exists):** a DB backed queue — `outbox` table + `src/lib/outbox/{enqueue,
worker}.ts` + `claim_outbox` / `complete_outbox` RPCs, driven by the `CRON_SECRET` guarded
`/api/cron/outbox` route (P1, Resend email). P14 can reuse this **shape** for async generation later; the
recommended first version is synchronous with hard guards (see §11).

**AI:** **no AI SDK is installed** (`package.json` checked). P14 introduces a thin server only provider
abstraction + one new secret. No provider code exists today.

**Untouched boundaries confirmed:** legacy `/api/leads`, `/api/checkout`, Stripe webhook, P10/P11/P12
billing tables, and `/[locale]/admin` are unrelated to P14 and stay byte unchanged.

**Migration number:** latest applied is `0032_funnel_submissions`. **Next is `0033`.**

---

## 3. Scope boundaries

**In scope (P14):**
1. A new `website_analysis_reports` table (greenfield, additive) linked to `funnel_submissions.id`.
2. Staff initiated generation for `source_type='website_analysis'` submissions only.
3. A strict, SSRF safe website fetch (homepage only by default) that extracts safe HTML / text / meta.
4. AI analysis producing a zod validated structured JSON report (scorecard + sections + impact/effort +
   internal sales note), with a markdown rendering derived from the validated JSON.
5. Report storage in the DB (json + markdown + numeric scores + crawl/input snapshots + cost/usage).
6. A two stage status model: generation lifecycle + staff review lifecycle, soft archive only.
7. Portal review UI: generate from funnel detail, full review on a report detail route, optional list.
8. Permission gated read RLS, service role writes, audit on every meaningful event.
9. Cost and rate control (caps, retries, size limits, cost/token capture, fail closed).
10. Robust error handling and a retry path.

**Out of scope (P14), deferred to P15 or later:**
- Automatic email sending, report delivery, follow up automation.
- **PDF generation is deferred to P15** (recommendation: yes, defer — see §4). The report JSON + markdown
  are stored so P15 can render a PDF without re-running AI.
- Public report sharing, any public report URL, customer portal.
- Automated quote / project / invoice / subscription creation.
- Stripe / checkout changes, P10/P11/P12 changes, invoice / payment reconciliation, accounting.
- Screenshots, headless browser rendering, multi page crawling beyond the small capped scope.
- Mutating `companies.lead_status` or any CRM field; removing the legacy admin; business table rewrites;
  hard deletes.

**Explicitly never (security floor):** crawling without the SSRF guard; storing raw secrets; exposing the
service role or AI key to the client; a public write path to the table.

---

## 4. Report model decision

**Create `website_analysis_reports`** (not a generic `funnel_reports`). P14 is specifically WAF-2; a named
table keeps the schema, scores and prompt versioning explicit and AI/report ready, and matches the master
plan VI.9 model (the live table it links to is `funnel_submissions`, per the authority rule, rather than the
theoretical `website_analysis_requests`).

- **Link:** `funnel_submission_id uuid NOT NULL → funnel_submissions(id) ON DELETE CASCADE` (a report has no
  meaning without its submission; cascade is acceptable because the submission is itself soft archived, not
  hard deleted, so cascade effectively never fires in normal operation). Plus nullable `company_id` /
  `contact_id` link columns **and** an `input_snapshot` JSON copy of the person/company at generation time,
  so the report is reproducible even if the CRM link later changes (SSOT preserved: the live CRM stays the
  source of truth; the snapshot is an immutable record of what was analysed).
- **Versioned: yes.** Regenerate is allowed and creates a **new row** (a new version), never an in place
  overwrite, so prior analyses stay auditable. Recommended shape: `version int NOT NULL` +
  `is_current boolean NOT NULL DEFAULT true`, with a **partial unique index** `… (funnel_submission_id)
  WHERE is_current` so exactly one current report per submission. Generating a new version flips the prior
  current row to `is_current=false` inside one service role transaction.
- **Regenerate allowed:** yes, gated by `website_reports.generate`. Use cases: first generation failed, the
  website changed, or staff want a fresh pass with a newer prompt version.
- **Report JSON stored in DB: yes.** `report_json jsonb` is the canonical validated structured output.
- **Rendered content:** store `report_markdown text` (deterministically rendered from the validated JSON,
  not free text from the model) for human review now and P15 rendering later. No HTML is stored (markdown is
  safer and P15 can render). Numeric scores are also denormalised into typed columns for sort/filter.
- **Screenshots / files: deferred** to P15 (private bucket + signed URL pattern already exists).

---

## 5. Data model proposal (`website_analysis_reports`)

Greenfield, additive. Final column finalisation at build time; proposed shape:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `created_at` / `updated_at` | timestamptz NOT NULL default `now()` | `touch_updated_at` trigger |
| `funnel_submission_id` | uuid NOT NULL → `funnel_submissions(id)` ON DELETE CASCADE | source submission |
| `version` | int NOT NULL default 1 | regenerate increments |
| `is_current` | boolean NOT NULL default true | partial unique per submission |
| `company_id` | uuid NULL → `companies(id)` ON DELETE SET NULL | link snapshot of CRM org |
| `contact_id` | uuid NULL → `company_contacts(id)` ON DELETE SET NULL | link snapshot of CRM person |
| `website_url` | text NOT NULL | copied from the submission at generation |
| `normalized_domain` | text NULL | copied from the submission |
| `generation_status` | text NOT NULL default `'queued'` | pipeline (see §6) |
| `review_status` | text NOT NULL default `'review_needed'` | staff lifecycle (see §6) |
| `model_provider` | text NULL | e.g. `anthropic` |
| `model_name` | text NULL | e.g. the configured model id |
| `prompt_version` | text NULL | e.g. `wa-report-v1` |
| `input_snapshot` | jsonb NOT NULL default `'{}'` | funnel + contact/company snapshot used as input |
| `crawl_snapshot` | jsonb NOT NULL default `'{}'` | safe extracted site data (see §8) |
| `report_json` | jsonb NULL | validated structured report (null until generated) |
| `report_markdown` | text NULL | rendered from `report_json` |
| `score_overall` | numeric(4,1) NULL | 0..100 (or 0..10); pick one scale at build |
| `score_seo` / `score_ux` / `score_conversion` / `score_performance` / `score_trust` / `score_content` / `score_mobile` | numeric(4,1) NULL | per axis scores for the radar |
| `recommendations` | jsonb NOT NULL default `'[]'` | impact/effort items (also inside `report_json`) |
| `internal_sales_notes` | text NULL | staff facing sales note (separate from the customer facing report) |
| `error_summary` | text NULL | safe, human readable failure reason |
| `cost_estimate` | numeric(8,4) NULL | estimated USD/CHF cost of the generation |
| `token_usage` | jsonb NOT NULL default `'{}'` | `{input, output, total}` token counts |
| `generated_at` | timestamptz NULL | set when generation succeeds |
| `reviewed_at` | timestamptz NULL | set on approve/reject |
| `reviewed_by` | uuid NULL → `profiles(id)` ON DELETE SET NULL | |
| `archived_at` / `archived_by` | timestamptz / uuid NULL → `profiles(id)` | soft archive only |
| `created_by` / `updated_by` | uuid NULL → `profiles(id)` ON DELETE SET NULL | actor provenance |
| `notes` / `internal_notes` | text NULL | free staff notes |

Decisions:
- **`organization_id`: deferred.** The live platform has org scaffolding (P0), but the funnels module is not
  org scoped; P14 follows the funnels precedent and omits `organization_id` for now (add later if multi org
  is activated). Open question flagged in §24.
- **Soft archive only.** No hard delete anywhere. `archived_at`/`archived_by` + a default `is current and not
  archived` list filter.
- **Contact requirement for generation:** by default the submission must have a `contact_id` (linked or
  manually created in P13). An **admin only override** is allowed and must record a justification in the
  audit metadata (`override_reason`), per the P13 handoff third option. The override is the only way to
  generate without a contact, and the report row still snapshots whatever CRM links exist. See §15.
- **Funnel snapshot:** at generation, copy `website_url`, `normalized_domain`, the funnel `first_name/
  last_name/email/payload/locale`, and resolved contact/company display fields into `input_snapshot`. The
  report is then reproducible and independent of later CRM edits, while the live CRM remains SSOT.

---

## 6. Status model

Two fields, mirroring the proven `subscriptions` precedent (`status` + `sync_status`) rather than one mega
enum. A single derived `StatusBadge` is shown in the UI.

**`generation_status` (machine pipeline):**

| Value | Meaning | Token |
|---|---|---|
| `queued` | created, not started | `draft` |
| `fetching` | SSRF safe fetch in progress | `waiting` |
| `analyzing` | AI call in progress | `opened` |
| `succeeded` | report produced + validated | `done` |
| `failed` | fetch or analysis failed (see `error_summary`) | `failed` |

**`review_status` (staff lifecycle, meaningful once `succeeded`):**

| Value | Meaning | Token |
|---|---|---|
| `review_needed` | awaiting staff review | `waiting` |
| `approved` | staff approved (ready for a future P15 send) | `done` |
| `rejected` | staff rejected (kept for the record) | `cancelled` |

Plus soft archive via `archived_at` (badge token `cancelled`, label "Archived").

- **Derived badge:** if archived → Archived; else if `generation_status` in {queued,fetching,analyzing,
  failed} show the generation token; else show the review token. Add a new `StatusBadge` entity
  `'website_report'` with a `websiteReportStatusToken(generationStatus, reviewStatus, archived)` mapper in
  `src/lib/status/colors.ts`.
- **Generation lifecycle:** `queued → fetching → analyzing → succeeded | failed`. A failed report can be
  retried (new attempt on the same row, or a new version — recommend in place retry on the same row while
  `generation_status` is not `succeeded`, to avoid version churn on transient failures).
- **Review lifecycle:** only a `succeeded` report can be approved or rejected. Approve/reject set
  `reviewed_at`/`reviewed_by`. Re generating supersedes the current version and resets the new row to
  `review_needed`.
- **Archive/restore:** archive sets `archived_at`/`archived_by` (hidden from default lists). Restore clears
  them and leaves `review_status` as it was. Never hard delete.

---

## 7. (Report model — folded into §4; numbering kept aligned with the prompt's status item) Status mapping summary

See §6. Key points: split generation vs review status, single derived badge, all transitions audited, soft
archive only, retry allowed pre success, regenerate creates a new version.

---

## 8. Website fetching / crawl design (SSRF safe, mandatory)

New server only helper `src/lib/security/url-guard.ts` + `src/modules/website-reports/fetch.ts`. The fetch is
the highest risk surface in P14 and is built defensively.

**URL acceptance:**
- Accept only `http` and `https`. Reject everything else (no `file`, `ftp`, `gopher`, `data`, `blob`,
  `javascript`, etc.).
- Normalise the URL (reuse / extend `normalizeDomain` from `src/modules/funnels/guards.ts`): lowercase host,
  strip credentials, default to `https://` when the stored value lacks a scheme.
- Reject userinfo (`user:pass@`), non standard ports (allow only 80/443), and raw IP literal hosts.

**DNS + network controls:**
- Resolve DNS first; reject if **any** resolved address is in a private, internal, loopback, link local,
  unique local or cloud metadata range: `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`,
  `169.254.0.0/16` (incl. `169.254.169.254`), `0.0.0.0/8`, `100.64.0.0/10`, `::1`, `fc00::/7`, `fe80::/10`,
  IPv4 mapped IPv6.
- Pin the connection to the validated IP and **re check after every redirect** (defeat DNS rebinding and
  redirect to internal). Reject redirects to a different host that fails the same checks.
- Limits: redirect limit (≤ 3), hard connect + read timeout (e.g. 8 s connect, 15 s total), maximum response
  size (e.g. 2 MB, abort on exceed), `content-type` allowlist (`text/html`, optionally `application/xhtml+
  xml`), reject anything else.
- Send a clear, honest User Agent identifying the analyser; respect an obvious block (a 401/403 is recorded
  as a fetch result, not retried aggressively). Do not bypass bot protection or CAPTCHAs.

**Scope (recommended P14):** **homepage only.** Optionally, behind a config flag (default off), up to **3
additional same domain pages** discovered from the homepage navigation, each re validated through the same
guard, with a global page cap and total byte cap. No deep crawl, no sitemap walk, no external assets.

**Extraction (what goes into `crawl_snapshot`):** safe, bounded text only — final URL, HTTP status, title,
meta description, `h1`/`h2`/`h3` headings, visible text (length capped, e.g. 20–40k chars), counts of
images/links/forms, presence of viewport/og tags, detected language, and the list of same domain links
considered. **Never stored:** full raw HTML beyond the cap, scripts, inline styles, cookies, response
headers with tokens, any private network response, screenshots, or binary assets.

**Errors:** every failure maps to `generation_status='failed'` with a safe `error_summary`
(`url_blocked_ssrf`, `dns_failed`, `timeout`, `too_large`, `bad_content_type`, `http_4xx/5xx`,
`unreachable`). No stack traces or raw network detail in stored fields or ordinary audit.

---

## 9. AI analysis design

New server only module `src/lib/ai/provider.ts` (provider abstraction) + `src/modules/website-reports/
generate.ts` (orchestration + prompt) + a zod report schema.

- **Provider abstraction:** a single interface `generateReport(input): Promise<{ json, usage, cost }>` with
  one configured implementation. Provider, model and key come from `env.ts` getters (`aiProvider`,
  `aiModel`, and a secret like `ANTHROPIC_API_KEY` or `OPENAI_API_KEY`). The key is **server side only**;
  never imported into a client component. Adds one dependency (official SDK) or a thin `fetch` client to the
  provider HTTP API to avoid heavy deps; decide at build (recommend the official SDK for safety).
- **Prompt versioning:** `prompt_version` (e.g. `wa-report-v1`) stored on each report; prompts live in repo
  (`src/modules/website-reports/prompts/`) so changes are reviewable and reports are reproducible.
- **Structured output + validation:** the model is instructed to return JSON matching a fixed schema; the
  result is parsed and validated with **zod** (`websiteReportSchema`). On schema failure: one repair retry
  with a stricter instruction; on second failure → `failed` with `error_summary='ai_invalid_output'`. Only
  validated JSON is stored in `report_json`; `report_markdown` is rendered deterministically from it.
- **Model settings:** low/medium temperature for consistency; max output tokens capped; input is the
  `crawl_snapshot` + funnel context, truncated to the input cap (see §16). Language: generate the report in
  the submission `locale` (de/fr/en) where present, else DE; flagged as an open question for the customer
  facing language vs internal language.
- **Cost caps + retry:** hard per report token/cost ceiling; at most 1 automatic retry for transient
  provider errors; capture `token_usage` + `cost_estimate` on every attempt. Fail closed if the input would
  exceed the cap.
- **Secrets + redaction:** never log the API key or full prompt/response at info level; log only safe
  metadata (model, prompt_version, token counts, duration, status). The crawl snapshot may contain third
  party site text — treat the whole report row as sensitive (see §10).
- **Fallback:** if AI fails, the row is `failed` with a safe summary and a retry action; no partial report
  is shown as if complete.

**Required report content (validated `report_json`, rendered to markdown):** executive summary; scorecard
(overall + per axis for the radar); first impression; positioning / message; conversion / lead generation;
UX / structure; visual / design impression; SEO / findability; performance / technical impression; trust /
proof; mobile impression; concrete improvement opportunities; impact vs effort recommendations (each item:
title, impact, effort, rationale); commercial conclusion; internal sales note (staff only, kept out of any
future customer facing render). This matches the master plan VI.9 report shape and the house quickscan
standard (12+ sections + radar scorecard + impact/effort matrix + separate internal sales note).

---

## 10. Permission model

New permissions (module `website_reports`):

| Permission | Purpose |
|---|---|
| `website_reports.read` | view reports + detail |
| `website_reports.generate` | start / retry / regenerate generation |
| `website_reports.review` | approve / reject |
| `website_reports.archive` | archive / restore |

Recommended grants (smallint roles: 1 admin, 2 analyst, 3 sales, 4 reviewer, 5 read_only):

| Role | read | generate | review | archive |
|---|---|---|---|---|
| admin | ✓ | ✓ | ✓ | ✓ |
| sales | ✓ | ✓ | ✓ | |
| analyst | ✓ | | ✓ | |
| reviewer | ✓ | | ✓ | |
| read_only | ✓ | | | |

Clarifications: **generation is admin + sales only** (cost bearing action); **review** is broad (admin,
sales, analyst, reviewer) so non sales staff can QA; **archive is admin only** (matches the funnels
precedent). The **contact override** (generate without a linked contact) is **admin only** even though sales
hold `generate`. No public access to any of this. No role editor UI is added.

---

## 11. RLS / security model

- Enable RLS. One **SELECT** policy: `has_permission('website_reports.read') OR is_platform_super_admin()`.
  **No INSERT/UPDATE/DELETE policies** — all writes go through service role server actions.
- No public direct writes; there is no public ingestion path for reports (unlike P13). Generation is
  portal, auth + permission gated.
- No client secrets: the AI key and service role stay server side; client components receive only display
  data.
- The report row can contain third party website text and AI output → **treat as sensitive**: ordinary
  audit metadata never includes the raw crawl payload, full report text, secrets or token strings;
  `crawl_snapshot` / `report_json` raw values are surfaced only through `audit.read_technical` gating where
  relevant. No public report URL exists.
- Probe at build: a permission less authenticated user gets 0 rows; an admin gets the row (rolled back),
  exactly like the P13 RLS probe.

---

## 12. Server actions / job model

Module `src/modules/website-reports/`:

- `generateWebsiteAnalysisReport(funnelSubmissionId, { overrideNoContact? })` — `website_reports.generate`;
  validates the submission is `source_type='website_analysis'` and (contact linked **or** admin override);
  creates/queues a report version, runs fetch → AI → validate → store, sets `succeeded`/`failed`.
- `retryWebsiteAnalysisReport(reportId)` — `website_reports.generate`; only when not `succeeded`.
- `regenerate` is `generateWebsiteAnalysisReport` again → new version, supersedes current.
- `reviewWebsiteAnalysisReport(reportId, decision)` — `website_reports.review`; `approved`/`rejected`,
  sets `reviewed_at/by`.
- `updateWebsiteAnalysisReportNotes(reportId, {notes, internalNotes, internalSalesNotes})` — recommend
  gating note edits under `website_reports.review` (or a dedicated cap); fill any field.
- `archiveWebsiteAnalysisReport` / `restoreWebsiteAnalysisReport` — `website_reports.archive`.
- `getWebsiteAnalysisReport(id)` / `listWebsiteAnalysisReports(filters)` — `website_reports.read`,
  service role, archived hidden by default, 25/page, sanitised search.

**Sync vs async (recommendation):** **synchronous first**, inside the generate action, with hard guards:
a total time budget (fetch ≤ ~15 s, AI ≤ ~45 s), a cost cap, and immediate `failed` on breach. The
`generation_status` column is written through the pipeline (`queued → fetching → analyzing → succeeded/
failed`) so the model is already async ready. **Platform note:** if the deployment function timeout is too
low for a synchronous fetch + AI call (Vercel Hobby ~10 s; Vercel Pro ~60 s; Cloudflare Workers/Pages
limits differ), do not rely on a long lived request. The forward compatible upgrade path — **no schema
change** — is to leave the report at `queued` and let a `CRON_SECRET` guarded route drive it, reusing the
existing `outbox` claim/complete pattern (`claim_outbox`-style `claim_report_jobs`), since that
infrastructure already exists. **No new background cron dependency is required for the first version**; the
synchronous path with guards is the recommended default, with the queued+cron path documented as the
scale/timeout fallback.

---

## 13. Portal UI / routes

Recommended: **both** a funnel side entry point and a dedicated report area.

- **Funnel detail (`/app/funnels/[id]`):** add a "Website analysis report" panel — a **Generate report**
  button (gated `website_reports.generate`, enabled only for `source_type='website_analysis'` and a linked
  contact, with an admin only "generate without contact" override), the current report status badge, and a
  link to the report detail. A failed state shows the safe error + a Retry button.
- **`/app/website-reports/[id]` (report detail):** full review surface — source funnel + contact/company
  links, website + final fetched URL, status (generation + review), scorecard (overall + radar axes),
  rendered report sections (markdown), impact/effort recommendations, internal sales note, `crawl_snapshot`
  summary (safe fields only), cost/token usage, error state + retry, approve/reject controls (gated
  `website_reports.review`), notes editors, archive/restore (gated `website_reports.archive`), and the audit
  `HistoryButton`/timeline. **No send/deliver/PDF button in P14** (omit it entirely, or show it disabled with
  a "available in P15" hint — recommend omit to avoid implying a capability).
- **`/app/website-reports` (list, optional but useful):** filters by review/generation status, owner,
  domain, date; search by email/domain; archived toggle; pagination; whole row clickable. Add a Topbar nav
  entry gated on `website_reports.read`.

Read only roles see everything but no action controls; sales can generate/review but not archive; the badge
and gating come from the shared status + RBAC helpers.

---

## 14. Relationship with P13

- Reports can be generated **only** for `funnel_submissions.source_type='website_analysis'`.
- Generation requires a **linked contact** (P13 link or manually created from the funnel) or an **admin
  override** with a recorded reason. P13 ingestion behaviour is **unchanged**: still link only, no auto
  create, no overwrite.
- The funnel snapshot (URL, domain, name, email, payload, locale, resolved CRM links) is copied into
  `input_snapshot` at generation time.
- **Funnel status update:** optionally, on first successful generation, advance the funnel
  `funnel_submissions.status` from e.g. `qualified`/`in_progress` to `analyzed` (an existing P13 status
  value), via the existing funnels service role path, and emit `funnel.report_generated`. Recommend making
  this an explicit, audited side effect (not a silent overwrite) and only moving forward, never backward.
  Flagged as a small open decision in §24.
- No CRM field is written by P14. `companies.lead_status` (the separate outbound audit pipeline) is **not**
  touched.

---

## 15. Audit / history

New events in `src/lib/audit/display.ts` (`AUDIT_LABELS` + `AUDIT_COLORS`), `entity_type='website_report'`,
`entity_id=website_analysis_reports.id`:

| Event | Severity / token |
|---|---|
| `website_report.generation_requested` | system |
| `website_report.fetch_started` | system |
| `website_report.fetch_failed` | warning/revoked |
| `website_report.analysis_started` | system |
| `website_report.generated` | done |
| `website_report.failed` | warning/revoked |
| `website_report.reviewed` | system |
| `website_report.approved` | done |
| `website_report.rejected` | warning |
| `website_report.archived` | revoked |
| `website_report.restored` | done |

Plus `funnel.report_generated` on the funnel entity when a report is first produced (useful cross link).

- **Safe metadata only:** funnel_submission_id, report id, version, domain, model_provider/name,
  prompt_version, token counts, cost_estimate, duration, status transitions, and (for the override)
  `override_reason`.
- **Forbidden in ordinary metadata:** the AI key, full prompt/response text, full `report_json`/markdown,
  raw `crawl_snapshot` HTML/text, raw IPs, response headers, stack traces.
- Raw before/after and any large technical blob are surfaced only under `audit.read_technical` via the
  existing `getHistoryTechnical` path. Cost/token usage is treated as safe summary metadata.

---

## 16. Cost / rate control

- **Generation caps:** per user and global per hour/day limits (reuse `checkRateLimit` with a
  `website_reports` bucket on the actor id), e.g. N per hour, M per day; deny with a clear message when
  exceeded. No automatic bulk generation; one submission at a time.
- **Retry cap:** at most 1 automatic provider retry; manual retry stays available but is itself rate
  limited.
- **Size limits:** max fetch response size (≈2 MB), max extracted text (≈20–40k chars), max AI input tokens
  and max output tokens — **fail closed** (`failed`, `error_summary='input_too_large'`) rather than
  truncating silently into a misleading report.
- **Cost capture:** store `cost_estimate` + `token_usage` per report; a hard per report cost ceiling aborts
  generation. Model selection via env so a cheaper model can be set without a deploy of code.
- A config flag `env.websiteReportsEnabled` (default off) gates the whole feature so it can ship dark and be
  enabled per environment.

---

## 17. Relationship with future P15

- P15 owns PDF rendering, email/report delivery (via the existing `outbox` + Resend), open/click tracking,
  follow up tasks, and any conversion to a quote/project. None of that is in P14.
- P14 stores the report as validated JSON + markdown + scores so P15 can render and send **without** re
  running the AI. `review_status='approved'` is the explicit P15 readiness signal.
- A future `report_sent`/delivery state belongs to P15 and is out of scope here (note: P13 already reserves
  `report_sent` on the funnel status for this).

---

## 18. Legacy / checkout / billing boundaries (confirmed)

No change to: `/api/leads`, `/api/checkout`, the Stripe webhook, P10/P11/P12 (orders, payments, payment
links, subscriptions, subscription changes), invoices/payments/subscriptions, accounting, the legacy
`/[locale]/admin`, or any business table. P14 is additive: one new table, one new module, new portal routes,
new permissions, plus audit/status display additions. No destructive migration.

---

## 19. Migration plan (to be written at build, not now)

`supabase/migrations/0033_website_analysis_reports.sql` (next number after `0032`). Additive, greenfield,
non destructive, with `-- ROLLBACK:` comments per object (table, indexes, policy, permissions, grants),
following the `0032` style. It will include:
- `create table if not exists public.website_analysis_reports ( … )` with the §5 columns.
- CHECKs: `generation_status in (queued,fetching,analyzing,succeeded,failed)`; `review_status in
  (review_needed,approved,rejected)`; score ranges if a fixed scale is chosen; `version >= 1`.
- FKs: `funnel_submission_id → funnel_submissions(id) ON DELETE CASCADE`; `company_id → companies(id)`,
  `contact_id → company_contacts(id)`, `reviewed_by`/`archived_by`/`created_by`/`updated_by` → `profiles(id)`
  all `ON DELETE SET NULL`.
- Indexes: `funnel_submission_id`; partial unique `(funnel_submission_id) WHERE is_current`; `generation_
  status`; `review_status`; `normalized_domain`; `created_at DESC`; active partial `(review_status) WHERE
  archived_at IS NULL`.
- `touch_updated_at` BEFORE UPDATE trigger.
- RLS enable + the single SELECT policy (§11); no write policies.
- Seed permissions `website_reports.read/generate/review/archive` (`on conflict (key) do nothing`) and
  idempotent role grants per §10.
- Mirror to `supabase/migrations/`, hand maintain `src/lib/types/database.ts`, append to
  `supabase/migrations/README.md`.

---

## 20. Files likely to create / update

Create:
- `supabase/migrations/0033_website_analysis_reports.sql`
- `src/modules/website-reports/{schema,types,status,guards,format,queries,actions,generate,fetch}.ts`
- `src/lib/security/url-guard.ts` (SSRF guard, server only)
- `src/lib/ai/provider.ts` (+ `src/modules/website-reports/prompts/wa-report-v1.ts`)
- `src/app/(portal)/app/(protected)/website-reports/page.tsx` + `[id]/page.tsx`
- `src/components/portal/website-reports/{WebsiteReportTable,WebsiteReportDetail,GenerateReportButton,ScoreRadar}.tsx`
- `PORTAL_P14_RUNBOOK.md`, optional `PORTAL_P14_SPEC.md` (this doc)
- tests under `src/modules/website-reports/` + `src/lib/security/`

Update:
- `src/lib/status/colors.ts` (`websiteReportStatusToken`) + `src/components/portal/ui/StatusBadge.tsx`
  (`'website_report'` entity)
- `src/lib/audit/display.ts` (the `website_report.*` + `funnel.report_generated` events)
- `src/lib/env.ts` (`websiteReportsEnabled`, `aiProvider`, `aiModel`, AI key getter, caps)
- `src/components/portal/shell/Topbar.tsx` (gated nav entry)
- `src/app/(portal)/app/(protected)/funnels/[id]/page.tsx` + a `GenerateReportButton` integration
- `src/lib/types/database.ts`, `.env.example`, `supabase/migrations/README.md`

---

## 21. Tests

- **Migration / RLS:** columns/checks/FKs/indexes/trigger present (live introspection at build); RLS
  deny (permission less → 0 rows) / allow (admin → 1 row) probe.
- **Permissions:** each action gates the exact permission; generate is admin/sales only; archive admin only;
  override admin only.
- **SSRF guard (critical):** blocks `file:`/`ftp:`/`data:`; blocks `localhost`, `127.0.0.1`, `10.x`,
  `192.168.x`, `169.254.169.254`, `::1`, IPv4 mapped IPv6; blocks redirect to an internal host; enforces
  redirect/timeout/size/content-type limits; allows a normal public `https` host (mocked).
- **URL normalization:** scheme defaulting, host lowercasing, port + userinfo rejection.
- **Fetch limits:** timeout, oversize, bad content type each yield the right `failed` summary.
- **AI schema validation:** valid JSON passes; malformed JSON triggers one repair then `failed`; markdown is
  rendered only from validated JSON; provider key never present in client bundle.
- **Generation success/failure + retry:** mocked provider; success stores json/markdown/scores/usage;
  failure stores safe `error_summary`; retry allowed only pre success; regenerate creates a new version and
  flips `is_current`.
- **Contact required / override:** generation blocked without a contact; admin override records
  `override_reason`; non admin cannot override.
- **No delivery:** there is no email/PDF/send/public-URL action anywhere in the module (source scan).
- **Audit metadata safe:** no key, no raw crawl/report dump, no raw IP, no secret in ordinary metadata.
- **Cost caps:** rate limit + cost ceiling enforced; input-too-large fails closed.
- **Isolation:** no service role import in client components; no checkout/Stripe/leads/P10-12 change (source
  scan + diff); P1–P13 regression suite stays green.
- **Build gates:** `npx tsc --noEmit` clean; full `vitest`; `npm run build` EXIT 0; advisors zero new.

---

## 22. Manual smoke checklist

1. Create a `website_analysis` funnel submission (public form) and confirm it lands in `/app/funnels`.
2. Link or create a contact from the funnel detail.
3. Generate a report; watch status move `queued → fetching → analyzing → succeeded`.
4. Open the report detail; verify scorecard (radar), all sections, impact/effort items, internal sales note,
   cost/token usage, and the safe crawl snapshot summary.
5. Review: approve, then (on another) reject; verify `reviewed_at/by` + audit events.
6. Failure path: submit an unreachable / bad URL and confirm a safe `failed` state + Retry.
7. SSRF: attempt generation against a local/private URL (e.g. `http://127.0.0.1`, `http://169.254.169.254`)
   and confirm it is blocked with `url_blocked_ssrf` and nothing is fetched.
8. Retry a failed report; regenerate a succeeded report and confirm a new version supersedes the old.
9. Confirm there is **no** send / PDF / deliver / public link anywhere.
10. Permissions: sales can generate/review but not archive; read_only can view only; only admin can override
    the contact requirement.
11. Confirm P13 ingestion unchanged; `/api/leads`, checkout and Stripe/P12 unchanged; legacy `/admin`
    untouched.

---

## 23. Rollback plan

- **Code:** revert the P14 commit(s); the funnels module and P13 are independent and unaffected.
- **Feature flag:** set `WEBSITE_REPORTS_ENABLED` (default off) to disable generation and hide the UI
  without a deploy.
- **Migration:** additive only; to remove, `drop table public.website_analysis_reports;` then delete the
  four `website_reports.*` permissions + their grants (rollback comments in the migration). No other table
  references it (cascade is one way from the funnel). No Stripe/billing rollback is involved.
- **Data:** soft archive only in normal operation; no hard deletes to undo.

---

## 24. Risks and open questions

- **SSRF / security (highest):** the fetch path must be implemented exactly as §8; the guard + redirect re
  validation + DNS pinning are mandatory and heavily tested. Decision: confirm homepage only for P14 (vs
  homepage + ≤3 pages behind a default off flag).
- **AI cost + hallucination + report quality:** scores and claims are AI generated and may be wrong; the
  report is explicitly **internal and review gated** before any future send. Decision: per report cost
  ceiling + model choice; consider a short "AI generated, verify before sending" banner in the UI.
- **Legal / privacy / website terms of service:** fetching a third party site for analysis — keep to a
  single page, honest UA, respect blocks, do not bypass protections, store minimal text. Decision: confirm
  this posture is acceptable; note GDPR/Swiss DPA — the report concerns a business website + an opted in
  lead.
- **Multilingual report language:** generate in the submission locale vs always an internal language.
  Decision needed.
- **Contact required vs override:** recommended default = contact required, admin only audited override.
  Confirm.
- **Synchronous vs async generation:** recommended = synchronous with guards now, queued+cron fallback if
  the platform function timeout is too short. Confirm the deployment target (Cloudflare vs Vercel tier) so
  the timeout budget is set correctly.
- **`organization_id`:** deferred (funnels precedent). Confirm multi org is not required for P14.
- **Funnel status side effect:** whether a successful report advances the funnel to `analyzed`. Recommend
  yes, forward only, audited. Confirm.
- **Versioning churn:** regenerate creates versions; confirm we keep all versions (recommended) vs cap.
- **Future P15 / screenshots / browser rendering:** explicitly deferred; flagged so the schema (json +
  markdown + scores) is already P15 render ready.

---

## 25. Final readiness checklist

- **P14 spec ready:** **Yes** — grounded in the live schema (next migration `0033`, no AI SDK yet, outbox/
  cron + private bucket + signed URL patterns available) and the P13/CRM/audit/status conventions.
- **Blockers:** none to writing/approving the spec. Build is blocked only on the decisions below.
- **Decisions needed before build:**
  1. Crawl scope: homepage only (recommended) vs homepage + ≤3 pages (flagged).
  2. AI provider + model + which secret env var, and the cost ceiling.
  3. Report language policy (submission locale vs internal).
  4. Contact requirement: confirm "required, admin only audited override".
  5. Generation execution: synchronous + guards (recommended) vs queued + cron; tied to the deployment
     target / function timeout.
  6. Score scale (0..100 vs 0..10) and whether to advance the funnel status on success.
- **Recommended safe defaults:** feature flag default off; homepage only fetch; strict SSRF guard;
  synchronous generation with hard time + cost caps; contact required with admin override; versioned
  reports, soft archive only; report stored as validated JSON + derived markdown; PDF/email/delivery
  deferred to P15.
- **Exact approval question before P14 build:**

  > "Approve P14 Website Analysis Report Engine as specified: greenfield `website_analysis_reports`
  > (migration `0033`, RLS read gated on `website_reports.read`, service role writes only), versioned
  > reports linked to `website_analysis` funnel submissions; admin/sales generate, broad review, admin only
  > archive + contact override; strict SSRF safe **homepage only** fetch; AI analysis with zod validated
  > structured JSON → derived markdown, prompt versioning, cost/token caps and fail closed; portal review UI
  > on the funnel detail + a `/app/website-reports` area with approve/reject; synchronous generation behind
  > hard time/cost guards (queued+cron documented as the timeout fallback); audit `website_report.*` events
  > with safe metadata; feature flag default off. No email, no PDF, no public URL, no delivery (deferred to
  > P15); no P13 ingestion, CRM, checkout, Stripe, P10–P12 or legacy admin change. Confirm the six build
  > decisions (crawl scope, AI provider/model/secret + cost ceiling, report language, contact override,
  > sync vs cron + deployment target, score scale + funnel status side effect)."

Stop after the P14 specification. Do not build, and do not create migrations, until this is approved.
