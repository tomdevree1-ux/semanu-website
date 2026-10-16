# PORTAL P12 — STRIPE SUBSCRIPTION MANAGEMENT — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8 + the live Supabase schema + current repo state. Builds on P5 CRM + P10 Payments +
P11 Payment Links. **This is the highest-risk finance phase** (it can change live customer billing), so
the recommendation is deliberately conservative.

---

## 1. P12 objective

P12 lets staff **view, link and sync existing Stripe subscriptions** to CRM companies/contacts from
inside the portal, and lays the groundwork for safe mutations later — **without** rewriting checkout,
migrating legacy `orders`/`subscriptions`/`customers`, or breaking the existing webshop billing.

**Recommendation: build P12A (read / link / sync) ONLY now.** Subscription **mutations** (change
price/quantity, cancel, pause/resume) are higher-risk than payment links — proration, billing-cycle
anchors, coupons/trials, irreversibility, and direct customer billing consequences — and the existing
webhook already fires `customer.subscription.updated` on every change, so a mutation path must be
coordinated with sync. **Mutations are deferred to P12B; webhook reconciliation to P12C** — both fully
specified here but **not built** until separately approved.

---

## 2. Current-state dependency check (inspected live + repo)

- **No new table exists.** `to_regclass('public.customer_subscriptions')` and `public.subscription_links`
  are null → P12A is **greenfield**.
- **Migration numbering.** Latest applied is `0028_invoice_payment_links` (`20260611110741`). **Next
  additive number is `0029`.**
- **Legacy `subscriptions` (8 cols) — the live webhook-written Stripe mirror, NOT to be touched:**
  `id text NOT NULL PK` = **the Stripe subscription id**, `created_at`, `updated_at`, `customer_id uuid
  NOT NULL → customers ON DELETE CASCADE`, `status text NOT NULL` (**raw Stripe status, no CHECK**),
  `plan text` (CHECK `starter/business/webshop`), `current_period_end`, `cancel_at_period_end boolean`.
  RLS on with a `subscriptions_select_own` policy. Written by `/api/stripe/webhook`
  `handleSubscriptionEvent` (upsert by `id`). **No company_id, contact_id, stripe_customer_id,
  product/price ids, quantity, amount, interval, trial, metadata, sync fields, archive, created_by, or
  notes.**
- **Legacy `customers` (18 cols):** `stripe_customer_id`, **`company_id`**, `email`, `billing_*`,
  `customer_status`, `payment_status`, … — the Stripe-customer ↔ CRM-company bridge (the webhook
  upserts it). Customer-linked subscriptions reach a company via `customers.company_id`.
- **Stripe code (read):** `getStripe()` (server-only secret client); `plans.ts`
  (`PlanId='starter'|'business'|'webshop'`, `PLAN_AMOUNT_CHF`, `planPriceId` → env Price ids,
  `stripeLocale`); `/api/checkout` (subscription-mode Checkout Sessions for the webshop plans);
  `/api/stripe/webhook` handles `checkout.session.completed` (orders) + `customer.subscription.*`
  (mirrors `subscriptions`). **`stripe_events`** (id/type/created_at) exists but is **not yet written**
  by the webhook (available for P12C idempotency).
- **P10 `invoice_payments` (24)** + **P11 `invoice_payment_links` (24)** are the internal payment +
  Stripe-link layers (CHF, invoice-linked). Subscriptions are a separate concern (recurring webshop
  billing).
- **Permission modules in use:** audit, catalog, companies, contacts, invoices, org, payment_links,
  payments, projects, quotes, users. `subscriptions` will be a **new module**.
- **No conflict with old `/[locale]/admin`** (untouched). **No business-table rewrite needed** —
  greenfield registry + FKs into existing tables; the legacy `subscriptions`/`customers`/checkout/
  webhook stay intact.

---

## 3. Scope boundaries

**In scope (P12A — read / link / sync):**

- A new greenfield **`customer_subscriptions`** registry (additive `0029`) — a **synced snapshot** of a
  Stripe subscription + the **CRM link** (company/contact) + portal fields (notes, archive, sync
  metadata). **Stripe is authoritative**; the registry is a read/searchable view.
- **`linkExistingStripeSubscription`** (link a Stripe subscription id to a CRM company/contact) and
  **`syncSubscriptionFromStripe`** / **`syncSubscriptionsForCustomer`** (server-side `subscriptions.
  retrieve`/`.list` → upsert the snapshot). **No Stripe writes.**
- list/detail UI under `/app/subscriptions`, company/contact detail sections, archive/restore, audit,
  permissions, permission-gated read RLS, tests, docs + runbook.

**Out of scope (P12A):** all **mutations** (change price/quantity, cancel, pause/resume) → **P12B**;
**webhook reconciliation** → **P12C**; checkout rewrite; `/api/checkout` change; migration of legacy
`orders`/`subscriptions`/`customers`; Stripe product/price **sync** (only a read-only lookup of the
linked price); recurring-billing rewrite; new subscription checkout; public customer portal;
payment-link changes; invoice-payment webhook reconciliation; accounting ledger/export; revenue
recognition; refund automation; tax/VAT engine; invoice PDF/email automation; role editor; org settings;
`/admin` removal; business-table rewrite; **hard deletes**.

**Deferred to later phases:** **P12B** subscription mutations (admin-only, preview-before-apply, explicit
proration, idempotency, confirmations — §10); **P12C** subscription **webhook reconciliation** (auto-sync
the registry + `stripe_events` idempotency — §17); multi-currency reporting; `organization_id`; a future
customer portal; accounting/reconciliation.

---

## 4. Recommended phase split

| Phase | Scope | Risk | Recommendation |
|---|---|---|---|
| **P12A — Subscription Registry / Read & Link** | new `customer_subscriptions`, link to CRM, manual sync from Stripe, read-only view, audit | **Low** (no Stripe writes) | **Build now.** |
| **P12B — Subscription Mutations** | change price/quantity, cancel (now / period end), pause/resume, preview, proration | **High** (live billing, irreversible, proration) | **Defer.** Spec'd §10; admin-only; build only after P12A is proven. |
| **P12C — Subscription Webhook Reconciliation** | extend the webhook (additively) to keep the registry synced; `stripe_events` idempotency | **Medium** (touches the live webhook) | **Defer.** Spec'd §17; until then, **manual sync** keeps the registry fresh (and it may be stale). |

**Grounding:** the live `subscriptions` table is already the webhook mirror, and mutating Stripe is
irreversible with proration/coupon/trial side effects + a webhook that fires on every change. The safe
order is **establish the read/link/sync registry + audit first (P12A)**, then add mutations (P12B) and
auto-sync (P12C) once the read path and the team's confidence are established.

---

## 5. Naming decision

- **Feature name:** **Subscriptions** (UI label "Subscriptions"; an individual one is a "customer
  subscription").
- **Database table:** **`public.customer_subscriptions`** (NOT `subscriptions` — that is the live legacy
  webhook mirror). Single registry table.
- **Routes:** `/app/subscriptions`, `/app/subscriptions/[id]`, and `/app/subscriptions/link` (link an
  existing Stripe subscription id).
- **Audit entity name:** `subscription` (`entity_type = 'subscription'`).
- **Permission module:** `subscriptions` (keys `subscriptions.*`). (No collision — the legacy
  `subscriptions` *table* is not a permission module.)

---

## 6. Reuse vs extend vs new table decision (grounded in the live schema)

**Decision: create a NEW greenfield `customer_subscriptions` registry. Do NOT reuse or extend the
legacy `subscriptions` table.**

| Option | Verdict | Why |
|---|---|---|
| **Reuse `subscriptions`** | ✗ | The live **webhook mirror** (id = Stripe sub id, customer-linked, raw status, RLS `subscriptions_select_own`). It has no company/contact link, no product/price/quantity/amount/trial, no sync/archive/audit fields. Reusing entangles the portal registry with the webhook and the webshop flow. |
| **Extend `subscriptions`** | ✗ | Adding company/contact/registry columns to a **webhook-written** table is a **business-table modification** — out of scope and risks the live sync. |
| **New `customer_subscriptions`** | ✓ **Chosen** | Additive, non-destructive, CRM-linked, full Stripe snapshot + sync metadata + archive + audit; references `companies`/`company_contacts`/`customers` softly. **Stripe stays authoritative**; the legacy `subscriptions` mirror + webhook stay untouched. |
| `subscription_links` (thin bridge) | ✗ (chosen variant) | A thin link-only table would still need a live Stripe read on every view; the registry snapshot is better for list/search/filter and prepares P12C. |
| Read-only registry view | partial | Conceptually right — the registry **is** read-only in P12A (no Stripe writes); it's a real table, not a SQL view, so it can hold the CRM link + portal fields. |

---

## 7. Data model proposal — `public.customer_subscriptions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` / `updated_at` | timestamptz NOT NULL | touch trigger |
| `company_id` | uuid NULL | → `companies(id)` **SET NULL** (the CRM link; optional) |
| `contact_id` | uuid NULL | → `company_contacts(id)` **SET NULL** |
| `customer_id` | uuid NULL | → `customers(id)` **SET NULL** (legacy Stripe-customer row, optional) |
| `stripe_customer_id` | text NULL | Stripe customer id (reference) |
| `stripe_subscription_id` | text NOT NULL | **UNIQUE** — the registry key (one row per Stripe sub) |
| `stripe_product_id` | text NULL | the subscription item's product |
| `stripe_price_id` | text NULL | the subscription item's price |
| `plan_key` | text NULL | internal plan if resolvable (`starter`/`business`/`webshop`) |
| `status` | text NOT NULL | **Stripe status snapshot** (no hard CHECK — forward-compatible; see §9) |
| `current_period_start` / `current_period_end` | timestamptz NULL | snapshot |
| `cancel_at_period_end` | boolean NOT NULL default false | snapshot |
| `cancelled_at` | timestamptz NULL | snapshot |
| `trial_start` / `trial_end` | timestamptz NULL | snapshot |
| `quantity` | integer NULL | snapshot |
| `currency` | text NULL | snapshot (NOT CHF-locked — Stripe authoritative) |
| `amount` | numeric(12,2) NULL | snapshot of the recurring unit amount (price.unit_amount/100) |
| `interval` | text NULL | `month`/`year` snapshot |
| `metadata` | jsonb NULL | **safe** Stripe metadata snapshot (no secrets) |
| `last_synced_at` | timestamptz NULL | when the snapshot was last refreshed |
| `sync_status` | text NOT NULL default 'pending' | CHECK `pending/synced/failed` |
| `archived_at` / `archived_by` | timestamptz / uuid NULL | soft-archive (archived_by → profiles SET NULL) |
| `created_by` / `updated_by` | uuid NULL | → profiles SET NULL |
| `notes` / `internal_notes` | text NULL | |

### Decisions & justifications

- **`company_id` optional** (and `contact_id`/`customer_id` optional): a Stripe subscription may not map
  cleanly to a CRM company yet — link cautiously. **CRM is the source of truth for the company/contact;
  Stripe is the source of truth for the subscription state.** *(Decision; default optional.)*
- **`stripe_subscription_id` NOT NULL + UNIQUE** — the registry key; one row per Stripe subscription
  (prevents duplicate links). **`stripe_customer_id` stored** (reference), not mandatory.
- **Amounts/status/period are snapshotted** for list/search/display, but **Stripe is authoritative** —
  the registry is refreshed by `syncSubscriptionFromStripe` (P12A) / the webhook (P12C). The registry is
  **never the billing authority**.
- **`status` has no hard CHECK** (mirrors the legacy table) so a sync never fails on a new Stripe status;
  the StatusBadge maps known values (§9). `sync_status` (internal) does have a CHECK.
- **`organization_id` deferred**; **rows never hard-deleted** (archive — archiving a registry row only
  hides the CRM link; it never touches Stripe or the legacy `subscriptions` mirror).

---

## 8. Stripe integration model

- **All Stripe calls server-side only** via `getStripe()` (secret key never client-side; no Stripe
  secret in any client component).
- **P12A reads only:**
  - **Link/sync one:** `stripe.subscriptions.retrieve(subId, { expand: ['items.data.price.product',
    'customer'] })` → map to the registry (status, period, item price/product/quantity, price
    unit_amount → `amount`, recurring.interval, trial, cancel_at_period_end, metadata, currency).
  - **Sync for a customer:** `stripe.subscriptions.list({ customer: stripeCustomerId, limit: 100 })` →
    upsert each. **Handle Stripe pagination** (`has_more` + `starting_after`) defensively (cap pages).
  - **List in the portal:** from the **local registry** (not a live Stripe list) — fast, filterable,
    no per-view Stripe cost; a per-row **Sync** action refreshes from Stripe.
- **Id mapping:** `stripe_customer_id` ↔ `customers.stripe_customer_id` ↔ `customers.company_id`
  (auto-suggest the company on link); `stripe_subscription_id` is the registry key;
  `stripe_price_id` → `plan_key` via a **read-only lookup** of `plans.ts` (env Price ids) where it
  matches a webshop plan.
- **Idempotency:** link/sync are **read+upsert** (no Stripe writes) — idempotent on the unique
  `stripe_subscription_id`. (P12B write mutations use Stripe idempotency keys — §10.)
- **Failure handling:** on a Stripe retrieve error, set `sync_status='failed'`, audit
  `subscription.sync_failed` (no secret in metadata), return a safe error; the prior snapshot stays.
- **Logging:** never log Stripe secrets or full subscription payloads; log the subscription id + a
  status only. **Stripe test mode first** for all smoke testing.

---

## 9. Subscription status model

`status` snapshots the **Stripe** subscription status. StatusBadge token mapping:

| Stripe status | Token | | Stripe status | Token |
|---|---|---|---|---|
| `incomplete` | `warning` | | `past_due` | `warning` |
| `incomplete_expired` | `cancelled` | | `canceled` | `cancelled` |
| `trialing` | `waiting` | | `unpaid` | `failed` |
| `active` | `done` | | `paused` | `warning` |
| *(unknown)* | `system` | | *(archived — `archived_at` set)* | `cancelled` |

- **No hard `status` CHECK** (forward-compatible; unknown → `system`). **Terminal (Stripe):** `canceled`,
  `incomplete_expired`. **Internal archive** is a separate `archived_at` flag (not a status value) —
  archiving hides the registry row; **restore** clears `archived_at` (the snapshot stays as last synced).
- **Mutation eligibility (P12B, deferred):** mutations allowed only for **`active`/`trialing`/`past_due`/
  `paused`** subscriptions; **cancel** allowed for `active`/`trialing`/`past_due`; **pause/resume** only
  where Stripe supports it for the price. `canceled`/`incomplete_expired` are read-only.
- `sync_status` (internal): `pending` → `synced` (after a successful retrieve) / `failed`.

---

## 10. Mutation model — **DEFERRED to P12B (specified, not built)**

When P12B is approved (admin-only), each mutation is a server action that: validates → checks
`subscriptions.update`/`.cancel` → checks Stripe eligibility (§9) → **previews** → applies via Stripe
(idempotency key) → **re-syncs the registry** → audits request + result → revalidates.

- **change price/plan** — `stripe.subscriptions.update(id, { items: [{ id: itemId, price: newPriceId }],
  proration_behavior })`.
- **change quantity** — `subscriptions.update(id, { items: [{ id: itemId, quantity }], proration_behavior })`.
- **cancel at period end** — `subscriptions.update(id, { cancel_at_period_end: true })`; **undo** →
  `cancel_at_period_end: false`.
- **cancel immediately** — `subscriptions.cancel(id)` — **type-to-confirm**; irreversible.
- **pause / resume collection** — `subscriptions.update(id, { pause_collection: {...} })` / clear it
  (where supported).
- **Proration: explicit per action** — default `create_prorations`; a "no proration"
  (`none`) option is offered and **must be chosen deliberately**. `billing_cycle_anchor` stays
  `unchanged` unless explicitly set. **Trials/coupons:** surfaced read-only in the preview; not edited
  in P12B v1.
- **Preview before apply (required for price/quantity):** `stripe.invoices.retrieveUpcoming({
  subscription, subscription_items, subscription_proration_behavior })` → show the proration line(s) and
  the next charge **before** the admin confirms.
- **Destructive confirmation:** type-to-confirm the **Stripe subscription id** (or a short reference) for
  cancel-immediately / pause; a simpler confirm for cancel-at-period-end / quantity.
- **Permission:** mutations are **admin-only** (`subscriptions.update` / `subscriptions.cancel`). **Sales
  cannot execute** mutations; sales may **link/sync** (P12A) and, if wanted later, file a
  `subscription.change_requested` audit/request (no Stripe write). *(Decision.)*
- **Failure / rollback:** Stripe mutations are **not auto-rolled-back** (a cancel cannot be trivially
  undone; proration is applied). On a Stripe error the action returns the safe error and does **not**
  optimistically update the registry; on success it re-syncs from Stripe (authoritative). **This
  irreversibility is exactly why P12B is deferred.**

---

## 11. Permissions model

**P12A permissions (4):** `subscriptions.read`, `subscriptions.link`, `subscriptions.sync`,
`subscriptions.archive`. *(P12B adds `subscriptions.update`, `subscriptions.cancel` — admin-only.)*

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `subscriptions.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `subscriptions.link` | ✓ | ✓ | — | — | — |
| `subscriptions.sync` | ✓ | ✓ | — | — | — |
| `subscriptions.archive` | ✓ | — | — | — | — |
| *(P12B)* `subscriptions.update` | ✓ | — | — | — | — |
| *(P12B)* `subscriptions.cancel` | ✓ | — | — | — | — |

Rationale: **link + sync are non-destructive** (no Stripe writes), so sales may do them; **archive is
admin-only**; **all Stripe mutations are admin-only** (P12B). No role editor UI.

---

## 12. RLS / security model

- **Reads: permission-gated RLS** — `create policy customer_subscriptions_select on
  public.customer_subscriptions for select to authenticated using (has_permission('subscriptions.read')
  or is_platform_super_admin());`. **No INSERT/UPDATE/DELETE policies.**
- **All writes** via **service-role** `'use server'` actions, gated by `requireAuth()` +
  `hasPermission()`. **No client writes; no service-role import in client components.**
- **No Stripe secrets client-side** — Stripe runs in server actions via `getStripe()`.
- **Customer billing data is sensitive** (amounts, billing email via the linked customer): visible only
  to `subscriptions.read`; Stripe customer/subscription/price ids are **references, not secrets**, and
  may show in the portal + technical audit fields, **not** in ordinary audit metadata beyond ids.
- **Archived rows hidden by default**; platform-super-admin via `is_platform_super_admin()`; audit
  technical fields gated by `audit.read_technical`. **No public app / customer access** (out of scope).
- The legacy `subscriptions` table keeps its own `subscriptions_select_own` policy — **untouched**.

---

## 13. Migration plan — `0029_customer_subscriptions`

Additive, greenfield; mirrors prior phases. Apply live (`apply_migration` name
`0029_customer_subscriptions`), mirror to `supabase/migrations/`, regenerate `database.ts`, README entry.
**No changes to `subscriptions`/`customers`/`orders`/`payments`/`payment_links`/`invoice_payments`/
`invoice_payment_links`/`stripe_events`/checkout/Stripe.**

1. `create table public.customer_subscriptions (...)` per §7 with CHECKs: `sync_status in
   ('pending','synced','failed')`; (no hard `status`/`currency` CHECK — forward-compatible);
   `quantity >= 0` if present.
2. FKs: `company_id → companies SET NULL`; `contact_id → company_contacts SET NULL`; `customer_id →
   customers SET NULL`; `archived_by/created_by/updated_by → profiles SET NULL`.
3. `touch_updated_at` trigger.
4. Indexes: **unique `stripe_subscription_id`**; `company_id`; `contact_id`; `customer_id`;
   `stripe_customer_id`; partial `status` (`where archived_at is null`); `created_at desc`.
5. `enable row level security` + the permission-gated `customer_subscriptions_select` policy. **No write
   policies.**
6. Seed the 4 `subscriptions.*` permissions (`on conflict (key) do nothing`).
7. Seed role grants (idempotent) per §11.
8. `-- ROLLBACK:` comments on every block.

Next migration after this is `0030`.

---

## 14. Server actions and queries

Module `src/modules/subscriptions/`. Actions: `'use server'` → zod → `requireAuth()` +
`hasPermission()` → relationship checks → **server-side Stripe read** (link/sync) → service-role upsert →
`logEvent` → `revalidatePath` → typed `{ ok } | { error }`.

**Queries (`queries.ts`, `import 'server-only'`, service-role, gated `subscriptions.read`):**

- `listSubscriptions(filters)` — search (sub/customer id, company), filters status/company/sync_status,
  archived-hidden-by-default, 25/page; from the **local registry**.
- `getSubscription(id)` — registry row + company/contact/customer names + archived hints.
- `listSubscriptionsForCompany(companyId)` / `listSubscriptionsForContact(contactId)` — for CRM detail
  sections.
- `suggestCompanyForStripeCustomer(stripeCustomerId)` — look up `customers.company_id` to pre-fill the
  link.

**Actions (P12A — `actions.ts`):**

- `linkExistingStripeSubscription` — `subscriptions.link`; input a `stripe_subscription_id` (+ optional
  company/contact); **retrieve from Stripe** (validate it exists), upsert a registry row (unique on the
  sub id; reject duplicates with a clear message), resolve `stripe_customer_id`/price/product/plan_key,
  set `last_synced_at`/`sync_status='synced'`; audit `subscription.linked` + `subscription.synced`.
- `syncSubscriptionFromStripe` — `subscriptions.sync`; re-retrieve + upsert the snapshot; audit
  `subscription.synced` (or `subscription.sync_failed`).
- `syncSubscriptionsForCustomer` — `subscriptions.sync`; `subscriptions.list({ customer })` (paginated) →
  upsert each; audit per row.
- `updateSubscriptionNotes` — `subscriptions.link`; edit notes/internal_notes + optionally re-assign the
  company/contact link (CRM link only — no Stripe write); audit `subscription.updated` (field names).
- `archiveSubscriptionLink` / `restoreSubscriptionLink` — `subscriptions.archive`; type-to-confirm the
  Stripe sub id; archive hides the registry row (does **not** touch Stripe); restore clears
  `archived_at`; audit `subscription.archived` / `.restored`.

**Actions (P12B — deferred):** `previewSubscriptionChange`, `changeSubscriptionPrice`,
`changeSubscriptionQuantity`, `cancelSubscriptionAtPeriodEnd`, `cancelSubscriptionImmediately`,
`resumeSubscription`, `pauseSubscriptionCollection` — admin-only, idempotent, re-sync after, audited
(§10). **Not built in P12A.**

Error handling: safe messages; **no Stripe error bodies/secrets logged**; revalidate `/app/subscriptions`,
`/app/subscriptions/[id]`, and the linked company/contact pages.

---

## 15. UI / routes

Routes under `src/app/(portal)/app/(protected)/subscriptions/`: `page.tsx` (list), `[id]/page.tsx`
(detail), `link/page.tsx` (link an existing Stripe subscription id). Topbar gains **"Subscriptions"**
gated on `subscriptions.read`.

- **List** (`SubscriptionTable`): clickable rows; columns Stripe sub id (short) / company / customer /
  **StatusBadge** / plan or price / amount + interval / current period end / cancel-at-period-end / last
  synced; search; status/company/sync filters; archived toggle; pagination; empty states. A **"Link
  subscription"** button (gated `subscriptions.link`).
- **Link** (`SubscriptionLinkForm`): a `stripe_subscription_id` field + optional company/contact pick;
  posts to `linkExistingStripeSubscription`; surfaces the resolved details on success.
- **Detail** (`SubscriptionDetailActions`): header (status + amount/interval) + HistoryButton; company/
  contact/customer links; **Stripe ids** (read-only references); current period / trial /
  cancel-at-period-end; notes EditableBlock; a **Sync** button (gated `subscriptions.sync`); archive
  (type-to-confirm) / restore. *(P12B would add the mutation controls behind admin permissions + a
  preview + ConfirmDialog — not in P12A.)* HistoryButton/HistoryTimeline.

---

## 16. Company / customer / contact integration

- **Company detail:** a **Subscriptions** section (additive, like P9/P10/P11 sections) listing the
  company's linked subscriptions (status, plan, amount, period) — `subscriptions.read` gated.
- **Contact detail:** an optional related-subscriptions list when a subscription is contact-linked.
- **Linking** is by **Stripe subscription id**, with the company auto-suggested from
  `customers.stripe_customer_id → customers.company_id`; the linker may override the CRM company/contact.
- **Duplicate detection:** the unique `stripe_subscription_id` rejects re-linking the same subscription;
  the link UI looks up an existing registry row first and offers "open" instead of "link".
- **Unknown customer/company:** allowed — link with `company_id` null (a Stripe subscription with no CRM
  match), to be assigned later. **CRM stays the source of truth for the company/contact; Stripe for the
  subscription state.**

---

## 17. Webhook synchronization strategy — **DEFERRED to P12C (specified, not built)**

**P12A does NOT change the webhook.** The registry is refreshed by the **manual** `syncSubscriptionFromStripe`
/ `syncSubscriptionsForCustomer` actions; **between syncs the registry may be stale** (the detail page
shows `last_synced_at` + a "Sync" button).

**When P12C is approved (additive):**

- Extend `/api/stripe/webhook` `handleSubscriptionEvent` to **also** upsert the `customer_subscriptions`
  registry on `customer.subscription.created/updated/deleted` (status, period, cancel_at_period_end,
  price/quantity), in addition to the existing legacy `subscriptions` mirror — the legacy upsert stays
  **byte-for-byte intact**.
- Optionally handle `invoice.payment_succeeded` / `invoice.payment_failed` to update a subscription's
  payment health, and `customer.updated` for the CRM bridge.
- **Idempotency via `stripe_events`:** `insert (id, type) … on conflict do nothing`; skip if seen
  (P12C is where `stripe_events` starts being written).
- Audit safely (`subscription.synced`), no secrets; **never break the legacy order/subscription path**.

**Stored references that prepare P12C:** the registry's `stripe_subscription_id` (unique) + `customer_id`
+ `stripe_customer_id` are the join keys the webhook will use.

---

## 18. Audit / history

**P12A events:** `subscription.linked`, `subscription.synced`, `subscription.updated`,
`subscription.archived`, `subscription.restored`, `subscription.sync_failed`. **P12B (deferred):**
`subscription.change_requested`, `subscription.price_changed`, `subscription.quantity_changed`,
`subscription.cancel_at_period_end_set`, `subscription.cancelled`, `subscription.resumed`,
`subscription.paused`.

- `entity_type = 'subscription'`; `entity_id` = the registry row id.
- **Safe (ordinary) metadata:** `subscription.linked` `{ stripe_subscription_id, company_id }`;
  `subscription.synced` `{ stripe_subscription_id, status }`; `subscription.updated` `{ fields }`;
  status/mutation events carry `old_status`/`new_status` + the (non-secret) ids.
- **Forbidden in ordinary metadata:** any **amount** / raw billing payload, the customer's **billing
  email/address**, and any **Stripe secret/token**. Stripe **ids** (sub/customer/price) are non-secret
  references and may appear; raw before/after snapshots go only to technical `old_values`/`new_values`
  (gated by `audit.read_technical`).
- **Display:** add the `subscription.*` labels/colours in `src/lib/audit/display.ts`; the History
  timeline renders them.

---

## 19. Relationship with invoices / payments / payment links

- **P12A does not link subscriptions to P9 invoices** (subscriptions are recurring Stripe billing; P9
  invoices are the internal document). A future reconciliation phase could relate a subscription's Stripe
  invoices to portal invoices — **deferred**.
- **Subscription payments do NOT create P10 `invoice_payments`** in P12 (that is the deferred
  invoice-payment reconciliation, out of scope here).
- **Subscription checkout remains the legacy `/api/checkout` + webhook flow** — unchanged.
- **P12 does not affect P10/P11** (separate tables + flows). The `customer_subscriptions` registry is a
  read/link layer over the Stripe subscription, independent of the invoice payment/links layers.

---

## 20. Money handling

- **Currency from Stripe** (stored on the snapshot — **not** CHF-locked, since a Stripe subscription
  could be any currency); the webshop plans are CHF.
- **`amount` = the recurring unit amount snapshot** (`price.unit_amount / 100`, 2-dp); **`interval`** =
  `price.recurring.interval`; **`quantity`** = the item quantity. **Display/search only — Stripe is
  authoritative.**
- **Proration / tax** are **not computed** in P12A (Stripe owns them; P12B previews via Stripe's upcoming
  invoice). **No accounting ledger, no revenue recognition.** Rounding `round2` for display.

---

## 21. Rate limiting / abuse

- **No public endpoints** — all actions are authenticated, permission-gated server actions.
- **Sync actions call Stripe** — a light per-user/per-subscription rate limit (reuse `checkRateLimit`) on
  `syncSubscriptionFromStripe` / `syncSubscriptionsForCustomer` prevents accidental Stripe API hammering.
- **P12B mutation actions** are confirm-gated + admin-only (when built). No Turnstile (staff-only).

---

## 22. Legacy data / old admin (planning only)

- **Do not migrate** `orders`/`subscriptions`/`customers`; **do not rewrite checkout**; **do not change**
  old `/[locale]/admin`; **do not mutate** the legacy `subscriptions` mirror, `customers`, `stripe_events`
  (except the additive `stripe_events` idempotency insert **only if** P12C is approved).
- **Future reconciliation path** recorded: the registry's `stripe_subscription_id` ↔ legacy
  `subscriptions.id`; `stripe_customer_id` ↔ `customers.stripe_customer_id` ↔ `company_id`. P12C wires
  the webhook; a later accounting phase relates Stripe invoices to portal invoices.
- **No business-table rewrite.**

---

## 23. Files likely to create / update

**Create (P12A):** `supabase/migrations/0029_customer_subscriptions.sql`;
`src/modules/subscriptions/{schema,types,status,guards,queries,actions}.ts` + a server-only
`stripe.ts` (subscription retrieve/list + mapping);
`src/app/(portal)/app/(protected)/subscriptions/{page.tsx,[id]/page.tsx,link/page.tsx}`;
`src/components/portal/subscriptions/{SubscriptionTable,SubscriptionLinkForm,SubscriptionDetailActions,CompanySubscriptionsSection}.tsx`;
tests `src/modules/subscriptions/subscriptions.test.ts` + `src/components/portal/ui/p12_subscriptions.test.tsx`;
`PORTAL_P12_SPEC.md` (this), `PORTAL_P12_RUNBOOK.md`.

**Update (additive):** `src/lib/status/colors.ts` (+`subscriptionStatusToken`); `StatusBadge.tsx`
(+`'subscription'`); `src/lib/audit/display.ts` (+`subscription.*`); `src/lib/types/database.ts`
(+`SubscriptionSyncStatus` + `customer_subscriptions`); `src/components/portal/shell/Topbar.tsx`
(+nav); the **company detail** page/component (+Subscriptions section); `supabase/migrations/README.md`.
**No existing Stripe/webhook/checkout file is changed in P12A** (P12C would add the webhook registry
upsert later).

---

## 24. Tests

- **Migration / RLS** (live probe): permission-less `sub` → 0 rows on `customer_subscriptions`;
  admin/super-admin → visible.
- **Permissions:** the 4-key × 5-role matrix (sales link/sync, archive admin-only, others read; **no
  mutation permissions exist in P12A**).
- **Stripe-call mocking:** `getStripe()` mocked — `linkExistingStripeSubscription`/`sync` call
  `subscriptions.retrieve`/`.list`, map fields correctly (price→amount cents, interval, status,
  period, cancel_at_period_end), upsert by the unique sub id; on retrieve error → `sync_status='failed'`
  + `subscription.sync_failed`. **No real Stripe call.**
- **Idempotency / linking:** re-linking the same `stripe_subscription_id` is rejected (unique);
  duplicate detection works.
- **Status mapping:** `subscriptionStatusToken` for all Stripe statuses + unknown→system.
- **Relationship:** company auto-suggest from `customers`; unknown company allowed (null link).
- **Action source-checks:** every action gated; archive type-to-confirm; **subscriptions/legacy tables
  never hard-deleted**; **no `subscriptions.update`/Stripe write in P12A** (assert the module contains no
  `subscriptions.update(`/`subscriptions.cancel(`/`.cancel(`); no `STRIPE_SECRET`/`sk_` in client;
  **legacy `subscriptions`/`customers`/`orders` not mutated** (no `.from('subscriptions').update`/insert,
  etc.).
- **Audit:** events labelled; **no amounts / billing email / secrets in ordinary metadata**.
- **UI/component:** `StatusBadge` subscription mapping; no service-role / Stripe secret in client
  components.
- **Regression:** old `/api/checkout` + the webhook order/subscription path build + pass **unchanged**;
  P5–P11 + auth/profile/users/history suites green; `npx tsc --noEmit`, `npx vitest run`, `npm run build`.

---

## 25. Manual smoke checklist (Stripe **test mode**)

As **admin**: in Stripe test mode create a test customer + subscription. **Link** it (paste the
`sub_…` id) → the registry row appears with status/plan/amount/period; the company is auto-suggested
from the Stripe customer (or left blank). **Sync** → `last_synced_at` updates; change the subscription in
Stripe and re-sync → the snapshot updates. View the **list + detail**; confirm the **company detail
Subscriptions section** shows it. **Archive** (type the sub id) → hidden → restore. As **sales**: link +
sync, **no archive**, **no mutation controls** (none exist in P12A). As **read_only**: view only;
Subscriptions nav hidden without `subscriptions.read`. Confirm `/api/checkout` (webshop) + the Stripe
webhook order/subscription flow still work, the legacy `subscriptions` table is still webhook-synced, old
`/admin`, and marketing are unaffected. *(If P12B is later built: preview a quantity change, change
quantity, set/undo cancel-at-period-end, cancel immediately only in test mode.)*

---

## 26. Rollback plan

- **Code:** revert the P12A commit — the subscriptions module/routes/components, Topbar link, the company
  detail section, status/audit additions revert together. **No webhook/checkout change to revert in
  P12A.**
- **Migration (greenfield):** `drop table public.customer_subscriptions;` + delete the 4 permissions +
  grants (see the `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **No Stripe rollback** needed for P12A (no Stripe writes). *(P12B mutations are NOT auto-reversible —
  a cancel/proration cannot be undone via a code revert; this is documented as a P12B risk.)*
- **Disable without rollback:** hide the nav + the Link/Sync buttons (remove grants / a flag).
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

---

## 27. Risks and open questions (defaults in **bold**)

1. **Legacy `subscriptions` shape** — minimal, customer-linked, webhook-written → **new
   `customer_subscriptions` registry** (don't extend it). *Confirm.*
2. **Source-of-truth conflict** — **Stripe is authoritative**; the registry is a synced snapshot; the
   legacy mirror stays webhook-owned. *Confirm.*
3. **Mutation risk** — **defer to P12B** (admin-only, preview, explicit proration, irreversible). *Decision.*
4. **Proration / coupons / trials / billing-cycle** — surfaced read-only in P12A; edited only in P12B with
   a Stripe preview. *Decision.*
5. **Webhook staleness** — P12A relies on **manual sync** (shows `last_synced_at`); auto-sync is **P12C**.
   *Decision.*
6. **Duplicate customer/subscription links** — unique `stripe_subscription_id` + duplicate detection. ✓
7. **Authorization of destructive changes** — admin-only + type-to-confirm (P12B). ✓
8. **`company_id` required vs optional** — **optional** (unknown Stripe subs allowed). *Decision.*
9. **Status CHECK** — **no hard CHECK** (forward-compatible). *Decision.*
10. **`organization_id`** — **defer.**
11. **Future customer portal / accounting reconciliation** — deferred, separate phases.

---

## 28. Final readiness checklist

- **P12 spec ready:** **Yes** (for **P12A**). Greenfield confirmed, `0029` numbering confirmed,
  reuse-vs-new grounded in the live `subscriptions`/`customers`/webhook, registry data model + Stripe
  read/link/sync + status mapping + permissions + RLS + audit + UI + CRM integration + tests + rollback
  specified against the live schema and the P10/P11 precedent. **P12B mutations + P12C webhook are
  specified but not built.** No live calls made; no migration created.
- **Blockers:** none for P12A.
- **Decisions needed before build:** the 11 in §27 (all have safe recommended defaults).
- **Recommendation:** **Approve P12A only** (read / link / sync). **Block mutations (P12B) and webhook
  reconciliation (P12C) until separately approved** — mutating live Stripe subscriptions is irreversible
  and must follow a proven read path.

**Exact approval question:** *"Approve **P12A** Stripe Subscription Registry / Read & Link as specified —
a new greenfield `customer_subscriptions` registry (migration `0029`; legacy `subscriptions`/checkout/
webhook untouched), server-side **read-only** link + sync from Stripe, statuses snapshotted from Stripe,
permissions `subscriptions.read/link/sync/archive` (sales link/sync; archive admin-only), CRM
company/contact linkage, **no mutations and no webhook changes** — with the §27 defaults (items 1-11) —
and build P12A only? P12B (mutations) and P12C (webhook reconciliation) remain deferred until separately
approved. Or change any of the §27 decisions first?"*

**Do not build yet. Awaiting P12A approval + the §27 decisions.**
