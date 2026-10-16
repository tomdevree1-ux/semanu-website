# PORTAL P12C — SUBSCRIPTION WEBHOOK RECONCILIATION — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8 + the live Supabase schema + current repo. Builds on **P12A** (the
`customer_subscriptions` registry + `snapshotFromStripe`/`syncRegistryFromStripe`) and **P12B2**
(post-execution sync). **This phase touches the live Stripe webhook** — so the registry branch is
strictly additive, isolated behind a try/catch + a config flag, and must never affect the legacy
order/subscription/checkout path.

---

## 1. P12C objective

P12C keeps the **P12A `customer_subscriptions` registry** in sync with Stripe by adding an **isolated,
idempotent reconciliation branch** to the existing `/api/stripe/webhook` for `customer.subscription.*`
events. The branch maps the subscription object **already present in the event** (no extra Stripe API
call) into the registry snapshot, **preserving CRM links/notes/archive**. The existing legacy
`subscriptions` mirror write, the checkout-completed handler (incl. the P11 invoice-payment guard), and
the webhook's verification/response are **left untouched**. Until P12C, the registry was refreshed only by
P12A manual sync + P12B2 post-execution sync; P12C closes the loop for Stripe-side changes (e.g. customer
self-service, dunning, Stripe-dashboard edits).

---

## 2. Current-state dependency check (inspected live + repo)

- **`/api/stripe/webhook/route.ts`** — verifies the signature (`stripe.webhooks.constructEvent`), then
  switches: `checkout.session.completed` → `handleCheckoutCompleted` (with the **P11 guard**:
  `if (!orderId || metadata.kind==='invoice_payment') return;`); `customer.subscription.created/updated/
  deleted` → **`handleSubscriptionEvent(sub, supabase)`** which **upserts the legacy `subscriptions`
  mirror** (`from('subscriptions').upsert({ id: sub.id, … }, { onConflict:'id' })`, line ~190). Returns
  200 on handled/ignored, 400 on bad signature, 500 on a handler exception. Uses `createAdminClient`
  (service role). **`stripe_events` is NOT referenced/written anywhere in the webhook today** — there is
  currently **no event-id dedup**; the legacy upsert is naturally idempotent.
- **P12A** — `customer_subscriptions` (31 cols, all snapshot + CRM + sync fields). **`snapshotFromStripe(sub:
  Stripe.Subscription)` is exported** from `src/modules/subscriptions/stripe.ts` (pure mapper, no API call)
  and is reused by `retrieveSubscriptionSnapshot`. **`syncRegistryFromStripe(customerSubscriptionId,
  actorId, via)`** (`src/modules/subscriptions/sync.ts`) retrieves + upserts the snapshot **preserving CRM
  links/notes/archive**; emits `subscription.synced`. Status mapping `subscriptionStatusToken` (open set).
- **P12B1** — `subscription_change_requests` (request/preview). **P12B2** — execution + **post-execution
  `syncRegistryFromStripe`** (already refreshes the row right after a mutation).
- **Legacy billing (must NOT be written by P12C):** `subscriptions` (8, webhook-mirrored), `customers`
  (18, has `stripe_customer_id`→`company_id`), `orders` (19), `payments` (10), `payment_links` (13).
  **`stripe_events` (3 cols: `id`, `type`, `created_at`)** — the dedup table (currently unused).
  **P10 `invoice_payments` / P11 `invoice_payment_links`** unrelated.
- **`/api/checkout`** — subscription-mode Checkout; **unchanged by P12C.** `plans.ts` (`planPriceId` read-
  only), `promo.ts`. Audit `subscription.*` events + `audit.read_technical` gating already exist.
- **Migration numbering:** latest applied is `0031_subscription_execution_permissions`. **P12C needs no
  migration** (next would be `0032` only if ever required). **No conflict with old `/[locale]/admin`; no
  business-table rewrite.**

---

## 3. Scope boundaries

**In scope (P12C):** an additive, **flag-gated**, idempotent registry-reconciliation branch inside
`handleSubscriptionEvent` for `customer.subscription.created/updated/deleted`; a reusable server-only
helper that maps the **event's subscription object** into `customer_subscriptions` (preserving CRM/notes/
archive, creating an unlinked row for an unknown subscription); **`stripe_events`-based dedup** for that
branch; distinct webhook audit events; an env flag `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC` (default off); tests;
runbook.

**Out of scope (P12C):** checkout rewrite; `/api/checkout` change; new checkout flow; public customer
portal; product/price **sync writes** or product/price/coupon creation; subscription **mutation** changes
(P12B2 unchanged — read its behavior only); invoice-payment reconciliation; accounting ledger/export;
revenue recognition; refund automation; tax/VAT engine; invoice PDF/email; role editor; org settings;
`/admin` removal; business-table rewrite; **hard deletes**; legacy `orders`/`subscriptions`/`customers`
migration; **destructive writes to legacy billing tables**; P10/P11 logic changes.

**Deferred:** `customer.updated` reconciliation (not needed for the registry now); **Stripe invoice/payment
events** (subscription-invoice ↔ portal-invoice reconciliation is a separate accounting phase);
auto-linking unknown subscriptions to a CRM company beyond the reliable `customers` bridge; a future
"orphaned legacy `subscriptions` → registry" backfill.

---

## 4. Webhook strategy recommendation

**Recommended: extend the existing handler additively with a small, isolated registry-reconciliation
branch — do not restructure the webhook.** Specifically:

- **Reuse the existing event verification + routing.** The three `customer.subscription.*` types already
  reach `handleSubscriptionEvent`; add the registry branch **there**, after the legacy mirror upsert.
- **Process `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`.**
  All three carry a full `Stripe.Subscription` object; the registry snapshot (including `status` =
  `canceled` for deleted) is derived from it.
- **`customer.updated`: out of scope** (the registry holds subscription state, not customer profile;
  re-linking customers is a CRM concern). **Invoice/payment events: out of scope** (no dependency).
- **Reuse `stripe_events` for idempotency** (it exists, currently unused) — scoped to the registry branch
  only (§8), so the legacy path's behavior is **unchanged**.
- **Behind a flag** `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC` (default off) so it ships dark and can be toggled
  per environment without a deploy.

This is the lowest-risk design: one additive branch, isolated by try/catch + flag + `stripe_events`,
writing only `customer_subscriptions`.

---

## 5. Migration decision

**No migration is required.** `customer_subscriptions` already has every field the webhook sync needs
(status/period/cancel/trial/quantity/currency/amount/interval/plan_key/product/price ids/`last_synced_at`/
`sync_status`/`metadata`/CRM links/archive). `stripe_events` already exists for dedup. No new permission is
needed (the webhook runs as service role with no user context). **P12C is code-only** (webhook route +
helper + audit display + env flag + tests + docs). If a future increment ever needs a column or a flag
table, the next number is `0032` — **not used here**. **No legacy/checkout-owned table is altered.**

---

## 6. Data model review

`customer_subscriptions` is sufficient. Webhook reconciliation rules:

- **Webhook MAY update (Stripe-authoritative snapshot fields):** `status`, `current_period_start`/`_end`,
  `cancel_at_period_end`, `cancelled_at`, `trial_start`/`_end`, `quantity`, `currency`, `amount`,
  `interval`, `plan_key`, `stripe_product_id`, `stripe_price_id`, `stripe_customer_id`, `metadata`,
  `last_synced_at`, `sync_status` (= `synced`). *(Exactly the P12A `snapshotColumns` set.)*
- **Webhook MUST preserve (never in the update patch):** `company_id`, `contact_id`, `customer_id`,
  `notes`, `internal_notes`, `archived_at`/`archived_by`, `created_by`. (Same preservation as P12A sync —
  the patch carries only Stripe fields + `sync_status`/`last_synced_at`/`updated_by`.)
- **Unknown subscription (no registry row):** **create a new UNLINKED row** (`company_id`/`contact_id`/
  `customer_id` null) from the snapshot, `sync_status='synced'`, audited `subscription.created_from_webhook`.
  Optionally **auto-suggest the company via the reliable `customers` bridge** (`customers.stripe_customer_id
  → company_id`) — link the company only when that lookup yields exactly one match; **never guess** beyond
  that. Leave it unlinked otherwise (staff can link it later in the P12A UI).
- **Do not auto-create CRM rows.** **Duplicate `stripe_subscription_id`:** the unique index already
  prevents two rows; the upsert matches on `stripe_subscription_id` and updates the single row.
- **`updated_by` for webhook writes:** null (no user) — the audit `source='webhook'` records provenance.

---

## 7. Stripe event model

| Event | Object | Registry behavior | Legacy behavior | Idempotency | Audit | Error |
|---|---|---|---|---|---|---|
| `customer.subscription.created` | `Stripe.Subscription` | upsert by sub id; **create unlinked row** if new | legacy mirror upsert (unchanged) | `stripe_events` dedup (§8) | `subscription.created_from_webhook` (or `webhook_synced` if it already existed) | swallowed (§17) |
| `customer.subscription.updated` | `Stripe.Subscription` | refresh snapshot; preserve CRM/notes/archive | legacy mirror upsert (unchanged) | dedup | `subscription.webhook_synced` | swallowed |
| `customer.subscription.deleted` | `Stripe.Subscription` (status `canceled`) | refresh snapshot (status→canceled, cancelled_at) | legacy mirror upsert (unchanged) | dedup | `subscription.cancelled_from_webhook` (or `webhook_synced`) | swallowed |

For all three, the snapshot is built from the **event object** via `snapshotFromStripe(sub)` (no Stripe
retrieve). The legacy `subscriptions.upsert` runs **first and unchanged**; the registry branch runs after,
isolated.

---

## 8. Idempotency model

- **Existing state:** the webhook does **not** use `stripe_events` today; the legacy `subscriptions` upsert
  is naturally idempotent (same Stripe state → same row). **P12C does not change the legacy path's
  idempotency.**
- **Registry-branch dedup (additive):** at the start of the registry branch, `insert into stripe_events
  (id, type) values (event.id, event.type) on conflict (id) do nothing`. **If the row already existed
  (0 rows inserted) → skip the registry sync** (already reconciled). If newly inserted → run the
  (idempotent) registry upsert. This dedups Stripe re-deliveries so the same event does not re-audit /
  re-write.
- **Insert-at-start + return-200:** because the webhook **returns 200 for the subscription path as today**
  (§10/§17), Stripe does **not** retry on a registry failure — so insert-before vs insert-after does not
  affect retries. The registry upsert is **idempotent regardless**, so even a duplicate delivery that
  slipped the dedup is harmless. **Eventual consistency** for a failed sync comes from (a) the **next**
  `customer.subscription.*` event for that subscription (it carries current state), and (b) **P12A manual
  sync**.
- **Do not block legacy on registry dedup:** the `stripe_events` insert/skip gates **only** the registry
  branch; the legacy mirror upsert is ungated and runs on every delivery (as today).
- **Safety rule (per the prompt):** P12C does **not** change the legacy handler's idempotency/flow. If any
  doubt arises in implementation, keep `stripe_events` writes confined to the registry branch and rely on
  upsert idempotency + manual sync.

---

## 9. Registry sync implementation

Add a server-only helper (in `src/modules/subscriptions/sync.ts`, beside `syncRegistryFromStripe`):

`reconcileRegistryFromStripeSubscription(sub: Stripe.Subscription, opts: { eventId: string; eventType: string }): Promise<{ ok: true; created: boolean } | { ok: false; error: string }>`

- `import 'server-only'`; **service-role** (`createAdminClient`); **no Stripe API call** (maps the passed
  object via `snapshotFromStripe`); **no Stripe secret client-side**.
- Find the registry row by `stripe_subscription_id`:
  - **Exists →** `update` with `snapshotColumns(snapshot)` + `sync_status='synced'` + `last_synced_at` (CRM
    links/notes/archive preserved — not in the patch). Audit `subscription.webhook_synced` (or
    `…cancelled_from_webhook` when the event is `deleted`).
  - **Missing →** resolve an optional company via `customers.stripe_customer_id → company_id` (single match
    only); `insert` an unlinked-or-suggested row from the snapshot, `sync_status='synced'`. Audit
    `subscription.created_from_webhook`.
- **Updates only `customer_subscriptions`.** Never writes legacy `subscriptions`/`customers`/`orders`/
  `payments`/`payment_links`/`stripe_events`-as-business (only the dedup insert in the branch), never P10/
  P11 tables, **never mutates Stripe**. Handles missing amount/currency/interval/plan/price (the snapshot
  already null-tolerates them); `plan_key` resolved read-only via `plans.ts`. Returns a typed result;
  **never throws to the caller** (the webhook branch also wraps it — defence in depth).

*(`syncRegistryFromStripe` (retrieve-based) is unchanged and remains the manual/execution path.)*

---

## 10. Webhook integration design

In `handleSubscriptionEvent(sub, supabase)`, **after** the existing legacy `subscriptions.upsert`, add:

```
// ── P12C registry reconciliation (additive, isolated, flag-gated) ──
if (env.enableSubscriptionWebhookSync) {
  try {
    const { error: seen } = await supabase
      .from('stripe_events')
      .insert({ id: event.id, type: event.type });   // dedup; on-conflict → skip
    if (!seen /* newly inserted */) {
      await reconcileRegistryFromStripeSubscription(sub, { eventId: event.id, eventType: event.type });
    }
  } catch (err) {
    console.error('[stripe/webhook] registry reconciliation failed (legacy path unaffected):', …);
    // best-effort audit of the failure; swallow — never affect the legacy path or the HTTP status
  }
}
```

- **Placement: AFTER the legacy mirror update**, in its **own try/catch**, so a registry failure cannot
  affect the legacy upsert, cannot produce a second HTTP response, and cannot 500 the webhook. (`event.id`/
  `event.type` are threaded down from `POST` into `handleSubscriptionEvent` — a small signature change, or
  read from a closure.)
- **Preserve everything existing:** signature verification, `handleCheckoutCompleted` + the **P11 guard**,
  the legacy `subscriptions`/`customers`/`orders` writes, the single `{ received: true }` 200 response, and
  the 400/500 paths. **No `/api/checkout` change.**
- **Failure isolation:** registry errors are **swallowed** (logged + audited) → the webhook still returns
  200 and the legacy path is unaffected. Eventual consistency via the next event + manual sync (§8/§17).
- **Recommendation (explicit):** run the registry branch **after** the legacy mirror update, **isolated
  with try/catch + flag + `stripe_events` dedup**.

---

## 11. Permissions / RLS / security

- The webhook runs as **service role** (no user) — **no user permission is needed** for registry writes;
  **no new permission/migration.**
- `customer_subscriptions` keeps its **read-only** permission-gated RLS (`subscriptions.read`); **no client
  write policies**; all writes are server-side (webhook service role / P12A·B2 server actions).
- **No Stripe secret client-side** (the helper is `server-only`; the webhook already holds the secret +
  `STRIPE_WEBHOOK_SECRET` server-side). Signature verification unchanged.
- **No raw webhook payload in ordinary audit** (§12); technical fields gated by `audit.read_technical`. **No
  public/customer access**; the endpoint stays Stripe-signed only.

---

## 12. Audit / history

**Decision: add distinct webhook events** (clearer in the timeline than reusing `subscription.synced`):
`subscription.webhook_synced`, `subscription.webhook_sync_failed`, `subscription.created_from_webhook`,
`subscription.cancelled_from_webhook`, and reuse `subscription.updated_from_webhook` is optional (use
`webhook_synced` for updates). Add labels/colours in `src/lib/audit/display.ts`.

- `entity_type = 'subscription'`; `entity_id = customer_subscriptions.id` when known (null for a failed
  insert of an unknown sub — then `stripe_subscription_id` is the locator in metadata). **`source='webhook'`,
  `actorType='system'`, `actorId=null`.**
- **Safe metadata:** `stripe_subscription_id`, `status`, `event_type`, `source:'webhook'` (non-secret
  ids/scalars only). **Forbidden:** raw webhook payload, raw amounts, Stripe secrets, error bodies. A
  sanitized error goes to the **technical** field only (gated). To limit noise, a successful webhook sync
  that finds the row already at the target state may emit a single `webhook_synced` (or be skipped via the
  `stripe_events` dedup), not a storm.

---

## 13. UI impact

**No required UI change.** The subscription detail already shows `last_synced_at` + `sync_status`, and the
History timeline will render the new `…_from_webhook`/`webhook_synced` events (labels added in §12).
**Optional (nice-to-have, not required):** a small "auto-synced from Stripe" hint near `last_synced_at`.
**Do not** add a customer portal, execution controls, or other UI.

---

## 14. Relationship with P12B2

P12B2 already calls `syncRegistryFromStripe` immediately after a successful execution, so the registry is
fresh **before** Stripe sends the corresponding `customer.subscription.updated` webhook. When that webhook
arrives, the P12C branch **writes the same state idempotently** (a no-op change) — **no conflict**. To
limit audit noise, the `stripe_events` dedup + the fact that the row already matches means at most one
extra `webhook_synced` event; an optional refinement is to skip the audit when `last_synced_at` is within a
few seconds of now (not required). **Manual sync (P12A) remains available** as the universal fallback.

---

## 15. Relationship with P10 / P11 / payments

P12C **creates no invoices, no `invoice_payments` (P10), no `invoice_payment_links` (P11)** and changes
neither. **Stripe invoice/payment events are out of scope** (subscription-invoice reconciliation is a
future accounting phase). The registry branch writes only `customer_subscriptions` (+ the `stripe_events`
dedup row). P10/P11 logic is untouched.

---

## 16. Legacy data / old admin

Do **not** migrate `orders`/`subscriptions`/`customers`; do **not** rewrite checkout or `/api/checkout`;
do **not** change old `/[locale]/admin`; **the registry module never writes the legacy `subscriptions`
mirror** (that stays owned by the existing webhook handler, unchanged). A future cleanup could backfill the
registry from existing legacy `subscriptions`/Stripe, but that is **not** P12C.

---

## 17. Error handling and observability

- **Registry sync errors are swallowed** in the webhook branch (logged with a safe message — no payload/
  secret) and audited as **`subscription.webhook_sync_failed`** (metadata: `stripe_subscription_id`,
  `event_type`; sanitized error to the technical field only). **They do NOT change the webhook HTTP status**
  — the webhook returns 200 for the subscription path as today, so the legacy mirror write is never
  reverted/retried because of a registry hiccup.
- **Fallback:** the **P12A manual sync** action re-pulls the row from Stripe on demand; and the **next**
  `customer.subscription.*` event re-reconciles (current-state snapshot). A row whose `sync_status` is not
  `synced`, or whose `last_synced_at` is stale, is the diagnostic signal.
- **Diagnosis:** the `subscription.webhook_sync_failed` audit event + the row's `sync_status`/
  `last_synced_at` + server logs identify a failed sync; staff resolve via manual sync.
- `customer_subscriptions` has no `error_summary` column; failures live in **audit technical fields + logs**
  (no schema change).

---

## 18. Rate limiting / abuse

- The endpoint stays **Stripe-signature-verified only** — no new public/unauthenticated action, no new
  endpoint. **No user-facing registry action is added.**
- **No extra Stripe API call** inside the webhook — the registry sync maps the **event's** subscription
  object (`snapshotFromStripe`), so there is no per-event Stripe round-trip and no rate-limit exposure.
- The branch does only a bounded DB upsert (+ one `customers` lookup for unknown subs); **no expensive
  work, no background job.** The `stripe_events` dedup also caps repeated processing of redelivered events.

---

## 19. Files likely to create / update

**Update:** `src/app/api/stripe/webhook/route.ts` (thread `event.id`/`event.type` into
`handleSubscriptionEvent`; add the isolated, flag-gated registry branch after the legacy upsert);
`src/modules/subscriptions/sync.ts` (+`reconcileRegistryFromStripeSubscription`, reusing `snapshotFromStripe`
+ the existing `snapshotColumns` mapping); `src/lib/audit/display.ts` (+ the webhook events); `src/lib/env.ts`
(+`enableSubscriptionWebhookSync` = `process.env.ENABLE_SUBSCRIPTION_WEBHOOK_SYNC === 'true'`, default off).
**Create:** tests (`src/app/api/stripe/webhook/*.test.ts` or a module test for the helper +
source-invariant tests); `PORTAL_P12C_RUNBOOK.md`. **No migration → no `database.ts`/README change. No
`/api/checkout` change.**

---

## 20. Tests

- **Event handling (mocked):** `customer.subscription.created` → creates an unlinked (or bridge-linked)
  registry row; `…updated` → updates the existing row's snapshot; `…deleted` → status→canceled. The
  **event object** is mapped (no Stripe retrieve).
- **Idempotency:** a redelivered event id (already in `stripe_events`) **skips** the registry sync; the
  upsert is idempotent (same state twice = no-op).
- **Preservation:** an `…updated` event **preserves `company_id`/`contact_id`/`customer_id`/`notes`/
  `internal_notes`/`archived_at`** (asserts the patch contains none of them — like the P12A/P12B2 tests).
- **Legacy isolation:** the legacy `subscriptions.upsert` still runs and is **unchanged**; a thrown registry
  error is **swallowed** (the handler still returns 200; legacy not reverted); **flag off → registry branch
  is skipped** entirely; **the P11 `checkout.session.completed` guard is unchanged**.
- **Boundaries:** the helper writes **only `customer_subscriptions`** (no legacy/orders/payments/payment_links/
  invoice_payments/invoice_payment_links writes); **no `/api/checkout` change**; **no Stripe mutation/
  secret**; no service-role import in a client component; audit metadata carries no payload/amounts/secrets.
- **Regression + gates:** P5–P12B2 suites green; `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

---

## 21. Manual smoke checklist (Stripe **test mode**)

Set `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC=true` (test env) and a valid `STRIPE_WEBHOOK_SECRET`. Link a test
subscription (P12A). Using the **Stripe Dashboard or CLI** (`stripe trigger customer.subscription.updated`,
or edit the subscription): trigger `…updated` → confirm `customer_subscriptions` updates (status/period)
and **CRM links/notes/archive are preserved**; set **cancel at period end** in Stripe → confirm the
registry's `cancel_at_period_end` flips; **cancel/delete** the subscription → confirm the registry status →
`canceled`. Confirm the **legacy `subscriptions` mirror still updates** for each event; confirm a
**redelivered** event does not double-audit (dedup). Confirm **checkout still works**, **P12A manual sync
still works**, **P12B2 execution still works** (flag in test mode), and **old `/admin`** is untouched. Turn
`ENABLE_SUBSCRIPTION_WEBHOOK_SYNC` **off** → confirm the registry branch is skipped while the legacy mirror
still updates.

---

## 22. Rollback plan

- **Code:** revert the P12C commit — the webhook registry branch, the `reconcileRegistryFromStripeSubscription`
  helper, the audit additions, and the env flag revert together; the webhook returns to legacy-only.
- **No migration to roll back** (none added). **No Stripe rollback needed** — P12C is read/sync only (no
  Stripe writes).
- **Instant disable (no deploy):** set `ENABLE_SUBSCRIPTION_WEBHOOK_SYNC` ≠ `true` → the registry branch is
  skipped; the legacy mirror + checkout continue unchanged.
- **Fallback:** P12A **manual sync** keeps the registry fresh without the webhook; the legacy checkout/
  webhook path is the untouched baseline.

---

## 23. Risks and open questions (defaults in **bold**)

1. **Idempotency interaction with the legacy handler** — the registry dedup is **scoped to the registry
   branch**; the legacy path is ungated/unchanged. *(Confirm.)*
2. **Failure isolation** — registry errors are **swallowed (200, legacy unaffected)** with manual-sync
   fallback. *(Confirm.)*
3. **Event ordering / out-of-order delivery** — each event carries **current state**, and the registry is a
   snapshot, so a later-arriving older event could momentarily regress a field; **mitigation: rely on the
   newest event + manual sync** (an optional refinement compares the event's `current_period_end`/
   `status` recency, deferred).
4. **Duplicate events** — `stripe_events` dedup + idempotent upsert. ✓
5. **Stale manual sync vs webhook** — both write the same snapshot; **last-write-wins is fine** (Stripe
   authoritative).
6. **Unknown subscriptions without CRM links** — **create unlinked** (or bridge-linked) rows; staff link
   later. *(Confirm: create-unlinked is desired.)*
7. **Audit noise** — distinct webhook events + dedup; optional "skip audit if just synced" refinement.
8. **`customer.updated` relevance** — **deferred** (not needed for the registry).
9. **Future invoice/payment reconciliation + accounting + customer portal** — deferred.

---

## 24. Final readiness checklist

- **P12C spec ready:** **Yes.** Grounded in the live webhook (legacy `subscriptions` mirror, no current
  `stripe_events` use, P11 guard), the reusable `snapshotFromStripe` (no extra API call), and the existing
  registry/sync/audit. **No migration, no permission, no checkout/legacy change. No build, no migration
  created.**
- **Blockers:** none. **Before enabling the flag in production:** run the §21 test-mode smoke and confirm
  the webhook event object shape for the account's API version.
- **Decisions needed before build:** confirm **after-legacy + isolated try/catch + flag** placement;
  confirm **`stripe_events` dedup scoped to the registry branch** (don't touch legacy idempotency); confirm
  **create-unlinked for unknown subscriptions** (+ reliable `customers`-bridge auto-link only); confirm
  **distinct webhook audit events** (vs reusing `subscription.synced`); confirm **flag default off**.
- **Recommended safe defaults:** flag **off**; registry branch **after** the legacy upsert, isolated, errors
  swallowed; **no extra Stripe call** (map the event object); preserve CRM/notes/archive; create-unlinked
  unknown subs; distinct webhook events; manual sync remains the fallback; **no `customer.updated`/invoice
  events**.

**Exact approval question:** *"Approve **P12C** Subscription Webhook Reconciliation as specified — a
**code-only** (no migration), **flag-gated** (`ENABLE_SUBSCRIPTION_WEBHOOK_SYNC`, default off), **isolated**
registry-sync branch added to `handleSubscriptionEvent` **after** the unchanged legacy `subscriptions`
mirror upsert, mapping the **event's** subscription object via P12A `snapshotFromStripe` into
`customer_subscriptions` (preserving CRM/notes/archive; create-unlinked for unknown subs with reliable
`customers`-bridge auto-link), deduped via `stripe_events`, with **errors swallowed** (200; legacy
unaffected; manual-sync fallback), distinct `subscription.*_from_webhook` audit events, **no checkout/
webhook-verification/legacy/P10/P11 change**, processing only `customer.subscription.created/updated/
deleted` — and build P12C? Or change any §23 decision (e.g. reuse `subscription.synced`, or include
`customer.updated`) first?"*

**Do not build yet. Awaiting the P12C approval + the §23 decisions.**
