# PORTAL P5 — CRM CORE (COMPANIES + CONTACTS) — TECHNICAL SPECIFICATION

Status: **SPEC ONLY — do not build, do not create migrations.** Awaiting approval.
Authoritative sources: `AMAI_PORTAL_MASTER_PLAN.md` Parts IV, V, VI; the **live** Supabase
schema (`bkwwlmflsbhrsfwydbnv`) and current repo, which override any theoretical migration
names or older assumptions (Part VI §VI.1 rule 4). This spec was written after inspecting both.

---

## 1. P5 objective

P5 introduces the **CRM core only**: the `companies` and `contacts` entities, their
relationship, a human CRM lifecycle status per entity, archive/restore, audit/history, and
list/detail UI with create/edit flows. It establishes Ring C (Master Plan §3) as the durable
foundation that later modules (projects, products, finance, documents, deals) will reference.

P5 does **not** build any module beyond companies + contacts. No projects, products, finance,
invoices, quotes, payments, NDA/documents, external client portal, notifications, impersonation,
MFA, role editor, or org settings UI. No business-table rewrite. The old `/[locale]/admin` is
untouched.

---

## 2. Current-state dependency check (what was inspected, what exists live)

**Live tables (public schema)** — relevant subset, verified via `list_tables` + `information_schema`:

- **`companies`** (RLS on, 0 rows). **Already exists and is the prospecting/outreach master**,
  not a thin CRM stub. Columns: `id uuid pk`, `created_at`, `updated_at`, `company_name not null`,
  `domain`, `website_url`, `email`, `contact_person`, `phone`, `city`, `canton`,
  `country not null default 'CH'`, `language_pref`, `industry`, `source not null default 'csv'`,
  `notes`, `lead_status not null default 'imported'`, `lead_priority`, `import_batch_id`,
  `last_scanned_at`. Comment: *"Lead/company master record for amai.ch (any source). Feeds the
  daily audit pipeline."*
  - `lead_status` CHECK has **16 pipeline states**: `imported, ready_for_analysis,
    analysis_in_progress, analysis_failed, report_generated, waiting_for_review, pdf_reviewed,
    email_draft_generated, approved_for_sending, sent, replied, not_interested, opted_out,
    do_not_contact, won, lost`.
  - `lead_priority` CHECK: `not_relevant, low, medium, high, ready_for_outreach,
    needs_manual_review, do_not_contact`. `source` CHECK: `csv, manual, contact_form,
    daily_audit, external`. `language_pref` CHECK: `de, fr, it, en`.
  - **10 inbound FKs reference `companies(id)`**: `analyses`, `company_contacts`, `customers`,
    `daily_queue`, `emails`, `import_rows`, `opt_outs`, `payment_links`, `payments`,
    `report_files`, `scans`. Several are `ON DELETE CASCADE` (analyses, company_contacts,
    daily_queue, emails, report_files, scans); others `SET NULL` (customers, import_rows,
    opt_outs, payment_links, payments).
- **`company_contacts`** (RLS on, 0 rows). Thin link table: `id uuid pk`, `created_at`,
  `company_id uuid not null → companies(id) ON DELETE CASCADE`, `name`, `email`, `phone`, `role`.
  No status, no `updated_at`, no archive/provenance columns. **There is no separate `contacts`
  table** — `company_contacts` is the only contact entity live.
- **`customers`** (RLS on, 0 rows) — billing/portal entity, separate from CRM. Has
  `company_id → companies(id) ON DELETE SET NULL`, `user_id → auth.users`, `customer_status`
  (`active, pending_payment, onboarding, paused, cancelled, lost, do_not_contact`),
  `payment_status` (11 states), `stripe_customer_id unique`. **Out of scope to modify.**
- **`leads`** (9 rows) — marketing form submissions (`status` default `new`). Out of scope.
- **`orders`**, **`subscriptions`**, old **`documents`**, old **`requests`** — out of scope.

**RBAC (live):** `roles` smallint (`1 admin, 2 analyst, 3 sales, 4 reviewer, 5 read_only`),
`user_roles(user_id, role_id)`, `permissions(id uuid, key, module not null, label not null)`
(11 seeded: `users.*`, `audit.read`, `audit.read_technical`, `org.manage`, `roles.manage`),
`role_permissions(role_id, permission_id)`. Current grants: admin = all user/org/audit perms;
analyst/sales/reviewer/read_only = `audit.read` only. **No companies/contacts permissions exist
yet.** Predicates: `has_permission(text)`, `is_admin()`, `is_staff()`, `is_platform_super_admin()`,
`is_org_admin()`, `current_org()` (all `authenticated`+`service_role` executable after P4 §0021).

**RLS posture (live, verified via `pg_policies`):**
- `companies_select`: `authenticated USING true` — every internal user can read all companies.
- `company_contacts_select`: `authenticated USING true` — same.
- No INSERT/UPDATE/DELETE policies on either → **writes are service-role only** (service role
  bypasses RLS; the prospecting pipeline writes as service role).
- `customers`: own (`user_id = auth.uid()`) or `is_staff()`. `profiles`: self or `is_admin()`.
- Display-safe audit reads go through the `audit_history()` RPC (gated by `audit.read`); direct
  `audit_logs` SELECT is `audit.read_technical`-only.

**Audit (live):** one append-only `audit_logs` with `action`, `entity_type`, `entity_id`,
`old_status`, `new_status`, `old_values`/`new_values` (jsonb, technical-only), denormalised
`actor_*`, `parent_entity_type`/`parent_entity_id`, `visible_to_admin/client`, `severity`,
`source`. Writer: `log_event()` RPC (service-role only) wrapped by `src/lib/audit/log.ts`
`logEvent()`. Reader: `audit_history()` RPC + `src/lib/audit/queries.ts`. Display map:
`src/lib/audit/display.ts` (`AUDIT_LABELS`, `AUDIT_COLORS`, `auditLabel`, `auditColor`).

**Status framework (live):** `src/lib/status/colors.ts` — tokens
`draft, sent, waiting, opened, done, cancelled, revoked, failed, system, warning, critical`
(`STATUS_COLORS`, `statusColor`, `userStatusToken`). `src/lib/status/types.ts` —
`StatusMachine`, `Transition`, `canTransition`, `transition`. **No domain machine exists yet**
(P3 users used a token-mapper + ad-hoc guards). P5 introduces the **first real status machines**.

**Reusable UI (P3.5):** `src/components/portal/ui/{StatusBadge,EditableBlock,ConfirmDialog,
Avatar,Spinner}.tsx` + `rowLink.ts` (stretched-link); `src/components/portal/history/
{HistoryButton,HistoryDrawer,HistoryTimeline}.tsx`; shell `Topbar.tsx`.

**Module template:** `src/modules/users/{schema,queries,actions,guards,types,emails}.ts` +
`src/modules/profile/*`. Security helpers: `src/lib/security/rbac.ts` `requirePermission(key)`
(returns `Profile`, redirects if missing) and `src/lib/security/authorize.ts` `hasPermission(key)`.

**Portal routing:** pages live under `src/app/(portal)/app/(protected)/…` and serve at `/app/…`
(no locale prefix — Part IV L8). Users module at `…/(protected)/users`.

**Migrations:** latest applied is `0021_rbac_predicate_grants_hardening`. **Next number = `0022`.**
The cosmetic `0018/0019` mismatch is documented in `supabase/migrations/README.md` — do not rename.

**`/[locale]/admin`:** still present (`(panel)`, `actions.ts`, `login`). P5 leaves it untouched.

**database.ts:** `companies` and `company_contacts` are **not yet typed**. P5 must add them.

---

## 3. Scope boundaries

**In scope (P5):**
- CRM lifecycle layer on **companies** + a first-class **contacts** entity (extending
  `company_contacts`), per the chosen data-model option (§4, decision **P5-D1**).
- Per-entity **status model** with the first real `StatusMachine`s (Part V §V1).
- **Audit/history** for both entities (reuse `logEvent` + `audit_history()` + `HistoryTimeline`).
- **List/detail UI**: `/app/companies`, `/app/contacts` (+ `/new`, `/[id]`), clickable rows,
  `StatusBadge`, `EditableBlock`, History button, archived filter, search, pagination.
- **Create / edit / archive / restore** server actions (permission-gated, audited, service-role).
- **Permissions** seed (`companies.*`, `contacts.*`) + `role_permissions` grants.
- **Tests** (migration/RLS, permission, action, status-transition, audit, UI, tsc/build,
  no-service-role-in-client, regression) + **docs/runbook**.

**Out of scope (explicitly not built in P5):**
projects · products · finance/invoices · quotes · payments · NDA/documents · external client
portal · full ERP · notification center · impersonation · MFA enforcement · role editor UI · org
settings UI · migrating `leads`/`customers`/`orders` (planning only) · removing old `/admin` ·
any business-table rewrite · deals/opportunities (status token defined in Part V but not built now).

**Deferred to later phases:**
- **Deals/opportunities** entity (Part V token `open/won/lost`) — after CRM core.
- **Company↔contact many-to-many** — P5 ships one-to-many (decision P5-D2).
- **Contacts without a company** — not allowed in P5 (decision P5-D3).
- **VAT/UID + structured address fields** on companies — additive later (decision P5-D6).
- **GDPR anonymize for contacts** (contacts hold third-party PII) — archive only in P5; anonymize
  is a separate later action mirroring the user model (VI.6).
- **Reconciliation `leads`/`customers` → companies/contacts** — planning only (§16).
- **Tightened read RLS** (`companies.read`-gated) — optional, see §8 (decision P5-D7).

---

## 4. Data model proposal

### Decision P5-D1 — reuse vs new tables (THE headline decision)

**Recommended: Option A — reuse `companies` as the company master and promote `company_contacts`
to the CRM contact entity, adding the CRM layer additively.**

Rationale: `companies` is already the designated multi-source master (`source` enum includes
`manual`/`contact_form`/`external`; `customers.company_id` already FKs it; Master Plan §3 names
`companies`/`contacts` as Ring C). Creating a parallel `crm_companies` would fork the company
concept and force an immediate reconciliation. The CRM layer is **purely additive**: a new
`crm_status` (distinct from the pipeline `lead_status`) plus archive/owner provenance. The
prospecting pipeline keeps owning `lead_status`; the CRM owns `crm_status`. Nothing in the
pipeline is rewritten.

**Alternative: Option B — new dedicated `crm_companies` + `crm_contacts`**, leaving the
prospecting tables 100% untouched. Cleaner isolation and zero pipeline risk, but forks the
company concept and needs a future merge. Offered for approval; **not recommended**.

The remainder of this spec is written for **Option A**. The §9 migration notes exactly what
changes under Option B.

### Tables (Option A — additive columns)

**`companies` (extend, do not touch `lead_status` or the pipeline columns):**

| Column | Type | Notes |
|---|---|---|
| `crm_status` | `text NOT NULL DEFAULT 'lead'` | CHECK = `lead, qualified, active, dormant, lost, blocked, archived`. The **human CRM lifecycle**, orthogonal to `lead_status` (the automated outreach machine). |
| `owner_id` | `uuid NULL → profiles(id)` | Account manager / owner (internal user). Nullable. |
| `archived_at` | `timestamptz NULL` | Provenance (mirrors P4 user archive, V-D7). |
| `archived_by` | `uuid NULL → profiles(id)` | Provenance. |

Existing columns reused as the CRM company record: `company_name` (display), `domain`,
`website_url`, `email`, `phone`, `city`, `canton`, `country`, `language_pref`, `industry`,
`notes`, `created_at`, `updated_at`. (Company-level `contact_person`/`email`/`phone` stay as a
denormalised primary-contact convenience; the normalised contacts live in `company_contacts`.)

**`company_contacts` (extend into the CRM contact entity):**

| Column | Type | Notes |
|---|---|---|
| `contact_status` | `text NOT NULL DEFAULT 'lead'` | CHECK = `lead, qualified, active, dormant, blocked, archived` (no `lost`). |
| `updated_at` | `timestamptz NOT NULL DEFAULT now()` | + reuse `touch_updated_at` trigger. |
| `is_primary` | `boolean NOT NULL DEFAULT false` | Primary contact for the company (UI convenience; not enforced unique in P5). |
| `archived_at` | `timestamptz NULL` | Provenance. |
| `archived_by` | `uuid NULL → profiles(id)` | Provenance. |
| `created_by` | `uuid NULL → profiles(id)` | Provenance (who created the contact). |
| `updated_by` | `uuid NULL → profiles(id)` | Provenance. |

Existing columns reused: `company_id` (NOT NULL FK), `name`, `email`, `phone`, `role`, `created_at`.

### Justified decisions

- **P5-D2 — Cardinality: one contact belongs to exactly one company (one-to-many).** Matches the
  live `company_contacts.company_id NOT NULL`. Many-to-many (`company_contacts` as a pure join +
  a standalone `contacts`) is **deferred**; revisit when a person legitimately spans companies.
- **P5-D3 — Contacts cannot exist without a company.** `company_id` stays `NOT NULL`. Simpler RLS
  and UI; standalone contacts deferred.
- **P5-D4 — Company name is NOT unique.** Real-world duplicates and multi-entity names make a hard
  unique constraint fragile; dedup is a later concern. Add a non-unique index on `company_name`
  and a soft-unique-ish index on `lower(domain)` (partial, where `domain is not null`) to aid
  fuzzy dedupe **without** rejecting inserts. (No unique constraint in P5.)
- **P5-D5 — Contact email is NOT unique** (not global, not per-company). The same person can recur;
  dedupe later. Add a plain index on `lower(email)` for lookup only.
- **P5-D6 — VAT/UID and structured address are deferred.** The live `companies` has no VAT column;
  P5 keeps the minimal core. Adding `vat_number`/`uid` and address fields later is a one-line
  additive migration. (Note: the marketing/legal entity UID is still pending per `CLAUDE.md`.)
- **Organization scoping:** the live `companies`/`company_contacts` have **no `organization_id`**
  (single-org reality; Master Plan §5 "v1: one org"). P5 does **not** add `organization_id`
  (additive but unused now); it is deferred until multi-org is real. Audit rows may still carry
  `organization_id` via `current_org()` where available.
- **created/updated:** `companies` already has both; `company_contacts` gains `updated_at`.
  `created_by`/`updated_by`/`archived_by` added to contacts; `owner_id`/`archived_by` to companies.

---

## 5. Company status model

`crm_status` values → shared token (Part V §V1, line 1947-1949), class, permission, confirm:

| Value | Token | Class | Permission to set | Confirm |
|---|---|---|---|---|
| `lead` | `draft` | R (entry) | `companies.update` | no |
| `qualified` | `waiting` | R | `companies.update` | no |
| `active` | `done` | R | `companies.update` | no |
| `dormant` | `system` | R | `companies.update` | no |
| `lost` | `cancelled` | near-terminal (reopen→lead) | `companies.update` | no |
| `blocked` | `revoked` | R (access/relationship hold) | `companies.update` | **yes** |
| `archived` | `cancelled` | near-terminal, restorable | `companies.archive` | **yes (type-to-confirm)** |

**Allowed transitions** (declared in `companyStatusMachine`):
`lead↔qualified`, `qualified↔active`, `active↔dormant`, `dormant→active`,
`{lead,qualified,active,dormant}→lost`, `lost→lead` (reopen),
`{lead,qualified,active,dormant,lost}→blocked`, `blocked→lead` (unblock),
`{any non-archived}→archived` (archive), `archived→lead` (restore).
No transition may skip the machine; `changeCompanyStatus` calls `canTransition` server-side.

**Audit events:** routine status moves emit `company.status_changed` with `old_status`/`new_status`.
Archive/restore emit `company.archived` / `company.restored` (see §14). Side effects: none in P5
(no email on status change yet).

---

## 6. Contact status model

`contact_status` values → token, class, permission, confirm:

| Value | Token | Class | Permission to set | Confirm |
|---|---|---|---|---|
| `lead` | `draft` | R (entry) | `contacts.update` | no |
| `qualified` | `waiting` | R | `contacts.update` | no |
| `active` | `done` | R | `contacts.update` | no |
| `dormant` | `system` | R | `contacts.update` | no |
| `blocked` | `revoked` | R | `contacts.update` | **yes** |
| `archived` | `cancelled` | near-terminal, restorable | `contacts.archive` | **yes (type-to-confirm)** |

**Allowed transitions** (`contactStatusMachine`): `lead↔qualified`, `qualified↔active`,
`active↔dormant`, `dormant→active`, `{lead,qualified,active,dormant}→blocked`, `blocked→lead`,
`{any non-archived}→archived`, `archived→lead`. (No `lost` for contacts, per the brief.)

**Audit events:** `contact.status_changed` (with old/new), `contact.archived`, `contact.restored`.

---

## 7. Permissions model

New permission rows (seeded with `module` + `label`, matching the live NOT-NULL columns):

| key | module | label |
|---|---|---|
| `companies.read` | `companies` | View companies |
| `companies.create` | `companies` | Create companies |
| `companies.update` | `companies` | Update companies |
| `companies.archive` | `companies` | Archive companies |
| `contacts.read` | `contacts` | View contacts |
| `contacts.create` | `contacts` | Create contacts |
| `contacts.update` | `contacts` | Update contacts |
| `contacts.archive` | `contacts` | Archive contacts |

**Initial `role_permissions` grants (proposed):**

| Role | read | create | update | archive |
|---|---|---|---|---|
| `admin` (1) | ✓ | ✓ | ✓ | ✓ |
| `sales` (3) | ✓ | ✓ | ✓ | ✗ |
| `analyst` (2) | ✓ | ✗ | ✗ | ✗ |
| `reviewer` (4) | ✓ | ✗ | ✗ | ✗ |
| `read_only` (5) | ✓ | ✗ | ✗ | ✗ |

(Same matrix for both `companies.*` and `contacts.*`.) Rationale: `sales` is the CRM operator
(full CRUD except the destructive archive); everyone internal can read; archive is admin-only
(reversible but consequential). **No role editor UI** — grants are migration seeds only. Open
question P5-Q1: should `sales` also get `*.archive`? (Default: no.)

---

## 8. RLS / security model

**Reads (companies + contacts):** keep the existing `…_select: authenticated USING true`
policies (all internal staff can read). Read-gating for the CRM is enforced at the **route +
nav** level via `requirePermission('companies.read')` / `requirePermission('contacts.read')`,
not by RLS — this is additive (no live-policy change). All current portal users are internal
staff (Master Plan §5), so blanket staff-read is acceptable for an internal CRM.

- **Decision P5-D7 (offered):** optionally **tighten** to
  `companies_select USING (has_permission('companies.read') OR is_platform_super_admin())` and
  likewise for contacts. This is more least-privilege but **modifies a live policy** on a table
  the prospecting pipeline reads (the pipeline runs as service role and bypasses RLS, so it is
  safe), and would matter once an external client portal exists. **Default: do not tighten in P5**
  (keep additive); revisit when external users are introduced.

**Writes (create/update/status/archive/restore):** **no client writes.** All writes go through
permission-gated **server actions** using the service-role admin client, exactly like the users
module. Each action calls `requirePermission(...)` (and `canTransition` for status), then writes,
then `logEvent`. No new INSERT/UPDATE RLS policies are added (writes stay service-role only,
matching the live posture).

**Archived rows hidden by default at the query layer:** list queries filter
`archived_at is null` unless the "Show archived" filter is set (mirrors P4 users). Not an RLS
concern.

**Service-role / admin:** service role bypasses RLS (pipeline + actions). `is_platform_super_admin()`
retains full read via the predicate; no special CRM-only super-admin path is added.

**Audit technical fields stay gated:** unchanged — `old_values`/`new_values`/IP/UA are
technical-only (`audit.read_technical`); the CRM History timeline reads the display-safe
`audit_history()` RPC. No raw third-party PII is written into ordinary-admin-visible metadata
(see §14).

**Security invariants (must hold):** service-role key never reaches the client; no service-role
client in any client component; status changes validated server-side against the machine;
type-to-confirm enforced server-side for archive (not just UI); no raw PII or tokens logged.

---

## 9. Migration plan

**Next number: `0022_crm_companies_contacts.sql`** (additive only; `-- ROLLBACK:` notes; never
edit an applied migration — Part IV L2). Apply live via Supabase MCP `apply_migration`, then
mirror the file into `supabase/migrations/` and regenerate `src/lib/types/database.ts`.

**Contents (Option A):**
1. **`companies`** — `ALTER TABLE … ADD COLUMN` (all additive/nullable or defaulted):
   `crm_status text not null default 'lead'`, `owner_id uuid references profiles(id)`,
   `archived_at timestamptz`, `archived_by uuid references profiles(id)`.
   `ADD CONSTRAINT companies_crm_status_check CHECK (crm_status in
   ('lead','qualified','active','dormant','lost','blocked','archived'))`.
2. **`company_contacts`** — add `contact_status text not null default 'lead'`,
   `updated_at timestamptz not null default now()`, `is_primary boolean not null default false`,
   `archived_at timestamptz`, `archived_by uuid references profiles(id)`,
   `created_by uuid references profiles(id)`, `updated_by uuid references profiles(id)`;
   `ADD CONSTRAINT company_contacts_status_check CHECK (contact_status in
   ('lead','qualified','active','dormant','blocked','archived'))`; attach the existing
   `touch_updated_at` trigger.
3. **Indexes:** `companies (crm_status) WHERE archived_at is null`; `companies (company_name)`;
   `companies (lower(domain)) WHERE domain is not null`; `company_contacts (company_id)` (if not
   already implied); `company_contacts (contact_status) WHERE archived_at is null`;
   `company_contacts (lower(email))`.
4. **Permissions seed:** `INSERT INTO permissions(key, module, label) VALUES …` for the 8 keys
   (§7), `ON CONFLICT (key) DO NOTHING`.
5. **role_permissions seed:** insert the grants per the §7 matrix (lookup `permission_id` by key,
   `role_id` by the smallint), `ON CONFLICT DO NOTHING`.
6. **No FK/CHECK changes to business tables.** No `organization_id` added (deferred). No changes
   to `lead_status`, `customers`, `leads`, `orders`, `subscriptions`, old `documents`/`requests`.
7. **`-- ROLLBACK:`** drop the added columns + constraints + indexes + the seeded permission/role
   rows (additive, so leaving them is harmless; a documented down path is provided).

**Under Option B (if chosen instead):** create new `crm_companies` + `crm_contacts` tables with
the full column set, FK `crm_contacts.company_id → crm_companies(id)`, RLS `authenticated`
read + service-role write, same status CHECKs, same permission/role seeds; the prospecting
`companies`/`company_contacts` are left entirely untouched. The §10–§14 logic is identical with
table names swapped.

---

## 10. Server actions and queries

New modules `src/modules/companies/` and `src/modules/contacts/` mirroring `modules/users`
(`schema.ts` zod, `queries.ts` read, `actions.ts` write, `guards.ts`, `status.ts` machine,
`types.ts`). All actions are `'use server'`, service-role, and follow:
**validate (zod) → `requirePermission` → (status: `canTransition`) → DB write → `logEvent` →
`revalidatePath`**, with typed error returns (never throw raw to the client).

**Companies — `queries.ts`:**
- `listCompanies({ search?, status?, showArchived?, page?, pageSize? })` → rows + count. Filters
  `archived_at is null` unless `showArchived`; `search` over `company_name`/`domain`/`email`;
  optional `crm_status` filter. Reads via the authenticated SSR client (RLS `true` → staff-read).
- `getCompany(id)` → company + its `company_contacts` (non-archived first). 404 if missing.

**Companies — `actions.ts`:**
- `createCompany(input)` — perm `companies.create`; zod; insert (`crm_status` default `lead`,
  `source='manual'`); audit `company.created`.
- `updateCompany(id, patch)` — perm `companies.update`; zod; update editable fields
  (name/domain/website/email/phone/city/canton/country/language_pref/industry/notes/owner_id);
  audit `company.updated` (changed-fields summary in safe metadata).
- `changeCompanyStatus(id, to)` — perm `companies.update`; `canTransition(companyStatusMachine,
  from, to)`; confirm required for `blocked`; update; audit `company.status_changed`
  (`old_status`/`new_status`).
- `archiveCompany(id, confirmText)` — perm `companies.archive`; require `confirmText` == the
  company name (type-to-confirm, server-enforced); set `crm_status='archived'`, `archived_at=now()`,
  `archived_by=actor`; audit `company.archived` (severity `warning`). Does **not** cascade-archive
  contacts in P5 (contacts archived separately) — open question P5-Q2.
- `restoreCompany(id)` — perm `companies.archive`; `archived → lead`; clear `archived_at/by`;
  audit `company.restored`.

**Contacts — `queries.ts`:**
- `listContacts({ search?, status?, companyId?, showArchived?, page?, pageSize? })` → rows + the
  joined company name. `getContact(id)` → contact + linked company.

**Contacts — `actions.ts`:**
- `createContact(input)` — perm `contacts.create`; zod; `company_id` required + must exist;
  `created_by=actor`; audit `contact.created` (with `parent_entity_type='company'`,
  `parent_entity_id=company_id`).
- `updateContact(id, patch)` — perm `contacts.update`; update name/email/phone/role/is_primary;
  `updated_by=actor`; audit `contact.updated`.
- `changeContactStatus(id, to)` — perm `contacts.update`; machine-checked; confirm for `blocked`;
  audit `contact.status_changed`.
- `archiveContact(id, confirmText)` — perm `contacts.archive`; type-to-confirm (contact name or
  email); set archived + provenance; audit `contact.archived`.
- `restoreContact(id)` — perm `contacts.archive`; `archived → lead`; audit `contact.restored`.

**Guards (`guards.ts`):** input normalisation, existence checks, status-transition legality
(thin wrappers over the machine), and the type-to-confirm comparison. No last-admin/self guards
needed (companies/contacts are not principals).

---

## 11. UI / routes

Under `src/app/(portal)/app/(protected)/` (served at `/app/…`, no locale prefix), mirroring users:

- `/app/companies` — list. Clickable rows (`rowLink` stretched-link), `StatusBadge`
  (`companyStatusToken`), columns: name, status, city/canton, owner, updated. Search box,
  `crm_status` filter, **"Show archived"** toggle, pagination (server-side, e.g. 25/page).
  Empty state ("No companies yet" + Create). "New company" button (gated `companies.create`).
- `/app/companies/new` — create form (`companies.create`).
- `/app/companies/[id]` — detail (see §12).
- `/app/contacts` — list. Clickable rows, `StatusBadge` (`contactStatusToken`), columns: name,
  company, status, email/role, updated. Search, status filter, archived toggle, pagination,
  empty state, "New contact" (gated `contacts.create`).
- `/app/contacts/new` — create form; company picker (required).
- `/app/contacts/[id]` — detail (see §13).

Shared components: `StatusBadge`, `EditableBlock`, `ConfirmDialog` (type-to-confirm),
`HistoryButton`/`HistoryDrawer`/`HistoryTimeline`, plus new presentational
`components/portal/companies/*` and `components/portal/contacts/*` (tables, forms, status
control, detail sections). **Topbar** gains "Companies" and "Contacts" links, each rendered only
when the user holds the matching `*.read` permission. Route protection: each page calls
`requirePermission('<entity>.read')` (redirect to a 403/portal home if missing).

---

## 12. Company detail page

Sections on `/app/companies/[id]`:
- **Header** — company name + `StatusBadge` (company status) + **History button** (opens
  `HistoryDrawer` reading `audit_history('company', id)`).
- **Status control** — current status + allowed transitions (machine-driven); `blocked` and
  `archived` require confirm; gated `companies.update` / `companies.archive`.
- **Company info** — `EditableBlock` (read-only → pencil unlock → Save/Cancel, dirty guard):
  name, domain, website, email, phone, city, canton, country, language, industry, owner, notes.
  Gated `companies.update`.
- **Contacts list** — the company's `company_contacts` (non-archived) with `StatusBadge`,
  clickable rows to `/app/contacts/[id]`, and an "Add contact" action (gated `contacts.create`,
  pre-fills `company_id`).
- **Danger zone** — Archive (type-to-confirm, `companies.archive`); when archived, the page is
  read-only except **Restore**.
- **Metadata** — created/updated timestamps, owner, archived_at/by when applicable.

---

## 13. Contact detail page

Sections on `/app/contacts/[id]`:
- **Header** — contact name + `StatusBadge` (contact status) + **History button**
  (`audit_history('contact', id)`).
- **Linked company** — company name linking to `/app/companies/[id]` (+ `is_primary` indicator).
- **Status control** — machine-driven transitions; `blocked`/`archived` confirm; gated
  `contacts.update` / `contacts.archive`.
- **Contact info** — `EditableBlock`: name, email, phone, role, is_primary. Gated `contacts.update`.
- **Danger zone** — Archive (type-to-confirm); read-only + Restore when archived.
- **Metadata** — created/updated, created_by/updated_by, archived_at/by when applicable.

---

## 14. Audit / history

Reuse the live contract (`logEvent` → `audit_logs` → `audit_history()` → `HistoryTimeline`).
Events emitted:

| Event | entity_type | severity | old/new status | notes |
|---|---|---|---|---|
| `company.created` | `company` | info | – | display name = company_name |
| `company.updated` | `company` | info | – | safe metadata = changed field names only |
| `company.status_changed` | `company` | info | ✓ | from→to |
| `company.archived` | `company` | warning | →`archived` | type-to-confirm |
| `company.restored` | `company` | info | `archived`→`lead` | |
| `contact.created` | `contact` | info | – | `parent_entity_type='company'`, `parent_entity_id` |
| `contact.updated` | `contact` | info | – | changed field names only |
| `contact.status_changed` | `contact` | info | ✓ | from→to |
| `contact.archived` | `contact` | warning | →`archived` | |
| `contact.restored` | `contact` | info | `archived`→`lead` | |

- **`old_status`/`new_status`** are set on every status/archive/restore event.
- **Safe metadata (ordinary admins):** changed-field **names** only (e.g.
  `{ "fields": ["phone","industry"] }`), display name, transition labels. **No raw third-party
  PII** (no contact email/phone values) in `metadata`.
- **Forbidden in admin-visible fields:** raw before/after PII values, tokens, secrets. Full
  before/after payloads, if ever needed, go in `old_values`/`new_values` (technical-only,
  `audit.read_technical`).
- **Display labels** added to `src/lib/audit/display.ts`:
  `AUDIT_LABELS`: `company.created`→"Company created", `company.updated`→"Company updated",
  `company.status_changed`→"Status changed", `company.archived`→"Company archived",
  `company.restored`→"Company restored", and the `contact.*` equivalents.
  `AUDIT_COLORS`: created→`done`, updated→`system`, status_changed→`warning`,
  archived→`revoked`, restored→`done` (matching the user-event convention).

---

## 15. Rate limiting / abuse

**No new public endpoints.** All CRM actions are authenticated, staff-only server actions behind
`requirePermission`. Therefore **no new app-level rate limit is required** in P5. (The existing
`hit_rate_limit()` infrastructure remains available.) If a **bulk import / CSV create** is added
later, it must be rate-limited and is **deferred** — explicitly out of P5 scope. (Note: a
prospecting CSV import pipeline already exists separately via `import_batches`; P5 does not touch
or expose it.)

---

## 16. Legacy data / old admin (planning only)

- **Do not migrate `leads`/`customers`/`orders` in P5.** No data movement; planning only.
- **Future mapping (documented, not built):** a marketing `lead` (or a `customer`) maps to a
  `company` (by `domain`/`email`) + one or more `contacts` (the firstname/lastname/email/phone);
  `customers.company_id` already links a paying customer to a company, so a future reconciliation
  job can backfill `crm_status`/contacts from `customers`/`leads` without schema change. This is a
  later phase with its own spec + dedupe rules (P5-D4/D5 keep names/emails non-unique precisely so
  reconciliation can dedupe deliberately rather than by hard constraint).
- **Old `/[locale]/admin` remains untouched** — no routes, actions, or auth changed. P5 adds only
  `/app/companies` + `/app/contacts`.
- **No business-table rewrite** — `leads`, `customers`, `orders`, `subscriptions`, old
  `documents`/`requests` are not altered.

---

## 17. Files likely to create / update

**Migration:** `supabase/migrations/0022_crm_companies_contacts.sql` (+ regenerate
`src/lib/types/database.ts`; update `supabase/migrations/README.md` P5 note).

**Status:** `src/lib/status/colors.ts` (add `companyStatusToken`, `contactStatusToken`);
`src/modules/companies/status.ts` + `src/modules/contacts/status.ts` (the `StatusMachine`s).

**Modules:** `src/modules/companies/{schema,queries,actions,guards,status,types}.ts`;
`src/modules/contacts/{schema,queries,actions,guards,status,types}.ts`.

**Audit:** `src/lib/audit/display.ts` (add company/contact labels + colors).

**Routes:** `src/app/(portal)/app/(protected)/companies/{page,new/page,[id]/page}.tsx`;
`…/contacts/{page,new/page,[id]/page}.tsx`.

**Components:** `src/components/portal/companies/*` (table, form, status control, detail
sections, contacts-sublist); `src/components/portal/contacts/*` (table, form, status control,
detail sections, company picker); update `src/components/portal/shell/Topbar.tsx` (nav links).

**Types:** `src/lib/types/database.ts` (companies + company_contacts Row/Insert/Update incl. new
columns; new permission keys are data, not types).

**Tests:** `src/modules/companies/*.test.ts`, `src/modules/contacts/*.test.ts`,
`src/components/portal/**/*.test.tsx`, a status-machine test, an audit-display test.

**Docs:** `PORTAL_P5_RUNBOOK.md` (apply/verify/rollback); update `AMAI_PORTAL_MASTER_PLAN.md`
Part VI roadmap **after** build/approval (not in the spec phase).

---

## 18. Tests

- **Migration / RLS:** after apply, verify an **authenticated** session can SELECT companies/
  contacts (RLS `true`), that `archived_at is null` filtering hides archived rows at the query
  layer, and that the new CHECK constraints reject invalid status values. Confirm service-role
  writes succeed and no client write path exists.
- **Permission tests:** `sales` can create/update; `read_only`/`analyst`/`reviewer` cannot
  create/update/archive; only `admin` can archive; everyone with `*.read` can list.
- **Action tests:** create/update/archive/restore happy paths + permission-denied + not-found;
  type-to-confirm rejects a wrong confirmation string server-side.
- **Status-transition tests:** every legal transition in each machine passes `canTransition`;
  representative illegal transitions are rejected; `blocked`/`archived` require confirm.
- **Audit tests:** each action emits the right `action` with `old_status`/`new_status` where
  applicable and **no raw PII** in `metadata`; `contact.created` carries the parent company.
- **UI/component tests:** clickable rows (stretched-link, inner controls stop propagation),
  `StatusBadge` token mapping, `EditableBlock` lock/unlock + dirty-guard, archived filter.
- **Build/type tests:** `npx tsc --noEmit` clean; `next build` clean (on macOS).
- **No-service-role-in-client test:** static check that no client component imports the
  service-role/admin client (extend the existing guard test).
- **Regression:** users + profile + admin flows, `/api/leads`, `/api/checkout`, and old
  `/[locale]/admin` remain green (run the full Vitest suite — currently 74 tests).

---

## 19. Manual smoke checklist

1. Create a company → appears in `/app/companies`, status `Lead`.
2. Edit company info via `EditableBlock` → Save persists; History shows `Company updated`.
3. Change company status `lead → qualified → active`; try an illegal jump → blocked.
4. Archive company (type-to-confirm) → leaves the default list; appears under "Show archived";
   page read-only except Restore. Restore → returns as `Lead`.
5. Create a contact linked to the company → appears in `/app/contacts` and on the company detail.
6. Edit contact; toggle `is_primary`; change status; History shows the events.
7. Archive contact (type-to-confirm) → hidden by default; Restore works.
8. History timeline renders company + contact events with correct labels/colours; technical
   fields hidden for a non-`audit.read_technical` admin.
9. Filters/search work on both lists; pagination works.
10. Permission checks: a `read_only` user sees the lists read-only (no New/Edit/Archive); nav
    links hidden without `*.read`. A `sales` user can CRUD but not archive.
11. Old `/[locale]/admin` and the marketing site are unaffected; `/api/leads` + `/api/checkout`
    still work.

---

## 20. Rollback plan

- **Code:** revert the P5 commit(s); the routes/modules/components are self-contained and the
  Topbar links are removed with them. No change to existing modules.
- **Migration (additive):** the added columns/indexes/permissions are inert if the code is gone;
  a documented down path drops the added columns, constraints, indexes, and the seeded
  `permissions`/`role_permissions` rows. (Per Part IV L2, the applied migration is never edited;
  a new corrective migration is added if needed.)
- **Disable without rollback:** hide the `/app/companies` + `/app/contacts` nav and gate the
  routes behind a feature flag (e.g. `CRM_ENABLED`) so the foundation can ship dark.
- **Data:** P5 never hard-deletes; archive is reversible. No destructive cleanup required. If
  Option A introduced `crm_status` and it must be retired, set it back to default and drop the
  column (the prospecting `lead_status` was never touched).
- **Old `/admin` fallback:** unchanged throughout — remains the legacy fallback.

---

## 21. Risks and open questions

1. **Reuse vs new tables (P5-D1).** Recommended: reuse `companies` + extend `company_contacts`
   (single master, additive). Risk: `companies` is the prospecting master, so the CRM list shows
   the same rows — see Q3. Alternative: new `crm_companies`/`crm_contacts` (clean, but forks).
   **Needs approval.**
2. **Dual status on companies.** `lead_status` (16-state outreach machine, pipeline-owned) coexists
   with the new `crm_status` (human CRM lifecycle). Two axes on one row — documented and
   orthogonal, but a source of confusion if not labelled clearly in the UI. Risk accepted under
   Option A; absent under Option B.
3. **CRM list flooded by prospects (P5-Q3).** Under Option A, imported prospects (`source='csv'/
   'daily_audit'`) are companies too and default to `crm_status='lead'`. The CRM "Companies" view
   would list them. Options: (a) show all with `source` + status filters [recommended]; (b) default
   the CRM list to `source in ('manual','contact_form')` and treat raw imports as a separate
   "Prospects" view; (c) Option B (separate tables). **Decision needed.**
4. **Contact/company cardinality (P5-D2).** Recommended one-to-many (`company_id NOT NULL`).
   Many-to-many deferred.
5. **Contacts without a company (P5-D3).** Recommended: not allowed in P5.
6. **Uniqueness (P5-D4/D5).** Recommended: company name **not** unique, contact email **not**
   unique (indexes for lookup/dedupe only). Confirm.
7. **VAT/UID + address (P5-D6).** Deferred. Confirm not needed for the minimal core.
8. **Cascade-delete exposure.** The prospecting pipeline has `ON DELETE CASCADE` FKs into
   `companies`; a future hard-delete on the pipeline side would also remove CRM data on that row.
   The CRM never hard-deletes, but this is outside CRM control — flag; mitigated by Option B.
9. **RLS read posture (P5-D7).** Recommended: keep staff-read (additive); tightening to
   `companies.read`-gated modifies a live policy and matters mainly for the future external portal.
10. **Archive cascade (P5-Q2).** Should archiving a company auto-archive its contacts? Recommended:
    **no** (archive separately) in P5; revisit.
11. **Future reconciliation** of `leads`/`customers` into companies/contacts — planning only;
    real job + dedupe rules are a later phase.
12. **CRM overreach.** Keep P5 strictly to companies + contacts; resist adding deals/projects/owners-
    as-teams now.

---

## 22. Final readiness checklist

- **P5 spec ready:** **Yes** — grounded in the live schema + repo + Master Plan Parts IV/V/VI.
- **Blockers:** none technical. One **product decision** gates the build: P5-D1 (reuse vs new
  tables) and the closely-related P5-Q3 (how the CRM list relates to imported prospects).
- **Decisions needed before build:**
  - **P5-D1** reuse `companies`/`company_contacts` (recommended) **or** new `crm_companies`/
    `crm_contacts`.
  - **P5-Q3** CRM company list vs prospects: show-all-with-filters (recommended) / separate
    Prospects view / (implied by Option B).
  - **P5-D2/D3** one-to-many + company required (recommended) — confirm.
  - **P5-D4/D5** non-unique name + email (recommended) — confirm.
  - **P5-D6** defer VAT/UID + address — confirm.
  - **P5-D7** keep staff-read RLS (recommended) — confirm.
  - **P5-Q1** does `sales` get `*.archive`? (default no) · **P5-Q2** archive cascades to contacts?
    (default no).
- **Exact approval question:**

  > **Approve P5 CRM Core as specified, with: (D1) reuse the live `companies` + extend
  > `company_contacts` additively [or choose new `crm_companies`/`crm_contacts`]; (Q3) one CRM
  > Companies list over all companies with `source`/status filters [or a separate Prospects view];
  > (D2/D3) one-to-many, `company_id` required; (D4/D5) company name + contact email non-unique;
  > (D6) defer VAT/UID + address; (D7) keep staff-read RLS, gate writes via permissioned server
  > actions; (Q1) `sales` = CRUD without archive; (Q2) archive does not cascade to contacts. Next
  > migration `0022`, additive only. Do you approve, and do you accept these defaults or change any?**

*Do not build. Do not create migrations. This document is the P5 CRM Core specification only.*
