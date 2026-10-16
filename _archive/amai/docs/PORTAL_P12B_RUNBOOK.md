# PORTAL P12B1 — SUBSCRIPTION CHANGE REQUESTS + PREVIEW — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0030` applied live (greenfield, additive). Scope: create
subscription **change requests** and run Stripe **upcoming-invoice previews**. Authority:
`PORTAL_P12B_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI §VI.8. Builds on P12A
(`customer_subscriptions`). **P12B1 performs NO Stripe writes and NO live execution. Stripe stays the
source of truth.** Live mutation (execute plan/quantity/cancel/pause/resume) is **P12B2 — deferred,
separate approval.**

## What shipped

- **Migration `0030_subscription_change_requests.sql`** (applied live) — `public.subscription_change_requests`
  (30 cols), RLS + permission-gated `subscription_change_requests_select`, **`subscriptions.request_change`
  + `subscriptions.preview_change`** (2 perms) + grants (**admin + sales** both; others none). Unique
  `idempotency_key`. The legacy `subscriptions`/`customers`/`orders`/`payments`/`payment_links`/
  `stripe_events`/`invoice_payments`/`invoice_payment_links`/`/api/checkout`/Stripe webhook are **not**
  modified.
- **Module** `src/modules/subscription-changes/*` (schema, types, status, guards, queries, actions) + a
  **server-only `stripe-mutations.ts` that, despite its name, contains READ/PREVIEW logic only**
  (`subscriptions.retrieve` + the upcoming-invoice preview).
- **Actions** (service-role, gated, audited): `createSubscriptionChangeRequest`, `previewSubscriptionChange`
  (plan/quantity only — **read-only Stripe**), `cancelSubscriptionChangeRequest`,
  `archiveSubscriptionChangeRequest`, `restoreSubscriptionChangeRequest`, `updateChangeRequestNotes`.
  **`executeSubscriptionChange` is a hard-disabled placeholder** that always returns a "P12B2 not enabled"
  error and never touches Stripe.
- **Routes** `/app/subscription-changes`, `/app/subscription-changes/[id]`; Topbar "Sub changes" (gated
  `subscriptions.request_change`); the **subscription detail** gains a **request-only action panel** +
  a change-requests list. **There is no Apply/Execute control anywhere.**
- **Audit** 7 emitted `subscription.change_*` events + the P12B2-reserved effect events (defined, not
  emitted).

## Schema (migration 0030)

`subscription_change_requests`: `id`, timestamps, `customer_subscription_id → customer_subscriptions
RESTRICT` (the P12A entry point), `company_id`/`contact_id → … SET NULL`, `stripe_subscription_id`,
`action_type` (CHECK: the 7 actions), `status` (CHECK draft/previewed/approved/**executing/executed
(P12B2-reserved)**/failed/cancelled/archived), `proration_behavior` (CHECK null/create_prorations/none/
always_invoice), `subscription_item_id`, request/approve/execute provenance + stamps, `request_payload`/
`preview_payload`/`result_payload`/`safe_summary` jsonb, `error_summary`, **unique** `idempotency_key`,
archive provenance, notes. RLS on with the permission-gated select policy; **no write policies**.

## Permission matrix (seeded by 0030)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `subscriptions.request_change` | ✓ | ✓ | — | — | — |
| `subscriptions.preview_change` | ✓ | ✓ | — | — | — |

(Sales + admin request + preview. **No execution permissions exist** — `subscriptions.change_plan/
change_quantity/cancel/pause/resume` are NOT seeded; they are P12B2. Viewing the list/detail needs
`subscriptions.read`, granted to all roles from P12A.)

## Status model

`draft`(draft) · `previewed`(waiting) · `approved`/`executing`(P12B2) · `executed`(done, P12B2) ·
`failed`(warning) · `cancelled`(cancelled) · `archived`(cancelled). P12B1 reaches only: draft → previewed
(after a successful preview) or draft → failed (preview error); draft/previewed → cancelled; previewed/
cancelled/failed → archived; **restore → cancelled** (inert). **`approved`/`executing`/`executed` are
never set by P12B1 code** (forward-compat for P12B2). Cancel/archive/restore are local-only; none touch
Stripe.

## Stripe preview (read-only)

Server-side only via `getStripe()`. Allowed: `subscriptions.retrieve` + the upcoming-invoice **preview**
(`invoices.retrieveUpcoming`, or `invoices.createPreview` on newer API versions — detected at runtime;
both are non-persisting reads). **Forbidden and absent:** `subscriptions.update`/`.cancel`/`.resume`,
`pause_collection`, price/quantity mutation, `checkout.sessions.*`, refunds, product/price/coupon
creation. Preview is for **change_plan / change_quantity** only; it resolves `plan_key → price` via
`plans.ts` (read-only); a **multi-item** subscription with no explicit `subscription_item_id`, or a
missing price id, **blocks the preview** with a clear message (not a failure). Stripe API errors set the
request `failed` + a sanitized `error_summary`. Preview is **advisory and time-sensitive** — it stores no
authoritative state and must be recomputed before any future P12B2 execution.

## Security

No client writes — all mutations through permission-gated `'use server'` actions (service role). The
Stripe preview helper is `import 'server-only'`; **no secret keys client-side** (a test asserts no
`STRIPE_SECRET`/`sk_`/`getStripe`/admin-client in the client components, and that the UI has **no
Apply/Execute control**). Reads are permission-gated RLS; **no write policies**. Ordinary audit metadata
carries field names + non-secret Stripe ids + action type only — **no amounts, no proration payload, no
Stripe error bodies, no secrets**; `preview_payload`/`result_payload` are billing-sensitive and gated by
`audit.read_technical`. **Rows are never hard-deleted** (archive). No new SECURITY DEFINER functions;
**zero new advisor findings**. The legacy `subscriptions` mirror, webhook and checkout are untouched.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 269 tests pass (incl. subscription-changes module + p12b UI)
npm run build             # ✓ Compiled successfully (EXIT 0); /app/subscription-changes[, /[id]] built
```

Live RLS probe (rolled back): permission-less `sub` → 0 rows on `subscription_change_requests`; admin → 1.
Advisors: 6 INFO + 11 WARN, **zero new** vs baseline. Leakage sweep: no Stripe write call anywhere in the
module, no legacy-billing-table write, no checkout reference; `executeSubscriptionChange` is provably
inert.

## Manual smoke checklist (Stripe **test mode**)

Link an existing Stripe subscription (P12A). As **admin** (or **sales**): open the subscription detail →
**Subscription actions** panel → **Request plan change** (pick a plan) → it creates a `draft` request and
opens the request detail → **Preview change** → the proration estimate appears and the request becomes
`previewed`; **confirm the Stripe subscription is unchanged**. Repeat for **quantity**. Create a
**cancel-at-period-end** request (no preview) → **confirm Stripe unchanged**. Confirm there is **no
Apply/Execute button anywhere**. Cancel a request; archive a previewed/failed request; restore it
(→Cancelled). As **read_only**: view the list/detail only; **no action panel**. Verify the history
timeline shows `change_requested`/`change_previewed`. Confirm `/api/checkout`, the Stripe webhook, the
legacy `subscriptions` mirror, old `/admin`, and P10/P11/P12A are unaffected.

## Rollback

- **Code:** revert the P12B1 commit — the subscription-changes module/routes/components, the action panel,
  the Topbar link, status/audit/database.ts additions revert together. **No Stripe writes to undo.**
- **Migration (greenfield):** `drop table public.subscription_change_requests;` + delete the 2 permissions
  + grants (see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **No Stripe rollback** needed — P12B1 makes no Stripe writes.
- **Disable without rollback:** remove the `request_change`/`preview_change` grants → the panel + nav
  disappear.
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

## Notes / follow-ups (deferred, NOT built)

- **P12B2 Execution** — wire `executeSubscriptionChange` to the live Stripe write APIs (update/cancel/
  resume/pause) — **admin-only, Stripe test-mode first, behind a config flag, with a fresh re-preview +
  drift check + type-to-confirm**, idempotency key = the request row id, then re-sync the P12A registry.
  Seed the execute permissions (`subscriptions.change_plan/change_quantity/cancel/pause/resume`). Specified
  in `PORTAL_P12B_SPEC.md`. **Build only after separate approval.**
- **P12C Webhook reconciliation** — keep `customer_subscriptions` synced from `customer.subscription.*`
  idempotently via `stripe_events`. Until then, the P12A manual sync keeps the registry fresh.
- **Pre-P12B2 verification (test mode):** confirm the installed SDK's upcoming-invoice preview method name
  (`retrieveUpcoming` vs `createPreview`) and `subscriptions.resume` behaviour for the account's API
  version. **Deferred:** company-page pending-changes indicator; `organization_id`. Next migration: `0031`.
