# AMAI PORTAL — MASTER PLAN

> Single source of truth for the amai.ch internal platform (`/app`, English-only).

> # CURRENT STATE — READ FIRST (v7, AUTHORITATIVE — updated 14.06.2026)
>
> **The core back-end (P0–P12) and the Website Analysis Funnel (P13–P18 + WAF-4 auto-pilot) are BUILT and DEPLOYED. The full auto-pilot is now LIVE on production and verified end to end: a public website-analysis submission auto-generates the Opus quickscan, an external weasyprint service renders the branded PDF, and it is auto-emailed to the prospect. P16 (delivery/bounce) + P17 are switched on. Vercel is on Pro; the outbox cron runs every 5 minutes.**
>
> **Core platform — built, reviewed, on the live schema (additive migrations through `0031`):**
> - **P0 Foundation · P1 Auth (live smoke-tested) · P2 Profile+Avatar · P3 User Mgmt + History · P3.5 UX · P4 Hardening/archive/anonymize.**
> - **P5 CRM · P6 Projects · P7 Catalog · P8 Quotes · P9 Invoices · P10 Payments · P11 Stripe Payment Links · P12 Subscriptions (A registry/link · B1 change-requests · B2 execution · C webhook-reconciliation).** Each: additive migration, status machine + `StatusBadge`, permission-gated read RLS, audited service-role writes; business tables + old `/admin` untouched.
>
> **Website Analysis Funnel — marketing→CRM branch (Ring E, §VI.9). Migrations `0032`–`0036` applied (`0036` = allow the outbox `report_generation` channel); next is `0037`:**
> - **P13 Lead Capture (WAF-1) — BUILT, AUDITED, LIVE ON PRODUCTION.** Public "Free website analysis" form → a `funnel_submissions` row tagged "Free website analysis" → a best-effort operator notification email via Resend. Migration `0032`. (Commit `e70eec4` added the operator email + the tag.)
> - **P14 AI Report Engine (WAF-2)** — **LIVE** (`WEBSITE_REPORTS_ENABLED=true`). Migration `0033`. SSRF-guarded fetch + Anthropic `claude-opus-4-8` (~$0.09/report; cap `WEBSITE_REPORT_MAX_COST=1.5`). Fixes 14.06: drop deprecated `temperature` (caused HTTP 400), `max_tokens` 4500→7000 (was truncating the JSON), looser content schema.
> - **P15 Report Delivery & Follow-up (WAF-3)** — **LIVE** (`WEBSITE_REPORT_DELIVERY_ENABLED=true`). Migration `0034` + private `website-reports` bucket. PDF attached (no link). Email now multipart text+HTML + `Reply-To: hello@amai.ch` + List-Unsubscribe (deliverability).
> - **P16 Email Engagement Tracking (WAF-3.1)** — **LIVE** (`ENABLE_RESEND_WEBHOOK=true`; Resend webhook → `https://amai.ch/api/webhooks/resend`, signature-verified, returns `{received:true}`). Migration `0035`. Delivered/bounce/complaint recorded in `resend_events` + on the delivery; open/click still OFF (`ENABLE_EMAIL_OPEN_CLICK_TRACKING`) pending a privacy sign-off.
> - **P17 Follow-up Worklist & Insights (WAF-3.2)** — **LIVE** (`ENABLE_FOLLOWUP_WORKLIST=true`). `/app/website-reports/follow-ups`. Read-only, zero-schema, reuses the P15 follow-up actions.
> - **P18 WAF Go-Live Readiness** — done: consolidated `PORTAL_P18_GOLIVE_RUNBOOK.md` (pre-flight checklist + ordered non-prod→prod enablement + per-flag rollback) + a 4-char lint cleanup. Per-phase docs: `PORTAL_P13`…`PORTAL_P18`.
> - **WAF-4 Auto-pilot (auto-generate + auto-send)** — **LIVE + VERIFIED end to end (14.06.2026).** `AUTO_GENERATE_ENABLED=true` · `AUTO_SEND_ENABLED=true` · `AUTO_GENERATE_DAILY_CAP=10`. A public `website_analysis` submit enqueues an outbox `report_generation` job; the 5-minute cron worker re-checks the cost policy (daily cap + 30-day per-domain dedup, **succeeded-only**) BEFORE the P14 pipeline, system-approves, renders the **exact branded quickscan PDF via an external Python/weasyprint service** (`services/quickscan-pdf`, hosted on **Render Starter**; `PDF_SERVICE_URL` + `PDF_SERVICE_SECRET`) and auto-emails it to the submitter (**never** auto-creating a CRM row). System reports = `created_by IS NULL`. The cron runs the outbox **twice per tick** (generate, then send). Worst-case spend/day ≈ cap × cost-cap. The public request never runs AI. **Requires Vercel Pro** — a full Opus report exceeds Hobby's 60s function limit (`maxDuration=300`).
>
> **Production / deploy:** Vercel project **`amai-ops-twxd`** (serves **amai.ch**) ← GitHub `tomdevree1-ux/Amai.ch`, auto-deploy on push to `main`. **On Vercel Pro** (required — Opus generation exceeds Hobby's 60s). Outbox cron **every 5 min** (`*/5 * * * *`) with `maxDuration=300`. A second Vercel project `amai-ops` (repo `amai-ops`, on `*.vercel.app`) is a **stale leftover — ignore it**. Prod env lives in Vercel (Redeploy after any change), NOT `.env.local`. Supabase ref `bkwwlmflsbhrsfwydbnv`. Resend domain `amai.ch` verified (SPF via `send.amai.ch`, DKIM, DMARC — DMARC is strict-aligned `aspf=s;adkim=s`; optional relax to `r;r`). Report sender `hello@amai.ch` (`LEAD_NOTIFICATION_FROM`). External PDF renderer on **Render Starter**. Portal gated by `PORTAL_ENABLED`; entry `/app/login`. CRON_SECRET guards `/api/cron/outbox` (manual run: `curl -X POST .../api/cron/outbox -H "Authorization: Bearer $CRON_SECRET"`).
>
> **Status 14.06.2026 — the funnel + auto-pilot are LIVE and working.** Verified end to end: submission → Opus quickscan → weasyprint PDF (~290 KB) → auto-email (delivery `sent`, ~$0.09, ~67 s). Guards live: Turnstile + IP(10/h)/email(5/h) rate limits, **30-day per-email cooldown** (dated notice on the form) + **30-day per-domain dedup** (succeeded-only), daily cap 10, per-report cost cap 1.5. The funnel shows a "report within 24h" popup (OK to dismiss). **Email warmup in progress** — a brand-new sending domain, so first sends can hit spam (auth is correct: SPF/DKIM/DMARC all pass); fix = mark not-spam + a few days + optional DMARC alignment relax. **Remaining / next:** open/click tracking (needs a privacy sign-off), **Playwright E2E** (not started — must run against a Vercel **preview**, never prod, or a real submit triggers a paid report), **Stripe online card payments** (still "request" mode until a Stripe account + keys + webhook are wired — `STRIPE_SETUP.md`).
>
> **Status 17.06.2026 — portal performance, legacy `/admin` retirement, clean-slate prep:**
> - **Performance:** Vercel functions pinned to **`fra1`** in `vercel.json` (co-located with Supabase Frankfurt; the dashboard Function Region had been `iad1`/US, so every auth/DB call was transatlantic — the real cause of portal slowness, since tables are near-empty + indexed). Plus portal-wide round-trip cuts: protected layout resolves avatar + permissions in parallel; **79** per-page `has_permission` RPCs replaced by the one request-cached `getUserPermissions()` set + `.includes()`; 7 detail getters + the list-query name-resolvers parallelized; detail pages fold the history read + gated payment reads into `Promise.all`. tsc clean; 66 portal + all changed module suites green.
> - **Legacy `/admin` RETIRED.** Deleted `src/app/[locale]/admin/*`, `src/components/admin/*`, `src/lib/admin/*` (kept the shared service-role `src/lib/supabase/admin.ts`). Contact + start-modal **leads now live in the new portal** at `/app/leads` — permission-gated (`leads.read`/`leads.manage`, migration `0038`, RLS select policy), with list + search/status/form filters + inline message + a status control, a CRM-group nav item and a dashboard card. One platform = the SSOT.
> - **NEXT (recommended, not yet built):** an explicit **"Convert lead → CRM contact/company"** action on a lead. Best practice is to keep the raw inbound inbox (`leads`) separate from the CRM until qualified, rather than auto-creating a company for every message (`company_contacts.company_id` is NOT NULL, so every contact needs a company).
> - **Clean slate:** all current rows are test data → `scripts/wipe-test-data.sql` truncates every business/ops table (leads, orders, customers, subscriptions, funnels, reports, deliveries, outbox, email_log, resend_events, audit_logs, rate_limit, …) and keeps auth/roles/permissions/settings/acquisition_targets. Run manually in the Supabase SQL editor.
> - **Deliverability:** the contact-form notification reached `hello@amai.ch` but in **spam**. Auth is correct (SPF via `send.amai.ch`, DKIM `d=amai.ch`, DMARC passes via DKIM) so it is not rejected — it is new-domain reputation + strict DMARC alignment (SPF on the subdomain cannot align under `aspf=s`) + a same-domain self-send. Fix = relax DMARC alignment `aspf=s;adkim=s` → **`aspf=r;adkim=r`** (keep `p=reject`) so the subdomain SPF also aligns, mark not-spam + add the sender to safe senders, and let the domain warm up. Optional `rua` for monitoring.
> - **Positioning (17.06.2026):** the marketing homepage was repositioned from website-only to an AI-first digital partner story — four pillars (Websites, Portale, CRM Systeme, Automatisierungen). Hero + subtitle rewritten DE/FR/EN (copy-rule clean, `amai!` wordmark) plus a four-pillar overview section that links into the EXISTING `/services` pages — no duplicate pillar pages, because `/services/business-systems` already covers portals + CRM and `/services/marketing-automation` covers automation. Website Ads/SEO landing pages left untouched (still the acquisition funnel). Cases should live on the service pages + the central `/referenzen` (do not split Referenzen per pillar). Full strategy + final copy in `amai-positionering.docx` (repo root). "Krantenportaal/Zeitungsportal" was a typo and is dropped from the portal pillar.
>
> **Recent post-P18 platform work (13.06.2026, polish, not numbered phases):**
> - Public funnel now sends a **best-effort operator notification email** + the source tag reads **"Free website analysis"** — LIVE on production.
> - **Portal UX overhaul:** grouped left-sidebar shell (Dashboard / CRM / Sales / Finance / Website funnel / Admin) + module-card dashboard, replacing the cramped top nav. Every item still permission-gated.
> - **Auth/permission performance refactor:** per-request React `cache()` for session/profile/permissions + one `get_user_permissions` set instead of the per-page `has_permission` RPC fan-out (~16 round-trips/navigation → ~3). Security unchanged.
> - A DE/FR/EN cybersecurity blog post (`content/blog/website-sicherheit.*`).
> - **KNOWN BUG (fix planned):** the whole-row click in the 14 list tables uses a stretched link on `<tr>`, which Safari does not treat as a containing block, so a click can land on the wrong row. The sidebar nav is unaffected. Fix = a Safari-reliable clickable-row pattern across the tables, to be covered by Playwright E2E.
>
> Future work continues **from the LIVE Supabase schema and the applied additive migrations**
> (`0006_portal_profiles_extend` … `0035_resend_engagement`) — **not** from the original
> theoretical plan or theoretical migration names below.
>
> **Authoritative order (later overrides earlier where they conflict):**
> 1. **Part IV — Lessons Learned** overrides older P0/P1 assumptions in Parts I–III.
> 2. **Part V — Platform UX & Product Requirements** overrides prior UX/product behaviour.
> 3. **Part VI — Locked decisions, roadmap & next phases** is the current execution truth.
> 4. The **live schema + applied migrations** override any theoretical migration names below.
> 5. Every future spec **must inspect the live schema/repo before implementing** (Part IV L1–L2).
>
> **Legacy reconciliation — Parts I–III are historical/planning context, superseded where they conflict:**
> - "No portal code is built yet / Nothing is built / build starts with P0" → **superseded**: P0–P18 are built.
> - `audit_log` (singular) anywhere below → the live table is **`audit_logs`** (Part IV L4).
> - Theoretical migration names (`0006_profiles_and_roles.sql`, `0009_audit_log.sql`, …) → **superseded** by the live additive migrations `0006–0035` (Part IV L2).
> - Old role talk → the live model is **smallint `roles` + `user_roles` + `has_permission()`** (Part IV L4).
> - Outbox/email → on Vercel **Hobby**, transactional mail is **sent inline**; the cron is a daily retry sweep (Part IV L7).
> - Auth links → recovery/invite use **`/app/auth/confirm` (verifyOtp)**, not the OAuth code exchange (Part IV L6).
> - Avatar upload → **auto-upload on select/drop, no Upload button** (Part V V4); the built button is a pending patch (P3.5 CP3).
> - User deletion → **archive + GDPR anonymize, never a default hard delete** of `auth.users` (Part V V5 / Part VI).
> - Status wording/behaviour → the **unified status model** in Part V V1 governs.
>
> **How to read the legacy parts**
> - **Part I — Master Architecture** (historical target): internal "Part A / Part B" preserved; Part B authoritative over Part A — both now subordinate to Parts IV–VI.
> - **Part II — P0 Technical Specification** (historical): the database-first foundation, as actually applied **additively** to the live schema.
> - **Part III — P0 Corrections (C1–C9)**: APPROVED; still authoritative for P0 security intent, reconciled to the live schema by Part IV.

---

# PART I — MASTER ARCHITECTURE


> **Read Part B at the end first.** It holds the approved final refinements and the full
> execution plan (phases, migration order, exact v1 tables/files, test checklist, rollback,
> manual config) and **overrides Part A** wherever they differ.

> Status: **SUPERSEDED — see CURRENT STATE (top) + Parts IV–VI.** P0–P3 are built on the live
> schema. The legacy name `0006_profiles_and_roles.sql` was replaced by the additive
> `0006_portal_profiles_extend` … `0015` (Part IV L2). The architecture below is historical context.
>
> Scope shift: design the portal so it can grow into a multi-module **CRM/ERP** (clients,
> projects, products, finance, documents, NDAs, quotes, invoices, external client portals)
> without schema rewrites. The platform is **English-only**, lives under **`/app`**, and is
> isolated from the multilingual marketing site.
>
> Reference: this mirrors patterns already proven in your **SEMANU** database (generic
> append-only `audit_log`, per-entity event streams with `actor_type`/IP/status, a DB
> `edge_rate_limit`, role on `profiles`, `profiles.client_id` for external users,
> `emails_sent` with `resend_id`+status, immutable `quote_versions`). We adopt the same
> shapes so your two systems stay consistent.

---

## 1. Is the current plan enough? (short conclusion)

The v1 plan is **correct but too narrow** for a future CRM/ERP. It models a single-tenant
`admin`/`user` auth module. Four things are cheap to design now and **very expensive to
retrofit** once data exists, so we extend the plan in exactly these four places:

1. **A permissions layer** — not just a `role` enum, but `roles` / `permissions` /
   `role_permissions`, resolved through one `has_permission()` function. Adding a role later
   becomes *data*, not a code change.
2. **An organization (tenant) scope on every table** — an `organization_id` column + RLS
   that scopes by membership, so multi-org, external clients and partners are possible later.
3. **A generic, append-only audit/event store** — one rich `audit_log` that every module
   writes to, powering the history-clock timeline you want everywhere.
4. **An event/outbox spine** — so outbound email/webhooks/PDF/API calls are reliable and
   logged, not fire-and-forget.

Everything else (MFA, notifications, finance, NDA, external portals) can be added **later
without migrations** *if* these four exist. **Recommendation: extend the plan; build v1
thin, on a wide foundation.**

---

## 2. Improved target architecture

**Layers (strict):**

- `app/(portal)/…` — routing, layouts, pages. Thin. Calls module actions/queries. Guards
  the session/permissions. **No business logic, no SQL.**
- `modules/<domain>/` — the logic. Each domain ships `actions.ts`, `queries.ts`,
  `schema.ts` (zod), `types.ts`, `events.ts` (which audit/notification/outbox events it
  emits), `policies.md` (the RLS rules + why), and `*.test.ts`.
- `lib/` — cross-cutting infra: `supabase/`, `security/` (authorize, rbac, step-up),
  `audit/` (the event writer), `outbox/`, `ratelimit/`, `status/` (state machines + colors).
- **Database** — the real security boundary: RLS on every table, `SECURITY DEFINER`
  authorize functions, guard triggers, append-only audit.

**Three cross-cutting principles:**

- **Multi-tenant from day one.** Every domain row carries `organization_id`. RLS scopes by
  membership. v1 has exactly one organization, but the column and policies exist now.
- **One authorization spine.** `has_permission(perm)` (SQL, `SECURITY DEFINER`) is used by
  RLS; `requirePermission(perm)` (server, live DB read) guards every action; the UI uses
  permissions **only for display**, never as the security boundary.
- **One write path.** A meaningful mutation does, ideally in a single transaction:
  `(1)` domain write → `(2)` `audit_log` append → `(3)` optional `notification` →
  `(4)` optional `outbox` job. Audit is evidence; notifications are user-facing; they are
  linked but not the same thing.

**Domains:** `auth`, `users`, `organizations`, `companies`, `contacts`, `projects`,
`products`, `finance`, `documents`, `nda`, `audit`, `notifications`, `integrations`,
`shared`.

```
src/
  app/(portal)/  login  forgot-password  reset-password  (app)/{dashboard,profile,users,...}
  modules/<domain>/  actions.ts queries.ts schema.ts types.ts events.ts policies.md *.test.ts
  lib/
    supabase/   client.ts server.ts admin.ts
    security/   authorize.ts rbac.ts stepup.ts ratelimit.ts upload.ts
    audit/      log.ts queries.ts
    outbox/     enqueue.ts worker.ts (later)
    status/     machines.ts colors.ts
  components/portal/  shell/  history/{HistoryButton,HistoryTimeline}  ui/{DataTable,Badge,Drawer,Spinner}
supabase/migrations/  0006…0013
```

---

## 3. Improved data model (rings)

**Ring A — Identity & access** (v1):
`organizations`, `organization_members`, `profiles` (have it), `roles`, `permissions`,
`role_permissions`.

**Ring B — Platform spine** (v1):
`audit_log` (generic), `rate_limit`, `email_log`; *prepared:* `notifications`, `outbox`.

**Ring C — CRM core** (thin in v1, full later):
`companies` (= SEMANU `clients`: customer legal entities), `contacts` (a person, **no
login**), `company_contacts` (link).

**Ring D — Domain modules** (later): `projects`, `project_activities`, `products`,
`documents`, `ndas`, `quotes`, `invoices`, `payments`. Every Ring-D row carries
`organization_id`, usually `company_id` and/or `project_id`, and a `status`.

**What already exists vs new:**

| Exists (0001–0006) | New in this plan |
|---|---|
| `leads`, `customers`, `orders`, `subscriptions`, `documents`(old), `requests`(old), `profiles` | `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `audit_log`, `rate_limit`, `email_log`, `companies`, `contacts`, (later) `notifications`, `outbox`, domain tables |

Note: the old `documents`/`requests` from 0003 (removed customer portal) are unused and will
be repurposed or dropped when the CRM document module is built.

---

## 4. RBAC / permissions model

**Tables**

- `roles(id, key unique, label, is_system bool, created_at)` — seed: `super_admin`, `admin`,
  `user` (system). Later: `project_manager`, `finance`, `sales`, `viewer`, `external_client`,
  `external_partner`, `auditor` — **inserted as data, no code change**.
- `permissions(id, key unique, module, label)` — seed the catalog below.
- `role_permissions(role_id, permission_id)` — which permissions a role grants.
- **Assignment lives on `organization_members(user_id, organization_id, role_id, member_type,
  status)`** — role is **per-organization** (the right model for multi-tenant; a user can be
  `admin` in one org and `viewer` in another). A global `user_roles` table is unnecessary.
- *Later:* `entity_grants(user_id, entity_type, entity_id, permission_id)` for sharing a
  single record (e.g. one project) with an external client.

**Permission catalog (seed):** `users.read/create/update/disable/change_role`,
`projects.read/create/update/delete`, `finance.read/create_invoice/send_invoice`,
`documents.read/upload/send`, `nda.create/send/revoke/view_audit`, `products.read/update`,
`audit.read`, `audit.read_technical` (IP/UA), `org.manage`, `roles.manage`.

**Resolution helpers (one place, used everywhere):**

- SQL: `public.has_permission(perm text) returns bool` — `SECURITY DEFINER`, reads the
  caller's membership → role → permissions for the **current org**. Used inside RLS.
- SQL: `public.is_admin()` (already shipped) becomes a thin wrapper:
  `has_permission('org.manage')`.
- Server: `requirePermission('users.create')`, `requireAuth()`, `can(action, entity)`,
  `getUserPermissions()` — live DB reads, cached per request.
- **No hardcoded role string checks** anywhere except the seed data.

**Why this stays simple in v1:** we seed only `admin` (all permissions) and `user` (read own
profile). `requireAdmin()` keeps working (now `requirePermission('org.manage')`). The whole
machinery is present but you only *use* two roles. Adding `finance` later = a few INSERTs.

**Migration from the current `profiles.role`:** keep `profiles.role` as a **denormalized
cache** for fast display only; the **source of truth is `organization_members.role_id`**.
A trigger keeps the cache in sync. (Or drop `profiles.role` entirely — see §18 for the
recommended choice.)

---

## 5. Organization / workspace model

| Concept | Table | Has login? | Notes |
|---|---|---|---|
| Tenant / workspace | `organizations` | – | v1: one row, "amai internal" |
| Membership + role | `organization_members` | – | `member_type`: internal / external_client / partner / auditor |
| Login identity | `profiles` (+ `auth.users`) | **yes** | internal staff or external client user |
| Customer legal entity | `companies` | – | name, VAT, address, account_manager |
| Person (no login) | `contacts` | **no** | linked to a company; may *later* be linked to a profile |

**Rules (mirroring SEMANU):**

- A **contact is not a user.** A company has many contacts. A portal **user** may optionally
  be linked to a `company_id` (that makes them an *external client user*).
- **Internal users**: `organization_members.member_type = internal`, no `company_id`.
- **External client users**: `member_type = external_client`, `company_id` set; RLS limits
  them to **their company's** rows plus any `entity_grants`.
- **RLS scoping pattern (every domain table):**
  `using ( organization_id = current_org() and has_permission('x.read')
           and ( member_type = 'internal' or company_id = current_company() or granted(...) ) )`.

**v1:** one org, all staff are internal members, `companies`/`contacts` exist but are barely
used, external users are **designed and disabled**.

---

## 6. Audit / event model

**One generic, append-only `audit_log`** (superset of SEMANU's `audit_log` + `*_events`):

```
id bigint pk
created_at timestamptz
organization_id uuid
actor_id uuid            actor_email text   actor_name text   actor_role text
actor_type text          -- internal_user | external_user | system | link_user | integration
action text              -- created | sent | opened | viewed | downloaded | signed | revoked
                         --  | status_changed | role_changed | file_uploaded | login | ...
entity_type text         entity_id text     entity_display_name text
parent_entity_type text  parent_entity_id text
old_status text          new_status text
old_values jsonb         new_values jsonb
metadata jsonb
ip_address inet          user_agent text
request_id text          session_id text
source text              -- portal | public_link | email_link | api | system_job | webhook
severity text            -- info | warning | critical
visible_to_admin bool default true
visible_to_client bool default false
```

- **Append-only, enforced.** RLS grants `SELECT` only; **no** `UPDATE`/`DELETE` policy for
  anyone. Writes go through a `SECURITY DEFINER` `log_event(...)` RPC (so the app cannot forge
  `actor_*`) or the service role. Deletion for retention = a new `redacted` event, never a
  mutation, unless legally required.
- **Status history is just audit rows** with `action='status_changed'` + `old_status` →
  `new_status`. (SEMANU keeps both a generic log *and* per-entity `*_events`; for v1 we use
  the **single table** and add per-entity materialization only if a hot path needs it — §18.)
- **Retention tiers** (different horizons, set per `entity_type`/`severity`):
  operational, security, document/NDA, finance, and GDPR delete-requests.

This one table powers the history-clock timeline for **every** module.

---

## 7. History icon / timeline UI

**Reusable, entity-agnostic components:**

```
<HistoryButton entityType="nda" entityId="…" />      // clock icon + "Last updated 2h ago"
<HistoryTimeline entityType="project" entityId="…" /> // the drawer body
```

- Data: a single server action / route `getHistory(entityType, entityId)` reads `audit_log`
  filtered by entity (RLS-enforced). Technical metadata (IP/UA, `metadata`) is returned only
  when `has_permission('audit.read_technical')`.
- **Drawer UX** (right side): title "Activity history"; top = current status + last event;
  then a timeline. Per event: icon, status color, title, actor + actor_type, timestamp,
  one detail line, expand for technical metadata, optional link to the related PDF/email.
- **Filters:** All · Status changes · Emails · Documents · Security · System.
- **Empty state**, loading skeleton, "load more". Normal users see only business-friendly
  events (`visible_to_client`/non-technical); admins see everything.
- **Placement:** a clock at the right of the header on user, company, contact, project,
  product, invoice, quote, NDA, document, outgoing email, payment request, portal invitation,
  customer request, readiness check, download, form submission.

Example timelines (User / Invoice / NDA / Project) are exactly the rows the schema in §6
produces. This is one component, reused — not NDA-specific.

---

## 8. Outbound actions / outbox model

**`outbox` table** (reliability for anything that leaves the system):

```
id, created_at, organization_id,
channel text         -- email | webhook | api | pdf | reminder
dedupe_key text       -- idempotency
payload jsonb
status text           -- pending | processing | sent | failed | retrying | cancelled
attempts int          last_attempt_at   next_retry_at
provider_message_id text
error text            -- sanitised
audit_event_id bigint -- link to the audit row
```

- A **worker** (Supabase cron / edge function) claims `pending`/`retrying` rows, processes
  them, updates status with exponential backoff; `dedupe_key` makes it idempotent.
- **Email truth levels** (be explicit in the UI):
  `email_sent` = we handed it to Resend · `email_delivered` = Resend webhook confirmed ·
  `email_bounced`/`email_complained` = webhook · `email_opened`/`email_link_clicked` =
  tracking pixels, **unreliable**, and only if privacy-allowed.
- **Email log:** `email_log(to_email, subject, template_key, resend_id, status, error,
  outbox_id, audit_event_id)` — mirrors SEMANU's `emails_sent` (`resend_id`+`status`).
- **v1 (your choice — full spine):** ship the `outbox` table **and** a **worker** (Supabase
  cron / edge function) with exponential backoff and an idempotent `dedupe_key`, plus
  `email_log` and the Resend **webhook** that flips delivered/bounced. Outbound email is
  **enqueued, not sent inline** — the app writes an outbox row, the worker delivers it.

---

## 9. Disabled-user security (immediate revocation)

Five layers so a disabled user is blocked on the **next request**, not at token expiry:

1. `profiles.status='disabled'` (or `organization_members.status`). `requireAuth()` /
   `requirePermission()` do a **live DB read** every request → immediate reject + redirect.
2. **RLS** `has_permission()` requires an **active** membership → DB rejects queries too.
3. **Supabase Auth ban**: `auth.admin.updateUserById(id, { ban_duration })` to stop token
   refresh, plus revoke existing refresh tokens / `auth.admin.signOut(id)` to force re-login.
4. **Audit**: `user_disabled` event with actor + reason + timestamp (admin can see *who*
   and *when*).
5. Protected layout + middleware fast-path redirect.

Re-enable mirrors this (`user_enabled` event, clear ban). This is why the **DB is the source
of truth** (a JWT-only check would keep working until the token expires — see §11/§12).

---

## 10. MFA / 2FA readiness (architecture, not built in v1)

- Use **Supabase Auth native TOTP MFA** + AAL levels — no custom crypto.
- Design the checkpoints now: `requireStepUp()` / `requireRecentAuth()` wrappers around
  **sensitive actions** (change role, disable user, finance export, invoice send, NDA revoke);
  policy hook "MFA required for admins"; backup codes + recovery flow; audit `mfa_enabled` /
  `mfa_disabled`.
- v1 ships the **checkpoints as no-op stubs** and an `aal` read helper; enforcement is a
  later flip. Optionally, later, RLS can require AAL2 for finance tables.

---

## 11. Rate limiting & abuse protection

**Two cooperating layers:**

- **Cloudflare** (already in front): network/IP throttling + **Turnstile** on sensitive
  public flows (password reset, public signing/intake links, contact form).
- **App-level `rate_limit` table** (`bucket, identifier, window_start, hits` — exactly
  SEMANU's `edge_rate_limit` sliding window) checked in server actions/route handlers for
  **email-based** and **account-based** limits that Cloudflare can't see: login, password
  reset, invite resend, file upload, public-link access, webhook ingest.
- **Hygiene:** generic error messages, **no account enumeration** (reset always says "if that
  address exists…"), and every suspicious hit logged to `audit_log` (`severity='warning'`).
- v1: limiter on login / reset / invite-resend + Turnstile on reset & public links. Folds in
  pending task #18 (Turnstile + rate-limit on `/api/leads`, `/api/checkout`).

---

## 12. RLS / security strategy & the role-check decision

**Decision: hybrid, DB-authoritative.**

- **Source of truth = the database.** RLS + `has_permission()`/`is_admin()` (`SECURITY
  DEFINER`) on every table; server actions call `requirePermission()` (live read) for
  sensitive operations; the **UI uses role/permission info only to show/hide**, never to
  authorize.
- **JWT custom claims** (org_id, coarse role) are allowed **only as a display/perf hint** to
  avoid a read on hot, low-risk paths. They are **stale until token refresh**, so they are
  **never** the sole check for sensitive actions, and RLS re-checks server-side regardless.
- **How fast does a role/disable change take effect?** Immediately, because sensitive paths
  read the DB live (§9). Claims would lag — that's why we don't rely on them for authz.
- **Where each check lives:** RLS (every table) · server actions (every mutation + sensitive
  read) · UI (cosmetic only).
- Service-role key: server-only (outbox worker, admin user-create, audit writer); a CI
  **bundle scan** asserts it never ships to the client. Anti-escalation triggers already in
  `0006`. Step-up re-auth for the most sensitive actions (§10).

---

## 13. Test plan (concrete)

**Access & authz (Vitest integration):** guest → protected route redirects; `user` →
`/app/users` blocked; `user` cannot read another profile; `user` cannot change own
role/status; `user` cannot read `audit_log`; `admin` can. **Disabled:** disabled user
rejected on next request; **stale session** of a disabled user rejected. **Escalation:**
crafted update of `role`/`status` is reverted (trigger). **Bundle:** service-role key name
absent from the client build. **Uploads:** wrong MIME rejected; oversize rejected.
**Auth flows:** reset for unknown email returns the generic message; invite resend is
rate-limited. **Audit assertions:** role change logged; user disable logged; the event shows
in the history timeline. **Public links:** access logged; expired/old link handled; webhook
signature validated.

**RLS tests (SQL harness run as a low-privilege role / pgTAP-style):** select/update/insert
policies per table; storage policies; privilege-escalation attempts; **organization-boundary**
checks (org A cannot see org B). Wire into CI as a gate.

---

## 14. Implementation phases (re-sequenced for the wide foundation)

- **P0 — Foundation+** *(extends 0006, still no UI)*: `organizations`, `organization_members`,
  `roles`, `permissions`, `role_permissions` + `has_permission()`/`requirePermission()`;
  generic `audit_log` + `log_event()`; `rate_limit`; **`outbox` + worker + `email_log` +
  Resend webhook**. Seed the org, roles, permission catalog, map `admin`/`user`.
- **P1 — Auth**: `/app` login, secure sessions, route protection, **password reset** (branded
  Resend, **enqueued via the outbox**), **disabled-user** handling.
- **P2 — Profile + avatar** (storage bucket + RLS, safe upload).
- **P3 — User management (admin)** + the reusable **HistoryButton/HistoryTimeline** on the
  user detail page + status-color system + audit on every user action.
- **P4 — Hardening**: rate limiting on sensitive flows, security + RLS tests, Supabase
  advisors, docs; **migrate leads/orders into the portal** under permissions; **retire the old
  `/admin`** password gate.
- **Later (designed, not built now)**: companies/contacts CRM · projects · documents · NDA ·
  finance · **outbox worker + Resend webhooks** · notifications center · **MFA** · external
  client portal · per-entity `entity_grants`.

---

## 15. v1 must vs later (explicit)

**Tables that must exist in v1:** `profiles` (have it), `organizations`,
`organization_members`, `roles`, `permissions`, `role_permissions`, `audit_log`,
`rate_limit`, `outbox`, `email_log`, plus thin `companies`/`contacts`. Storage `avatars` bucket.

**Tables prepared but created later:** `notifications`, `entity_grants`,
`projects`, `project_activities`, `products`, `documents`(new), `ndas`, `nda_events`,
`quotes`, `quote_versions`, `invoices`, `invoice_events`, `payments`.

**Build in v1:** Supabase Auth · `/app` login · password reset · profiles · admin/user roles
(via the permission tables, seeded) · user management · generic `audit_log` · the history
clock on the user detail page · audit timeline base component · disabled-user handling · safe
avatar upload · basic rate limiting · **outbox worker + email_log + Resend webhook** · RLS tests.

**Prepare only (no build):** organizations/workspaces UI · granular permissions UI · external
client users · finance/NDA/project modules · notifications center · MFA · the full CRM/ERP.

---

## 16. Risks & attention points

- **Multi-tenant retrofit is the big one** — that's why `organization_id` goes on every table
  *now*, even with one org.
- **Over-engineering the permission UI** — keep v1 seeded to two roles; don't build a
  role-editor yet.
- **Audit write-path discipline** — the audit append must be in the **same transaction** as
  the domain write, or you get gaps. Enforce via the `log_event()` helper / module `events.ts`.
- **Outbox/worker ops** — needs a cron/edge runner; that's why the full worker is later.
- **Supabase MFA/AAL caveats** — AAL handling and recovery need care; stub now.
- **amai Supabase is NOT in the connected MCP account** (only SEMANU is) — you apply these
  migrations to the amai project yourself, and I can't auto-test against it.
- **Live permission checks cost a read** — cache per request; JWT claim is an optional later
  optimization, never the authz.
- **GDPR** — personal data across the CRM: soft vs hard delete, access auditing, retention,
  IP/UA admin-only.
- **Don't break the live marketing site** — the portal is isolated under `/app`; the
  middleware split must exclude it from i18n.
- **Status colors are semantic, not brand** — introduce a small semantic palette beside the
  brand red so badges read correctly across modules (§17 `lib/status/colors.ts`).

---

## 17. Concrete files / migrations to touch first

**Migrations (0006 already written; new ones additive):**

- `0007_organizations.sql` — `organizations`, `organization_members` (+ `current_org()`,
  `current_company()` helpers), seed one org + memberships; backfill from `profiles`.
- `0008_rbac.sql` — `roles`, `permissions`, `role_permissions`, `has_permission()`; reseat
  `is_admin()` on top; seed catalog + admin/user.
- `0009_audit_log.sql` — generic `audit_log` + `log_event()` RPC + append-only RLS.
- `0010_rate_limit.sql` — sliding-window table + helper.
- `0011_companies_contacts.sql` — thin `companies`, `contacts`, link table (RLS on).
- `0012_avatars_storage.sql` — private `avatars` bucket + per-user storage policies.
- `0013_outbox_email.sql` — `outbox` (queue + status), `email_log`, Resend webhook (v1).

**Code to add/extend:** `lib/types/database.ts` (extend types); `lib/security/authorize.ts`
+ extend `rbac.ts` (`requirePermission`, `can`, `getUserPermissions`); `lib/audit/log.ts`;
`lib/ratelimit.ts`; `lib/status/{machines,colors}.ts`; `modules/{organizations,companies,
contacts,audit,users,auth}/*`; `components/portal/history/{HistoryButton,HistoryTimeline}`;
`components/portal/ui/{Badge,Drawer,DataTable,Spinner}`; the middleware split for `/app`.

**Read first (no change yet):** `src/i18n/routing.ts` (matcher), `next.config.*` (headers),
`src/app/globals.css` (tokens), `src/app/[locale]/admin/*` (leads/orders to migrate),
and SEMANU's `email_templates` shape as a style reference.

---

## 18. My recommended choices

1. **Multi-tenant now:** `organization_id` on every domain table from the first migration.
2. **Permission tables now, seeded to `admin`/`user`:** gate everything via
   `requirePermission()` / `has_permission()`; adding roles later is data.
3. **`organization_members.role_id` is the source of truth.** **Drop `profiles.role`** (don't
   keep a cache to drift) — resolve role/permissions through membership. (`0006`'s `role`
   column becomes a transitional default we migrate off in `0008`.)
4. **One generic append-only `audit_log`** as the history source for v1; add per-entity
   materialized event tables only where a hot path proves it's needed.
5. **DB live checks are the authority**; JWT claims are a display/perf hint only; **step-up
   re-auth checkpoints stubbed now**.
6. **Disabled = `status` + live check + Supabase ban + session revoke** (all five layers).
7. **Rate limit = Cloudflare + DB sliding-window table**; **Turnstile** on reset + public
   links.
8. **Outbox: full spine in v1 (your choice)** — `outbox` (pending/processing/sent/failed/
   retrying/cancelled) + a Supabase cron/edge **worker** with backoff, `email_log`, and the
   Resend webhook. Outbound email is enqueued, not sent inline.
9. **MFA: Supabase native, designed + stubbed, off in v1; required-for-admins later.**
10. **Status colors:** a small semantic palette (`draft=grey, sent=blue, waiting=amber,
    opened=purple, done/paid=green, cancelled=grey-red, revoked/failed=red, system=neutral,
    warning=amber, critical=red`) reused across badges, timelines, tables.
11. Carried from v1: **path `/app`**, **branded Resend (`generateLink`)**, **admin-only
    sign-ups**, **replace the old `/admin`** (migrate leads/orders under permissions, last).

**Decisions you locked (this plan reflects them):**

- **A — Permission tables in v1: yes**, seeded to `admin`/`user`; gate everything via
  `has_permission()` / `requirePermission()`. Adding a role later is data, not code.
- **B — Membership is the source of truth: yes.** `profiles.role` is dropped (no synced cache
  that can drift); role/permissions resolve through `organization_members`.
- **C — Full outbox spine in v1.** The complete `outbox` + retry **worker** + `email_log` +
  Resend webhook ship in v1; outbound email is enqueued, not sent inline.

Build starts only on your explicit go.

---

# Part B — Final refinements (approved) & execution plan (v3)

> Part B is the **authoritative final layer**; where it differs from Part A above, **Part B
> wins**. The architecture is approved; these are the refinements to apply before building.
> **SUPERSEDED — P0–P3 are built; see CURRENT STATE (top) + Parts IV–VI. Historical context below.**

## B1 · Approved refinements (deltas over Part A)

1. **Outbox = minimal reliable in v1.** Ship only: an `outbox` table, an `email_log` table,
   `enqueueEmail()`, a **worker** that moves rows `pending → sent | failed`, **basic retry**
   with backoff, and an idempotent **`dedupe_key`**. **Deferred to a later phase:** Resend
   delivery/bounce **webhook**, open/click **tracking**, notification center, delivery
   dashboards — none are needed for invite or password-reset (those only need a reliable send).

2. **Platform `super_admin` (two planes).**
   - *Organization plane* (normal, org-scoped): roles on `organization_members` —
     `organization_admin`, `organization_user`, `external_client`, `external_partner`,
     `auditor`; resolved by `has_permission()`.
   - *Platform plane* (reserved): **`platform_super_admin`**, stored in a separate
     `platform_admins` table (**not** an org role), resolved by `is_platform_super_admin()`.
     It grants **cross-organization** access for internal platform administration, emergency
     support and migrations, and is used sparingly. **Every** platform_super_admin action is
     audited (`source='platform'`, `severity ≥ warning`). RLS adds `or is_platform_super_admin()`
     only where cross-org access is legitimate, and those paths always log.
   - v1 actively uses `organization_admin` + `organization_user`; the owner is also
     `platform_super_admin` (bootstrap + support). The other roles are seeded but unused.

3. **Impersonation — prepared, not built.** Documented future design only: requires
   `platform_super_admin` + step-up/MFA + an explicit **reason**; emits `impersonation_started`
   / `impersonation_stopped` audit events (target, reason, duration); shows a persistent UI
   **banner**; explicit start/stop; and a **deny-list** of sensitive actions (role changes,
   finance exports, security settings) unless explicitly allowed. v1 adds nothing beyond
   leaving the audit `action`/`source` values open-ended.

4. **Soft-delete & archiving (convention).** Business entities carry `deleted_at`,
   `deleted_by`, `deletion_reason`, `archived_at`, `archived_by`. Default queries/RLS exclude
   `deleted_at is not null`; soft-deleted rows leave the normal UI but remain for audit. **Hard
   delete** is reserved for technical cleanup or legal erasure and itself emits an audit event.
   The convention applies from `companies`/`contacts` onward — the v1 table set has no business
   entities yet (users use `status`, not soft-delete, because they are bound to `auth.users`;
   a GDPR erase is a separate hard-delete + anonymise procedure).

5. **Formal status machines.** One definition per domain (`modules/<domain>/status.ts`, shared
   types in `lib/status/`): each status has a **label** + **color token**; each transition
   declares `from→to`, allowed/forbidden, **terminal**, **required permission**, **audit event
   emitted**, and **whether an outbound action fires**. A single `applyTransition()` enforces
   it. **No status logic in UI components or ad-hoc server actions.** v1 wires the user
   `status` and the existing leads/orders statuses into this shape.

6. **Raw vs display audit.** `audit_log` is the **raw evidence** layer (immutable, complete).
   The UI renders **display events** from a template map (`lib/audit/display.ts`, keyed by
   `action` + `entity_type`) into safe human sentences. **Technical fields** (`ip_address`,
   `user_agent`, webhook payloads, `error`, provider responses, raw `before/after`) are returned
   **only** to holders of `audit.read_technical`; the history query strips them otherwise.

7. **Migration discipline — additive only.** Never edit an applied migration; corrections are
   new migrations. **One-time exception:** `0006` has **not** been applied anywhere (the amai
   Supabase is not in the connected account and it has never been run), so it is **revised in
   place** as part of the coherent foundation set in B3. From the first apply onward,
   additive-only, and `leads`/`customers`/`orders` are never touched.

8. **v1 scope is fixed** — exactly the build / do-not-build lists you gave; see B4 (tables) and
   B5 (files).

## B2 · Final implementation phases

| Phase | Builds | Done when |
|---|---|---|
| **P0 Foundation** | migrations 0006–0012, extended types, libs (`authorize`, `rbac`, `audit`, `ratelimit`, `outbox`, `status`), seed | `tsc` green, no UI |
| **P1 Auth** | `/app` routing split, login, session refresh, `/auth/callback`, sign-out, **password reset** (branded, enqueued via outbox), **disabled-user** revocation, PortalShell + `!` spinner | login + reset work for a test user |
| **P2 Profile** | profile view/edit (self), **avatar upload** (storage + RLS, validated) | user edits self + uploads avatar |
| **P3 Users + History** | admin user mgmt (list/create/edit/disable/resend), **HistoryButton/HistoryTimeline** on user detail, status colors, audit on every action | admin manages users; timeline shows events |
| **P4 Hardening** | rate limiting on sensitive flows, **RLS + abuse tests**, advisors pass, **migrate leads/orders** under permissions, **retire old `/admin`**, docs | tests green; advisors clean |

Every phase: `npx tsc --noEmit` clean, tests green, the live marketing site untouched, all
migrations additive.

## B3 · Exact migration order (v1)

Applied to the **amai** Supabase project in order. `0006` is revised **before** first apply;
all are additive thereafter.

1. **`0006_profiles.sql`** *(revised)* — `profiles` (identity + account `status`, **no role
   column**), `handle_new_user()` (insert a profile on auth signup), `updated_at` trigger. The
   role model + privilege-guard move to `0008` (they need the authz functions first).
2. **`0007_organizations.sql`** — `organizations`, `organization_members`
   (`user_id, organization_id, role_id, member_type, status`), `current_org()`; seed one org.
3. **`0008_rbac.sql`** — `roles`, `permissions`, `role_permissions`, `platform_admins`;
   `has_permission()`, `is_org_admin()`, `is_platform_super_admin()`; the `profiles`
   privilege-guard trigger; seed the permission catalog + the 6 roles + map the owner to
   `platform_super_admin` + `organization_admin`.
4. **`0009_audit_log.sql`** — `audit_log` (raw, append-only), `log_event()`, RLS (select gated
   by `audit.read`; technical columns reachable only through the permission-checked path).
5. **`0010_rate_limit.sql`** — `rate_limit` (sliding window) + `hit_rate_limit()`.
6. **`0011_outbox_email.sql`** — `outbox`, `email_log`, `claim_outbox()`/`complete_outbox()`
   for the worker. **No webhook.**
7. **`0012_avatars_storage.sql`** — private `avatars` bucket + per-user-folder storage policies.

*(Later, additive: companies/contacts, projects, products, documents, nda, finance,
notifications, entity_grants, impersonation, resend-webhook + tracking.)*

## B4 · Exact v1 tables

`profiles` · `organizations` · `organization_members` · `roles` · `permissions` ·
`role_permissions` · `platform_admins` · `audit_log` · `rate_limit` · `outbox` · `email_log`
+ storage bucket **`avatars`**. **No** companies/contacts/domain tables in v1.

## B5 · Exact v1 files

```
supabase/migrations/
  0006_profiles.sql (revised)   0007_organizations.sql   0008_rbac.sql
  0009_audit_log.sql            0010_rate_limit.sql       0011_outbox_email.sql
  0012_avatars_storage.sql

src/lib/
  supabase/admin.ts                 service-role + auth-admin client (server only)
  security/authorize.ts             has_permission / is_org_admin / is_platform_super_admin wrappers
  security/rbac.ts (extend)         requireAuth / requirePermission / requireOrgAdmin / getUserPermissions / can
  security/ratelimit.ts             hit() over rate_limit
  security/upload.ts                avatar validation (mime + size + magic bytes)
  audit/log.ts                      logEvent() server writer (via log_event RPC)
  audit/queries.ts                  getHistory(entityType, entityId) (+ technical-field strip)
  audit/display.ts                  action+entity -> human message templates
  outbox/enqueue.ts                 enqueueEmail()
  outbox/worker.ts                  processPending() (claim / send / complete / retry)
  email/{render.ts, templates/}     branded invite + reset HTML
  status/{types.ts, colors.ts}      state-machine types + semantic color tokens
  types/database.ts (extend)        regenerate after apply

src/modules/
  auth/  actions.ts queries.ts schema.ts(have) emails.ts *.test.ts
  users/ actions.ts queries.ts schema.ts(have) types.ts(have) *.test.ts
  organizations/ queries.ts types.ts

src/app/
  (portal)/login/page.tsx  forgot-password/page.tsx  reset-password/page.tsx
  (portal)/(app)/layout.tsx  dashboard/page.tsx  profile/page.tsx
  (portal)/(app)/users/page.tsx  users/new/page.tsx  users/[id]/page.tsx
  auth/callback/route.ts
  api/cron/outbox/route.ts          CRON_SECRET-guarded worker trigger

src/components/portal/
  shell/{PortalShell,Sidebar,Topbar}.tsx
  ui/{Spinner,Badge,Drawer,DataTable,FormField,Avatar}.tsx   Spinner = the gold ! loader
  history/{HistoryButton,HistoryTimeline}.tsx

src/middleware.ts (edit)            exclude /app from i18n + Supabase session refresh
vercel.json (new/edit)              outbox cron schedule
```

## B6 · Test checklist (v1)

**Route & permission (Vitest):** guest → `/app/*` redirects to login · `organization_user`
cannot open `/app/users` · cannot read another profile · cannot read `audit_log` ·
`organization_admin` can · `platform_super_admin` cross-org reads are **audited**.
**Privilege escalation:** crafted update of own `status`/`email` is reverted by the guard
trigger · a user cannot self-assign a role. **Disabled user:** rejected on the **next**
request · a **stale session** is rejected · Supabase ban blocks token refresh. **Secrets:**
service-role key name is **absent** from the client bundle. **Avatar upload:** wrong MIME
rejected · oversize rejected · filename sanitised to `{user_id}/…`. **Auth flows:** reset for
an unknown email returns the **generic** message (no enumeration) · invite-resend and login are
**rate-limited**. **Outbox:** enqueue writes `pending` · worker → `sent` · failure → `failed`
+ retry · `dedupe_key` prevents a double send. **Audit:** `user_created` / `role_changed` /
`user_disabled` logged · technical fields hidden without `audit.read_technical` · the display
message renders · the event shows in `HistoryTimeline`.
**RLS (SQL harness, low-priv role):** profiles select/update · org-member scoping ·
`audit_log` is append-only (no update/delete) · `rate_limit`/`outbox` unreadable by `anon` ·
storage `avatars` own-folder only · **org-boundary** (org A cannot see org B) ·
`platform_super_admin` override paths are logged.

## B7 · Rollback strategy

- **Code:** the portal is isolated under `/app`, so reverting is a **Vercel rollback** to the
  previous deployment (or `git revert`) — it removes `/app` entirely and the marketing site is
  untouched (separate routes; the middleware change is additive).
- **Feature flag:** `/app` is gated behind **`PORTAL_ENABLED`**, so it can be switched off
  without a redeploy.
- **DB:** migrations are **additive** — new tables are inert when the code isn't deployed, so a
  code rollback alone is safe. To undo schema, ship a **corrective additive migration** (e.g.
  `00xx_drop_outbox.sql`); never hand-edit or delete an applied one, and **never** touch
  `leads`/`customers`/`orders`. Each migration file carries a commented `-- ROLLBACK:` block
  with the exact `drop` statements.
- **Auth fallback:** the old `/admin` password gate stays live until **P4**, so a broken portal
  release never locks you out.

## B8 · Manual configuration

**Supabase (the amai project — NOT a SEMANU project):**
- Apply `0006–0012` in order (SQL editor or CLI); then regenerate `src/lib/types/database.ts`.
- Auth → Providers: email/password **on**, public **sign-ups OFF** (admin-created only).
- Auth → URL config: site URL `https://amai.ch`; redirect allow-list
  `https://amai.ch/app/auth/callback` and `https://amai.ch/app/reset-password` (+ preview URLs).
- Auth emails: we send via **Resend through our outbox** (branded `generateLink`), so Supabase
  SMTP is optional. If you also want Supabase's own mails branded, set custom SMTP = Resend.
- Storage: confirm the `avatars` bucket (created by `0012`) is **private**.
- Copy the **service-role key** to Vercel (server-only). Run **Advisors** (security +
  performance) after applying.

**Vercel:**
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`,
  `PORTAL_ENABLED`, (Turnstile site + secret).
- **Cron:** add a Vercel Cron (≈ every minute) → `POST /api/cron/outbox`, guarded by
  `CRON_SECRET`, that runs the outbox worker. *(Alternative: Supabase pg_cron + edge function.)*
- Confirm `/app` is server-rendered and **not cached** (auth pages `no-store`).

**Resend:**
- Verified domain `amai.ch` (done); API key in Vercel.
- From address `amai! <noreply@amai.ch>` for invite/reset.
- v1 = **send only**; no webhook configured yet (deferred with delivery tracking).

**Cloudflare:**
- Rate-limit rules on `/app/login`, `/app/forgot-password`, `/app/reset-password`, `/api/*`.
- **Turnstile** (site + secret) for password reset and any public flow (folds in task #18).
- Cache rule: **bypass cache** for `/app/*` and `/api/*`. Keep Full (strict) SSL + WAF (on).

---

**This is the final plan. Build starts only on your explicit go — I will begin with P0
(migrations 0006–0012 + the lib spine, type-safe, no UI).**

---

# PART II — P0 TECHNICAL IMPLEMENTATION SPECIFICATION

> ⚠ **Part III (Corrections C1–C9) is authoritative and overrides the P0 sections below**
> where they conflict: §3 (outbox `dedupe_key` required — C6), §4 (`current_org` — C1;
> `log_event` server-only — C2; permission resolution — C3), §5 (RLS for roles/permissions — C3;
> `audit_log` read model — C8), §6 (owner bootstrap fails loudly — C5), §7 (TS audit + ratelimit
> — C2/C7/C8), §8 (outbox — C6), §9 (audit read model — C2/C8), §10 (rate-limit identifiers — C7).


> Master architecture: **Portal Plan v3** (`PORTAL_PLAN.md`), Part B authoritative.
> This document specifies **P0 only**. It is database-first and security-first.
> **SUPERSEDED — P0 (and P1–P3) are built and reviewed; see CURRENT STATE (top) + Parts IV–VI.**

---

## 1. P0 objective

**Achieve:** a complete, secure data + authorization foundation for the `/app` platform,
with **no UI**. After P0, the database enforces multi-tenant access, a permission model,
append-only audit, rate limiting and a minimal reliable email outbox; and a thin, server-only
TypeScript layer exposes typed helpers (`requirePermission`, `logEvent`, `enqueueEmail`,
worker, rate-limit) for P1+ to build on.

**P0 delivers:** migrations `0006`–`0012`; tables `profiles`, `organizations`,
`organization_members`, `roles`, `permissions`, `role_permissions`, `platform_admins`,
`audit_log`, `rate_limit`, `outbox`, `email_log`; functions `current_org()`,
`has_permission()`, `is_org_admin()`, `is_platform_super_admin()`, `log_event()`,
`hit_rate_limit()`, `claim_outbox()`, `complete_outbox()`; RLS on every new table; the seed
(org + roles + permission catalog + mapping); the `avatars` storage bucket + policies (DDL
only); and the server-only lib spine.

**P0 must NOT include:** any UI, auth pages, user-management screens, profile screen, the
HistoryTimeline component, CRM/ERP modules, companies/contacts, the old `/admin` migration,
Resend webhooks, open/click tracking, notifications, MFA, or impersonation. `current_company()`
is **deferred** (no companies table in P0).

**Definition of done:** `npx tsc --noEmit` clean; the SQL/RLS/function test checklist (§12)
passes on a throwaway database; the live marketing site and the existing `leads`/`customers`/
`orders`/`subscriptions`/`documents`/`requests` tables are untouched.

---

## 2. Exact migration plan

All migrations are **additive**. `0006` has not been applied anywhere, so it is **revised in
place** (its current role/`is_admin` content moves to `0007`/`0008`). The existing file
`0006_profiles_and_roles.sql` is **renamed** to `0006_profiles.sql`. From first apply onward,
additive-only; never touch `leads`, `customers`, `orders`, `subscriptions`, `documents`,
`requests`.

Each migration file ends with a `-- ROLLBACK:` comment block listing the exact `drop`
statements a corrective migration would use (we never hand-edit an applied migration).

### 0006_profiles.sql
- **Purpose:** identity + account status per auth user. No role here (roles live on
  membership).
- **Tables:** `public.profiles` (see §3).
- **Indexes:** `unique (lower(email))`; `(status)`.
- **Constraints:** PK `id`; FK `id → auth.users(id) on delete cascade`; FK
  `created_by → auth.users(id) on delete set null`; `check status in
  ('active','disabled','invited')`.
- **Triggers:** `profiles_touch` (BEFORE UPDATE → `updated_at = now()`); `on_auth_user_created`
  (AFTER INSERT on `auth.users` → `handle_new_user()`).
- **Functions:** `public.touch_updated_at()` (idempotent); `public.handle_new_user()`
  (SECURITY DEFINER; inserts the profile from `raw_user_meta_data`).
- **RLS:** enable; `profiles_select_self` (id = auth.uid()); `profiles_update_self`
  (id = auth.uid()). Admin/platform read+update policies and the privilege-guard trigger are
  added in `0008` (they need the authz functions).
- **Seed:** none.
- **Rollback:** `drop trigger on_auth_user_created on auth.users; drop function
  handle_new_user; drop table profiles;` (touch_updated_at kept — shared).

### 0007_organizations.sql
- **Purpose:** the tenant + membership backbone.
- **Tables:** `public.organizations`, `public.organization_members` (see §3).
- **Indexes:** `organizations(unique slug)`; `organization_members(unique (organization_id,
  user_id))`, `(user_id)`, `(organization_id)`, `(role_id)`.
- **Constraints:** `organization_members.role_id` is `uuid not null` **without** an FK yet
  (the `roles` table is created in `0008`; the FK is added there). FKs:
  `organization_id → organizations(id) on delete cascade`,
  `user_id → profiles(id) on delete cascade`. Checks on `member_type`, `status`.
- **Functions:** `public.current_org()` (SECURITY DEFINER, see §4).
- **RLS:** enable on both. `organizations`: select where caller is an active member or platform
  super-admin. `organization_members`: select own rows or (admin/platform) all in the org;
  no client insert/update/delete (managed by service role / P3 actions).
- **Seed:** one organization — `slug='amai'`, `name='amai'` (idempotent `on conflict (slug)
  do nothing`).
- **Rollback:** `drop table organization_members; drop table organizations; drop function
  current_org;`

### 0008_rbac.sql
- **Purpose:** the permission model + platform plane + the privilege guard.
- **Tables:** `public.roles`, `public.permissions`, `public.role_permissions`,
  `public.platform_admins` (see §3).
- **Constraints:** unique `roles.key`, `permissions.key`; `role_permissions` PK
  `(role_id, permission_id)` with cascading FKs; `platform_admins.user_id` PK FK
  `→ profiles(id) on delete cascade`. **Adds** the deferred FK
  `organization_members.role_id → roles(id)`.
- **Functions:** `has_permission(text)`, `is_org_admin()`, `is_platform_super_admin()`
  (all SECURITY DEFINER, see §4). Re-defines nothing from `0006` except adding the
  `profiles_guard_privilege()` trigger function + trigger.
- **Triggers:** `profiles_guard` (BEFORE UPDATE on `profiles`): non-admins cannot change
  `status`, `email`, `created_by`, `created_at`, `id`.
- **RLS:** add `profiles_select_admin`/`profiles_update_admin` (using `is_org_admin()`);
  `roles`/`permissions`/`role_permissions` are **read-only** to authenticated
  (`select` true), writes service-role only; `platform_admins` select = `is_platform_super_admin()`,
  writes service-role only.
- **Seed:** the permission catalog, the five org roles, and the role→permission mapping (§6).
  Idempotent.
- **Rollback:** `alter table organization_members drop constraint …; drop trigger
  profiles_guard …; drop function profiles_guard_privilege, has_permission, is_org_admin,
  is_platform_super_admin; drop table role_permissions, platform_admins, permissions, roles;`

### 0009_audit_log.sql
- **Purpose:** the single, raw, append-only event store.
- **Tables:** `public.audit_log` (see §3).
- **Indexes:** `(entity_type, entity_id, created_at desc)`; `(organization_id, created_at
  desc)`; `(actor_id)`; `(action)`.
- **Functions:** `public.log_event(...)` (SECURITY DEFINER, derives actor from `auth.uid()`,
  see §4).
- **RLS:** enable; **select** gated by `has_permission('audit.read')` or
  `is_platform_super_admin()`; **no insert/update/delete policies** (append-only — the only
  writer is `log_event()` as definer, or the service role).
- **Seed:** none.
- **Rollback:** `drop function log_event; drop table audit_log;`

### 0010_rate_limit.sql
- **Purpose:** DB-backed windowed counters for sensitive flows.
- **Tables:** `public.rate_limit` (see §3).
- **Functions:** `public.hit_rate_limit(text, text, int, int)` (SECURITY DEFINER, see §4).
- **RLS:** enable; **no policies** (deny all) → reachable only by the service role and the
  definer function. `execute` on the function granted to `authenticated` + `service_role`.
- **Seed:** none.
- **Rollback:** `drop function hit_rate_limit; drop table rate_limit;`

### 0011_outbox_email.sql
- **Purpose:** minimal reliable outbound-email spine.
- **Tables:** `public.outbox`, `public.email_log` (see §3).
- **Indexes:** `outbox(status, next_retry_at)`, `outbox(unique dedupe_key)`;
  `email_log(to_email, created_at)`, `email_log(outbox_id)`.
- **Functions:** `claim_outbox(int, text)`, `complete_outbox(uuid, boolean, text, text)`
  (SECURITY DEFINER; `execute` to `service_role` only — see §4/§8).
- **RLS:** enable on both; **no policies** (service-role only). No client access in P0.
- **Seed:** none.
- **Rollback:** `drop function claim_outbox, complete_outbox; drop table email_log, outbox;`

### 0012_avatars_storage.sql
- **Purpose:** private avatar storage (policies only; no upload UI in P0).
- **Storage:** create private bucket `avatars` (`public=false`).
- **Policies (storage.objects):** a user may `select/insert/update/delete` objects whose first
  path segment equals their `auth.uid()`; `is_org_admin()`/`is_platform_super_admin()` may
  manage any object in the bucket.
- **Seed:** the bucket row (idempotent `on conflict (id) do nothing`).
- **Rollback:** `drop policy … on storage.objects; delete from storage.buckets where
  id='avatars';` (only if empty).

---

## 3. Exact table definitions

Conventions: all `id` defaults `gen_random_uuid()` unless noted; `created_at`/`updated_at` are
`timestamptz not null default now()`; text status fields are constrained by `check`.

### profiles
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | — | PK; FK `auth.users(id)` on delete cascade |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | touched by trigger |
| status | text | no | 'invited' | check in (active, disabled, invited) |
| first_name | text | yes | — | |
| last_name | text | yes | — | |
| email | text | no | — | unique on `lower(email)` |
| phone | text | yes | — | |
| avatar_url | text | yes | — | |
| created_by | uuid | yes | — | FK `auth.users(id)` on delete set null |

Indexes: `unique profiles_email_key (lower(email))`, `profiles_status_idx (status)`.

### organizations
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| slug | text | no | — | unique |
| name | text | no | — | |
| status | text | no | 'active' | check in (active, disabled) |

### organization_members
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| organization_id | uuid | no | — | FK `organizations(id)` cascade |
| user_id | uuid | no | — | FK `profiles(id)` cascade |
| role_id | uuid | no | — | FK `roles(id)` **added in 0008** |
| member_type | text | no | 'internal' | check in (internal, external) |
| status | text | no | 'invited' | check in (active, disabled, invited) |

Constraints: `unique (organization_id, user_id)`. Indexes: `(user_id)`, `(organization_id)`,
`(role_id)`.

### roles
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| key | text | no | — | unique (e.g. `organization_admin`) |
| label | text | no | — | |
| is_system | boolean | no | true | system roles are not user-deletable |
| created_at | timestamptz | no | now() | |

`platform_super_admin` is **not** a row here — it is the `platform_admins` table.

### permissions
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| key | text | no | — | unique (e.g. `users.create`) |
| module | text | no | — | e.g. `users`, `audit`, `org` |
| label | text | no | — | |
| created_at | timestamptz | no | now() | |

### role_permissions
| column | type | null | default | notes |
|---|---|---|---|---|
| role_id | uuid | no | — | FK `roles(id)` cascade |
| permission_id | uuid | no | — | FK `permissions(id)` cascade |

PK `(role_id, permission_id)`.

### platform_admins
| column | type | null | default | notes |
|---|---|---|---|---|
| user_id | uuid | no | — | PK; FK `profiles(id)` cascade |
| granted_by | uuid | yes | — | FK `auth.users(id)` set null |
| granted_at | timestamptz | no | now() | |
| reason | text | yes | — | why this account is platform super-admin |

### audit_log
| column | type | null | default | notes |
|---|---|---|---|---|
| id | bigint | no | generated always as identity | PK |
| created_at | timestamptz | no | now() | |
| organization_id | uuid | yes | — | FK `organizations(id)` set null |
| actor_id | uuid | yes | — | auth user; null = system |
| actor_email | text | yes | — | snapshot |
| actor_name | text | yes | — | snapshot |
| actor_role | text | yes | — | role key or `platform_super_admin` |
| actor_type | text | no | 'internal_user' | check: internal_user, external_user, system, link_user, integration |
| action | text | no | — | free text, e.g. `user.created` |
| entity_type | text | yes | — | polymorphic |
| entity_id | text | yes | — | text (any id type) |
| entity_display_name | text | yes | — | |
| parent_entity_type | text | yes | — | |
| parent_entity_id | text | yes | — | |
| old_status | text | yes | — | |
| new_status | text | yes | — | |
| old_values | jsonb | yes | — | technical |
| new_values | jsonb | yes | — | technical |
| metadata | jsonb | yes | — | technical |
| ip_address | inet | yes | — | technical |
| user_agent | text | yes | — | technical |
| request_id | text | yes | — | technical |
| session_id | text | yes | — | technical |
| source | text | no | 'portal' | check: portal, public_link, email_link, api, system_job, webhook, platform |
| severity | text | no | 'info' | check: info, warning, critical |
| visible_to_admin | boolean | no | true | |
| visible_to_client | boolean | no | false | |

### rate_limit
| column | type | null | default | notes |
|---|---|---|---|---|
| bucket | text | no | — | e.g. `login` |
| identifier | text | no | — | hashed ip / email / user id |
| window_start | timestamptz | no | — | bucket start |
| hits | integer | no | 0 | |

PK `(bucket, identifier, window_start)`. Index `(window_start)` for cleanup.

### outbox
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| organization_id | uuid | yes | — | FK `organizations(id)` set null |
| channel | text | no | 'email' | check in (email) — only email in v1 |
| dedupe_key | text | yes | — | **unique** (idempotency) |
| payload | jsonb | no | — | see §8 |
| status | text | no | 'pending' | check: pending, processing, sent, failed, retrying, cancelled |
| attempts | integer | no | 0 | |
| max_attempts | integer | no | 5 | |
| last_attempt_at | timestamptz | yes | — | |
| next_retry_at | timestamptz | yes | — | due time for retry |
| locked_at | timestamptz | yes | — | claim marker |
| locked_by | text | yes | — | worker id |
| provider_message_id | text | yes | — | Resend id |
| error | text | yes | — | sanitised |
| audit_event_id | bigint | yes | — | FK `audit_log(id)` |

Indexes: `(status, next_retry_at)`, `unique (dedupe_key)`.

### email_log
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| outbox_id | uuid | yes | — | FK `outbox(id)` set null |
| organization_id | uuid | yes | — | |
| to_email | text | no | — | |
| subject | text | no | — | |
| template_key | text | yes | — | |
| status | text | no | 'sent' | check in (sent, failed) — delivered/bounced later |
| provider_message_id | text | yes | — | |
| error | text | yes | — | |
| audit_event_id | bigint | yes | — | FK `audit_log(id)` |

Indexes: `(to_email, created_at)`, `(outbox_id)`.

---

## 4. Authorization SQL functions

All are `SECURITY DEFINER` with `set search_path = ''` (every object schema-qualified), so
they run as the owner and **bypass RLS** without recursion, while `auth.uid()` still returns
the **calling** user. All return safe defaults when there is no authenticated user.

- **`current_org() → uuid`** — `stable`. Returns the caller's single active membership org:
  `select organization_id from public.organization_members where user_id = auth.uid() and
  status='active' limit 1`. Returns `null` when unauthenticated or no membership. *v1
  assumption: a user belongs to one org; multi-org "active org" selection (JWT claim or session
  GUC) is a later change.* No escalation: reads membership as owner, keyed to `auth.uid()`.

- **`current_company()`** — **DEFERRED in P0** (no `companies` table). Documented for later:
  will return the caller's `company_id` from membership. Not created now.

- **`has_permission(p_key text) → boolean`** — `stable`. Returns `true` if
  `is_platform_super_admin()` (short-circuit), else `true` when an **active** membership in
  `current_org()` has a role mapped to `p_key` **and** the caller's `profiles.status='active'`:
  joins `organization_members → role_permissions → permissions`. Returns `false` when
  unauthenticated. Escalation-proof: reads `role_permissions`/`permissions` (not user-writable
  under RLS) as owner; key by `auth.uid()`.

- **`is_org_admin() → boolean`** — `stable`. Thin wrapper:
  `select public.has_permission('org.manage')` (so platform super-admins and org-admins both
  pass). Used by the profiles guard + admin RLS policies.

- **`is_platform_super_admin() → boolean`** — `stable`. `true` when a row exists in
  `public.platform_admins` for `auth.uid()` **and** the profile is `active`. `false` when
  unauthenticated. This is the only cross-org escalation path and every use is audited.

- **`log_event(...) → bigint`** — inserts one `audit_log` row and returns its id.
  **Derives `actor_*` from `auth.uid()`** (joins `profiles` + membership + `platform_admins`),
  so a caller **cannot forge** the actor. `actor_type` = `system` when `auth.uid()` is null
  (service-role/system jobs), else `internal_user` (external/link/integration set explicitly by
  caller param later). Parameters supplied by the caller are the **non-identity** fields:
  `action`, `entity_type`, `entity_id`, `entity_display_name`, `old_status`, `new_status`,
  `old_values`, `new_values`, `metadata`, `organization_id` (defaults `current_org()`),
  `severity`, `source`, `ip_address`, `user_agent`, `request_id`, `session_id`. No permission
  needed to *write* (every action must be auditable); it is the **only** insert path
  (append-only RLS blocks direct inserts). `execute` to `authenticated` + `service_role`.

- **`hit_rate_limit(p_bucket text, p_identifier text, p_limit int, p_window_seconds int) →
  boolean`** — computes the current fixed window
  (`to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds)`),
  upserts the counter (`insert … on conflict (bucket, identifier, window_start) do update set
  hits = rate_limit.hits + 1`), and returns `true` when `hits <= p_limit` else `false`
  (over limit). No auth required (called pre-login with an ip/email identifier). `execute` to
  `authenticated` + `service_role`. *(Fixed-window counter; a true sliding-log limiter is a
  later refinement.)*

- **`claim_outbox(p_limit int, p_worker text) → setof outbox`** — atomically selects up to
  `p_limit` **due** rows (`status in ('pending','retrying') and (next_retry_at is null or
  next_retry_at <= now()) and locked_at is null`) using `for update skip locked`, marks them
  `status='processing', locked_at=now(), locked_by=p_worker, attempts=attempts+1,
  last_attempt_at=now()`, and returns them. `execute` to **`service_role` only**.

- **`complete_outbox(p_id uuid, p_success boolean, p_provider_message_id text, p_error text) →
  void`** — on success: `status='sent'`, set `provider_message_id`, clear lock/error, insert an
  `email_log` row (`status='sent'`). On failure: if `attempts >= max_attempts` →
  `status='failed'` + `email_log(status='failed', error=...)`; else `status='retrying'`,
  `next_retry_at = now() + backoff(attempts)`, clear lock. `execute` to **`service_role`
  only**. Backoff: `least(power(2, attempts) , 60) * interval '1 minute'` (cap ~1h).

**Grants summary:** authz/`current_org`/`has_permission`/`is_*`/`log_event`/`hit_rate_limit`
→ `authenticated` (+ `service_role`); `claim_outbox`/`complete_outbox` → `service_role` only.
`execute` is **revoked from `public`/`anon`** on all of them.

---

## 5. RLS strategy

| table | RLS | select | insert | update | delete |
|---|---|---|---|---|---|
| profiles | on | self **or** `is_org_admin()` | none (only `handle_new_user` trigger / service role) | self **or** `is_org_admin()` (guard trigger limits fields) | none (auth.users cascade) |
| organizations | on | active member **or** platform super | service role | service role | none |
| organization_members | on | own rows **or** `is_org_admin()` | service role (P3 action) | service role | service role |
| roles | on | `authenticated` (read-only) | service role | service role | service role |
| permissions | on | `authenticated` (read-only) | service role | service role | service role |
| role_permissions | on | `authenticated` (read-only) | service role | service role | service role |
| platform_admins | on | `is_platform_super_admin()` | service role | service role | service role |
| audit_log | on | `has_permission('audit.read')` **or** platform super | **none** (only `log_event()` / service role) | **none** | **none** |
| rate_limit | on | **none** | **none** | **none** | **none** (function/service role only) |
| outbox | on | **none** | **none** | **none** | **none** (function/service role only) |
| email_log | on | **none** | **none** | **none** | **none** (service role only) |

- **Who can access what:** a user sees only their own profile + membership; org-admins see all
  profiles/members of their org; auditors can read `audit_log`; nobody but the service role
  touches `rate_limit`/`outbox`/`email_log`.
- **platform_super_admin:** never via a blanket bypass — RLS policies that legitimately need
  cross-org access add `or is_platform_super_admin()` explicitly, and those paths always call
  `log_event(... source='platform', severity>='warning')`.
- **Organization boundaries:** every membership-scoped policy filters on
  `organization_id = current_org()`; a user in org A cannot resolve org B rows because
  `current_org()` returns only their org and `has_permission()` checks membership in that org.
- **Disabled users:** `has_permission()` and the `is_*` helpers all require
  `profiles.status='active'` (and membership `status='active'`), so a disabled user fails every
  permission check at the DB layer; the server `requireAuth()` (P1) also rejects them live, and
  a Supabase ban (P1) stops token refresh.
- **Append-only audit:** `audit_log` has select-only policies and **no** insert/update/delete
  policy, so even an authenticated user cannot mutate it; `log_event()` (definer) is the sole
  writer.
- **Privilege guard:** `profiles_guard` reverts `status`/`email`/`created_by`/`created_at`/`id`
  for non-admins, so escalation is impossible even with a crafted update that passes the RLS
  `using` clause.

---

## 6. Seed data

Seeded inside migrations (idempotent: `insert … on conflict (key) do nothing`), **except the
owner bootstrap**, which is a documented post-apply one-off (no auth user exists at migration
time).

- **Organization (0007):** one row — `slug='amai'`, `name='amai'`, `status='active'`.
- **Roles (0008):** `organization_admin`, `organization_user`, `external_client`,
  `external_partner`, `auditor` (all `is_system=true`). *(`platform_super_admin` is the
  `platform_admins` table, not a role.)*
- **Permissions (0008) — full catalog (seeded now, most unused until later modules):**
  `users.read`, `users.create`, `users.update`, `users.disable`, `users.change_role`,
  `audit.read`, `audit.read_technical`, `org.manage`, `roles.manage`,
  `projects.read/create/update/delete`, `finance.read/create_invoice/send_invoice`,
  `documents.read/upload/send`, `nda.create/send/revoke/view_audit`, `products.read/update`.
- **Role → permission mapping (0008):**
  - `organization_admin` → `users.*`, `audit.read`, `audit.read_technical`, `org.manage`,
    `roles.manage` (and every future module permission, granted as those rows exist).
  - `organization_user` → **none** (a normal user reads/edits only their own profile via RLS;
    no management permissions).
  - `auditor` → `audit.read`, `audit.read_technical`.
  - `external_client`, `external_partner` → **none** in v1 (company-scoped later).
- **Owner bootstrap (post-apply, manual, documented):** after the owner's auth user exists,
  run once:
  ```sql
  -- 1) make the owner a platform super-admin
  insert into public.platform_admins (user_id, reason)
  select id, 'founder/bootstrap' from auth.users where lower(email)=lower('you@amai.ch')
  on conflict (user_id) do nothing;
  -- 2) add an active organization_admin membership in the 'amai' org
  insert into public.organization_members (organization_id, user_id, role_id, member_type, status)
  select o.id, u.id, r.id, 'internal', 'active'
  from public.organizations o, auth.users u, public.roles r
  where o.slug='amai' and lower(u.email)=lower('you@amai.ch') and r.key='organization_admin'
  on conflict (organization_id, user_id) do update set role_id=excluded.role_id, status='active';
  -- 3) activate the profile
  update public.profiles set status='active' where lower(email)=lower('you@amai.ch');
  ```

---

## 7. TypeScript foundation files

All are **server-only** unless noted. None import the service-role key into client code.

| file | purpose | exports | safety |
|---|---|---|---|
| `src/lib/supabase/admin.ts` | service-role + auth-admin client | `createAdminClient()` (exists in `server.ts` today → moved/duplicated here), `authAdmin()` helpers | **server only**; never imported by a client component; reads `SUPABASE_SERVICE_ROLE_KEY` |
| `src/lib/security/authorize.ts` | typed wrappers over the SQL authz fns | `hasPermission(key)`, `isOrgAdmin()`, `isPlatformSuperAdmin()`, `currentOrg()` | server only; call via the cookie (authenticated) client so `auth.uid()` resolves |
| `src/lib/security/rbac.ts` (**revise existing**) | route/action guards | `requireAuth()`, `requirePermission(key)`, `requireOrgAdmin()`, `getCurrentProfile()`, `getUserPermissions()`, `can(action, entity?)`, `LOGIN_PATH`, `DASHBOARD_PATH` | server only; **remove** the old `requireAdmin`/`isAdmin` (role-on-profile); redirects unauth → `/app/login` |
| `src/lib/security/ratelimit.ts` | app-level limiter | `checkRateLimit(bucket, identifier, limit, windowSeconds)` → `{ allowed }` (calls `hit_rate_limit`) | server only |
| `src/lib/audit/log.ts` | audit writer | `logEvent(input)` (calls `log_event` RPC) + the `AuditInput` type | server only; never trust client-supplied actor |
| `src/lib/outbox/enqueue.ts` | enqueue an email job | `enqueueEmail(input)` (insert into `outbox`, dedupe-aware) + `OutboxEmailPayload` type | server only |
| `src/lib/outbox/worker.ts` | process the queue | `processPending(limit?)` (calls `claim_outbox`, sends via Resend, `complete_outbox`) | server only; uses the **admin** client |
| `src/lib/status/types.ts` | state-machine types | `StatusMachine`, `Transition`, `StatusToken` types + `applyTransition()` signature (no domain machines yet) | client-safe (types only) |
| `src/lib/status/colors.ts` | semantic status colors | `STATUS_COLORS` map (draft/sent/waiting/opened/done/cancelled/revoked/failed/system/warning/critical) + `statusColor(token)` | client-safe |
| `src/lib/types/database.ts` (**revise existing**) | typed schema | add `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `platform_admins`, `rate_limit`, `outbox`, `email_log`; **change** `profiles` (drop `role`), **replace** `audit_log` with the rich shape; drop the `Role`/`AuditAction` narrow enums in favour of new types | regenerate from the DB after apply, then hand-verify standalone exports still present |

Dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `zod` (already in the project), Resend
SDK (already used for lead emails). No new runtime deps expected.

---

## 8. Outbox v1 technical design (minimal reliable)

- **`enqueueEmail(input)`** writes one `outbox` row: `channel='email'`, `status='pending'`,
  `payload`, optional `dedupe_key`, `organization_id`. Returns the row id. If `dedupe_key`
  collides (unique), it is a no-op (returns the existing row) — safe to call twice.
- **Payload shape** (`OutboxEmailPayload`, stored in `payload jsonb`):
  ```
  { to: string, template: 'invite' | 'password_reset', subject: string,
    vars: { firstName?: string, actionUrl: string, ... }, from?: string,
    replyTo?: string }
  ```
  The actual HTML is rendered by the worker from `template` + `vars` (branded templates in
  `lib/email/templates`), so payloads stay small and no secrets are stored.
- **dedupe_key strategy:** `"{template}:{to}:{purpose-token}"`, e.g.
  `password_reset:user@x.com:{reset_token_jti}` or `invite:user@x.com:{membership_id}`. Prevents
  duplicate sends on retried server actions.
- **Status transitions:** `pending → processing` (claim) → `sent` (success) **or**
  `retrying → processing → …` (transient failure) → `failed` (after `max_attempts`).
  `cancelled` is a manual/admin terminal state (no UI in P0; value reserved).
- **Retry:** exponential backoff `least(2^attempts, 60)` minutes, capped ~1h, until
  `max_attempts` (default 5). `claim_outbox` uses `for update skip locked` so multiple worker
  runs never double-send.
- **email_log link:** `complete_outbox` writes an `email_log` row referencing `outbox_id` with
  the final `status` (`sent`/`failed`), `provider_message_id`, and sanitised `error` — the
  durable record of what actually went out.
- **Explicitly deferred (NOT in P0/v1):** Resend delivery **webhook**, **open** tracking,
  **click** tracking, notification center, delivery dashboard. `email_log.status` therefore
  has only `sent`/`failed` in v1 (no `delivered`/`bounced`).

---

## 9. Audit technical design

- **`logEvent()`** (TS) calls the **`log_event()`** RPC with the cookie (authenticated) client
  for user actions, or the admin client for system jobs. The RPC derives `actor_*` from
  `auth.uid()` server-side, so the application layer **cannot spoof** who did what; the caller
  only provides the event's business fields + request context (ip/ua/request_id).
- **Raw vs display:** `audit_log` is the **raw evidence** layer — complete and immutable. The
  future `HistoryTimeline` (P3) will **not** render raw rows; it calls a query that maps each
  row through `lib/audit/display.ts` (keyed by `action`+`entity_type`) into a safe human
  sentence, and **omits** technical columns unless the viewer has `audit.read_technical`.
- **Append-only:** no update/delete RLS policies and no direct insert path (only the definer
  function). Corrections/retention are **new** events (e.g. `audit.redacted`), never mutations
  — this preserves evidentiary integrity.
- **Technical-field protection:** `ip_address`, `user_agent`, `old_values`, `new_values`,
  `metadata`, provider responses are returned only to `audit.read_technical` holders; the P3
  read query strips them for everyone else.
- **platform_super_admin logging:** any action taken through a platform-super-admin path is
  written with `source='platform'` and `severity>='warning'`, and `actor_role` =
  `platform_super_admin`, so cross-org access is always visible in the trail.
- **P0 scope:** the table + `log_event()` + the TS `logEvent()` writer + the display-template
  **shape** (an empty/initial map). The actual templates and the timeline UI are P3.

---

## 10. Rate-limiting technical design

- **Table:** `rate_limit(bucket, identifier, window_start, hits)`, PK
  `(bucket, identifier, window_start)`.
- **Window logic:** fixed window of `window_seconds`; `window_start` =
  `floor(epoch / window_seconds) * window_seconds`. `hit_rate_limit` upserts and returns
  whether `hits <= limit`. (True sliding-log limiting is a later refinement; fixed-window is
  reliable and cheap for v1.)
- **Buckets (defined now, enforced in P1/P4):** `login`, `password_reset`, `invite_resend`,
  `outbox_send` (worker self-throttle), `public_link` (reserved). P0 ships the table + function
  + the TS `checkRateLimit` wrapper; the **call sites** land with the flows in P1/P4.
- **Identifiers:** never raw PII in the key — use a salted hash of IP for ip-based buckets, the
  lowercased email for email-based buckets, or the user id for account-based buckets. Format
  `"{kind}:{value-or-hash}"`.
- **No account enumeration:** rate-limit responses are uniform; the `password_reset` flow
  always returns the same generic message whether or not the address exists, and the limiter
  never reveals counts to the client.
- **P0 vs later:** P0 = table + `hit_rate_limit()` + `checkRateLimit()` only. Wiring into
  login/reset/invite + Cloudflare Turnstile is P1/P4 (folds in task #18).

---

## 11. Security checks (must hold in P0)

- **Service-role key is server-only** — referenced solely in `lib/supabase/admin.ts` and the
  worker; a CI/bundle scan (P4, but principle enforced now) asserts the key name never appears
  in client output. Never `NEXT_PUBLIC_*`.
- **RLS is the boundary** — every new table has RLS on; nothing relies on the UI for access
  control.
- **Server-side permission checks** — `requirePermission()` / `has_permission()` guard
  sensitive operations; live DB reads, not cached claims.
- **No hardcoded role checks** anywhere except the **seed** and the **owner bootstrap**. All
  runtime checks go through `has_permission()` / `is_org_admin()` / `is_platform_super_admin()`.
- **platform_super_admin safety** — stored in its own table, never a blanket RLS bypass, every
  use audited (`source='platform'`).
- **Disabled-user strategy prepared** — `profiles.status` + membership `status` are checked by
  every authz function; the live `requireAuth` check and Supabase ban land in P1.
- **Org-boundary enforcement** — `current_org()` + membership-scoped policies; verified by the
  org-boundary tests (§12).
- **Additive migration discipline** — `0006` revised pre-apply only; thereafter additive; the
  six existing business tables are never modified.

---

## 12. Test specification for P0

Run on a **throwaway** Postgres/Supabase (local `supabase start` or a scratch project), never
the amai or SEMANU databases.

**Function tests**
- `current_org()` returns the seeded org for a member; `null` for a non-member / unauthenticated.
- `is_platform_super_admin()` true only for `platform_admins` rows + active profile.
- `has_permission('users.create')` true for org_admin, false for org_user, true for platform
  super; false when the profile is `disabled`.
- `is_org_admin()` mirrors `has_permission('org.manage')`.

**RLS tests (as a low-privilege `authenticated` role with a set `auth.uid()`)**
- profiles: a user selects only their own row; an org_admin selects all in the org; update of
  own `first_name` succeeds; update of own `status`/`email` is **reverted** by the guard.
- organization_members: a user sees only own membership; cannot insert/update.
- roles/permissions/role_permissions: readable; not writable.
- platform_admins: readable only by a platform super-admin.
- audit_log: readable with `audit.read`; **insert/update/delete all rejected** for
  authenticated (append-only); `log_event()` insert succeeds.
- rate_limit / outbox / email_log: **no** authenticated select/insert/update/delete.

**Permission & escalation**
- org_user cannot read another profile, cannot read `/users`-scope data, cannot read
  `audit_log`, cannot self-assign a role, cannot self-activate.
- platform-super-admin cross-org read works **and** writes a `source='platform'` audit row.

**Org boundary**
- Two orgs, two users: user A cannot see org B's profiles/members; `current_org()` returns only
  A's org.

**Audit append-only**
- direct `update`/`delete` on `audit_log` raise (RLS); a redaction is a **new** row.
- `log_event()` stamps `actor_*` from `auth.uid()` and ignores any client-supplied actor.

**Rate limit**
- `hit_rate_limit('login','ip:hash',5,60)` returns true for hits 1–5, false on 6; a new window
  resets the counter.

**Outbox claim/complete**
- `enqueueEmail` writes `pending`; duplicate `dedupe_key` is a no-op.
- `claim_outbox(10,'w1')` flips due rows to `processing` and is concurrency-safe (a second
  concurrent claim returns disjoint rows via `skip locked`).
- `complete_outbox(id,true,'rs_x',null)` → `sent` + an `email_log(status='sent')` row.
- `complete_outbox(id,false,null,'smtp error')` → `retrying` with a future `next_retry_at`,
  then `failed` once `attempts >= max_attempts`.

**Bundle safety**
- a grep of the built client output for the service-role key name returns nothing (principle
  check now; automated in P4).

**Type gate**
- `npx tsc --noEmit` clean after the `database.ts` revision.

---

## 13. Manual configuration required (P0 only)

**Supabase (the amai project — NOT a SEMANU project; it is not in the connected MCP account, so
you apply these yourself):**
- Apply `0006`–`0012` **in order** (SQL editor or `supabase db push`).
- Create your owner auth user (Auth → Users → Add user, email + password) **then** run the
  owner-bootstrap SQL from §6.
- Confirm the `avatars` bucket is **private**.
- Copy the **Project URL**, **anon key**, **service-role key** into the env (below).
- Regenerate `src/lib/types/database.ts` (`supabase gen types …`) and re-add the standalone
  type aliases the app imports.
- Run **Advisors** (security + performance) and clear any RLS findings.

**Vercel:** for P0 there is **no UI/route to deploy**, so no runtime change is required. Just
ensure the env vars exist (locally in `.env.local`, and in Vercel for later phases):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`. (Cron + `CRON_SECRET` + `PORTAL_ENABLED` come in P1.)

**Resend:** verified domain `amai.ch` (already done) and `RESEND_API_KEY` present so the worker
lib compiles/tests. No webhook, no templates required for P0 (templates land in P1).

**Cloudflare:** **nothing for P0.** Rate-limit rules + Turnstile are wired in P1/P4.

---

## 14. Risks, assumptions, open questions, recommended decisions

**Risks**
- The amai Supabase is not in the connected MCP account → I cannot apply or auto-test against
  it; you run migrations manually and we test on a throwaway DB.
- Revising `0006` in place is safe **only** because it is unapplied; if it has been applied
  anywhere, switch to an additive corrective migration instead.
- `log_event()` adds one row + a small lookup per audited action → acceptable at our volume.

**Assumptions**
- A user belongs to exactly one organization in v1 (`current_org()` returns it directly).
- `audit_log.id` is `bigint` identity (matches the SEMANU precedent); `entity_id` is `text` to
  stay polymorphic.
- Admin profile mutations (status/disable) run with the **authenticated admin** client (so
  `is_org_admin()` holds), not the service role; user creation uses the service-role admin API.

**Open questions**
- `organization_user` default permissions: recommended **none** (own data via RLS). Confirm.
- Worker runner: **Vercel Cron** → `/api/cron/outbox` (recommended) vs Supabase pg_cron. The
  route is P1; the `processPending()` function is testable now without it.
- Owner email for the bootstrap SQL (which address becomes `platform_super_admin`).

**Recommended decisions before building**
1. Confirm `bigint` audit id + `text` entity_id. *(Recommended: yes.)*
2. Confirm the permission catalog + the role→permission mapping in §6. *(Recommended: as
   written.)*
3. Confirm `organization_user` gets no explicit permissions. *(Recommended: yes.)*
4. Provide the **owner email** for the bootstrap.
5. Confirm `0006` is unapplied everywhere (so in-place revision is allowed).

---

## 15. Implementation-readiness checklist (must be true before approving the P0 build)

- [ ] You confirm `0006` has **not** been applied on any environment (so it may be revised in
      place); otherwise we switch to additive-only from `0007`.
- [ ] The target **amai Supabase project ref** is identified (and, ideally, connected — or you
      will apply migrations manually).
- [ ] The **owner email** for the platform-super-admin bootstrap is provided.
- [ ] The **permission catalog** (§6) and **role→permission mapping** are approved.
- [ ] `organization_user` default-permission decision is confirmed (recommended: none).
- [ ] `audit_log.id = bigint`, `entity_id = text` confirmed.
- [ ] Env vars available locally (`SUPABASE_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`).
- [ ] Agreement that P0 ships **no UI** and that the live site + the six existing business
      tables stay untouched.
- [ ] A throwaway database is available for the §12 test run.

**On all boxes checked, P0 build = migrations `0006`–`0012` + the server-only lib spine, type-
safe (`tsc` clean) and verified against the §12 checklist. No UI.**

---

# PART III — P0 CORRECTIONS (C1–C9, AUTHORITATIVE)


> Refines `PORTAL_P0_SPEC.md`. The master architecture (`PORTAL_PLAN.md`, Part B) is unchanged.
> **SUPERSEDED — P0–P3 are built; see CURRENT STATE (top) + Parts IV–VI. Historical context below.** Each item replaces the corresponding section of the P0 spec.
> Migration files will be (re)generated from these corrected sections at build time; the only
> file written so far (`0006_profiles.sql`) already matches and is unaffected by C1–C8.

---

## C1 — `current_org()` is a v1-only assumption

`current_org()` may return the single active membership for v1, but this is **explicitly
temporary**.

```sql
-- V1 ASSUMPTION ONLY: a user has exactly one active organization.
-- Before multi-org support is enabled this MUST be replaced by an explicit
-- "active organization" context — a server-side selected + verified org id,
-- a secure session value, or a JWT claim used ONLY as context and re-validated
-- against organization_members. `limit 1` is NOT the multi-org implementation.
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.organization_members
  where user_id = (select auth.uid()) and status = 'active'
  limit 1   -- v1 only; see note above
$$;
```

A tracked TODO (`docs` + code comment) records the required change before any second org is
created.

---

## C2 — `log_event()` abuse protection (server-only writer)

The raw event writer is **not** client-callable.

- **`EXECUTE` on `log_event()` is granted to `service_role` only** (revoked from
  `public`/`anon`/`authenticated`). A browser/`authenticated` session **cannot** call it via
  `rpc()`.
- The **only** caller is the server-side wrapper `logEvent()` (`src/lib/audit/log.ts`), which
  runs with the **admin (service-role)** client and passes a **server-verified** `actor_id`
  (the session user resolved via `getUser()` in the same request) and `actor_type`.
- `log_event()` **validates** inputs: `action` non-empty; `source`/`severity` within the
  allowed sets (also enforced by `CHECK`); privileged sources (`platform`, `system_job`,
  `webhook`, `api`) and `severity='critical'` can only originate from server code (guaranteed
  by service-role-only execution). Invalid combinations raise.
- Ordinary users cause audit rows **only indirectly**, through approved server actions.

```sql
create or replace function public.log_event(
  p_action text,
  p_actor_id uuid default null,            -- trusted, supplied by server (session user) or null=system
  p_actor_type text default 'internal_user',
  p_entity_type text default null, p_entity_id text default null,
  p_entity_display_name text default null,
  p_old_status text default null, p_new_status text default null,
  p_old_values jsonb default null, p_new_values jsonb default null, p_metadata jsonb default null,
  p_organization_id uuid default null,
  p_severity text default 'info', p_source text default 'portal',
  p_ip inet default null, p_user_agent text default null,
  p_request_id text default null, p_session_id text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_email text; v_name text; v_role text; v_id bigint;
begin
  if coalesce(p_action,'') = '' then raise exception 'log_event: action required'; end if;
  if p_source   not in ('portal','public_link','email_link','api','system_job','webhook','platform')
     then raise exception 'log_event: bad source %', p_source; end if;
  if p_severity not in ('info','warning','critical')
     then raise exception 'log_event: bad severity %', p_severity; end if;

  if p_actor_id is not null then
    select email, nullif(trim(coalesce(first_name,'')||' '||coalesce(last_name,'')),'')
      into v_email, v_name from public.profiles where id = p_actor_id;
    select case when exists (select 1 from public.platform_admins where user_id = p_actor_id)
                then 'platform_super_admin'
                else (select r.key from public.organization_members om
                        join public.roles r on r.id = om.role_id
                       where om.user_id = p_actor_id
                         and om.organization_id = coalesce(p_organization_id, public.current_org())
                       limit 1) end
      into v_role;
  end if;

  insert into public.audit_log (
    organization_id, actor_id, actor_email, actor_name, actor_role, actor_type,
    action, entity_type, entity_id, entity_display_name,
    old_status, new_status, old_values, new_values, metadata,
    ip_address, user_agent, request_id, session_id, source, severity)
  values (
    p_organization_id, p_actor_id, v_email, v_name, v_role, p_actor_type,
    p_action, p_entity_type, p_entity_id, p_entity_display_name,
    p_old_status, p_new_status, p_old_values, p_new_values, p_metadata,
    p_ip, p_user_agent, p_request_id, p_session_id, p_source, p_severity)
  returning id into v_id;
  return v_id;
end; $$;

revoke execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) from public;
grant  execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) to service_role;
```

---

## C3 — `roles` / `permissions` / `role_permissions` are admin-only readable

Normal users never read the permission catalog.

- RLS `select` on `roles`, `permissions`, `role_permissions` =
  `using (public.is_org_admin() or public.is_platform_super_admin())` (replaces `using (true)`).
- Normal users get **only their resolved permission keys** through a definer helper:

```sql
create or replace function public.get_user_permissions()
returns setof text language sql stable security definer set search_path = '' as $$
  select perm.key
  from public.organization_members om
  join public.role_permissions rp on rp.role_id = om.role_id
  join public.permissions perm    on perm.id = rp.permission_id
  where om.user_id = (select auth.uid())
    and om.organization_id = public.current_org()
    and om.status = 'active'
  union
  select key from public.permissions where public.is_platform_super_admin();  -- super-admin = all
$$;
grant execute on function public.get_user_permissions() to authenticated, service_role;
```

TS `getUserPermissions()` wraps this RPC; the catalog tables are never read by normal users.

---

## C4 — `organization_members.role_id` FK ordering (explicit)

Chosen approach (no ordering failure possible):

- **`0007`** creates `organization_members.role_id uuid NOT NULL` **without** a foreign key.
- **`0008`** (after `roles` exists) runs:
  ```sql
  alter table public.organization_members
    add constraint organization_members_role_id_fkey
    foreign key (role_id) references public.roles (id);
  ```

`0007` therefore never references `roles`; the FK is added once `roles` exists. (Already
reflected in the draft migrations.)

---

## C5 — Owner bootstrap fails loudly

Run **after** the owner's auth user exists. Replace `OWNER_EMAIL`.

```sql
do $$
declare v_uid uuid; v_org uuid; v_role uuid; v_count int;
begin
  select count(*) into v_count from auth.users where lower(email) = lower('OWNER_EMAIL');
  if v_count = 0 then raise exception 'Owner bootstrap: no auth user matches %', 'OWNER_EMAIL'; end if;
  if v_count > 1 then raise exception 'Owner bootstrap: % auth users match %', v_count, 'OWNER_EMAIL'; end if;

  select id into v_uid  from auth.users         where lower(email) = lower('OWNER_EMAIL');
  select id into v_org  from public.organizations where slug = 'amai';
  select id into v_role from public.roles         where key  = 'organization_admin';
  if v_org  is null then raise exception 'Owner bootstrap: org amai missing (run 0007)'; end if;
  if v_role is null then raise exception 'Owner bootstrap: role organization_admin missing (run 0008)'; end if;

  insert into public.platform_admins (user_id, reason)
    values (v_uid, 'founder/bootstrap') on conflict (user_id) do nothing;
  insert into public.organization_members (organization_id, user_id, role_id, member_type, status)
    values (v_org, v_uid, v_role, 'internal', 'active')
    on conflict (organization_id, user_id) do update set role_id = excluded.role_id, status = 'active';
  update public.profiles set status = 'active' where id = v_uid;
end $$;
```

No silent no-op: wrong/missing/duplicate email raises.

---

## C6 — `outbox.dedupe_key` is required, unique, non-null

```sql
dedupe_key text not null unique
```

- `enqueueEmail()` **always** computes or receives a `dedupe_key` (e.g.
  `"{template}:{lower(to)}:{purpose_token}"`, where `purpose_token` is the reset-token jti or
  the membership/invite id).
- On `dedupe_key` conflict the insert is a **no-op** and `enqueueEmail()` returns the existing
  row id (`on conflict (dedupe_key) do nothing` + select), so retried server actions never
  double-send. No nullable dedupe keys in v1.

---

## C7 — `rate_limit.identifier` is hashed, never raw PII

`identifier` only ever holds:

- `ip_hash:<hash>` — salted SHA-256 of the client IP,
- `email_hash:<hash>` — salted SHA-256 of `lower(email)`,
- `user:<uuid>` — the auth user id.

Hashing happens **server-side** in `src/lib/security/ratelimit.ts` using a secret pepper
`RATE_LIMIT_SALT` (env, server-only). **Raw or lowercased e-mail addresses are never stored**
in `rate_limit`. The DB function `hit_rate_limit()` receives the already-built identifier and
stays unchanged.

---

## C8 — Audit technical fields are protected; safe history via RPC

- **Raw `audit_log` `SELECT`** is restricted to **`audit.read_technical` or
  `platform_super_admin`** (replaces the `audit.read` select policy):
  ```sql
  create policy audit_select_technical on public.audit_log
    for select to authenticated
    using (public.has_permission('audit.read_technical') or public.is_platform_super_admin());
  ```
- Normal audit history (and `HistoryTimeline`) goes through a **display-safe RPC** that returns
  **no** technical columns (`ip_address`, `user_agent`, `metadata`, `old_values`, `new_values`,
  `request_id`, `session_id` are omitted) and checks `audit.read` internally:
  ```sql
  create or replace function public.audit_history(
    p_entity_type text, p_entity_id text, p_limit int default 50, p_offset int default 0)
  returns table (id bigint, created_at timestamptz, actor_name text, actor_role text,
                 actor_type text, action text, entity_type text, entity_id text,
                 entity_display_name text, old_status text, new_status text,
                 source text, severity text)
  language sql stable security definer set search_path = '' as $$
    select id, created_at, actor_name, actor_role, actor_type, action, entity_type,
           entity_id, entity_display_name, old_status, new_status, source, severity
    from public.audit_log
    where (public.has_permission('audit.read') or public.is_platform_super_admin())
      and entity_type = p_entity_type and entity_id = p_entity_id
    order by created_at desc
    limit greatest(p_limit,0) offset greatest(p_offset,0)
  $$;
  grant execute on function public.audit_history(text,text,int,int) to authenticated, service_role;
  ```
- **TypeScript audit query plan:** `getHistory(entityType, entityId)` calls `audit_history`
  (display-safe) by default. A separate `getHistoryTechnical(...)` reads the raw table and is
  only used when the server has confirmed `has_permission('audit.read_technical')`. The P3
  `HistoryTimeline` uses the safe path by default and reveals technical metadata only to
  `audit.read_technical` holders.

*(Note: `audit.read` no longer grants raw-table access; it grants the display-safe RPC.
`audit.read_technical` grants both.)*

---

## C9 — No UI, no business-table changes (reconfirmed) + one clarification

P0 remains: **no UI, no auth pages, no user-management screens, no CRM/ERP modules.**

**Real business data is never touched:** `leads`, `customers`, `orders`, `subscriptions`
are not modified in any way.

**Clarification (please confirm):** your generic list in C9 also names `documents`/`requests`,
but those are the **empty, dead leftovers** (0 rows) of the removed customer portal, and you
explicitly chose **"direct droppen"** earlier. So `0006` still drops the dead
`documents`/`requests`/old-`profiles`/old-`roles`. If instead you now want them **left in
place untouched**, say so and I will remove the drops from `0006` and simply create the new
tables alongside — but then the old `profiles`/`roles` name clash must be resolved another way
(rename). Default, per your earlier decision: **drop the dead leftovers.**

---

## Updated “ready for P0 build” checklist

- [ ] **amai Supabase connected** to me (so I can introspect + apply with advisors).
- [ ] **Introspection confirms** before any drop: no *kept* table has an FK into old
      `roles`/`profiles`; the only user triggers on `auth.users` are the dead portal ones;
      `documents`/`requests` are empty.
- [ ] **C9 cleanup confirmed:** drop the dead `documents`/`requests`/old-`profiles`/old-`roles`
      (your "direct droppen"), real tables untouched.
- [ ] **Owner email** for the bootstrap provided (used in C5; must match exactly one auth user).
- [ ] **`RATE_LIMIT_SALT`** pepper decided + added to env (C7).
- [ ] **Corrections C1–C8 accepted** as written (or amendments noted).
- [ ] Env present: `SUPABASE_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` (+ `CRON_SECRET`,
      `PORTAL_ENABLED` for later phases).
- [ ] Agreement: **no UI** in P0; **no changes** to `leads`/`customers`/`orders`/`subscriptions`.
- [ ] A **throwaway DB** (or a Supabase branch) is available to run the §12 test checklist
      before touching production.

**When these are checked, P0 build = the corrected migrations `0006`–`0012` + the server-only
lib spine (`authorize`, `rbac` incl. `getUserPermissions`, `audit` incl. safe `audit_history`,
`ratelimit` with hashing, `outbox`), type-safe and test-verified. No UI.**

---

# PART IV — LESSONS LEARNED (P0 + P1 GO-LIVE, AUTHORITATIVE)

Deltas between the plan and what actually shipped. Binding for every later phase (P2+).

## L1 — The live amai schema pre-existed; we build ON it (additive only)

The amai Supabase project (`bkwwlmflsbhrsfwydbnv`) already held a full, hand-built platform
schema (`profiles`, `roles`, `user_roles`, `settings`, `audit_logs`, `rate_limit`, the outreach
tables, plus `leads`/`customers`/`orders`/`subscriptions`). It has **no migration history**, so
the Part III "drop the dead leftovers + clean rebuild" path was abandoned. P0 was applied
**additively** on top of the existing objects, and every later phase does the same: **never drop
or rebuild; add columns/tables/policies and reconcile in code.**

## L2 — No migration history ⇒ no usable Supabase branch

A branch reproduces nothing from a hand-built schema (empty DB), so migrations were validated
and applied **directly against production** — acceptable only because it is not yet in real use.
Repo files `0006`–`0013` are **mirrors of what was applied live** (documentation, not a
reproducible history). **Never edit an applied migration; only add a new one.**

## L3 — Service-role-only functions must be explicitly REVOKEd

An advisor flagged `log_event()`, `claim_outbox()`, `complete_outbox()` as executable by
`anon`/`authenticated`. Fix (`portal_lock_service_role_functions`, repo `0012`): revoke from
`anon, authenticated`, grant only `service_role`. Rule for every new privileged function.

## L4 — Code types must target the LIVE schema, not the spec

`database.ts` + lib spine were rewritten to live names: table is **`audit_logs`** (not
`audit_log`); roles enum is the existing smallint `admin|analyst|sales|reviewer|read_only`; raw
audit read is gated by `has_permission('audit.read_technical') or is_platform_super_admin()`.

## L5 — `server-only` + Vitest stub

`server-only` is installed and imported in every server lib; Vitest cannot import it, so
`vitest.config.ts` aliases `server-only` → `src/test/server-only-stub.ts`.

## L6 — Recovery email uses `verifyOtp(token_hash)`, NOT `exchangeCodeForSession`

A server-side `generateLink({type:'recovery'})` link has **no browser PKCE `code_verifier`**, so
the OAuth code-exchange callback always failed ("link invalid or expired"). Correct path: a
route `/app/auth/confirm` that calls `verifyOtp({ type, token_hash })`. The email links to **our**
confirm route carrying `token_hash` (not the Supabase `action_link`), which also drops the
dependency on the Supabase redirect allowlist. **Reuse this pattern for P3 invites.**

## L7 — Vercel Hobby has no minute cron ⇒ send transactional email inline

The outbox stays, but on Hobby the cron runs ~daily. Reset/invite mail is **delivered inline**
in the server action right after enqueue (`processPending(5,'reset-inline')`, best-effort). The
daily cron (`0 6 * * *`) is only a **retry sweep** for transient Resend failures.

## L8 — `/app` has NO locale prefix; protect it from next-intl and caching

`middleware.ts` branches: `/app/*` → Supabase session refresh; else → `intlMiddleware`. So:
correct URLs are `amai.ch/app/...` (never `/en/app/...` — browser history autocompletes the
stale one); Cloudflare needs a **Bypass cache** rule for `/app/*` and `/api/cron/*` joined by
**OR** (AND matches nothing); `next.config` sends `Cache-Control: no-store` for `/app/:path*`.

## L9 — Go-live env + the PORTAL_ENABLED kill-switch

Required: `PORTAL_ENABLED=true`, `CRON_SECRET`, `RATE_LIMIT_SALT` (plus existing `SUPABASE_*`,
`RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`). With `PORTAL_ENABLED` unset, the `(portal)` root
`PortalGate` returns `notFound()` **by design** (missing env = 404, not a crash). Env changes
apply only on a **new deployment**.

## L10 — Supabase Auth password policy must match the app zod

Supabase enforces min length + character classes + leaked-password (HIBP) **on top of**
`setPasswordSchema`. Keep aligned: app min length = Supabase min length (currently **10**); if
Supabase requires character classes, the app hint must reflect it, or relax Supabase to "no
required characters" to defer to app + HIBP.

## L11 — Disabled-user gate is enforced at sign-in via service role

`signIn` re-reads **live `profiles.status`** through the admin client after auth and signs the
user back out if not `active`. Middleware refresh is **not** the authz boundary; every protected
surface calls `requireAuth()` (live status).

## L12 — Portal UI conventions (confirmed in P1)

Isolated `(portal)` root layout, `<html lang="en">`, **English-only** copy (no next-intl inside
`/app`). Brand red + gold. Auth notices are colour-coded: success = `ok` (green), errors =
`red`. The top bar carries the **account avatar** (pink background, gold ring) on the right; the
**dashboard is the platform landing** (no placeholder cards). The gold `!` spinner is the single
loading primitive.

---

# PART V — PLATFORM UX & PRODUCT REQUIREMENTS (v4, AUTHORITATIVE)

New cross-cutting requirements worked out before any further build. Binding for every phase.
**Nothing here is built yet** (P2/P3 ship as-is until the corrective patches in §V6 are approved).

**Classification legend** used throughout: `[PLAN]` master-plan only · `[PATCH]` immediate
corrective patch to already-built P2/P3 UI · `[FUTURE]` future-phase requirement · `[SEC]`
security-sensitive decision · `[VALIDATE]` needs explicit approval before build.

## V1 — Unified status model

**Principle.** Every stateful entity has exactly one **status machine**. The framework already
exists from P0: `src/lib/status/types.ts` (`StatusMachine`, `Transition`, `canTransition`) and the
shared client-safe palette `src/lib/status/colors.ts` (`StatusToken`, `STATUS_COLORS`,
`statusColor`, plus `userStatusToken` added in P3). No status logic may live ad-hoc in UI or
actions — it is declared in a machine and enforced server-side.

**Shared vs entity-specific.** The **colour tokens are global/shared** (one semantic palette:
`draft, sent, waiting, opened, done, cancelled, revoked, failed, system, warning, critical`). The
**status *values* are entity-specific** (each entity defines its own set and maps each value to a
shared token). This keeps colours consistent platform-wide while letting each domain name its
states.

**A transition declares** (per `Transition`): `from`, `to`, the **required permission**
(server-checked), the **audit action emitted**, an optional **side effect** (`email`/`webhook`),
and whether it **needs UI confirmation**. A status change is only legal if a matching transition
exists; the server action calls the machine, checks the permission, performs the write, fires the
side effect, and emits the audit event — in that order.

**Audit + history (already the live contract).** Every status change emits a `logEvent` with
`old_status` / `new_status` set, `entity_type` = the entity, `entity_id` = the row id, `actor`,
`created_at` (timestamp) and `source`. It therefore appears automatically in any `HistoryTimeline`
(which reads the display-safe `audit_history()` RPC). Technical metadata (ip, user_agent,
old_values/new_values payloads) is **never** shown to ordinary admins — only `audit.read_technical`
holders, exactly as built in P3. **This is already implemented for `profiles` in P2/P3**; the rule
generalises to every future entity.

**Badges.** One presentational badge per entity, e.g. the P3 `UserStatusBadge` generalised to a
shared `StatusBadge` that takes `(entityType, status)` → `token` → `STATUS_COLORS`. Inline-styled
pill (`bg`/`fg` from the token), Title-case label. `[PATCH-eligible: extract the generic badge.]`

**Label copy style.** Short, Title-case, English, **no dashes** (project copy rule). e.g.
`Active`, `Invited`, `Disabled`, `Archived`, `Past due` (not "Past-due"), `Awaiting signature`.

**Confirmation + permission rules (global):** any transition that is **irreversible**, **revokes
access**, or **deletes/voids** requires a confirm step and an explicit permission; routine forward
moves (e.g. `draft → sent`) need only the relevant permission, no modal.

### Status models (per entity)

Format: `value` → token · class (T = terminal, R = reversible, X = temporary/system) · permission · confirm.

**users/profiles** (live `CHECK (active|disabled|invited)`, extended by §V5):
- `invited` → `waiting` · R · set by `users.create` · no confirm. (User exists, not yet accepted.)
- `active` → `done` · R · `users.disable` (enable) / invite-accept flow · no confirm.
- `disabled` → `revoked` · R · `users.disable` · **confirm**. Blocks login (P1 `requireAuth`).
- `archived` → `cancelled` · **near-terminal, restorable** · `users.archive` `[FUTURE][SEC]` · **type-to-confirm**. (See §V5.)
- (`anonymized` is **not** a status — it is an irreversible PII action layered on `archived`; see §V5.)
Transitions: `invited↔active`, `active↔disabled`, `{active,disabled,invited}→archived`, `archived→disabled` (restore). No `*→invited` except creation. Last-admin / self / super-admin guards apply (already built for disable/role; extend to archive).

**invites** (currently **derived**, not a separate table — recommend keeping derived):
- Represented by `profiles.status='invited'` + the outbox email + the Supabase one-time link.
- Logical states for the timeline: `sent` (`user.invited`), `resent` (`user.invite_resent`),
  `accepted` (profile flips `invited→active` via the confirm/reset flow), `expired` (the Supabase
  link TTL lapses — not tracked as a row, surfaced by re-send). `[PLAN]` Decision V-D8: keep
  invites derived (no `invites` table) until a richer invite lifecycle is needed.

**emails / outbox** (live `outbox.status` + `email_log.status`):
- `pending` → `waiting` · X · enqueue.
- `sending` (locked) → `system` · X · `claim_outbox`.
- `sent` → `done` · T · `complete_outbox(success)`.
- `retrying` → `warning` · X · `complete_outbox(fail)` with attempts < max.
- `failed`/`dead` → `failed` · T · attempts ≥ max.
These are **system transitions** (actor = `system_job`/`vercel-cron`), no permission/UI; they
appear in the History timeline under the **System** filter. `[PLAN]`

**future CRM — companies / contacts / deals** `[FUTURE]`:
- company/contact: `lead` (`draft`), `qualified` (`waiting`), `active` (`done`), `dormant`
  (`system`), `lost` (`cancelled`), `blocked` (`revoked`).
- deal/opportunity: `open` (`draft`), `won` (`done`, T), `lost` (`cancelled`, T).

**future projects** `[FUTURE]`: `draft` (`draft`), `active` (`done`), `on_hold` (`waiting`),
`completed` (`done`, T), `cancelled` (`cancelled`, T).

**future products** `[FUTURE]`: `draft` (`draft`), `active` (`done`), `retired` (`cancelled`, T).

**future finance / invoices** `[FUTURE]`: `draft` (`draft`), `sent` (`sent`), `paid` (`done`, T),
`past_due` (`warning`), `void` (`cancelled`, T), `refunded` (`revoked`, T). Money-moving
transitions are `[SEC]` and always confirmed + permissioned.

**future NDA / documents** `[FUTURE]`: `draft` (`draft`), `sent` (`sent`), `signed` (`done`, T),
`declined` (`cancelled`, T), `expired` (`warning`, T), `void` (`revoked`, T).

**Storage rule.** Status is a `text` column with a `CHECK` constraint (or a small enum) per table;
extend the CHECK additively when adding a value (never edit an applied migration — PART IV L2).
`is_active`-style mirrors stay in sync via a trigger (as `profiles_sync_active` does).

## V2 — Global clickable-row pattern `[PLAN]` + `[PATCH]`

Every list/table row that opens a detail view is **fully clickable**, not gated behind a "View"
button.

**Behaviour:** whole row navigates to the detail route; cursor `pointer` on hover; a clear hover
state (subtle `bg-ink/5` tint); keyboard accessible (focusable + Enter/Space activates); a visible
focus ring. **Inner interactive controls** (quick-action buttons, dropdowns, links, checkboxes)
**must not trigger row navigation** and must remain independently focusable.

**Implementation pattern (accessibility-correct):** use the **stretched-link** technique — the row
is `position: relative`; a single `<Link>` (the primary navigation) is overlaid with
`absolute inset-0` (a pseudo-element/`::after` or an empty stretched anchor) so the *whole row*
is clickable via one real link; inner controls are `position: relative; z-index: 1` and call
`stopPropagation`. This avoids nesting interactive elements inside an `<a>` (which is invalid and
breaks screen readers). The row link carries an `aria-label` (e.g. "Open <name>").

**Applies to:** the **users table now** `[PATCH]`, and all future tables: customers/companies,
contacts, projects, products, documents, invoices/finance, and any audit/history list whose rows
open a detail. The current `UserTable` "View" link becomes the stretched overlay (the visible
"View" affordance may stay as a secondary cue but is no longer the only target).

## V3 — Editable-block / edit-icon (lock-unlock) pattern `[PLAN]` + `[PATCH]`

Editable data is **read-only by default** and unlocked deliberately.

**Lifecycle of an editable block:**
1. **Read-only** (default): values rendered as text; a **pencil edit icon** in the block header.
2. **Unlocked** (pencil clicked): fields become inputs; a **Save changes** button **and a Cancel**
   button appear; the pencil hides.
3. **Saving**: inputs disabled + gold `!` spinner on Save.
4. **Success**: persist → block returns to **read-only**, Save/Cancel disappear, pencil returns, a
   transient success cue ("Saved").
5. **Error**: stay unlocked, show a safe error, keep the user's input.
6. **Cancel**: discard edits, return to read-only. **Unsaved-changes guard**: if the block is dirty,
   Cancel and in-app navigation prompt a confirm; never silently lose input.

**Reusable concept:** a shared `<EditableBlock>` (header + pencil + children render-prop for
read vs edit modes) wrapping a server action via `useActionState`. `[FUTURE shared component]`.

**Distinctions (so the right interaction is used):**
- **Inline editable field** — a single value (e.g. a name) may use a compact inline pencil →
  input → save, same lifecycle at field scope.
- **Editable card/block** — a group of related fields saved together (the default pattern above).
- **Destructive actions** (disable, archive, delete, void) — **never** inside an unlocked edit
  block; they are separate, explicitly-styled controls with their own confirm.
- **Status transitions** — driven by the status machine (§V1), **not** the edit pattern; a status
  control is a distinct action, not a form field.
- **File uploads** — follow §V4 (auto-upload), **not** the lock-unlock pattern.

**Applies to:** profile page `[PATCH]`, user detail page `[PATCH]`, and all future detail/settings
screens (company, contact, project, product, finance/invoice, NDA/document).

## V4 — Avatar / profile-photo upload UX `[PLAN]` + `[PATCH]`

The separate **Upload button is removed**. Selecting or dropping a file **auto-starts** the upload.

**Behaviour:** on file select/drop → validate client-side (type/size hint) → show an **immediate
local preview** (object URL) → **upload starts automatically** → show **progress/loading** on the
avatar → on success the server **signed URL** replaces the preview → on failure the **previous
avatar remains** and a **safe error** is shown (revoke the object URL). **Remove photo** stays a
separate explicit action with its own confirm.

**Server validation is unchanged** (already built, keep): PNG/JPG/WebP, **2 MB**, **magic-byte**
check, **private** `avatars` bucket, **signed-URL** display, object **path** stored in
`profiles.avatar_url`. Drag-and-drop is the affordance; no Upload button.

**Global file-upload guidance:** *image/avatar* uploads auto-start with optimistic preview;
*document* uploads (future NDA/finance) may instead use an explicit "Add file" + a visible pending
row, because documents are higher-stakes and benefit from a confirm. Both keep server-side
type/size/magic-byte validation and private buckets.

**Update to P2:** the built `AvatarUpload` currently has an explicit **Upload** button → replace
with auto-upload `[PATCH]`. The P2 spec (`PORTAL_P2_PROFILE_AVATAR_SPEC.md` §6) is amended by this
section.

## V5 — Admin user deletion model `[FUTURE]` `[SEC]` `[VALIDATE]`

**Recommendation: soft delete (archive), never hard delete by default.** Hard-deleting a user
(removing `auth.users` / `profiles`) would orphan audit rows and any future CRM/ERP records they
own, and break referential integrity. Instead:

**Archive (the default "delete"):**
- `profiles.status = 'archived'` (additive CHECK value; future migration). Optionally add
  `archived_at timestamptz` + `archived_by uuid` for provenance.
- **Permanently prevent login:** Supabase Auth **ban** (`ban_duration` long) + **revoke sessions**
  best-effort; `requireAuth()` already blocks non-`active` on the next request (authoritative).
- **Audit history preserved:** audit rows already **denormalise** `actor_name`/`actor_email`/
  `actor_role` at write time, so the timeline stays readable even after archive/anonymize. `actor_id`
  is kept (never deleted) for integrity.
- **`user_roles`:** remove active role grants on archive (an archived user holds no permissions);
  the prior role is preserved in the `user.archived` audit metadata / earlier `user.role_changed`
  rows. `[VALIDATE V-D3]`
- **`organization_members`:** set membership `status` to `archived`/removed (do **not** hard-delete
  the row — keep the FK + history). `[VALIDATE V-D3]`
- **Avatar files:** keep on archive; **remove** the storage object on anonymize (privacy). Or remove
  on archive if preferred. `[VALIDATE V-D4]`
- **Future owned records (CRM/projects/etc.):** **keep** them; the archived user remains the actor/
  owner for integrity. Never cascade-delete business data.
- **Visibility:** archived users are **hidden from default lists**; an explicit "Show archived"
  filter reveals them. Archived users are **not editable** except **restore** and (if permitted)
  **anonymize**.

**Restore:** allowed → `archived → disabled` (re-enable is then a separate, deliberate step to
`active`); unban if applicable; audit `user.restored`. `[VALIDATE V-D5]`

**GDPR anonymization (separate, irreversible action, not a status):** scrubs PII
(`email` → a non-reversible placeholder/hash, `first/last/full_name` → null, avatar removed) **while
keeping the audit-row skeleton + `actor_id`** so history integrity holds. This is **not** a row
hard-delete. Reserved for explicit erasure requests; **platform-super-admin only**; audit
`user.anonymized`. **True hard delete of `auth.users` is not offered** in the product (anonymize
covers erasure without breaking integrity). `[VALIDATE V-D1]`

**Permissions + guards:**
- New permission **`users.archive`** (recommended) — distinct from `users.disable`; `users.anonymize`
  (super-admin only) for GDPR. `[VALIDATE V-D2]`
- **Self-delete prevented**; **last-admin deletion prevented** (reuse the P3 active-admin count +
  self/super-admin guards); a normal admin **cannot** archive/anonymize a platform-super-admin.
- **Confirmation UI:** **type-to-confirm** (type the user's email) for archive; a stronger, clearly
  destructive modal for anonymize.
- **HistoryTimeline:** `user.archived` (severity `warning`), `user.restored` (`info`),
  `user.anonymized` (`critical`), all `entity_type='profile'`. Add labels/colours to
  `lib/audit/display.ts` when built.

## V6 — Impact on existing P0–P3 + corrective-patch register

**Already correct (no change):** the status→audit→history contract (P2/P3 emit `old_status`/
`new_status`, unified `entity_type='profile'`, technical fields gated by `audit.read_technical`);
the status framework (`status/types.ts`, `status/colors.ts`); permission-gated service-role writes.

**Corrective patches to already-built UI** — *required before they are considered "done", but not
built now*:
- **CP1 `[PATCH]` Clickable rows** — `UserTable` (and any future table) → stretched-link whole-row
  navigation; keep inner controls isolated. (§V2)
- **CP2 `[PATCH]` Editable blocks** — P2 `ProfileForm` + P3 `UserDetailActions` currently render
  always-editable fields with a persistent Save → convert to the pencil lock-unlock lifecycle with
  Cancel + dirty-guard. (§V3)
- **CP3 `[PATCH]` Avatar auto-upload** — P2 `AvatarUpload` → remove the Upload button, auto-start on
  select/drop with optimistic preview. (§V4)
- **CP4 `[PATCH/FUTURE]` Generic `StatusBadge`** — extract the P3 `UserStatusBadge` into a shared
  `StatusBadge(entityType, status)` for reuse. (§V1)

None of CP1–CP4 are security regressions; they are UX-quality patches. They do **not** touch the DB
or the security model.

## V7 — Phase roadmap impact

- **New phase P3.5 — UX corrective patch** (small, code-only, no migration): CP1 clickable rows,
  CP2 editable blocks, CP3 avatar auto-upload, CP4 shared `StatusBadge`. Recommended **before** P4.
- **P4** (existing) gains the **user archive/anonymize** model from §V5: an additive migration
  (status CHECK `archived`, optional `archived_at`/`archived_by`, seed `users.archive`/
  `users.anonymize` permissions), the archive/restore/anonymize actions + guards + confirm UI +
  audit events, and the "Show archived" list filter. This is `[SEC]` + `[VALIDATE]`.
- **Status-model generalisation** is mostly `[FUTURE]`: each new entity (CRM, projects, products,
  finance, documents) ships with its own machine + CHECK + badge, reusing this framework. The
  users/outbox machines may be formalised in P3.5/P4.
- Unchanged: no CRM/ERP/finance/NDA built now; business tables untouched; old `/admin` retired in P4.

## V8 — Open decisions (need approval before any build)

- **V-D1 `[SEC]`** Deletion = **archive + separate GDPR anonymize**, **no** hard delete of
  `auth.users`. Approve?
- **V-D2** New permissions **`users.archive`** (+ `users.anonymize`, super-admin only) vs reusing
  `users.disable`. Approve new permissions?
- **V-D3** On archive: remove `user_roles` grants and set `organization_members.status='archived'`
  (not hard-delete). Approve?
- **V-D4** Avatar object: delete on **anonymize** only (keep on archive) vs delete on archive.
  Choose.
- **V-D5** Allow **restore** (`archived → disabled`)? Approve.
- **V-D6 `[PATCH]`** Approve **P3.5** (CP1 clickable rows, CP2 editable blocks, CP3 avatar
  auto-upload, CP4 StatusBadge) as a code-only patch before P4?
- **V-D7** Add `archived_at` + `archived_by` columns (provenance) in the P4 migration? Approve.
- **V-D8** Keep **invites derived** from `profiles.status` (no `invites` table) for now? Approve.
- **V-D9** Generic `StatusBadge` + status-label wording per entity (confirm the label copy in §V1).

**No code, migration, or phase begins until V-D1…V-D9 are resolved.** → **RESOLVED — all
approved; see Part VI for the locked decision table and the P3.5 / P4 scope.**

---

# PART VI — LOCKED DECISIONS, ROADMAP & NEXT PHASES (v5, AUTHORITATIVE)

This part reflects the **current execution truth**. It supersedes the "open decisions" in Part V §V8
and any earlier "build starts / nothing built" language.

## VI.1 — Authoritative order (formal)

When two parts conflict, the **later** wins, in this order:
1. **Part IV — Lessons Learned** overrides older P0/P1 assumptions in Parts I–III.
2. **Part V — Platform UX & Product Requirements** overrides prior UX/product behaviour.
3. **Part VI — Locked decisions & roadmap** (this part) is the current execution truth.
4. The **live Supabase schema + applied migrations** (`0006`–`0026`) override any theoretical
   migration names or shapes in Parts I–III.
5. **Every future spec must inspect the live schema and repo before implementing** (Part IV L1–L2);
   theoretical plans are starting points, not ground truth.

Parts I–III remain for **historical/architecture context** and are not deleted; they are subordinate
to Parts IV–VI wherever they conflict (see the CURRENT STATE banner at the top for the reconciliation
list: `audit_log`→`audit_logs`, theoretical migration names→live `0006–0015`, role model, outbox
inline-send, `/app/auth/confirm`, avatar auto-upload, archive-not-hard-delete, unified status model).

## VI.2 — Current build state (factual)

- **P0** Foundation — built, corrected (C1–C9), approved. Live additive migrations `0006`–`0013`.
- **P1** Auth — built, reviewed, **live smoke-tested** (login/reset via `/app/auth/confirm`).
- **P2** Profile + Avatar — built, reviewed. Migrations `0014` (self-update guard) + `0015`
  (avatars bucket hardening) applied live.
- **P3** User Management + History Timeline — built, reviewed. **No migration** (used the live
  role/permission/audit/outbox foundation).
- **Pending:** P2/P3 browser smoke + production deploy may still be in branch/preview; confirm before
  treating P2/P3 as fully live.
- **Since v5 (additive, all approved/built):** **P3.5** UX patch · **P4** hardening + archive/anonymize
  + retired old `/admin` · **P5** CRM companies + contacts (`0022`) · **P6** projects (`0023`) ·
  **P7** catalog (`0024`) · **P8** quotes + quote_items (`0025`) · **P9** invoices + invoice_items
  (`0026`). Each is greenfield-additive with its own status machine + `StatusBadge` + permission-gated
  read RLS + audit; business tables and old `/admin` untouched. **P10 Payments Core is specified;
  P11 Stripe Payment Links and P12 Stripe Subscription Management are planned — see §VI.8.**

## VI.3 — Locked decision table (V-D1 … V-D9, all APPROVED)

| # | Decision | Locked outcome |
|---|---|---|
| **V-D1** | Deletion model | **Archive + separate GDPR anonymize.** No default hard delete of `auth.users`. |
| **V-D2** | New permissions | Add **`users.archive`** and **`users.anonymize`**; `users.anonymize` is **platform-super-admin only**. |
| **V-D3** | On archive | **Remove active `user_roles` grants**; set **`organization_members.status='archived'`** (never hard-delete membership rows). |
| **V-D4** | Avatar object | **Keep on archive; delete only on anonymize.** |
| **V-D5** | Restore | **Allowed: `archived → disabled`.** Re-enable to `active` is a separate deliberate action. |
| **V-D6** | P3.5 UX patch | **Approved before P4** (code-only, no migration). |
| **V-D7** | Provenance columns | **Add `archived_at` + `archived_by`** in the P4 archive/anonymize migration. |
| **V-D8** | Invites | **Keep derived** from `profiles.status='invited'`; **no `invites` table** for now. |
| **V-D9** | Badges/labels | **Approved:** generic `StatusBadge` + the Part V §V1 status-label wording rules. |

## VI.4 — Next phases (concise)

- **P3.5 — UX corrective patch** — **code-only, no migration, no DB changes.** Brings already-built
  P2/P3 UI up to the Part V standards. **Do before P4.**
- **P4 — Hardening + archive/anonymize + legacy-admin retirement** — the archive/anonymize model
  (additive migration + actions + UX) plus the previously planned P4 hardening (Turnstile +
  rate-limiting on `/api/leads` and `/api/checkout`, broader tests) and **retiring/migrating the old
  `/[locale]/admin`** as separately specified.
- **No CRM/ERP modules** (clients, projects, products, finance, documents, NDAs, invoices, external
  client portal) **until the foundation, UX (P3.5) and security (P4) are stable.**

## VI.5 — P3.5 scope (UX corrective patch)

**In scope (code-only):**
- **CP1 — Clickable rows** — whole-row navigation via the stretched-link pattern (Part V §V2),
  starting with `UserTable`; inner controls isolated; keyboard + focus ring.
- **CP2 — Editable blocks** — pencil lock/unlock lifecycle with Save/Cancel + dirty-guard
  (Part V §V3) on the **profile page** and **user detail** forms.
- **CP3 — Avatar auto-upload** — remove the Upload button; auto-start on select/drop with optimistic
  preview (Part V §V4); keep server-side validation + Remove-photo.
- **CP4 — Shared `StatusBadge`** — extract the generic badge from P3 `UserStatusBadge` (Part V §V1).

**Out of scope for P3.5:** no DB changes/migrations · no user archive/anonymize · no P4 hardening ·
no CRM/ERP · no business-table changes (`leads`, `customers`, `orders`, `subscriptions`, old
`documents`, old `requests`) · no email-change flow · no new permissions.

## VI.6 — P4 archive / anonymize planning

**Schema (additive migration; inspect live schema first — Part IV L1/L2):**
- Extend `profiles.status` CHECK with **`archived`** (additive; never edit an applied migration).
- Add **`archived_at timestamptz`** and **`archived_by uuid`** (provenance).
- Seed permissions **`users.archive`** and **`users.anonymize`** (+ `role_permissions` for `admin`;
  `users.anonymize` gated additionally to platform-super-admin in code).

**Actions (server-only, permission-gated, audited; service-role writes per Part IV/V):**
- **Archive** — `status='archived'`, set `archived_at`/`archived_by`, **remove active `user_roles`**,
  set **`organization_members.status='archived'`**, Supabase Auth **ban** + best-effort session
  revoke, **keep** the avatar object and all owned records. Login permanently blocked via
  `requireAuth()`.
- **Restore** — `archived → disabled` (re-enable to `active` is separate), unban; audit.
- **Anonymize** (platform-super-admin only, **irreversible**) — scrub PII (`email`→non-reversible
  placeholder/hash, names→null, **delete the avatar object**) while keeping the **audit-row skeleton
  + `actor_id`** (denormalised actor name/email in audit rows preserves history). Not a row delete.

**Guards & UX:**
- **Self-archive prevented; last-admin archive prevented; super-admin only managed by a
  super-admin** (reuse the P3 guards).
- **Type-to-confirm** (type the user's email) for archive; a stronger destructive confirm for
  anonymize.
- **Default lists hide archived**; a **"Show archived"** filter reveals them; archived users are not
  editable except restore/anonymize.

**Audit events** (`entity_type='profile'`, `entity_id`=target): **`user.archived`** (warning),
**`user.restored`** (info), **`user.anonymized`** (critical). Add labels/colours to
`lib/audit/display.ts` when built. **No default hard delete of `auth.users`.**

## VI.7 — Updated roadmap

`P0 ✓ → P1 ✓ → P2 ✓ → P3 ✓ → ` **P3.5 (UX patch, code-only)** ` → ` **P4 (hardening + archive/anonymize
+ retire old /admin)** ` → ` **P5 ✓ (CRM)** ` → ` **P6 ✓ (Projects)** ` → ` **P7 ✓ (Catalog)** ` → ` **P8 ✓ (Quotes)**
` → ` **P9 ✓ (Invoices)** ` → ` **P10 (Payments Core)** ` → ` **P11 (Stripe Payment Links)** ` → `
**P12 (Stripe Subscription Management)**. Each module ships with its own status machine + `StatusBadge`
per Part V §V1, built only after the foundation/UX/security were stable. See **§VI.8** for the
finance/billing roadmap and the locked **P10 / P11 / P12** separation, and **§VI.9** for the
independent **Website Analysis Funnel** marketing branch (WAF-1/2/3).

## VI.8 — Finance / billing roadmap (P5–P12) [v6 addition, AUTHORITATIVE]

This section is the current execution truth for the CRM/finance modules and the **three
Stripe-related phases**. It supersedes the stale "future CRM/ERP modules" placeholder in §VI.7 and the
"P0–P3 built" snapshots wherever they are now out of date. It **does not weaken any approved P0–P9
scope boundary**; earlier approved phase notes stand.

### Built / approved since v5 (greenfield-additive, one phase per migration)

- **P5 — CRM Core (companies + contacts)** — migration `0022`.
- **P6 — Projects Core** — `0023`.
- **P7 — Products & Services Catalog** — `0024`.
- **P8 — Quotes Core** (`quotes` + `quote_items`) — `0025`.
- **P9 — Invoices Core** (`invoices` + `invoice_items`) — `0026`. The invoice carries
  `amount_paid` / `balance_due` / `paid_at`, set **today by a manual mark-paid** inside P9.

Each shipped with its own status machine + `CHECK` + `StatusBadge` + permission-gated **read** RLS
(service-role writes only) + audit; **business tables untouched, old `/[locale]/admin` untouched**.

### The three Stripe phases are intentionally SEPARATE and SEQUENCED: P10 → P11 → P12

They are split **because they carry very different risk** and must not be collapsed:

- **P10 (record a payment fact)** — low risk: internal record + invoice arithmetic, no Stripe call.
- **P11 (generate a hosted payment link)** — medium risk: a public payment surface + webhook
  confirmation, but no change to existing subscriptions.
- **P12 (mutate a live Stripe subscription)** — **high risk**: **proration, billing-cycle changes,
  coupon/trial impact, rollback complexity, webhook synchronisation, and direct customer billing
  consequences.** This is why subscription modification is a **dedicated, later** phase — never folded
  into payment-link generation.

### P10 — Payments Core / Invoice Payment State  *(conservative; specified, see `PORTAL_P10_SPEC.md`)*

- **New greenfield `invoice_payments` table** (next migration `0027`) — internal payment records
  linked to a P9 invoice. The legacy Stripe-webhook **`payments` table is NOT reused or modified**.
- **Manual payment recording**; invoice `amount_paid` / `balance_due` / `paid_at` **synchronised**
  from succeeded payment records (**partial payments supported**).
- **Optional Stripe reference fields** (e.g. `provider_payment_intent_id`) stored for **future**
  matching — **P10 makes no Stripe API calls**.
- Audit/history; permissions (`payments.read/create/update/mark_paid/refund/archive`; **sales
  record-only**, money-confirming **admin-only**); permission-gated read RLS.
- **Explicitly NOT in P10:** no checkout rewrite · **no subscription management** · no Stripe
  product/price sync · no automatic recurring billing · **no public payment page unless later
  explicitly approved** · no Stripe write calls. *P10 may include Stripe reference fields but must
  **not** mutate Stripe subscriptions.*

### P11 — Stripe Payment Links  *(future)*

- **Generate a Stripe payment link from an invoice**; the **link amount is based on the invoice's
  `balance_due`**.
- **Store Stripe checkout / payment-link references** (on the invoice and/or the P10 payment record);
  **show the payment link on the invoice detail**; **track link status** (e.g. active / paid /
  expired / cancelled).
- **Prepare webhook-based payment confirmation** — a confirmed link payment creates/flips an
  `invoice_payments` row to `succeeded` via the P10 recalc.
- **Optionally allow regenerating or cancelling** a payment link.
- **NOT in P11:** **no checkout rewrite** (unless explicitly scoped) · **no subscription
  modification** (unless explicitly approved). *P11 may create Stripe payment links but must **not**
  rewrite checkout.*

### P12 — Stripe Subscription Management  *(future, highest-risk; the ONLY phase for subscription changes)*

- **View** existing Stripe subscriptions linked to a company/customer; **link** existing subscriptions
  to companies / projects / invoices where appropriate.
- **Change** an existing subscription **plan/price**; **change quantity**; **cancel immediately or at
  period end**; **pause/resume** if supported; **inspect billing cycle / current period**.
- **Handle the proration policy EXPLICITLY** (decide + document per action).
- **Sync status via Stripe webhooks**; **audit every mutation**; **permission-gate all subscription
  write actions**; **never expose Stripe secrets client-side**; **confirm (type-to-confirm) before any
  destructive / billing-affecting change**.
- **This is the correct and only phase for changing existing Stripe subscriptions.** P10 and P11 must
  not mutate subscriptions.

### Cross-cutting Stripe / billing rules (apply to P10–P12 and any future finance work)

- **Inspect the existing Stripe/billing tables** — `payments`, `payment_links`, `stripe_events`,
  `orders`, `subscriptions`, `customers` — **and the checkout/webhook routes BEFORE each phase**
  (Part IV L1/L2). The live shapes override theoretical assumptions.
- **Existing checkout, orders, subscriptions and customers must NOT be rewritten without a dedicated
  migration + spec.** Prefer **new additive tables** over modifying the legacy webhook-written tables.
- **Any Stripe write operation must be:** server-side only · permission-gated · audited · **confirmed
  where destructive** · covered by a **webhook / reconciliation strategy**. **Stripe secret keys never
  appear client-side.**
- Phase boundaries restated: **P10 = reference fields, no subscription mutation; P11 = payment links,
  no checkout rewrite; P12 = the phase that changes existing Stripe subscriptions.**

### Clarifying note on older finance mentions (superseded, not rewritten)

Earlier references in Parts I–V are **historical** and are superseded by this P5–P12 roadmap (per the
authoritative order in §VI.1): Part IV §15's "prepared but later" `payments` / `invoices` / `quotes` /
`quote_versions` / `invoice_events` tables, Part V §V1's "future finance / invoices" status tokens
(incl. `refunded`), and Part IV §4's `finance.read/create_invoice/send_invoice` permission sketch. The
**live** module-keyed permissions and tables govern: `invoices.*` (P9), the planned `payments.*` (P10,
on a new `invoice_payments` table), and the future P11/P12 Stripe work. No approved phase note is
deleted; these older lines remain for historical context only.

### Updated finance chain

`P5 ✓ → P6 ✓ → P7 ✓ → P8 ✓ → P9 ✓ → ` **P10 (Payments Core / Invoice Payment State)** ` → `
**P11 (Stripe Payment Links)** ` → ` **P12 (Stripe Subscription Management)**.

---

## VI.9 — Website Analysis Funnel / Lead-magnet roadmap (marketing branch, independent) [v6 addition, AUTHORITATIVE]

A public-website **sales funnel / lead magnet** ("Free website analysis") that turns visitor
submissions into **CRM-traceable leads**. This is an **independent marketing / lead-generation
branch**: it depends only on the **live CRM** (P5 companies + contacts) and can be scheduled **in
parallel with, or independently of, the finance phases P11/P12** — it does not touch quotes,
invoices, payments, Stripe or checkout. Three sequenced phases: **WAF-1 → WAF-2 → WAF-3** (WAF =
Website Analysis Funnel). Only **WAF-1** is in near-term scope; WAF-2/WAF-3 are later and gated
separately.

### Recommended data-ownership model (single source of truth) — RECOMMENDED

Of the three options (a tab under the legacy lead dashboard · a CRM source/label/status pattern on
contacts · a dedicated request entity), the recommended model is **a dedicated greenfield
`website_analysis_requests` workflow entity that links into CRM** — following the established
per-module pattern (P5–P10):

- **Contact = single source of truth for the person.** Each submission **creates or enriches** a CRM
  `company_contacts` contact, **matched on email** (no duplicate contacts). The person's data lives on
  the contact, never only on a form row.
- **Company = single source of truth for the organization, when a reliable match exists.** Cautiously
  link (or, only if reliable, create) a `companies` row from the **email domain or the submitted
  website domain**. If detection is unreliable, **leave the company null** and keep the request linked
  to the contact only — company linking remains available later. Never create a junk company.
- **`website_analysis_requests` = the workflow / source entity.** One row per submission, **linked to
  the contact (required) and optionally the company**, carrying the funnel-specific fields + the
  status machine below. It is **not** an isolated lead silo (it always links back to CRM) and it is
  **not** the legacy `leads` table (the old public contact-form sink) — the funnel flows into CRM +
  this request entity, preserving traceability and single source of truth.
- **Why this model:** preserves SSOT (person on the contact, org on the company), keeps every request
  traceable through CRM, scales (a row per request with its own lifecycle + owner + report state), and
  is AI-report-ready for WAF-2. It reuses the live RBAC, audit, status-machine, StatusBadge and
  soft-archive conventions; greenfield-additive (a new table, new permission-gated read RLS, new
  status machine) — no legacy-table rewrite.

### WAF-1 — Website Analysis Funnel / Lead Capture *(first phase; manual workflow)*

**In scope:**

- **Public CTA "Free website analysis"** — visible **at minimum in the public website header /
  navigation (so it appears on every public page)**, optionally also in hero sections, the footer,
  service pages, blog/article pages, case pages and other commercially relevant places. Suggested
  explanatory copy (NL): *"Laat jouw website nu door ons analyseren en ontvang een objectief rapport
  met concrete verbeterkansen."* (DE/FR/EN equivalents to be added in the message files, per the copy
  rules — no dashes, etc.)
- **Modal / dedicated form flow** collecting **Voornaam · Naam · Email · Website**, with **email
  validation, website-URL validation + normalization, a consent/privacy checkbox**, and **anti-spam:
  Turnstile + honeypot + rate limiting**. Clear **success message** after submission.
- **CRM write (server-side):** create-or-update the CRM **contact** (match on email); create a
  **`website_analysis_requests`** row linked to the contact + optional company (cautious domain
  match); store the **submitted URL structured + searchable** (`submitted_url` + `normalized_domain`).
- **Portal view:** a dedicated **"Website analysis"** list/tab/filter making it easy to find **all
  requests, the linked contact, the linked company (if any), current status, website URL, submitted
  date, assigned owner, report status and follow-up status**. Clickable rows → request detail.
- **Status workflow** (audited), **no hard deletes**, permission-gated read RLS, soft-archive, audit on
  creation + every status change.

**Status model** (8 states; NL label · suggested Part V §V1 token):

| Status | NL label | Suggested token |
|---|---|---|
| `new` | Nieuw | `draft` |
| `to_analyze` | Te analyseren | `waiting` |
| `in_analysis` | In analyse | `opened` |
| `analyzed` | Geanalyseerd | `done` |
| `report_sent` | Rapport verzonden | `sent` |
| `follow_up_planned` | Opvolging gepland | `waiting` |
| `won` | Gewonnen | `done` (terminal) |
| `closed_not_relevant` | Niet relevant / gesloten | `cancelled` (terminal) |

**Optional fields** (finalize at spec time): `source = 'website_analysis'`, `submitted_url`,
`normalized_domain`, `analysis_score` (WAF-2), `report_url`/`report_file` ref (WAF-2/3),
`report_sent_at`, `follow_up_at`, `assigned_to`/`owner_id`, `notes`, `internal_notes`, `utm_source`,
`utm_medium`, `utm_campaign`, `referrer`, and **privacy-safe spam metadata only** (`ip_hash`, never a
raw IP). Plus `contact_id` (required), `company_id` (optional), archive provenance.

**Out of scope for WAF-1 (unless later approved):** automatic AI analysis · automatic report PDF
generation · automatic email sending · paid-analysis checkout · public account portal · website
scraping · external crawler infrastructure · any change to Stripe / payment / checkout flows.

### WAF-2 — AI Website Analysis Report Generation *(later phase, gated)*

Analyze the submitted website and **generate a structured report**: store the report, optional
**scorecard / radar** + **impact/effort matrix**, an **internal review step before sending**, and link
the report back to the `website_analysis_requests` row + the contact. **Crawling/fetching, if added,
runs server-side only with strict URL validation, SSRF protection, and timeout / redirect / content-
size limits** (see security notes). Not built until explicitly approved.

### WAF-3 — Automated Report Delivery / Sales Follow-up *(later phase, gated)*

**Send the report by email** (via the existing outbox + Resend), **track sent/opened/clicked** if
available, **create a follow-up task**, advance status to `report_sent` / `follow_up_planned`, and —
when the lead converts — optionally **create a quote or project** (the CRM/quotes phases already
exist). Not built until explicitly approved.

### Security / privacy (cross-cutting, mandatory)

- The **public form must be rate-limited** and protected by **Turnstile (or equivalent) + a honeypot**.
- **No service-role credentials client-side**; the CRM write runs in a **server action / API route**
  (service role server-side only), exactly like `/api/leads`.
- **Validate and normalize the submitted website URL**; **avoid SSRF-style fetching in the public
  request path** — WAF-1 **does not fetch the URL on submit**, it only stores it.
- If WAF-2 crawling is added it must be **server-side only** with a **strict URL allowlist/validation,
  blocked internal/private network targets, hard timeouts, a redirect limit and a content-size limit**.
- **Store only necessary personal data**; add **privacy/consent copy** where needed; store **`ip_hash`
  only** (never raw IP) and only privacy-safe spam metadata.

### Dependency notes

- **Depends on CRM contacts/companies** (P5, live) — the person/organization SSOT.
- **May reuse** the existing lead dashboard shell or CRM source/status fields where suitable, but the
  funnel must **not** dump into the legacy `leads` silo without linking to a CRM contact.
- **Must not conflict with** quotes, invoices, payments or the Stripe phases (P8–P12) — it is a
  separate branch and **changes none of them**.
- **Must respect the current `/app/...` portal route structure** and the per-module conventions
  (greenfield-additive migration, permission-gated read RLS, audited service-role writes, status
  machine + StatusBadge, soft-archive).
- **Must not touch old `/[locale]/admin`** unless explicitly scoped.

### Marketing branch chain

`(CRM P5 ✓)` ` → ` **WAF-1 (Website Analysis Funnel / Lead Capture)** ` → ` **WAF-2 (AI Report
Generation)** ` → ` **WAF-3 (Automated Delivery / Follow-up)** — schedulable independently of the
finance chain P11/P12. **Planned, not built.**
