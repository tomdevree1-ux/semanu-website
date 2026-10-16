# PORTAL P10 — PAYMENTS / STRIPE BRIDGE CORE — TECHNICAL SPECIFICATION

Status: **SPEC ONLY. Not built. No migration created.** Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Parts IV/V/VI + the live Supabase schema + current repo state (which override theoretical names).
Builds on P9 Invoices (the parent it links to). Pattern parent = **P9 Invoices** (greenfield table,
permission-gated read RLS, service-role audited writes, soft-archive, money in `numeric(12,2)`), with
a new wrinkle: a **child-of-invoice payment record** that feeds back into the invoice's payment state.

---

## 1. P10 objective

P10 introduces a **controlled internal Payments layer only**: an `invoice_payments` record that links
a payment (manual today, Stripe-referenced later) to a P9 invoice and drives that invoice's
`amount_paid` / `balance_due` / `paid_at`. It is the **bridge** that prepares later Stripe
reconciliation, checkout integration and accounting **without building any of them now**. P10 records
payments and their lifecycle and recomputes the linked invoice's paid state; it does **not** call
Stripe, change the checkout/webhook, move money, build a ledger, reconcile a bank, export accounting,
or render a public payment page. "Succeeded" in P10 is a **manually recorded internal fact** (or, in a
future phase, a webhook-confirmed one), not a live charge.

Parity with P5–P9: additive greenfield migration, permission-gated reads, audited service-role
writes, soft-archive (never hard-delete), the shared UI primitives, and a pure-math invoice
recomputation isolated and unit-tested.

---

## 2. Current-state dependency check (inspected live + repo)

Inspected via the live DB (`bkwwlmflsbhrsfwydbnv`), `list_migrations`, and the repo:

- **No new payment tables exist.** `to_regclass('public.invoice_payments')` and
  `public.payment_records` are both null. P10 is **greenfield**.
- **Migration numbering.** Latest applied is `0026_invoices` (`20260611072425`). **Next additive
  number is `0027`.** No applied migration renamed/edited.
- **Legacy `payments` (10 cols) — the live Stripe-webhook target, NOT to be touched:** `id`,
  `created_at`, `customer_id`(→customers SET NULL), `company_id`(→companies SET NULL), **`amount_chf`
  integer**, `currency`, `status` (CHECK `paid/failed/refunded/pending`), `stripe_checkout_session_id`,
  `stripe_payment_intent`, `stripe_payment_link_id`. **No `invoice_id`, no `updated_at`, no
  `archived_at/by`, no `created_by/updated_by`, no `paid_at`, no `method`/`notes`.** RLS on with a
  `payments_select` policy. Written by **`/api/stripe/webhook/route.ts`** (+ referenced in
  `/api/checkout/route.ts`).
- **Legacy `payment_links` (13 cols):** Stripe payment links, customer-linked, `amount_chf` integer.
  Untouched.
- **`stripe_events` (3 cols):** `id`, `type`, `created_at` — a minimal Stripe idempotency/event log.
  Untouched.
- **`orders` / `subscriptions` / `customers`:** legacy checkout/Stripe domain. Untouched.
- **P9 `invoices`** has the payment-state columns P10 drives: `total_amount`, `amount_paid`,
  `balance_due` (all `numeric(12,2)`), `paid_at` (timestamptz), `status` (text). `invoice_items`(14).
- **P5–P8 present** (quotes 21 / quote_items 13 / catalog_items 19 / projects 15 / companies 24 /
  company_contacts 14).
- **Permission modules in use:** audit, catalog, companies, contacts, invoices, org, projects, quotes,
  users. `payments` will be a **new module** (no collision; the legacy `payments` *table* is not a
  permission module).
- **Repo conventions confirmed** (reused verbatim): `src/lib/status/{types,colors}.ts`,
  `StatusBadge`/`statusTokenFor`, `src/lib/audit/{log,display,queries}.ts`, `requireAuth()` +
  `hasPermission()`, `createAdminClient()` service-role writes, `rowLink`, `EditableBlock`,
  `ConfirmDialog`, `HistoryButton`/`HistoryTimeline`, the P9 totals/recalc pattern, generated-number
  sequences (`Q-#####`, `INV-#####`).
- **No conflict with old `/[locale]/admin`** (untouched). **No business-table rewrite needed** —
  P10 is greenfield + references existing tables by FK only.

---

## 3. Scope boundaries

**In scope (P10):**

- A new `invoice_payments` table (greenfield, additive `0027`) — a payment record linked to a P9
  invoice, with **manual** recording, a **status model**, optional Stripe **reference** fields, soft-
  archive, audit, and permission-gated read RLS.
- `recalculateInvoicePaymentState(invoiceId)` — the single writer of an invoice's `amount_paid` /
  `balance_due` / `paid_at` once payment records exist; **partial payments** supported.
- list / detail / create / edit / archive / restore UI under `/app/payments`, plus a **Payments
  section + "Add payment"** on the P9 invoice detail.
- Audit/history (payment events + an invoice-side `invoice.payment_state_updated`), permissions
  (6 keys), permission-gated read RLS, tests, docs + runbook.

**Out of scope (explicit, per the P10 prompt):** checkout rewrite; new public checkout/payment page
(planning-note only — §21); customer-facing portal; Stripe subscription rewrite; Stripe product/price
sync; automatic recurring billing; bank reconciliation; accounting export; full ledger; revenue
recognition; refunds **automation** (manual refund status is in scope; a Stripe refund call is not);
invoice PDF; automated email; tax/VAT engine; order/subscription/customer migration; finance
dashboard beyond payment/invoice views; NDA/documents; notification center; impersonation; MFA; role
editor UI; org settings UI; removal of old `/[locale]/admin`; business-table rewrite; **hard deletes
of payments or invoices**; **any modification to `payments`/`payment_links`/`stripe_events`/`orders`/
`subscriptions`/`customers`/`/api/checkout`/`/api/stripe/webhook`/Stripe SDK**.

**Deferred to later phases (named):** a Stripe-reconciliation phase (webhook → create/match
`invoice_payments` by `provider_payment_intent_id` ↔ `payments.stripe_payment_intent`; live charges;
Stripe refund calls; partial refunds); public/hosted payment pages + checkout integration; accounting/
CSV export + ledger; finance dashboard; `organization_id`; standalone (non-invoice) payments; auto
invoice-status advance (if not opted in — §8/§25).

---

## 4. Naming decision

- **Feature name:** **Payments** (UI label "Payments"; singular "Payment").
- **Database table:** **`public.invoice_payments`** (NOT `payments` — that name is the live legacy
  Stripe table and must not be clobbered or reused). Single table (no child rows).
- **Sequence:** `public.payment_number_seq`; number format **`PAY-#####`** (zero-padded 5) — for
  human reference, list display, and type-to-confirm archive (mirrors `Q-`/`INV-`).
- **Routes:** `/app/payments`, `/app/payments/new`, `/app/payments/[id]` (under
  `(portal)/app/(protected)`).
- **Audit entity name:** `payment` (`entity_type = 'payment'`).
- **Permission module:** `payments` (keys `payments.*`).

---

## 5. Reuse vs new table decision (grounded in the live schema)

**Decision: create a NEW greenfield `invoice_payments` table. Do NOT reuse or extend the legacy
`payments` table.**

| Option | Verdict | Why |
|---|---|---|
| **Reuse `payments`** | ✗ Rejected | It is the **live Stripe-webhook target** (`/api/stripe/webhook` writes it). It has no `invoice_id`, uses **integer `amount_chf`** (not `numeric(12,2)`), is customer/Stripe-shaped, and lacks `updated_at`/archive/created_by/paid_at. Reusing entangles the internal invoice-payment layer with the webhook and mixes money conventions. |
| **Extend `payments` additively** | ✗ Rejected | Adding `invoice_id`/archive/audit columns + widening its `status` CHECK is a **modification of a webhook-written business table** — out of scope ("no business-table rewrite"), and risks the live checkout. |
| **New `invoice_payments`** | ✓ **Chosen** | **Additive, non-destructive**, mirrors the P5–P9 greenfield-per-phase pattern, uses `numeric(12,2)` consistent with invoices, gets its own permission-gated RLS + audit + status machine, references `invoices`. The legacy `payments`/`payment_links`/`stripe_events` stay 100% untouched and are referenced only as **future-reconciliation planning**. |
| New `payment_records` | ✗ Rejected (naming) | `invoice_payments` is clearer about the invoice linkage; "payment_records" is generic. |

The new table carries Stripe **reference** fields (provider, provider_payment_id, checkout_session,
payment_intent) so a **future** webhook/reconciliation can populate/match them — but **P10 records
them manually only; no Stripe SDK, no webhook wiring, no secrets.** The legacy `payments.stripe_*`
columns become the future match target, documented in §20.

---

## 6. Data model proposal — `public.invoice_payments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` | timestamptz NOT NULL | `now()` |
| `updated_at` | timestamptz NOT NULL | touch trigger |
| `payment_number` | text NOT NULL | default `'PAY-' || lpad(nextval('payment_number_seq')::text,5,'0')`; **unique** |
| `invoice_id` | uuid NOT NULL | → `invoices(id)` **ON DELETE RESTRICT** (payment belongs to an invoice; keeps history) |
| `company_id` | uuid NOT NULL | → `companies(id)` **ON DELETE RESTRICT**; **denormalized from the invoice** (not editable) |
| `amount` | numeric(12,2) NOT NULL | CHECK `> 0` |
| `currency` | text NOT NULL | default `'CHF'`; CHECK `= 'CHF'` |
| `status` | text NOT NULL | default `'pending'`; CHECK (see §7) |
| `method` | text NULL | CHECK null or `bank_transfer/card/cash/twint/other` |
| `provider` | text NOT NULL | default `'manual'`; CHECK `manual/stripe` |
| `provider_payment_id` | text NULL | reference only |
| `provider_checkout_session_id` | text NULL | reference only |
| `provider_payment_intent_id` | text NULL | reference only (future match key) |
| `payment_link_id` | uuid NULL | **soft reference** to legacy `payment_links` (no FK — avoids coupling) |
| `paid_at` | timestamptz NULL | set when status → `succeeded` |
| `failed_at` | timestamptz NULL | set when status → `failed` |
| `refunded_at` | timestamptz NULL | set when status → `refunded` |
| `notes` | text NULL | |
| `internal_notes` | text NULL | staff-only |
| `archived_at` | timestamptz NULL | soft-archive |
| `archived_by` | uuid NULL | → `profiles(id)` SET NULL |
| `created_by` | uuid NULL | → `profiles(id)` SET NULL |
| `updated_by` | uuid NULL | → `profiles(id)` SET NULL |

### Decisions & justifications

- **Payment requires `invoice_id` (NOT NULL).** P10 is the *invoice* payments bridge; every record
  belongs to an invoice. Standalone/deposit payments are **deferred**. *(Decision; default = required.)*
- **`company_id` denormalized from the invoice** (copied at create, not editable) — fast list/filter
  without a join; the invoice remains the authority. NOT NULL, RESTRICT.
- **Partial payments: SUPPORTED.** Multiple `invoice_payments` rows per invoice; the invoice's
  `amount_paid = Σ succeeded non-archived payments`. This is the core reason for a payments table.
- **Overpayments: allowed but clamped.** `amount_paid` may exceed `total_amount`; `balance_due =
  max(0, total − amount_paid)`; the UI shows an "overpaid by X" hint. *(Decision; alt = block.)*
- **Manual payments: yes** (the only kind in P10; `provider='manual'`). Stripe-confirmed payments are
  the deferred reconciliation phase.
- **Stripe reference fields: included now** (text, reference-only, manually entered) so the future
  webhook can populate/match them. **No Stripe SDK, no secrets, no live calls in P10.**
- **Refunds: manual status only** (`succeeded → refunded`, records `refunded_at`, removes the
  contribution). **No Stripe refund call, no partial refund** — deferred. *(In scope as a status; the
  *automation* is out of scope.)*
- **Payment links: linked as an optional soft reference** (`payment_link_id uuid`, **no FK**) to avoid
  coupling to the legacy table's lifecycle. *(Decision; alt = SET NULL FK.)*
- **`organization_id`: deferred** (consistent with P5–P9).
- **Hard deletes: never.** Payments are soft-archived; `invoice_id` is RESTRICT so an invoice with
  payments cannot be hard-deleted (invoices are archived anyway).

---

## 7. Payment status model

**Statuses (6):** `pending`, `succeeded`, `failed`, `refunded`, `cancelled`, `archived`.

> Note: the new table uses **`succeeded`** (Stripe-aligned) for a completed payment, intentionally
> distinct from the **invoice's** `paid` lifecycle state (P9), to avoid conflating "this payment
> completed" with "this invoice is fully paid". The legacy `payments` table's `paid` value is
> unrelated and untouched.

**StatusBadge token mapping:**

| Status | Token | | Status | Token |
|---|---|---|---|---|
| `pending` | `waiting` | | `refunded` | `revoked` |
| `succeeded` | `done` | | `cancelled` | `cancelled` |
| `failed` | `failed` | | `archived` | `cancelled` |

**Allowed transitions** (`paymentStatusMachine`):

- `pending → succeeded` — **`payments.mark_paid`** + **confirm** (money-confirming). Sets `paid_at`;
  **recomputes the invoice**.
- `pending → failed` — `payments.update`. Sets `failed_at`. (No invoice effect.)
- `pending → cancelled` — `payments.update`. (No invoice effect.)
- `succeeded → refunded` — **`payments.refund`** + **confirm**. Sets `refunded_at`; **recomputes the
  invoice** (removes the contribution).

**Terminal:** `failed`, `cancelled`, `refunded`. **Near-terminal:** `succeeded` (only → refunded).
Only `succeeded` contributes to `amount_paid`; `refunded`/`pending`/`failed`/`cancelled` do not.

**Archive / restore** are dedicated actions (not status transitions):

- **Archivable only from `pending`, `failed`, `cancelled`, `refunded`** (the inert, non-contributing
  states). A **`succeeded`** payment must be **refunded first** (which removes its money), then
  archived — so archiving never silently changes `amount_paid`. Type-to-confirm the `payment_number`.
- **Restore → `pending`** (the safe inert state; restoring never re-injects money until a new
  mark-paid). *(Edge flagged in §25.)*

**Refunded is manual** in P10 (no Stripe-driven). No automated overdue/cron. No
email/order/Stripe/checkout side effects on any transition.

---

## 8. Invoice payment-state interaction (the P9 bridge)

`recalculateInvoicePaymentState(invoiceId)` is the **single writer** of the invoice's paid columns
once payment records exist:

- `amount_paid = round2(Σ amount of succeeded, non-archived invoice_payments)`.
- `balance_due = max(0, total_amount − amount_paid)`.
- `paid_at = (balance_due == 0 ? latest succeeded paid_at : null)`.

It runs after every payment **create is irrelevant** (pending = 0), and after every
**mark-paid / refund / archive / restore / amount-edit** that could change the sum. It emits
`invoice.payment_state_updated` on the **invoice** entity (field names only — no amounts).

**Explicit answers to the prompt's questions:**

- **Does recording a *paid* payment auto-mark the invoice `paid`?** **No (conservative default).**
  Recording/confirming a payment updates `amount_paid`/`balance_due`/`paid_at` only; the **invoice
  status** stays a deliberate P9 action. When `balance_due` hits 0 the invoice detail shows a "fully
  paid — mark invoice Paid?" hint linking to P9's status control (gated `invoices.mark_paid`).
  *(Decision: auto-advance `issued/overdue → paid` when balance reaches 0 is a reasonable opt-in —
  flagged in §25.)*
- **Does archiving/refunding a payment recalculate the invoice?** **Yes** — refund removes the
  contribution and recomputes; archiving only ever touches non-contributing rows, so it is
  invoice-neutral by construction.
- **Do failed/pending payments affect invoice totals?** **No** — only `succeeded` counts.
- **How to avoid conflicts with P9 manual mark-paid/un-pay?** P9's `changeInvoiceStatus` currently
  sets `amount_paid = total` on `paid` and clears it on un-pay. **When ≥1 non-archived payment record
  exists, payment records become the authority**: P10 adds a **small additive guard** in P9's
  `changeInvoiceStatus` so the manual amount mutation is **skipped** (the recalc owns the figures);
  the status can still be set, but money comes from payments. For invoices with **no** payment records
  P9 behaviour is unchanged (backward compatible). *(This one P9-file edit is the integration the
  prompt asks for; alternative = leave P9 untouched and document "don't mix" — §25.)*
- **Void/archived invoice:** **no new payments** may be created against a `void` or `archived`
  invoice; payment creation is allowed only when invoice status ∈ `{issued, overdue, paid}`.

---

## 9. Permissions model

**New permissions (6):** `payments.read`, `payments.create`, `payments.update`, `payments.archive`,
`payments.mark_paid`, `payments.refund`.

| Permission | admin | sales | analyst | reviewer | read_only |
|---|---|---|---|---|---|
| `payments.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payments.create` | ✓ | ✓ | — | — | — |
| `payments.update` | ✓ | ✓ | — | — | — |
| `payments.mark_paid` | ✓ | — | — | — | — |
| `payments.refund` | ✓ | — | — | — | — |
| `payments.archive` | ✓ | — | — | — | — |

Rationale (conservative, money-confirming is admin-only): **sales records a payment (`pending`) and
edits its references/notes**, but **cannot mark it succeeded, refund or archive** — those move the
invoice's money and are admin-only. This is a clean **record-then-confirm** workflow: sales logs an
expected/received payment as `pending` (zero invoice impact); admin confirms it (`mark_paid` →
invoice recomputes). analyst/reviewer/read_only read-only. **No role editor UI.** `changePaymentStatus`
enforces the base `payments.update` **plus** the per-target permission.

---

## 10. RLS / security model

- **Reads: permission-gated RLS** on `invoice_payments` (identical to P6–P9):
  `create policy invoice_payments_select on public.invoice_payments for select to authenticated
  using (has_permission('payments.read') or is_platform_super_admin());`. Probe expectation:
  permission-less `sub` → 0 rows; admin/super-admin → visible.
- **No INSERT/UPDATE/DELETE RLS policies.** All writes via **service-role** `'use server'` actions,
  gated by `requireAuth()` + `hasPermission()`.
- **Archived rows hidden by default** in `listPayments` (`.is('archived_at', null)` unless
  `showArchived`).
- **Platform-super-admin** read via `is_platform_super_admin()`.
- **Audit technical fields stay gated** by `audit.read_technical`; ordinary metadata holds field
  names + ids + payment_number only.
- **No client writes; no service-role import in client components.** **No Stripe SDK and no secrets
  anywhere client-side** — provider fields are plain text columns; P10 makes **no** Stripe calls.
- **No public payment access in P10** (no anon policy, no public route).
- **Old P4/P6/P7/P8/P9 function-grant hardening remains intact** (no function changes).

---

## 11. Migration plan — `0027_invoice_payments`

Additive, greenfield; mirrors `0026_invoices`. Apply live via Supabase MCP `apply_migration` (name
`0027_invoice_payments`), then mirror to `supabase/migrations/0027_invoice_payments.sql`, regenerate
`database.ts`, add the README entry. **No changes to `payments`/`payment_links`/`stripe_events`/
`orders`/`subscriptions`/`customers`/`invoices`/checkout/Stripe.**

1. `create sequence public.payment_number_seq;`
2. `create table public.invoice_payments (...)` per §6 with CHECKs: `amount > 0`; `currency = 'CHF'`;
   `status in ('pending','succeeded','failed','refunded','cancelled','archived')`; `method null or in
   ('bank_transfer','card','cash','twint','other')`; `provider in ('manual','stripe')`.
3. FKs: `invoice_id → invoices(id) ON DELETE RESTRICT`; `company_id → companies(id) ON DELETE
   RESTRICT`; `archived_by/created_by/updated_by → profiles(id) ON DELETE SET NULL`.
   (`payment_link_id` = plain uuid, **no FK**.)
4. `touch_updated_at` trigger.
5. Indexes: unique `invoice_payments_payment_number_uidx`; `invoice_id`; `company_id`; partial
   `status` (`where archived_at is null`); `created_at desc`; `provider_payment_intent_id`
   (`where provider_payment_intent_id is not null` — future reconciliation lookup).
6. `enable row level security` + the `invoice_payments_select` permission-gated policy
   (idempotent `if not exists`). **No write policies.**
7. Seed the 6 `payments.*` permissions (`on conflict (key) do nothing`).
8. Seed role grants (idempotent `not exists`) per §9.
9. `-- ROLLBACK:` comments on every block (drop table, drop sequence, delete permissions/grants).

Next migration after this is `0028`.

---

## 12. Server actions and queries

Module `src/modules/payments/`. All actions: `'use server'` → zod validate → `requireAuth()` +
`hasPermission(...)` → status/relationship checks → service-role write → `recalc` where relevant →
`logEvent(...)` → `revalidatePath(...)` → typed `{ ok } | { error }`.

**Queries (`queries.ts`, `import 'server-only'`, service-role, gated `payments.read`):**

- `listPayments(filters)` — search (`payment_number`/notes ilike), filters `status`, `companyId`,
  `invoiceId`, `showArchived` (default hides archived), 25/page, `order created_at desc`; resolves
  company + invoice number; returns amount/status/method/paid_at.
- `getPayment(id)` — payment + invoice (number, status, archived hint) + company name/archived hint.
- `listPaymentsForInvoice(invoiceId)` — ordered payments for the invoice-detail Payments section
  (number, amount, status, method, paid_at).
- `getInvoicePaymentSummary(invoiceId)` — `{ totalAmount, amountPaid, balanceDue, paidCount,
  overpaid }` derived for the invoice detail.
- `listInvoiceOptionsForPayment()` / `listInvoiceOptionsForCompany(companyId)` — **issued/overdue/paid,
  non-archived** invoices for the create picker.

**Actions (`actions.ts`):**

- `createManualPayment` — `payments.create`; require an invoice that exists, is **non-archived** and
  status ∈ `{issued, overdue, paid}`; **denormalize `company_id` from the invoice**; `amount > 0`;
  `status = 'pending'`; `provider = 'manual'` (refs optional); set created_by/updated_by; audit
  `payment.created`. **No invoice recalc** (pending = 0). *(Create is always `pending`; succeeded is a
  separate gated step — §25 decision.)*
- `updatePayment` — `payments.update`; **only while `pending`** (editable: amount, method, provider
  refs, payment_link_id, notes, internal_notes); never company_id/invoice_id/status/paid_at; audit
  `payment.updated` (changed field names only).
- `changePaymentStatus` — `payments.update` **+** the per-target permission (`payments.mark_paid` for
  `succeeded`, `payments.refund` for `refunded`, base for `failed`/`cancelled`); reject if archived;
  `isLegalPaymentTransition`; set `paid_at`/`failed_at`/`refunded_at`; **call
  `recalculateInvoicePaymentState`** on succeeded/refunded; audit `payment.status_changed` (+ the
  invoice-side `invoice.payment_state_updated` when amounts change).
- `archivePayment` — `payments.archive`; **only when status ∈ {pending, failed, cancelled, refunded}**;
  type-to-confirm `payment_number`; audit `payment.archived`. (Invoice-neutral.)
- `restorePayment` — `payments.archive`; archived → `pending`; audit `payment.restored`.
- `recalculateInvoicePaymentState(admin, invoiceId)` (internal) — §8 math; writes the invoice;
  emits `invoice.payment_state_updated`.

Error handling: generic safe messages; specific relationship/transition messages; no raw DB errors;
**no Stripe secrets or provider tokens logged**. Revalidate `/app/payments`, `/app/payments/[id]`,
and the linked `/app/invoices/[id]` after invoice-affecting writes.

---

## 13. UI / routes

Routes under `src/app/(portal)/app/(protected)/payments/`: `page.tsx` (list), `new/page.tsx`
(create), `[id]/page.tsx` (detail). Topbar gains a **"Payments"** link gated on `payments.read`.

- **List** (`PaymentTable`): clickable rows; columns payment number / invoice / company /
  **StatusBadge** / amount / method / paid date; search; status + company filters; **archived
  toggle**; pagination (25); empty states. "New payment" button (gated `payments.create`).
- **Create** (`PaymentForm`): pick an **issued/overdue/paid non-archived invoice** (company derived) +
  amount + method (+ optional provider refs/notes). The primary path is the **invoice-detail "Add
  payment"** button (§14); `/new` is the standalone alternative.
- **Detail** (`PaymentDetailActions`): see §15 — status control (mark paid / refund / fail / cancel
  per permission + confirm), EditableBlocks (pending only), ConfirmDialog archive (type-to-confirm
  `payment_number`), HistoryButton/Timeline. Archived = read-only except Restore; non-pending =
  read-only except permitted status actions.

---

## 14. Invoice detail integration (`/app/invoices/[id]`) — additive

P10 **additively** adds to the P9 invoice detail (touching `InvoiceDetailActions`, the `[id]` page,
and a one-line guard in `invoices/actions.ts` — §8):

- A **Payments section** (`InvoicePaymentsSection`): the invoice's payments (number, amount, status,
  method, paid_at) + an **"Add payment"** button (gated `payments.create`, shown when invoice status
  ∈ `{issued, overdue, paid}` and not archived).
- **Payment summary**: `amount_paid` / `balance_due` (now **derived from payments** when any exist) +
  an **"overpaid by X"** hint and a **"fully paid — mark invoice Paid?"** hint (links to P9's status
  control) when `balance_due == 0`.
- **Manual mark-paid (P9)**: **kept** for invoices with **no** payment records; when payment records
  exist it is **superseded** (the guard skips the manual amount mutation; the UI nudges toward the
  Payments section).
- **History**: the invoice history shows `invoice.payment_state_updated`; full payment-event detail
  lives on the **payment** detail/history (clean separation).
- **No** company/project/quote detail Payments sections (out of scope).

---

## 15. Payment detail page sections

1. **Header** — `payment_number` + amount; **StatusBadge**; **HistoryButton**.
2. **Status control** — permitted legal transitions (mark paid / refund / mark failed / cancel), each
   gated + (succeeded/refunded) confirmed.
3. **Links** — invoice (number + status, archived hint) and company (archived hint).
4. **Payment metadata** — method, provider, `paid_at`/`failed_at`/`refunded_at`, created/updated by +
   timestamps.
5. **Provider references** — provider_payment_id / checkout_session / payment_intent / payment_link_id
   (read-only display; references, not secrets; visible to `payments.read`).
6. **Notes** + **Internal notes** — EditableBlocks (**pending only**; read-only otherwise).
7. **Archive / Restore** — ConfirmDialog (type-to-confirm `payment_number`) when status ∈
   {pending, failed, cancelled, refunded}; Restore on archived.
8. **Created / updated metadata** — provenance footer.

---

## 16. Audit / history

**Payment events:** `payment.created`, `payment.updated`, `payment.status_changed`,
`payment.archived`, `payment.restored`. **Invoice-side:** `invoice.payment_state_updated` (emitted by
the recalc). *(`payment.linked_to_invoice` is N/A — `invoice_id` is set at creation; no separate link
step. `payment.invoice_state_recalculated` is represented by `invoice.payment_state_updated`.)*

- `entity_type = 'payment'`; `entity_id` = payment id. The invoice-side event has
  `entity_type='invoice'`, `entity_id` = invoice id.
- `old_status`/`new_status` on status/archive/restore.
- **Safe (ordinary) metadata:** `payment.created` `{ payment_number, invoice_id }`; `payment.updated`
  `{ fields: [changed names] }`; `payment.status_changed` (old/new status, no amounts);
  `invoice.payment_state_updated` `{ fields: ['amount_paid','balance_due','paid_at'] }` (**names
  only**).
- **Forbidden in ordinary metadata:** any **amount** (`amount`, `amount_paid`, `balance_due`,
  `total_amount`), and any **provider secret/token**. Provider reference ids and raw before/after
  amounts go only to technical `old_values`/`new_values` (gated by `audit.read_technical`).
- **Display:** add 5 `payment.*` labels/colours + `invoice.payment_state_updated` in
  `src/lib/audit/display.ts` (e.g. created→`done`, status_changed→`warning`, archived→`revoked`,
  restored→`done`, payment_state_updated→`system`). The existing History timeline renders them.

---

## 17. Relationship with invoices, companies, payment links and Stripe

- **Payment requires an invoice** (`invoice_id` NOT NULL, RESTRICT). Creating is allowed only for
  `issued/overdue/paid`, non-archived invoices.
- **Company** is **denormalized from the invoice** (NOT NULL, RESTRICT, not editable).
- **Provider references** (provider_payment_id / checkout_session / payment_intent) are reference-only
  text, manually entered; `provider_payment_intent_id` is the **future match key** to
  `payments.stripe_payment_intent`.
- **`payment_links`**: optional **soft reference** (`payment_link_id uuid`, no FK) — link only, no
  reuse, no write to the legacy table.
- **`stripe_events`**: **no relationship** in P10 (future reconciliation may consult it).
- **Archiving the invoice**: invoices with payments can't be hard-deleted (RESTRICT) and are archived,
  not deleted; existing payment rows stay; the payment detail shows an "invoice archived" hint. New
  payments are blocked on archived/void invoices.
- **Void invoice**: existing payments remain as historical records (a void after payment is an
  accounting edge surfaced read-only); no new payments.
- **Archived payment**: excluded from `amount_paid` (only succeeded non-archived count) — but since
  succeeded can't be archived, archiving is invoice-neutral.
- **Future Stripe reconciliation** (planning): the webhook (untouched in P10) would, in a later phase,
  upsert/match an `invoice_payments` row by `provider_payment_intent_id` and call the same recalc.
- **Future checkout integration** (planning): a hosted payment for an invoice would create a `pending`
  `invoice_payments` row, then the webhook flips it `succeeded`.

---

## 18. Money handling

- **Currency:** CHF only (CHECK), single-currency.
- **Amount:** `numeric(12,2)`, **`> 0`** (a payment is positive; refunds are a status, not a negative
  amount).
- **Partial payments:** supported — many payments per invoice.
- **`amount_paid = round2(Σ amount of succeeded, non-archived payments)`**.
- **`balance_due = max(0, total_amount − amount_paid)`** (clamped ≥ 0).
- **Overpayment:** `amount_paid` may exceed `total_amount`; `balance_due` clamps at 0; UI shows
  "overpaid by `amount_paid − total`".
- **`paid_at` (invoice):** the latest succeeded payment's `paid_at` when `balance_due == 0`, else null.
- **Rounding:** `round2` (2-dp), shared pure helper, unit-tested.
- **Failed/refunded:** excluded from `amount_paid`; refund subtracts a previously-succeeded
  contribution (whole payment).
- **Manual rules:** create → `pending` (0 impact); admin `mark_paid` → counts; admin `refund` →
  un-counts. The pure invoice math lives in `src/modules/payments/recalc.ts` (or reuses the P9
  `round2`), isolated + tested. **Simple and robust — no ledger, no revenue recognition.**

---

## 19. Rate limiting / abuse

**No new public endpoints.** All payment actions are authenticated `/app` server actions behind
permissions + RLS. **No new rate limiting required.** **No Stripe calls, no secrets client-side.**
Public/hosted payment pages, checkout integration and webhook wiring are **deferred** (a future
reconciliation phase adds its own rate limiting + signature verification where public).

---

## 20. Legacy data / old admin (planning only)

- **Do not migrate** `payments`/`payment_links`/`stripe_events`/`orders`/`subscriptions`/`customers`
  in P10. **Do not modify** `/api/checkout` or `/api/stripe/webhook` or any Stripe code.
- **Future Stripe reconciliation (designed, not built):** match `invoice_payments` ↔ legacy `payments`
  by `provider_payment_intent_id` ↔ `payments.stripe_payment_intent` (and checkout_session ids); a
  later phase wires the webhook to create/confirm `invoice_payments` rows and call the recalc. No
  bridge is built now; only the reference columns exist.
- **Old `/[locale]/admin` remains untouched.** **No business-table rewrite.**

---

## 21. Files likely to create / update

**Create:**

- `supabase/migrations/0027_invoice_payments.sql`
- `src/modules/payments/{schema,types,status,guards,recalc,queries,actions}.ts`
- `src/app/(portal)/app/(protected)/payments/{page.tsx,new/page.tsx,[id]/page.tsx}`
- `src/components/portal/payments/{PaymentTable,PaymentForm,PaymentDetailActions,InvoicePaymentsSection}.tsx`
- Tests: `src/modules/payments/{recalc.test.ts,payments.test.ts}`,
  `src/components/portal/ui/p10_payments.test.tsx`
- `PORTAL_P10_SPEC.md` (this file), `PORTAL_P10_RUNBOOK.md`

**Update (additive):**

- `src/lib/status/colors.ts` (+`paymentStatusToken`)
- `src/components/portal/ui/StatusBadge.tsx` (+`'payment'` in `statusTokenFor`)
- `src/lib/audit/display.ts` (+5 `payment.*` + `invoice.payment_state_updated`)
- `src/lib/types/database.ts` (+`PaymentStatus`, `invoice_payments`)
- `src/components/portal/shell/Topbar.tsx` (+"Payments" nav, gated)
- `supabase/migrations/README.md` (+`0027` entry)
- **P9 integration (additive):** `src/components/portal/invoices/InvoiceDetailActions.tsx` +
  `src/app/(portal)/app/(protected)/invoices/[id]/page.tsx` (Payments section + Add-payment) and a
  **one-line guard** in `src/modules/invoices/actions.ts` `changeInvoiceStatus` (skip manual amount
  mutation when payment records exist — §8).

---

## 22. Tests

- **Migration / RLS** (live probe during build): permission-less `sub` → 0 rows on `invoice_payments`;
  admin/super-admin → visible (rolled-back transaction).
- **Permissions:** the 6-key × 5-role matrix (admin all; **sales create/update only**;
  mark_paid/refund/archive admin-only; others read).
- **Status machine:** legal transitions (pending→succeeded/failed/cancelled, succeeded→refunded),
  illegal jumps rejected, terminal states, `permissionForPaymentStatus` mapping, confirm set
  (succeeded/refunded).
- **Relationships:** invoice must be issued/overdue/paid + non-archived to create; company denormalized;
  archived/void invoice blocks creation.
- **Invoice payment-state:** `amount_paid = Σ succeeded`; pending/failed/refunded/archived excluded;
  partial payments sum; overpayment clamps `balance_due` at 0; refund/un-mark recompute; the P9 guard
  (manual mark-paid skipped when payments exist).
- **Money:** round2, sum, balance clamp, overpaid hint; `amount > 0`.
- **Action source-checks:** every action gated; `updatePayment` pending-only; **payments never
  hard-deleted** (`from('invoice_payments').delete` absent); archive-only-from non-succeeded; **no
  `stripe`/`/api/checkout`/`.from('payments')`/`payment_links`/`orders`/`subscriptions`/`customers`**;
  **no Stripe secret env (`STRIPE_SECRET`, `sk_`) referenced in the module or any client component.**
- **Audit:** labels/colours for all events; **no amount/secret in ordinary metadata** (regex);
  `invoice.payment_state_updated` carries field names only.
- **UI/component:** `StatusBadge` payment mapping; **no service-role import in client components**
  (`PaymentForm`/`PaymentDetailActions`/`InvoicePaymentsSection`).
- **Build/tsc:** `npx tsc --noEmit` clean; `npx vitest run` all pass; `npm run build` passes.
- **Regression:** P5–P9 + auth/profile/users/history + admin + **`/api/checkout` & `/api/stripe/webhook`
  unchanged** suites stay green; **old `/admin`** untouched; **Stripe/plans/promo unchanged**.

---

## 23. Manual smoke checklist

As **admin**: open an **issued** invoice → "Add payment" → record `CHF X` (`PAY-00001`, `Pending`) →
invoice `amount_paid` unchanged (pending). **Mark paid** (confirm) → invoice `amount_paid += X`,
`balance_due` drops, "fully paid" hint when 0. Add a **second partial** payment → sums correctly.
**Overpay** → "overpaid by" hint, `balance_due` 0. **Refund** a succeeded payment (confirm) →
`amount_paid` drops, balance restored. Mark a pending payment **failed** / **cancelled**. **Archive** a
pending/failed/cancelled/refunded payment (type the `PAY-` number) → "Show archived" reveals → restore
(→ pending). Try to archive a **succeeded** payment → blocked. Filters/search/pagination. As **sales**:
create + edit a **pending** payment, but **no Mark paid / Refund / Archive**; as **read_only**: view
only; Payments nav hidden without `payments.read`. Confirm the invoice's **manual mark-paid** is
suppressed once payments exist. History: payment detail shows payment events; invoice history shows
`invoice.payment_state_updated`. Confirm `/app/invoices|quotes|catalog|projects|companies|contacts|
users|profile`, old `/admin`, **checkout and the Stripe webhook** are unaffected.

---

## 24. Rollback plan

- **Code:** revert the P10 commit — module, routes, components, Topbar link, status/audit additions,
  and the additive P9 invoice-detail/guard edits revert together.
- **Migration (greenfield):** `drop table public.invoice_payments; drop sequence
  public.payment_number_seq;` + delete the 6 seeded permissions + grants (see `-- ROLLBACK:` lines).
  **No other table touched.** Never edit the applied migration.
- **Disable without rollback:** hide the Payments nav + gate routes behind a flag; removing the grants
  also hides it; the invoice-detail Payments section is gated on `payments.read`/`create`.
- **Invoice payment-state cleanup:** since the recalc only ran for invoices with payment records,
  reverting leaves P9's manual mark-paid as the sole writer again; any invoice whose `amount_paid` was
  derived can be re-set via P9's control. (Document the few affected invoices.)
- **Old `/admin`** remains the untouched fallback throughout.

---

## 25. Risks and open questions (defaults in **bold**)

1. **Reuse existing `payments` vs new table** — **new `invoice_payments`** (grounded §5). *Confirm.*
2. **Partial payments now vs defer** — **support now** (the table's reason to exist).
3. **Manual vs Stripe-linked payment** — **manual only**; reference fields present for the future
   webhook. *Confirm.*
4. **Provider reference fields** — **included** (reference-only text, no secrets).
5. **Refund handling** — **manual status** (`succeeded → refunded`, whole payment); no Stripe call, no
   partial refund. *Decision.*
6. **Invoice status auto-update** — **No auto-advance** (record payment → amounts only; human marks
   the invoice `paid`). Opt-in auto `issued/overdue → paid` when balance hits 0 is the alternative.
   *Decision.*
7. **Conflict with P9 manual mark-paid** — **additive guard**: payments win when any exist; P9
   unchanged for payment-less invoices. Alt = no guard + "don't mix" doc. *Decision.*
8. **Create status** — **always `pending`** (succeeded is a separate gated `mark_paid`). Alt = admin
   one-step create-as-succeeded. *Decision.*
9. **Overpayment** — **allowed, balance clamps at 0, hint shown**. Alt = block. *Decision.*
10. **Archive scope** — **archivable only from pending/failed/cancelled/refunded; restore → pending**
    (succeeded must be refunded first). *Decision.*
11. **`payment_link_id`** — **soft reference (no FK)**. Alt = SET NULL FK. *Decision.*
12. **Payment status vocabulary** — **`succeeded`** (Stripe-aligned, disambiguates from invoice
    `paid`). Alt = `paid`. *Decision.*
13. **Standalone (non-invoice) payments** — **deferred** (invoice required). *Decision.*
14. **`organization_id`** — **defer**.
15. **Finance overreach** — the main risk is drifting into a ledger/accounting engine; P10 stays a
    record + invoice-recompute.

---

## 26. Final readiness checklist

- **P10 spec ready:** **Yes.** Greenfield confirmed, `0027` numbering confirmed, reuse-vs-new grounded
  in the live `payments` shape, data model + status machine + invoice-recalc + P9 reconciliation +
  permissions + RLS + audit + UI + tests + rollback specified against the live schema and the P9
  precedent. No live calls made; no migration created.
- **Blockers:** none.
- **Decisions needed before build:** the 15 in §25 (all have safe recommended defaults).
- **Out-of-scope confirmed:** no checkout/Stripe/webhook changes, no public payment page, no
  reconciliation/accounting/ledger/refund automation, no PDF/email/tax engine, no order-sub-customer
  migration, no finance dashboard, no `/admin` removal, no business-table rewrite, no hard deletes.

**Exact approval question:** *"Approve P10 Payments / Stripe Bridge Core as specified — a new
greenfield `invoice_payments` table (migration `0027`, the legacy `payments`/webhook untouched),
statuses pending/succeeded/failed/refunded/cancelled/archived, permissions
`payments.read/create/update/mark_paid/refund/archive` (sales record-only; mark_paid/refund/archive
admin-only), partial payments + overpayment-clamp, manual payments with Stripe reference fields, the
invoice-detail Payments section + the additive P9 mark-paid guard, no invoice-status auto-advance —
with the §25 defaults (items 1-15) — and then build P10? Or change any of the §25 decisions first?"*

**Do not build yet. Awaiting P10 approval + the §25 decisions.**
