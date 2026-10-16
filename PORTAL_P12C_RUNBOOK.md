# PORTAL P12C — SUBSCRIPTION WEBHOOK RECONCILIATION — RUNBOOK

Status: **BUILT, awaiting review.** **Code-only — NO migration.** Scope: keep the P12A
`customer_subscriptions` registry in sync from `customer.subscription.*` webhook events, additively and
behind a flag, **without touching the legacy webhook/checkout path**. Authority: `PORTAL_P12C_SPEC.md` +
`AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI §VI.8. Default **off**.

## What shipped

- **Env flag** `env.enableSubscriptionWebhookSync` = `process.env.ENABLE_SUBSCRIPTION_WEBHOOK_SYNC === 'true'`
  (server-only, **default off**). When off, the registry branch is skipped and the webhook behaves exactly
  as before.
- **`src/app/api/stripe/webhook/route.ts`** — added `reconcileSubscriptionRegistry(event, supabase)`,
  called in `POST` **after** `handleSubscriptionEvent` for the three `customer.subscription.*` events, in
  its **own swallow-everything try/catch**. The legacy `subscriptions` mirror upsert, the
  `checkout.session.completed` handler + the **P11 invoice-payment guard**, signature verification, and the
  `{ received: true }` response are **unchanged**.
- **`src/modules/subscriptions/sync.ts`** — new server-only
  `reconcileRegistryFromStripeSubscription(sub, { eventId, eventType })`: maps the event's subscription
  object via **P12A `snapshotFromStripe` (no Stripe API call)**, updates **only** `customer_subscriptions`
  (Stripe snapshot fields + `sync_status`/`last_synced_at`/`updated_by=null`), **preserving** CRM links /
  notes / archive / created_by. Unknown subscription → **create an unlinked row** (auto-link a company only
  via the reliable `customers.stripe_customer_id → company_id` bridge when exactly one match exists).
- **Audit** — `subscription.webhook_synced`, `subscription.created_from_webhook`,
  `subscription.cancelled_from_webhook`, `subscription.webhook_sync_failed` (`source='webhook'`,
  `actorType='system'`, no user actor).

## Events handled

`customer.subscription.created` (create unlinked/bridge-linked row), `customer.subscription.updated`
(refresh snapshot, preserve CRM), `customer.subscription.deleted` (status → canceled). **Not handled:**
`customer.updated`, invoice events, payment events.

## Idempotency model

- The legacy `subscriptions` mirror upsert is **ungated and unchanged** (it was already naturally
  idempotent; the webhook did not use `stripe_events` before P12C).
- The **registry branch** dedups via `stripe_events`: it inserts `{ id: event.id, type }`; a unique
  violation (`23505`) means the event was already reconciled → **skip**. The registry upsert is idempotent
  regardless, so a duplicate that slips through is harmless.
- **Failures are swallowed** (logged + audited `subscription.webhook_sync_failed`) and **do not change the
  HTTP status** — the webhook returns 200 for the subscription path as before, so a registry hiccup never
  reverts/blocks the legacy mirror. **Eventual consistency** comes from the next `customer.subscription.*`
  event + **P12A manual sync** (the universal fallback).

## Security

The endpoint stays **Stripe-signature-verified only**; no new public endpoint/action. The webhook + helper
run as **service role**; the helper is `import 'server-only'`; **no Stripe secret client-side**. **No extra
Stripe API call** inside the webhook (the event object is mapped). Ordinary audit metadata = non-secret
Stripe ids + status + event_type + `source:'webhook'` — **no raw payload/amounts/secrets/error bodies**;
technical fields gated by `audit.read_technical`. `customer_subscriptions` keeps its **read-only**
permission-gated RLS; all writes are service-role. The registry helper **never writes the legacy
`subscriptions`/`customers`/`orders`/`payments`/`payment_links` or P10/P11 tables** (it only **reads**
`customers` for the company bridge) and **never mutates Stripe**.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 296 tests pass (incl. P12C webhook-reconcile source invariants + audit)
npm run build             # ✓ Compiled successfully (EXIT 0); /api/stripe/webhook built
```

**No DB change** → security advisors unchanged (6 INFO + 11 WARN baseline; nothing new). Leakage sweep:
the registry helper writes only `customer_subscriptions`; the webhook branch is flag-gated + isolated +
deduped; no `/api/checkout` change; the P11 guard + legacy mirror upsert are byte-for-byte intact.

## Manual smoke (Stripe **test mode**)

Set `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC=true` + a valid `STRIPE_WEBHOOK_SECRET`. Link a test subscription
(P12A). Via the Stripe Dashboard/CLI (`stripe trigger customer.subscription.updated`): trigger `…updated`
→ confirm `customer_subscriptions` updates and **CRM links/notes/archive are preserved**; set **cancel at
period end** in Stripe → confirm the registry flips; **cancel/delete** → registry status → canceled.
Confirm the **legacy `subscriptions` mirror still updates** each time; **redeliver** the same event → no
duplicate registry audit/write. Confirm **checkout still works**, **P12A manual sync still works**, **P12B2
execution still works** (its flag in test mode), and **old `/admin`** is untouched. Set the flag **off** →
confirm the registry branch is skipped while the legacy mirror still updates.

## Rollback

- **Code:** revert the P12C commit — the webhook branch, the `reconcileRegistryFromStripeSubscription`
  helper, the audit additions and the env flag revert together; the webhook returns to legacy-only.
- **No migration to roll back** (none added). **No Stripe rollback** (read/sync only).
- **Instant disable (no deploy):** set `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC` ≠ `true` → the branch is skipped;
  the legacy mirror + checkout continue unchanged.
- **Fallback:** P12A **manual sync** keeps the registry fresh without the webhook.

## Notes / follow-ups (deferred)

- **`customer.updated` + Stripe invoice/payment events** — out of scope (subscription-invoice ↔
  portal-invoice reconciliation is a future accounting phase).
- **Out-of-order delivery** — each event carries current state; the newest event + manual sync resolve any
  momentary regression (an optional recency check is deferred).
- **Legacy `subscriptions` mirror** — remains owned by the existing webhook code; a future backfill of the
  registry from legacy/Stripe is not P12C.
- **`stripe_events`** is an existing table not in the hand-maintained `database.ts`; the one dedup insert is
  locally typed (no `database.ts` change, no migration). The flag is unset by default — **enable in
  production only after the test-mode smoke passes**.
