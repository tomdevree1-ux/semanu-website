# Handoff: amai.ch — Website-Abo platform (front-end → production)

## Overview
`amai.ch` is a multilingual (DE primary, FR, EN) marketing website for a Swiss service that builds & maintains modern websites for SMEs via monthly subscriptions. This bundle contains the **finished high-fidelity front-end** (the "Signal-Rot" red brand direction) plus the brand guide. The job for Claude Code: **recreate these HTML designs in a real, maintainable codebase** and build the back-end behind them.

## About the design files
The files in this bundle are **design references authored in plain HTML/CSS/JS** — they show the intended look, copy, i18n behavior and interactions. They are **not meant to be shipped as-is**. Recreate them in a proper framework (recommended: **Astro** or **Next.js** — both give first-class i18n, SEO, server routes for forms, and easy component reuse). If you adopt an existing codebase instead, follow its conventions.

## Fidelity
**High-fidelity.** Final colours, typography, spacing, copy (3 languages), animations and interactions are all decided. Recreate pixel-faithfully. Use the exact tokens below.

---

## Tech snapshot of the prototype (what to replace)
- **i18n**: German is authored directly in the HTML; `i18n.js` captures each `[data-i18n]` element's German innerHTML on load, and swaps to FR/EN from a dictionary. Language persists in `localStorage('amai_lang')`. → In production, replace with the framework's i18n (e.g. Astro i18n / next-intl), keeping DE as default locale and the same keys.
- **Styling**: one stylesheet `styles-red.css` using CSS custom properties (design tokens below). → Port to your styling system but keep the tokens.
- **Interactions**: `app.js` (vanilla) handles: cookie banner, project carousel auto-slide, FAQ accordion, the "Jetzt starten" modal + fly-away, and **custom localized form validation** (no native browser bubbles).

---

## Design tokens (Signal-Rot brand)
```
--red / primary        #E5392B   (dominant background, primary brand colour)
--red-deep             #C82A1E
--ink (bordeaux)       #4A1419   (dark sections, body text on light)
--ink-soft             #7A3A33   (muted body text on light)
--paper                #FBF1EF   (light/cream sections & cards)
--paper-2              #F6E4E1
--spark / accent       #F7B500   (GOLD — the "!", eyebrows on dark, prices, accents)
--ok (success)         #1F8A4C
line on dark           rgba(247,243,231,.16)
line on light          rgba(74,20,25,.14)
radius                 16px (cards) / 24px (large) / 100px (pills & buttons)
```
**Contrast rule:** on red/bordeaux backgrounds text is white/paper with GOLD accents; on paper backgrounds text is bordeaux with RED eyebrows. Required-field asterisks and inline form errors are RED (`--red`).

### Typography
- Display / headings: **Archivo Black** (and Archivo 800/900). Tight tracking (`-0.02em`).
- Body / UI: **Archivo** 400–800.
- Labels / mono / eyebrows / prices-unit: **Space Mono** 400/700, uppercase, letter-spacing ~0.1–0.18em.
- Google Fonts: `Archivo`, `Archivo Black`, `Space Mono`.
- Brand wordmark in running text: **amai!** rendered bold with the "!" in gold (`<strong>amai<span style="color:#F7B500">!</span></strong>`). The literal domain `amai.ch` stays as-is in URLs, e-mail, SEO `<title>`/meta and legal pages.

### Spacing
Sections ~96px vertical padding (desktop), 68px mobile. Container max-width 1200px, 32px side padding.

---

## Screens / Views

### Single-page site (`amai.ch Website - Signal-Rot.html`), in order:
1. **Sticky header** — red bg, **gold bottom border**. Left: `amai!` wordmark (gold "!", spins 360° on hover). Nav: Home, Website-Abos, So funktioniert's, Portfolio, FAQ. Right: DE/FR/EN segmented switch + a primary CTA button **"Jetzt starten"** (opens the modal, NOT a scroll). Collapses to a hamburger ≤980px.
2. **Hero** — red. Eyebrow (gold), big headline `Moderne Websites für Schweizer Unternehmen, ab 49 CHF pro Monat.`, subtext (starts with bold `amai!`), two buttons (primary "Jetzt starten" → modal; ghost "Website-Abos ansehen" → #abos), trust line. Right: a CSS browser-mockup with floating badges.
3. **Problem** — bordeaux. Heading + intro, then a 4×2 grid of 8 pain-point cards, each with a **distinct gold line-icon** (clock, phone, magnifier, shield, envelope, wrench, gear, price-tag) + label. CTA "Jetzt starten".
4. **Solution** — red. Heading (`Mit amai! …`), intro, a 4-row checklist, and a bordeaux callout for custom/Premium work.
5. **Website-Abos / Pricing** — paper. 3 plans: **Starter 49 CHF/month**, **Business 99 CHF/month** (featured, bordeaux card, "MOST CHOSEN" badge), **Premium — Price on request**. Each: mono category, price (gold on featured), description, ✓ feature list, CTA → modal. Below: a bordeaux **"Neu!" add-on banner** — *Logo + Markenrichtlinien · +950 CHF einmalig*.
6. **Free-analysis section was removed** — do not re-add. All CTAs route to the contact modal.
7. **So funktioniert's** — red. 4 numbered steps + paragraph.
8. **Portfolio** — bordeaux. An **auto-sliding carousel** of project cards (pause on hover). Cards = a browser frame (address bar shown **blank** — no URLs) with a screenshot, then a meta row: tag + title on top (with a "Zur Website" button top-right where applicable) and full-width description below. Current cards: SEMANU (live, link semanu.be), Maison Rosé (In Entwicklung, no link), amai.ch (live, link www.amai.ch), 3D-Konfigurator (live, link plaat-configurator.semanu.be/…), Holzwerk (CSS demo, "Beispiel"). Live tag = green pulsing dot; In-Entwicklung = amber pulsing dot.
9. **FAQ** — paper. Accordion (one open at a time), 10 items.
10. **Contact** — bordeaux. Left: heading + email/city(Bern)/response-time list. Right: white card with the general contact form.
11. **Final CTA** — spark/bordeaux band, two buttons.
12. **Footer** — bordeaux. Brand, tagline, contact, Navigation column, **Legal** column (links to Impressum.html, Datenschutz.html, AGB.html, AGB.html#abo, Datenschutz.html#cookies), Kontakt column, language switch, SEO disclaimer, copyright (`amai!`).

### Other pages
- **Impressum.html, Datenschutz.html, AGB.html** — German legal templates in the brand style. Placeholders are wrapped in `<span class="ph">…</span>` (gold-dashed) — **the client must fill these and have them legally reviewed.**
- **beauty-salon.html** — a standalone demo site (Maison Rosé) used to produce the portfolio screenshot. Reference only.
- **AMAI Huisstijl.html** — the brand guide (colours, logo, type, applications).

---

## Interactions & behavior
- **Language switch (DE/FR/EN)**: swaps all `[data-i18n]` text, `<html lang>`, `<title>` + meta description (per-locale `META`), syncs the form language `<select>` (only DE/EN offered; FR falls back to DE). Persists.
- **"Jetzt starten" modal**: opened by every primary CTA (`a[data-i18n="nav.cta"|"hero.cta1"|"prob.cta"|"trust.cta"|"cta.b1"]`). Backdrop blur + spring scale-in. Compact form (Vorname*, Nachname*, E-Mail*, optional Nachricht, consent*). On valid submit: success state → card **"flies away"** upward (~0.8s) → closes. Closable via ×, backdrop click, Esc. Body scroll-locked while open.
- **Carousel**: advances one card every 3.6s; recycles first→last on its own `transform` `transitionend` only (guard `e.target===track && e.propertyName==='transform'`); pauses on hover. Edge-mask gradient on sides.
- **FAQ accordion**, **cookie banner** (slides up after 0.8s if no choice; "Alle akzeptieren"/"Nur notwendige" stored in `localStorage('amai_cc')`; gold-bordered bordeaux bar).
- **Custom form validation** (both forms): `novalidate` + JS. Required + email-format checks; on error adds `.has-error` (red border) and an inline `.field-err` (red text + round "!" icon) under the field; messages localized via a small `{de,fr,en}` map keyed on `document.documentElement.lang`. No native browser bubbles.
- **Reveal-on-scroll** via IntersectionObserver; respect `prefers-reduced-motion` (entrance animations gated, fly-away/spin disabled).

## Forms → back-end (to build)
Two forms, same fields/handling:
- **Start modal** `#startForm`: `firstname, lastname, email, message, consent`.
- **Contact** `#contactForm`: `firstname, lastname, company, phone, email, message, lang, consent`.
Back-end needs: validate server-side, **store submissions** (DB) and **e-mail a notification** to the admin, return success for the fly-away/success states. Add spam protection (honeypot/Turnstile). GDPR/Swiss-DSG consent is required (checkbox already present).

## Back-end scope (the real reason for Claude Code)
- Forms → DB + transactional e-mail (e.g. Resend/Postmark) + admin notification.
- **Premium tier**: customer portal / login area, internal dashboards, document area, **payment portal** (e.g. Stripe), custom workflows — these are sold on the site and must be buildable.
- Proper i18n routing, per-locale SEO metadata, `sitemap.xml`, `robots.txt`, favicon + OG/Twitter images, a styled 404.
- Real hosting; fill the legal pages with real company data.

## State management
- `locale` (de|fr|en, persisted) → drives all copy + meta.
- `cookieConsent` (all|necessary, persisted).
- Modal open/closing/submitting/flown state; carousel index; FAQ open index; per-form field-error state.

## Assets (in this bundle)
- `semanu.jpg`, `salon.jpg`, `amai-own.jpg`, `configurator.png` — portfolio screenshots.
- `skincare.jpg` — hero photo for the beauty-salon demo.
- Pain-point & UI icons are inline SVG (no files).
- Fonts via Google Fonts (Archivo / Archivo Black / Space Mono).

## Files in this bundle
- `amai.ch Website - Signal-Rot.html` — the site (DE authored inline).
- `styles-red.css` — all styles + tokens.
- `i18n.js` — FR/EN dictionaries + `META` + the swap engine.
- `app.js` — cookie banner, carousel, FAQ, modal, validation.
- `Impressum.html`, `Datenschutz.html`, `AGB.html` — legal templates.
- `beauty-salon.html` — demo site (reference).
- `AMAI Huisstijl.html` — brand guide.
- image assets listed above.

> Note: the prototype's `i18n.js` mutates the DOM at runtime. In a framework, prefer rendering localized strings server-side from the same keys rather than porting the runtime swap.
