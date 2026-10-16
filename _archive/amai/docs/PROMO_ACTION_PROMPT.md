# Prompt — Temporary promo: Logo + Markenrichtlinien (750 → 450) + animated landing pop-up + VAT-note consistency

> Paste this to the build agent. It is self-contained. Work in the amai.ch
> codebase (Next.js App Router, next-intl DE/FR/EN, Tailwind v4, brand = red).

---

## Objective

Run a **temporary, one-switch-toggleable** promotion on the **Logo + Markenrichtlinien**
add-on (one-time): **750 → 450 CHF (excl. VAT), save 300**. Show a promo **stamp**
everywhere the add-on appears (pricing page banner + checkout checkbox), use the
promo price in the checkout summary + enquiry email, add a **creative animated
promo pop-up** on the homepage, and make sure **"exkl. 8,1% MWST"** is shown
consistently next to every price.

Everything must turn on/off (and fully revert to 750, no stamp, no pop-up) by
flipping **one flag**.

---

## Hard constraints

- Keep the **red brand** + existing tokens/primitives (`bg-red`, `bg-ink`, `spark`,
  `.btn`, `rounded-pill`, `font-display`, `font-mono`, `--shadow-pop`).
- **Copy style** (every language): no em/en dashes, no hyphens in compounds, no
  comma before a coordinating conjunction (`und/oder` · `et/ou` · `and/or`).
- **i18n parity**: every new string in `src/messages/{de,fr,en}.json`, all three in
  parity. DE primary.
- **Verify**: `npx tsc --noEmit` clean + JSON key-parity check.
- **Single source of truth + revert**: when the promo flag is off, the site is
  byte-for-byte back to the 750 add-on with no stamp and no pop-up.
- **Accessibility + motion**: the pop-up is a proper dialog (focus trap, Esc, labelled)
  and **degrades to a plain fade under `prefers-reduced-motion`**.
- `localStorage` is fine here (real site, not an artifact) for "show once".

---

## 1. Promo config — single source of truth

Create `src/lib/promo.ts`:

```ts
export const PROMO = {
  active: true,                 // master switch — set false to fully revert
  id: 'logo-450-2026q2',        // bump when you start a new promo (re-shows the pop-up)
  addonRegularChf: 750,
  addonPromoChf: 450,
  // Optional end date for display only (ISO). null = no date shown.
  endsAt: null as string | null,
};
export const addonAmountChf = () => (PROMO.active ? PROMO.addonPromoChf : PROMO.addonRegularChf);
export const addonSaveChf = () => PROMO.addonRegularChf - PROMO.addonPromoChf;
```

Wire the **effective** add-on amount through the billing layer so checkout records
+ emails use 450 while active:

- `src/lib/stripe/plans.ts`: replace the hard-coded `ADDON_AMOUNT_CHF = 750` usage so
  the order amount uses `addonAmountChf()` (keep `ADDON_REGULAR_CHF = 750` for the
  struck-through display). Keep Webshop/Google-Ads/plan amounts unchanged.
- `src/app/api/checkout/route.ts`: the Logo add-on line in the enquiry email + the
  stored `amount_addon_chf` use `addonAmountChf()` (so it reads 450 during the promo).

---

## 2. Promo stamp + price everywhere the Logo add-on appears

A small **promo stamp** = a `rounded-pill` (or slightly rotated "stamp") in `bg-spark`
with `text-ink`, label from messages (`promo.stamp`, e.g. **Aktion**). Show the
**promo price** with the regular price struck through.

- **Pricing page add-on banner** (`src/app/[locale]/website-abos/page.tsx`): when
  `PROMO.active`, render the stamp next to the "Neu!" badge (or replace it), show
  `+450 CHF` with `750 CHF` struck through (`line-through opacity-60`), keep
  `einmalig`, and add the **VAT note** (see §4). When off → `+750 CHF`, no stamp.
- **Checkout add-on checkbox** (`src/components/SubscribeForm.tsx`, the Logo
  `AddonRow`): same treatment — stamp + `+450 CHF` with `750 CHF` struck. The
  live summary + email already follow `addonAmountChf()`.
- **FAQ** (messages): the answer mentioning the logo at 750 CHF becomes promo-aware
  (e.g. show 450 with a short "aktuell im Angebot" note while active; 750 when off).
  Simplest: keep one FAQ string that reads naturally for the current price, or gate
  two variants on `PROMO.active`.

New message keys (DE/FR/EN), e.g.:
- `promo.stamp` → DE "Aktion" · EN "Offer" · FR "Promo"
- `promo.was` → DE "statt {price}" · EN "was {price}" · FR "au lieu de {price}" (for the struck price label, if you prefer text over a strike-through)
- `promo.save` → DE "Sie sparen {amount} CHF" · EN "You save CHF {amount}" · FR "Vous économisez {amount} CHF"

---

## 3. Landing-page promo pop-up (creative, animated)

Create `src/components/PromoModal.tsx` (client component) and mount it on the
homepage `src/app/[locale]/page.tsx`. Render **only when `PROMO.active`**.

Behaviour:
- Appears ~1.2s after first load. Dismiss via an X button, backdrop click, or Esc.
- "Show once": remember dismissal in `localStorage` under a key that includes
  `PROMO.id` (so starting a new promo re-shows it).
- Content (i18n `promo.*`): eyebrow **Aktion**, a punchy headline (DE "Logo +
  Markenrichtlinien zum Aktionspreis"), the price **450 CHF** with **750 CHF**
  struck through, "Sie sparen 300 CHF", a CTA **Aktion sichern** → `/checkout?addon=logo`
  (see §5), the **VAT note**, and the optional end date if `PROMO.endsAt` is set.
- Use a dialog: `role="dialog" aria-modal="true"`, focus the close button on open,
  trap focus, restore focus on close.

Animation (CSS keyframes only, no libraries — be creative but on-brand):
- Backdrop fades in (ink at ~0.5 alpha), ~200ms.
- The card does a **"stamp slam"**: from `scale(1.12) rotate(-3deg)` + opacity 0 to
  `scale(1) rotate(0)` + opacity 1 with an overshoot easing
  (`cubic-bezier(.18,.89,.32,1.28)`), ~420ms.
- A circular **discount stamp** (gold `bg-spark`, ink text, e.g. "-300 CHF" or "450")
  pops in ~250ms later, rotating from `rotate(-22deg) scale(0)` to
  `rotate(-9deg) scale(1)` with a small bounce — like an ink stamp pressed on.
- Optional: a short burst of a few confetti dots in `spark` + `red` (CSS only, ~600ms),
  kept subtle.
- **`@media (prefers-reduced-motion: reduce)`**: skip slam, stamp-rotate and confetti
  → just an opacity fade for backdrop + card; stamp shown statically.

Keep it self-contained (one component, inline styles/Tailwind + a small `<style>` for
the keyframes is fine in this client component).

---

## 4. VAT note consistency ("exkl. 8,1% MWST")

`common.vatNote` ("exkl. 8,1% MWST" · "hors TVA 8,1%" · "excl. 8.1% VAT") must sit
**next to every standalone price**, small + `text-ink-soft`:
- Plan cards block — already present (keep).
- **Google Ads block** — add it under the "ab 200 CHF / Monat" price (currently missing).
- **Logo add-on banner** — add it near the price.
- **Promo pop-up** — add it under the promo price.
- Checkout form + homepage hero — already present (keep).

Place it once per price area, not on every line — "logically everywhere a price is shown".

---

## Files to touch

- **New**: `src/lib/promo.ts`, `src/components/PromoModal.tsx`.
- `src/lib/stripe/plans.ts` — effective add-on amount via `addonAmountChf()`.
- `src/app/api/checkout/route.ts` — Logo line + `amount_addon_chf` use the promo amount.
- `src/components/SubscribeForm.tsx` — Logo checkbox: stamp + 450/750 struck.
- `src/app/[locale]/website-abos/page.tsx` — add-on banner stamp + struck price + VAT
  note on Google Ads block and add-on banner.
- `src/app/[locale]/page.tsx` — mount `<PromoModal />`.
- `src/app/[locale]/checkout/page.tsx` — accept `?addon=logo` so the pop-up CTA
  pre-ticks the Logo add-on (extend the existing `?addon=` parsing).
- `src/messages/{de,fr,en}.json` — `promo.*` strings + reuse `common.vatNote`.

---

## Acceptance criteria

1. `npx tsc --noEmit` clean; de/fr/en parity passes; no dashes / no comma-before-conjunction.
2. With `PROMO.active = true`: Logo shows **450 CHF** (750 struck) on the pricing
   banner, the checkout checkbox, the summary and the enquiry email; a promo **stamp**
   is visible in both places.
3. Homepage shows the animated pop-up once per session; dismiss + Esc + backdrop work;
   reduced-motion shows a plain fade; pop-up is i18n DE/FR/EN.
4. "exkl. 8,1% MWST" appears next to the Google Ads price and the add-on price (and
   stays under the cards, in checkout, and in the hero).
5. With `PROMO.active = false`: no stamp, no pop-up, 450 nowhere — fully back to 750.
