# PORTAL P9 — INVOICES CORE — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI + the live Supabase schema + current repo state (which override theoretical names).
Builds on P5 CRM + P6 Projects + P7 Catalog + P8 Quotes. Pattern parent = **P8 Quotes** (the
near-exact structural twin: parent-child, stored money totals, permission-gated read RLS,
service-role server actions, soft-archive).

---

## 1. P9 objective

P9 introduces an **internal Invoices Core only**: a back-office invoice document (header + line
items) that staff create, edit while draft, issue, and manually mark paid/void — entirely inside
`/app`. It is the financial sibling of P8 Quotes and is designed to be the clean forward hook for a
later payments/Stripe/accounting phase **without building any of it now**. P9 records invoices and
their lifecycle; it does **not** move money, talk to Stripe, reconcile bank/payment data, send
email, render a customer-facing page, or run any automation. "Paid" in P9 is a **manually recorded
internal fact**, not a payment event.

The goal is parity with the approved P5–P8 modules: additive greenfield migration, permission-gated
reads, audited service-role writes, soft-archive (never hard-delete the parent), stored totals with
pure unit-tested math, and the shared UI primitives (clickable rows, StatusBadge, EditableBlock,
ConfirmDialog, HistoryTimeline).

---

## 2. Current-state dependency check (inspected live + repo)

Inspected via the live DB (`bkwwlmflsbhrsfwydbnv`), `list_migrations`, and the repo:

- **No invoice tables exist.** `to_regclass('public.invoices')` and `public.invoice_items` are both
  null; no table matches `~* 'invoice'`. P9 is **greenfield**.
- **Migration numbering.** Latest applied is `0025_quotes` (`20260610213132`). **Next additive
  number is `0026`.** No applied migration will be renamed or edited (Part IV L2).
- **P5–P8 present and stable** (column counts): `companies` 24, `company_contacts` 14, `projects`
  15, `catalog_items` 19, `quotes` 21, `quote_items` 13. These are the relationship targets.
- **Quotes status CHECK** (template): `draft, sent, accepted, declined, expired, archived`.
  **Quotes money columns**: `subtotal, discount_amount, tax_amount, total_amount` (all `numeric(12,2)`).
- **Permission modules in use**: `audit, catalog, companies, contacts, org, projects, quotes, users`.
  `invoices` will be a **new module** (no collision).
- **Roles** (live): `admin, analyst, sales, reviewer, read_only`.
- **Legacy billing tables (NOT touched; future-mapping target only):** `orders`
  (Stripe + `amount_plan_chf`/`amount_addon_chf` integers, status
  `pending/paid/failed/canceled/request_submitted/contacted/done`), `payments`
  (`customer_id, company_id, amount_chf, currency, status, stripe_*`), `customers`
  (`stripe_customer_id, company_id, billing_email, billing_address, …`), `payment_links`,
  `subscriptions`. These remain the **checkout/Stripe** domain and are out of P9 scope.
- **Master Plan authority (Part V §V1, line 1957):** *future finance / invoices* = `draft`(draft),
  `sent`(sent), `paid`(done, terminal), `past_due`(warning), `void`(cancelled, terminal),
  `refunded`(revoked, terminal); "money-moving transitions are `[SEC]` and always confirmed +
  permissioned." Part IV §4 sketches `finance.read/create_invoice/send_invoice` permissions and
  Part IV §15 lists `invoices`/`invoice_events` as Ring-D "prepare, build later" tables.
- **Repo conventions confirmed** (reused verbatim): `src/lib/status/types.ts`
  (`StatusMachine`/`canTransition`), `src/lib/status/colors.ts` token vocabulary
  (`draft, sent, waiting, opened, done, cancelled, revoked, failed, system, warning, critical`),
  `StatusBadge`/`statusTokenFor`, `src/lib/audit/{log,display}.ts`, `requireAuth()` +
  `hasPermission()`, `createAdminClient()` service-role writes, `rowLink`, `EditableBlock`,
  `ConfirmDialog`, `HistoryButton`/`HistoryTimeline`, the P8 `totals.ts` math.
- **No conflict with old `/[locale]/admin`** (separate password-gated legacy area; untouched).
- **No business-table rewrite needed**: invoices are greenfield; all relationships are FKs into
  existing tables; legacy billing tables are read-never in P9.

---

## 3. Scope boundaries

**In scope (P9):**

- `invoices` + `invoice_items` tables (greenfield, additive `0026`).
- Relationships: company (**required**), contact (optional), project (optional), quote (optional),
  catalog item per line (optional), quote item per line (optional, snapshot link).
- Invoice **status model** (draft / issued / paid / overdue / void / archived).
- **Stored money totals** (subtotal, discount, tax, total) + **manual** `amount_paid`/`balance_due`
  + `paid_at` (manual mark-paid, full amount only).
- `invoice_number` generated (`INV-#####`).
- **create-from-quote** (snapshot an existing quote's header + lines into a draft invoice).
- list / detail / create / edit / **archive / restore** UI under `/app/invoices`.
- Audit/history (10 `invoice.*` events), permissions (7 keys), permission-gated read RLS, tests,
  docs + runbook.

**Out of scope (explicit, per the P9 prompt):** online payments; Stripe integration changes;
checkout rewrite; automatic payment reconciliation; bank reconciliation; accounting export; PDF
generation (planning-note only — see §24); e-signature; customer-facing portal; public invoice page;
automated email; tax/VAT **engine** (simple stored totals only); recurring-invoice automation;
subscription-billing automation; customer/order/subscription migration; finance dashboard beyond the
invoice list/detail; NDA/documents module; notification center; impersonation; MFA enforcement; role
editor UI; org settings UI; removal of old `/[locale]/admin`; business-table rewrite; **hard deletes
of invoices**; project-billing automation.

**Deferred to later phases (named, designed-not-built):** a payments phase (Stripe checkout/payment
links, webhooks, `payments` rows, partial payments, refunds → the `refunded` status from §V1);
automated overdue (a scheduled job flipping issued→overdue past `due_date`); invoice PDF render +
public invoice page + emailing; accounting/CSV export; `organization_id` multi-tenancy on all P-tables;
`invoice_events` (if a per-invoice event log beyond the generic `audit_logs` is ever wanted);
company/project/quote **detail-page "Invoices" sections** (P9 ships the reverse link only if cheap —
see §16).

---

## 4. Naming decision

- **Feature name:** **Invoices** (UI label "Invoices"; singular "Invoice").
- **Database tables:** `public.invoices` (parent), `public.invoice_items` (child) — mirrors the
  `quotes`/`quote_items` pattern exactly.
- **Sequence:** `public.invoice_number_seq`; number format **`INV-#####`** (zero-padded 5).
- **Routes:** `/app/invoices`, `/app/invoices/new`, `/app/invoices/[id]` (no locale prefix, under
  `(portal)/app/(protected)`).
- **Audit entity name:** `invoice` (`entity_type = 'invoice'`).
- **Permission module:** `invoices` (keys `invoices.*`).
- **Reconciliation with the Master Plan:** Part IV §4 sketched `finance.create_invoice/send_invoice`,
  but every shipped module (companies/contacts/projects/catalog/quotes) uses **module-keyed**
  permissions matching its table. Per the authority rule ("repo state overrides theoretical
  names"), P9 uses **`invoices.*`**, not `finance.*`. (`invoices.issue` ≈ the plan's `send_invoice`;
  `invoices.create` ≈ `create_invoice`.) Flagged in §25.

---

## 5. Data model proposal

P9 creates **`public.invoices`** + **`public.invoice_items`**.

### `invoices` (parent)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` | timestamptz NOT NULL | `now()` |
| `updated_at` | timestamptz NOT NULL | touch trigger |
| `invoice_number` | text NOT NULL | default `'INV-' || lpad(nextval('invoice_number_seq')::text,5,'0')`; **unique** |
| `title` | text NOT NULL | short label/subject |
| `company_id` | uuid NOT NULL | → `companies(id)` **ON DELETE RESTRICT** (required) |
| `contact_id` | uuid NULL | → `company_contacts(id)` **SET NULL** |
| `project_id` | uuid NULL | → `projects(id)` **SET NULL** |
| `quote_id` | uuid NULL | → `quotes(id)` **SET NULL** (source quote, optional) |
| `status` | text NOT NULL | default `'draft'`; CHECK (see §6) |
| `currency` | text NOT NULL | default `'CHF'`; CHECK `= 'CHF'` |
| `subtotal` | numeric(12,2) NOT NULL | default 0; ≥ 0 |
| `discount_amount` | numeric(12,2) NOT NULL | default 0; ≥ 0 (flat, quote-level) |
| `tax_amount` | numeric(12,2) NOT NULL | default 0; ≥ 0 (stored; 8.1% helper) |
| `total_amount` | numeric(12,2) NOT NULL | default 0; ≥ 0 |
| `amount_paid` | numeric(12,2) NOT NULL | default 0; ≥ 0 (manual) |
| `balance_due` | numeric(12,2) NOT NULL | default 0; ≥ 0 (`total − amount_paid`) |
| `issue_date` | date NULL | set on issue |
| `due_date` | date NULL | optional payment-due date |
| `paid_at` | timestamptz NULL | set on mark-paid |
| `notes` | text NULL | customer-facing note |
| `internal_notes` | text NULL | staff-only |
| `archived_at` | timestamptz NULL | soft-archive |
| `archived_by` | uuid NULL | → `profiles(id)` SET NULL |
| `created_by` | uuid NULL | → `profiles(id)` SET NULL |
| `updated_by` | uuid NULL | → `profiles(id)` SET NULL |

### `invoice_items` (child)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `invoice_id` | uuid NOT NULL | → `invoices(id)` **ON DELETE CASCADE** |
| `quote_item_id` | uuid NULL | → `quote_items(id)` **SET NULL** (provenance when created from quote) |
| `catalog_item_id` | uuid NULL | → `catalog_items(id)` **SET NULL** |
| `position` | integer NOT NULL | default 1; resequenced 1..n |
| `name` | text NOT NULL | snapshot |
| `description` | text NULL | snapshot |
| `quantity` | numeric(12,2) NOT NULL | default 1; CHECK `> 0` |
| `unit_price` | numeric(12,2) NOT NULL | default 0; CHECK `≥ 0` (net/ex-VAT) |
| `billing_interval` | text NULL | CHECK null or `monthly/yearly/one_time` (snapshot) |
| `line_subtotal` | numeric(12,2) NOT NULL | default 0; ≥ 0 |
| `line_total` | numeric(12,2) NOT NULL | default 0; ≥ 0 |
| `created_at` | timestamptz NOT NULL | |
| `updated_at` | timestamptz NOT NULL | touch trigger |

### Decisions & justifications

- **Company required**, contact/project/quote **optional** — matches quotes; an invoice must bill a
  company; contact/project/quote are enrichment.
- **Catalog item optional per line; quote item optional per line** — lines are **snapshot-based**;
  the FK is provenance only and **SET NULL** so deleting/retiring a catalog or quote item never
  rewrites a historical invoice (financial records are immutable).
- **`invoice_number` is generated** (`INV-#####`) via a dedicated sequence + unique index, mirroring
  `quote_number`. Stable, gap-tolerant, human-readable. (Per-year reset like `INV-2026-00001` is a
  noted alternative — see §25; default is the simple global sequence.)
- **Lines copy quote/catalog values at invoice time** (snapshot `name`, `unit_price`,
  `billing_interval`, `description`). An issued invoice never changes because a catalog price later
  changed.
- **Totals are stored** (not computed on read) — same as quotes/orders; recomputed server-side on
  every draft line/discount/tax change via `recalculateInvoiceTotals`. Pure math is unit-tested.
- **`amount_paid` + `balance_due` included now** (stored, simple). They make `paid`/`overdue`
  meaningful and are the clean forward hook. **Payment tracking is manual and all-or-nothing in P9**:
  `mark_paid` sets `amount_paid = total_amount`, `balance_due = 0`, `paid_at = now()`. **No partial
  payments, no `payments` rows, no reconciliation** (that is the deferred payments phase). This is
  "simple stored totals," not a finance engine. *(Alternative: defer both columns and keep only
  `paid_at`+status — see §25; recommended choice is include.)*
- **VAT/tax included now** (`tax_amount` stored + an 8.1% UI helper), same as quotes — a Swiss
  invoice must display VAT. **No tax engine, no per-line tax.**
- **Discounts included now** (`discount_amount`, flat quote-level), same as quotes. **No per-line
  and no percentage discounts.**
- **`invoice_items` are hard-deleted** when editing a **draft** invoice (then positions
  resequenced), exactly like `quote_items`. **The invoice parent is never hard-deleted** (archive
  only). Line edits are allowed **only while `status = 'draft'`** (see §6/§12) — once issued the
  invoice is immutable.
- **`organization_id` deferred** (consistent with P5–P8). Noted for the future multi-tenant retrofit.

---

## 6. Invoice status model

**Statuses (6):** `draft`, `issued`, `paid`, `overdue`, `void`, `archived`.

**StatusBadge token mapping** (reconciled with Master Plan §V1):

| Status | Color token | Rationale |
|---|---|---|
| `draft` | `draft` | §V1 |
| `issued` | `sent` | §V1 maps the "left draft / delivered" step to the `sent` token; we name the **value** `issued` (standard accounting term, disambiguates from quotes' `sent`) but keep the **token** `sent`. |
| `paid` | `done` | §V1 (terminal-ish) |
| `overdue` | `warning` | §V1 calls it `past_due` → `warning`; value named `overdue` (common usage). |
| `void` | `cancelled` | §V1 (terminal) |
| `archived` | `cancelled` | repo convention (P5–P8 archived → cancelled) |

**Allowed transitions** (`invoiceStatusMachine`):

- `draft → issued` — stamps `issue_date`, locks line/money edits. **Permission `invoices.issue`**;
  **confirm** (simple yes/no — issuing is a commitment).
- `issued → paid` — **`invoices.mark_paid`**; **confirm** (money-moving `[SEC]`). Sets `amount_paid`,
  `balance_due=0`, `paid_at`.
- `issued → overdue` — **manual** in P9 (no cron). **`invoices.update`**; no confirm (reversible).
- `issued → void` — **`invoices.void`**; **confirm** (terminal `[SEC]`).
- `overdue → paid` — **`invoices.mark_paid`**; confirm.
- `overdue → void` — **`invoices.void`**; confirm.
- `paid → issued` — **un-mark / correction**, admin-only via **`invoices.mark_paid`**; **confirm**.
  Clears `amount_paid`/`paid_at` (recomputes `balance_due`). *(Default = allowed; see §25 if you
  prefer paid to be hard-terminal.)*

**Terminal / near-terminal:** `void` is **terminal** (no transitions out). `paid` is near-terminal
(only the admin un-mark above). `overdue` is fully reversible (→ paid/void).

**Once issued = immutable money.** After `draft`, `updateInvoice` and all line-item mutations are
**rejected** (status must be `draft`). Issued/paid/overdue/void invoices change **only** via status
transitions (+ `internal_notes`, optionally — see §25). This is stricter than quotes by design
(financial records).

**Archive / restore** are **dedicated actions, not status transitions** (P8 pattern):

- **Archivable only from `draft` or `void`** (financially inert states). Issued/paid/overdue
  invoices are **never** archived — they are live financial records that must stay visible.
- `archiveInvoice` → `status='archived'`, `archived_at/by` set; **type-to-confirm the
  `invoice_number`** (destructive).
- `restoreInvoice` → `status='draft'`, clears `archived_at/by`. *(Caveat: a voided-then-archived
  invoice restores as `draft`; rare admin path. Alternative = store `status_before_archive`; §25.)*

**`overdue` is manual in P9** (admin/sales flips it when `due_date` has passed). Automatic overdue
(a scheduled job) is **deferred**. **`refunded`** (§V1) is **deferred** to the payments phase (it is
money-moving and has no meaning without payment records).

No transition has any email/order/invoice/payment/Stripe/checkout side effect.

---

## 7. Permissions model

**New permissions (7):** `invoices.read`, `invoices.create`, `invoices.update`, `invoices.archive`,
`invoices.issue`, `invoices.mark_paid`, `invoices.void`.

**Role grants (conservative — money-moving is admin-only):**

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `invoices.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `invoices.create` | ✓ | ✓ | — | — | — |
| `invoices.update` | ✓ | ✓ | — | — | — |
| `invoices.issue` | ✓ | ✓ | — | — | — |
| `invoices.mark_paid` | ✓ | — | — | — | — |
| `invoices.void` | ✓ | — | — | — | — |
| `invoices.archive` | ✓ | — | — | — | — |

Rationale: **sales** runs invoices up to and including **issue** (draft → create/edit → issue), but
**mark-paid, void, archive are admin-only** (money-moving + destructive), per the prompt's
conservative guidance and §V1 `[SEC]`. analyst/reviewer/read_only are read-only. **No role-editor
UI** — grants are seeded in the migration only.

`changeInvoiceStatus` enforces the base `invoices.update` **plus** the per-target permission
(`permissionForStatus(to)`), exactly like P8 `changeQuoteStatus`.

---

## 8. RLS / security model

- **Reads: permission-gated RLS on both tables** (identical to P6/P7/P8):
  `create policy invoices_select on public.invoices for select to authenticated using
  (has_permission('invoices.read') or is_platform_super_admin());` and the same for
  `invoice_items`. Verified-style probe expected: permission-less `sub` → 0 rows on both; admin/
  super-admin → visible.
- **No INSERT/UPDATE/DELETE RLS policies.** All writes go through **service-role** `'use server'`
  actions (`createAdminClient()`), which bypass RLS and are gated in code by `requireAuth()` +
  `hasPermission()`.
- **Archived rows hidden by default** in `listInvoices` (`.is('archived_at', null)` unless
  `showArchived`).
- **Platform-super-admin** read via `is_platform_super_admin()` in the policy (consistent).
- **Audit technical fields stay gated**: raw before/after money in `old_values`/`new_values` only,
  visible solely to `audit.read_technical`; ordinary metadata holds **field names + ids/positions**
  only.
- **No client writes; no service-role import in any client component** (asserted by a test, like
  P8). **No public invoice access in P9** (no public route, no anon policy).

---

## 9. Migration plan — `0026_invoices`

Additive, greenfield, mirrors `0025_quotes` structure. Apply live via Supabase MCP `apply_migration`
(name `0026_invoices`), then mirror to `supabase/migrations/0026_invoices.sql`, regenerate
`src/lib/types/database.ts`, add the README entry. **No changes to payments/payment_links/orders/
subscriptions/customers/checkout/Stripe/promo/catalog or any existing table.**

Contents:

1. `create sequence if not exists public.invoice_number_seq;`
2. `create table public.invoices (...)` — columns + CHECKs from §5/§6:
   `invoices_status_check (status in ('draft','issued','paid','overdue','void','archived'))`,
   `currency = 'CHF'`, and `≥ 0` checks on `subtotal, discount_amount, tax_amount, total_amount,
   amount_paid, balance_due`.
3. `create table public.invoice_items (...)` — CHECKs `quantity > 0`, `unit_price ≥ 0`,
   `line_subtotal ≥ 0`, `line_total ≥ 0`, `billing_interval null or in (monthly/yearly/one_time)`.
4. FKs exactly per §5 (company RESTRICT; contact/project/quote SET NULL; archived_by/created_by/
   updated_by → profiles SET NULL; invoice_id CASCADE; quote_item_id/catalog_item_id SET NULL).
5. Reuse `public.touch_updated_at()` triggers on both tables.
6. Indexes: unique `invoices_invoice_number_uidx`; `company_id`, `contact_id`, `project_id`,
   `quote_id`, partial `status` (`where archived_at is null`), `created_at desc`, partial `due_date`
   (`where status in ('issued','overdue')`, supports overdue lookups); `invoice_items (invoice_id,
   position)`, `(catalog_item_id)`, `(quote_item_id)`.
7. `alter table ... enable row level security;` + the two `*_select` permission-gated policies
   (idempotent `if not exists`). **No write policies.**
8. Seed the 7 `invoices.*` permissions (`insert ... (key, module, label) ... on conflict (key) do
   nothing`).
9. Seed role grants (idempotent `not exists`) per §7.
10. `-- ROLLBACK:` comments on every block (drop tables, drop sequence, delete permissions/grants),
    child-first, exactly like `0025`.

Next migration after this is `0027`.

---

## 10. Server actions and queries

Module `src/modules/invoices/` mirrors `src/modules/quotes/`. All actions: `'use server'` → zod
validate → `requireAuth()` + `hasPermission(...)` → status/relationship checks → service-role write →
`logEvent(...)` → `revalidatePath(...)` → typed `{ ok: true } | { error }`. A shared
`requireEditableInvoice(admin, id)` gate returns OK only when the invoice exists, is **non-archived**,
and **`status = 'draft'`** (used by `updateInvoice` and all line mutations).

**Queries (`queries.ts`, `import 'server-only'`, service-role, callers gate with `invoices.read`):**

- `listInvoices(filters)` — search (`invoice_number`/`title` ilike, sanitized), filters by `status`
  (validated), `companyId`, `showArchived` (default hides archived), `range` pagination 25/page,
  `order created_at desc`; resolves company names; returns money + `balance_due` + `due_date` for the
  list. (Optional `overdue` convenience filter.)
- `getInvoice(id)` — invoice + company/contact/project/**quote** names **+ archived hints** for each
  linked entity + position-ordered line items; numeric coercion.
- `listContactOptionsForCompany` / `listProjectOptionsForCompany` — non-archived, same-company
  (reuse the P8 query shape).
- `listQuoteOptionsForCompany(companyId)` — **non-archived quotes of the company** for the
  create-from-quote picker / quote link (surface `accepted` first).
- `listCatalogPickerItems()` — **active + non-archived** catalog items for the line picker (reuse P8).

**Actions (`actions.ts`):**

- `createInvoice` — `invoices.create`; company exists + non-archived; validate optional
  contact/project/**quote** all belong to the company + non-archived; `status='draft'`; generate
  number; set `created_by`/`updated_by`; audit `invoice.created`; redirect to detail.
- `createInvoiceFromQuote` — `invoices.create`; load a non-archived quote; copy header
  (company/contact/project, currency, `discount_amount`, `tax_amount`, title) + **snapshot all
  `quote_items` → `invoice_items`** (set `quote_item_id`, `catalog_item_id`, name, qty, unit_price,
  billing_interval, line math); set `quote_id`; `status='draft'`; `recalculateInvoiceTotals`; audit
  **`invoice.created_from_quote`** (metadata `{ quote_id, quote_number, item_count }`); redirect.
  *(Recommended — see §16. Allowed from any non-archived quote; UI surfaces it on `accepted` quotes.)*
- `updateInvoice` — `invoices.update`; **`requireEditableInvoice` (draft only)**; never writes
  `company_id`/`status`/`invoice_number`/`subtotal`/`total_amount`/`amount_paid`/`balance_due`/
  `paid_at`; validates contact/project/quote relationships; recompute totals; audit `invoice.updated`
  with **changed field names only**.
- `changeInvoiceStatus` — `invoices.update` **+** `permissionForStatus(to)`; reject if archived;
  no-op if same; `isLegalInvoiceTransition` check; on `paid` set `amount_paid=total_amount`,
  `balance_due=0`, `paid_at=now()`; on un-pay (`paid→issued`) clear them; on `issued` stamp
  `issue_date`; audit `invoice.status_changed` (`old_status`/`new_status`).
- `archiveInvoice` — `invoices.archive`; **only when status ∈ {draft, void}**; type-to-confirm
  `invoice_number`; set archived; audit `invoice.archived`.
- `restoreInvoice` — `invoices.archive`; archived → `draft`; clear archived_at/by; audit
  `invoice.restored`.
- `addInvoiceItem` / `updateInvoiceItem` / `removeInvoiceItem` / `reorderInvoiceItems` —
  `invoices.update` + `requireEditableInvoice` (**draft only**); catalog item (if linked) must be
  active + non-archived; `computeLine`; **`removeInvoiceItem` hard-deletes the child** + resequences;
  `reorderInvoiceItems` validates the id set fully belongs to the invoice; **every mutation calls
  `recalculateInvoiceTotals`**; audit `invoice.item_added/updated/removed/items_reordered`.
- `recalculateInvoiceTotals(admin, invoiceId)` (internal) — `subtotal = Σ line_total`,
  `total = max(0, subtotal − discount + tax)`, `balance_due = max(0, total − amount_paid)`; persists
  `subtotal/total_amount/balance_due`.

Error handling: generic safe messages; specific relationship/transition messages; no raw DB errors;
no secrets logged. Path revalidation: `/app/invoices` and `/app/invoices/[id]` after each write.

---

## 11. UI / routes

Routes under `src/app/(portal)/app/(protected)/invoices/`: `page.tsx` (list), `new/page.tsx`
(create), `[id]/page.tsx` (detail). Topbar gains an **"Invoices"** link gated on `invoices.read`.

- **List** (`InvoiceTable`): **clickable rows** (stretched-link), columns invoice number / title /
  company / **StatusBadge** / total / balance due / due date / updated; **search**; **status filter**
  + **company filter**; **archived toggle** ("Show archived"); **pagination** (25/page); **empty
  states** ("No invoices yet" / "No archived invoices"). A "New invoice" button (gated
  `invoices.create`).
- **Create** (`InvoiceForm`): title + company (+ optional contact/project/quote, valid by company) +
  optional `due_date`. Lines are added on the detail page (parallel to quotes). A second entry
  point: **"Create from quote"** (a quote picker or, recommended, a button on the quote detail page —
  §16) calling `createInvoiceFromQuote`.
- **Detail** (`InvoiceDetailActions`): see §12. Uses **EditableBlock** (draft only), the
  **line-item editor** (catalog picker; quote-item provenance shown read-only), a **totals block**
  (+8.1% helper), the **status control**, a **ConfirmDialog** for archive (type-to-confirm) and for
  the confirmed transitions, and **HistoryButton/HistoryTimeline**. Archived detail is **read-only
  except Restore**; issued/paid/overdue/void detail is **read-only except status control + internal
  notes** (no line/money edits).
- **Catalog item picker** + **quote link** are recommended (see §16). The line editor reuses the P8
  `LineItemEditor` shape (catalog prefill, inline edit, remove with confirm, reorder).

---

## 12. Invoice detail page sections

1. **Header** — `invoice_number` + title; **StatusBadge**; **HistoryButton**.
2. **Status control** — legal transitions for the current status, each gated + (where required)
   confirmed (issue / mark-paid / void / un-pay). Manual "Mark overdue" when issued.
3. **Links** — company (always), contact / project / **source quote** (when set), each with an
   **archived hint** if the linked row is archived.
4. **Invoice metadata** — issue date, due date, paid at, created/updated by + timestamps.
5. **Line items** — position-ordered; in **draft**: the line-item editor (add/edit/remove/reorder +
   catalog picker); when **issued+**: read-only list. Lines copied from a quote show a small "from
   quote" provenance marker.
6. **Totals** — subtotal, discount, tax (+8.1% helper in draft), **total**, **amount paid**,
   **balance due**. Editable (discount/tax) only in draft.
7. **Notes** (customer-facing) + **Internal notes** (staff) — EditableBlocks (draft only; internal
   notes optionally editable post-issue — §25).
8. **Archive / Restore** — ConfirmDialog (type-to-confirm the invoice number) for archive when
   status ∈ {draft, void}; Restore on archived.
9. **Created / updated metadata** — provenance footer.

---

## 13. Audit / history

**Events (10):** `invoice.created`, `invoice.updated`, `invoice.status_changed`, `invoice.archived`,
`invoice.restored`, `invoice.item_added`, `invoice.item_updated`, `invoice.item_removed`,
`invoice.items_reordered`, `invoice.created_from_quote`. (Issue / mark-paid / void / un-pay are
`invoice.status_changed` with `old_status`/`new_status` — no separate events, parallel to P8.)

- `entity_type = 'invoice'`; `entity_id` = the invoice id; **line-item events are logged on the
  parent invoice**.
- `old_status`/`new_status` set on status_changed/archived/restored.
- **Safe (ordinary) metadata:** `invoice.created` may include `{ invoice_number, company_id }`;
  `invoice.created_from_quote` `{ quote_id, quote_number, item_count }`; `invoice.updated`
  `{ fields: [changed names] }`; item events `{ item_id, position, name }` (+ `fields` names on
  update); reorder `{ count }`.
- **Forbidden in ordinary metadata:** any money **value** — `unit_price`, `line_total`,
  `line_subtotal`, `subtotal`, `total_amount`, `discount_amount`, `tax_amount`, **`amount_paid`,
  `balance_due`** — and any token/secret. (A regex test enforces "no money key used as a property,"
  like P8.) Raw before/after (incl. money) goes only to `old_values`/`new_values`.
- **Display:** add 10 labels + colors in `src/lib/audit/display.ts` (e.g. created→`done`,
  updated→`system`, status_changed→`warning`, archived→`revoked`, restored→`done`,
  created_from_quote→`done`, item_*→`system`/`warning`). The existing History timeline renders them.
- **Technical `old_values`/`new_values` stay gated by `audit.read_technical`.**

---

## 14. Relationship rules (companies / contacts / projects / quotes / catalog)

- **Invoice requires a company** (FK RESTRICT; cannot create for an archived company).
- **Contact optional** — must belong to the invoice's company + be non-archived (validated server-side).
- **Project optional** — must belong to the company + be non-archived.
- **Quote optional** — must belong to the company + be non-archived (validated). `create_from_quote`
  derives company/contact/project from the quote.
- **Per-line quote item optional** — set only by `create_from_quote` (provenance, SET NULL).
- **Per-line catalog item optional** — must be active + non-archived at add time; **values are
  snapshotted** onto the line.
- **Archiving a linked company/contact/project/quote/catalog item never alters the invoice** —
  contact/project/quote/catalog FKs are SET NULL (or snapshot), company is RESTRICT (cannot be
  hard-deleted while invoices reference it). The detail page shows an **archived hint** for any
  archived linked entity.
- **Reverse links in P9:** ship the **invoice → quote** link on the invoice detail, and a
  **"Create invoice" button on the quote detail page** (cheap, recommended — §16). Full
  **company/project/quote "Invoices" list sections** are **deferred** (parallel to P8-Q3, which
  deferred the quotes sections).

---

## 15. Totals and money handling

- **Currency:** CHF only (CHECK), single-currency like quotes/catalog.
- **Net / ex-VAT** line prices (same assumption as quotes).
- **Line:** `line_subtotal = round2(quantity * unit_price)`, `line_total = line_subtotal`.
- **Invoice:** `subtotal = Σ line_total`; `total_amount = max(0, subtotal − discount_amount +
  tax_amount)`; `balance_due = max(0, total_amount − amount_paid)`.
- **Tax:** `tax_amount` stored + authoritative; an **8.1% UI helper** computes a suggested value
  (`round2(max(0, subtotal − discount) * 0.081)`). **No tax engine, no per-line tax.**
- **Discount:** flat quote-level `discount_amount`. **No per-line, no percentage discounts.**
- **`amount_paid` / `balance_due`:** stored; `amount_paid` changes **only** via the manual
  `mark_paid` (full `total_amount`) / un-pay (0). `balance_due` recomputed with totals. **No partial
  payments in P9.**
- **Rounding:** `round2` (2-dp half-up), shared pure helper, unit-tested for float drift.
- **Validation:** `quantity > 0`, `unit_price ≥ 0`, all stored money `≥ 0` (zod + DB CHECKs).
- **Totals stored** in `invoices`; **recomputed server-side** (`recalculateInvoiceTotals`) on every
  draft line/discount/tax change and on mark-paid/un-pay. Pure math isolated in
  `src/modules/invoices/totals.ts` (reuses/extends the P8 `totals.ts` shape with a `balance_due`
  helper). **Simple and robust — no accounting engine.**

---

## 16. Recommended optional inclusions (call these out for approval)

- **`createInvoiceFromQuote` — recommended IN.** It is the single highest-value invoice flow
  (accepted quote → invoice) and the lines/totals/relationships already snapshot cleanly. Adds one
  action + one audit event + one entry point.
- **"Create invoice" button on the quote detail page — recommended IN** (a small addition to
  `QuoteDetailActions`, gated `invoices.create`, shown on non-archived quotes, prominent on
  `accepted`). This is the only P8 file P9 would touch, and it is additive/optional.
- **Catalog item picker on invoice lines — recommended IN** (reuse P8).
- **Company/project/quote detail "Invoices" sections — recommended OUT (defer)**, parallel to P8-Q3.
- **PDF / public page / email — OUT (defer)**, per scope.

---

## 17. Rate limiting / abuse

**No new public endpoints.** All invoice actions are authenticated `/app` server actions behind
permissions + RLS. **No new rate limiting required.** Public invoice/payment pages and automated
sending are **deferred** (a future payments phase would add its own rate limiting + Turnstile where
public).

---

## 18. Legacy data / old admin (planning only)

- **Do not migrate** `payments`/`orders`/`subscriptions`/`customers`/`payment_links` in P9; they are
  the Stripe/checkout domain and stay untouched.
- **Future mapping (designed, not built):** a P9 `paid` invoice is the natural source for a future
  `payments` row — `invoices.company_id` ↔ `payments.company_id`/`customers.company_id`;
  `invoices.total_amount` ↔ `payments.amount_chf`; a future `invoices.payment_id`/`stripe_*` (added
  later, additively) links the two. `invoice_items` already snapshot everything an accounting/CSV
  export needs. `quote_id`/`quote_item_id` preserve the quote→invoice→payment lineage end-to-end.
- **Old `/[locale]/admin` remains untouched.** **No business-table rewrite.**

---

## 19. Files likely to create / update

**Create:**

- `supabase/migrations/0026_invoices.sql`
- `src/modules/invoices/{schema,types,status,guards,totals,queries,actions}.ts`
- `src/app/(portal)/app/(protected)/invoices/{page.tsx,new/page.tsx,[id]/page.tsx}`
- `src/components/portal/invoices/{InvoiceTable,InvoiceForm,InvoiceDetailActions,LineItemEditor}.tsx`
- Tests: `src/modules/invoices/{totals.test.ts,invoices.test.ts}`,
  `src/components/portal/ui/p9_invoices.test.tsx`
- `PORTAL_P9_SPEC.md` (this file), `PORTAL_P9_RUNBOOK.md`

**Update (small, additive):**

- `src/lib/status/colors.ts` (+`invoiceStatusToken`)
- `src/components/portal/ui/StatusBadge.tsx` (+`'invoice'` in `StatusEntity` + `statusTokenFor`)
- `src/lib/audit/display.ts` (+10 `invoice.*` labels/colors)
- `src/lib/types/database.ts` (+`InvoiceStatus`, `invoices`, `invoice_items` Row/Insert/Update)
- `src/components/portal/shell/Topbar.tsx` (+"Invoices" nav, gated)
- `supabase/migrations/README.md` (+`0026` entry)
- *Recommended:* `src/components/portal/quotes/QuoteDetailActions.tsx` (+"Create invoice" button) —
  the only P8 file touched, additive/optional.

---

## 20. Tests

Mirror the P8 suite:

- **Migration / RLS** (live probe during build): permission-less `sub` → 0 rows on `invoices` and
  `invoice_items`; admin/super-admin → visible (rolled-back transaction).
- **Permissions:** the 7-key × 5-role matrix (admin all; sales create/update/issue; mark_paid/void/
  archive admin-only; others read).
- **Status machine:** legal transitions (draft→issued→paid/overdue/void, overdue→paid/void, paid→
  issued un-pay), illegal jumps rejected, any `archived` transition rejected, `permissionForStatus`
  mapping (issue/mark_paid/void/update), confirm-required set.
- **Action source-checks:** every action gated by the right permission; `requireEditableInvoice`
  (draft-only) on update + line mutations; **invoices never hard-deleted** (`from('invoices').delete`
  absent), **invoice_items hard-delete present**; **no `stripe`/`/api/checkout`/`from('orders')`/
  `from('subscriptions')`/`from('payments')`/`from('customers')`/`from('payment_links')`**;
  create_from_quote snapshots; mark_paid sets amount_paid/paid_at.
- **Relationship guards:** contact/project/quote same-company + non-archived; confirm-matches.
- **Line items:** add/update/remove/reorder math + resequence + ownership validation.
- **Totals:** `computeLine`, `computeInvoiceTotals`, `balance_due`, `suggestedTax`, `round2`,
  `formatMoney` (CHF) — incl. negative-clamp + rounding.
- **Audit:** labels/colors for all 10 events; **no money key as a property in ordinary metadata**
  (regex); created/created_from_quote metadata shape.
- **UI/component:** `StatusBadge` invoice token mapping; audit display; **no service-role import in
  client components** (`InvoiceForm`/`InvoiceDetailActions`/`LineItemEditor`).
- **Build/tsc:** `npx tsc --noEmit` clean; `npx vitest run` all pass; `npm run build` passes.
- **Regression:** P5/P6/P7/P8 + auth/profile/users/history + admin + **`/api/checkout` &
  `/api/leads` unchanged** suites stay green; **old `/admin`** untouched.

---

## 21. Manual smoke checklist

As **admin**: create an invoice for a company → `INV-00001`, `CHF 0.00`, `Draft`. Add a catalog line
+ a manual line → subtotal/total/balance update. Edit a line; reorder; remove. Set discount + "+8.1%"
tax. **Create from an accepted quote** → lines + totals + quote link populated. `draft → issued`
(confirm; issue date stamped; lines now read-only). `issued → paid` (confirm; amount paid = total,
balance 0, paid_at set). Un-pay `paid → issued` (admin, confirm). `issued → overdue` (manual);
`overdue → void` (confirm). Illegal transition blocked. Archive a **draft** (type the invoice number)
→ "Show archived" reveals → restore. Try to archive an **issued** invoice → blocked. Filters / search
/ pagination. As **sales**: create/update/**issue**, but **no Mark-paid / Void / Archive**. As
**read_only**: view only; Invoices nav hidden without `invoices.read`. History shows invoice + item
+ status events; money before/after only under `audit.read_technical`. Confirm `/app/quotes`,
`/app/catalog`, `/app/projects`, `/app/companies`, `/app/contacts`, `/app/users`, old `/admin`,
checkout and marketing are unaffected.

---

## 22. Rollback plan

- **Code:** revert the P9 commit — module, routes, components, Topbar link, status/audit additions
  revert together. (The optional quote-detail button reverts with it.)
- **Migration (greenfield):** `drop table public.invoice_items; drop table public.invoices; drop
  sequence public.invoice_number_seq;` + delete the 7 seeded permissions + their grants (child-first;
  see the `-- ROLLBACK:` lines). **No other table touched. Never edit the applied migration.**
- **Disable without rollback:** hide the Invoices nav + gate routes behind a flag; removing the
  grants also hides it.
- **Data:** invoices never hard-delete (archive); line items are children of a droppable table.
- **Old `/admin`** remains the untouched fallback throughout.

---

## 23. Risks and open questions

- **Invoice number generation** — global `INV-#####` sequence (recommended) vs per-year reset
  `INV-YYYY-#####`. Default: global sequence (simple, gap-tolerant). *Decision.*
- **Create-from-quote** — recommended IN; allowed from any non-archived quote (default) vs
  restricted to `accepted` only. Default: any non-archived, accepted surfaced first. *Decision.*
- **Stored vs computed totals** — stored (recommended, matches quotes/orders).
- **`amount_paid`/`balance_due`** — include now (recommended) vs defer to payments phase. Default:
  include (simple, manual, all-or-nothing). *Decision.*
- **Manual mark-paid** — included (full amount) vs defer entirely. Default: included. *Decision.*
- **`paid → issued` un-pay** — allowed (admin correction, default) vs `paid` hard-terminal.
  *Decision.*
- **Immutable-after-issue** — whole invoice locked after issue (recommended). Open: allow editing
  **`internal_notes`** post-issue? Default: lock everything except status; internal-notes relaxation
  is a small optional. *Decision.*
- **Archive scope** — archivable only from `draft`/`void` (recommended) and restore→`draft`. Open:
  add `status_before_archive` to restore a void precisely? Default: no extra column. *Decision.*
- **Overdue** — manual in P9 (no cron, recommended). Automatic overdue job deferred.
- **VAT/discount** — stored simple totals only (recommended); no engine, no per-line.
- **PDF / public invoice / payment / email** — all **deferred** (no customer-facing surface in P9).
- **Future payment reconciliation** — designed via the §18 mapping; not built.
- **`finance.*` vs `invoices.*` permission naming** — using `invoices.*` per repo convention
  (supersedes the Part IV `finance.*` sketch). *Confirm.*
- **Finance overreach** — the main risk is scope-creep into a real finance engine; this spec keeps
  P9 to a document + manual lifecycle.

---

## 24. PDF note (planning only)

No PDF generation in P9. If/when needed, the lightest path is a **server-rendered print view**
(`/app/invoices/[id]/print`, staff-only) or an on-demand PDF from the stored snapshot — **planning
only, not built in P9.** Flagged here solely because the prompt allows a planning-level mention.

---

## 25. Decisions needed before build (defaults in **bold**)

1. Invoice number: **global `INV-#####`** / per-year reset.
2. `createInvoiceFromQuote` + quote-detail "Create invoice" button: **IN** / out.
3. Create-from-quote source restriction: **any non-archived (accepted surfaced)** / accepted-only.
4. `amount_paid` + `balance_due` + manual mark-paid: **IN (stored, full-amount)** / defer.
5. `paid → issued` un-pay: **allowed (admin, confirmed)** / paid hard-terminal.
6. Post-issue editing: **fully locked except status** / allow `internal_notes` edits post-issue.
7. Archive scope: **`draft`+`void` only, restore→draft** / add `status_before_archive`.
8. Status value names: **`issued`/`overdue`** (tokens `sent`/`warning`) / Master-Plan `sent`/`past_due`.
9. Permission naming: **`invoices.*`** / `finance.*`.
10. `organization_id`: **defer** / include now.

---

## 26. Final readiness checklist

- **P9 spec ready:** **Yes.** Greenfield confirmed, `0026` numbering confirmed, data model + status
  machine + permissions + RLS + totals + audit + UI + tests + rollback all specified against the live
  schema and the P8 precedent.
- **Blockers:** none. (No live calls made; no migration created.)
- **Decisions needed before build:** the 10 in §25 (all have safe recommended defaults).
- **Out-of-scope confirmed:** no payments/Stripe/checkout/reconciliation/accounting export/PDF/
  e-sign/public page/email/tax engine/recurring/subscription/customer-order migration/finance
  dashboard/NDA/notifications/impersonation/MFA/role-editor/org-settings/`/admin` removal/
  business-table rewrite/hard-deletes of invoices.

**Exact approval question:** *"Approve P9 Invoices Core as specified — greenfield `invoices` +
`invoice_items` (migration `0026`), statuses draft/issued/paid/overdue/void/archived, permissions
`invoices.read/create/update/issue/mark_paid/void/archive` (sales up to issue; mark_paid/void/archive
admin-only), stored totals + manual `amount_paid`/`balance_due`, `createInvoiceFromQuote` + the
quote-detail button IN — with the §25 defaults (items 1-10) — and then build P9? Or change any of the
§25 decisions first?"*

**Do not build yet. Awaiting P9 approval + the §25 decisions.**
