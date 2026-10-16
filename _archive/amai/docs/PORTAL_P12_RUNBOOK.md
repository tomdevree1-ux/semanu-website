# PORTAL P12A — STRIPE SUBSCRIPTION REGISTRY / READ & LINK / MANUAL SYNC — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0029` applied live (greenfield, additive). Scope: view,
link and **manually sync** existing Stripe subscriptions to CRM. Authority: `PORTAL_P12_SPEC.md` +
`AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI §VI.8. Builds on P5 CRM + P10/P11. **P12A is read/link/sync
only — it performs NO Stripe mutations and changes NO webhook/checkout logic.** Stripe remains the source
of truth for subscription state; the registry is a synced snapshot + CRM link.

## What shipped

- **Migration `0029_customer_subscriptions.sql`** (applied live) — `public.customer_subscriptions` (31
  cols), RLS + permission-gated `customer_subscriptions_select`, `subscriptions.*` (4) perms + grants
  (admin all; **sales read/link/sync**; others read). Unique `stripe_subscription_id`. The legacy
  `subscriptions` / `customers` / `orders` / `payments` / `payment_links` / `stripe_events` /
  `invoice_payments` / `invoice_payment_links` / `/api/checkout` / Stripe webhook are **not** modified.
- **Module** `src/modules/subscriptions/*` (schema, types, status, guards, queries, actions) + a
  **server-only `stripe.ts`** that only `retrieve`s/`list`s subscriptions (read-only).
- **Actions** (service-role, gated, audited): `linkExistingStripeSubscription`,
  `syncSubscriptionFromStripe`, `syncSubscriptionsForCustomer`, `updateSubscriptionNotes`,
  `updateSubscriptionCrmLinks`, `archiveSubscriptionLink`, `restoreSubscriptionLink`. **No mutation
  actions exist** (no change-plan/quantity/cancel/pause — those are P12B).
- **Routes** `/app/subscriptions`, `/app/subscriptions/[id]`, `/app/subscriptions/link`; Topbar
  "Subscriptions" (gated). The **company detail** gains a read-only **Subscriptions section**.
- **Audit** 7 `subscription.*` events (linked / link_updated / synced / sync_failed / updated / archived /
  restored).

## Schema (migration 0029)

`customer_subscriptions`: `id`, timestamps, **CRM links all nullable** (`company_id → companies SET
NULL`, `contact_id → company_contacts SET NULL`, `customer_id → customers SET NULL`), `stripe_customer_id`
(NOT NULL), `stripe_subscription_id` (NOT NULL, **unique**), `stripe_product_id`/`stripe_price_id`/
`plan_key`, the synced snapshot (`status` — **no strict CHECK**, `current_period_start/end`,
`cancel_at_period_end`, `cancelled_at`, `trial_start/end`, `quantity`, `currency`, `amount numeric(12,2)`,
`interval`, `metadata jsonb`), `last_synced_at` + `sync_status` (CHECK pending/synced/failed/stale),
archive provenance, notes/internal_notes. CHECKs on sync_status/quantity(>0)/amount(>=0)/interval. RLS on
with the permission-gated select policy; **no write policies**.

## Permission matrix (seeded by 0029)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `subscriptions.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `subscriptions.link` | ✓ | ✓ | — | — | — |
| `subscriptions.sync` | ✓ | ✓ | — | — | — |
| `subscriptions.archive` | ✓ | — | — | — | — |

(Sales link + sync; archive admin-only. **No `subscriptions.update`/`.cancel` perms exist — they are
P12B-only.** No role editor UI.)

## Status model

The registry mirrors the **raw Stripe status** (open set). StatusBadge tokens: `active`→done,
`trialing`/`paused`→waiting, `incomplete`/`past_due`/`unpaid`→warning, `incomplete_expired`/`canceled`→
cancelled, unknown→warning. **No local status machine; status only changes by syncing from Stripe.**
Internal archive is a separate `archived_at` flag (never overwrites the Stripe status). Restore clears
`archived_at` (the snapshot stays as last synced). `sync_status` (internal): pending → synced / failed.

## Stripe integration (read-only)

Server-side only via `getStripe()` (secret key never client-side). Allowed: `subscriptions.retrieve`
(link + sync one), `subscriptions.list` (sync a customer, paginated, page-capped). **Forbidden and
absent:** `subscriptions.update`/`.cancel`/resume/pause, price/quantity changes, `checkout.sessions.*`,
refunds. Linking validates the subscription exists in Stripe, derives the Stripe customer id, suggests a
CRM company via the `customers.stripe_customer_id → company_id` bridge, and writes the normalized
snapshot. **Sync refreshes Stripe-authoritative fields only — CRM links, notes and `archived_at` are
preserved** (the snapshot writer carries no CRM/notes columns).

## Security

No client writes — all mutations through permission-gated `'use server'` actions (service role). Stripe
runs server-side only; **no secret keys client-side** (a test asserts no `STRIPE_SECRET`/`sk_`/`getStripe`
in client components). Reads are permission-gated RLS (`subscriptions.read` or super-admin); **no write
policies**. Ordinary audit metadata carries field names + **non-secret** Stripe ids + status only — **no
amounts, no URLs, no secrets, no raw Stripe payload** (technical fields gated by `audit.read_technical`).
**Rows are never hard-deleted** (archive). No new SECURITY DEFINER functions; **zero new advisor findings**
(identical to the P5–P11 baseline). The legacy `subscriptions` mirror + webhook + checkout are untouched.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 253 tests pass (incl. subscriptions module + p12 UI)
npm run build             # ✓ Compiled successfully (EXIT 0); /app/subscriptions[, /[id], /link] built
```

Live RLS probe (rolled back): permission-less `sub` → 0 rows on `customer_subscriptions`; admin → 1.
Advisors: 6 INFO + 11 WARN, **zero new** vs baseline (`customer_subscriptions` has a policy → not flagged).
Leakage sweep: no Stripe-secret / no Stripe subscription mutation / no legacy-billing-table mutation in
the module; the legacy `subscriptions` table is never referenced by this module.

## Manual smoke checklist (Stripe **test mode**)

In Stripe test mode create a test customer + subscription. As **admin**: open **/app/subscriptions →
Link subscription**, paste the `sub_…` id → the registry row appears with status / plan / amount / period
read from Stripe; the company is auto-suggested from the Stripe customer (or left unlinked). Open the
detail → **Sync from Stripe** → `last_synced_at` updates; change the subscription in Stripe, re-sync → the
snapshot updates while the CRM links + notes are preserved. Edit **CRM links** + **Notes**. Open the
linked **company detail** → the **Subscriptions section** lists it. **Archive** (type the `sub_…` id) →
the Stripe subscription is **unchanged** → **Restore**. As **sales**: link + sync, **no archive**, **no
mutation controls exist**. As **read_only**: view only; the Subscriptions nav is hidden without
`subscriptions.read`. Confirm `/api/checkout` (webshop), the Stripe webhook order/subscription flow, the
legacy `subscriptions` mirror, old `/admin`, and P10/P11 all still work and are unaffected.

## Rollback

- **Code:** revert the P12A commit — the subscriptions module/routes/components, the Topbar link, the
  company-detail section, the status/audit/database.ts additions revert together. **No webhook/checkout
  change to revert.**
- **Migration (greenfield):** `drop table public.customer_subscriptions;` + delete the 4 permissions +
  grants (see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **No Stripe rollback** needed — P12A makes no Stripe writes.
- **Disable without rollback:** hide the nav + Link/Sync buttons (remove grants / a flag).
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

## Notes / follow-ups (deferred, NOT built)

- **P12B Subscription Mutations** — change plan/price, change quantity, cancel (now / at period end),
  pause/resume — admin-only, preview-before-apply, explicit proration, type-to-confirm, idempotency.
  Specified in `PORTAL_P12_SPEC.md` §10; **build only after separate approval**.
- **P12C Subscription Webhook Reconciliation** — extend the webhook (additively, idempotent via
  `stripe_events`) to keep the registry synced on `customer.subscription.*`; until then the registry is
  refreshed by **manual sync** and may be stale between syncs (`last_synced_at` is shown).
- **Deferred:** `organization_id`; linking subscription Stripe-invoices to portal invoices/payments;
  accounting/reconciliation. Numbering: next is `0030`.
