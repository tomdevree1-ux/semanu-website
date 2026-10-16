# PORTAL P9 — INVOICES CORE — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0026` applied live (greenfield, additive). Scope:
internal invoices + line items only. Authority: `PORTAL_P9_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI. Builds on P5 CRM + P6 Projects + P7 Catalog + P8 Quotes (the structural parent).

## What shipped

- **Migration `0026_invoices.sql`** (applied live) — `public.invoices` + `public.invoice_items` +
  `invoice_number_seq`, RLS + permission-gated select on both, `invoices.*` (7) permissions + grants
  (admin all; **sales read/create/update/issue** — no mark_paid/void/archive; others read). No
  business-table / checkout / Stripe / promo / quotes / catalog changes.
- **Module** `src/modules/invoices/*` (schema, types, status machine, queries, actions, guards, totals).
- **Status machine** `invoiceStatusMachine` (draft/issued/paid/overdue/void/archived).
- **Totals** — pure `totals.ts` (computeLine/computeInvoiceTotals/computeBalanceDue/round2/suggestedTax/
  formatMoney) + server-side `recalcTotals` in actions; **stored** subtotal/total/balance_due,
  recalculated on every change.
- **Create from quote** — `createInvoiceFromQuote` snapshots a quote's header + lines into a draft
  invoice; an additive **"Create invoice"** button on the quote detail page (gated `invoices.create`,
  prominent on accepted quotes).
- **Manual mark-paid / un-pay** — `mark_paid` sets `amount_paid = total`, `balance_due = 0`,
  `paid_at = now`; admin un-pay (`paid → issued`) clears them. No payments, no Stripe.
- **Routes** `/app/invoices`, `/app/invoices/new`, `/app/invoices/[id]`; Topbar "Invoices" (gated). The
  detail page has the **line-item editor** (catalog picker, inline edit, remove, reorder) + a totals
  editor (discount/tax + an 8.1% helper) — both **draft-only**.
- **Audit** 10 `invoice.*` events (labels/colours in `src/lib/audit/display.ts`).

## Schema (migration 0026)

`invoices`: `id`, timestamps, `invoice_number` (generated `INV-#####`, unique), `title`, `company_id
NOT NULL → companies ON DELETE RESTRICT`, `contact_id → company_contacts SET NULL`, `project_id →
projects SET NULL`, `quote_id → quotes SET NULL`, `status` (CHECK draft/issued/paid/overdue/void/
archived), `currency` (CHECK CHF), `subtotal`/`discount_amount`/`tax_amount`/`total_amount`/
`amount_paid`/`balance_due numeric(12,2)` (CHECK ≥ 0), `issue_date`, `due_date`, `paid_at`, `notes`,
`internal_notes`, archive provenance.
`invoice_items`: `invoice_id → invoices ON DELETE CASCADE`, `quote_item_id → quote_items SET NULL`,
`catalog_item_id → catalog_items SET NULL`, `position`, `name`, `description`, `quantity`(>0),
`unit_price`(≥0), `billing_interval`, `line_subtotal`/`line_total`. Triggers on both; unique
`invoice_number`; 9+4 indexes (incl. partial `due_date` for issued/overdue). RLS on both;
`invoices_select`/`invoice_items_select` = `has_permission('invoices.read') OR
is_platform_super_admin()`; **no write policies**.

**Untouched:** orders, subscriptions, customers, payments, payment_links, checkout, Stripe/plans,
promo, quotes/catalog/projects/companies/contacts schema, old `/[locale]/admin`.

## Permission matrix (seeded by 0026)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `invoices.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `invoices.create` | ✓ | ✓ | — | — | — |
| `invoices.update` | ✓ | ✓ | — | — | — |
| `invoices.issue` | ✓ | ✓ | — | — | — |
| `invoices.mark_paid` | ✓ | — | — | — | — |
| `invoices.void` | ✓ | — | — | — | — |
| `invoices.archive` | ✓ | — | — | — | — |

(Sales runs invoices up to **issue**; mark-paid, void and archive are admin-only — money-moving +
destructive. No role editor UI.)

## Status model

`draft`(draft) · `issued`(sent) · `paid`(done) · `overdue`(warning) · `void`(cancelled, terminal) ·
`archived`(cancelled). Transitions: draft→issued, issued→{paid,overdue,void}, overdue→{paid,void},
paid→issued (admin un-pay). `issued` needs `invoices.issue` + confirm; `paid` (and the paid→issued
un-pay) need `invoices.mark_paid` + confirm; `void` needs `invoices.void` + confirm; `overdue` is
**manual** (no cron), no confirm. **Once issued, the invoice is immutable** (line/money edits rejected;
only status moves + restore). Archive is a dedicated action **allowed only from draft or void**
(type-to-confirm the invoice number); restore → draft. No email/order/quote/payment/Stripe side
effects.

## Money / totals

CHF, net (ex-VAT). Per line: `line_subtotal = round(qty * unit_price)`, `line_total = line_subtotal`.
Invoice: `subtotal = Σ line_total`, `total = max(0, subtotal − discount + tax)`, `balance_due =
max(0, total − amount_paid)`. `discount_amount` is a flat quote-level field; `tax_amount` is stored
(an 8.1% UI helper fills it — **no tax engine**). `amount_paid`/`balance_due`/`paid_at` change only
through manual mark-paid / un-pay (all-or-nothing — **no partial payments**). Totals are **stored**
and recomputed server-side (`recalcTotals`) on every line/discount/tax/mark-paid change; the pure math
lives in `totals.ts` (unit-tested).

## Security

No client writes — all invoice + line-item mutations go through permission-gated `'use server'`
actions (service role). Reads are permission-gated at the route + the RLS policies. **Invoices are
never hard-deleted** (archive); **line items may be removed while draft** (audited). Audit:
`old_status`/`new_status` on status/archive/restore; ordinary metadata holds field NAMES + ids/
positions + invoice_number/company_id/quote_id only — **no commercial money values** (those go to
technical `old_values`/`new_values`, gated by `audit.read_technical`). No new SECURITY DEFINER
functions, no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 191 tests pass (incl. invoices totals 6 + module + p9 UI)
npm run build             # PASSES
```

Live RLS probe (rolled back): permission-less `sub` → 0 rows on `invoices` + `invoice_items`; admin →
1 + 1. Advisors: zero new findings (identical to the P5–P8 baseline).

## Manual smoke checklist

As admin: create an invoice for a company → `INV-…`, total `CHF 0.00`, `Draft`. Add a catalog line +
a manual line → subtotal/total/balance update. Edit a line; reorder; remove. Set discount + "+8.1%"
tax. **Create from an accepted quote** (button on the quote) → lines/totals/quote link copied. Status
`draft → issued` (confirm; issue date stamped; lines now read-only). `issued → paid` (confirm;
amount paid = total, balance 0, paid_at set). Un-pay `paid → issued` (admin, confirm). `issued →
overdue` (manual). `overdue → void` (confirm). Illegal transition blocked. Archive a **draft** (type
the invoice number) → "Show archived" reveals → restore. Try to archive an **issued** invoice → it is
blocked. Filters/search/pagination. As `sales`: create/update/**issue**, **no Mark-paid / Void /
Archive**. As `read_only`: view only; Invoices nav hidden without `invoices.read`. History shows
invoice + line + status events; money before/after only for `audit.read_technical`. Confirm
`/app/quotes`, `/app/catalog`, `/app/projects`, `/app/companies`, `/app/contacts`, `/app/users`, old
`/admin`, checkout and marketing are unaffected.

## Rollback

- **Code:** revert the P9 commit; the invoices module/routes/components + the Topbar link + the
  quote-detail button revert with it.
- **Migration (greenfield):** `drop table public.invoice_items; drop table public.invoices; drop
  sequence public.invoice_number_seq;` + delete the seeded `permissions`/`role_permissions` rows
  (child first; see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied
  migration.
- **Disable without rollback:** hide the Invoices nav + gate routes behind a flag; removing grants
  also hides it.
- **Data:** invoices never hard-delete (archive); line items are children of a droppable table.

## Notes / follow-ups

- **Future mapping (planning only):** a `paid` invoice → a future `payments` row
  (`invoices.company_id` ↔ `payments.company_id`/`customers.company_id`; `invoices.total_amount` ↔
  `payments.amount_chf`; a later additive `invoices.payment_id`/`stripe_*` links them). The
  `quote_id`/`quote_item_id` chain preserves quote → invoice → payment lineage for a future accounting
  export. Not built in P9.
- **Old `/[locale]/admin` untouched.** No business-table rewrite.
- **Deferred:** online payments, Stripe, checkout, payment/bank reconciliation, accounting export,
  PDF/print, e-sign, public invoice page, automated email, tax/VAT engine, per-line tax/discount,
  percentage discounts, recurring/subscription billing automation, order/subscription/customer
  migration, finance dashboard, NDA/documents, notifications, impersonation, MFA, role editor,
  org settings, company/project/quote detail "Invoices" sections, automatic overdue (cron),
  `refunded` status, `organization_id`.
- **Numbering:** continues cleanly from `0025`; next migration is `0027`.
