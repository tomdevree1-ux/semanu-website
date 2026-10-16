# PORTAL P11 — STRIPE PAYMENT LINKS (FROM INVOICES) — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0028` applied live (greenfield, additive). Scope:
generate a Stripe Checkout payment URL for an invoice; manual payment confirmation (via P10) stays
required. Authority: `PORTAL_P11_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI §VI.8. Builds on
P9 Invoices + P10 Payments. **This is the first phase that calls Stripe** — server-side only; the
legacy checkout/webhook subscription flow is untouched except one defensive guard.

## What shipped

- **Migration `0028_invoice_payment_links.sql`** (applied live) — `public.invoice_payment_links` (24
  cols), RLS + permission-gated `invoice_payment_links_select`, `payment_links.*` (4) perms + grants
  (admin all; **sales read/create/cancel**; others read). Unique `provider_checkout_session_id`; a
  **partial unique one-active-link-per-invoice** index. The legacy `payment_links`/`payments`/
  `stripe_events`/`orders`/`subscriptions`/`customers`/`/api/checkout` are **not** modified.
- **Module** `src/modules/payment-links/*` (schema, types, status machine, queries, actions, guards) +
  a **server-only `stripe.ts`** wrapping `getStripe()`.
- **Stripe Checkout Session** (`mode:'payment'`, ad-hoc `price_data` for the invoice `balance_due`,
  cents, metadata `kind:'invoice_payment'` + ids, idempotency key = the local row id) created by the
  new `createStripeCheckoutForInvoice` / `regeneratePaymentLink` actions.
- **Defensive webhook guard** — `/api/stripe/webhook` `handleCheckoutCompleted` early-returns when a
  session has no legacy `order_id` or `metadata.kind === 'invoice_payment'`, **before** the order/
  subscription/customer/email logic. (One additive line; legacy order behaviour unchanged.)
- **Routes** `/app/payment-links`, `/app/payment-links/[id]`; Topbar "Payment links" (gated). The
  invoice detail gains a **Payment links section** (generate / copy / open / cancel / regenerate + a
  stale flag). A minimal public **`/[locale]/payment`** success/cancel page (Stripe redirect target).
- **Audit** 9 `payment_link.*` events + invoice-side `invoice.payment_link_created` /
  `invoice.payment_link_cancelled`.

## Schema (migration 0028)

`invoice_payment_links`: `id`, timestamps, `invoice_id → invoices RESTRICT`, `company_id → companies
RESTRICT` (denormalized), `invoice_payment_id → invoice_payments SET NULL` (set when paid), `amount
numeric(12,2) > 0` (snapshot of balance_due), `currency` (CHF), `status` (CHECK draft/active/paid/
expired/cancelled/failed/archived), `provider` (CHECK stripe), `provider_payment_link_id`/
`provider_checkout_session_id`/`provider_payment_intent_id`, `url`, `expires_at`, `paid_at`/
`cancelled_at`/`failed_at`, archive provenance, notes/internal_notes. Trigger; indexes incl. unique
`provider_checkout_session_id` and **partial unique `(invoice_id) where status='active'`**; RLS on with
the permission-gated select policy; **no write policies**.

## Permission matrix (seeded by 0028)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `payment_links.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payment_links.create` | ✓ | ✓ | — | — | — |
| `payment_links.cancel` | ✓ | ✓ | — | — | — |
| `payment_links.archive` | ✓ | — | — | — | — |

(Sales generate + cancel links; archive admin-only. Confirming money is the admin-only P10
`payments.mark_succeeded`. No role editor UI.)

## Status model

`draft`(draft) · `active`(waiting) · `paid`(done) · `expired`(warning) · `cancelled`(cancelled) ·
`failed`(cancelled) · `archived`(cancelled). draft→active (Stripe session created) / draft→failed;
active→{paid,expired,cancelled,failed}. `cancelled`/`expired`/`failed`/`paid` are terminal. Cancel
needs `payment_links.cancel` + confirm. Archive is a dedicated action **only from cancelled/expired/
failed/paid** (type-to-confirm the invoice number); **restore → cancelled** (never re-activated).
Generating supersedes the prior active link (one active per invoice). No invoice payment-state mutation
on any transition; no automatic invoice status change.

## Stripe integration

Server-side only via `getStripe()` (secret key never client-side). A **Checkout Session**
(`mode:'payment'`) with one ad-hoc `price_data` line for the balance (`unit_amount = round(amount*100)`,
`currency:'chf'`), `success_url`/`cancel_url` → the minimal public `/{locale}/payment` page, metadata
`kind:'invoice_payment'` + invoice/company ids, idempotency key = the local row id. **P11 makes no other
Stripe calls** (no Payment Links API, no subscription/product work). The stored session/payment-intent
ids prepare a future reconciliation.

## Invoice / payment interaction (deferred webhook — manual confirm)

Generating a link **does not** change the invoice's `amount_paid`/`balance_due`/`status`. **Webhook
payment processing is deferred (P11-D10/D12):** when a link is paid, an admin records the succeeded P10
`invoice_payment` (the P10 recalc updates the invoice) and the link can be marked paid/linked. The
required **webhook guard** ensures a paid invoice session never triggers the legacy "subscription
active" email. Links can only be generated for **issued/overdue, non-archived invoices with
`balance_due > 0`** (draft/void/archived/fully-paid blocked). The link `amount` is a snapshot; if the
invoice balance changes it is flagged **stale** → regenerate.

## Security

No client writes — all mutations through permission-gated `'use server'` actions (service role). Stripe
runs server-side only; **no secret keys client-side** (a test asserts no `STRIPE_SECRET`/`sk_`/
`getStripe` in client components). The hosted **`url` is sensitive**: visible only to
`payment_links.read` holders, **never in audit metadata** (ordinary metadata holds field names + ids +
the non-secret session id only; no URL, no amounts). **Links/invoices/payments are never hard-deleted**
(archive). No new SECURITY DEFINER functions; no new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 235 tests pass (incl. payment-links module + p11 UI)
npm run build             # PASSES (EXIT 0)
```

Live RLS probe (rolled back): permission-less `sub` → 0 rows on `invoice_payment_links`; admin → 1.
Advisors: zero new findings (identical to the P5–P10 baseline). Leakage sweep: no Stripe-secret / legacy
billing-table mutation in the module; the webhook guard is the only existing-file change.

## Manual smoke checklist (Stripe **test mode**)

As **admin**: open an **issued** invoice with `balance_due > 0` → **Generate payment link** → an
`Active` row with a Stripe **test** URL; **Copy** + **Open** work; the invoice `amount_paid`/
`balance_due`/`status` are **unchanged**. Pay the test link → confirm the legacy "Abo ist aktiv" email
is **NOT** sent (guard). Record the succeeded payment via the P10 **Add payment → Mark succeeded** flow.
**Regenerate** (supersedes → previous `cancelled`, new `active`). **Cancel** an active link (confirm).
**Archive** a cancelled/expired/failed/paid link (type the invoice number) → Show archived → restore
(→`cancelled`). Try to generate on a **draft/void/archived/zero-balance** invoice → blocked. If the
balance changes, the active link shows a **stale** flag. Filters/search/pagination. As **sales**:
generate + cancel, **no archive**; as **read_only**: view only; nav hidden without `payment_links.read`.
Confirm `/api/checkout` (webshop) + the Stripe webhook order/subscription flow still work, old `/admin`,
and marketing are unaffected.

## Rollback

- **Code:** revert the P11 commit — the payment-links module/routes/components, Topbar link, the
  invoice-detail section, the public payment page, status/audit additions, and **the webhook guard**
  revert together.
- **Migration (greenfield):** `drop table public.invoice_payment_links;` + delete the 4 permissions +
  grants (see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Stripe-created links:** Checkout Sessions **expire on their own** (nothing to clean up); already-
  paid invoices keep their P10 `invoice_payments` (the record of truth) regardless of the link rows.
- **Disable without rollback:** hide the nav + the Generate button (remove grants / a flag). The
  webhook guard is harmless to keep.
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

## Notes / follow-ups (deferred)

- **Webhook reconciliation (future):** handle `checkout.session.completed` for `kind:'invoice_payment'`
  sessions in a new branch, idempotent via `stripe_events`, creating the P10 `invoice_payment` + recalc
  + setting the link `paid` — without touching the legacy order/subscription logic.
- **P12 Stripe Subscription Management** is the separate, higher-risk phase (out of scope).
- **Deferred:** durable Stripe Payment Links (alt provider path), partial-amount links, auto-expiry
  cron, `organization_id`. Numbering: next is `0029`.
