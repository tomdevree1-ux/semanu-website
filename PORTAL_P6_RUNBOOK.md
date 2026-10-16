# PORTAL P6 — PROJECTS CORE — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0023` applied live (greenfield, additive). Scope:
projects only (+ a Projects section on the company detail page). Authority: `PORTAL_P6_SPEC.md` +
`AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI. Builds on P5 CRM Core.

## What shipped

- **Migration `0023_projects.sql`** (applied live) — creates `public.projects` (Ring D), RLS +
  permission-gated select policy, `projects.*` permissions + role grants. No business-table changes.
- **Module** `src/modules/projects/*` (schema, types, status machine, queries, actions, guards).
- **Status machine** `projectStatusMachine` (draft/active/on_hold/completed/cancelled/archived).
- **Routes** `/app/projects`, `/app/projects/new`, `/app/projects/[id]`; Topbar "Projects" nav
  (gated); a **Projects section on `/app/companies/[id]`** with "Add project" (prefills the company).
- **Audit** `project.*` events (labels/colours in `src/lib/audit/display.ts`).

## Schema (migration 0023)

`public.projects`: `id`, `created_at`, `updated_at` (+`touch_updated_at` trigger), `name NOT NULL`,
`description`, `company_id NOT NULL → companies(id) ON DELETE RESTRICT`, `primary_contact_id →
company_contacts(id) ON DELETE SET NULL`, `owner_id → profiles ON DELETE SET NULL`, `status NOT NULL
default 'draft'` (CHECK `draft|active|on_hold|completed|cancelled|archived`), `start_date date`,
`due_date date`, `archived_at`, `archived_by`, `created_by`, `updated_by`. Indexes: `company_id`,
`primary_contact_id`, `owner_id`, `status` (partial non-archived), `name`, `due_date` (partial).
RLS on; `projects_select` = `authenticated USING (has_permission('projects.read') OR
is_platform_super_admin())`; **no write policies** (service-role writes via actions).

**Untouched:** companies/company_contacts schema, leads, customers, orders, subscriptions, old
documents/requests, old `/[locale]/admin`.

## Permission matrix (seeded by 0023)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `projects.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `projects.create` | ✓ | ✓ | — | — | — |
| `projects.update` | ✓ | ✓ | — | — | — |
| `projects.archive` | ✓ | — | — | — | — |

(Analyst stays read-only — decision P6-Q1. No role editor UI.)

## Status model

`draft`(draft) · `active`(done) · `on_hold`(waiting) · `completed`(done) · `cancelled`(cancelled) ·
`archived`(cancelled). Transitions (server-validated via `canTransition`): draft↔active, active↔on_hold,
active/on_hold→completed, completed→active (reopen), draft/active/on_hold→cancelled, cancelled→draft
(reopen). `cancelled` needs a confirm; `archived` is reached only via the dedicated archive action
(type-to-confirm); restore returns to `draft`.

## Relationships

Company **required** (`company_id NOT NULL`, `ON DELETE RESTRICT`). Primary contact **optional** and
must belong to the project's company (action-enforced); `ON DELETE SET NULL`. You cannot create a
project under an archived company; archived contacts aren't offered in pickers but a previously-linked
archived contact stays visible (and editable-selectable). Archiving a company does **not** cascade to
its projects. The company detail page lists its non-archived projects (P6-Q2); contact-detail
related-projects is deferred.

## Security

No client writes — all create/update/status/archive/restore go through permission-gated `'use
server'` actions (service role). Reads are permission-gated at both the route (`requirePermission`)
and the RLS policy. Archived rows hidden by default at the query layer. Audit: `old_status`/
`new_status` on status/archive/restore; ordinary metadata = changed field NAMES + `company_id` only
(no raw PII); full before/after only in technical `old_values`/`new_values` (gated by
`audit.read_technical`). No hard deletes. No new SECURITY DEFINER functions, no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 120 tests pass (incl. projects 12 + p6_projects 5)
npm run build             # compiles + type-checks (run on macOS; sandbox caps static gen)
```

## Manual smoke checklist

As admin: create a project linked to a company (optionally a contact) → appears in `/app/projects` as
`Draft` and on the company's Projects section → edit info → change status `draft → active → on_hold →
active → completed` (try an illegal jump = blocked; `cancelled` prompts confirm) → archive (type the
name) → "Show archived" reveals it → restore → company/contact links navigate. As `sales`: create/
update but no Archive button. As `read_only`: lists read-only, Projects nav hidden without
`projects.read`. Confirm `/app/companies`, `/app/contacts`, `/app/users`, `/app/profile`, old
`/admin`, `/api/leads`, `/api/checkout`, and the marketing site are unaffected.

## Rollback

- **Code:** revert the P6 commit; the projects module/routes/components, the Topbar link, and the
  company-detail Projects section revert with it. No existing module behaviour changed.
- **Migration (greenfield):** `DROP TABLE public.projects;` + delete the seeded `permissions`/
  `role_permissions` rows (see the `-- ROLLBACK:` lines in `0023_projects.sql`). Clean drop — no other
  table references `projects`. Never edit the applied migration; add a corrective one if needed.
- **Disable without rollback:** hide the Projects nav + gate routes behind a flag (e.g.
  `PROJECTS_ENABLED`); removing grants also hides it.
- **Data:** never hard-deletes; archive reversible.

## Notes / follow-ups

- **Future orders/subscriptions → projects (planning only):** a paid `order`/`subscription` maps to a
  delivery `project` for `customer.company_id`; a later reconciliation job could create a project per
  active subscription without schema change. Not built in P6.
- **Old `/[locale]/admin` remains untouched.**
- **Deferred:** products, finance/invoices, NDA/documents, tasks/subtasks, time tracking,
  Gantt/dependencies, `project_members`, `project_activities`, `priority`, `organization_id`,
  contact-detail related-projects.
- **Numbering:** continues cleanly from `0022`; next migration is `0024`. The historical `0018/0019`
  note in `supabase/migrations/README.md` stands — do not rename applied migrations.
```
