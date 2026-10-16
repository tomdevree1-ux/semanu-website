# PORTAL P6 — PROJECTS CORE — TECHNICAL SPECIFICATION

Status: **SPEC ONLY — do not build, do not create migrations.** Awaiting approval.
Authoritative sources: `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI; the **live** Supabase schema
(`bkwwlmflsbhrsfwydbnv`) and current repo, which override theoretical names/assumptions (Part VI
§VI.1 rule 4). Written after inspecting both. Builds on the P5 CRM Core (approved + patched).

---

## 1. P6 objective

P6 introduces **Projects Core only** — the `projects` entity, its CRM lifecycle status, its links to
a company (and optionally a contact), an internal owner, list/detail UI, create/edit/archive/restore
flows, audit/history, permissions, tests and docs. Projects are **Ring D** (Master Plan §3) and act
as the bridge from the CRM (companies/contacts) toward later ERP modules (products, finance,
documents, NDAs). P6 deliberately stops at the project foundation: no tasks, time-tracking, Gantt,
billing, products, finance, documents, or external portal.

---

## 2. Current-state dependency check (inspected; what exists live)

- **No project table exists.** Live inspection: zero tables matching `%project%`, and **no
  `project_id` column anywhere** in `public`. So P6 is **greenfield** — it creates a brand-new
  `projects` table (unlike P5, which reused the pre-existing `companies`/`company_contacts`).
- **P5 CRM Core (live + approved):** `companies` (CRM master, `crm_status` + `archived_at/by` +
  `owner_id`, RLS `companies_select USING true`) and `company_contacts` (`contact_status`,
  `is_primary`, provenance). `company_contacts.company_id NOT NULL → companies(id) ON DELETE
  CASCADE`. Manual companies are pinned to `lead_status='waiting_for_review'` (P5 audit #1 fix).
- **RBAC (live):** roles `admin(1)/analyst(2)/sales(3)/reviewer(4)/read_only(5)`; `permissions`
  (id uuid, key, **module NOT NULL**, **label NOT NULL**) — **19 rows** across modules
  `audit, companies, contacts, org, users`. **No `projects` permissions yet.** Predicates
  `has_permission(text)`, `is_admin()`, `is_staff()`, `is_platform_super_admin()`, `current_org()`.
- **Audit (live):** append-only `audit_logs` with `action`, `entity_type`, `entity_id`,
  `old_status`/`new_status`, technical `old_values`/`new_values`, `parent_entity_type/_id`,
  `visible_to_*`. Writer `log_event()` RPC → `src/lib/audit/log.ts` `logEvent`. Reader
  `audit_history()` RPC → `src/lib/audit/queries.ts` `getHistory`. Display map
  `src/lib/audit/display.ts`. `HistoryTimeline` already anticipates `entityType="project"`.
- **Status framework (live):** `src/lib/status/types.ts` (`StatusMachine`, `Transition`,
  `canTransition`), `src/lib/status/colors.ts` (tokens + `companyStatusToken`/`contactStatusToken`).
  P5 added the first real machines (`companyStatusMachine`, `contactStatusMachine`).
- **Reusable UI (P3.5/P5):** `StatusBadge` (entity-keyed token map), `EditableBlock`,
  `ConfirmDialog` (type-to-confirm), `rowLink` (stretched-link clickable rows),
  `HistoryButton`/`HistoryDrawer`/`HistoryTimeline`, list-page filter/search/pagination pattern,
  detail-page `*DetailActions` pattern. Module template `src/modules/{companies,contacts,users}/*`.
- **Routing:** portal pages under `src/app/(portal)/app/(protected)/…` (served at `/app/…`, no
  locale prefix). Helpers `requirePermission`, `hasPermission`. Writes use the service-role admin
  client inside `'use server'` actions.
- **Migrations:** latest is `0022_crm_companies_contacts`. **Next number = `0023`.**
- **`/[locale]/admin`:** untouched and stays untouched.

---

## 3. Scope boundaries

**In scope (P6):** the `projects` table; project status machine; project→company link (required)
and project→contact link (optional); internal `owner_id`; list/detail/create/edit/archive/restore
UI; audit/history; `projects.*` permissions + grants; a **related-projects section on the company
detail page**; tests + docs/runbook.

**Out of scope (not built in P6):** products · finance/invoices · quotes · payments · NDA/documents
(planning-only note allowed) · external client portal · full ERP · notification center ·
impersonation · MFA · role editor UI · org settings UI · migrating leads/orders/customers · removing
old `/admin` · business-table rewrite · hard deletes · project billing automation · file/document
upload workflow · **tasks/subtasks, time tracking, Gantt/timeline, dependencies, project_members**.

**Deferred to later phases:** `project_activities` (timeline/notes) · `project_members` (multi-
assignee) · `priority` (decision P6-D5) · `organization_id` (single-org; P6-D6) · contact-detail
related-projects (P6-Q2) · orders/subscriptions → projects reconciliation (§15) · tightening read
RLS retroactively on companies/contacts.

---

## 4. Data model proposal

### Decision P6-D1 — new `projects` table (greenfield)

No project-like table exists, so P6 **creates** `public.projects` (no reuse/overlap with
orders/subscriptions/customers/old documents/old requests). This is cleaner than P5: rollback can
simply `DROP TABLE projects`.

### `projects` columns

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK default gen_random_uuid()` | |
| `created_at` | `timestamptz NOT NULL default now()` | |
| `updated_at` | `timestamptz NOT NULL default now()` | + `touch_updated_at` trigger |
| `name` | `text NOT NULL` | project title (min 1, max 200; no `<`/`>`) |
| `description` | `text NULL` | |
| `company_id` | `uuid NOT NULL → companies(id) ON DELETE RESTRICT` | **required** (P6-D2) |
| `primary_contact_id` | `uuid NULL → company_contacts(id) ON DELETE SET NULL` | optional (P6-D3); must belong to the project's company (enforced in the action) |
| `owner_id` | `uuid NULL → profiles(id) ON DELETE SET NULL` | internal assignee (P6-D7) |
| `status` | `text NOT NULL default 'draft'` | CHECK = `draft, active, on_hold, completed, cancelled, archived` |
| `start_date` | `date NULL` | optional, display/edit only (P6-D5) |
| `due_date` | `date NULL` | optional, display/edit only (P6-D5) |
| `archived_at` | `timestamptz NULL` | |
| `archived_by` | `uuid NULL → profiles(id) ON DELETE SET NULL` | |
| `created_by` | `uuid NULL → profiles(id) ON DELETE SET NULL` | |
| `updated_by` | `uuid NULL → profiles(id) ON DELETE SET NULL` | |

(No `priority`, no `organization_id`, no `project_members` in P6 — see decisions below.)

### Justified decisions

- **P6-D2 — project requires a company (`company_id NOT NULL`).** Ring D rows "usually carry
  `company_id`" (Master Plan §3); a project is delivery work for a client company. Mirrors P5-D3
  (contacts require a company). `ON DELETE RESTRICT` so a company with projects cannot be hard-
  deleted (the CRM never hard-deletes anyway). Internal/company-less projects are deferred.
- **P6-D3 — optional `primary_contact_id`.** A project may name one client-side contact. Nullable
  FK to `company_contacts`; the action enforces that the chosen contact belongs to the project's
  `company_id`. `ON DELETE SET NULL` so deleting/anonymising a contact never orphans the project.
- **P6-D4 — project `name` is NOT unique.** Same rationale as companies (P5-D4): duplicates happen;
  add a plain index on `name` for search, not a unique constraint.
- **P6-D5 — include optional dates (`start_date`, `due_date`); defer `priority`.** Dates are core to
  a project's identity and are display/edit-only here (no overdue logic, reminders, or automation —
  that would be PM software). `priority` is more PM-ish and is deferred (one-line additive later).
  *(Alternative offered: defer dates too for an even thinner core.)*
- **P6-D6 — defer `organization_id`.** The live `companies`/`contacts` have none (single-org); P6
  stays consistent. Add when multi-org becomes real.
- **P6-D7 — `owner_id` only; no `project_members` table.** One internal assignee in P6. Multi-member
  assignment + roles is deferred to `project_members`.
- **P6-D9 — `company_id` is set at create and not editable in P6** (mirrors P5 contacts); `owner_id`,
  `primary_contact_id`, `name`, `description`, dates are editable. Status/archive have dedicated
  actions.

---

## 5. Project status model

`status` values → shared token (Part V §V1, line 1952), class, permission, confirm:

| Value | Token | Class | Permission to set | Confirm |
|---|---|---|---|---|
| `draft` | `draft` | entry, R | `projects.update` | no |
| `active` | `done` | R | `projects.update` | no |
| `on_hold` | `waiting` | R | `projects.update` | no |
| `completed` | `done` | near-terminal (reopenable) | `projects.update` | no |
| `cancelled` | `cancelled` | near-terminal (reopenable) | `projects.update` | **yes** |
| `archived` | `cancelled` | near-terminal, restorable | `projects.archive` | **yes (type-to-confirm)** |

**Allowed transitions** (declared in `projectStatusMachine`, validated server-side):
`draft↔active`, `active↔on_hold`, `on_hold→active`, `active→completed`, `on_hold→completed`,
`completed→active` (reopen), `{draft,active,on_hold}→cancelled`, `cancelled→draft` (reopen).
`{any non-archived}→archived` and `archived→draft` are handled by the dedicated **archive/restore**
actions, **not** by `changeProjectStatus`. `cancelled` requires a light confirm; `archived` requires
server-enforced type-to-confirm. No side effects (no email) in P6.

**Audit:** status moves emit `project.status_changed` (`old_status`/`new_status`); archive/restore
emit `project.archived`/`project.restored` (see §12).

---

## 6. Permissions model

New permissions (seeded with `module='projects'` + `label`): `projects.read`, `projects.create`,
`projects.update`, `projects.archive` (archive, not delete — per the P4/P5 no-hard-delete pattern).

**Initial `role_permissions` grants (proposed, mirroring P5):**

| Role | read | create | update | archive |
|---|---|---|---|---|
| `admin` (1) | ✓ | ✓ | ✓ | ✓ |
| `sales` (3) | ✓ | ✓ | ✓ | ✗ |
| `analyst` (2) | ✓ | ✗ | ✗ | ✗ |
| `reviewer` (4) | ✓ | ✗ | ✗ | ✗ |
| `read_only` (5) | ✓ | ✗ | ✗ | ✗ |

No role editor UI — grants are migration seeds. **Open question P6-Q1:** should `analyst` also get
`projects.create/update` (analysts often run delivery)? Default: **no** (read-only); easy to add.

---

## 7. RLS / security model

- **Reads (decision P6-D8):** because `projects` is a **new** table, P6 creates a **permission-gated**
  SELECT policy: `projects_select` `authenticated USING (has_permission('projects.read') OR
  is_platform_super_admin())`. This is stricter than P5's staff-wide `companies_select USING true`,
  costs nothing today (every role holds `projects.read`), and sets the cleaner precedent that
  companies/contacts can later adopt. (Server queries use the service-role client and bypass RLS
  anyway; the policy hardens direct PostgREST access.) *Alternative: match P5 `USING true`.*
- **Writes:** **no client writes.** All create/update/status/archive/restore go through permission-
  gated `'use server'` actions using the service-role admin client; **no INSERT/UPDATE/DELETE RLS
  policies** are added (writes are service-role only).
- **Archived rows hidden by default** at the query layer (`archived_at is null` unless "Show
  archived"). Not an RLS concern.
- **Service-role / super-admin:** service role bypasses RLS (actions); `is_platform_super_admin()`
  retains read via the predicate.
- **Audit technical fields stay gated** (`audit.read_technical`); History reads the display-safe
  `audit_history()` RPC. No raw third-party PII in ordinary metadata (see §12).
- **No service-role client in any client component** (enforced by test).

---

## 8. Migration plan

**Next number: `0023_projects.sql`** (additive; `-- ROLLBACK:` notes; never edit an applied
migration — Part IV L2). Apply live via MCP, mirror to `supabase/migrations/`, regenerate
`src/lib/types/database.ts`.

Contents:
1. `create table public.projects (...)` — all columns from §4, with `status` CHECK
   (`draft|active|on_hold|completed|cancelled|archived`), FKs (`company_id → companies ON DELETE
   RESTRICT`, `primary_contact_id → company_contacts ON DELETE SET NULL`, `owner_id`/`archived_by`/
   `created_by`/`updated_by → profiles ON DELETE SET NULL`).
2. **Trigger:** `before update … execute function public.touch_updated_at()` (reuse existing fn).
3. **Indexes:** `projects(company_id)`, `projects(primary_contact_id)`, `projects(owner_id)`,
   `projects(status) WHERE archived_at is null`, `projects(name)`, `projects(due_date) WHERE
   archived_at is null` (cheap, for sort/filter).
4. **RLS:** `alter table public.projects enable row level security;` + the `projects_select` policy
   (§7). No write policies.
5. **Permissions seed:** `insert into permissions(key, module, label) values …` for the 4 keys,
   `on conflict (key) do nothing`.
6. **role_permissions seed:** the §6 matrix via `not exists` (idempotent).
7. **No changes to business tables** (`leads`/`customers`/`orders`/`subscriptions`/old
   `documents`/`requests`) or to `companies`/`company_contacts` schema.
8. `-- ROLLBACK:` `drop table public.projects;` + delete the seeded `permissions`/`role_permissions`
   rows. (Greenfield → clean drop, unlike P5's column-only additions.)

---

## 9. Server actions and queries

New module `src/modules/projects/` mirroring P5 (`schema.ts` zod, `types.ts`, `status.ts` machine,
`queries.ts`, `actions.ts`, `guards.ts`). All actions are `'use server'`, service-role, and follow:
**zod validate → `requirePermission` → (status: `canTransition`) → existence/relationship checks →
DB write → `logEvent` → `revalidatePath`**, returning typed safe errors (never throw to client).

**`queries.ts`:**
- `listProjects({ q?, status?, companyId?, ownerId?, showArchived?, page? })` → rows + count;
  filters `archived_at is null` unless `showArchived`; `q` over `name`/`description`; joins resolve
  company name + owner name + contact name (separate lookups, like P5 — not PostgREST embeds).
- `getProject(id)` → project + company (name/archived) + primary contact (name) + owner name.
- `listProjectsForCompany(companyId, { showArchived? })` → for the company-detail related section.
- `listProjectOwnerOptions()` (active profiles) + reuse P5 `listCompanyOptions` and a per-company
  contact lookup for the pickers.

**`actions.ts`:**
- `createProject(input)` — perm `projects.create`; zod; company must exist + be **non-archived**;
  if `primary_contact_id` set it must belong to that company + be non-archived; insert
  (`status='draft'`, `created_by`/`updated_by=actor`); audit `project.created` (metadata
  `{ company_id }`); redirect to the detail page.
- `updateProject(id, patch)` — perm `projects.update`; zod; update name/description/primary_contact_id/
  owner_id/start_date/due_date (NOT company_id); `updated_by=actor`; audit `project.updated`
  (metadata = changed field NAMES + `company_id`; before/after only in technical `old/new_values`).
- `changeProjectStatus(id, to)` — perm `projects.update`; `canTransition(projectStatusMachine,…)`;
  confirm required for `cancelled`; reject if archived; audit `project.status_changed`.
- `archiveProject(id, confirmText)` — perm `projects.archive`; type-to-confirm project name; set
  `status='archived'`, `archived_at/by`; audit `project.archived` (severity `warning`).
- `restoreProject(id)` — perm `projects.archive`; `archived → draft`; clear `archived_at/by`; audit
  `project.restored`.

**`guards.ts`:** pure predicates — `isLegalProjectTransition(from,to)`, `confirmMatches(typed,
expected)`, `contactBelongsToCompany(contactCompanyId, projectCompanyId)`.

---

## 10. UI / routes

Under `src/app/(portal)/app/(protected)/projects/`:
- `/app/projects` — list. Clickable rows (`rowLink`), `StatusBadge` (`entityType="project"`),
  columns: name, company, status, owner, due date, updated. Filters: status, company (select),
  owner (optional), **"Show archived"**; search box; server-side pagination (25/page); empty state;
  "New project" (gated `projects.create`).
- `/app/projects/new` — create form (company picker required, contact picker filtered to the chosen
  company, owner picker, dates).
- `/app/projects/[id]` — detail (§11).
- **Company detail** (`/app/companies/[id]`) gains a **"Projects" section** (P6-Q2): the company's
  non-archived projects with `StatusBadge` + links, and an "Add project" button (gated
  `projects.create`, pre-fills `companyId`). (Contact-detail related-projects deferred.)
- **Topbar** gains a "Projects" link, rendered only with `projects.read`.

Route protection: each page calls `requirePermission('projects.read' | '.create')`.

---

## 11. Project detail page

Sections on `/app/projects/[id]`:
- **Header** — project name + `StatusBadge` (project status) + **History button**
  (`audit_history('project', id)`).
- **Links** — company name → `/app/companies/[id]`; primary contact (if set) → `/app/contacts/[id]`
  (with an "archived" hint if that contact is archived).
- **Status control** — machine-driven transitions; `cancelled` confirms; gated `projects.update`.
- **Project info** — `EditableBlock`: name, description, primary contact (picker, same company),
  owner (active-user picker), start date, due date. Gated `projects.update`.
- **Danger zone** — Archive (type-to-confirm, `projects.archive`); when archived, page is read-only
  except **Restore**.
- **Metadata** — created/updated, created_by/updated_by, owner, archived_at/by when applicable.

---

## 12. Audit / history

Events (reuse `logEvent` → `audit_logs` → `audit_history()` → `HistoryTimeline`):

| Event | entity_type | severity | old/new status | notes |
|---|---|---|---|---|
| `project.created` | `project` | info | – | display name = project name; metadata `{ company_id }` |
| `project.updated` | `project` | info | – | metadata = changed field names + `company_id` |
| `project.status_changed` | `project` | info | ✓ | from→to |
| `project.archived` | `project` | warning | →`archived` | type-to-confirm |
| `project.restored` | `project` | info | `archived`→`draft` | |

- `entity_type='project'`, `entity_id`=project id; `old_status`/`new_status` on status/archive/restore.
- **Parent company reference:** carried in `metadata.company_id` (the `logEvent` wrapper doesn't
  expose `parent_entity_*`, consistent with P5 contacts).
- **Safe metadata:** changed field **names** + `company_id` only — **no raw PII**. Full before/after
  payloads only in technical `old_values`/`new_values` (gated by `audit.read_technical`).
- **Display:** add labels + colours to `src/lib/audit/display.ts` — `project.created`→"Project
  created"/`done`, `project.updated`→"Project updated"/`system`, `project.status_changed`→"Status
  changed"/`warning`, `project.archived`→"Project archived"/`revoked`, `project.restored`→"Project
  restored"/`done`.

---

## 13. Relationship with companies / contacts

- **Company link required** (P6-D2): every project has a `company_id`.
- **Contact link optional** (P6-D3): `primary_contact_id` nullable; if set, must belong to the
  project's company (action-enforced).
- **Selecting in pickers:** only **non-archived** companies/contacts are selectable for a new
  project or when editing the contact link. The company picker reuses P5 `listCompanyOptions`
  (already non-archived); contacts are filtered to the chosen company + non-archived.
- **Company archived:** you **cannot create** a project under an archived company (action blocks,
  like P5 contacts). Existing projects keep their `company_id`; archiving a company does **not**
  cascade to its projects (consistent with P5-Q2). `ON DELETE RESTRICT` also prevents hard-deleting
  a company that still has projects.
- **Contact archived:** a project whose `primary_contact_id` points to a now-archived contact still
  displays the link (with an "archived" hint); the contact is just not offered in pickers. `ON
  DELETE SET NULL` covers contact anonymise/removal.
- **Related projects on detail pages (P6-Q2):** the **company** detail page shows a Projects section
  (in scope). The **contact** detail page related-projects list is **deferred** (lower value; the
  link is one-directional in P6).

---

## 14. Rate limiting / abuse

**No public endpoints.** All project actions are authenticated, staff-only server actions behind
`requirePermission`. **No new rate limit required.** Bulk/CSV import of projects is **deferred** and,
if added later, must be rate-limited.

---

## 15. Legacy data / old admin (planning only)

- **No migration of `leads`/`orders`/`customers`** in P6. No data movement.
- **Future mapping (documented, not built):** a paid `order`/`subscription` (a sold plan) naturally
  maps to a delivery `project` for that `customer.company_id`; a later reconciliation job could
  create a project per active subscription without schema change. Out of P6 scope; own spec later.
- **Old `/[locale]/admin` untouched.** No business-table rewrite. P6 adds only `/app/projects` (+ the
  company-detail Projects section).

---

## 16. Files likely to create / update

**Migration:** `supabase/migrations/0023_projects.sql`; regenerate `src/lib/types/database.ts`
(add the `projects` table type + a `ProjectStatus` alias); update `supabase/migrations/README.md`.

**Status:** `src/lib/status/colors.ts` (add `projectStatusToken`); `src/modules/projects/status.ts`
(`projectStatusMachine`). `src/components/portal/ui/StatusBadge.tsx` (add `'project'` to
`StatusEntity` + `statusTokenFor`).

**Module:** `src/modules/projects/{schema,types,status,queries,actions,guards}.ts`.

**Audit:** `src/lib/audit/display.ts` (add `project.*` labels + colours).

**Routes:** `src/app/(portal)/app/(protected)/projects/{page,new/page,[id]/page}.tsx`.

**Components:** `src/components/portal/projects/*` (table, form, detail-actions, status control,
pickers). Update `src/components/portal/shell/Topbar.tsx` (nav link) and the **company detail page**
+ a `CompanyProjects` section component.

**Tests:** `src/modules/projects/projects.test.ts`, a status-machine test, an audit-display test, a
`StatusBadge` project test, no-service-role-in-client assertions.

**Docs:** `PORTAL_P6_RUNBOOK.md`; update the Master Plan roadmap **after** build/approval.

---

## 17. Tests

- **Migration / RLS:** `projects` exists with the right columns/CHECK/FKs/indexes/trigger; an
  authenticated session with `projects.read` can SELECT, archived hidden at the query layer; service-
  role writes succeed; no client write path.
- **Permission matrix:** `sales` can create/update, not archive; only `admin` archives;
  analyst/reviewer/read_only read-only; non-permitted blocked from routes/actions.
- **Action tests:** create/update/status/archive/restore happy paths + permission-denied + not-found;
  type-to-confirm rejects a wrong string server-side; contact-not-in-company rejected; create under
  archived company rejected.
- **Status-transition tests:** every legal transition passes `canTransition`; illegal rejected;
  `cancelled` flagged confirm; archive/restore are not machine transitions.
- **Audit tests:** correct `action` + `old_status`/`new_status` + no raw PII in metadata + parent
  `company_id` present.
- **UI/component tests:** clickable rows, `StatusBadge` project mapping, `EditableBlock`, archived
  filter, company-detail Projects section renders.
- **Build/type:** `npx tsc --noEmit` clean; `next build` clean (macOS).
- **No-service-role-in-client:** static check over the new client components.
- **Regression:** full P1/P2/P3/P3.5/P4/P5 suite green (currently 103 tests); `/api/leads`,
  `/api/checkout`, old `/[locale]/admin`, marketing unaffected.

---

## 18. Manual smoke checklist

1. Create a project linked to a company (+ optional contact) → appears in `/app/projects` as `Draft`.
2. Edit via `EditableBlock` (name/description/contact/owner/dates) → persists; History shows
   `Project updated`.
3. Change status `draft → active → on_hold → active → completed`; try an illegal jump → blocked;
   `cancelled` prompts confirm.
4. Archive (type the project name) → leaves the default list → "Show archived" reveals it →
   read-only except Restore → Restore returns it as `Draft`.
5. Company detail shows the project under its Projects section; "Add project" pre-fills the company.
6. Company/contact links on the project navigate correctly; archived contact shows the hint.
7. Filters (status/company/owner/archived) + search + pagination work.
8. Permission checks: `sales` can create/update but has no Archive button; `read_only` sees lists
   read-only; the Projects nav link is hidden without `projects.read`.
9. History timeline renders project events; technical fields only for `audit.read_technical`.
10. `/app/companies`, `/app/contacts`, `/app/users`, old `/admin`, and the marketing site are
    unaffected.

---

## 19. Rollback plan

- **Code:** revert the P6 commit; the projects module/routes/components and the Topbar link are
  self-contained; the company-detail Projects section is an additive block that reverts with it.
- **Migration (greenfield):** `DROP TABLE public.projects;` + delete the seeded `permissions`/
  `role_permissions` rows (documented down path). No other table touched. Per Part IV L2, never edit
  the applied migration — add a corrective one if needed.
- **Disable without rollback:** hide the Projects nav + gate routes behind a flag (e.g.
  `PROJECTS_ENABLED`); the routes already require `projects.read`, so removing grants also hides it.
- **Data:** P6 never hard-deletes; archive is reversible. Dropping the table is the only destructive
  step and only relevant during rollback (no other table references `projects`).
- **Old `/admin` fallback:** unchanged throughout.

---

## 20. Risks and open questions

1. **Company-required (P6-D2)** — recommended yes (`company_id NOT NULL`). Company-less/internal
   projects deferred.
2. **`primary_contact_id` now (P6-D3)** — recommended yes, optional, same-company enforced.
3. **Priority / dates (P6-D5)** — recommended: include optional dates (display/edit only), defer
   priority. Could defer dates too for a thinner core. **Decision needed.**
4. **Read RLS (P6-D8)** — recommended permission-gated for the new table (stricter than P5);
   alternative is to match P5's staff-wide `USING true`. **Decision needed.**
5. **Related projects on company/contact pages (P6-Q2)** — recommended: company detail yes, contact
   detail deferred.
6. **Analyst create/update (P6-Q1)** — default no; confirm.
7. **Status simplicity** — six states only; resist tasks/time/Gantt/dependencies (ERP overreach).
8. **Future orders/subscriptions → projects** mapping — planning only; real job is a later phase.
9. **`ON DELETE RESTRICT` on company_id** — prevents hard-deleting a company with projects; harmless
   given the CRM never hard-deletes, but noted.

---

## 21. Final readiness checklist

- **P6 spec ready:** **Yes** — greenfield `projects`, grounded in the live schema + repo + Master
  Plan Parts IV/V/VI; reuses the P5 patterns end-to-end.
- **Blockers:** none. P5 is approved + patched (audit #1 closed), so P6 is unblocked.
- **Decisions needed before build:** P6-D5 (dates vs defer; priority defer), P6-D8 (permission-gated
  vs staff-wide read RLS), P6-Q1 (analyst create/update?), P6-Q2 (company-detail Projects section in
  scope; contact-detail deferred). Plus confirm defaults: P6-D2 company required, P6-D3 optional
  same-company contact, P6-D4 non-unique name, P6-D6 defer organization_id, P6-D7 owner_id only,
  P6-D9 company fixed after create.
- **Exact approval question:**

  > **Approve P6 Projects Core as specified, with: a new `projects` table (next migration `0023`,
  > additive); company **required**, optional same-company contact, single `owner_id`, non-unique
  > name; status `draft/active/on_hold/completed/cancelled/archived` (cancelled confirms, archive =
  > type-to-confirm); permissions `projects.read/create/update/archive` granted admin=all,
  > sales=read/create/update, others read-only; **permission-gated read RLS** for the new table;
  > include optional `start_date`/`due_date` (display only) and **defer `priority`**; add a
  > **Projects section on the company detail page** (defer contact-detail); defer
  > `organization_id`/`project_members`/`project_activities`. Do you approve, and do you accept these
  > defaults or change P6-D5 (dates), P6-D8 (read RLS), P6-Q1 (analyst), or P6-Q2 (related-projects)?**

*Do not build. Do not create migrations. This document is the P6 Projects Core specification only.*
