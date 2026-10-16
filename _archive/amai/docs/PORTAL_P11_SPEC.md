# PORTAL P11 — STRIPE PAYMENT LINKS (FROM INVOICES) — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI §VI.8/§VI.9 + the live Supabase schema + current repo state. Builds on P9 Invoices +
P10 Payments. This is the **first phase that actually calls Stripe** — kept conservative: generate a
hosted payment URL for an invoice, store the references, show it on the invoice, and (recommended)
**defer active webhook processing**, while adding one **defensive guard** so paid invoice links cannot
misfire the legacy checkout email.

---

## 1. P11 objective

P11 lets an internal user **generate a Stripe payment URL for an invoice** (a Checkout Session for the
invoice's `balance_due`), **store the reference** (`invoice_payment_links` row + provider ids + URL) in
the portal, **show/copy it on the invoice detail**, and **cancel/regenerate/mark-inactive** it. It
**prepares** later webhook/reconciliation handling by storing the Stripe session/payment-intent ids,
**without rewriting** the existing `/api/checkout` or the Stripe webhook subscription flow. Payment
**confirmation stays manual** in P11 (an admin records the succeeded P10 `invoice_payments` once the
money lands) unless the optional additive webhook branch (§16) is approved. No Stripe subscription
changes, no product/price sync, no public app payment page beyond the Stripe-hosted link.

---

## 2. Current-state dependency check (inspected live + repo)

- **No new table exists.** `to_regclass('public.invoice_payment_links')` and `public.payment_requests`
  are null → P11 is **greenfield**.
- **Migration numbering.** Latest applied is `0027_invoice_payments` (`20260611090109`). **Next
  additive number is `0028`.**
- **Legacy `payment_links` (13 cols) — webshop/subscription link table, NOT to be touched:** `id`,
  `created_at`, `customer_id`(→customers SET NULL), `company_id`(→companies SET NULL), `type` (CHECK
  `custom/starter/business/premium/one_time/subscription`), **`amount_chf` integer**, `currency`,
  `description`, `stripe_payment_link_id`, `url`, `status` (CHECK `created/sent/paid/cancelled`, default
  `created`), `created_by`, `sent_at`. RLS on with a `payment_links_select` policy. **No `invoice_id`,
  no `updated_at`, no archive, no `provider_checkout_session_id`/`payment_intent`.** Customer-linked,
  integer money, plan-typed — the **legacy webshop** link table.
- **`stripe_events` (3 cols):** `id text` (the Stripe event id), `type`, `created_at` — an idempotency
  log, **currently NOT written by the live webhook** (available for P11 idempotency if wired).
- **P10 `invoice_payments` (24 cols):** already carries a **`payment_link_id uuid` (soft, no-FK)**
  column — explicitly anticipating this P11 table. Invoice paid figures are owned by
  `recalculateInvoicePaymentState` (only `succeeded` non-archived payments count).
- **P9 `invoices` (26):** `total_amount`/`amount_paid`/`balance_due`/`paid_at`, status
  draft/issued/paid/overdue/void/archived.
- **Existing Stripe code (read):**
  - `src/lib/stripe/server.ts` → `getStripe()` (server-side Stripe client, secret key from `env`).
  - `src/lib/stripe/plans.ts` → plan→Price mapping (`planPriceId`, `PLAN_AMOUNT_CHF`, `stripeLocale`).
  - `src/lib/env.ts` → `stripeWebhookSecret`, `stripePriceLogo`, `orderFlowMode`, `siteUrl`,
    `notificationTo`.
  - **`/api/checkout`** → two modes (`request` default / `stripe`); in `stripe` mode it records a
    `pending` **order** and creates a **Checkout Session in `mode:'subscription'`** using plan Price
    ids, then returns the URL. The **webshop subscription** flow.
  - **`/api/stripe/webhook`** → verifies the signature, handles `checkout.session.completed` →
    marks the **order** paid (via `client_reference_id`/`metadata.order_id`), upserts the **customer**,
    and **sends a "subscription active" confirmation email + an admin notification**; and
    `customer.subscription.*` → mirrors **subscription** status. **No `stripe_events` idempotency
    today.** **⚠ Risk:** the handler emails on *any* `checkout.session.completed`; a paid P11 invoice
    session (no `order_id`) would currently fall through to `order = null` and **still send the wrong
    "Ihr Abo ist aktiv" email** — see §8/§16 for the required guard.
- **Permission modules in use:** audit, catalog, companies, contacts, invoices, **payments**, org,
  projects, quotes, users. `payment_links` will be a **new module**.
- **No conflict with old `/[locale]/admin`** (untouched). **No business-table rewrite needed** —
  greenfield table + FKs into existing tables; the legacy `payment_links`/checkout/webhook stay intact
  (one defensive guard aside).

---

## 3. Scope boundaries

**In scope (P11):**

- A new greenfield **`invoice_payment_links`** table (additive `0028`).
- **`createStripeCheckoutForInvoice`** — a new **internal server action** (NOT `/api/checkout`) that
  calls Stripe **server-side** to create a Checkout Session for the invoice's `balance_due`, stores the
  row + provider refs + URL, status `active`.
- Relationship to invoice (required), company (denormalized), optional P10 `invoice_payment`.
- A **status model** for generated links; copy/open-link UI; **cancel** (+ Stripe deactivate where
  supported) / **regenerate** / **mark inactive**; soft-archive/restore.
- A **required defensive guard** in the existing webhook so paid invoice sessions don't fire the legacy
  email (§8/§16). **Active invoice-payment webhook processing is DEFERRED** (recommended) — manual
  confirm via P10, with an opt-in additive branch fully specified.
- Routes `/app/payment-links` (+ `/[id]`), invoice-detail Payment-links section + "Generate payment
  link", audit/history, permissions, permission-gated read RLS, tests, docs + runbook.

**Out of scope (explicit, per the prompt):** checkout rewrite; replacing `/api/checkout`; Stripe
**subscription** management / changes / product-price sync; automatic recurring billing; customer
account portal; any public app payment page beyond the Stripe-hosted link; bank reconciliation;
accounting export; ledger; revenue recognition; automatic refunds; invoice PDF; **automated email**
(beyond copy-link); tax/VAT engine; order/subscription/customer migration; finance dashboard beyond
invoice/payment views; NDA/documents; notifications; impersonation; MFA; role editor; org settings;
`/admin` removal; business-table rewrite; **hard deletes** of invoices/payments/links.

**Deferred to later phases:** full invoice-payment **webhook processing** + auto invoice-payment
creation + `stripe_events` idempotency wiring (the §16 opt-in, or a "P11.5"/reconciliation phase);
Stripe **Payment Link** (durable URL) as an alternative provider path; partial-amount links;
auto-expiry cron; P12 Stripe Subscription Management; multi-currency; `organization_id`.

---

## 4. Naming decision

- **Feature name:** **Payment links** (UI label "Payment links"; an individual one is an "invoice
  payment link"). (Not "Payment Requests" — too close to P10's payment records; not bare "Stripe
  Payment Links" because the provider is an implementation detail and a Checkout Session is used.)
- **Database table:** **`public.invoice_payment_links`** (NOT `payment_links` — that is the live legacy
  webshop table). Single table.
- **Routes:** `/app/payment-links`, `/app/payment-links/[id]` (no standalone `/new` — links are
  generated **from the invoice detail**, which has the invoice context; a `?invoiceId=` create is
  unnecessary).
- **Audit entity name:** `payment_link` (`entity_type = 'payment_link'`).
- **Permission module:** `payment_links` (keys `payment_links.*`).

---

## 5. Reuse vs new table decision (grounded in the live schema)

**Decision: create a NEW greenfield `invoice_payment_links` table. Do NOT reuse or extend the legacy
`payment_links` table.**

| Option | Verdict | Why |
|---|---|---|
| **Reuse `payment_links`** | ✗ | It is the **legacy webshop/subscription** link table (plan-typed, **integer `amount_chf`**, customer-linked, status `created/sent/paid/cancelled`), RLS-policied and tied to the legacy checkout. It has no `invoice_id`/archive/`provider_checkout_session_id`. Reusing entangles invoice links with webshop plan links and mixes money conventions. |
| **Extend `payment_links`** | ✗ | Adding `invoice_id`/archive/provider columns + widening its `type`/`status` CHECKs is a **business-table modification** — out of scope, and risks the legacy flow. |
| **New `invoice_payment_links`** | ✓ **Chosen** | Additive, non-destructive, `numeric(12,2)` consistent with invoices/payments, own permission-gated RLS + audit + status machine, references `invoices`/`companies`/`invoice_payments`. The P10 `invoice_payments.payment_link_id` soft-ref already anticipates it. Legacy `payment_links`/checkout/webhook stay untouched. |
| New `payment_requests` | ✗ (naming) | Collides conceptually with P10 payment records; `invoice_payment_links` is clearer. |

---

## 6. Data model proposal — `public.invoice_payment_links`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` / `updated_at` | timestamptz NOT NULL | touch trigger |
| `invoice_id` | uuid NOT NULL | → `invoices(id)` **ON DELETE RESTRICT** (required) |
| `company_id` | uuid NOT NULL | → `companies(id)` **RESTRICT**; **denormalized from the invoice** (not editable) |
| `invoice_payment_id` | uuid NULL | → `invoice_payments(id)` **SET NULL** (the P10 payment created when paid; null until then) |
| `amount` | numeric(12,2) NOT NULL | CHECK `> 0`; **snapshot of `balance_due` at generation** |
| `currency` | text NOT NULL | default `'CHF'`; CHECK `= 'CHF'` |
| `status` | text NOT NULL | default `'draft'`; CHECK (see §8) |
| `provider` | text NOT NULL | default `'stripe'`; CHECK `= 'stripe'` |
| `provider_payment_link_id` | text NULL | if a Stripe Payment Link is used (alt path) |
| `provider_checkout_session_id` | text NULL | the Checkout Session id (default path) |
| `provider_payment_intent_id` | text NULL | filled on payment (webhook/reconciliation) |
| `url` | text NULL | the Stripe-hosted URL (**treated as sensitive** — §11) |
| `expires_at` | timestamptz NULL | session expiry |
| `paid_at` / `cancelled_at` / `failed_at` | timestamptz NULL | lifecycle stamps |
| `notes` / `internal_notes` | text NULL | |
| `archived_at` / `archived_by` | timestamptz / uuid NULL | soft-archive (archived_by → profiles SET NULL) |
| `created_by` / `updated_by` | uuid NULL | → profiles SET NULL |

### Decisions & justifications

- **Requires `invoice_id`** (RESTRICT) — a payment link is always for an invoice.
- **`company_id` denormalized** from the invoice (RESTRICT, not editable) — list/filter without a join.
- **`amount` = the invoice `balance_due` at generation time, snapshotted.** If the invoice changes
  afterward the link is **stale** → regenerate (the UI flags a mismatch). *(Decision: full balance_due;
  **partial-amount links deferred** — §26.)*
- **One active link per invoice (recommended).** Generating a new link **cancels/supersedes** the prior
  `active` link (cleaner; avoids two live links). *(Decision; alt = allow multiple — §26.)*
- **URL is stored** (`url`) so it can be copied/opened; treated as sensitive (§11).
- **Provider = Stripe Checkout Session** (default; ad-hoc amount via `price_data`); the `*_payment_link_id`
  column supports the durable **Payment Link** alternative (§7/§26).
- **An `invoice_payment` is created only when payment succeeds** (webhook or manual) — **not** at link
  generation. Generating a link **does not** change the invoice's paid figures (§9).
- **`organization_id` deferred**; **link rows never hard-deleted** (archive).

---

## 7. Stripe integration model

- **API:** the existing **`getStripe()`** server client (`src/lib/stripe/server.ts`). **All Stripe
  calls server-side only**, inside the new `createStripeCheckoutForInvoice` server action — **never**
  in a client component; **secret key never client-side**.
- **Surface (recommended): a Stripe Checkout Session in `mode:'payment'`** with an **ad-hoc
  `price_data`** line item for the invoice balance — one API call, arbitrary CHF amount, controllable
  expiry, metadata. *(Alternative: a durable **Payment Link** = create an inline `Price` then
  `paymentLinks.create`; flagged §26. Both store into the same row — `provider_checkout_session_id` vs
  `provider_payment_link_id`.)*
- **Amount mapping:** **one line item for the total `balance_due`** (not per invoice line) — robust,
  matches "pay the outstanding balance". `unit_amount = round(balance_due * 100)` (CHF cents),
  `currency: 'chf'`, `product_data: { name: 'Invoice ' + invoice_number }`, `quantity: 1`.
- **Metadata** on the session (so a future webhook can route safely): `{ kind: 'invoice_payment',
  invoice_id, invoice_payment_link_id, invoice_number, company_id, env: <test|live> }`. The
  **`kind:'invoice_payment'` marker is essential** for the webhook guard (§8).
- **Idempotency:** pass a Stripe **idempotency key** = the `invoice_payment_links.id` (the row is
  created first, then the Stripe call uses its uuid) so a retried action never creates two sessions.
- **success_url / cancel_url:** a minimal **public** thank-you/cancel page (reuse the existing
  `/{locale}/checkout/success` or a new lightweight `/{locale}/payment/success` — *decision §26*);
  `success_url` includes `?session_id={CHECKOUT_SESSION_ID}`. The invoice detail itself is staff-only,
  so it is **not** used as success_url.
- **Route choice:** a **new internal server action** (`'use server'`, permission-gated) — **do NOT
  reuse or modify `/api/checkout`** (that is the webshop subscription flow with its own validation +
  order recording).
- **Eventual confirmation events:** `checkout.session.completed` (primary) and optionally
  `checkout.session.expired` / `payment_intent.payment_failed`. **Processing is deferred (§16)**; a
  required **guard** (§8) keeps the legacy handler from misfiring on these.
- **Not breaking existing flows:** the legacy `/api/checkout` subscription path + the webhook's
  order/subscription handlers are untouched except for the additive guard. The new action records its
  own row and never writes `orders`/`subscriptions`/`customers`/legacy `payment_links`.

---

## 8. Payment-link status model

**Statuses (7):** `draft`, `active`, `paid`, `expired`, `cancelled`, `failed`, `archived`.

**StatusBadge token mapping:** draft→`draft`, active→`sent`, paid→`done`, expired→`warning`,
cancelled→`cancelled`, failed→`failed`, archived→`cancelled`.

**Transitions** (`paymentLinkStatusMachine`):

- `draft → active` — the Stripe session was created (URL stored). Internal, no confirm.
- `draft → failed` — the Stripe call failed (`failed_at` set). Internal.
- `active → cancelled` — **`payment_links.cancel`** + confirm; deactivate the Stripe object where
  supported (Payment Links can be deactivated; a Checkout Session is left to expire — see note).
- `active → expired` — **manual** in P11 (no cron), or derived from `expires_at`. `payment_links.update`.
- `active → paid` — set by the **manual** flow (admin marks the P10 payment succeeded and links it) or
  the opt-in webhook (§16). `paid_at` set.

**Terminal:** `paid`, `cancelled`, `expired`, `failed`. **Archive/restore** are dedicated actions:
archive allowed only from **terminal/inert** states (`paid`/`expired`/`cancelled`/`failed`/`draft`) —
**not from `active`** (cancel it first); type-to-confirm the **invoice number**; restore → `cancelled`
(a restored link is not re-activated — the Stripe object may be gone). *(Edge flagged §26.)*

> **REQUIRED webhook guard (the one existing-file change).** Because the live
> `handleCheckoutCompleted` emails on every `checkout.session.completed`, P11 must add a minimal
> defensive early-return so **non-order sessions are ignored**: at the top of `handleCheckoutCompleted`,
> if `!orderId` (no `client_reference_id`/`metadata.order_id`) **or** `metadata.kind ===
> 'invoice_payment'`, **return without updating orders or sending emails**. This is purely defensive
> (it narrows the handler to actual orders, which is its intent) and prevents a paid invoice link from
> sending the wrong "Abo ist aktiv" email. It does **not** add invoice processing (that is §16).

`expired` is manual in P11. No email/order/subscription side effects from any P11 transition.

---

## 9. Invoice and payment interaction

- **Generating a link does NOT change** the invoice's `amount_paid`/`balance_due`/`paid_at`. (Prefer
  no — confirmed.) Only a **succeeded P10 `invoice_payment`** moves those figures (P10 authority).
- **Paying the link:**
  - **Recommended P11 (manual):** the admin sees the Stripe payment, **records a P10 `invoice_payment`
    succeeded** (provider `stripe`, with the session/payment-intent ids), **sets `invoice_payment_id`
    on the link + status `paid`**, and the P10 recalc updates the invoice. *(A small convenience action
    `markPaymentLinkPaid` can create the P10 payment + link + recalc in one gated step — §14.)*
  - **Opt-in webhook (§16):** `checkout.session.completed` for a `kind:'invoice_payment'` session →
    idempotently (via `stripe_events`) create/flip an `invoice_payments` row → P10 recalc → set the
    link `paid`.
- **Avoid duplicate `invoice_payments`:** match on `provider_checkout_session_id` /
  `provider_payment_intent_id` (a **unique partial index** on the link's session id) before creating;
  the webhook path also dedupes on `stripe_events.id`.
- **No conflict with P10 manual records:** payments remain the single authority for paid figures;
  a link's `paid` status mirrors its linked `invoice_payment`. The P9 manual-mark-paid guard (P10)
  still blocks manual invoice mark-paid when payment records exist.
- **Void/archived invoice:** **cannot** generate a link. **Already-paid / zero-balance invoice:**
  cannot generate (balance_due must be > 0). **Draft invoice:** cannot generate — **the invoice must be
  `issued` (or `overdue`)** with `balance_due > 0`.
- **Overpayment / invoice changed after generation:** the link amount is the snapshot; the recorded
  payment reflects the actual Stripe amount; P10 recalc clamps `balance_due` at 0 and flags overpaid.
  The UI shows "amount snapshotted at generation — regenerate if the invoice changed."
- **Regenerate:** **cancel/supersede the current active link**, then create a new one.

---

## 10. Permissions model

**New permissions (4):** `payment_links.read`, `payment_links.create`, `payment_links.cancel`,
`payment_links.archive`. *(Notes editing folds under `payment_links.create` holders via a small
`update`; or add `payment_links.update` — §26. `mark paid` is the P10 `payments.mark_succeeded`
capability, not a new link permission.)*

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `payment_links.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payment_links.create` | ✓ | ✓ | — | — | — |
| `payment_links.cancel` | ✓ | ✓ | — | — | — |
| `payment_links.archive` | ✓ | — | — | — | — |

Rationale: **sales generate + cancel** invoice payment links (a collection request, like recording a
P10 pending payment), but **archive is admin-only**; analyst/reviewer/read_only read-only. **Confirming
money** (marking the invoice paid) remains the admin-only P10 `payments.mark_succeeded`. No role editor
UI. `changePaymentLinkStatus`/cancel enforce the specific permission.

*(Reuse `payments.*` instead? Rejected: link generation is a distinct capability (it calls Stripe and
exposes a URL) worth gating separately from recording payment facts; a clean `payment_links` module
matches the per-module pattern.)*

---

## 11. RLS / security model

- **Reads: permission-gated RLS** — `create policy invoice_payment_links_select on
  public.invoice_payment_links for select to authenticated using (has_permission('payment_links.read')
  or is_platform_super_admin());`. **No INSERT/UPDATE/DELETE policies.**
- **All writes** via **service-role** `'use server'` actions, gated by `requireAuth()` +
  `hasPermission()`. **No client writes; no service-role import in client components.**
- **No Stripe secrets client-side** — the Stripe call lives in a server action using `getStripe()`; the
  publishable key is not needed (the user is redirected to the Stripe-hosted URL).
- **The hosted `url` is sensitive** (it lets anyone pay the invoice): it is visible **only to
  `payment_links.read` holders** in the portal, **never placed in audit metadata** (technical fields at
  most), and not exposed publicly by the app. Copy-to-clipboard is a client convenience over the
  server-fetched value.
- **Archived rows hidden by default**; platform-super-admin via `is_platform_super_admin()`; audit
  technical fields gated by `audit.read_technical`. **No public app payment surface** beyond the
  Stripe-hosted link.

---

## 12. Migration plan — `0028_invoice_payment_links`

Additive, greenfield; mirrors `0027`. Apply live (`apply_migration` name `0028_invoice_payment_links`),
mirror to `supabase/migrations/`, regenerate `database.ts`, README entry. **No changes to
`payment_links`/`payments`/`stripe_events`/`orders`/`subscriptions`/`customers`/`invoices`/checkout/
Stripe.**

1. `create table public.invoice_payment_links (...)` per §6 with CHECKs: `amount > 0`; `currency='CHF'`;
   `status in ('draft','active','paid','expired','cancelled','failed','archived')`; `provider='stripe'`.
2. FKs: `invoice_id → invoices RESTRICT`; `company_id → companies RESTRICT`; `invoice_payment_id →
   invoice_payments SET NULL`; `archived_by/created_by/updated_by → profiles SET NULL`.
3. `touch_updated_at` trigger.
4. Indexes: `invoice_id`; `company_id`; partial `status` (`where archived_at is null`); `created_at
   desc`; **unique partial** `provider_checkout_session_id` (`where … is not null`) + partial
   `provider_payment_intent_id` (idempotency / reconciliation lookups).
5. `enable row level security` + the permission-gated `invoice_payment_links_select` policy
   (idempotent). **No write policies.**
6. Seed the 4 `payment_links.*` permissions (`on conflict (key) do nothing`).
7. Seed role grants (idempotent) per §10.
8. `-- ROLLBACK:` comments on every block (drop table, delete permissions/grants).

Next migration after this is `0029`.

---

## 13. Server actions and queries

Module `src/modules/payment-links/`. Actions: `'use server'` → zod → `requireAuth()` +
`hasPermission()` → relationship/status checks → service-role write (and Stripe call where stated) →
`logEvent` → `revalidatePath` → typed `{ ok } | { error }`.

**Queries (`queries.ts`, `import 'server-only'`, service-role, gated `payment_links.read`):**

- `listPaymentLinks(filters)` — search (invoice number / notes), filters status/company/invoice,
  archived-hidden-by-default, 25/page, `order created_at desc`; resolves invoice number + company name;
  returns amount/status/provider/url-present/created.
- `getPaymentLink(id)` — link + invoice (number, status, archived hint) + company + linked
  `invoice_payment` (if any).
- `listPaymentLinksForInvoice(invoiceId)` — for the invoice-detail section.
- `getInvoiceForLink(invoiceId)` — invoice number/status/archived/`balance_due`/currency for the
  generate gate.

**Actions (`actions.ts`):**

- `createStripePaymentLinkForInvoice` — `payment_links.create`; require invoice **issued/overdue +
  non-archived + `balance_due > 0`**; denormalize company; **supersede any current `active` link**
  (cancel it); **insert the row first** (status `draft`, `amount = balance_due` snapshot); **call
  Stripe** (`getStripe().checkout.sessions.create`, `mode:'payment'`, ad-hoc `price_data`, metadata
  `kind:'invoice_payment'` + ids, idempotency key = the row id); on success store
  `provider_checkout_session_id` + `url` + `expires_at`, status `active`, audit
  `payment_link.created`; on Stripe error set status `failed` + `failed_at`, audit failure, return a
  safe error. **No invoice recalc.**
- `cancelPaymentLink` — `payment_links.cancel`; only when `active`; confirm; **deactivate the Stripe
  object where supported** (Payment Link → `paymentLinks.update active:false`; Checkout Session → mark
  internal `cancelled` + let it expire — Sessions can't be force-cancelled via API, documented); set
  `cancelled` + `cancelled_at`; audit `payment_link.cancelled`.
- `expirePaymentLink` *(or fold into update)* — `payment_links.update`/create; manual `active →
  expired`; audit `payment_link.expired`.
- `markPaymentLinkPaid` *(convenience; admin)* — gated by **`payments.mark_succeeded`** (reuses P10
  authority): create/flip a P10 `invoice_payment` `succeeded` (provider stripe, session/intent ids),
  set the link `invoice_payment_id` + `paid` + `paid_at`, **call P10 `recalculateInvoicePaymentState`**,
  audit `payment_link.paid` + the P10 events. *(This is the manual confirmation path while webhook
  processing is deferred.)*
- `updatePaymentLinkNotes` — `payment_links.create` (or `.update`); edit `notes`/`internal_notes` only;
  audit `payment_link.updated` (field names only).
- `archivePaymentLink` / `restorePaymentLink` — `payment_links.archive`; archive only from
  terminal/inert states, type-to-confirm the invoice number; restore → `cancelled`; audit.
- *(Opt-in §16)* a webhook handler addition — see §16.

Error handling: safe messages; **no Stripe error bodies or secrets logged**; revalidate
`/app/payment-links`, `/app/payment-links/[id]`, and the linked `/app/invoices/[id]`.

---

## 14. UI / routes

Routes under `src/app/(portal)/app/(protected)/payment-links/`: `page.tsx` (list), `[id]/page.tsx`
(detail). **No `/new`** — links are generated from the invoice detail. Topbar gains **"Payment links"**
gated on `payment_links.read`.

- **List** (`PaymentLinkTable`): clickable rows; columns ref (short id) / invoice / company / amount /
  **StatusBadge** / provider / created; search; status/company filters; archived toggle; pagination;
  empty states.
- **Detail** (`PaymentLinkDetailActions`): header (amount + StatusBadge) + HistoryButton; invoice +
  company links; **Copy URL** + **Open payment page** buttons (when `url` present and status `active`);
  provider references (read-only); notes EditableBlocks; status control (Cancel / Mark expired /
  Mark paid per permission, each with ConfirmDialog); archive (type invoice number) / restore. Archived
  = read-only except Restore; non-active = read-only except permitted actions.

---

## 15. Invoice detail integration (`/app/invoices/[id]`) — additive

P11 **additively** adds to the P9 invoice detail (touching `InvoiceDetailActions` + the `[id]` page):

- A **Payment links** sub-section (or inside the P10 Payments section): the invoice's links (ref,
  amount, status, **Copy link**, Open) + a **"Generate payment link"** button (gated
  `payment_links.create`) shown only when the invoice is **issued/overdue, non-archived,
  `balance_due > 0`**, and **no active link already exists** (else show "Active link" + Copy/Cancel/
  Regenerate). When fully paid / void / archived / draft → no Generate button (with a short reason).
- Generating posts to `createStripePaymentLinkForInvoice` (server action) and reveals the URL +
  Copy/Open. The **P10 payment summary is unchanged** (a link does not move paid figures).
- No company/project/quote-detail payment-link sections (out of scope).

---

## 16. Webhook / reconciliation strategy

**P11 recommendation: add the required defensive guard (§8) + DEFER active invoice-payment webhook
processing.** Rationale: the live webhook is the production subscription/order sink; the safest first
step is to ensure paid invoice links **do not misfire** it, and to keep payment **confirmation manual**
(via `markPaymentLinkPaid` / P10 `mark_succeeded`). The stored `provider_checkout_session_id` /
`provider_payment_intent_id` **prepare** the future processing.

- **Required now (defensive, additive):** in `/api/stripe/webhook` `handleCheckoutCompleted`, **return
  early** when `!orderId` or `metadata.kind === 'invoice_payment'` — before the order update + emails.
  One guard; no behaviour change for real orders.
- **Until processing is wired, manual marking is necessary:** the admin records the succeeded P10
  payment + sets the link `paid` (`markPaymentLinkPaid`).

**Opt-in (flagged §26) — minimal additive invoice-payment processing branch** (if approved):

- Handle `checkout.session.completed` (+ optionally `checkout.session.expired`,
  `payment_intent.payment_failed`) **only when `metadata.kind === 'invoice_payment'`**, in a **new
  branch that returns before the legacy order logic**.
- **Idempotency via `stripe_events`:** `insert (id, type) … on conflict do nothing`; if the event id was
  already seen, no-op.
- Look up the `invoice_payment_links` row by `provider_checkout_session_id` (unique); **dedupe** the
  `invoice_payments` insert on the session/payment-intent id; on first delivery create an
  `invoice_payments` `succeeded` (provider stripe), set the link `invoice_payment_id` + `paid`, **call
  `recalculateInvoicePaymentState`**, audit safely (no secrets).
- **Never touch** the legacy order/subscription/customer/email logic; the legacy branches stay byte-for
  -byte intact.

---

## 17. Audit / history

**Events:** `payment_link.created`, `payment_link.cancelled`, `payment_link.expired`,
`payment_link.paid`, `payment_link.archived`, `payment_link.restored`, `payment_link.updated`. *(Fold
`stripe_created` into `created` since the row reaches `active` only after the Stripe call. Optional
invoice-side `invoice.payment_link_created` / `invoice.payment_link_cancelled` if a thread on the
invoice timeline is wanted — recommend keeping link events on the `payment_link` entity to mirror P10.)*

- `entity_type = 'payment_link'`; `entity_id` = link id.
- **Safe (ordinary) metadata:** `payment_link.created` `{ invoice_id, company_id, invoice_number,
  provider }`; `payment_link.updated` `{ fields }`; status events carry `old_status`/`new_status`.
- **Forbidden in ordinary metadata:** the **`url`** (sensitive), any **amount**, and any **Stripe
  secret**. Provider **reference ids** (session/payment-intent) are non-secret and may appear in
  **technical** `old_values`/`new_values` only (gated by `audit.read_technical`); never the URL.
- **Display:** add 7 `payment_link.*` labels/colours in `src/lib/audit/display.ts`
  (created→`done`, cancelled→`warning`, expired→`warning`, paid→`done`, archived→`revoked`,
  restored→`done`, updated→`system`). The History timeline renders them.

---

## 18. Relationship with legacy checkout and Stripe

- **Old `/api/checkout` untouched** (the webshop subscription flow). P11 uses a separate server action.
- **Legacy `payments`** remains the webhook target for the order/subscription flow; P11 records into
  **P10 `invoice_payments`**, never legacy `payments`.
- **Legacy `payment_links` untouched** (a different table; P11's is `invoice_payment_links`).
- **`stripe_events`** is reused **only if** the opt-in processing branch (§16) is approved — for
  idempotency; otherwise untouched.
- **No subscription changes, no product/price sync, no customer migration.** The webhook subscription
  handler is unchanged.
- **Future path:** P11's `provider_payment_intent_id` + the §16 branch feed reconciliation; **P12**
  (Stripe Subscription Management) remains the separate, higher-risk phase.

---

## 19. Money handling

- **CHF only** (CHECK). `amount numeric(12,2) > 0`.
- **`amount` defaults to and snapshots the invoice `balance_due`** at generation. **Partial-amount
  links deferred** (full balance only in P11 — §26).
- **Stripe conversion:** `unit_amount = Math.round(amount * 100)` (CHF cents), `currency: 'chf'`.
- **If the invoice total changes after creation:** the link is stale; the UI flags it; regenerate
  (supersede). The recorded payment reflects the actual Stripe-collected amount, not the snapshot.
- **Overpayment:** handled by P10 (recalc clamps `balance_due` at 0, "overpaid" hint).
- **Rounding:** 2-dp (`round2`); cents are integer. No fees, no ledger.

---

## 20. Rate limiting / abuse

- **No new public app endpoint** — the only public surface is the **Stripe-hosted** payment page.
- All P11 actions are authenticated, permission-gated server actions.
- **Stripe link creation is confirm-gated + supersede-guarded** (generating supersedes the prior active
  link), preventing accidental duplicate links. A light per-user/per-invoice rate limit on
  `createStripePaymentLinkForInvoice` (reuse `checkRateLimit`) is recommended to avoid Stripe-object
  spam. No Turnstile needed (staff-only).

---

## 21. Legacy data / old admin (planning only)

- **Do not migrate** orders/subscriptions/customers; **do not rewrite checkout**; **do not change** old
  `/[locale]/admin`; **do not mutate** legacy `payments`/`payment_links`/`stripe_events` (except the
  additive `stripe_events` idempotency insert **only if** §16 is approved).
- **Future reconciliation path** recorded: match `invoice_payment_links.provider_payment_intent_id` ↔
  legacy `payments.stripe_payment_intent`; the §16 branch is the wiring.
- **No business-table rewrite.**

---

## 22. Files likely to create / update

**Create:** `supabase/migrations/0028_invoice_payment_links.sql`;
`src/modules/payment-links/{schema,types,status,guards,queries,actions}.ts`;
`src/app/(portal)/app/(protected)/payment-links/{page.tsx,[id]/page.tsx}`;
`src/components/portal/payment-links/{PaymentLinkTable,PaymentLinkDetailActions,InvoicePaymentLinksSection}.tsx`;
tests `src/modules/payment-links/payment-links.test.ts` + `src/components/portal/ui/p11_payment_links.test.tsx`;
`PORTAL_P11_SPEC.md` (this), `PORTAL_P11_RUNBOOK.md`.

**Update (additive):** `src/lib/status/colors.ts` (+`paymentLinkStatusToken`); `StatusBadge.tsx`
(+`'payment_link'`); `src/lib/audit/display.ts` (+7 events); `src/lib/types/database.ts`
(+`PaymentLinkStatus`, `invoice_payment_links`); `src/components/portal/shell/Topbar.tsx` (+nav);
`src/components/portal/invoices/InvoiceDetailActions.tsx` + `…/invoices/[id]/page.tsx` (Payment-links
section + Generate); `supabase/migrations/README.md`. **One existing-file change:**
`src/app/api/stripe/webhook/route.ts` — the **defensive guard** (§8) [+ the opt-in §16 branch if
approved]. Possibly a tiny `src/lib/stripe/server.ts` helper reuse (no change).

---

## 23. Tests

- **Migration / RLS** (live probe): permission-less `sub` → 0 rows; admin/super-admin → visible.
- **Permissions:** the 4-key × 5-role matrix (sales create/cancel, archive admin-only, others read).
- **Stripe-call mocking:** `getStripe()` mocked — `createStripePaymentLinkForInvoice` calls
  `checkout.sessions.create` once with `mode:'payment'`, ad-hoc `price_data`, `unit_amount = cents`,
  metadata `kind:'invoice_payment'` + ids, and the idempotency key; stores session id + url + `active`;
  on throw → `failed`. **No real Stripe call in tests.**
- **Idempotency:** repeated create supersedes the prior active link (one active at a time); the §16
  branch (if built) dedupes on `stripe_events.id` + session id.
- **Relationship/invoice-state:** generate requires issued/overdue + balance_due>0 + non-archived;
  generating does **not** change `amount_paid`/`balance_due`; `markPaymentLinkPaid` creates a P10
  payment + recalc.
- **Status transitions:** legal/illegal; cancel/expire/paid; archive-only-from-terminal; restore→cancelled.
- **Webhook guard test:** `handleCheckoutCompleted` with no `orderId` / `kind:'invoice_payment'`
  **does not** call the order update or `sendEmail` (assert the legacy email path is skipped); a real
  order session still works unchanged.
- **Audit:** events labelled; **no `url`, no amount, no Stripe secret** in ordinary metadata.
- **Security source-checks:** no service-role import in client components; **no `STRIPE_SECRET`/`sk_`
  in any client component**; Stripe calls only in the server action/webhook; payments/legacy tables not
  mutated by the module.
- **Regression:** old `/api/checkout` + the webhook order/subscription path build + pass; P5–P10 +
  auth/profile/users/history suites green; `npx tsc --noEmit`, `npx vitest run`, `npm run build` pass.

---

## 24. Manual smoke checklist

As **admin** (Stripe **test mode**): open an **issued** invoice with `balance_due > 0` → **Generate
payment link** → a row appears `Active` with a Stripe **test** URL; **Copy** + **Open** work; the
invoice `amount_paid`/`balance_due` are **unchanged**. Pay the test link in Stripe → confirm the legacy
"Abo ist aktiv" email is **NOT** sent (guard) → **Mark paid** (`markPaymentLinkPaid`) → a P10
`invoice_payment` `succeeded` appears, the invoice balance updates, the link shows `Paid`. **Regenerate**
(supersedes the active link → previous `cancelled`, new `active`). **Cancel** an active link (confirm).
**Archive** a paid/cancelled/expired/failed link (type the invoice number) → Show archived → restore
(→`cancelled`). Try to generate on a **draft/void/archived/zero-balance** invoice → blocked. Filters/
search/pagination. As **sales**: generate + cancel, **no archive**; as **read_only**: view only; nav
hidden without `payment_links.read`. Confirm `/api/checkout` (webshop) + the Stripe webhook
order/subscription flow still work, old `/admin`, and marketing are unaffected. *(If §16 is approved,
also: pay the link → the webhook idempotently creates the P10 payment + recalc, no duplicate on retry.)*

---

## 25. Rollback plan

- **Code:** revert the P11 commit — module/routes/components, Topbar link, status/audit additions, the
  invoice-detail section, and the webhook guard [+ §16 branch] revert together.
- **Migration (greenfield):** `drop table public.invoice_payment_links;` + delete the 4 permissions +
  grants (see `-- ROLLBACK:` lines). No other table touched. Never edit the applied migration.
- **Stripe-created links:** Stripe Checkout Sessions **expire on their own** (no orphan to clean); any
  durable Payment Links created can be deactivated in the Stripe dashboard. Reverting the DB rows does
  not affect already-paid invoices (the P10 `invoice_payments` remain the record of truth).
- **Disable without rollback:** hide the nav + the Generate button (gate behind a flag / remove grants);
  the webhook guard is harmless to keep.
- **Old `/admin` + `/api/checkout`** remain the untouched fallback.

---

## 26. Risks and open questions (defaults in **bold**)

1. **Stripe Checkout Session vs Payment Link** — **Checkout Session `mode:'payment'` + `price_data`**
   (ad-hoc amount, one call, controllable expiry) / durable Payment Link (reusable URL, needs an inline
   Price). *Decision.*
2. **Webhook now vs later** — **defensive guard now + DEFER invoice-payment processing** (manual
   confirm) / add the §16 additive branch now. *Decision (the guard is required either way).*
3. **Store URL** — **yes**, treated as sensitive (not in audit). *Confirm.*
4. **Multiple active links per invoice** — **one active (supersede on regenerate)** / allow multiple.
   *Decision.*
5. **Partial-amount links** — **deferred (full `balance_due` only)** / allow partial. *Decision.*
6. **Invoice changed after link creation** — snapshot + UI stale-flag + regenerate (recommended).
7. **Stripe idempotency** — idempotency key = the row id; `stripe_events` dedupe only with §16.
8. **Conflict with legacy `payment_links`** — avoided via a **new table**.
9. **Avoiding checkout rewrite** — new server action; `/api/checkout` untouched.
10. **success_url/cancel_url page** — **reuse `/{locale}/checkout/success`** / a new minimal
    `/{locale}/payment/success`. *Decision.*
11. **Permission split** — new **`payment_links.*`** (read/create/cancel/archive) / reuse `payments.*`.
    *Confirm.*
12. **Archive→restore target** — **restore → `cancelled`** (not re-activated). *Decision.*
13. **`organization_id`** — **defer.**
14. **Future subscription management** — P12, separate.

---

## 27. Final readiness checklist

- **P11 spec ready:** **Yes.** Greenfield confirmed, `0028` numbering confirmed, reuse-vs-new grounded
  in the live `payment_links`/Stripe code, data model + Stripe integration (Checkout Session, ad-hoc
  amount, metadata, idempotency, success/cancel) + status machine + invoice/payment interaction +
  the **required webhook guard** + permissions + RLS + audit + UI + tests + rollback specified against
  the live schema and the P9/P10 precedent. No live calls made; no migration created.
- **Blockers:** none.
- **Decisions needed before build:** the 14 in §26 (all have safe recommended defaults).
- **Out-of-scope confirmed:** no checkout rewrite, no `/api/checkout` change, no subscription/product/
  price work, no public payment page, no automated email, no reconciliation engine/ledger/accounting,
  no order-sub-customer migration, no `/admin` removal, no business-table rewrite, no hard deletes.

**Exact approval question:** *"Approve P11 Stripe Payment Links as specified — a new greenfield
`invoice_payment_links` table (migration `0028`; legacy `payment_links`/checkout untouched), a
server-side Stripe **Checkout Session** (`mode:'payment'`, ad-hoc `balance_due`) generated by a new
internal action, status draft/active/paid/expired/cancelled/failed/archived, permissions
`payment_links.read/create/cancel/archive` (sales generate/cancel; archive admin-only), one-active-
link-per-invoice, the **required defensive webhook guard**, and **deferred** invoice-payment webhook
processing (manual confirm via P10) — with the §26 defaults (items 1-14) — and then build P11? Or
change any of the §26 decisions (especially the §16 webhook branch) first?"*

**Do not build yet. Awaiting P11 approval + the §26 decisions.**
