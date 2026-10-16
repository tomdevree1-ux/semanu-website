# Prompt — amai.ch pricing page + checkout redesign (Belgalink-style layout)

> Paste this to the build agent. It is self-contained. Reference design:
> `https://www.belgalink.be/tarieven` (layout only — **not** the colours, **not**
> the prices, **not** the setup-fee model).

---

## Objective

Redesign the amai.ch **pricing page** (`src/app/[locale]/website-abos/page.tsx`)
so its *layout* mirrors Belgalink's `/tarieven` page: a clean header, a row of
four plan cards with one highlighted, a separate full-width **Google Ads** block,
and the **add-on** banner. Then rework the **checkout** page/flow
(`/checkout`, `SubscribeForm`) to match, with clear, user-friendly UI/UX.

Reuse Belgalink's *wording* but **rework it** into amai's voice, house style and
three locales. Keep amai's **red brand** and its **all-in monthly subscription**
model (no setup fee, no separate "Care" line).

---

## Current state (already done — build on it)

`src/messages/{de,fr,en}.json` already hold four plans in the all-in monthly model:

| key | name | price | routes to |
|---|---|---|---|
| `s` | Starter | 40 CHF / Monat | checkout (`plan=starter`) |
| `b` | Business | 80 CHF / Monat — **featured** | checkout (`plan=business`) |
| `w` | Webshop | 55 CHF / Monat | checkout (`plan=webshop`) |
| `p` | Software & Applications | ab 99 CHF / Monat | `/kontakt` (quote) |

Card slot order stays **Starter → Business → Webshop → Software** (as listed).
Note the price ladder is not strictly ascending (Webshop 55 < Business 80); that
is intentional. If strict ascending order is preferred, swap Business and Webshop
slots — confirm with Tom before reordering.

The `webshop` plan is **not yet wired** into the checkout stack — do that (see
"Files to touch").

---

## Hard constraints (do not break)

- **Brand stays RED.** Use existing tokens/primitives from `globals.css`: `red`
  (#E5392B), `ink` (bordeaux), `paper`, `spark` (gold), `ok`; `.btn`,
  `.btn-primary|-onink|-spark|-ghost`, `.eyebrow`, `.h1/.h2/.h3`,
  `.container-site`, `rounded-pill`, `font-display`, `font-mono`. **Do not** copy
  Belgalink's blue/navy. Featured card = `bg-ink text-paper`; badge = `bg-spark`.
- **Copy style (every language):** no em/en dashes (— –), no hyphens in compounds
  (write `Mobile First`, `SEO Grundlagen`, `Email`, `AI Analyse` — never
  `mobile-first`, `Display-`, `A/B-Testing`). No comma before a coordinating
  conjunction (`und/oder/aber/mit` · `et/ou/mais/avec` · `and/or/but/with`). In
  FR rephrase to avoid hyphens and question inversions. URL slugs keep hyphens
  (`/website-abos`). Brand wordmark `amai!` with gold `!`.
- **i18n parity:** every user-facing string lives in `src/messages/{de,fr,en}.json`;
  all three stay in parity (same keys). DE is primary.
- **Verify:** `npx tsc --noEmit` clean **and** a key-parity check across the three
  message files. Both green before done.
- **Pricing model:** all-in monthly abo. Hosting, Wartung and SEO are included in
  the monthly price. **No** setup fee, **no** separate "Care" subscription line.
- Server-authoritative `ORDER_FLOW_MODE` stays (default `request` = enquiry email).
  Never expose `STRIPE_SECRET_KEY` / `SUPABASE_SERVICE_ROLE_KEY` to the client.
  No `localStorage`/`sessionStorage`.

---

## Page layout (top to bottom)

### 1. Header
- eyebrow `price.eyebrow` → **Preise**
- `h2` (`price.h2`) → **Transparente Preise, vorab vereinbart.**
- intro (`price.intro`) → **Keine versteckten Kosten oder Überraschungen im Nachhinein. Sie wissen genau, woran Sie sind, bevor wir starten.**

### 2. Plans intro
- eyebrow → **Websites & Software**
- heading → **Ihre Website, massgeschneidert**
- sub → **Jedes Paket enthält Design, Entwicklung und SEO. Hosting und Wartung sind im Abo immer inklusive.**

### 3. Four plan cards (responsive grid: 1 col mobile, 2 cols `md`, 4 cols `lg`)

Each card: plan name, monthly price + `/ Monat`, one-line description, a checkmark
feature list, and a CTA. Business is the featured (ink) card with the badge
**Am häufigsten gewählt**. Software shows the price as **ab 99 CHF**.

Reworked DE copy (translate to FR/EN in parity + house style; keep existing
FR/EN plan names and `per` values):

| slot | name | price | description (DE) | features (DE) | CTA (DE) | link |
|---|---|---|---|---|---|---|
| `s` | Starter | 40 CHF | Professionelle One Pager Website für einen starken ersten Eindruck. | Massgeschneidertes Design · Mobile First · Kontaktformular · SEO Grundlagen · Erste Lieferung in 3 Werktagen | Starter anfragen | `/checkout?plan=starter` |
| `b` | Business | 80 CHF | Mehrseitige Website für wachsende KMU. | Bis 15 Seiten massgeschneidert · Massgeschneidertes Design · Kontaktformular · Vollständige SEO Optimierung · Erste Lieferung in 5 Werktagen | Business anfragen | `/checkout?plan=business` |
| `w` | Webshop | 55 CHF | Ein conversion orientierter Webshop, der verkauft. | Vollständiges Webshop Setup · Produkt und Bestellverwaltung · Online Zahlungen · Kundenkonten · Vollständige SEO Optimierung · Erste Lieferung in 8 Werktagen | Webshop anfragen | `/checkout?plan=webshop` |
| `p` | Software & Applications | ab 99 CHF | Vollständig massgeschneidert: Systeme, die Ihre Arbeit automatisieren. | Vermietung und Buchungssysteme · Kassensoftware · CRM nach Mass · Buchhaltungssystem · Datenbank mit AI Analyse · Kundenplattformen | Projekt besprechen | `/kontakt` |

Also update the JSON-LD `Service` offers to Starter 40, Business 80, Webshop 55
(CHF / MONTH). Software is quote-based — omit its price or omit the offer.

### 4. Google Ads block (full-width card under the grid)

New message namespace `googleAds`. Layout like Belgalink's Google Ads card: left
side shows the price, right side a CTA, then a two-column checkmark feature list,
then a footnote.

| field | DE | FR | EN |
|---|---|---|---|
| eyebrow | Google Ads | Google Ads | Google Ads |
| heading | Direkt zuoberst bei Google | Directement en haut sur Google | Right at the top of Google |
| price label | Verwaltung ab | Gestion dès | Management from |
| price | 150 CHF | 150 CHF | 150 CHF |
| per | / Monat | / mois | / month |
| cta | Anfragen | Demander | Request |
| footnote | Das Werbebudget selbst ist in diesem Preis nicht enthalten. | Le budget publicitaire lui même n'est pas compris dans ce prix. | The advertising budget itself is not included in this price. |

Features (parity arrays):
- DE: Aufbau und Verwaltung von Google Search Kampagnen · Shopping Ads für Webshops · A/B Tests für Anzeigen · Budget und CPA Verwaltung · Display und Remarketing Kampagnen · Conversion Tracking und Zielgruppenanalyse · Monatliche Optimierung und Reporting
- EN: Setup and management of Google Search campaigns · Shopping Ads for webshops · A/B testing of ads · Budget and CPA management · Display and remarketing campaigns · Conversion tracking and audience analysis · Monthly optimisation and reporting
- FR: Mise en place et gestion des campagnes Google Search · Shopping Ads pour webshops · Tests A/B des annonces · Gestion du budget et du CPA · Campagnes display et remarketing · Suivi des conversions et analyse d'audience · Optimisation et reporting mensuels

CTA routes to `/kontakt` (Google Ads is quote-based, not a self-serve plan).

### 5. Add-on banner (keep, update price)
`addon` namespace stays. Change price **+950 CHF → +750 CHF** (one-time,
`einmalig`). Keep name `Logo + Markenrichtlinien` and the description.

### 6. "Welches Abo passt zu Ihnen?" guide (optional)
Keep the existing guide block (already updated to four plans:
`guideStarter/guideBusiness/guideWebshop/guideSoftware`), or drop it to stay
closer to Belgalink. Recommended: keep it, it helps conversion. Keep the VAT note
`common.vatNote` ("exkl. 8,1% MWST").

---

## Checkout redesign (`/checkout`, `SubscribeForm.tsx`)

Goal: a clear, user-friendly, mobile-first flow that reflects the new offering.
Keep the request-mode behaviour (POST `/api/checkout` → enquiry email →
confirmation state); only improve the UI/UX and the plan set.

Requirements:
- **Plan selector** showing the three self-serve subscription plans (Starter 40,
  Business 80, Webshop 55) as large, tappable cards/radios — each with name,
  monthly price `/ Monat`, a one-line "what's included", and an all-in note
  (Hosting, Wartung und SEO inklusive). Preselect from `?plan=` (`starter`,
  `business`, `webshop`); default `business`.
- **Software & Applications** and **Google Ads** are quote-based: do not list them
  as checkout plans. Keep the existing side panel that routes such requests to
  `/kontakt` (update its copy away from the word "Premium").
- **Add-on** "Logo + Markenrichtlinien" (+750 CHF, one-time) as a clear toggle
  with its price.
- **Live order summary**: selected plan + price `/ Monat`, plus add-on once if
  ticked; VAT note underneath.
- **Minimal fields**: Vorname, Nachname, Email (required); Firma, Telefon
  (optional); consent with links to Datenschutz and AGB (required). Keep honeypot.
- **States**: idle / loading / success (confirmation) / error (preserves entered
  data). Accessible labels, visible focus rings, large tap targets, responsive
  two-column → single-column.
- Keep brand primitives; no new colours; no browser storage.

---

## Wire the `webshop` subscribe plan (currently missing)

- `src/lib/stripe/plans.ts`: `PlanId = 'starter' | 'business' | 'webshop'`; add to
  `PLAN_IDS`; `PLAN_AMOUNT_CHF = { starter: 40, business: 80, webshop: 55 }`;
  `planPriceId` → `env.stripePriceWebshop` for webshop; update header comment;
  `ADDON_AMOUNT_CHF = 750`.
- `src/lib/validation.ts`: checkout `plan` enum → `['starter','business','webshop']`.
- `src/app/api/checkout/route.ts`: extend `PLAN_LABEL` with `webshop: 'Webshop'`.
- `src/app/[locale]/checkout/page.tsx`: accept `webshop` in `initialPlan`.
- `src/components/SubscribeForm.tsx`: add `webshop` to `PLANS` and `PLAN_TKEY`
  (`webshop → 'w'`); adjust the picker grid for three options.
- `src/lib/env.ts`: add `stripePriceWebshop` getter (`STRIPE_PRICE_WEBSHOP`); fix
  the Starter/Business price comments (40 / 80); addon comment → 750.

---

## Sitewide consistency

- **Entry price 49 → 40** (Starter is now 40): `meta.title` + `meta.description`
  and `hero.h1` in all three message files; `src/app/manifest.ts`; and the six
  landing files in `src/content/landing/*.ts` (each has `Ab 49 CHF` / `Dès 49 CHF`
  / `From 49 CHF` rows).
- **Add-on 950 → 750** everywhere: `addon.price` (de/fr/en), the FAQ item that
  mentions 950 (de/fr/en), `ADDON_AMOUNT_CHF`, the `env.ts` comment,
  `STRIPE_SETUP.md`, `.env.example`, and the `CLAUDE.md` business facts.
- Update `CLAUDE.md` business facts + `STRIPE_SETUP.md` billing table to the new
  plans/amounts (Starter 40, Business 80, Webshop 55, Software & Applications
  quote; add-on 750; Google Ads 150/mo quote) and add `STRIPE_PRICE_WEBSHOP` to
  `.env.example`.

---

## Files to touch (checklist)

- `src/messages/{de,fr,en}.json` — `price.*`, `plan.*`, `addon.*`, **new**
  `googleAds.*`, `checkout.*`; meta + hero entry price. Keep parity.
- `src/app/[locale]/website-abos/page.tsx` — header, 4-card grid, Google Ads
  block, add-on banner, JSON-LD, guide.
- `src/app/[locale]/checkout/page.tsx` + `src/components/SubscribeForm.tsx` —
  checkout UX + plan set.
- `src/lib/stripe/plans.ts`, `src/lib/validation.ts`,
  `src/app/api/checkout/route.ts`, `src/lib/env.ts` — webshop plan + amounts + 750.
- `src/app/manifest.ts`, `src/content/landing/*.ts` — entry price 40.
- `.env.example`, `STRIPE_SETUP.md`, `CLAUDE.md` — docs.

---

## Acceptance criteria

1. `npx tsc --noEmit` is clean.
2. de/fr/en message files have identical key sets (parity check passes).
3. Pricing page renders four cards (Business featured) in Belgalink's layout with
   amai's **red** brand, plus the Google Ads block and the 750 CHF add-on banner.
4. No dashes / no comma-before-conjunction anywhere in the new copy.
5. Starter/Business/Webshop CTAs reach checkout and select the right plan;
   Software & Applications and Google Ads reach `/kontakt`.
6. Checkout shows the three plans, add-on toggle, live summary, and a clear
   success state; works in request mode without Stripe keys.
7. No "49 CHF" or "950 CHF" left anywhere user-facing.
