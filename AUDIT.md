# amai.ch — Audit (SEO/GEO · Autoriteit · Security)

Code- en configuratie-audit van de marketingsite + back end. Gedaan tegen de
huidige repo (niet de live site). Per punt: **prioriteit**, wat er is, en de fix.
Legenda: 🔴 kritiek voor launch · 🟠 belangrijk · 🟢 nice to have.

---

## 1. SEO + GEO

### Wat al goed zit
- `metadataBase`, per-pagina **canonical** en **hreflang** (`de/fr/en` + `x-default`) staan correct (`layout.tsx` + per-page `generateMetadata`).
- `sitemap.ts` (alle locales × pagina's + blogposts) en `robots.ts` (blokkeert `/api/` en `/*/styleguide`) zijn aanwezig.
- Eén `<h1>` per pagina, schone i18n-URL's, blog met auteur + datum.
- `/checkout`, `/checkout/success` en `/styleguide` staan op `noindex`. Correct.

### Te verbeteren
- 🔴 **Geen favicon / app-icons / web manifest.** `public/` bevat geen `favicon.ico`, `icon.png`, `apple-icon.png` of `manifest`. Voeg `src/app/icon.png` + `apple-icon.png` + `favicon.ico` toe (Next genereert de tags automatisch).
- 🔴 **Geen standaard OG/Twitter-afbeelding.** `layout.tsx` zet `openGraph` zonder `images`, en nergens een `twitter` card. Alleen blogposts hebben een OG-image. Voeg een merk-OG-image toe (1200×630) als site-brede default + `twitter: { card: 'summary_large_image' }`. Zonder dit zien deelbare links en AI-previews er kaal uit.
- 🟠 **Structured data ontbreekt grotendeels** (alleen `Organization` op `/kontakt`). Dit is de grootste GEO- en rich-results-winst:
  - `Organization` + `WebSite` site-breed (in `layout.tsx`) met `logo`, `url`, en **`sameAs`** (LinkedIn/Instagram).
  - `BlogPosting` op blogposts (`author`, `datePublished`, `image`, `publisher`).
  - `FAQPage` op `/faq` (je hebt al 10 Q&A, ideaal voor rich results + AI-citaten).
  - `Service` of `Product` + `Offer` op `/website-abos` (Starter 49, Business 99).
  - `BreadcrumbList` op subpagina's.
- 🟠 **Geen `llms.txt`.** Voor GEO (zichtbaar/citeerbaar in ChatGPT, Perplexity, Google AI Overviews): voeg `public/llms.txt` toe met een korte, feitelijke samenvatting van wie amai! is, de abo's/prijzen, en links naar de kernpagina's.
- 🟢 **Sitemap zonder per-entry hreflang-alternates.** De `<link rel="alternate" hreflang>` uit de metadata dekt dit al, maar `entry.alternates.languages` in `sitemap.ts` maakt het robuuster.
- 🟢 **Blog = 1 post.** SEO/GEO-autoriteit komt van diepte en regelmaat: plan meer artikelen (cluster rond "website abo", "KMU website", "Webdesign Schweiz").
- 🟢 **Blog-cover + auteursfoto via `<img>`** i.p.v. `next/image` (niet geoptimaliseerd). Klein performance-puntje.

---

## 2. Autoriteit / E-E-A-T (overkomen als website-bouwende autoriteit)

De site oogt verzorgd, maar mist de vertrouwens- en bewijssignalen die een
dienstverlener geloofwaardig maken. Wat ontbreekt:

- 🟠 **Geen "Über uns" / About-pagina.** Wie zit achter amai!, sinds wanneer, missie, waarom Bern/Zwitserland. Voor een servicebedrijf is dit hét autoriteitsanker.
- 🟠 **Geen oprichter/team-bio.** Tom als gezicht (foto heb je al), met ervaring/credentials. Versterkt E-E-A-T én GEO (entiteit).
- 🟠 **Geen social proof.** Geen testimonials, reviews, sterren of "trusted by"-logo's. Eén echte klantquote per portfolio-item doet al veel.
- 🟠 **Portfolio = 4 kaartjes zonder case-study.** Maak van 1-2 projecten een mini-case (uitgangspunt → aanpak → resultaat). Dat is bewijs van kunde.
- 🟠 **Impressum is uit footer + sitemap gehaald.** Voor een Zwitsers bedrijf is een vindbaar Impressum een verwacht vertrouwenssignaal (de pagina bestaat nog op `/impressum`). Overweeg 'm terug te linken, eventueel als "Legal notice".
- 🟢 **Geen social links (`sameAs`).** LinkedIn/Instagram in de footer + in de Organization-schema.
- 🟢 **Geen telefoonnummer / fysiek adres op de contactpagina** (enkel email + stad). Een adres + (optioneel) telefoon verhoogt vertrouwen.
- 🟢 **USP/garantie niet uitgespeeld.** "Persönlich statt anonym", Swiss hosting, DSG/GDPR, reactietijd binnen 1 werkdag: maak er expliciete trust-badges van.

---

## 3. Security

### Wat goed zit
- ✅ **Stripe-webhook** verifieert de handtekening met de **raw body** (`req.text()` + `constructEvent`) en `STRIPE_WEBHOOK_SECRET`. Correct geïmplementeerd.
- ✅ **Bedragen server-side**: `/api/checkout` gebruikt vaste `PLAN_AMOUNT_CHF` + env-Price-id's, nooit prijzen vanuit de client. Geen price-tampering.
- ✅ **RLS**: `leads` volledig dicht; `orders` dicht; `customers`/`subscriptions` met owner-`SELECT` (`user_id = auth.uid()`). Writes lopen via de service-role. Goed opgezet.
- ✅ **Secrets** server-only via lazy getters in `env.ts` (service-role + Stripe secret). Alleen publishable key / site-URL / GA-id zijn `NEXT_PUBLIC`.
- ✅ Overal **zod-validatie** op de API-input.

### Gaten / aanbevelingen
- 🔴 **Geen security headers.** `next.config.mjs` heeft geen `headers()`. Voeg toe (of via Cloudflare): `Content-Security-Policy`, `Strict-Transport-Security` (HSTS), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, en `frame-ancestors 'none'` (clickjacking). CSP moet Stripe (`js.stripe.com`, `api.stripe.com`), GA (`googletagmanager.com`, `google-analytics.com`) en Google Fonts toelaten.
- 🔴 **Spam/abuse op publieke endpoints.** `/api/leads` én `/api/checkout` schrijven via de service-role, maar **Cloudflare Turnstile staat nog als TODO** en er is **geen rate-limiting**. Een bot kan de `leads`/`orders`-tabel vullen en (kosteloos voor de aanvaller) Stripe-sessies aanmaken. Wire Turnstile + voeg per-IP rate-limiting toe (Cloudflare rules of een edge-middleware) vóór launch. De honeypot alleen is te zwak.
- 🟠 **Redirect-URL uit de `Origin`-header.** `/api/checkout` bouwt `success_url`/`cancel_url` uit `req.headers.get('origin')`. Voor echte gebruikers zet de browser die header, maar gebruik beter de vertrouwde `env.siteUrl` om elke manipulatie uit te sluiten.
- 🟠 **next-intl open-redirect-advisory** (GHSA-8f24-v5vv-gm5j, moderate; `npm audit` meldt 3 moderate). Update `next-intl` naar de gepatchte versie.
- 🟢 **Admin-notificatiemail** interpoleert `to`/`plan` ongeëscapet in HTML (alleen `firstname` wordt geëscaped). Lage kans (Stripe valideert het emailadres), maar escape álle waarden.
- 🟢 **`dangerouslySetInnerHTML`** rendert `marked()`-output van markdown in de repo (legal + blog). Vertrouwde content, dus laag risico. Zou je ooit door gebruikers ingestuurde markdown renderen, sanitize dan (bijv. `rehype-sanitize`/DOMPurify).
- 🟢 **Portal-koppeling**: de webhook maakt `customers` aan zónder `user_id`. Bij het bouwen van Supabase Auth (Phase 4) moet je `customers.user_id` linken aan de ingelogde gebruiker, anders matcht de owner-`SELECT`-policy niet.

---

## Prioriteitenlijst (kort)

**Vóór launch (🔴)**
1. Turnstile + rate-limiting op `/api/leads` en `/api/checkout`.
2. Security headers (CSP/HSTS/nosniff/Referrer-Policy/frame-ancestors).
3. Favicon/app-icons + standaard OG/Twitter-image.

**Snel daarna (🟠)**
4. Structured data: `Organization`+`WebSite` (met `sameAs`), `FAQPage`, `BlogPosting`, `Service/Offer`.
5. `llms.txt`.
6. About/Über-uns + oprichter-bio, en minstens 1-2 testimonials of mini-cases.
7. `success_url`/`cancel_url` op `env.siteUrl`; update next-intl; escape admin-mail.

**Later (🟢)**
8. Social links + Impressum opnieuw linken, meer blogposts, `next/image` voor blog, sitemap-hreflang.
