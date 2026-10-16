# PORTAL P13 — WEBSITE SALES FUNNELS / LEAD MAGNETS → CRM — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI (CRM = Part V; the Website Analysis Funnel roadmap branch in §VI.9) + the live Supabase
schema + current repo. New public-facing domain (not Stripe). The primary funnel is **Free Website
Analysis**; three more share the same generic model.

---

## 1. P13 objective

P13 adds a **safe public-to-portal ingestion layer** for website lead magnets. A public form submits to a
hardened API route that records a **funnel submission** (a workflow/request record) and **best-effort
links** it to an existing CRM contact/company — **never overwriting CRM data and never auto-creating CRM
rows**. The submission appears in the portal as a website-analysis lead with status, source, CRM linkage,
owner and full audit. **CRM `companies`/`company_contacts` stay the source of truth for people/orgs;**
funnel submissions are the request layer. No AI report, no crawling, no email automation in P13 (those are
P14/P15).

---

## 2. Current-state dependency check (inspected live + repo)

- **`/api/leads`** (the public-ingestion template): `POST` (nodejs) → zod `leadSchema` (422 on fail) →
  **honeypot** (a hidden `website` field; if filled, return `{ok:true}` without storing) → **rate limit**
  `checkRateLimit('leads', ipIdentifier(ip), 10, 3600)` (429) → **Turnstile** `verifyTurnstile(token, ip)`
  (400) → `createAdminClient()` (service role) insert into `leads` → safe `{ok:true}`; a non-blocking admin
  email via `after()`. Helpers: `clientIp`, `verifyTurnstile`, `checkRateLimit`, `ipIdentifier`,
  `@/lib/validation`.
- **`leads` (live):** `id, created_at, form_type (CHECK start|contact), firstname, lastname, email, company,
  phone, message, lang (de|fr|en), consent, source_locale, user_agent (raw), ip_hash, status (CHECK new|
  read|archived|spam)`. **RLS on, NO policy → service-role only.** **No `leads` permission module.** It is a
  minimal contact-form sink — **not fit** for funnels (no UTM/CRM-link/owner/spam-score/snapshots/workflow).
- **CRM `companies` (P5, live):** `… company_name, domain, website_url, email, …, source (CHECK csv|manual|
  contact_form|daily_audit|external), …, lead_status, crm_status (lead|qualified|active|dormant|lost|blocked|
  archived), owner_id, archived_at/by`. **`source` is a closed CHECK with no funnel value** — so
  auto-creating a company would require an enum change (avoid). **`company_contacts` (P5):** `id, company_id
  (NOT NULL), name, email, phone, role, contact_status, is_primary, archived_at/by, created_by, updated_by`
  — **a contact cannot exist without a company.**
- **Permission modules in use:** audit, catalog, companies, contacts, invoices, org, payment_links, payments,
  projects, quotes, subscriptions, users. **No `funnels`/`leads` module → P13 adds `funnels`.**
- **Patterns to reuse:** `StatusBadge`/`statusTokenFor` + `src/lib/status/colors.ts`; `audit/log` +
  `audit/display.ts` + `audit.read_technical` gating; `rowLink`, `EditableBlock`, `ConfirmDialog`,
  `HistoryButton`/`HistoryTimeline`; list pages with search/filters/archived-toggle/pagination; the
  service-role server-action write + permission-gated read RLS precedent (P5–P12). `requirePermission`/
  `hasPermission`.
- **Public site:** Next.js App Router `src/app/[locale]/…` (DE default, FR, EN; `localePrefix:'always'`);
  `Header`, `Footer`, `SiteShell`, `ContactForm`, `SubscribeForm` components; copy in
  `src/messages/{de,fr,en}.json` (house style: **no dashes, no comma before a coordinating conjunction**).
- **Migration numbering:** latest applied is `0031` (P12C had none). **Next is `0032`.** **No conflict with
  old `/[locale]/admin` (untouched); no business-table rewrite needed.**

---

## 3. Scope boundaries

**In scope (P13):** a **generic `funnel_submissions` table** (migration `0032`); the **Free Website
Analysis** funnel end-to-end; a hardened **public ingestion endpoint**; **best-effort CRM link** (existing
contact-by-email / company-by-domain) with **manual create-contact/create-company** portal actions; a
portal **list + detail** view; a **status workflow**; permissions + RLS; audit; spam/rate-limit/honeypot/
Turnstile; consent/privacy copy; the **header/landing/footer CTA + form**; DE/FR/EN copy. The other three
funnels (**cost calculator, strategy call, maintenance/security scan**) are modelled (same table +
`source_type` + per-source `payload`) but only **Free Website Analysis** ships a public form in P13.

**Out of scope (P13):** **AI report generation**, **website crawling/scanning**, **PDF generation**,
**automated email delivery / follow-up automation**, calendar/booking, quote/invoice/project auto-creation,
Stripe/checkout changes, customer portal, ERP/accounting, role/org UI, `/admin` removal, business-table
rewrite, hard deletes, the companies `source`-enum change.

**Deferred:** **P14** generates AI website-analysis reports from `website_analysis` submissions (uses the
P13 structured data); **P15** sends reports + automates follow-up. Public forms for the other three funnels;
a minimal internal-notification email (a `/api/leads`-style admin email) is **deferred** by default.

---

## 4. Funnel model decision

**Create a new additive generic table `public.funnel_submissions`** (not `lead_magnet_requests`; not
extending `leads`). Grounded: `leads` is a minimal contact-form sink (tiny status enum, no UTM/CRM-link/
owner/spam/snapshots) and is service-role-only; funnels need a richer, CRM-linked, audited workflow record.
One table serves all four funnels via `source_type` + a per-source `payload jsonb`, **shared statuses**,
shared owner/assignment + CRM-link fields.

**`source_type` CHECK:** `website_analysis`, `website_cost_calculator`, `strategy_call`,
`maintenance_security_scan`.

| Funnel | `source_type` | P13 public form | per-source `payload` examples |
|---|---|---|---|
| Free Website Analysis | `website_analysis` | **yes** | (just the website) |
| Website kosten-calculator | `website_cost_calculator` | model only | pages, features, budget band |
| Gratis strategiegesprek | `strategy_call` | model only | preferred slots, topic |
| Maintenance / security scan | `maintenance_security_scan` | model only | current stack, urgency |

All four share the same table, statuses, owner/CRM-link fields, audit, and spam handling.

---

## 5. Data model proposal — `public.funnel_submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` / `updated_at` | timestamptz NOT NULL | touch trigger |
| `source_type` | text NOT NULL | CHECK (the 4) |
| `status` | text NOT NULL default `'new'` | CHECK (§6) |
| `spam_status` | text NOT NULL default `'pending'` | CHECK pending/ham/suspected/spam |
| `spam_score` | numeric NULL | optional heuristic score |
| `contact_id` | uuid NULL | → `company_contacts(id)` SET NULL (link only) |
| `company_id` | uuid NULL | → `companies(id)` SET NULL (link only) |
| `owner_id` | uuid NULL | → `profiles(id)` SET NULL (assignment) |
| `first_name` / `last_name` | text NULL | **snapshot** of the public form |
| `email` | text NOT NULL | snapshot, lowercased/normalized |
| `phone` | text NULL | snapshot |
| `website_url` | text NULL | snapshot (raw input) |
| `normalized_domain` | text NULL | derived (host, lowercased, no `www.`) |
| `company_name` | text NULL | snapshot (optional) |
| `payload` | jsonb NOT NULL default `'{}'` | per-source extra fields (safe, bounded) |
| `utm_source`/`utm_medium`/`utm_campaign`/`utm_term`/`utm_content` | text NULL | attribution |
| `referrer` / `page_path` / `locale` | text NULL | context (locale ∈ de/fr/en) |
| `user_agent_hash` / `ip_hash` | text NULL | **hashed only** (never raw) |
| `consent_privacy` | boolean NOT NULL default false | required true at submit |
| `consent_marketing` | boolean NOT NULL default false | optional |
| `archived_at` / `archived_by` | timestamptz / uuid NULL | soft-archive (→ profiles SET NULL) |
| `created_by` / `updated_by` | uuid NULL | → profiles SET NULL (null for public ingest) |
| `notes` / `internal_notes` | text NULL | staff notes |

**Decisions:** `company_id` and `contact_id` **optional/nullable** (a submission may be unlinked). **Rows
are never hard-deleted** (archive). **`organization_id` deferred.** **Raw IP/User-Agent are NOT stored —
only hashes** (`ip_hash` via `ipIdentifier`, `user_agent_hash` via the same salted hash) for GDPR
minimisation. **`website_url` is normalized** to `normalized_domain` for matching/dedup. **Duplicate
submissions are allowed** (each is a record) but **soft-deduped** for display/spam: a soft "possible
duplicate" flag when the same `email`/`normalized_domain` submitted the same `source_type` within a short
window (shown in the UI; not blocked). Snapshots are immutable; CRM rows are the source of truth.

---

## 6. Status model

**Shared status CHECK** (covers all funnels; folds the website-analysis intermediate states + P14/P15 prep):
`new`, `to_review`, `qualified`, `in_progress`, `analyzed`, `report_sent`, `contacted`,
`follow_up_planned`, `converted`, `closed_not_relevant`, `archived`. *(Website-analysis usage: `new` →
`to_review`/`to_analyze` → `in_progress`/`in_analysis` → `analyzed` → `report_sent` → `follow_up_planned`
→ `converted`(won) / `closed_not_relevant`; `analyzed`/`report_sent` are reserved for P14/P15.)*
`spam_status` (pending/ham/suspected/spam) is **separate** from the workflow status.

**StatusBadge tokens** (`funnelStatusToken`, entity `'funnel'`): new→draft, to_review→waiting,
qualified→sent, in_progress→waiting, analyzed→done, report_sent→done, contacted→sent,
follow_up_planned→waiting, converted→done, closed_not_relevant→cancelled, archived→cancelled.

**Transitions:** flexible (staff-driven, no hard machine in P13) — any non-terminal → any non-terminal;
`archived` via the archive action only; **restore → `new`** (inert re-entry). Status changes are local
workflow only and never touch Stripe/CRM.

---

## 7. Public API / ingestion endpoint

**`POST /api/funnels/submit`** (nodejs runtime), modelled on `/api/leads`:

- **zod `funnelSubmitSchema`** (in `@/lib/validation`): `sourceType` (enum, default `website_analysis`),
  `firstName`, `lastName`, `email` (email; lowercased), `websiteUrl` (required for website_analysis; URL or
  bare domain), `consentPrivacy` (must be `true`), `consentMarketing` (optional), `turnstileToken`,
  `payload` (bounded per-source object), `utm*`/`referrer`/`pagePath`/`locale` (optional client context),
  and a **honeypot** field with a name distinct from real fields (e.g. `companyUrl`) — **`website`/
  `website_url` is a REAL funnel field, so the `/api/leads` honeypot name must NOT be reused.** **Field-length
  + payload-size caps.**
- **Pipeline:** parse → 422 on invalid → **honeypot filled → return `{ok:true}` without storing** → **rate
  limit** `checkRateLimit('funnels', ipIdentifier(ip), …)` (also a secondary per-email/domain limit) → 429 →
  **Turnstile** verify → 400 → normalize email + derive `normalized_domain` → **service-role**
  `createAdminClient()` insert with `status='new'`, `spam_status='pending'`, `ip_hash`/`user_agent_hash`
  (hashed), snapshots, UTM/context, consent → **best-effort CRM link** (§8) → audit `funnel.submitted`
  (+`funnel.linked_*` if matched) → **safe `{ok:true}`**.
- **Never trust client** `status`/`owner_id`/`contact_id`/`company_id`/`spam_status` (ignored if present).
  **Never expose the service-role key.** **The response is always `{ok:true}`** (even on duplicate/spam/no
  match) so it **never reveals whether an email/contact exists**. **No crawling, no AI, no email** in P13.

---

## 8. CRM linking behaviour

At ingestion (service role, best-effort; never blocks the submission):

1. **Contact by email:** find a single non-archived `company_contacts` row with `lower(email)=lower(email)`.
   If **exactly one** → set `contact_id` + `company_id` (= that contact's company); audit
   `funnel.linked_contact`. If 0 or many → no contact link.
2. **Else company by domain:** find a single non-archived `companies` row with `domain =
   normalized_domain`. If **exactly one** → set `company_id` (contact null); audit `funnel.linked_company`.
   If 0 or many → leave `company_id` null.
3. **Never auto-create CRM rows** (a contact needs a company — NOT NULL — and the companies `source` enum
   has no funnel value). Ambiguous/no-match → **leave both null** and surface a **"link or create" review
   action** on the detail page.
4. **Never overwrite existing CRM fields** — the public form data lives **only as snapshots** on the
   submission. A staff `createContactFromFunnel`/`createCompanyFromFunnel`/`linkFunnel*` may later populate
   CRM, and may fill an **empty** CRM field but never replace a non-empty one. Company creation uses
   `source='contact_form'` (an existing valid enum value — **no schema change**).

CRM stays the source of truth; the funnel submission is the request record + snapshot + audit trail.

---

## 9. Portal UI / routes

**New `funnels` nav** (gated `funnels.read`). Routes under `src/app/(portal)/app/(protected)/funnels/`:
`page.tsx` (list), `[id]/page.tsx` (detail). Optional `?source_type=website_analysis` filter. *(A separate
nav rather than overloading the legacy service-role `leads` admin — `leads` is the contact-form sink, a
different concern.)*

- **List:** source type, status (StatusBadge), name, email, website/domain, company/contact link, owner,
  spam status, created_at; **search** (name/email/domain), **filters** (source_type/status/spam/owner/
  company), **archived toggle**, **pagination**, empty states; clickable rows.
- **Detail:** submitted snapshot data; CRM **contact/company links** (+ "link existing" / "create contact"
  / "create company" actions, the create actions gated by `contacts.create`/`companies.create`); source +
  UTM + referrer + page_path + locale; per-source `payload` (rendered safely; raw only for
  `audit.read_technical`); **status editor**; **owner assignment**; notes/internal_notes (`EditableBlock`);
  **archive/restore** (ConfirmDialog); **HistoryButton/HistoryTimeline**; a "possible duplicate" hint.

---

## 10. Public website integration

- **Free Website Analysis** is the P13 public funnel. **CTA copy (brief, NL):** *"Laat jouw website nu door
  ons analyseren en ontvang een objectief rapport met concrete verbeterkansen."* The public site is **DE/FR/
  EN** (`localePrefix:'always'`) — so the copy is **localized into `src/messages/{de,fr,en}.json`** (house
  style: no dashes, no comma before a conjunction), with the NL line as the source brief. *(Draft DE:
  "Lassen Sie Ihre Website jetzt analysieren und erhalten Sie einen objektiven Bericht mit konkreten
  Verbesserungschancen." FR: "Faites analyser votre site maintenant et recevez un rapport objectif avec des
  pistes concrètes." EN: "Have your website analysed now and get an objective report with concrete
  improvements.")* **Whether to also add a Dutch (`nl`) public locale is an open decision (§24).**
- **Fields:** Voornaam (first name), Naam (last name), Email, Website. + privacy consent checkbox + hidden
  honeypot + Turnstile widget.
- **Placement:** a primary **header CTA** ("Free website analysis") + a CTA section on the relevant
  landing/service pages; a **grouped "Free tools" block in the footer** (room for the other three funnels
  later) — **no footer overload, no thin duplicate pages**. A reusable client `FunnelForm` component (modal
  or inline section) modelled on `SubscribeForm`/`ContactForm`, posting to `/api/funnels/submit`.
- **Success state:** a clear confirmation ("We received your request; we will be in touch"). **Error
  states** (validation, rate-limit, captcha) and **accessibility basics** (labels, focus, `aria-live` on the
  result). Consent/privacy text links to the existing privacy page.

---

## 11. Permissions model

New `funnels` module: `funnels.read`, `funnels.update`, `funnels.assign`, `funnels.archive`.

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `funnels.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `funnels.update` (status/notes) | ✓ | ✓ | — | — | — |
| `funnels.assign` (owner) | ✓ | ✓ | — | — | — |
| `funnels.archive` | ✓ | — | — | — | — |

**Creating CRM rows from a funnel** additionally requires the existing **`contacts.create`/`companies.create`**
(so the CRM permission boundary is respected). The **public endpoint needs no user permission** (service
role). No role editor UI.

---

## 12. RLS / security model

- **Reads: permission-gated** — `funnel_submissions` SELECT policy `has_permission('funnels.read') OR
  is_platform_super_admin()`. **No INSERT/UPDATE/DELETE policies** (no anon writes).
- **Public ingestion** uses **service role** server-side only (the API route) — **no client service-role**,
  no Stripe-style secret client-side. All portal writes are service-role server actions gated by the
  `funnels.*` permission.
- **Privacy:** store **hashed** IP/User-Agent only (never raw); consent fields required/recorded;
  payload/snapshots are billing-/PII-sensitive → visible only to `funnels.read`; raw payload + hashes →
  **technical fields gated by `audit.read_technical`**; ordinary audit carries no PII payload. The public
  response never reveals contact/email existence. No public/customer access to the table.

---

## 13. Migration plan — `0032_funnel_submissions`

Additive, greenfield; mirror to `supabase/migrations/`, hand-add the `database.ts` type, README entry.
**No legacy/checkout/Stripe/admin change.**

1. `create table public.funnel_submissions (...)` per §5 with CHECKs: `source_type` (the 4); `status` (the
   11); `spam_status` (pending/ham/suspected/spam); `consent_privacy` default false.
2. FKs: `contact_id → company_contacts SET NULL`; `company_id → companies SET NULL`; `owner_id`/`archived_by`/
   `created_by`/`updated_by → profiles SET NULL`.
3. `touch_updated_at` trigger; indexes on `source_type`, `status`, `lower(email)`, `normalized_domain`,
   `company_id`, `contact_id`, `owner_id`, `spam_status`, `created_at desc`, partial `status WHERE
   archived_at IS NULL`.
4. `enable row level security` + the permission-gated SELECT policy; **no write policies.**
5. Seed `funnels.read/update/assign/archive`; grants per §11 (admin all; sales read/update/assign; others
   read). Rollback comments. Next migration after this: `0033`.

---

## 14. Server actions and queries

Module `src/modules/funnels/{schema,types,status,guards,queries,actions}.ts`.

- **Queries** (`server-only`, gated `funnels.read`): `listFunnelSubmissions(filters)` (search/filters/
  archived-hidden-default/25-page), `getFunnelSubmission(id)` (+ resolved contact/company/owner names +
  duplicate hint; raw payload/hashes only for `audit.read_technical`).
- **Portal actions** (`'use server'`, gated, audited, revalidated): `updateFunnelStatus`,
  `updateFunnelNotes`, `assignFunnelOwner` (`funnels.assign`), `archiveFunnelSubmission`/
  `restoreFunnelSubmission` (`funnels.archive`, restore→`new`), `linkFunnelToContact`/`linkFunnelToCompany`
  (`funnels.update`; validate the id exists; set the link; never overwrite CRM), `createContactFromFunnel`
  (`contacts.create`; create a `company_contacts` row in a chosen/created company from the snapshot, link
  it), `createCompanyFromFunnel` (`companies.create`; create a `companies` row from the snapshot domain/
  name with `source='contact_form'`, link it).
- **Public ingestion** (`ingestFunnelSubmission`, called by the API route — **not** a user server action):
  service-role insert + best-effort CRM link + audit; never trusts client status/owner/links; returns a
  safe boolean.

Each: zod validation, permission checks (public vs portal boundary), audit, sanitized errors, path
revalidation (`/app/funnels`, `/app/funnels/[id]`, and the linked company page).

---

## 15. Audit / history

Events: `funnel.submitted`, `funnel.status_changed`, `funnel.updated`, `funnel.assigned`,
`funnel.linked_contact`, `funnel.linked_company`, `funnel.created_contact`, `funnel.created_company`,
`funnel.archived`, `funnel.restored`, `funnel.spam_flagged`. `entity_type='funnel'`, `entity_id=
funnel_submissions.id`. Public ingestion audits with `source` indicating the public form (e.g. `source=
'public_link'`/`'api'`, `actorType='external_user'`/`'system'`, no user actor). **Safe metadata:** source_type,
status, non-secret ids, matched company/contact ids. **Forbidden in ordinary metadata:** raw IP/UA, full
payload dump, email body, secrets. Raw payload/hashes/before-after → technical fields gated by
`audit.read_technical`. Add labels/colours in `audit/display.ts`.

---

## 16. Spam / abuse / validation

**Rate limit** by `ip_hash` + a secondary per-email/per-domain limit (reuse `checkRateLimit`); **honeypot**
(distinct field name from the real website field); **Turnstile** (reuse `verifyTurnstile`; fail-safe to
allow when unconfigured, per the P4 pattern); **URL/email validation + normalization**; **max field lengths
+ payload size cap**; **duplicate policy** = allow but soft-flag (no blocking); **safe generic error
messages** (no enumeration); spam heuristics set `spam_status`/`spam_score` and may audit
`funnel.spam_flagged`. **No crawling in P13** (so no SSRF surface yet) — but the spec records the future
guard: **when P14 adds crawling, block private/internal/loopback IP targets + non-http(s) schemes** (SSRF
defence).

---

## 17. Relationship with future P14 / P15

P13 stores enough structured data (`website_url`/`normalized_domain`, snapshots, `payload`, status,
consent) for **P14** to generate AI website-analysis reports from `website_analysis` submissions, and for
**P15** to send reports + automate follow-up. The statuses `analyzed`/`report_sent` are reserved now so the
workflow is ready. **No report generation, no crawling, no email automation in P13.**

---

## 18. Relationship with CRM / P5–P12

CRM `companies`/`company_contacts` remain the **source of truth** for people/orgs; funnel submissions are
**workflow/request records** that link to them. **Projects (P6), quotes (P8), invoices (P9), payments
(P10), payment links (P11), subscriptions (P12)** are **unchanged** — P13 creates **no** project/quote/
invoice/payment automatically; a later manual conversion can create a project/quote from a funnel. No
billing-table touch.

---

## 19. Legacy / old admin / checkout boundaries

No change to old `/[locale]/admin`, `/api/checkout`, the Stripe webhook, P10/P11/P12 billing, or the
existing `leads`/`/api/leads` path. **Marketing pages change only for the scoped CTA/form integration**
(header CTA, a landing CTA section, a footer "Free tools" block, the new `FunnelForm` + DE/FR/EN copy) — no
page rewrite, no business-table rewrite, no hard deletes.

---

## 20. Files likely to create / update

**Create:** `supabase/migrations/0032_funnel_submissions.sql`;
`src/modules/funnels/{schema,types,status,guards,queries,actions}.ts`; `src/app/api/funnels/submit/route.ts`;
`src/app/(portal)/app/(protected)/funnels/{page,[id]/page}.tsx`;
`src/components/portal/funnels/{FunnelTable,FunnelDetailActions}.tsx`; a public
`src/components/FunnelForm.tsx` (+ a header CTA + a landing CTA section + a footer block);
`PORTAL_P13_SPEC.md`, `PORTAL_P13_RUNBOOK.md`; tests. **Update (additive):** `src/lib/validation.ts`
(+`funnelSubmitSchema`), `src/lib/status/colors.ts` (+`funnelStatusToken`), `StatusBadge.tsx`
(+`'funnel'`), `audit/display.ts` (+`funnel.*`), `database.ts` (+`funnel_submissions` + status types),
`Topbar.tsx` (+nav), `Header.tsx`/`Footer.tsx` (+CTA), `src/messages/{de,fr,en}.json` (+copy, keep parity),
`migrations/README.md`. **No `/api/checkout`/webhook/`/admin` change.**

---

## 21. Tests

- **Migration/RLS** (live probe): permission-less `sub` → 0 rows on `funnel_submissions`; `funnels.read` →
  visible. **Permission matrix** (read all; update/assign sales+admin; archive admin-only; create-CRM needs
  contacts/companies.create).
- **Public API:** zod validation (missing/invalid → 422; missing consent rejected); **honeypot filled →
  ok-without-store**; **rate-limit → 429**; **Turnstile fail → 400**; email lowercased + domain normalized;
  UTM/context/hashes stored; **never trusts client status/owner/links**; response is always `{ok:true}`
  (no enumeration); no crawling/AI/email; no service-role/secret client-side.
- **CRM linking:** single email match → links contact+company; single domain match → links company; 0/many
  → unlinked; **never overwrites a non-empty CRM field**; `createContactFromFunnel` needs a company;
  `createCompanyFromFunnel` uses `source='contact_form'`.
- **Workflow:** status change, assign, notes, archive→restore(→new), duplicate soft-flag; **rows never
  hard-deleted**; **no legacy `leads`/checkout/Stripe write** from the funnels module.
- **Audit:** events labelled; **no raw IP/UA/payload/secret in ordinary metadata**; technical gated.
- **UI/component:** StatusBadge `funnel` mapping; the public `FunnelForm` posts to `/api/funnels/submit`;
  no service-role import in client.
- **Regression + gates:** P1–P12C green; `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

---

## 22. Manual smoke checklist

Publicly submit the **Free Website Analysis** form (DE/FR/EN) → safe success state. In the portal: the
record appears under **/app/funnels** as `website_analysis`/`new`; with a matching existing contact-email →
contact+company linked; with a matching company domain → company linked; otherwise unlinked with a "link or
create" action. Change status; assign an owner; edit notes; **create a contact** (requires a company);
**create a company** (`source=contact_form`); archive → restore (→`new`); submit a **duplicate** → soft-flag;
trip the **honeypot** + **rate limit** + **Turnstile**; verify **read_only** sees the list but no edit, and
**sales** cannot archive. Confirm `/api/leads`, `/api/checkout`, the Stripe webhook, P10/P11/P12, and old
`/admin` are **unchanged**.

---

## 23. Rollback plan

- **Code:** revert the P13 commit — the funnels module/routes/components, the public route, the CTA/form,
  the status/audit/validation/database.ts/i18n additions revert together.
- **Migration (greenfield):** `drop table public.funnel_submissions;` + delete the 4 perms/grants (see the
  `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Instant disable (no full rollback):** hide the public CTA (a flag or remove the header/footer link) and/
  or return `503` from `/api/funnels/submit` → ingestion stops; the portal list still shows existing rows.
- **No Stripe rollback** needed (P13 is unrelated to billing). Old checkout/admin remain the untouched
  baseline.

---

## 24. Risks and open questions (defaults in **bold**)

1. **Spam/abuse** — honeypot + rate-limit + Turnstile + hashed identifiers; spam_status workflow. **Default
   on.**
2. **Duplicate contacts/companies** — **no auto-create** (link-only at ingestion; manual create with
   review) avoids duplicates; companies `source` enum untouched (use `contact_form`).
3. **Privacy/GDPR** — **hash IP/UA only**, store consent, snapshots minimised, PII gated by `funnels.read`.
   *(Confirm consent wording with the privacy page.)*
4. **Domain/company matching mistakes** — **only exact single-match auto-link**; ambiguous → manual review.
5. **Multilingual copy** — site is **DE/FR/EN**; the NL CTA is the brief → localized to DE/FR/EN. **Open:
   add a Dutch public locale?** Default **no** (keep DE/FR/EN); revisit if the NL market is targeted.
6. **Future crawling SSRF (P14)** — recorded guard (block private/loopback/non-http(s)); **no crawling in
   P13**.
7. **Future AI report cost / email deliverability** — P14/P15 concerns; P13 only stores data.
8. **`organization_id`** — deferred.

---

## 25. Final readiness checklist

- **P13 spec ready:** **Yes.** Grounded in the live `/api/leads` ingestion pattern, the `leads`-is-unfit
  finding, the P5 `companies`/`company_contacts` shape (domain match + NOT-NULL company on contacts + closed
  `source` enum), the reusable Turnstile/rate-limit/audit/status/UI patterns, and migration `0032`. **No
  build, no migration created.**
- **Blockers:** none.
- **Decisions needed before build:** (a) the §24 items — esp. **Dutch public locale (default no)** and
  **consent wording**; (b) confirm **new `funnel_submissions` table + `funnels` module** (vs reusing
  `leads`); (c) confirm **link-only-at-ingestion, no CRM auto-create**; (d) confirm **archive admin-only**;
  (e) confirm **email notification deferred**.
- **Recommended safe defaults:** new generic `funnel_submissions` (0032); public `POST /api/funnels/submit`
  (zod + distinct honeypot + rate-limit + Turnstile + service-role + safe `{ok:true}`); **link-only** to
  existing contact-by-email / company-by-domain, **never auto-create/overwrite CRM**; shared statuses; DE/FR/
  EN copy (no Dutch locale); permissions `funnels.read/update/assign/archive` (archive admin-only); hashed
  IP/UA; **no AI/crawling/email** (P14/P15); ship **Free Website Analysis** only.

**Exact approval question:** *"Approve **P13** Website Sales Funnels as specified — a new generic
`funnel_submissions` table (migration `0032`) + `funnels` module + a hardened public `POST
/api/funnels/submit` (zod + distinct honeypot + rate-limit + Turnstile + service-role + always-safe
`{ok:true}`), shipping the **Free Website Analysis** funnel (Voornaam/Naam/Email/Website, DE/FR/EN copy from
the NL brief, no Dutch locale), with **link-only** CRM behaviour (existing contact-by-email / company-by-
domain; **no auto-create, no overwrite**; manual create-contact/create-company gated by `contacts.create`/
`companies.create`), a portal `/app/funnels` list+detail with status/owner/notes/archive + audit, permissions
`funnels.read/update/assign/archive` (sales read/update/assign, archive admin-only), permission-gated read
RLS + service-role writes, hashed IP/UA + consent, and **no AI/crawling/email/checkout/Stripe/legacy
change** — with the §24 defaults? Or change any §24 decision (e.g. add a Dutch locale, allow company
auto-create, or include a minimal admin-notification email) first?"*

**Do not build yet. Awaiting the P13 approval + the §24 decisions.**
