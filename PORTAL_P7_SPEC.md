# PORTAL P7 — PRODUCTS & SERVICES CATALOG — TECHNICAL SPECIFICATION

Status: **SPEC ONLY — do not build, do not create migrations.** Awaiting approval.
Authoritative sources: `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI; the **live** Supabase schema
(`bkwwlmflsbhrsfwydbnv`) and current repo, which override theoretical names/assumptions (Part VI
§VI.1 rule 4). Written after inspecting both. Builds on P5 CRM Core + P6 Projects Core.

---

## 1. P7 objective

P7 introduces the **internal Products & Services Catalog only** — a single source of truth for what
amai sells (the base plans, add-ons and quote-based services), with status lifecycle, pricing
metadata, list/detail UI, create/edit/archive/restore, audit/history, permissions, tests and docs.
It is **Ring D** (Master Plan §3) and **prepares** later quotes, orders, subscriptions and invoices
**without building any of them**: no checkout/Stripe changes, no order/subscription wiring, no
invoices, no tax engine. Today the catalog is hardcoded in `src/lib/stripe/plans.ts` + the
`plan` CHECK on `orders`/`subscriptions`; P7 gives it a real table so a later phase can map to it.

---

## 2. Current-state dependency check (inspected; what exists live)

- **No catalog table exists.** Live inspection: zero tables matching `product|service|plan|catalog`.
  So P7 is **greenfield** (like P6).
- **"Products" live in code + enums today:**
  - `src/lib/stripe/plans.ts`: base plans **Starter 39 / Business 79 / Webshop 99 CHF/month**
    (recurring), `GOOGLE_ADS_ADDON_CHF = 200` (ab, monthly), `planPriceId()` → Stripe price ids
    (`env.stripePrice*`). Software & Applications = quote-based (routes to /kontakt).
  - `src/lib/promo.ts`: Logo + brand guidelines add-on **750 CHF one-time** (promo **450** active).
  - `orders.plan` and `subscriptions.plan` are a **text CHECK** = `starter|business|webshop`;
    `orders.amount_plan_chf`/`amount_addon_chf` record the charged CHF; `customers`/`payment_links`/
    `payments` hold the Stripe/billing state. *(Note: live amounts 39/79/99 supersede the older
    40/80/55 in `CLAUDE.md` — the live repo is authoritative.)*
- **Billing tables (out of scope to modify):** `orders` (plan, amounts, stripe_*), `subscriptions`
  (plan, period), `customers` (stripe_customer_id, company_id, statuses), `payment_links`, `payments`.
- **RBAC (live):** roles admin/analyst/sales/reviewer/read_only; `permissions` (id uuid, key, **module
  NOT NULL**, **label NOT NULL**) — **23 rows** across `audit, companies, contacts, org, projects,
  users`. **No catalog permissions yet.** Predicates `has_permission`, `is_platform_super_admin`, etc.
- **P5/P6 patterns to reuse:** generic `audit_logs` + `logEvent` + `audit_history()` RPC + display
  map; `StatusMachine`/`canTransition` + per-entity token mappers (`companyStatusToken`, …,
  `projectStatusToken`); P3.5/P5/P6 UI (`StatusBadge`, `EditableBlock`, `ConfirmDialog`, `rowLink`,
  History components, list filter/search/pagination, `*DetailActions`); module template
  `src/modules/{companies,contacts,projects}/*`; routes under `src/app/(portal)/app/(protected)/…`;
  service-role writes in `'use server'` actions; `requirePermission`/`hasPermission`.
- **P6 precedent:** the `projects` table uses **permission-gated read RLS** (`has_permission('…read')
  OR is_platform_super_admin()`) — P7 follows the same.
- **Migrations:** latest is `0023_projects`. **Next number = `0024`.**
- **`/[locale]/admin`:** untouched and stays untouched. No business-table rewrite needed.
- **Master Plan:** Ring D `products`; Part V status `draft`(draft)/`active`(done)/`retired`(cancelled,
  T); sketch perms `products.read/update`. P7 supersedes the `products` naming with `catalog_items` +
  the archive lifecycle (see §4/§5), justified below.

---

## 3. Scope boundaries

**In scope (P7):** a single `catalog_items` table; status lifecycle; pricing metadata (price,
currency, billing interval, item type, category, code); list/detail/create/edit/archive/restore UI;
`catalog.*` permissions + grants; audit/history; tests + docs/runbook.

**Out of scope (not built in P7):** invoices · quotes · payments · checkout rewrite · Stripe
integration changes (planning-only) · order/subscription/customer migration · finance dashboard ·
NDA/documents · external client portal · notification center · impersonation · MFA · role editor UI ·
org settings UI · `/admin` removal · business-table rewrite · hard deletes · project billing
automation · **public catalog exposure** · **tax/VAT engine** · **discount/promo logic** · linking
catalog items to projects/orders/subscriptions (planning-only, §13).

**Deferred to later phases:** category as a table; `organization_id`; `stripe_price_id` on the item;
promo/discount + tax columns; line-item/junction tables (`project_line_items`, `order_line_items`,
`subscription_items`); public catalog + checkout reading prices from the catalog.

---

## 4. Data model proposal

### Decision P7-D1 — one unified `catalog_items` table (greenfield)

**Recommended: a single `catalog_items` table with an `item_type` discriminator**, not separate
`products`/`services` tables and not reuse of any live table (none exists). Rationale: amai sells a
blend of recurring subscriptions, monthly services and one-time add-ons — the product/service line is
blurry, so a split would duplicate identical columns + UI. A unified table matches the Master Plan's
single `products` concept; the broader name **`catalog_items`** is more honest for a services
business. (The Master Plan's `products`/`products.read/update` sketch is superseded.)

### `catalog_items` columns

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid PK default gen_random_uuid()` | |
| `created_at` / `updated_at` | `timestamptz NOT NULL default now()` | + `touch_updated_at` trigger |
| `name` | `text NOT NULL` | e.g. "Starter", "Logo + brand guidelines" |
| `code` | `text NULL` | short SKU (e.g. `starter`, `logo`); **unique when present** (partial index). Enables future order/subscription/Stripe mapping (P7-D7) |
| `description` | `text NULL` | |
| `item_type` | `text NOT NULL default 'service'` | CHECK `subscription, service, addon, product` (P7-D5) |
| `category` | `text NULL` | free-text grouping (P7-D6) |
| `status` | `text NOT NULL default 'draft'` | CHECK `draft, active, inactive, archived` |
| `base_price` | `numeric(12,2) NULL` | **net / ex-VAT**, CHF; **null = "on request"** (quote-based) (P7-D2/D3) |
| `price_is_from` | `boolean NOT NULL default false` | the "ab / from" prefix (e.g. Google Ads "ab 200") |
| `currency` | `text NOT NULL default 'CHF'` | CHECK `('CHF')` for now (widen later) |
| `billing_interval` | `text NOT NULL default 'monthly'` | CHECK `monthly, yearly, one_time` (P7-D4) |
| `is_public` | `boolean NOT NULL default false` | **inert in P7** (no public catalog); future flag (P7-D10) |
| `archived_at` / `archived_by` | `timestamptz` / `uuid → profiles SET NULL` | |
| `created_by` / `updated_by` | `uuid → profiles SET NULL` | provenance |

Example seed-equivalents (illustrative — **no data seeded by the migration**): Starter (subscription,
monthly, 39, code `starter`), Business (…79…`business`), Webshop (…99…`webshop`), Google Ads (service,
monthly, 200, `price_is_from=true`, code `google_ads`), Software & Applications (service, monthly,
null price, `price_is_from=true`, code `software`), Logo + brand guidelines (addon, one_time, 750,
code `logo`).

### Justified decisions

- **P7-D2 — `base_price` nullable.** Some items are quote-based ("on request"); `price_is_from`
  captures "from/ab" pricing. Not every item has a fixed price, so price is **not required**.
- **P7-D3 — prices are NET (ex-VAT), CHF.** The marketing shows an ex-VAT (8.1%) note and amai is
  VAT-registered, so base prices are net; **VAT/tax handling is deferred** to the invoicing phase (no
  tax columns in P7).
- **P7-D4 — recurring metadata included, no automation.** `billing_interval` (`monthly/yearly/
  one_time`) is core catalog metadata and cheap; P7 stores it but performs **no billing/Stripe
  automation**.
- **P7-D5 — `item_type` enum.** `subscription/service/addon/product` (loose classification). *Open to
  simplification — P7-Q2.*
- **P7-D6 — `category` is a TEXT field**, not a table. The catalog is small; a `categories` table is
  over-engineering and deferred.
- **P7-D7 — `code` enables future mapping; no links built now.** `code` (unique-when-present) lets a
  later phase map a catalog item to `orders.plan`/`subscriptions.plan` and to Stripe price ids
  **without a rewrite**. P7 adds **no FK** to/from projects/orders/subscriptions (§13).
- **P7-D8 — pricing stored on the item** (no separate price-history table in P7). Price changes are
  captured in audit (`old_values`/`new_values`, technical-gated).
- **P7-D9 — defer `organization_id`** (single-org, consistent with P5/P6).
- **P7-D10 — include inert `is_public`** (single cheap boolean; future public catalog) — **or defer**
  (decision). It changes nothing in P7 (internal-only).

---

## 5. Product/service status model

`status` values → shared token, class, permission, confirm:

| Value | Token | Class | Permission to set | Confirm |
|---|---|---|---|---|
| `draft` | `draft` | entry, R | `catalog.update` | no |
| `active` | `done` | R (sellable) | `catalog.update` | no |
| `inactive` | `system` | R (not currently offered) | `catalog.update` | no |
| `archived` | `cancelled` | near-terminal, restorable | `catalog.archive` | **yes (type-to-confirm)** |

(`inactive` ≈ the Master Plan's `retired`, but **reversible** — reactivate to `active`.) Allowed
transitions (`catalogStatusMachine`, server-validated via `canTransition`): `draft↔active`,
`active↔inactive`, `inactive→active`, `draft→inactive`. `{any non-archived}→archived` and
`archived→draft` are the dedicated **archive/restore** actions, not `changeCatalogItemStatus`. No
side effects. Only archive requires a confirm (type-to-confirm); status changes are otherwise
confirm-free (low-stakes, reversible).

**Audit:** status moves emit `catalog.status_changed` (old/new); archive/restore emit
`catalog.archived`/`catalog.restored`.

---

## 6. Permissions model

New permissions (seeded with `module='catalog'` + label): `catalog.read`, `catalog.create`,
`catalog.update`, `catalog.archive`.

**Initial `role_permissions` grants (proposed — mirrors P5/P6):**

| Role | read | create | update | archive |
|---|---|---|---|---|
| `admin` (1) | ✓ | ✓ | ✓ | ✓ |
| `sales` (3) | ✓ | ✓ | ✓ | ✗ |
| `analyst` (2) | ✓ | ✗ | ✗ | ✗ |
| `reviewer` (4) | ✓ | ✗ | ✗ | ✗ |
| `read_only` (5) | ✓ | ✗ | ✗ | ✗ |

No role editor UI. **Open question P7-Q1:** the catalog holds **pricing** (more sensitive than CRM
data) — should create/update be **admin-only**? Default proposed: mirror P5/P6 (sales can create/
update); admin-only is the safer alternative if pricing should be locked down.

---

## 7. RLS / security model

- **Reads (P6 precedent):** create a **permission-gated** SELECT policy `catalog_items_select`
  `authenticated USING (has_permission('catalog.read') OR is_platform_super_admin())`. (Verified-safe
  pattern from P6: server queries use the service-role client and bypass RLS; the policy hardens
  direct PostgREST access. Every role holds `catalog.read`, so no functional change today.)
- **Writes:** **no client writes.** All create/update/status/archive/restore go through permission-
  gated `'use server'` actions using the service-role admin client; **no INSERT/UPDATE/DELETE RLS
  policies** are added.
- **Archived rows hidden by default** at the query layer (`archived_at is null` unless "Show
  archived"). **No hard deletes.**
- **Service-role / super-admin / audit:** unchanged from P5/P6 — service role bypasses RLS;
  `is_platform_super_admin()` retains read; audit technical fields stay gated by
  `audit.read_technical`; History reads the display-safe `audit_history()` RPC. **No service-role
  client in any client component** (enforced by test).

---

## 8. Migration plan

**Next number: `0024_catalog_items.sql`** (additive; `-- ROLLBACK:` notes; never edit an applied
migration — Part IV L2). Apply live via MCP, mirror to `supabase/migrations/`, regenerate
`src/lib/types/database.ts`.

Contents:
1. `create table public.catalog_items (...)` — all columns from §4, with the `status`,
   `item_type`, `billing_interval`, `currency` CHECKs, FKs (`archived_by`/`created_by`/`updated_by →
   profiles ON DELETE SET NULL`).
2. **Trigger:** `before update … execute function public.touch_updated_at()`.
3. **Indexes:** `status` (partial non-archived), `item_type`, `category`, `name`, and a **partial
   unique** index on `lower(code) WHERE code is not null`.
4. **RLS:** `enable row level security` + the `catalog_items_select` policy (§7). No write policies.
5. **Permissions seed:** the 4 `catalog.*` keys (`on conflict (key) do nothing`).
6. **role_permissions seed:** the §6 matrix (idempotent `not exists`).
7. **No changes to** `orders`/`subscriptions`/`payments`/`payment_links`/`customers` (or any business
   table). No data seeded.
8. `-- ROLLBACK:` `drop table public.catalog_items;` + delete the seeded `permissions`/
   `role_permissions` rows (greenfield → clean drop).

---

## 9. Server actions and queries

New module `src/modules/catalog/` mirroring P6 (`schema.ts` zod, `types.ts`, `status.ts` machine,
`queries.ts`, `actions.ts`, `guards.ts`). All actions are `'use server'`, service-role, and follow:
**zod validate → `requirePermission` → (status: `canTransition`) → DB write → `logEvent` →
`revalidatePath`**, returning typed safe errors.

**`queries.ts`:**
- `listCatalogItems({ q?, status?, itemType?, category?, showArchived?, page? })` → rows + count;
  filters `archived_at is null` unless `showArchived`; `q` over `name`/`code`/`description`; resolves
  the owner/creator name only if shown (catalog has no third-party PII).
- `getCatalogItem(id)` → the item.
- `listCatalogCategories()` (distinct non-null categories, for the filter dropdown).

**`actions.ts`:**
- `createCatalogItem(input)` — perm `catalog.create`; zod; **code uniqueness** checked (case-
  insensitive) before insert; `status='draft'`, `created_by`/`updated_by=actor`; audit
  `catalog.created`; redirect to the detail page.
- `updateCatalogItem(id, patch)` — perm `catalog.update`; zod; update name/code/description/item_type/
  category/base_price/price_is_from/currency/billing_interval/is_public; re-check code uniqueness;
  `updated_by=actor`; audit `catalog.updated` (metadata = changed field **names**; before/after in
  technical `old/new_values`).
- `changeCatalogItemStatus(id, to)` — perm `catalog.update`; `canTransition(catalogStatusMachine,…)`;
  reject if archived; audit `catalog.status_changed`.
- `archiveCatalogItem(id, confirmText)` — perm `catalog.archive`; type-to-confirm the item name; set
  `status='archived'`, `archived_at/by`; audit `catalog.archived` (severity `warning`).
- `restoreCatalogItem(id)` — perm `catalog.archive`; `archived → draft`; clear `archived_at/by`;
  audit `catalog.restored`.

**`guards.ts`:** pure predicates — `isLegalCatalogTransition(from,to)`, `confirmMatches(typed,
expected)`. Code-uniqueness is a DB-backed check in the action (not a pure guard).

---

## 10. UI / routes

### Naming (decision P7-D1 cont.): **`/app/catalog`** (single unified surface), not `/app/products`
+ `/app/services`. Justification: one table → one list; a product/service split would mean two routes
over the same data; "catalog" reads correctly for a services business.

Routes under `src/app/(portal)/app/(protected)/catalog/`:
- `/app/catalog` — list. Clickable rows (`rowLink`), `StatusBadge` (`entityType="catalog"`), columns:
  name (+code), type, category, **price** (formatted), status, updated. Filters: status, item_type,
  category (from `listCatalogCategories`), **"Show archived"**; search; pagination (25/page); empty
  state; "New item" (gated `catalog.create`).
- `/app/catalog/new` — create form.
- `/app/catalog/[id]` — detail (§11).
- **Topbar** gains a "Catalog" link, rendered only with `catalog.read`.

**Price display helper** (client-safe): `base_price` null → "On request"; else `${price_is_from ?
'from ' : ''}CHF {base_price} {billing_interval === 'one_time' ? 'one-time' : '/ ' + interval}`
(e.g. "from CHF 200 / month", "CHF 750 one-time"). No-dash copy rule respected.

Route protection: each page calls `requirePermission('catalog.read' | '.create')`.

---

## 11. Catalog detail page

Sections on `/app/catalog/[id]`:
- **Header** — item name + `StatusBadge` (catalog status) + **History button**
  (`audit_history('catalog_item', id)`).
- **Status control** — machine-driven transitions; gated `catalog.update`.
- **Item info** — `EditableBlock`: name, code, description, item_type, category, is_public.
- **Pricing** — separate `EditableBlock`: base_price, price_is_from, currency, billing_interval (with
  the formatted preview).
- **Danger zone** — Archive (type-to-confirm, `catalog.archive`); when archived, page is read-only
  except **Restore**.
- **Metadata** — created/updated, created_by/updated_by, archived_at/by when applicable.

---

## 12. Audit / history

Events (reuse `logEvent` → `audit_logs` → `audit_history()` → `HistoryTimeline`). Entity name:
**`entity_type='catalog_item'`**, event prefix **`catalog.*`** (unified, not product/service split):

| Event | severity | old/new status | notes |
|---|---|---|---|
| `catalog.created` | info | – | display name = item name; metadata `{ code }` if set |
| `catalog.updated` | info | – | metadata = changed field **names** |
| `catalog.status_changed` | info | ✓ | from→to |
| `catalog.archived` | warning | →`archived` | type-to-confirm |
| `catalog.restored` | info | `archived`→`draft` | |

- `entity_id` = item id; `old_status`/`new_status` on status/archive/restore.
- **Safe metadata:** changed field **names** (+ `code` on create). **Forbidden:** full price/field
  values in ordinary metadata, tokens, secrets. Full before/after (incl. price) only in technical
  `old_values`/`new_values` (gated by `audit.read_technical`). *(Catalog holds no third-party PII —
  it is internal product data — but the same "names-only in ordinary metadata" rule is kept.)*
- **Display:** add labels + colours to `src/lib/audit/display.ts` — `catalog.created`→"Catalog item
  created"/`done`, `catalog.updated`→"Catalog item updated"/`system`, `catalog.status_changed`→
  "Status changed"/`warning`, `catalog.archived`→"Catalog item archived"/`revoked`,
  `catalog.restored`→"Catalog item restored"/`done`.

---

## 13. Relationship with projects, orders and subscriptions (planning only)

P7 builds **no links**. Documented future mapping (no implementation, no FK, no migration):
- **Catalog → projects:** a future `project_line_items(project_id, catalog_item_id, qty,
  price_override)` junction (deliverables on a project). Not in P7.
- **Catalog → orders:** a future `order_line_items(order_id, catalog_item_id, …)`; today `orders.plan`
  is a text CHECK — a later phase maps `catalog_items.code` → `orders.plan` and reads amounts/Stripe
  ids from the catalog instead of `plans.ts`.
- **Catalog → subscriptions:** a future `subscription_items` / `subscriptions.catalog_item_id`; today
  `subscriptions.plan` is the same text CHECK, mappable by `code`.
- **Many-to-many?** Yes for orders/projects (a project/order can include several catalog items) — via
  the junction tables above, **deferred**.
- **No P7 link is implemented.** `catalog_items.code` is the only forward hook, and it is inert until
  a future phase wires it. This keeps P7 a harmless foundation with **no business-table change**.

---

## 14. Rate limiting / abuse

**No public endpoints.** The catalog is internal-only in P7 (`is_public` is inert); all actions are
authenticated, staff-only server actions behind `requirePermission`. **No new rate limit required.**
Public catalog exposure and any checkout change are **deferred**.

---

## 15. Legacy data / old admin (planning only)

- **No migration of `orders`/`subscriptions`/`customers`** in P7. No data movement. The hardcoded
  `plans.ts` amounts and the `plan` CHECK stay as-is; P7 does not change checkout.
- **Future mapping (documented):** `catalog_items.code in ('starter','business','webshop',…)` ↔
  `orders.plan`/`subscriptions.plan`; base_price ↔ `amount_plan_chf`; a future `stripe_price_id`
  column ↔ `planPriceId()`. A later phase makes the catalog the single source of truth and wires
  checkout to it — own spec, not P7.
- **Old `/[locale]/admin` untouched.** No business-table rewrite. P7 adds only `/app/catalog`.

---

## 16. Files likely to create / update

**Migration:** `supabase/migrations/0024_catalog_items.sql`; regenerate `src/lib/types/database.ts`
(add the `catalog_items` table + a `CatalogStatus` alias); update `supabase/migrations/README.md`.

**Status:** `src/lib/status/colors.ts` (add `catalogStatusToken`); `src/modules/catalog/status.ts`
(`catalogStatusMachine`). `src/components/portal/ui/StatusBadge.tsx` (add `'catalog'` to
`StatusEntity` + `statusTokenFor`).

**Module:** `src/modules/catalog/{schema,types,status,queries,actions,guards}.ts` + a small client-safe
`price.ts` formatter (or inline in the components).

**Audit:** `src/lib/audit/display.ts` (add `catalog.*` labels + colours).

**Routes:** `src/app/(portal)/app/(protected)/catalog/{page,new/page,[id]/page}.tsx`.

**Components:** `src/components/portal/catalog/*` (table, form, detail-actions, price display).
Update `src/components/portal/shell/Topbar.tsx` (nav link).

**Tests:** `src/modules/catalog/catalog.test.ts`, a status-machine test, an audit-display test, a
`StatusBadge` catalog test, a price-formatter test, no-service-role-in-client assertions.

**Docs:** `PORTAL_P7_RUNBOOK.md`; update the Master Plan roadmap **after** build/approval.

---

## 17. Tests

- **Migration / RLS:** `catalog_items` exists with the right columns/CHECKs/FKs/indexes/trigger + the
  partial-unique `lower(code)`; permission-gated SELECT (deny without `catalog.read`, allow with) —
  same live-probe approach as P6; archived hidden at the query layer; service-role writes succeed; no
  client write path.
- **Permission matrix:** `sales` create/update not archive; only `admin` archives;
  analyst/reviewer/read_only read-only; non-permitted blocked from routes/actions.
- **Action tests:** create/update/status/archive/restore happy paths + permission-denied + not-found;
  type-to-confirm rejects a wrong string server-side; **duplicate `code` rejected**; quote-based
  (null price) accepted.
- **Status-transition tests:** legal transitions pass; illegal rejected; archive/restore not machine
  transitions; archived rejects `changeCatalogItemStatus`.
- **Audit tests:** correct `action` + `old_status`/`new_status` + metadata is field names (+code) only
  (no raw price/secret).
- **UI/component tests:** clickable rows; `StatusBadge` catalog mapping; `EditableBlock`; archived
  filter; **price formatter** ("On request" / "from CHF 200 / month" / "CHF 750 one-time").
- **Build/type:** `tsc --noEmit` clean; `next build` clean (macOS).
- **No-service-role-in-client** static check; **P5/P6 regression** (full suite green, currently 120);
  `/api/leads`, `/api/checkout`, old `/[locale]/admin`, marketing unaffected.

---

## 18. Manual smoke checklist

1. Create a catalog item (e.g. a fixed-price subscription) → appears in `/app/catalog` as `Draft`.
2. Create a quote-based item (null price, `price_is_from`) → list shows "On request" / "from …".
3. Edit info + pricing via the two `EditableBlock`s → persists; History shows `Catalog item updated`.
4. Change status `draft → active → inactive → active`; try an illegal jump → blocked.
5. Create a second item with a duplicate `code` → rejected.
6. Archive (type the item name) → leaves the default list → "Show archived" reveals it → read-only
   except Restore → Restore returns it as `Draft`.
7. Filters (status/type/category) + search + pagination work.
8. Permission checks: `sales` can create/update but has no Archive button; `read_only` sees lists
   read-only; the Catalog nav link is hidden without `catalog.read`.
9. History timeline renders catalog events; technical fields (incl. price before/after) only for
   `audit.read_technical`.
10. `/app/companies`, `/app/contacts`, `/app/projects`, `/app/users`, old `/admin`, and the marketing
    site are unaffected.

---

## 19. Rollback plan

- **Code:** revert the P7 commit; the catalog module/routes/components + the Topbar link are self-
  contained; no existing module changes behaviour.
- **Migration (greenfield):** `DROP TABLE public.catalog_items;` + delete the seeded `permissions`/
  `role_permissions` rows (documented down path). No other table touched. Never edit the applied
  migration — add a corrective one if needed (Part IV L2).
- **Disable without rollback:** hide the Catalog nav + gate routes behind a flag (e.g.
  `CATALOG_ENABLED`); removing grants also hides it.
- **Data:** P7 never hard-deletes; archive is reversible. Dropping the table is the only destructive
  step and only relevant during rollback (no other table references `catalog_items`).
- **Old `/admin` fallback:** unchanged throughout.

---

## 20. Risks and open questions

1. **Unified catalog vs products/services split (P7-D1)** — recommended unified `catalog_items`;
   split is heavier and duplicative.
2. **Pricing model (P7-D2/D3)** — recommended: `base_price` nullable, **net/ex-VAT**, `price_is_from`
   for "ab" pricing, currency CHF. Confirm.
3. **VAT/tax handling** — **deferred** (invoicing phase). No tax columns now.
4. **Recurring metadata (P7-D4)** — `billing_interval` included; **no billing automation**.
5. **`item_type` values (P7-Q2)** — proposed `subscription/service/addon/product`; could be simpler
   (e.g. `subscription/one_time/service`). Decision.
6. **Catalog write permission (P7-Q1)** — pricing is sensitive; sales-writable (consistent) vs
   admin-only. Decision.
7. **`is_public` flag (P7-D10)** — include inert now vs defer. Decision.
8. **Future Stripe/order/subscription mapping** — via `code` (+ a future `stripe_price_id`); planning
   only. Avoid finance overreach (no invoices, tax, discounts, or Stripe calls in P7).
9. **Promo/discount** — `promo.ts` stays; the catalog stores the regular `base_price` only; discount
   logic deferred.

---

## 21. Final readiness checklist

- **P7 spec ready:** **Yes** — greenfield `catalog_items`, grounded in the live schema + repo + Master
  Plan; reuses the P5/P6 patterns end-to-end.
- **Blockers:** none. P6 is approved, so P7 is unblocked.
- **Decisions needed before build:** P7-Q1 (catalog writes: sales vs admin-only), P7-Q2 (`item_type`
  values), P7-D10 (`is_public` include vs defer). Plus confirm the defaults: P7-D1 unified
  `catalog_items` + `/app/catalog`; P7-D2/D3 nullable net price + `price_is_from`; P7-D4
  `billing_interval`; P7-D6 category-as-text; P7-D7 `code` (no links built); P7-D8 permission-gated
  read RLS; P7-D9 defer `organization_id`; status `draft/active/inactive/archived`; perms
  `catalog.*`; audit `catalog.*` on `entity_type='catalog_item'`.
- **Exact approval question:**

  > **Approve P7 Products & Services Catalog as specified, with: a unified `catalog_items` table (next
  > migration `0024`, additive) at `/app/catalog`; `base_price` nullable + net/ex-VAT + `price_is_from`
  > + currency CHF; `billing_interval` (monthly/yearly/one_time); `item_type` (subscription/service/
  > addon/product); `category` as text; `code` (unique-when-present, no links built); status
  > `draft/active/inactive/archived` (archive = type-to-confirm); permissions `catalog.read/create/
  > update/archive` granted admin=all, sales=read/create/update, others read-only; permission-gated
  > read RLS; VAT/discounts/Stripe/order-subscription links all deferred. Do you approve, and do you
  > accept the defaults or change P7-Q1 (admin-only catalog writes?), P7-Q2 (`item_type` values), or
  > P7-D10 (`is_public` now vs defer)?**

*Do not build. Do not create migrations. This document is the P7 Products & Services Catalog
specification only.*
