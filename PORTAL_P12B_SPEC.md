# PORTAL P12B — STRIPE SUBSCRIPTION MUTATIONS — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8 + the live Supabase schema + current repo. Builds directly on **P12A** (the
`customer_subscriptions` registry). **This is the highest-risk finance phase — it writes to live Stripe
subscriptions and can change real customer billing** — so the recommendation is deliberately staged and
admin-gated.

---

## 1. P12B objective

P12B lets an **admin** perform controlled **mutations** on an existing Stripe subscription from inside the
portal — change plan/price, change quantity, cancel (at period end / immediately / undo), pause/resume —
**entering through a P12A `customer_subscriptions` registry row**. Every mutation goes through a
**request → preview → execute** workflow recorded in a new `subscription_change_requests` table; **Stripe
remains the source of truth**, and after a successful mutation the P12A registry snapshot is re-synced.
P12B adds **no** checkout, webhook-reconciliation, accounting, or legacy-table writes.

---

## 2. Current-state dependency check (inspected live + repo)

- **P12A `customer_subscriptions`** (31 cols) is **live** — the portal link/snapshot layer. P12B uses its
  `id` as the mutation entry point and reuses its `syncSubscriptionFromStripe` to refresh after a change.
  Statuses already carry `SUBSCRIPTION_MUTABLE_STATUSES = {active, trialing, past_due, paused}` (defined
  in `src/modules/subscriptions/status.ts`) — the eligibility gate is already written.
- **Subscriptions module** — `src/modules/subscriptions/{schema,types,status,guards,queries,actions}.ts`
  + **server-only `stripe.ts`** (currently read-only: `subscriptions.retrieve`/`.list`). Audit has 7
  `subscription.*` events; permissions are `subscriptions.read/link/sync/archive` (4).
- **Legacy billing (must not be written by P12B):** `subscriptions` (8 cols, id = Stripe sub id,
  webhook-mirrored), `customers` (18), `orders` (19), `payments` (10), `payment_links` (13),
  `stripe_events` (3). **P10 `invoice_payments` (24) / P11 `invoice_payment_links` (24)** are unrelated to
  subscription billing.
- **Stripe code:** `getStripe()` (server-only secret); `/api/checkout` (subscription-mode Checkout);
  `/api/stripe/webhook` `handleSubscriptionEvent` upserts the legacy `subscriptions` mirror on
  `customer.subscription.*` (this **will fire** after any P12B mutation — §16); `plans.ts`
  (`PlanId=starter|business|webshop`, `planPriceId()` → env Price ids); `promo.ts`.
- **Stripe SDK = 17.7.0**, **no pinned `apiVersion`** (uses the SDK's bundled version). The SDK exposes
  `subscriptions.update` (with `cancel_at_period_end`, `proration_behavior`, `billing_cycle_anchor`,
  `items[].price`/`.quantity`), `subscriptions.cancel`, `subscriptions.resume`, `pause_collection`, and
  the upcoming-invoice **preview** (`invoices.retrieveUpcoming`, with `invoices.createPreview` on newer
  API versions). **Preview-method naming and `subscriptions.resume` are API-version-sensitive and MUST be
  verified in Stripe test mode before P12B2 ships.**
- **Migration numbering:** latest applied is `0029_customer_subscriptions` (`20260611140428`). **Next is
  `0030`.** No `subscription_change_requests`/`subscription_mutation_requests` table exists → greenfield.
- **No conflict with old `/[locale]/admin`** (untouched). **No business-table rewrite needed.**

---

## 3. Scope boundaries

**In scope (P12B):** a new **`subscription_change_requests`** table (additive `0030`); a request →
preview → execute workflow for **7 actions** (change_plan, change_quantity, cancel_at_period_end,
undo_cancel_at_period_end, cancel_immediately, pause_collection, resume_collection); server-side Stripe
**preview** (read) + **mutation** (write) calls; **admin-only execution**; mandatory fresh preview before
plan/quantity changes; **post-mutation registry re-sync** (reuse P12A); new `subscriptions.*` mutation
permissions; UI on the subscription detail + a change-requests list; audit; tests; docs/runbook.

**Out of scope (P12B):** checkout rewrite; `/api/checkout` change; new subscription checkout; public
customer portal; recurring-billing rewrite; migration of legacy `orders`/`subscriptions`/`customers`;
**Stripe product/price/coupon creation or price sync writes**; invoice-payment reconciliation; accounting
ledger/export; revenue recognition; refund automation; tax/VAT engine; invoice PDF/email; role editor;
org settings; `/admin` removal; business-table rewrite; **hard deletes**; **full webhook reconciliation**
(only the minimal post-mutation sync is in scope — §16).

**Deferred:** **P12C** webhook reconciliation (auto-sync the registry from `customer.subscription.*`);
multi-currency mutation UX; coupon/trial editing; subscription-invoice ↔ portal-invoice linkage;
`organization_id`.

---

## 4. Safety recommendation

**Recommend splitting P12B into two separately-approved sub-phases, and gating real writes hard:**

| Sub-phase | Scope | Stripe writes | Recommendation |
|---|---|---|---|
| **P12B1 — Change Requests + Preview** | the `subscription_change_requests` table, the request/preview workflow, eligibility checks, the **preview** call (`invoices.retrieveUpcoming` — a **read**), the request-list/detail UI, permissions, audit | **None** | **Build first.** Low-risk; lets the team validate the request model, proration display, permissions and audit trail before any live write. |
| **P12B2 — Execute Mutations** | wire `executeSubscriptionChange` to the live Stripe **write** APIs (update/cancel/resume/pause), post-mutation re-sync | **Yes (irreversible)** | **Build only after P12B1 is proven**, **admin-only**, **Stripe test-mode first**, behind a config flag, with a **fresh re-preview + type-to-confirm** immediately before each write. |

Additional non-negotiables for P12B2: **admin-only execution**; **request workflow required** (no
direct-to-Stripe path that skips a request row — direct admin execution auto-creates an auto-approved
request row); **fresh preview re-computed immediately before execute** (abort if the Stripe subscription
drifted since preview); **type-to-confirm the `sub_…` id for `cancel_immediately`**; **idempotency key =
the request row id**; **no guaranteed rollback** after a Stripe write (documented). This mirrors the
P12A-was-read-only logic: prove the safe surface first, then enable the irreversible part under tight
controls.

---

## 5. Naming decision

- **Feature name:** **Subscription changes** (an individual record is a "subscription change request").
- **Database table:** **`public.subscription_change_requests`** (additive; the request/log layer). No
  rename of `customer_subscriptions` or any legacy table.
- **Routes:** subscription-detail action panel at `/app/subscriptions/[id]`; a list at
  `/app/subscription-changes` + detail `/app/subscription-changes/[id]`. (No `/[id]/change` sub-route —
  the action panel + a ConfirmDialog/preview modal on the detail page is cleaner and matches the P11/P12A
  pattern.)
- **Audit entity:** `subscription_change` (request lifecycle) + the existing `subscription` entity for the
  effect events on the registry row.
- **Permission module:** `subscriptions` (extend the existing module with mutation keys).
- **StatusBadge entity:** `subscription_change`.

---

## 6. Data model proposal — `public.subscription_change_requests`

**Decision: a new additive request/log table is required** (do not store mutations only in `audit_logs`).
It gives an explicit lifecycle, an idempotency anchor, a preview/result store (gated), and a queryable
history. Stripe stays authoritative; this table records *intent + outcome*, never billing truth.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` — also the Stripe idempotency anchor |
| `created_at` / `updated_at` | timestamptz NOT NULL | touch trigger |
| `customer_subscription_id` | uuid NOT NULL | → `customer_subscriptions(id)` **RESTRICT** (the P12A entry point) |
| `company_id` | uuid NULL | → `companies(id)` SET NULL (denormalized for filtering) |
| `contact_id` | uuid NULL | → `company_contacts(id)` SET NULL |
| `stripe_subscription_id` | text NOT NULL | snapshot of the target sub id |
| `action_type` | text NOT NULL | CHECK ∈ the 7 actions (§7) |
| `status` | text NOT NULL default `'draft'` | CHECK ∈ {draft, previewed, approved, executing, executed, failed, cancelled, archived} |
| `proration_behavior` | text NULL | CHECK ∈ {create_prorations, none, always_invoice} (plan/quantity only) |
| `subscription_item_id` | text NULL | the Stripe item to change (required when >1 item) |
| `requested_by` | uuid NULL | → profiles SET NULL |
| `approved_by` / `executed_by` | uuid NULL | → profiles SET NULL |
| `requested_at` / `approved_at` / `executed_at` / `failed_at` | timestamptz NULL | lifecycle stamps |
| `request_payload` | jsonb NOT NULL default `'{}'` | **non-secret** intent: target price/plan_key/quantity/cancel flags/item id |
| `preview_payload` | jsonb NULL | proration/upcoming-invoice preview (**technical/sensitive — gated**) |
| `result_payload` | jsonb NULL | the Stripe response summary (**technical — gated**) |
| `safe_summary` | jsonb NOT NULL default `'{}'` | display-safe summary (action, status, non-secret ids, counts) |
| `error_summary` | text NULL | sanitized error message (no secrets, no raw Stripe body) |
| `idempotency_key` | text NULL | **UNIQUE** (where not null); set at execute |
| `archived_at` / `archived_by` | timestamptz / uuid NULL | soft-archive (never hard-delete) |
| `created_by` / `updated_by` | uuid NULL | → profiles SET NULL |
| `notes` / `internal_notes` | text NULL | |

**Decisions:** request records are **required for every mutation** (including direct admin execution,
which auto-creates an auto-approved row). **Approval** is a soft step — sales may *create + preview*; an
**admin executes** (an admin executing their own request is the approver+executor). **Rows are never
hard-deleted** (archive). **`organization_id` deferred.** Money/proration amounts live only in
`preview_payload`/`result_payload` (gated), never in `safe_summary` or audit metadata.

---

## 7. Mutation action model

`SUBSCRIPTION_MUTABLE_STATUSES = {active, trialing, past_due, paused}` (P12A) is the base eligibility gate.

| action_type | Stripe call (P12B2) | exec permission | confirm | preview required | admin-only exec | sales may request | eligibility |
|---|---|---|---|---|---|---|---|
| `change_plan` | `subscriptions.update(id,{items:[{id,price}],proration_behavior})` | `subscriptions.change_plan` | standard | **yes** | yes | yes | active/trialing/past_due |
| `change_quantity` | `subscriptions.update(id,{items:[{id,quantity}],proration_behavior})` | `subscriptions.change_quantity` | standard | **yes** | yes | yes | active/trialing/past_due |
| `cancel_at_period_end` | `subscriptions.update(id,{cancel_at_period_end:true})` | `subscriptions.cancel` | standard | no | yes | yes | active/trialing/past_due |
| `undo_cancel_at_period_end` | `subscriptions.update(id,{cancel_at_period_end:false})` | `subscriptions.cancel` | standard | no | yes | yes | cancel_at_period_end currently true |
| `cancel_immediately` | `subscriptions.cancel(id)` | `subscriptions.cancel` | **type-to-confirm sub id** | no | yes | request only | active/trialing/past_due |
| `pause_collection` | `subscriptions.update(id,{pause_collection:{behavior}})` | `subscriptions.pause` | standard | no | yes | yes | active/trialing |
| `resume_collection` | `subscriptions.resume(id,…)` or `update(id,{pause_collection:''})` | `subscriptions.resume` | standard | no | yes | yes | paused |

For each: **validate the registry row + the live Stripe status immediately before acting**; on success,
update the request row (`executed` + `result_payload` + `executed_at`) and **re-sync the P12A registry**
(reuse `syncSubscriptionFromStripe`); audit the request-lifecycle event + the registry effect event
(§17). **Rollback limitation:** Stripe writes are not auto-reversible (a cancel/proration cannot be undone
by reverting code) — documented per action.

---

## 8. Stripe API model

All calls **server-side only** via `getStripe()` (secret never client-side; the P12B Stripe helper is
`import 'server-only'`). 

- **Reads:** `subscriptions.retrieve(id,{expand:['items.data.price.product']})` (eligibility + item
  selection); **preview** via the installed SDK's upcoming-invoice method — `invoices.retrieveUpcoming({
  subscription, subscription_items:[{id,price?|quantity?}], subscription_proration_behavior })` (or
  `invoices.createPreview(...)` on newer API versions). **A thin `previewUpcoming()` wrapper must detect
  which method the installed SDK exposes and is verified in test mode.**
- **Writes (P12B2 only):** `subscriptions.update(...)` (plan/quantity/cancel_at_period_end/pause),
  `subscriptions.cancel(id)` (immediate), `subscriptions.resume(id,...)` (resume). After every write,
  `subscriptions.retrieve(...)` → registry re-sync.
- **Item selection:** single-item subscriptions (the webshop plans) → the sole `items.data[0].id`.
  **Multiple items** → require an explicit `subscription_item_id` on the request; block plan/quantity
  change if the item is ambiguous/unspecified.
- **Idempotency:** every write uses `{ idempotencyKey: <request row id> }` (a retried execute never
  double-applies). Persist the key on the row (unique).
- **Plan→price:** `plan_key` → `planPriceId()` (`plans.ts`) **read-only**; unknown/missing price → block
  with a clear error (never invent a price; **no price/product/coupon creation**).
- **Errors:** catch Stripe errors → set request `failed` + `failed_at` + sanitized `error_summary` (no
  secrets, no raw body) + audit `subscription.change_failed`; the registry snapshot is left as-is and a
  re-sync is offered. **No Stripe secret/body logged.** **Test mode first.**

---

## 9. Preview / proration model

- **Plan and quantity changes REQUIRE a preview** before execution; cancel/pause/resume do not (no
  proration line to estimate, though cancel_at_period_end shows the period end).
- Preview calls the upcoming-invoice API with the proposed item change + `subscription_proration_behavior`
  and stores the result in `preview_payload` (gated). The admin sees a **display-safe** rendering: the
  proration line(s), the next charge amount, the period, and any trial/coupon currently in effect
  (read-only) — assembled into `safe_summary` **without** persisting raw amounts in audit metadata.
- **Preview is advisory and time-sensitive.** It is valid only for the subscription state at preview time.
  **Before execute, P12B2 re-previews and compares** the live subscription (`status`,
  `current_period_end`, item price/quantity, `cancel_at_period_end`); if it drifted, **abort and force a
  fresh preview**. Recommended max preview age before requiring re-preview: **a few minutes**; regardless,
  a fresh re-preview is always run immediately before the write.
- **Proration policy is explicit per request** (`proration_behavior`): default **`create_prorations`**; a
  **`none`** option is offered and must be chosen deliberately; `billing_cycle_anchor` stays
  **`unchanged`** unless an admin explicitly sets it (out-of-scope to change in v1 — default unchanged).
  **Trials/coupons are surfaced read-only, never edited.**

---

## 10. Permission model

Extend the `subscriptions` module (P12A keeps `read/link/sync/archive`). **New P12B permissions:**
`subscriptions.request_change`, `subscriptions.preview_change`, `subscriptions.change_plan`,
`subscriptions.change_quantity`, `subscriptions.cancel`, `subscriptions.pause`, `subscriptions.resume`.

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `subscriptions.read` / P12A | ✓ | ✓ | read | read | read |
| `subscriptions.request_change` | ✓ | ✓ | — | — | — |
| `subscriptions.preview_change` | ✓ | ✓ | — | — | — |
| `subscriptions.change_plan` (execute) | ✓ | — | — | — | — |
| `subscriptions.change_quantity` (execute) | ✓ | — | — | — | — |
| `subscriptions.cancel` (execute) | ✓ | — | — | — | — |
| `subscriptions.pause` (execute) | ✓ | — | — | — | — |
| `subscriptions.resume` (execute) | ✓ | — | — | — | — |

**All execution is admin-only; destructive actions admin-only.** Sales may create + preview change
requests only. analyst/reviewer/read_only stay read-only. No role editor UI. (P12B1 ships only
`request_change`/`preview_change`; P12B2 adds the execute perms.)

---

## 11. RLS / security model

- **Reads: permission-gated** — `subscription_change_requests` SELECT policy
  `has_permission('subscriptions.read') OR is_platform_super_admin()` (anyone who can see a subscription
  can see its change history). **No INSERT/UPDATE/DELETE policies.**
- **Writes** via **service-role** `'use server'` actions only, gated by `requireAuth()` +
  `hasPermission()`; **no client writes; no service-role import in client components.**
- **No Stripe secret client-side**; the mutation/preview helper is `import 'server-only'`.
- **Billing data sensitivity:** proration/preview/result payloads are sensitive → stored only in
  `preview_payload`/`result_payload` and surfaced only to permitted users; raw payloads are **technical**
  and gated by `audit.read_technical`. Stripe ids are non-secret references.
- **Destructive-action confirmation:** type-to-confirm the `sub_…` id for `cancel_immediately`; standard
  ConfirmDialog for others. **`executeSubscriptionChange` is behind a server config flag** (default off
  until P12B2 is approved) and admin-only. **No public/customer access.** Reuse the P4 rate limiter (§20).

---

## 12. Migration plan — `0030_subscription_change_requests`

Additive, greenfield; mirrors prior phases (apply live → mirror to `supabase/migrations/` → regenerate
`database.ts` → README entry). **No changes to any legacy/checkout/Stripe table.**

1. `create table public.subscription_change_requests (...)` per §6 with CHECKs: `action_type` ∈ the 7;
   `status` ∈ {draft,previewed,approved,executing,executed,failed,cancelled,archived};
   `proration_behavior` null or ∈ {create_prorations,none,always_invoice}.
2. FKs: `customer_subscription_id → customer_subscriptions(id)` **RESTRICT**; `company_id → companies`,
   `contact_id → company_contacts` SET NULL; `requested_by/approved_by/executed_by/archived_by/created_by/
   updated_by → profiles(id)` SET NULL.
3. `touch_updated_at` trigger; **unique** partial index on `idempotency_key` (where not null); indexes on
   `customer_subscription_id`, `stripe_subscription_id`, `company_id`, `status`, `action_type`,
   `created_at desc`, partial `status where archived_at is null`.
4. `enable row level security` + the permission-gated SELECT policy; **no write policies.**
5. Seed the new `subscriptions.*` permissions (`on conflict (key) do nothing`); grants per §10 (idempotent
   `not exists`). *(P12B1 seeds request_change/preview_change; P12B2 seeds the execute perms.)*
6. `-- ROLLBACK:` comments on every block. Next migration after this is `0031`.

**No destructive change** to `subscriptions`/`customers`/`orders`/`payments`/`payment_links`/
`stripe_events`/`invoice_payments`/`invoice_payment_links`/checkout/webhook.

---

## 13. Server actions and queries

Module `src/modules/subscription-changes/` (keep P12A `subscriptions/` read/link/sync intact); a
server-only `stripe-mutations.ts` (preview + write wrappers). Actions: `'use server'` → zod →
`requireAuth()` + `hasPermission()` → eligibility/relationship checks → Stripe call (or none) → service-
role write → `logEvent` → `revalidatePath` → typed `{ok}|{error}`.

**Queries** (`import 'server-only'`, gated `subscriptions.read`): `listSubscriptionChangeRequests({q,
status,action_type,companyId,customerSubscriptionId,showArchived,page})`; `getSubscriptionChangeRequest(id)`
(+ display-safe preview/result, technical gated); `listChangeRequestsForSubscription(customerSubscriptionId)`;
`getAllowedSubscriptionActions(customerSubscriptionId)` (computes eligible actions from the registry/live
status + the viewer's permissions, for UI gating).

**Actions:**
- `createSubscriptionChangeRequest` — gate `request_change`; validate action + payload + eligibility;
  insert a `draft` request; audit `subscription.change_requested`.
- `previewSubscriptionChange` — gate `preview_change`; **read-only** upcoming-invoice preview; store
  `preview_payload` + `safe_summary`; set `previewed`; audit `subscription.change_previewed`. No Stripe
  write.
- `executeSubscriptionChange` — **(P12B2)** gate the per-action execute permission **+ admin**; require
  config flag on; **re-preview + drift check**; for `cancel_immediately` require type-to-confirm; call the
  Stripe write with `idempotencyKey=request.id`; on success → `executed` + `result_payload` + re-sync the
  registry + audit `subscription.change_executed` + the effect event (e.g. `subscription.plan_changed`);
  on error → `failed` + sanitized `error_summary` + audit `subscription.change_failed`. **No legacy table
  write.**
- `cancelSubscriptionChangeRequest` — gate `request_change`; only `draft/previewed/approved` → `cancelled`
  (a workflow cancel, **not** a Stripe cancel); audit `subscription.change_cancelled`.
- `archiveSubscriptionChangeRequest` / `restoreSubscriptionChangeRequest` — gate `subscriptions.archive`;
  archivable only when terminal (executed/failed/cancelled); soft-archive; audit.
- `updateChangeRequestNotes` — gate `request_change`.
- `syncSubscriptionAfterMutation` — internal; wraps the P12A `syncSubscriptionFromStripe`.

*(If a "direct action" UX is preferred over the request list, the thin wrappers `changeSubscriptionPrice`,
`changeSubscriptionQuantity`, `cancelSubscriptionAtPeriodEnd`, `undoCancelAtPeriodEnd`,
`cancelSubscriptionImmediately`, `pauseSubscriptionCollection`, `resumeSubscriptionCollection` each
**auto-create an auto-approved request row** and then call `executeSubscriptionChange` — they never skip
the request/audit trail.)*

Every action: validates, gates, idempotent on write, checks the registry↔Stripe relationship, sets the
right status, audits safely, revalidates `/app/subscriptions/[id]`, `/app/subscription-changes`, and the
company page.

---

## 14. UI / routes

- **`/app/subscriptions/[id]` action panel** (P12B): an "Actions" card gated per-permission — Change plan,
  Change quantity, Cancel at period end / Undo, Cancel immediately, Pause / Resume — each opening a
  **preview-then-confirm** flow. Plan/quantity show the **preview panel** (proration estimate + next
  charge) before a ConfirmDialog; **cancel_immediately uses type-to-confirm the `sub_…` id**; disabled
  states derive from `getAllowedSubscriptionActions` (status eligibility). Prominent warnings: **"Stripe
  is the source of truth"** and **"This changes real billing (proration may apply)."** When the execute
  flag is off (P12B1), the panel shows **Preview + Request** only (no live apply).
- **`/app/subscription-changes`** list — clickable rows, StatusBadge (`subscription_change`), filters
  (status/action_type/company), archived toggle, pagination, search, empty state.
- **`/app/subscription-changes/[id]`** detail — action, target subscription (link), status timeline,
  display-safe preview/result summary, requested/approved/executed-by, HistoryButton/Timeline, cancel/
  archive/restore (gated), notes editor.
- **Topbar:** reuse the existing "Subscriptions" nav; optionally a "Subscription changes" sub-link gated
  on `subscriptions.read`. Forbidden users blocked by `requirePermission`.

---

## 15. Company / contact integration

The company detail **Subscriptions section** (P12A) gains, **only for permitted users**, a small "pending
changes" indicator + a link to the change-requests filtered by that company; subscription action controls
live on the subscription detail (not duplicated on the company page). Contact integration stays as P12A
(link on the subscription detail). **CRM company/contact remain local SSOT; Stripe remains SSOT for
subscription state.** No auto-execution from the company page.

---

## 16. Webhook and sync strategy

**P12B does NOT change webhook handling (no P12C reconciliation).** After a successful mutation,
`executeSubscriptionChange` **immediately `retrieve`s the Stripe subscription and updates the P12A
registry snapshot** (reuse `syncSubscriptionFromStripe`) so the portal reflects the new state without
waiting for a webhook.

- **Events that will occur after a P12B mutation:** `customer.subscription.updated` (plan/quantity/cancel/
  pause/resume), `customer.subscription.deleted` (immediate cancel), and possibly `invoice.created`/
  `invoice.payment_succeeded` (proration). The **existing webhook** handles `customer.subscription.*` by
  upserting the **legacy `subscriptions` mirror** — **P12B must not interfere** with that path and must
  not write the legacy table itself.
- **Avoiding conflicting local updates:** the webhook writes the legacy `subscriptions` mirror; P12B's
  post-mutation sync writes the **P12A `customer_subscriptions`** registry — **different tables**, so no
  conflict. If both ever touch the registry (P12C), Stripe-authoritative last-write-wins on the snapshot
  is acceptable.
- **Staleness:** until P12C, the registry is kept fresh by the post-mutation sync + the manual P12A sync;
  between events it may lag (its `last_synced_at` is shown). **P12C (deferred) reconciles
  `customer.subscription.*` into `customer_subscriptions` idempotently via `stripe_events`.**

---

## 17. Audit / history

**Request-lifecycle events** (`entity_type='subscription_change'`, `entity_id`=request id):
`subscription.change_requested`, `subscription.change_previewed`, `subscription.change_approved`,
`subscription.change_cancelled`, `subscription.change_executed`, `subscription.change_failed`.
**Effect events on the registry** (`entity_type='subscription'`, `entity_id`=`customer_subscriptions.id`):
`subscription.plan_changed`, `subscription.quantity_changed`, `subscription.cancel_at_period_end_set`,
`subscription.cancel_at_period_end_removed`, `subscription.cancelled`, `subscription.paused`,
`subscription.resumed`. Add labels/colours in `src/lib/audit/display.ts`.

- **Safe (ordinary) metadata:** action_type, request id, **non-secret** Stripe ids (sub/customer/price),
  old→new plan_key/quantity (small scalars), status. **Forbidden:** raw proration/upcoming-invoice
  payload, raw amounts, Stripe error bodies, any secret/token. Raw before/after + preview/result go to
  technical `old_values`/`new_values`/`preview_payload`/`result_payload`, **gated by
  `audit.read_technical`**. History timeline renders the new events.

---

## 18. Relationship with invoices / payments / payment links

P12B **does not create invoices, `invoice_payments`, or `invoice_payment_links`**, and does not change
P10/P11. Subscription billing (and any proration invoice) is produced by **Stripe**, mirrored by the
**existing webhook → legacy `subscriptions`**; the portal P9 invoice is the separate internal document.
A future accounting/reconciliation phase may relate Stripe subscription invoices to portal invoices —
**deferred**.

---

## 19. Money handling

- **Currency** from Stripe (the registry snapshot; the webshop plans are CHF). **Amounts are previews/
  snapshots only — Stripe is authoritative.** Preview amounts (`preview_payload`) are estimates; executed
  amounts (`result_payload`) come from the Stripe response. **Display preview vs executed distinctly.**
- **Interval/quantity** read from Stripe; **proration** computed by Stripe (we only choose the
  `proration_behavior` and display the preview); **billing_cycle_anchor** unchanged by default; **tax/VAT**
  owned by Stripe (no local tax engine); rounding `round2` for display. **No accounting ledger.**

---

## 20. Rate limiting / abuse

**No public endpoints** — all authenticated, permission-gated server actions. **Preview** and **execute**
reuse the P4 `checkRateLimit` (per-user/per-subscription) to prevent Stripe API hammering and accidental
double-clicks; execute is additionally **confirm-gated + idempotent** (idempotencyKey = request id) so a
retry never double-applies. No background cron.

---

## 21. Legacy data / old admin (planning only)

Do **not** migrate `orders`/`subscriptions`/`customers`; do **not** rewrite checkout or `/api/checkout`;
do **not** change old `/[locale]/admin`; **P12B code never writes legacy tables directly** — a Stripe
mutation will *indirectly* cause the existing webhook to update the legacy `subscriptions` mirror, which
is expected and must be left alone. Future reconciliation path (P12C) recorded: `customer.subscription.*`
→ `customer_subscriptions` idempotently via `stripe_events`.

---

## 22. Files likely to create / update

**Create (P12B1):** `supabase/migrations/0030_subscription_change_requests.sql`;
`src/modules/subscription-changes/{schema,types,status,guards,queries,actions}.ts` + server-only
`stripe-mutations.ts`; `src/components/portal/subscription-changes/*` (request list/detail,
SubscriptionActionPanel, PreviewPanel, ConfirmDialog usages);
`src/app/(portal)/app/(protected)/subscription-changes/{page,[id]/page}.tsx`; tests
`subscription-changes.test.ts` + `p12b_subscription_changes.test.tsx`; `PORTAL_P12B_RUNBOOK.md`.
**Update (additive):** `src/app/(portal)/app/(protected)/subscriptions/[id]/page.tsx` (+ action panel),
`status/colors.ts` (+`subscriptionChangeStatusToken`), `StatusBadge.tsx` (+`'subscription_change'`),
`audit/display.ts` (+ the new events), `database.ts` (+ the new table + status type), `Topbar.tsx`
(optional sub-link), the company-detail Subscriptions section (pending-changes indicator),
`migrations/README.md`. **P12B2** wires `executeSubscriptionChange` to the writes + seeds the execute
perms. **No existing Stripe/webhook/checkout file is modified.**

---

## 23. Tests

- **Migration/RLS** (live probe): permission-less `sub` → 0 rows on `subscription_change_requests`;
  `subscriptions.read` → visible.
- **Permissions:** request/preview = sales+admin; **all execute perms admin-only**; the 7-action matrix.
- **Stripe mocking:** preview calls the upcoming-invoice API (read) and stores a sanitized summary;
  execute calls the **right** write per action with `idempotencyKey=request.id`; **no write occurs in
  P12B1 / when the flag is off**; on Stripe error → `failed` + sanitized error.
- **Idempotency / drift:** re-running execute with the same request id does not double-apply; a drifted
  subscription forces re-preview and aborts.
- **Eligibility:** actions gated by `SUBSCRIPTION_MUTABLE_STATUSES`; cancel/pause/resume status rules.
- **Status/audit:** request lifecycle + effect events labelled; **no raw proration/amounts/secrets in
  ordinary metadata** (test-enforced).
- **Source invariants:** no `subscriptions.update/cancel/resume`/`pause_collection`/`checkout.sessions`
  **outside the approved execute helper**; **no legacy-table writes** (`subscriptions`/`customers`/`orders`/
  `payments`/`payment_links`/`stripe_events`), no `/api/checkout`; no `STRIPE_SECRET`/`sk_`/`getStripe` in
  client components; rows never hard-deleted.
- **Regression:** old `/api/checkout` + the webhook + P5–P12A suites green; `npx tsc --noEmit`,
  `npx vitest run`, `npm run build`.

---

## 24. Manual smoke checklist (Stripe **test mode** only)

In Stripe test mode create a customer + subscription, link it (P12A). **P12B1:** create a change request,
**preview** a plan change (proration shown), preview a quantity change — confirm **no Stripe write
occurred**. **P12B2 (flag on, admin):** execute the plan change on the test subscription → **sync after
mutation** → registry snapshot updates; execute a quantity change; **set cancel_at_period_end** → undo it;
**pause** → **resume** (if supported by the test API version); **cancel_immediately** only on a disposable
test subscription (type-to-confirm). Verify a `failed` path (e.g. bad price) records sanitized error. As
**sales**: can request + preview, **cannot execute**. As **read_only**: view only; **no action controls**.
Confirm `/api/checkout`, the Stripe webhook (legacy `subscriptions` mirror still updates), old `/admin`,
and P10/P11 are unaffected.

---

## 25. Rollback plan

- **Code:** revert the P12B commit(s) — the subscription-changes module/routes/components, the action
  panel, status/audit/database.ts additions revert together. **P12B1 has no Stripe writes to undo.**
- **Migration (greenfield):** `drop table public.subscription_change_requests;` + delete the new perms +
  grants (see `-- ROLLBACK:`). No other table touched. Never edit the applied migration.
- **Executed Stripe mutations are NOT auto-reversible** (a cancel/proration cannot be undone by a code
  revert). To correct, an admin must perform a compensating change in Stripe (e.g. re-create/re-activate)
  and re-sync the registry — documented in the runbook.
- **Disable without rollback:** turn off the execute config flag (P12B2) / remove the execute grants → the
  UI falls back to preview+request only.
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

---

## 26. Risks and open questions (defaults in **bold**)

1. **Proration complexity** — Stripe computes it; we **preview + display** and choose
   `proration_behavior` (**default create_prorations**); never compute locally.
2. **Billing-cycle anchor** — **left unchanged** in v1.
3. **Multiple subscription items** — v1 requires an explicit `subscription_item_id`; **block ambiguous
   multi-item plan changes**.
4. **Coupons / trials** — **surfaced read-only**, not edited.
5. **Tax/VAT** — **owned by Stripe**; no local engine.
6. **Preview accuracy / staleness** — preview is advisory; **fresh re-preview + drift check immediately
   before execute**.
7. **API-version differences** — preview-method name (`retrieveUpcoming` vs `createPreview`) and
   `subscriptions.resume` are version-sensitive → **a wrapper + test-mode verification** before P12B2.
8. **Webhooks racing manual sync** — different tables; **Stripe-authoritative; manual/post-mutation sync
   resolves**; full reconciliation is **P12C**.
9. **Destructive cancellation risk** — **admin-only + type-to-confirm + no auto-reverse**.
10. **Permission model** — **execution admin-only**; sales request/preview only.
11. **Customer communication** — out of scope (no email automation); note in the runbook that a
    cancellation/plan change may trigger Stripe's own customer emails per the Stripe dashboard settings.
12. **Future** — customer portal + accounting/reconciliation remain deferred.

---

## 27. Final readiness checklist

- **P12B spec ready:** **Yes.** Greenfield confirmed (`0030`), P12A registry + sync confirmed live, Stripe
  SDK 17.7.0 mutation/preview/resume primitives confirmed present (with the noted API-version caveats),
  the request/preview/execute model + table + permissions + RLS + audit + UI + tests + rollback are
  specified against the live schema and the P10/P11/P12A precedent. **No build, no migration created; no
  Stripe write performed.**
- **Blockers:** none for P12B1. For **P12B2**, two pre-build verifications (in Stripe **test mode**): (a)
  confirm the installed SDK's upcoming-invoice preview method name, (b) confirm `subscriptions.resume`
  behaviour for the account's API version.
- **Decisions needed before build:** the §26 items (all have safe defaults); confirm the **B1-then-B2
  split**; confirm **execution admin-only**; confirm the **request-workflow-required** model (vs direct
  actions).
- **Recommended safe defaults:** build **P12B1 only first** (request + preview, **no Stripe writes**);
  defer **P12B2** (live mutations) to a separate approval, **admin-only, test-mode-first, behind a config
  flag, with fresh re-preview + type-to-confirm**; proration default `create_prorations`; billing-cycle
  unchanged; single-item only unless an item is explicitly chosen.

**Exact approval question:** *"Approve **P12B1** Subscription Change Requests + Preview as specified — a
new greenfield `subscription_change_requests` table (migration `0030`), a request→preview workflow with
**read-only** Stripe upcoming-invoice previews, permissions `subscriptions.request_change`/`preview_change`
(sales + admin), eligibility from `SUBSCRIPTION_MUTABLE_STATUSES`, full audit, **no Stripe writes and no
legacy/checkout/webhook changes** — with the §26 defaults, and build P12B1 only? **P12B2 (live execute of
plan/quantity/cancel/pause/resume — admin-only, test-mode-first, behind a flag) stays deferred until
separately approved.** Or change any §26 decision first?"*

**Do not build yet. Awaiting the P12B1 approval + the §26 decisions.**
