# PORTAL P8 — QUOTES CORE — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0025` applied live (greenfield, additive). Scope:
internal quotes + line items only. Authority: `PORTAL_P8_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI. Builds on P5 CRM + P6 Projects + P7 Catalog.

## What shipped

- **Migration `0025_quotes.sql`** (applied live) — `public.quotes` + `public.quote_items` +
  `quote_number_seq`, RLS + permission-gated select on both, `quotes.*` (6) permissions + grants
  (admin all; sales read/create/update/send/accept, no archive; others read). No business-table /
  checkout / Stripe / promo / catalog changes.
- **Module** `src/modules/quotes/*` (schema, types, status machine, queries, actions, guards, totals).
- **Status machine** `quoteStatusMachine` (draft/sent/accepted/declined/expired/archived).
- **Totals** — pure `totals.ts` (computeLine/computeQuoteTotals/round2/suggestedTax/formatMoney) +
  server-side `recalcTotals` in actions; **stored** subtotal/total, recalculated on every change.
- **Routes** `/app/quotes`, `/app/quotes/new`, `/app/quotes/[id]`; Topbar "Quotes" (gated). The detail
  page has the **line-item editor** (add with catalog picker, inline edit, remove, reorder) + a totals
  editor (discount/tax + an 8.1% helper).
- **Audit** 9 `quote.*` events (labels/colours in `src/lib/audit/display.ts`).

## Schema (migration 0025)

`quotes`: `id`, timestamps, `quote_number` (generated `Q-#####`, unique), `title`, `company_id NOT
NULL → companies ON DELETE RESTRICT`, `contact_id → company_contacts SET NULL`, `project_id →
projects SET NULL`, `status` (CHECK draft/sent/accepted/declined/expired/archived), `currency`
(CHECK CHF), `subtotal`/`discount_amount`/`tax_amount`/`total_amount numeric(12,2)` (CHECK ≥ 0),
`valid_until`, `notes`, `internal_notes`, archive provenance.
`quote_items`: `quote_id → quotes ON DELETE CASCADE`, `catalog_item_id → catalog_items SET NULL`,
`position`, `name`, `description`, `quantity`(>0), `unit_price`(≥0), `billing_interval`,
`line_subtotal`/`line_total`. Triggers on both; unique `quote_number`; the indexes in §plan.
RLS on both; `quotes_select`/`quote_items_select` = `has_permission('quotes.read') OR
is_platform_super_admin()`; **no write policies**.

**Untouched:** orders, subscriptions, customers, payments, payment_links, checkout, Stripe/plans,
promo, catalog/projects/companies/contacts schema, old `/[locale]/admin`.

## Permission matrix (seeded by 0025)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `quotes.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `quotes.create` | ✓ | ✓ | — | — | — |
| `quotes.update` | ✓ | ✓ | — | — | — |
| `quotes.send` | ✓ | ✓ | — | — | — |
| `quotes.accept` | ✓ | ✓ | — | — | — |
| `quotes.archive` | ✓ | — | — | — | — |

(Sales runs quotes end-to-end; archive is admin-only. No role editor UI.)

## Status model

`draft`(draft) · `sent`(sent) · `accepted`(done) · `declined`(cancelled) · `expired`(warning) ·
`archived`(cancelled). Transitions: draft→sent, sent→draft, sent→{accepted,declined,expired},
{accepted,declined,expired}→draft (reopen). `sent` needs `quotes.send`; `accepted`/`declined` need
`quotes.accept` + a confirm; `expired` is **manual** (no cron); archive is type-to-confirm (the quote
number); restore → draft. No email/order/invoice/Stripe side effects.

## Money / totals

CHF, net (ex-VAT). Per line: `line_subtotal = round(qty * unit_price)`, `line_total = line_subtotal`.
Quote: `subtotal = Σ line_total`, `total = max(0, subtotal − discount + tax)`. `discount_amount` is a
flat quote-level field; `tax_amount` is stored (an 8.1% UI helper fills it but the stored value is
authoritative — **no tax engine**). Totals are **stored** and recomputed server-side (`recalcTotals`)
on every line/discount/tax change; the pure math lives in `totals.ts` (unit-tested).

## Security

No client writes — all quote + line-item mutations go through permission-gated `'use server'`
actions (service role). Reads are permission-gated at the route + the RLS policies. **Quotes are never
hard-deleted** (archive); **line items may be removed** (a draft edit, audited). Audit: `old_status`/
`new_status` on status/archive/restore; ordinary metadata holds field NAMES + ids/positions only —
**no commercial money values** (those go to technical `old_values`/`new_values`, gated by
`audit.read_technical`). No new SECURITY DEFINER functions, no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 161 tests pass (incl. totals 6 + quotes 13 + p8_quotes 6)
npm run build             # PASSES (100 static pages; quotes routes dynamic)
```

## Manual smoke checklist

As admin: create a quote for a company → `Q-…`, total `CHF 0.00`, `Draft`. Add a catalog line (name/
price prefilled) + a manual line → subtotal/total update. Edit a line; reorder; remove. Set discount
+ "+8.1%" tax → total = subtotal − discount + tax. Status `draft → sent → accepted` (confirm) →
reopen `accepted → draft`; `sent → declined` (confirm); `sent → expired` (manual). Archive (type the
quote number) → "Show archived" reveals → restore. Filters/search/pagination. As `sales`: create/
update/send/accept, **no Archive**. As `read_only`: view only; Quotes nav hidden without
`quotes.read`. History shows quote + line events; money before/after only for `audit.read_technical`.
Confirm `/app/catalog`, `/app/projects`, `/app/companies`, `/app/contacts`, `/app/users`, old
`/admin`, checkout and marketing are unaffected.

## Rollback

- **Code:** revert the P8 commit; the quotes module/routes/components + the Topbar link revert with it.
- **Migration (greenfield):** `drop table public.quote_items; drop table public.quotes; drop sequence
  public.quote_number_seq;` + delete the seeded `permissions`/`role_permissions` rows (child first;
  see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Disable without rollback:** hide the Quotes nav + gate routes behind a flag; removing grants also
  hides it.
- **Data:** quotes never hard-delete (archive); line items are children of a droppable table.

## Notes / follow-ups

- **Future mapping (planning only):** an **accepted** quote → an `order` (`quote_items` ↔ order line
  items; `catalog_items.code` ↔ `orders.plan`) → `subscription`/`invoice`. The snapshotted lines have
  everything a future "convert to order" needs — no rewrite. Not built in P8.
- **Old `/[locale]/admin` untouched.** No business-table rewrite.
- **Deferred:** invoices, payments, Stripe, checkout, PDF/print, e-sign, public acceptance, automated
  email, tax/VAT engine, per-line tax/discount, percentage discounts, accounting export,
  `quote_versions`, company/project detail Quotes section, accepted-quote → order conversion,
  `organization_id`, auto-expiry.
- **Numbering:** continues cleanly from `0024`; next migration is `0026`.
```
