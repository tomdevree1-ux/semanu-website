# PORTAL P12B2 — SUBSCRIPTION CHANGE EXECUTION — RUNBOOK

Status: **BUILT, awaiting review.** Migration `0031` applied live (permission seed only). Scope:
**admin-only, flag-gated execution** of P12B1 change requests against live Stripe subscriptions, then an
immediate P12A registry sync. Authority: `PORTAL_P12B2_SPEC.md` + `AMAI_PORTAL_MASTER_PLAN.md` Parts
IV/V/VI §VI.8. **This phase writes to live Stripe.** It is OFF by default
(`ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS`), admin-only, and **test-mode-first**.

## What shipped

- **Migration `0031_subscription_execution_permissions.sql`** (applied live) — **permission seed ONLY**
  (no table/column change). Seeds `subscriptions.change_plan`, `subscriptions.change_quantity`,
  `subscriptions.cancel` + grants **to admin only**. `subscriptions.pause`/`subscriptions.resume` NOT
  seeded (pause/resume deferred).
- **Config flag** `env.stripeSubscriptionMutationsEnabled` = `process.env.ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS
  === 'true'` (default **off**). Execution hard-blocks when off; the UI hides/disables execute when off.
- **Server-only execute helper** `src/modules/subscription-changes/stripe-execute.ts` — `subscriptions.update`
  (item price/quantity, cancel_at_period_end) + `subscriptions.cancel`, **each with an idempotency key**;
  `retrieveForExecution` (read). **No** resume/pause_collection/checkout/refunds.
- **Registry resync** `src/modules/subscriptions/sync.ts` — `syncRegistryFromStripe` (retrieve → upsert
  the `customer_subscriptions` snapshot, **preserving CRM links/notes**), reused by P12A's sync action and
  by P12B2 after a successful execution.
- **Actions** — `executeSubscriptionChange` (real, gated) + `retrySubscriptionChange` (failed-only, fresh
  key) + the internal `performExecution` core + `getExecutableSubscriptionActions` query. The 5-action
  safe subset only: change_plan, change_quantity, cancel_at_period_end, undo_cancel_at_period_end,
  cancel_immediately.
- **UI** — the **request detail** (`/app/subscription-changes/[id]`) gains an Execution card: execute
  button visible only to an **admin with the execute permission + the flag on + an executable request**;
  plan/quantity confirm + "fresh preview runs at execution / proration may apply"; **cancel_immediately =
  type-to-confirm the `sub_…` id + no-automatic-rollback warning**; executed/failed result + **Retry** for
  failed; "execution disabled in this environment" when the flag is off; **no execute controls for
  sales/read_only**. The subscription-detail panel stays P12B1 request/preview only.
- **Audit** — `subscription.change_approved/change_executing/change_executed/change_failed` (request) +
  `subscription.plan_changed/quantity_changed/cancel_at_period_end_set/cancel_at_period_end_removed/
  cancelled/synced` (effect on the registry).

## Permission matrix (after 0031)

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `subscriptions.change_plan` | ✓ | — | — | — | — |
| `subscriptions.change_quantity` | ✓ | — | — | — | — |
| `subscriptions.cancel` (gates cancel_at_period_end / undo / cancel_immediately) | ✓ | — | — | — | — |

(Plus the P12B1 `request_change`/`preview_change` for admin+sales. **Execution also requires the flag.**
`subscriptions.pause`/`subscriptions.resume` are NOT seeded.)

## Execution flow (per request)

1. **Flag gate** (`ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS`) → else "execution disabled".
2. **Status gate** (`requestStatusExecutable`): plan/quantity from `previewed`/`approved`; cancel/undo/
   immediate from `draft`/`previewed`/`approved`; never from executing/executed/cancelled/archived;
   `failed` only via retry.
3. **Admin permission** for the action (`executePermissionFor` → `hasPermission`).
4. Load registry + verify the Stripe sub id matches; **cancel_immediately** → type-to-confirm the sub id.
5. **Live retrieve** + eligibility (mutable status) + item selection (single, or explicit
   `subscription_item_id`; multi-item without one → block); **already-at-target → block**.
6. **(plan/quantity) fresh re-preview** (never trust the stored P12B1 preview); update preview_payload/
   safe_summary.
7. Stamp `approved_*` (audit `change_approved`) → status `executing` (audit `change_executing`) → **Stripe
   write with idempotency key** (= request id; fresh `${id}:r…` on retry).
8. On success → `executed` + `executed_*` + `result_payload` (non-secret) + audit `change_executed` +
   the effect event → **`syncRegistryFromStripe`** (audit `subscription.synced`). On error → `failed` +
   `failed_at` + sanitized `error_summary` + `change_failed`.

## Stripe / proration

Server-side only via `getStripe()`. `subscriptions.update` for plan (item price), quantity (item
quantity), cancel_at_period_end (true/false); `subscriptions.cancel` for immediate. **Every write passes
`{ idempotencyKey }`.** `proration_behavior` default **`create_prorations`** (request may choose `none`;
`always_invoice` is DB-compatible but not exposed in the UI). **`billing_cycle_anchor` unchanged.** Plan
price resolved read-only via `plans.ts`; unknown/missing → block; trials/coupons read-only; **no local
proration calc, no accounting**.

## Security

No client writes — all execution through permission-gated `'use server'` actions (service role); the
write helper is `import 'server-only'`; **no secret keys client-side** (a test asserts no `STRIPE_SECRET`/
`sk_`/`getStripe`/admin-client in the client components). Execution is **double-gated** (flag + admin
permission) + confirm-gated. Ordinary audit metadata carries action type + non-secret Stripe ids only —
**no amounts, no proration/Stripe payloads, no error bodies, no secrets**; `result_payload`/`preview_payload`
gated by `audit.read_technical`. **No legacy-table write, no `/api/checkout`/webhook change** (grep-clean);
**no hard deletes**. Errors sanitized (strip `sk_…`, capped). Zero new advisor findings.

## Verification

```bash
npx tsc --noEmit          # clean
npx vitest run            # 287 tests pass (incl. P12B2 execution: guards + source invariants)
npm run build             # ✓ Compiled successfully (EXIT 0); /app/subscription-changes[, /[id]] built
```

Live: migration 0031 seeded 3 admin-only perms (0 non-admin grants); pause/resume absent. Advisors: 6 INFO
+ 11 WARN, **zero new** (no new table). Leakage sweep: the only Stripe writes are in the server-only
`stripe-execute.ts` (each idempotency-keyed); `actions.ts` has no direct `.subscriptions.update/.cancel`/
`getStripe`; no legacy-table writes; no checkout/webhook change.

## Manual smoke checklist (Stripe **test mode** only)

Set `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS=true` in a **test-mode** environment. Create a **disposable**
test subscription, link it (P12A), create + preview a plan-change request (P12B1). As **admin**: open the
request detail → **Execute** → confirm the **Stripe subscription changed** + the **registry synced**.
Repeat for **quantity**. **Set cancel_at_period_end** → confirm in Stripe; **undo** it. **Cancel
immediately** on a disposable sub (type-to-confirm the sub id) → confirm cancelled + synced. Trigger a
**failure** (bad price/invalid state) → `failed` + sanitized error → **Retry** after fixing. Confirm
**sales/read_only have no execute control** and execution is rejected if attempted. Turn the flag **off**
→ confirm execution is disabled. Confirm `/api/checkout`, the Stripe webhook (legacy `subscriptions` mirror
still updates), old `/admin`, and P10/P11/P12A/P12B1 are unaffected.

## Rollback

- **Code:** revert the P12B2 commit — `executeSubscriptionChange` reverts to the disabled placeholder; the
  execute helper, sync helper, UI execution card and the flag getter revert together.
- **Migration `0031` (perm seed):** delete the 3 perms + admin grants (see the `-- ROLLBACK:` lines). No
  table/legacy change.
- **Instant disable (no deploy):** set `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` ≠ `true` (or remove the admin
  execute grants) → execution is impossible; the UI falls back to P12B1 request/preview.
- **No guaranteed Stripe rollback** for an executed mutation — correct it in the **Stripe Dashboard** (e.g.
  re-activate / set the prior price) and re-sync the registry (P12A sync).
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

## Notes / follow-ups (deferred, NOT built)

- **pause_collection / resume_collection** — deferred (semantics + the `resume` API are API-version-
  sensitive); their `subscriptions.pause`/`subscriptions.resume` perms are NOT seeded.
- **P12C Webhook reconciliation** — keep `customer_subscriptions` synced from `customer.subscription.*`
  idempotently via `stripe_events`. **No webhook change in P12B2** (the webhook writes only the legacy
  `subscriptions` mirror, not the registry, so there is no conflict with the post-execution sync).
- **Before enabling the flag in production:** in **test mode**, verify the installed SDK's upcoming-invoice
  preview method + the exact `subscriptions.update` item-change shape for the account's API version. Next
  migration: `0032`. The legacy `subscriptions`/`customers`/`orders`/checkout/webhook + P10/P11 are
  unchanged.
