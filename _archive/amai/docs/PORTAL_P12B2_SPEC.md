# PORTAL P12B2 — SUBSCRIPTION CHANGE EXECUTION — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8 + the live Supabase schema + current repo. Builds on **P12B1** (the
`subscription_change_requests` request/preview layer) and **P12A** (the `customer_subscriptions`
registry). **This is the first phase that writes to live Stripe subscriptions and can change real
customer billing** — so it is deliberately admin-only, flag-gated, test-mode-first, and re-preview-
guarded.

---

## 1. P12B2 objective

P12B2 lets an **admin** **execute** a previously created P12B1 change request: it re-previews (for
plan/quantity), applies the change to the Stripe subscription **server-side with an idempotency key**,
records the result on the request row, and **immediately re-syncs the P12A registry snapshot** from
Stripe. Stripe stays authoritative. Execution is impossible without the new admin-only execution
permission AND a server config flag; sales/analyst/reviewer/read_only can never execute.

---

## 2. Current-state dependency check (inspected live + repo)

- **P12B1 `subscription_change_requests`** (30 cols) is **live** and already carries every execution
  field: `status` (with **`approved`/`executing`/`executed`** reserved), `approved_by`/`approved_at`,
  `executed_by`/`executed_at`, `failed_at`, `result_payload`, `error_summary`, **unique `idempotency_key`**,
  `subscription_item_id`, `proration_behavior`, `request_payload`/`preview_payload`/`safe_summary`. **So no
  schema change to this table is needed** — only a permission seed.
- **P12B1 module** `src/modules/subscription-changes/*` — `previewSubscriptionChange` (read-only upcoming
  invoice), guards, status, audit; **`executeSubscriptionChange` is a hard-disabled placeholder** returning
  "P12B2 not enabled" → P12B2 replaces its body. The preview helper `stripe-mutations.ts` already wraps the
  upcoming-invoice preview (`retrieveUpcoming`/`createPreview` runtime-detected).
- **P12A `customer_subscriptions`** (31 cols) + **`syncSubscriptionFromStripe`** (server-side retrieve →
  upsert snapshot, preserving CRM links/notes) — **reused verbatim** for the post-execution sync.
- **Permissions:** `subscriptions.read/link/sync/archive` (P12A) + `subscriptions.request_change/
  preview_change` (P12B1). **The 5 execution keys are NOT seeded** (live-verified `exec_perms_absent =
  true`).
- **Legacy billing (must not be written):** `subscriptions` (8 cols, webhook-mirrored, id=Stripe sub id),
  `customers` (18), `orders` (19), `payments` (10), `payment_links` (13), `stripe_events` (3).
  **P10 `invoice_payments` (24) / P11 `invoice_payment_links` (24)** unrelated.
- **Stripe code:** `getStripe()` (server-only secret); `/api/checkout` (subscription Checkout);
  `/api/stripe/webhook` `handleSubscriptionEvent` upserts **only the legacy `subscriptions` mirror** on
  `customer.subscription.*` (it does **not** write the P12A registry — see §15); `plans.ts`
  (`planPriceId()` read-only); `promo.ts`.
- **Stripe SDK = 17.7.0**, no pinned `apiVersion`. Confirmed available: `subscriptions.update` (items[].
  price/quantity, `proration_behavior`, `billing_cycle_anchor`, `cancel_at_period_end`),
  `subscriptions.cancel`, `subscriptions.resume`, `pause_collection`, upcoming-invoice preview. **Preview
  method name + `subscriptions.resume`/`pause_collection` semantics are API-version-sensitive → must be
  verified in Stripe test mode.**
- **Config-flag precedent:** `env.portalEnabled` = `process.env.PORTAL_ENABLED === 'true'` — P12B2 adds
  `env.stripeSubscriptionMutationsEnabled` the same way (default **false**).
- **Migration numbering:** latest applied is `0030_subscription_change_requests`. **Next is `0031`** (a
  permission-seed migration only). **No conflict with old `/[locale]/admin`; no business-table rewrite.**

---

## 3. Scope boundaries

**In scope (P12B2):** execute **a safe subset of actions** — `change_plan`, `change_quantity`,
`cancel_at_period_end`, `undo_cancel_at_period_end`, `cancel_immediately` — via server-side
`subscriptions.update`/`.cancel`, **admin-only**, **flag-gated**, **re-preview for plan/quantity**,
**idempotency keys**, **type-to-confirm for `cancel_immediately`**; record the result on the request row;
**immediately sync the P12A registry**; a tiny additive migration (`0031`) seeding the 3 execution
permissions; execute/retry server actions; UI execute controls on the request detail; audit; tests; docs.

**Out of scope (P12B2):** **`pause_collection`/`resume_collection` execution** (deferred — §4); checkout
rewrite; `/api/checkout`; new checkout flow; public customer portal; **webhook reconciliation engine**;
invoice-payment reconciliation; accounting ledger/export; revenue recognition; refund automation; tax/VAT
engine; invoice PDF/email; role editor; org settings; `/admin` removal; business-table rewrite; hard
deletes; migration of legacy `orders`/`subscriptions`/`customers`; **direct writes to legacy
`subscriptions`/`customers`/`orders`/`payments`/`payment_links`/`stripe_events`**; product/price/coupon
creation.

**Deferred:** **`pause_collection`/`resume_collection`** (+ their `subscriptions.pause`/`subscriptions.resume`
perms) until their semantics + the `resume` API are verified in test mode; **P12C** webhook reconciliation
(auto-sync the registry from `customer.subscription.*`); multi-currency execution UX.

---

## 4. Safety recommendation

**Recommend: build P12B2 as test-mode-first, flag-gated, admin-only execution of the 5-action safe
subset; defer pause/resume.** Concretely:

1. **Server config flag** `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` (env getter, default **false**).
   `executeSubscriptionChange` returns a clear "execution disabled" error while off; the UI hides/disables
   execute when off. Ship dark; enable per-environment (Stripe **test mode** first).
2. **Admin-only execution.** Execution requires the per-action execute permission, granted **only to
   admin**. Sales/analyst/reviewer/read_only can never execute (they keep request/preview at most).
3. **Re-preview immediately before execute** for `change_plan`/`change_quantity` — never trust the stored
   P12B1 preview (§10).
4. **Idempotency key on every Stripe write** (§9).
5. **Type-to-confirm the `sub_…` id for `cancel_immediately`**; a standard confirm for the others; a
   prominent "Stripe will be changed (proration may apply)" + "no automatic rollback" warning.
6. **Safe subset only:** `change_plan`, `change_quantity`, `cancel_at_period_end`,
   `undo_cancel_at_period_end`, `cancel_immediately` (these map cleanly onto the single-item webshop subs
   and `subscriptions.update`/`.cancel`). **Defer `pause_collection`/`resume_collection`** — `pause_collection`
   behaviour (keep-active-but-stop-invoicing vs mark-paused) and `subscriptions.resume` availability are
   API-version-sensitive and need a separate, deliberate increment.

Grounded in the live code: the request row + statuses + idempotency field already exist (P12B1), the
preview helper already exists, and `syncSubscriptionFromStripe` already exists — so P12B2 is a focused,
auditable execution layer, not new infrastructure.

---

## 5. Migration decision

**A tiny additive migration `0031_subscription_execution_permissions` is required — to seed the execution
permissions only.** No table/column change (P12B1's `subscription_change_requests` already has
`executed_by`/`executed_at`/`approved_by`/`approved_at`/`failed_at`/`result_payload`/`idempotency_key` and
the `executing`/`executed` statuses). No legacy-table change.

`0031` seeds:
- `subscriptions.change_plan`, `subscriptions.change_quantity`, `subscriptions.cancel` (module
  `subscriptions`, labels) `on conflict (key) do nothing`.
- grants: **admin only** for all three (idempotent `not exists`). **No grants for sales/analyst/reviewer/
  read_only.**
- **Do NOT seed** `subscriptions.pause`/`subscriptions.resume` (deferred). `-- ROLLBACK:` deletes the 3
  perms + grants. Next migration after this is `0032`.

(`change_plan` gates `change_plan`; `change_quantity` gates `change_quantity`; **`subscriptions.cancel`
gates `cancel_at_period_end` + `undo_cancel_at_period_end` + `cancel_immediately`**.)

---

## 6. Permission model

| Permission | admin | sales | analyst | reviewer | read_only | gates |
|---|---|---|---|---|---|---|
| `subscriptions.request_change` (P12B1) | ✓ | ✓ | — | — | — | create request |
| `subscriptions.preview_change` (P12B1) | ✓ | ✓ | — | — | — | preview |
| **`subscriptions.change_plan`** | ✓ | — | — | — | — | execute change_plan |
| **`subscriptions.change_quantity`** | ✓ | — | — | — | — | execute change_quantity |
| **`subscriptions.cancel`** | ✓ | — | — | — | — | execute cancel_at_period_end / undo / cancel_immediately |
| *(deferred)* `subscriptions.pause` / `.resume` | — | — | — | — | — | not seeded in P12B2 |

**All execution is admin-only.** Execution requires the execute permission **in addition to** the flag.
Request/preview permissions are unchanged. **No role editor UI.**

---

## 7. Execution state model

Using the P12B1 statuses (`draft, previewed, approved, executing, executed, failed, cancelled, archived`):

- **Executable from:** `previewed` for `change_plan`/`change_quantity` (preview required); `draft` **or**
  `previewed` for `cancel_at_period_end`/`undo_cancel_at_period_end`/`cancel_immediately` (no preview
  needed). **Not executable** from `cancelled`/`archived`/`executed`/`executing`.
- **Approval:** **admin execution is approve+execute in one step** — no separate approver role. The action
  stamps `approved_by`/`approved_at` = the executing admin and emits `subscription.change_approved`
  immediately before flipping to `executing` (a momentary state), then `executed` or `failed`. (A distinct
  `approveSubscriptionChange` action is optional and **not** required for P12B2.)
- **executing/executed are now reachable** (they were P12B1-reserved). `executing` is set transactionally
  just before the Stripe call; `executed` on success (+ `executed_at`, `result_payload`); `failed` on error
  (+ `failed_at`, sanitized `error_summary`).
- **Retry:** a `failed` request may be retried by an admin → re-validates + (for plan/quantity) re-previews
  → uses a **fresh idempotency key** (`${id}:r${n}`) → `executing` → `executed`/`failed`. A double-submit of
  the **same** attempt reuses the stored key (Stripe idempotent replay; no double-apply).
- **Idempotency keys:** first execute uses `idempotency_key = request.id`; a deliberate retry increments an
  attempt suffix; the column stores the last key used. Status-token mapping is unchanged
  (`subscriptionChangeStatusToken`: executing→warning, executed→done, failed→warning).

---

## 8. Action execution model

All actions: gate the execute permission **+ flag**; load the request + its `customer_subscriptions` +
re-`retrieve` the Stripe subscription; verify eligibility against the **live** status; select the
subscription item (single, or explicit `subscription_item_id`; **block ambiguous multi-item**); call Stripe
with an idempotency key; on success → `executed` + `result_payload` + **`syncSubscriptionFromStripe`** +
audit (request event + effect event); on error → `failed` + sanitized `error_summary` + `change_failed`.
**Rollback is not automatic** (documented per action).

| | action | pre-status | re-preview | exec permission | confirm | Stripe call |
|---|---|---|---|---|---|---|
| **A** | `change_plan` | previewed | **yes** | `change_plan` | standard | `subscriptions.update(id,{items:[{id,price:targetPriceId}],proration_behavior})` |
| **B** | `change_quantity` | previewed | **yes** | `change_quantity` | standard | `subscriptions.update(id,{items:[{id,quantity}],proration_behavior})` |
| **C** | `cancel_at_period_end` | draft/previewed | no | `cancel` | standard | `subscriptions.update(id,{cancel_at_period_end:true})` (service continues to period end) |
| **D** | `undo_cancel_at_period_end` | draft/previewed | no | `cancel` | standard | `subscriptions.update(id,{cancel_at_period_end:false})` |
| **E** | `cancel_immediately` | draft/previewed | no | `cancel` | **type-to-confirm sub id** | `subscriptions.cancel(id)` — **destructive; flag-gated; warn no rollback** |
| **F** | `pause_collection` | — | — | *(deferred)* | — | **deferred** until semantics verified |
| **G** | `resume_collection` | — | — | *(deferred)* | — | **deferred** until `resume` API verified |

A/B: `proration_behavior` from the request (default **`create_prorations`**); `billing_cycle_anchor`
**unchanged**; **abort if re-preview shows the subscription already matches the target** (no-op) or is no
longer mutable. All five: **sync the registry after success**; never write a legacy table.

---

## 9. Stripe API model

Server-side only via `getStripe()` (secret never client-side; the helper stays `import 'server-only'`).

- **Reads:** `subscriptions.retrieve(id,{expand:['items.data.price']})` (eligibility + item selection);
  the upcoming-invoice **preview** (`invoices.retrieveUpcoming` / `invoices.createPreview`, runtime-
  detected — reused from P12B1) for the mandatory re-preview.
- **Writes:** `subscriptions.update(...)` (plan/quantity/cancel_at_period_end), `subscriptions.cancel(id)`
  (immediate). **Each write passes `{ idempotencyKey }`** (`request.id` or `${request.id}:r${n}` on retry).
- **Item selection:** single-item → the sole `items.data[0].id`; multi-item → require the request's
  `subscription_item_id`, else **block**. **plan_key → price** via `plans.ts` (read-only); unknown/missing
  price → **block** (no price/product/coupon creation).
- **Errors:** caught → `failed` + sanitized `error_summary` (strip `sk_…`, cap length, **no raw Stripe
  body**) + `change_failed`; **no secret/body logged**. **API-version compatibility:** the preview method +
  any resume/pause are verified in **test mode** before enabling the flag in an environment.

---

## 10. Re-preview / proration model

- **`change_plan`/`change_quantity` MUST re-preview immediately before execution.** Re-run the upcoming-
  invoice preview against the **current** subscription + the request's target, and compare:
  (a) the subscription is still in a mutable status; (b) the current item price/quantity still differs from
  the target (else the change was already applied → abort/no-op); (c) the proration result is well-formed.
  **Proceed only if the re-preview succeeds**; update `preview_payload` + `safe_summary` with the fresh
  result. Stored P12B1 previews are advisory only and are never trusted for execution.
- **Proration:** `proration_behavior` default **`create_prorations`**; **`none`** allowed if explicitly
  chosen on the request; **`always_invoice`** is in the DB CHECK but **hidden in the UI** in P12B2 (kept for
  future). **`billing_cycle_anchor` unchanged.** Trials/coupons surfaced read-only. **No local proration
  calculation; no accounting ledger.** Cancel/undo actions need no preview.

---

## 11. Server actions and queries

P12B2 lives in the existing `src/modules/subscription-changes/` module + a server-only execution helper
(`stripe-execute.ts`, distinct from the P12B1 read-only `stripe-mutations.ts`).

- **`executeSubscriptionChange`** (replaces the P12B1 placeholder) — `requireAuth()` → **flag check**
  (`env.stripeSubscriptionMutationsEnabled`, else "execution disabled") → **per-action execute permission**
  (admin) → load request (must be `draft`/`previewed` per action, non-archived) → for `cancel_immediately`,
  **type-to-confirm** the sub id → re-`retrieve` + eligibility check → **(plan/quantity) re-preview** →
  stamp `approved_*` + `change_approved` → set `executing` → Stripe write (idempotency key) → on success:
  `executed` + `executed_*` + `result_payload` (technical) + **`syncSubscriptionAfterExecution`** + audit
  request event (`change_executed`) + effect event (`plan_changed`/`quantity_changed`/`cancel_at_period_end_set`/
  `cancel_at_period_end_removed`/`cancelled`) + `subscription.synced`; on error: `failed` + `failed_at` +
  sanitized `error_summary` + `change_failed`. Revalidate the request + subscription + company pages.
- **`retrySubscriptionChange`** — admin + flag; only from `failed`; re-validates + re-previews (plan/quantity)
  + **fresh idempotency key**; otherwise identical to execute.
- **`getExecutableSubscriptionActions(requestId | customerSubscriptionId)`** — query: returns, per request/
  action, whether it is executable now (status + live eligibility + the viewer's execute permission + the
  flag), for UI gating.
- **`syncSubscriptionAfterExecution(customerSubscriptionId)`** — thin wrapper over P12A
  `syncSubscriptionFromStripe` (retrieve → upsert snapshot, preserving CRM links/notes), audited
  `subscription.synced`.
- *(optional)* **`approveSubscriptionChange`** — only if a separate approval step is later wanted; **not
  required** for P12B2 (admin execute auto-approves).

Each: zod validation, permission + flag checks, relationship checks (request ↔ registry ↔ Stripe), Stripe
idempotency, status effects, audit, path revalidation, sanitized errors. **No legacy-table writes; no
checkout call; rows never hard-deleted.**

---

## 12. UI / routes

Update `/app/subscription-changes/[id]` and the `/app/subscriptions/[id]` action panel:

- **Execute control** appears only when: viewer is **admin with the per-action execute permission**, **the
  flag is on** (server-computed boolean prop), and the request is in an executable status. Otherwise it is
  **hidden** (when the flag is off, show an "execution disabled in this environment" note instead).
- **Re-preview + confirm flow:** plan/quantity → show the fresh re-preview estimate → a final
  **ConfirmDialog** with "Stripe will be changed (proration may apply)". **`cancel_immediately`** →
  **type-to-confirm the `sub_…` id** + a prominent **"no automatic rollback"** warning.
- **Execution result** (executed/failed + sanitized error) + a **Retry** button for `failed` (admin + flag).
  **No execution controls for sales/analyst/reviewer/read_only** (they keep request/preview at most).
- Keep the existing P12B1 "request/preview only" affordances for non-admins. HistoryButton/Timeline show the
  new events. Routes/nav remain `requirePermission`-gated.

---

## 13. Audit / history

**Request-lifecycle events** (`entity_type='subscription_change'`, `entity_id`=request id):
`subscription.change_approved`, `subscription.change_executing`, `subscription.change_executed`,
`subscription.change_failed` (P12B1 labels already include approved/executed; add `change_executing` if
desired). **Effect events on the registry** (`entity_type='subscription'`, `entity_id`=
`customer_subscriptions.id`): `subscription.plan_changed`, `subscription.quantity_changed`,
`subscription.cancel_at_period_end_set`, `subscription.cancel_at_period_end_removed`,
`subscription.cancelled`, `subscription.synced` (and `paused`/`resumed` only if/when pause/resume ship).
All labels/colours already exist in `audit/display.ts` (P12B1 defined them).

- **Safe (ordinary) metadata:** action_type, request id, **non-secret** Stripe ids (sub/customer/price),
  old→new plan_key/quantity (small scalars), status. **Forbidden:** raw proration/upcoming-invoice payload,
  raw amounts, Stripe error bodies, secrets/tokens. Raw before/after + `result_payload`/`preview_payload`
  → technical fields gated by `audit.read_technical`. **A failed execution still audits (no secret).**

---

## 14. Relationship with P12A / P12B1 / P10 / P11

Execution targets a **P12B1 request**, which targets a **P12A `customer_subscriptions`** row; after a
successful Stripe mutation, the **P12A registry is synced from Stripe** (P12A sync, reused). P12B2 creates
**no invoices, no `invoice_payments` (P10), no `invoice_payment_links` (P11)**, and does not change them.
**No direct legacy DB writes.** The existing Stripe webhook may independently update the **legacy
`subscriptions` mirror** (§15); **P12C** later reconciles `customer.subscription.*` into the registry.

---

## 15. Legacy / webhook / checkout strategy

- **No `/api/checkout` change. No `/api/stripe/webhook` change — and no guard is required.** Grounded:
  `handleSubscriptionEvent` writes **only the legacy `subscriptions` mirror** (keyed by Stripe sub id); it
  does **not** write the P12A `customer_subscriptions` registry and has no order/email side-effect on the
  subscription path. So a P12B2 mutation's resulting `customer.subscription.updated`/`deleted` webhook
  correctly updates the legacy mirror (existing behavior) and **cannot conflict with** P12B2's own registry
  sync (different tables). *(Contrast P11, where the `checkout.session.completed` handler had an email
  side-effect that needed a guard — that path is unaffected here.)*
- **P12B2 never writes legacy `subscriptions`/`customers`/`orders` directly.** A Stripe mutation may trigger
  webhook events the existing code already handles; P12B2 does not interfere. **Future P12C** handles
  registry webhook reconciliation. If, during test-mode verification, a real conflict is observed (it should
  not be), the minimal mitigation is to rely on the manual P12A sync — still no webhook code change.

---

## 16. Money handling

- **Currency** from Stripe (snapshot after sync; webshop plans CHF). **Amounts are previews/snapshots —
  Stripe is authoritative.** Preview totals (`preview_payload`) are estimates; executed amounts
  (`result_payload`) come from the Stripe response. **Display preview vs executed distinctly.**
- **Proration** computed by Stripe (we choose `proration_behavior`, show the preview); **billing-cycle
  anchor unchanged**; **quantity** from the request; **tax/VAT** owned by Stripe (no local engine); rounding
  `round2` for display. **No accounting ledger, no revenue recognition, no automatic invoice creation.**

---

## 17. Rate limiting / abuse

**No public endpoints** — authenticated, admin-only, flag-gated, confirm-gated server actions. **Execution
reuses the P4 `checkRateLimit`** (per-admin/per-subscription) to prevent rapid repeated Stripe writes; the
**idempotency key** makes a double-submit a safe replay (no double-apply); the execute button is
**disabled while executing**. **Retry** is rate-limited + uses a fresh key. No background cron.

---

## 18. Tests

- **Permission/flag gating:** execute **blocked** for non-admin, blocked without the per-action execute
  permission, blocked when `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` is off, blocked when the request is not in
  an executable status.
- **Re-preview:** plan/quantity execution **recomputes the preview** and aborts on drift/no-op/ineligible.
- **Stripe mocking:** `change_plan` → `subscriptions.update` items[].price; `change_quantity` →
  items[].quantity; `cancel_at_period_end` → update `cancel_at_period_end:true`; `undo` → `false`;
  `cancel_immediately` → `subscriptions.cancel` — **each with `idempotencyKey`**; **no Stripe write when the
  flag is off / for non-admin**. Failure → `failed` + sanitized error (no secret/body).
- **Idempotency:** same key replays (no double-apply); retry uses a fresh key.
- **Registry sync after success** (P12A sync called; CRM links/notes preserved).
- **Source invariants:** **no legacy-table writes** (`subscriptions`/`customers`/`orders`/`payments`/
  `payment_links`/`stripe_events`), no `/api/checkout`/webhook change, no product/price/coupon creation, no
  hard deletes; no service-role/`getStripe`/secret in client components; **the destructive control is
  type-to-confirm + flag-gated**.
- **Regression:** P5–P12B1 + auth/profile/users/history + the **P12B1 preview path unchanged**; `npx tsc
  --noEmit`, `npx vitest run`, `npm run build`.

---

## 19. Manual smoke checklist (Stripe **test mode** only)

Set `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS=true` in a **test-mode** environment. Create a disposable test
subscription + link it (P12A) + a previewed plan-change request (P12B1). As **admin**: **Execute** the plan
change → confirm the **Stripe subscription changed** + the **registry synced** (new price/period). Execute a
quantity change. **Set cancel_at_period_end** → confirm Stripe shows it + service continues. **Undo** it.
**Cancel immediately** on a **disposable** test subscription (type-to-confirm) → confirm cancelled + synced.
Trigger a **failure** (e.g. bad price) → confirm `failed` + sanitized error + a working **Retry**. Confirm
**sales/read_only see no execute control** and the action is rejected if attempted. Turn the flag **off** →
confirm execution is disabled. Confirm `/api/checkout`, the Stripe webhook (legacy `subscriptions` mirror
still updates), old `/admin`, and P10/P11/P12A are unaffected.

---

## 20. Rollback plan

- **Code:** revert the P12B2 commit — `executeSubscriptionChange` reverts to the disabled placeholder; the
  execute helper, UI controls, and the flag getter revert together.
- **Permissions (migration `0031`, greenfield seed):** delete the 3 execute perms + admin grants (see the
  `-- ROLLBACK:` lines). No table/legacy change to undo.
- **Disable instantly without a deploy:** set `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` ≠ `true` (or remove the
  admin execute grants) → execution is impossible; the UI falls back to P12B1 request/preview.
- **No guaranteed Stripe rollback** for an executed mutation (a cancel/proration cannot be reverted by code).
  To correct, an admin performs a compensating change in the **Stripe Dashboard** (e.g. re-activate / set the
  prior price) and re-syncs the registry (P12A sync) — documented in the runbook.
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

---

## 21. Risks and open questions (defaults in **bold**)

1. **Real billing impact** — mitigated by flag-off-by-default + admin-only + re-preview + confirm + test-
   mode-first.
2. **Proration surprises** — Stripe-computed; **preview shown + re-previewed before execute**; default
   `create_prorations`.
3. **Billing-cycle changes** — **anchor left unchanged**.
4. **Multiple items** — single-item by default; **explicit `subscription_item_id` required**, else block.
5. **API-version differences** — preview method verified in test mode; **pause/resume deferred**.
6. **`subscriptions.resume` support / `pause_collection` semantics** — **deferred** until verified.
7. **Webhook race conditions** — webhook writes the legacy mirror only; P12B2 syncs the registry; **no
   conflict, no guard** (§15); manual sync resolves any staleness; **P12C** reconciles later.
8. **Customer communication** — out of scope (no email automation); note that Stripe may send its own
   customer emails per dashboard settings.
9. **No automatic rollback** — surfaced in the UI for destructive actions + the runbook.
10. **Future** — P12C webhook reconciliation; pause/resume; accounting/reconciliation.

---

## 22. Final readiness checklist

- **P12B2 spec ready:** **Yes.** The execution fields/statuses/idempotency column already exist (P12B1), the
  preview helper + P12A sync are reusable, the SDK write methods are confirmed (with the noted version
  caveats), and the config-flag mechanism matches the existing `env.portalEnabled` pattern. Migration is a
  **single additive perms seed (`0031`)**; no table/legacy change. **No build, no migration created; no
  Stripe write performed.**
- **Blockers:** none for the spec. **Before enabling the flag in any environment** (test mode): verify the
  installed SDK's upcoming-invoice preview method and the exact `subscriptions.update` item-change shape for
  the account's API version.
- **Decisions needed before build:** confirm the **5-action safe subset** (defer pause/resume); confirm
  **admin-only execution**; confirm **`ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` default off + test-mode-first**;
  confirm **3 execute perms** (`change_plan`/`change_quantity`/`cancel`) seeded in `0031`; confirm
  **re-preview mandatory** for plan/quantity and **type-to-confirm** for `cancel_immediately`.
- **Recommended safe defaults:** flag **off**; admin-only; safe subset (pause/resume deferred); proration
  `create_prorations`; billing-cycle unchanged; single-item unless an item is chosen; idempotency key =
  request id (fresh on retry); re-preview before plan/quantity execute; **no webhook/checkout change**.

**Exact approval question:** *"Approve **P12B2** Subscription Change Execution as specified — admin-only,
behind `ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS` (default off, **test-mode-first**), executing the **5-action
safe subset** (change_plan, change_quantity, cancel_at_period_end, undo_cancel_at_period_end,
cancel_immediately) on P12B1 requests with **mandatory re-preview** (plan/quantity), **idempotency keys**,
**type-to-confirm** for immediate cancel, and an immediate **P12A registry sync** after success; a single
additive migration `0031` seeding **3 admin-only execute permissions** (`change_plan`/`change_quantity`/
`cancel`); **`pause_collection`/`resume_collection` deferred**; **no checkout/webhook change, no legacy
writes** — and build P12B2? Or change any §21 decision (e.g. include pause/resume, or stage cancel_immediately
separately) first?"*

**Do not build yet. Awaiting the P12B2 approval + the §21 decisions.**
