# PORTAL P8 — QUOTES / PROPOSALS CORE — TECHNICAL SPECIFICATION

Status: **SPEC ONLY — do not build, do not create migrations.** Awaiting approval.
Authoritative sources: `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI; the **live** Supabase schema
(`bkwwlmflsbhrsfwydbnv`) and current repo, which override theoretical names/assumptions (Part VI
§VI.1 rule 4). Written after inspecting both. Builds on P5 CRM + P6 Projects + P7 Catalog.

---

## 1. P8 objective

P8 introduces the **internal Quotes Core only** — a `quotes` parent + `quote_items` child, linked to
a company (and optionally a contact, a project, and catalog items per line), with a status lifecycle,
stored totals, list/detail/create/edit/archive/restore UI, audit/history, permissions, tests and
docs. It is **Ring D** (Master Plan §3) and **prepares** later invoice/order/payment/checkout flows
**without building any of them**: no invoices, no payments, no Stripe, no checkout change, no
customer-facing acceptance, no automated email, no tax engine. A quote is the internal document a
salesperson builds; turning an accepted quote into an order/invoice is a later phase.

---

## 2. Current-state dependency check (inspected; what exists live)

- **No quote table exists.** Live inspection: zero tables matching `quote|proposal|estimate|invoice`.
  So P8 is **greenfield** (first parent-child phase).
- **Money convention:** legacy billing (`orders.amount_plan_chf`, `payment_links.amount_chf`) stores
  **integer CHF**, but **`catalog_items.base_price` is `numeric(12,2)`**. Quotes follow the **catalog
  convention** (`numeric(12,2)`, exact, 2 decimals) — not the legacy integer one.
- **Referenced entities (live):** `companies` (P5, `companies.id`), `company_contacts` (P5, `id` +
  `company_id`), `projects` (P6, `id` + `company_id`), `catalog_items` (P7, `id`, `name`,
  `base_price numeric`, `currency`, `billing_interval`, `code`). All four have **permission-gated
  read RLS** (`*_select` policies) — P8 follows the same pattern.
- **RBAC (live):** roles admin/analyst/sales/reviewer/read_only; `permissions` (id uuid, key, **module
  NOT NULL**, **label NOT NULL**) — **27 rows** across `audit, catalog, companies, contacts, org,
  projects, users`. **No quotes permissions yet.**
- **Reusable platform:** generic `audit_logs` + `logEvent` + `audit_history()` RPC + `display.ts`;
  `StatusMachine`/`canTransition` + per-entity token mappers (company/contact/project/catalog);
  P3.5/P5/P6/P7 UI (`StatusBadge`, `EditableBlock`, `ConfirmDialog`, `rowLink`, History components,
  list filter/search/pagination, `*DetailActions`); module template `src/modules/{…}/*`; routes under
  `src/app/(portal)/app/(protected)/…`; service-role writes in `'use server'` actions;
  `requirePermission`/`hasPermission`. `touch_updated_at` trigger fn exists.
- **Migrations:** latest is `0024_catalog_items`. **Next number = `0025`.**
- **`/[locale]/admin`:** untouched and stays untouched. No business-table rewrite needed.
- **Master Plan:** Ring D `quotes`; mentions a future **immutable `quote_versions`** idea (deferred);
  the deal status is `open/won/lost`, finance/invoices `draft/sent/paid/past_due/void/refunded`
  (deferred). P8 uses the standard quote lifecycle (§6), superseding the sketchy deal status.

---

## 3. Scope boundaries

**In scope (P8):** `quotes` + `quote_items` tables; quote status lifecycle; line-item editor with an
optional catalog picker (snapshot-based); stored totals (subtotal/discount/tax/total); list/detail/
create/edit/archive/restore UI; `quotes.*` permissions + grants; audit/history (quote + line-item
events); tests + docs/runbook.

**Out of scope (not built in P8):** invoices · payments · Stripe · checkout rewrite · **PDF/e-sign**
· customer-facing portal · **public quote-acceptance page** · **automated email** · **tax/VAT engine**
(beyond a simple stored `tax_amount`) · accounting export · order/subscription/customer migration ·
finance dashboard · NDA/documents · notifications · impersonation · MFA · role editor UI · org
settings UI · `/admin` removal · business-table rewrite · hard deletes of quotes · project billing
automation · **automatic expiry** · per-line tax/discount · `quote_versions`.

**Deferred to later phases:** `quote_versions` (immutable revisions); PDF/print export; public
acceptance + automated send; tax engine + per-line tax; percentage/per-line discounts; recurring-vs-
one-time split totals; `organization_id`; company/project detail "Quotes" section (decision P8-Q3);
accepted-quote → order/invoice flow.

---

## 4. Naming decision (P8-D1)

**Recommended: "Quotes".** Tables `quotes` + `quote_items`; route `/app/quotes`; permissions
`quotes.*`; audit entity `quote` (line-item events on the parent quote); UI label "Quotes".
Justification: simplest, unambiguous internal English; matches the Master Plan's Ring D `quotes`; the
portal is internal English-only (the customer-facing Swiss term "Offerte" is a later, document-level
concern, not the table name). "Proposals/Offers/Estimates" add no clarity over "Quote".

---

## 5. Data model proposal

Two greenfield tables (P8-D1). Money is `numeric(12,2)`, CHF, **net (ex-VAT)** for line prices.

### `quotes`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK default gen_random_uuid()` | |
| `created_at` / `updated_at` | `timestamptz NOT NULL default now()` | + `touch_updated_at` trigger |
| `quote_number` | `text NOT NULL` | **generated** `Q-#####` from a sequence (P8-D4), unique |
| `title` | `text NOT NULL` | short subject |
| `company_id` | `uuid NOT NULL → companies(id) ON DELETE RESTRICT` | **required** (P8-D2) |
| `contact_id` | `uuid NULL → company_contacts(id) ON DELETE SET NULL` | optional; must belong to the company |
| `project_id` | `uuid NULL → projects(id) ON DELETE SET NULL` | optional; must belong to the company |
| `status` | `text NOT NULL default 'draft'` | CHECK `draft|sent|accepted|declined|expired|archived` |
| `currency` | `text NOT NULL default 'CHF'` | CHECK `'CHF'` |
| `subtotal` | `numeric(12,2) NOT NULL default 0` | sum of line totals (stored) |
| `discount_amount` | `numeric(12,2) NOT NULL default 0` | flat quote-level discount (P8-D7) |
| `tax_amount` | `numeric(12,2) NOT NULL default 0` | stored VAT line (P8-D6; no engine) |
| `total_amount` | `numeric(12,2) NOT NULL default 0` | `subtotal − discount + tax` (stored) |
| `valid_until` | `date NULL` | display-only; expiry is manual (P8) |
| `notes` | `text NULL` | customer-facing notes |
| `internal_notes` | `text NULL` | internal only, never on a customer doc |
| `archived_at` / `archived_by` | `timestamptz` / `uuid → profiles SET NULL` | |
| `created_by` / `updated_by` | `uuid → profiles SET NULL` | provenance |

Money CHECKs: `subtotal >= 0`, `discount_amount >= 0`, `tax_amount >= 0`, `total_amount >= 0`.

### `quote_items`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK default gen_random_uuid()` | |
| `quote_id` | `uuid NOT NULL → quotes(id) ON DELETE CASCADE` | child of a quote |
| `catalog_item_id` | `uuid NULL → catalog_items(id) ON DELETE SET NULL` | optional, informational link |
| `position` | `integer NOT NULL default 1` | 1-based ordering |
| `name` | `text NOT NULL` | snapshotted from the catalog item or typed |
| `description` | `text NULL` | |
| `quantity` | `numeric(12,2) NOT NULL default 1` | CHECK `> 0` |
| `unit_price` | `numeric(12,2) NOT NULL default 0` | CHECK `>= 0`; net; snapshotted from `base_price` |
| `billing_interval` | `text NULL` | snapshotted; CHECK null or `monthly|yearly|one_time` (informational) |
| `line_subtotal` | `numeric(12,2) NOT NULL default 0` | `quantity * unit_price` |
| `line_total` | `numeric(12,2) NOT NULL default 0` | `= line_subtotal` in P8 (reserved for future per-line adjustments) |
| `created_at` / `updated_at` | `timestamptz NOT NULL default now()` | + trigger |

### Justified decisions

- **P8-D2 — company required** (`ON DELETE RESTRICT`); **contact + project optional** and each must
  belong to the quote's company (action-enforced; `ON DELETE SET NULL`). A quote is always *for* a
  company.
- **P8-D3 — catalog item optional per line, snapshot-based.** When a line is created from a catalog
  item, its `name`, `unit_price` (= `base_price`) and `billing_interval` are **copied** onto the line;
  `catalog_item_id` is kept as an informational link. Editing or archiving the catalog item later
  does **not** change existing quote lines (a quote is a point-in-time document).
- **P8-D4 — `quote_number` generated.** A sequence `quote_number_seq` + a column DEFAULT
  `'Q-' || lpad(nextval('public.quote_number_seq')::text, 5, '0')` assigns `Q-00001`, `Q-00002`, …
  at insert (race-safe via `nextval`); unique index. No app logic, no year-reset complexity.
- **P8-D5 — totals are STORED, recalculated server-side.** Denormalized for list display and
  stability (a sent quote's total must not drift when catalog prices change). `recalculateQuoteTotals`
  re-reads the lines and rewrites `subtotal`/`total_amount` on every line/discount/tax change.
- **P8-D6 — `tax_amount` is a simple STORED field** (default 0), optionally filled by a UI "+8.1% VAT"
  helper that computes `round((subtotal − discount) * 0.081, 2)`; the **stored value is
  authoritative**. No tax engine, no per-line tax, no jurisdiction logic. *(Net/ex-VAT line prices,
  consistent with the catalog + the marketing ex-VAT note.)* Can be deferred (default 0 everywhere).
- **P8-D7 — `discount_amount` is a flat quote-level STORED field** (manual). No per-line or percentage
  discounts (deferred). Can be deferred (default 0).
- **P8-D8 — `quote_items` are HARD-deleted on removal** (a draft edit), audited via
  `quote.item_removed` on the parent. The platform "no hard delete" rule protects **top-level
  entities** (quotes are soft-archived); line items are mutable components of a quote, so removing a
  line is a normal edit, not an entity deletion. `ON DELETE CASCADE` from `quotes` covers the (rare)
  parent removal.
- **P8-D10 — defer `organization_id`** (single-org, consistent with P5/P6/P7).

---

## 6. Quote status model

`status` → token, class, permission, confirm:

| Value | Token | Class | Permission to set | Confirm |
|---|---|---|---|---|
| `draft` | `draft` | entry, R | `quotes.update` | no |
| `sent` | `sent` | R | `quotes.send` | no (no email is sent — marks state only) |
| `accepted` | `done` | near-terminal, reopenable | `quotes.accept` | **yes** |
| `declined` | `cancelled` | near-terminal, reopenable | `quotes.accept` | **yes** |
| `expired` | `warning` | near-terminal, reopenable | `quotes.update` | no (manual) |
| `archived` | `cancelled` | near-terminal, restorable | `quotes.archive` | **yes (type-to-confirm)** |

**Allowed transitions** (`quoteStatusMachine`, server-validated via `canTransition`):
`draft→sent`, `sent→draft` (revise), `sent→accepted`, `sent→declined`, `sent→expired`,
`accepted→draft`, `declined→draft`, `expired→draft` (reopen to revise). `{any non-archived}→archived`
and `archived→draft` are the dedicated archive/restore actions. **`expired` is MANUAL** in P8 (no
auto-expiry job; `valid_until` is display-only). `accepted`/`declined`/`expired` are **reopenable** to
`draft` (deliberate, confirmed). Accepting/declining requires a confirm; archive is type-to-confirm.
No side effects (no email, no order creation) on any transition.

**Audit:** status moves emit `quote.status_changed` (old/new); archive/restore emit
`quote.archived`/`quote.restored`.

---

## 7. Permissions model

New permissions (`module='quotes'`): `quotes.read`, `quotes.create`, `quotes.update`,
`quotes.archive`, `quotes.send`, `quotes.accept`.

**Initial `role_permissions` grants (proposed):**

| Role | read | create | update | send | accept | archive |
|---|---|---|---|---|---|---|
| `admin` (1) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| `sales` (3) | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| `analyst` (2) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `reviewer` (4) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| `read_only` (5) | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

Sales runs quotes end-to-end (create/update/send/mark accepted-or-declined); **archive is admin-only**
(consistent with P5/P6/P7). No role editor UI. **Open question P8-Q2:** should `quotes.accept` be
admin-only (a sign-off) rather than sales? Default: sales (they record the customer's decision).

---

## 8. RLS / security model

- **Reads:** permission-gated SELECT policies on **both** tables (P6/P7 precedent):
  `quotes_select` `authenticated USING (has_permission('quotes.read') OR is_platform_super_admin())`,
  and `quote_items_select` with the same predicate. (Server queries use the service-role client and
  bypass RLS; the policies harden direct PostgREST access.)
- **Writes:** **no client writes.** All quote + line-item mutations go through permission-gated
  `'use server'` actions using the service-role admin client; **no INSERT/UPDATE/DELETE RLS policies**.
- **Archived hidden by default** at the query layer (`quotes.archived_at is null` unless "Show
  archived"). **No hard deletes of quotes** (archive); line items removed via the gated action only.
- **No public quote access in P8.** No customer-facing route, no token, no `is_public`.
- **Service-role / super-admin / audit:** unchanged from P5–P7. Audit technical fields gated by
  `audit.read_technical`; History via `audit_history()`. **No service-role client in any client
  component** (test-enforced).

---

## 9. Migration plan

**Next number: `0025_quotes.sql`** (additive; `-- ROLLBACK:` notes; never edit an applied migration —
Part IV L2). Apply live via MCP, mirror, regenerate `database.ts`, update README.

Contents:
1. `create sequence if not exists public.quote_number_seq;`
2. `create table public.quotes (...)` — §5 columns, `status`/`currency` CHECKs, money CHECKs
   (`>= 0`), FKs (`company_id → companies RESTRICT`, `contact_id → company_contacts SET NULL`,
   `project_id → projects SET NULL`, `*_by → profiles SET NULL`), `quote_number` DEFAULT from the
   sequence.
3. `create table public.quote_items (...)` — §5 columns, `quantity > 0` + `unit_price >= 0` CHECKs,
   `billing_interval` CHECK, FKs (`quote_id → quotes ON DELETE CASCADE`, `catalog_item_id →
   catalog_items SET NULL`).
4. **Triggers:** `touch_updated_at` on both tables.
5. **Indexes:** `quotes (company_id)`, `(contact_id)`, `(project_id)`, `(status) WHERE archived_at is
   null`, `(created_at desc)`, unique `(quote_number)`; `quote_items (quote_id, position)`,
   `(catalog_item_id)`.
6. **RLS:** enable on both; the two permission-gated SELECT policies (§8). No write policies.
7. **Permissions seed:** the 6 `quotes.*` keys (`on conflict do nothing`).
8. **role_permissions seed:** the §7 matrix (idempotent `not exists`).
9. **No changes to** orders/subscriptions/payments/payment_links/customers/checkout or any business
   table.
10. `-- ROLLBACK:` `drop table public.quote_items; drop table public.quotes; drop sequence
    public.quote_number_seq;` + delete the seeded `permissions`/`role_permissions` rows (child first).

---

## 10. Server actions and queries

New module `src/modules/quotes/` (`schema.ts`, `types.ts`, `status.ts`, `queries.ts`, `actions.ts`,
`guards.ts`, `totals.ts`). All actions are `'use server'`, service-role, permission-gated, audited,
typed-error-returning. **`recalculateQuoteTotals(quoteId)`** is the internal helper run after any
line/discount/tax change: re-reads `quote_items`, sets `subtotal = Σ line_total`, `total_amount =
subtotal − discount_amount + tax_amount` (clamped `>= 0`), persists.

**`queries.ts`:**
- `listQuotes({ q?, status?, companyId?, showArchived?, page? })` → rows + count (joins resolve
  company name; filters `archived_at is null` by default; `q` over `quote_number`/`title`).
- `getQuote(id)` → quote + company/contact/project names + **ordered line items** + totals.
- `listContactOptionsForCompany` / project options (reuse P6/P7 lookups) + `listCatalogPickerItems`
  (active, non-archived catalog items for the line picker).

**`actions.ts`:**
- `createQuote(input)` — `quotes.create`; company non-archived; optional contact/project validated
  to the company; insert (`status='draft'`, generated number, created/updated_by, totals 0); audit
  `quote.created`; redirect to detail.
- `updateQuote(id, patch)` — `quotes.update`; title/contact_id/project_id/valid_until/notes/
  internal_notes/discount_amount/tax_amount (NOT company_id, NOT status, NOT totals directly);
  re-validate contact/project to company; `recalculateQuoteTotals`; audit `quote.updated`.
- `changeQuoteStatus(id, to)` — `quotes.update` (+ `quotes.send` for `sent`, `quotes.accept` for
  `accepted`/`declined`); machine-checked; reject if archived; audit `quote.status_changed`.
- `archiveQuote(id, confirmText)` — `quotes.archive`; type-to-confirm `quote_number`; audit
  `quote.archived`. `restoreQuote(id)` — `quotes.archive`; `archived → draft`; audit `quote.restored`.
- `addQuoteItem(quoteId, input)` — `quotes.update`; quote must be **non-archived**; if
  `catalog_item_id` set, snapshot name/unit_price/billing_interval from the (non-archived) catalog
  item (overridable); `position = max+1`; compute `line_subtotal`/`line_total`;
  `recalculateQuoteTotals`; audit `quote.item_added`.
- `updateQuoteItem(itemId, input)` — `quotes.update`; update name/description/quantity/unit_price/
  billing_interval; recompute line + totals; audit `quote.item_updated`.
- `removeQuoteItem(itemId)` — `quotes.update`; **hard-delete** the line (P8-D8); resequence positions;
  `recalculateQuoteTotals`; audit `quote.item_removed` (snapshot in technical values).
- `reorderQuoteItems(quoteId, orderedIds)` — `quotes.update`; rewrite `position`; audit
  `quote.items_reordered`.

**`guards.ts`:** `isLegalQuoteTransition`, `confirmMatches`, `contactBelongsToCompany`,
`projectBelongsToCompany`. **`totals.ts`:** pure `computeLine(qty, unit)` + `computeQuoteTotals(lines,
discount, tax)` (unit-testable, rounding to 2 decimals).

---

## 11. UI / routes

Under `src/app/(portal)/app/(protected)/quotes/`:
- `/app/quotes` — list. Clickable rows (`rowLink`), `StatusBadge` (`entityType="quote"`), columns:
  number, title, company, **total**, status, updated. Filters: status, company, **"Show archived"**;
  search; pagination (25/page); empty state; "New quote" (gated `quotes.create`).
- `/app/quotes/new` — create form (title + company picker required, optional contact/project pickers
  filtered to the company, valid_until).
- `/app/quotes/[id]` — detail (§12) — the richest page in the portal (line-item editor + totals).
- **Topbar** gains a "Quotes" link, gated on `quotes.read`.

The **line-item editor** (client) lists rows with name/qty/unit_price/line_total, inline add (with an
optional **catalog picker** that prefills name/price), edit, remove, and drag-or-buttons reorder; each
mutation calls a server action and the totals re-render. Money shown as `CHF` with 2 decimals (no
dashes copy rule). Route protection: `requirePermission('quotes.read' | '.create')`.

---

## 12. Quote detail page

Sections on `/app/quotes/[id]`:
- **Header** — `quote_number` + title + `StatusBadge` + **History button** (`audit_history('quote',
  id)`).
- **Links** — company → `/app/companies/[id]`; contact → `/app/contacts/[id]` (if set); project →
  `/app/projects/[id]` (if set), each with an "(archived)" hint where applicable.
- **Status control** — machine-driven; `sent`/`accepted`/`declined` gated by send/accept; confirms per
  §6.
- **Quote meta** — `EditableBlock`: title, contact, project, `valid_until` (gated `quotes.update`).
- **Line items** — the editor (add/edit/remove/reorder, catalog picker) — gated `quotes.update`.
- **Totals** — subtotal, discount, tax (+8.1% helper), total — discount/tax editable (gated
  `quotes.update`); read-only computed subtotal/total.
- **Notes** + **Internal notes** — `EditableBlock`s (internal notes clearly labelled internal-only).
- **Danger zone** — Archive (type-to-confirm); archived ⇒ read-only except **Restore**.
- **Metadata** — created/updated, created_by/updated_by, archived_at/by.

---

## 13. Audit / history

Events (reuse `logEvent` → `audit_logs` → `audit_history()` → `HistoryTimeline`),
**`entity_type='quote'`** (line-item events on the parent quote, item id in metadata):

| Event | severity | old/new status | safe metadata |
|---|---|---|---|
| `quote.created` | info | – | `{ quote_number, company_id }` |
| `quote.updated` | info | – | `{ fields: [...names] }` |
| `quote.status_changed` | info | ✓ | from→to |
| `quote.archived` | warning | →`archived` | – |
| `quote.restored` | info | `archived`→`draft` | – |
| `quote.item_added` | info | – | `{ item_id, position, name }` |
| `quote.item_updated` | info | – | `{ item_id, fields: [...names] }` |
| `quote.item_removed` | info | – | `{ item_id, name, position }` |
| `quote.items_reordered` | info | – | `{ count }` |

- **No raw pricing values in ordinary metadata** (amounts/unit_prices/totals). Names, positions, field
  **names**, ids only. Full before/after (incl. money) goes to technical `old_values`/`new_values`
  (gated by `audit.read_technical`).
- **Forbidden:** unit_price/line_total/subtotal/total/discount/tax values in `metadata`; tokens;
  secrets.
- **Display:** add labels + colours to `src/lib/audit/display.ts` — `quote.created`→"Quote created"/
  `done`, `quote.updated`→"Quote updated"/`system`, `quote.status_changed`→"Status changed"/`warning`,
  `quote.archived`→"Quote archived"/`revoked`, `quote.restored`→"Quote restored"/`done`,
  `quote.item_added`→"Line added"/`system`, `quote.item_updated`→"Line updated"/`system`,
  `quote.item_removed`→"Line removed"/`warning`, `quote.items_reordered`→"Lines reordered"/`system`.

---

## 14. Relationship with companies, contacts, projects and catalog

- **Company required** (`company_id NOT NULL`, RESTRICT). **Contact optional**, must belong to the
  company (action-enforced; SET NULL). **Project optional**, must belong to the company (action-
  enforced; SET NULL). **Catalog item optional per line** (SET NULL), **snapshot-based** (name/price/
  interval copied — P8-D3).
- **Archiving** a company/project/catalog item does **not** cascade to quotes; a quote keeps its
  snapshot + FK. `RESTRICT` on `company_id` blocks hard-deleting a company that has quotes. Archived
  companies/contacts/projects/catalog items are **not offered** in the pickers (a previously-chosen
  one stays visible with an "(archived)" hint).
- **Company / project detail "Quotes" section (P8-Q3):** **deferred** by default — P8 is already the
  largest phase (line-item editor + totals). Adding a small read-only Quotes list to the company and
  project detail pages is a cheap follow-up; flagged as a decision (include now vs defer).

---

## 15. Totals and money handling

- **Currency:** CHF only (CHECK). **Net / ex-VAT** line prices (consistent with the catalog + the
  marketing ex-VAT note).
- **Per line:** `line_subtotal = round(quantity * unit_price, 2)`; `line_total = line_subtotal` (no
  per-line discount/tax in P8).
- **Quote:** `subtotal = Σ line_total`; `total_amount = max(0, subtotal − discount_amount +
  tax_amount)`. `discount_amount` flat manual (P8-D7); `tax_amount` stored manual/assisted-8.1%
  (P8-D6).
- **Rounding:** all money is `numeric(12,2)`; `round(x, 2)` half-up at compute time; stored exactly.
- **Validation:** `quantity > 0`, `unit_price >= 0`, `discount_amount >= 0`, `tax_amount >= 0` (zod +
  DB CHECK). Discount may exceed subtotal only if the user insists — total clamps at `0` (no negative
  totals).
- **Stored, not computed-on-read** (P8-D5): every line/discount/tax mutation calls
  `recalculateQuoteTotals` server-side; the list/detail read the stored values. Pure compute lives in
  `totals.ts` (unit-tested) and is the single source of the math.

---

## 16. Rate limiting / abuse

**No public endpoints.** All quote actions are authenticated, staff-only server actions behind
`requirePermission`. **No new rate limit required.** Public acceptance, automated sending and PDF are
deferred.

---

## 17. Legacy data / old admin (planning only)

- **No migration of `orders`/`subscriptions`/`customers`** in P8. No data movement; checkout/Stripe
  untouched.
- **Future mapping (documented):** an **accepted** quote → an `order` (its `quote_items` ↔ order line
  items; `catalog_items.code` ↔ `orders.plan`) → a `subscription`/`invoice`. `quote_items` already
  snapshot the priced lines, so a later "convert to order" action has everything it needs without a
  rewrite. Own spec, not P8.
- **Old `/[locale]/admin` untouched.** No business-table rewrite. P8 adds only `/app/quotes`.

---

## 18. Files likely to create / update

**Migration:** `supabase/migrations/0025_quotes.sql`; regenerate `src/lib/types/database.ts` (add
`quotes` + `quote_items` + a `QuoteStatus` alias); update `supabase/migrations/README.md`.

**Status:** `src/lib/status/colors.ts` (add `quoteStatusToken`); `src/modules/quotes/status.ts`.
`src/components/portal/ui/StatusBadge.tsx` (add `'quote'`).

**Module:** `src/modules/quotes/{schema,types,status,queries,actions,guards,totals}.ts`.

**Audit:** `src/lib/audit/display.ts` (add `quote.*` labels + colours).

**Routes:** `src/app/(portal)/app/(protected)/quotes/{page,new/page,[id]/page}.tsx`.

**Components:** `src/components/portal/quotes/*` (table, form, detail-actions, **line-item editor**,
catalog picker, totals). Update `src/components/portal/shell/Topbar.tsx`. *(Optional P8-Q3: a
`CompanyQuotes`/`ProjectQuotes` section.)*

**Tests:** `src/modules/quotes/quotes.test.ts`, a `totals.test.ts`, a status-machine test, an audit-
display test, a `StatusBadge` quote test, no-service-role-in-client assertions.

**Docs:** `PORTAL_P8_RUNBOOK.md`; Master Plan roadmap update after build/approval.

---

## 19. Tests

- **Migration / RLS:** both tables exist with columns/CHECKs/FKs/indexes/triggers + the sequence;
  permission-gated SELECT (deny without `quotes.read`, allow with — live-probe like P6/P7); archived
  hidden at the query layer; service-role writes; no client write path.
- **Permission matrix:** sales create/update/send/accept but **not archive**; only admin archives;
  analyst/reviewer/read_only read-only; non-permitted blocked.
- **Action tests:** quote + line-item CRUD happy paths + permission-denied + not-found; type-to-confirm
  rejects a wrong string; create under archived company rejected; contact/project not-in-company
  rejected; line add under archived quote rejected.
- **Relationship tests:** contact/project must belong to company; catalog snapshot copies name/price.
- **Line-item tests:** add/update/remove/reorder; positions resequence; hard-delete on remove.
- **Totals tests (`totals.test.ts`):** line math, subtotal, discount, tax, total, rounding, negative-
  clamp — pure functions.
- **Status-transition tests:** legal pass; illegal rejected; archive/restore not machine transitions;
  reopen paths; archived rejects `changeQuoteStatus`.
- **Audit tests:** correct events + old/new status + **no raw money in metadata** + item events carry
  item id/position/name only.
- **UI/component tests:** clickable rows, `StatusBadge` quote mapping, line-item editor, totals render.
- **Build/type:** `tsc --noEmit` clean; `next build` clean.
- **No-service-role-in-client**; **P5/P6/P7 regression** (full suite green, currently 137);
  `/api/leads`, `/api/checkout`, **Stripe/plans.ts/promo.ts unchanged**, old `/[locale]/admin`,
  marketing unaffected.

---

## 20. Manual smoke checklist

1. Create a quote for a company (optional contact/project) → `/app/quotes` shows it as `Draft`,
   number `Q-…`, total `CHF 0.00`.
2. Add a line via the catalog picker → name/price prefilled → subtotal/total update.
3. Add a manual line; edit quantity/unit_price → totals recompute; set discount + "+8.1% VAT" → total
   = subtotal − discount + tax.
4. Reorder + remove a line → positions + totals update; History shows the line events.
5. Status `draft → sent → accepted` (confirm) → reopen `accepted → draft`; try an illegal jump →
   blocked; set `expired` manually.
6. Archive (type the number) → "Show archived" reveals → read-only except Restore → restore → Draft.
7. Filters (status/company) + search + pagination work.
8. Permission checks: `sales` can create/update/send/accept but no Archive; `read_only` view-only;
   Quotes nav hidden without `quotes.read`.
9. History timeline shows quote + line events; money before/after only for `audit.read_technical`.
10. `/app/catalog`, `/app/projects`, `/app/companies`, `/app/contacts`, `/app/users`, old `/admin`,
    checkout and marketing are unaffected.

---

## 21. Rollback plan

- **Code:** revert the P8 commit; the quotes module/routes/components + the Topbar link are self-
  contained.
- **Migration (greenfield):** `drop table public.quote_items; drop table public.quotes; drop sequence
  public.quote_number_seq;` + delete the seeded `permissions`/`role_permissions` rows (child first;
  see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Disable without rollback:** hide the Quotes nav + gate routes behind a flag (e.g.
  `QUOTES_ENABLED`); removing grants also hides it.
- **Data:** quotes never hard-delete (archive); line items are children of a droppable table.
- **Old `/admin` fallback:** unchanged.

---

## 22. Risks and open questions

1. **Naming (P8-D1)** — recommended "Quotes". Confirm.
2. **`quote_number` generation (P8-D4)** — sequence-based `Q-#####`, race-safe, unique. (No per-year
   reset in P8.) Confirm.
3. **Stored vs computed totals (P8-D5)** — recommended stored + `recalculateQuoteTotals`. Confirm.
4. **VAT/tax (P8-D6)** — simple stored `tax_amount` + 8.1% UI helper, **no engine**; or defer (default
   0). Decision.
5. **Discounts (P8-D7)** — flat quote-level `discount_amount`; or defer. Decision.
6. **Expiry** — **manual** in P8 (`valid_until` display-only); auto-expiry deferred. Confirm.
7. **Public acceptance + automated send** — deferred. Confirm.
8. **PDF/print** — **deferred** (the detail page is print-friendly; a dedicated PDF/print view is a
   cheap later follow-up). Or include a very lightweight print view now? Decision (lean: defer).
9. **Company/project detail Quotes section (P8-Q3)** — defer (lean) vs include now.
10. **`quotes.accept` role (P8-Q2)** — sales (lean) vs admin-only sign-off.
11. **Future accepted-quote → order/invoice** mapping — planning only; avoid finance overreach (no
    invoices/payments/Stripe/tax engine in P8).
12. **`quote_items` hard-delete (P8-D8)** — accepted as standard for mutable child rows (quotes stay
    soft-archived). Confirm.

---

## 23. Final readiness checklist

- **P8 spec ready:** **Yes** — greenfield `quotes` + `quote_items`, grounded in the live schema + repo
  + Master Plan; reuses the P5/P6/P7 patterns; the only genuinely new pieces are the line-item editor
  and the (pure, tested) totals math.
- **Blockers:** none. P7 is approved, so P8 is unblocked.
- **Decisions needed before build:** P8-D6 (tax: include simple stored vs defer), P8-D7 (discount:
  include vs defer), P8-Q2 (`quotes.accept`: sales vs admin-only), P8-Q3 (company/project Quotes
  section: defer vs include), PDF (defer vs lightweight). Plus confirm the defaults: P8-D1 "Quotes",
  P8-D2 company-required + optional same-company contact/project, P8-D3 snapshot catalog lines, P8-D4
  generated `quote_number`, P8-D5 stored totals, P8-D8 line-item hard-delete, P8-D10 defer
  `organization_id`; status `draft/sent/accepted/declined/expired/archived` (manual expiry,
  reopenable); permissions `quotes.read/create/update/send/accept/archive`; permission-gated read RLS.
- **Exact approval question:**

  > **Approve P8 Quotes Core as specified, with: greenfield `quotes` + `quote_items` (next migration
  > `0025`) at `/app/quotes`; company **required**, optional same-company contact + project,
  > snapshot-based optional catalog lines; generated `quote_number` (Q-#####); **stored** totals
  > (subtotal/discount/tax/total) recalculated server-side; status `draft/sent/accepted/declined/
  > expired/archived` (expiry manual, accepted/declined/expired reopenable, archive type-to-confirm);
  > permissions `quotes.read/create/update/send/accept/archive` granted admin=all, sales=read/create/
  > update/send/accept (no archive), others read-only; permission-gated read RLS; line items
  > hard-deleted on remove (quotes soft-archived); invoices/payments/Stripe/checkout/PDF/public-
  > acceptance/tax-engine all deferred. Do you approve, and do you accept the defaults or change P8-D6
  > (tax now vs defer), P8-D7 (discount now vs defer), P8-Q2 (`quotes.accept`: sales vs admin), P8-Q3
  > (company/project Quotes section now vs defer), or PDF (defer vs lightweight print view)?**

*Do not build. Do not create migrations. This document is the P8 Quotes / Proposals Core specification
only.*
