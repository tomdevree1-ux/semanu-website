# PORTAL P10 — PAYMENTS / STRIPE BRIDGE CORE — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0027` applied live (greenfield, additive). Scope:
internal invoice-payment records only. Authority: `PORTAL_P10_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8. Builds on P9 Invoices. **No Stripe calls; the legacy `payments` table and the
Stripe webhook/checkout are untouched.**

## What shipped

- **Migration `0027_invoice_payments.sql`** (applied live) — `public.invoice_payments` (24 cols),
  RLS + permission-gated `invoice_payments_select`, `payments.*` (7) permissions + grants (admin all;
  **sales read/create/update**; others read). The legacy `payments`/`payment_links`/`stripe_events`/
  checkout/Stripe are **not** modified.
- **Module** `src/modules/payments/*` (schema, types, status machine, queries, actions, guards, totals).
- **Status machine** `paymentStatusMachine` (pending/succeeded/failed/cancelled/refunded/archived).
- **Invoice payment-state** — `recalculateInvoicePaymentState(invoiceId)` sums **succeeded, non-archived**
  payments → invoice `amount_paid`/`balance_due`/`paid_at`; emits `invoice.payment_state_updated`.
  Never changes invoice status.
- **P9 guard** — `changeInvoiceStatus` blocks manual mark-paid (→ paid) and un-pay (paid → issued)
  when non-archived payments exist ("This invoice has payment records. Update payment records instead.").
- **Routes** `/app/payments`, `/app/payments/new`, `/app/payments/[id]`; Topbar "Payments" (gated). The
  invoice detail gains a **Payments section** (summary + payment list + "Add payment").
- **Audit** 5 `payment.*` events + the invoice-side `invoice.payment_state_updated`.

## Schema (migration 0027)

`invoice_payments`: `id`, timestamps, `invoice_id → invoices ON DELETE RESTRICT`, `company_id →
companies RESTRICT` (denormalized), `amount numeric(12,2) > 0`, `currency` (CHECK CHF), `status`
(CHECK pending/succeeded/failed/cancelled/refunded/archived), `method` (CHECK manual/bank_transfer/
cash/card/stripe/other), `provider` (CHECK manual/stripe/bank/other), Stripe **reference** fields
(`provider_payment_id`, `provider_checkout_session_id`, `provider_payment_intent_id`), soft
`legacy_payment_id`/`payment_link_id` (**uuid, no FK**), `paid_at`/`failed_at`/`refunded_at`, notes/
internal_notes, archive provenance. Trigger `invoice_payments_touch_updated_at`; 6 indexes (invoice/
company/status-partial/created_at/provider_pi-partial/provider_cs-partial); RLS on with
`invoice_payments_select = has_permission('payments.read') OR is_platform_super_admin()`; **no write
policies**.

**Untouched:** legacy `payments`, `payment_links`, `stripe_events`, `orders`, `subscriptions`,
`customers`, checkout + Stripe webhook routes, Stripe/plans/promo, old `/[locale]/admin`. The P9
`invoices` schema is unchanged (only its `amount_paid`/`balance_due`/`paid_at` rows are recomputed).

## Permission matrix (seeded by 0027)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `payments.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payments.create` | ✓ | ✓ | — | — | — |
| `payments.update` | ✓ | ✓ | — | — | — |
| `payments.mark_succeeded` | ✓ | — | — | — | — |
| `payments.refund` | ✓ | — | — | — | — |
| `payments.cancel` | ✓ | — | — | — | — |
| `payments.archive` | ✓ | — | — | — | — |

(**Record-then-confirm:** sales records a `pending` payment; an admin confirms it `succeeded`, refunds,
cancels or archives — all money-affecting actions are admin-only. No role editor UI.)

## Status model

`pending`(waiting) · `succeeded`(done) · `failed`(cancelled) · `cancelled`(cancelled) ·
`refunded`(warning) · `archived`(cancelled). Transitions: pending→{succeeded,failed,cancelled},
{failed,cancelled}→pending (reopen), succeeded→refunded. `succeeded` needs `payments.mark_succeeded`
+ confirm; `refunded` needs `payments.refund` + confirm; `cancelled` needs `payments.cancel` + confirm;
`failed`/reopen need `payments.update`. **Only `succeeded` non-archived payments count** toward the
invoice. Archive is a dedicated action **allowed only from pending/failed/cancelled/refunded** (a
succeeded payment must be refunded first); type-to-confirm the **invoice number**; restore → pending.
No Stripe/email/order side effects.

## Money / invoice payment-state

CHF, `amount > 0`. **Partial payments supported.** `amount_paid = round2(Σ succeeded non-archived)`;
`balance_due = max(0, total − amount_paid)` (**overpayment clamps at 0**, with an "overpaid by X"
hint); `paid_at` set when fully covered, cleared otherwise. **Recording a payment never auto-sets the
invoice status to `paid`** (deliberate admin action). The recalc runs on mark-succeeded / refund /
archive / restore; pending/failed/cancelled/refunded/archived payments do **not** count. **No partial
refunds, no fees, no ledger.**

## Security

No client writes — all payment mutations go through permission-gated `'use server'` actions (service
role). Reads are permission-gated at the route + the RLS policy. **Payments are never hard-deleted**
(archive). **No Stripe SDK, no Stripe API calls, no secrets** — `provider_*` are plain reference
columns. Audit: `old_status`/`new_status` on status/archive/restore; ordinary metadata holds field
NAMES + ids only — **no amounts, no provider secrets** (raw before/after gated by
`audit.read_technical`). No new SECURITY DEFINER functions, no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 216 tests pass (incl. payments totals 6 + module + p10 UI)
npm run build             # PASSES (EXIT 0)
```

Live RLS probe (rolled back): permission-less `sub` → 0 rows on `invoice_payments`; admin → 1.
Advisors: zero new findings (identical to the P5–P9 baseline). Leakage sweep: no Stripe-secret / legacy
billing-table references in the payments module.

## Manual smoke checklist

As **admin**: open an **issued** invoice → "Add payment" → record `CHF X` (`Pending`) → invoice
`amount_paid` unchanged. Mark **Succeeded** (confirm) → `amount_paid += X`, balance drops; invoice
status does **not** auto-become Paid. Add a **second partial** → sums. **Overpay** → "overpaid by" hint,
balance 0. **Refund** a succeeded payment (confirm) → amount_paid drops. Mark a pending payment
**Failed** / **Cancelled** → no count. Try to add a payment to a **void/archived** invoice → blocked.
On an invoice with payment records, the P9 **manual mark-paid is suppressed** (and blocked server-side
with a clear message). **Archive** a pending/failed/cancelled/refunded payment (type the invoice
number) → "Show archived" reveals → restore (→ Pending). Try to archive a **succeeded** payment →
blocked. Filters/search/pagination. As **sales**: record + edit a **pending** payment, **no
Mark-succeeded / Refund / Cancel / Archive**. As **read_only**: view only; Payments nav hidden without
`payments.read`. History: payment detail shows payment events; invoice history shows
`invoice.payment_state_updated`. Confirm `/app/invoices|quotes|catalog|projects|companies|contacts|
users|profile`, old `/admin`, **checkout and the Stripe webhook** are unaffected.

## Rollback

- **Code:** revert the P10 commit — the payments module/routes/components, Topbar link, status/audit
  additions, and the additive invoice-detail + P9-guard edits revert together.
- **Migration (greenfield):** `drop table public.invoice_payments;` + delete the 7 seeded permissions
  + grants (see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Invoice payment-state cleanup:** the recalc only wrote invoices that had payment records; after
  revert, P9's manual mark-paid is again the sole writer — re-set `amount_paid` via the P9 control on
  the few affected invoices if needed.
- **Disable without rollback:** hide the Payments nav + gate routes behind a flag; removing grants also
  hides it; the invoice-detail Payments section is gated on `payments.read`.
- **Old `/admin`** remains the untouched fallback.

## Notes / follow-ups (future, not built)

- **P11 Stripe Payment Links:** generate a link from an invoice (amount = `balance_due`), store the
  reference on a payment, webhook-confirm → flip the payment `succeeded` via this recalc.
- **Stripe reconciliation:** match `invoice_payments.provider_payment_intent_id` ↔ the legacy
  `payments.stripe_payment_intent`.
- **P12 Stripe Subscription Management:** the dedicated, higher-risk phase for changing existing Stripe
  subscriptions. Not here.
- **Deferred:** public payment page, checkout/webhook changes, partial refunds, fees, accounting export/
  ledger, automated email, `organization_id`, standalone (non-invoice) payments. Numbering: next is
  `0028`.
