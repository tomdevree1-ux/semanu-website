# PORTAL P5 — CRM CORE (COMPANIES + CONTACTS) — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0022` is applied live (additive). Scope: companies +
contacts only. Authority: `PORTAL_P5_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI.

## What shipped

- **Migration `0022_crm_companies_contacts.sql`** (applied live, additive). Extends the existing
  `companies` (prospecting master) with a CRM lifecycle layer and promotes `company_contacts` to
  the first-class contact entity. The prospecting `lead_status` and pipeline tables are untouched.
- **Modules** `src/modules/companies/*` and `src/modules/contacts/*` (schema, types, status machine,
  queries, actions, guards).
- **Status machines** `companyStatusMachine` + `contactStatusMachine` (first real domain machines).
- **Routes** `/app/companies`, `/app/companies/new`, `/app/companies/[id]`, `/app/contacts`,
  `/app/contacts/new`, `/app/contacts/[id]`; Topbar nav (permission-gated).
- **Audit** company.* + contact.* events (labels/colours in `src/lib/audit/display.ts`).

## Schema (migration 0022)

`companies` (added, additive): `crm_status text not null default 'lead'` (CHECK
`lead|qualified|active|dormant|lost|blocked|archived`), `owner_id uuid → profiles`,
`archived_at timestamptz`, `archived_by uuid → profiles`. Indexes: `crm_status` (partial, non-archived),
`company_name`, `lower(domain)`.

`company_contacts` (added, additive): `contact_status text not null default 'lead'` (CHECK
`lead|qualified|active|dormant|blocked|archived`), `updated_at` (+`touch_updated_at` trigger),
`is_primary boolean`, `archived_at`, `archived_by`, `created_by`, `updated_by`. Indexes: `company_id`,
`contact_status` (partial), `lower(email)`.

**Untouched:** `lead_status` and all prospecting columns/tables, `customers`, `leads`, `orders`,
`subscriptions`, old `documents`/`requests`, old `/[locale]/admin`.

## Permission matrix (seeded by 0022)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `companies.read` / `contacts.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `companies.create` / `contacts.create` | ✓ | ✓ | — | — | — |
| `companies.update` / `contacts.update` | ✓ | ✓ | — | — | — |
| `companies.archive` / `contacts.archive` | ✓ | — | — | — | — |

(Decision P5-Q1: `sales` has no archive. No role editor UI — grants are migration seeds.)

## Status models

Company: `lead`(draft) · `qualified`(waiting) · `active`(done) · `dormant`(system) · `lost`(cancelled)
· `blocked`(revoked) · `archived`(cancelled). Contact: same minus `lost`. `blocked` needs a confirm;
`archived` is reached only via the dedicated archive action (type-to-confirm); restore returns to
`lead`. Transitions are validated server-side against the machine (`changeCompanyStatus` /
`changeContactStatus`); archive/restore are separate permissioned actions.

## Security model

- **Reads:** the existing `companies_select` / `company_contacts_select` RLS (`authenticated USING
  true`) is kept (decision P5-D7). Read access to the CRM is gated at the route + nav level via
  `requirePermission('companies.read' | 'contacts.read')`. Default lists hide archived rows at the
  query layer (`archived_at is null`); a "Show archived" filter reveals them.
- **Writes:** no client writes. All create/update/status/archive/restore go through permission-gated
  server actions using the service-role client, then `logEvent`. No new write RLS policies added.
- **Audit:** events carry `old_status`/`new_status` on status/archive/restore. Ordinary metadata
  holds only changed field NAMES (+ `company_id` for contacts) — no raw third-party PII. Full
  before/after payloads go to `old_values`/`new_values` (technical-only, `audit.read_technical`).
- **No hard deletes.** Archiving a company does **not** auto-archive its contacts (decision P5-Q2).

## Verification (run after pulling)

```bash
npx tsc --noEmit          # clean
npx vitest run            # 101 tests pass (incl. companies/contacts/p5_crm)
npm run build             # compiles + type-checks (run on macOS; sandbox caps static gen)
```

## Manual smoke checklist

As an admin: create a company → edit info → change status (lead→qualified→active; try an illegal
jump = blocked) → archive (type the company name) → "Show archived" reveals it → restore → contacts
section "Add contact" → create contact → edit → change status → archive (type the name) → restore →
open the History clock on both (events shown; technical fields only for `audit.read_technical`) →
filters/search/pagination on both lists. As a `sales` user: can create/update but no Archive button.
As `read_only`: lists are read-only (no New/Edit/Archive). Confirm old `/[locale]/admin` and the
marketing site still work; `/api/leads` + `/api/checkout` unaffected.

## Rollback

- **Code:** revert the P5 commit; routes/modules/components are self-contained, the Topbar links go
  with them. No existing module changed behaviour.
- **Migration (additive):** inert without the code. Down path (see the `-- ROLLBACK:` lines in
  `supabase/migrations/0022_crm_companies_contacts.sql`): drop the added columns/constraints/indexes
  and the seeded `permissions` / `role_permissions` rows. Never edit the applied migration — add a
  corrective one if needed (Part IV L2).
- **Disable without rollback:** hide the Companies/Contacts nav (the routes still require the
  permission, so removing grants also hides the feature).
- **Data:** P5 never hard-deletes; archive is reversible.

## Notes / follow-ups

- **Prospects and CRM companies share the `companies` table (Option A).** The CRM Companies list
  spans all companies, with `source` / `crm_status` / `lead_status` filters (decision P5-Q3). A saved
  "Prospects" view may be added later — not required in P5.
- **Future reconciliation (planning only):** a marketing `lead` or a `customer` maps to a `company`
  (by domain/email) plus contacts; `customers.company_id` already links paying customers to a
  company, so a later backfill can populate `crm_status`/contacts without schema change. Names/emails
  are intentionally non-unique so reconciliation can dedupe deliberately. Not built in P5.
- **Deferred:** VAT/UID + structured address (P5-D6); company↔contact many-to-many (P5-D2);
  standalone contacts (P5-D3); contact GDPR anonymize; tightened read RLS (P5-D7).
- **Advisors:** P5 introduced no new security-advisor findings (no new SECURITY DEFINER functions, no
  policy-less new tables). The pre-existing RBAC-predicate and service-role-table notices are
  unchanged and accepted (the predicates must stay `authenticated`-executable for RLS).
- **Numbering:** continues cleanly from `0021`; next migration is `0023`. The cosmetic `0018/0019`
  note in `supabase/migrations/README.md` is historical — do not rename applied migrations.
```
