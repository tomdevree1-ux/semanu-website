# Stripe setup — amai.ch

Phase 5 wires the subscribe form to **Stripe Checkout**. The code is complete; it
just needs a Stripe account + the five ids below in `.env.local`. Nothing here
charges anyone until you use real (live) keys.

## Billing model

> **Superseded (June 2026).** The public self-serve checkout was removed and the Beginner/Starter
> 35 CHF tier was discontinued. Current plans: Business Website 99 CHF/mo, Webshop 125 CHF/mo (source
> of truth: `src/content/pricingTiles.ts` and `src/lib/stripe/plans.ts`). The table and steps below
> document the original Phase 5 setup; reconcile them with the live Stripe Prices before use.

| Item | Type | Amount | Stripe Price |
|---|---|---|---|
| Starter plan | recurring, monthly | 35 CHF / mo | `STRIPE_PRICE_STARTER` |
| Business plan | recurring, monthly | 79 CHF / mo | `STRIPE_PRICE_BUSINESS` |
| Webshop plan | recurring, monthly | 99 CHF / mo | `STRIPE_PRICE_WEBSHOP` |
| Logo + brand guidelines add-on | **one-time** | 375 CHF (50% promo; else 750) | `STRIPE_PRICE_LOGO` |
| Google Ads management add-on | recurring, monthly | 200 CHF / mo | `STRIPE_PRICE_GOOGLE_ADS` |
| Software & Applications | quote-based | ab 99 CHF / mo | not in checkout (routes to `/kontakt`) |

A Business order with the Logo add-on becomes a 79 CHF/mo subscription **plus** a single
375 CHF charge on the first invoice (the one-time Price is added as a line item to the
subscription Checkout Session). Ticking Google Ads adds a recurring 200 CHF/mo line.

## 1. Create products and prices

Dashboard → **Product catalogue → Add product** (currency **CHF**), or via CLI.

1. **Starter Website** → recurring Price, 35 CHF, billing period *monthly* → copy the
   `price_…` id into `STRIPE_PRICE_STARTER`.
2. **Business Website** → recurring Price, 79 CHF, *monthly* → `STRIPE_PRICE_BUSINESS`.
3. **Webshop** → recurring Price, 99 CHF, *monthly* → `STRIPE_PRICE_WEBSHOP`.
4. **Logo + brand guidelines** → **one-time** Price, 375 CHF (50% promo; 750 regular) → `STRIPE_PRICE_LOGO`.
   > Must be a **one-time** Price, not recurring. A recurring add-on Price would
   > create a second subscription line instead of a single charge.
5. **Google Ads Management** → recurring Price, 200 CHF, *monthly* → `STRIPE_PRICE_GOOGLE_ADS`.

## 2. API keys

Dashboard → **Developers → API keys**:

- `STRIPE_SECRET_KEY` = the secret key (`sk_test_…` in test mode). Server-only.
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` = the publishable key (`pk_test_…`).

## 3. Webhook

The webhook keeps Supabase in sync (marks orders paid, mirrors subscription state,
sends the confirmation email).

**Local development** — forward events to the dev server:

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed whsec_… into STRIPE_WEBHOOK_SECRET
```

**Production** — Dashboard → **Developers → Webhooks → Add endpoint**:

- URL: `https://amai.ch/api/stripe/webhook`
- Events: `checkout.session.completed`, `customer.subscription.created`,
  `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the endpoint's **Signing secret** into `STRIPE_WEBHOOK_SECRET`.

## 4. Database

Apply `supabase/migrations/0002_init_billing.sql` (see `supabase/README.md`) so the
`orders` / `customers` / `subscriptions` tables exist, then regenerate
`src/lib/types/database.ts`.

## 5. Test the flow

1. `npm run dev`, open `/de/checkout`, pick a plan (and optionally the add-on).
2. Submit → you are redirected to Stripe Checkout. Pay with test card
   `4242 4242 4242 4242`, any future expiry/CVC.
3. On success you land on `/de/checkout/success`; canceling returns to
   `/de/checkout?canceled=1`.
4. Check: the `orders` row flips to `paid`, a `customers` row appears, a
   `subscriptions` row mirrors the Stripe status, and (if `RESEND_API_KEY` is set)
   a confirmation email is sent. Without a Resend key the send is skipped and logged.

## 6. Automated invoices (B2B + B2C)

Subscriptions already create an invoice **every billing cycle**, and the one-time Logo
line rides on the first invoice. The checkout now creates a real Stripe **Customer** with
the billing identity from step 3 (Privatperson/Firma → name + address; the UID/MWST number
goes into the customer metadata), so each invoice shows the right name and address.

To make Stripe **email** those invoices automatically (no portal needed):

1. **Settings → Invoicing → Customer emails**: turn on *Email finalised invoices to
   customers*. Subscription invoices are finalised + emailed automatically each cycle.
2. **Settings → Invoice template / Branding**: add the business name (Einzelfirma Tom de
   Vree), address (Wylerstrasse 75, 3000 Bern), email, logo and a footer. This is what
   prints on the PDF.
3. When the **MWST/UID** number is issued, add it under your business details so it prints
   on invoices.

Notes:

- The customer address syncs from what is confirmed at payment
  (`billing_address_collection: 'required'` + `customer_update.address: 'auto'`), so even
  Privatperson invoices carry a billing address.
- VAT/UID is stored in Customer **metadata** for now. Printing it as a proper `tax_id` and
  applying reverse-charge / 0% is the **Stripe Tax** step, parked until the GmbH switch
  (enable `automatic_tax` + `tax_id_collection` then).
- A pure one-time purchase (a product without a plan) is not in the current flow; if added
  later, use a `payment`-mode session with `invoice_creation: { enabled: true }`.

## How the code fits together

- `src/lib/stripe/server.ts` — lazy server Stripe client.
- `src/lib/stripe/plans.ts` — plan → Price mapping + CHF amounts + locale map.
- `src/app/api/checkout/route.ts` — validates, records a `pending` order, creates the
  Checkout Session, returns its URL.
- `src/components/SubscribeForm.tsx` — posts to `/api/checkout` and redirects.
- `src/app/api/stripe/webhook/route.ts` — verifies the signature and syncs Supabase.
- `src/lib/email.ts` — Resend confirmation/notification (no-op without a key).

## Not in scope yet (Phase 4 portal)

The Stripe **Customer Portal** (let customers manage/cancel billing) and gating
Premium features on subscription state belong to the portal phase. The
`subscriptions` table already mirrors the state the portal will read.
