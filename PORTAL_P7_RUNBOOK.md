# PORTAL P7 — PRODUCTS & SERVICES CATALOG — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0024` applied live (greenfield, additive). Scope:
the internal catalog only. Authority: `PORTAL_P7_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md` Parts
IV/V/VI. Builds on P5 CRM + P6 Projects.

## What shipped

- **Migration `0024_catalog_items.sql`** (applied live) — creates `public.catalog_items`, RLS +
  permission-gated select policy, `catalog.*` permissions + role grants (**admin-only writes**).
  No business-table / checkout / Stripe / promo changes.
- **Module** `src/modules/catalog/*` (schema, types, status machine, queries, actions, guards, price
  formatter).
- **Status machine** `catalogStatusMachine` (draft/active/inactive/archived).
- **Routes** `/app/catalog`, `/app/catalog/new`, `/app/catalog/[id]`; Topbar "Catalog" nav (gated).
- **Audit** `catalog.*` events (labels/colours in `src/lib/audit/display.ts`).

## Schema (migration 0024)

`public.catalog_items`: `id`, `created_at`, `updated_at` (+`touch_updated_at` trigger), `name NOT
NULL`, `code` (unique `lower(code)` when present), `description`, `item_type` (CHECK
`subscription|service|addon|product`), `status` (CHECK `draft|active|inactive|archived`, default
`draft`), `category`, `base_price numeric(12,2)` net/nullable (CHECK `>= 0`), `currency` (CHECK
`'CHF'`), `price_is_from`, `billing_interval` (CHECK `monthly|yearly|one_time`, default `one_time`),
`setup_fee numeric(12,2)` (CHECK `>= 0`), `is_public` (inert), archive + created/updated provenance.
Indexes: `status` (partial non-archived), `item_type`, `category`, `name`, `billing_interval`,
unique `lower(code)`. RLS on; `catalog_items_select` = `authenticated USING (has_permission(
'catalog.read') OR is_platform_super_admin())`; **no write policies**.

**Untouched:** orders, subscriptions, customers, payment_links, payments, checkout routes, Stripe
plan code, promo code, projects, companies, contacts, old `/[locale]/admin`.

## Permission matrix (seeded by 0024 — admin-only writes, P7-Q1)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `catalog.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `catalog.create` | ✓ | — | — | — | — |
| `catalog.update` | ✓ | — | — | — | — |
| `catalog.archive` | ✓ | — | — | — | — |

(Pricing is sensitive → catalog writes are admin-only; everyone else read-only. No role editor UI.)

## Status model

`draft`(draft) · `active`(done) · `inactive`(system) · `archived`(cancelled). Transitions (server-
validated via `canTransition`): draft↔active, active↔inactive, inactive→active. No status change
needs a confirm; archive is the only confirm (type-to-confirm) and is a dedicated action; restore
returns to `draft`.

## Pricing model

Net (ex-VAT), CHF. `base_price` nullable → "Price on request"; `price_is_from` → "From CHF …";
`billing_interval` → "per month" / "per year" / "one time"; optional `setup_fee`. **No VAT engine,
no discounts/promo, no Stripe — `promo.ts` and `plans.ts` are untouched.** `code` is a forward hook
for a future order/subscription/Stripe mapping (no links built in P7).

## Security

No client writes — all create/update/status/archive/restore go through admin-only permission-gated
`'use server'` actions (service role). Reads are permission-gated at the route (`requirePermission`)
and the RLS policy. Archived rows hidden by default. Audit: `old_status`/`new_status` on status/
archive/restore; ordinary metadata = changed field **names** only (no commercial price values); full
before/after only in technical `old_values`/`new_values` (gated by `audit.read_technical`). No hard
deletes. No new SECURITY DEFINER functions, no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 137 tests pass (incl. catalog 11 + p7_catalog 6)
npm run build             # PASSES (98 static pages; catalog routes are dynamic)
```

## Manual smoke checklist

As admin: create an item → appears in `/app/catalog` as `Draft`; create one with a blank price →
"Price on request"; create one with `price_is_from` → "From CHF …"; edit info + pricing via the two
EditableBlocks; duplicate `code` → rejected; change status `draft → active → inactive → active` (try
an illegal jump = blocked); archive (type the name) → "Show archived" reveals → restore → Draft;
filters (status/type/billing/category) + search + pagination. As `sales`/`read_only`: catalog is
**view-only** (no New/Edit/Archive). Confirm `/app/projects`, `/app/companies`, `/app/contacts`,
`/app/users`, `/app/profile`, old `/admin`, checkout and the marketing site are unaffected.

## Rollback

- **Code:** revert the P7 commit; the catalog module/routes/components + the Topbar link revert with
  it. No existing module changed.
- **Migration (greenfield):** `DROP TABLE public.catalog_items;` + delete the seeded `permissions`/
  `role_permissions` rows (see the `-- ROLLBACK:` lines in `0024_catalog_items.sql`). Clean drop — no
  other table references `catalog_items`. Never edit the applied migration; add a corrective one.
- **Disable without rollback:** hide the Catalog nav + gate routes behind a flag; removing grants
  also hides it.
- **Data:** never hard-deletes; archive reversible.

## Notes / follow-ups

- **`is_public` is inert/internal metadata in P7** — there is no public catalog. Public exposure is a
  later phase.
- **Future mapping (planning only):** `catalog_items.code in ('starter','business','webshop',…)` ↔
  `orders.plan`/`subscriptions.plan`; `base_price` ↔ `amount_plan_chf`; a future `stripe_price_id`
  ↔ `planPriceId()`. A later phase makes the catalog the single source of truth and wires checkout to
  it. **Not built in P7.**
- **Deferred:** quotes, orders, invoices, payments, Stripe wiring, finance dashboard, VAT/tax engine,
  discount/promo engine, category-as-table, `organization_id`, catalog↔project/order/subscription
  links, public catalog.
- **Old `/[locale]/admin` remains untouched.** No business-table rewrite.
- **Numbering:** continues cleanly from `0023`; next migration is `0025`.
```
