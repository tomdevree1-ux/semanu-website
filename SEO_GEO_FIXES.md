# amai.ch — SEO / GEO fixes applied + remaining handoff

Date: 2026-06-13 · Companion to `SEO_GEO_AUDIT.md`. This records what was fixed in
code, what still needs you (accounts / settings / real content), and how to verify
the live site for the items only a real request can confirm.

---

## 1. Fixed in code

| Audit | Fix | Files |
|---|---|---|
| **H1** No 404 page | Branded, localised 404 in `SiteShell` with links to home / services / contact, real 404 status. | `src/app/[locale]/not-found.tsx` (new), `notFound` keys in `messages/{de,fr,en}.json` |
| **H2** Duplicate Websites hero CTA | Secondary CTA differentiated: primary stays "View website plans" → `/website-abos`; secondary is now "Request advice / Beratung anfragen / Demander conseil" → `/kontakt?interest=websites`. | `src/content/serviceDetail.ts` (3 locales) |
| **H3** All Websites CTAs went to pricing | The page now has a real contact path (hero **and** final secondary → `/kontakt?interest=websites`). The contact form already lists "Websites" as an interest, so it preselects. | `src/content/serviceDetail.ts` |
| **M1** Blog/checkout dropped hreflang | New `localizedAlternates()` helper always merges canonical + de/fr/en + x-default; blog posts emit hreflang only for locales that actually exist. Checkout stays `noindex` (hreflang not needed). | `src/lib/seo/alternates.ts` (new), `src/app/[locale]/blog/[slug]/page.tsx` |
| **M2** `\|` separator + stray dashes | Services overview `metaTitle` `\| amai` → `· amai` (en/de/fr). Also fixed the German homepage `<title>` which had **both** a `\|` and an em dash. | `src/content/services.ts`, `src/app/[locale]/page.tsx` |
| **M3** Promo modal interstitial on mobile | Mobile no longer auto-opens over the first impression: it waits for a real scroll (~60% of the first screen) and slides up as a bottom sheet. Desktop unchanged. | `src/components/PromoModal.tsx` |
| **M4** Contact email (code side) | Footer + contact page already used a plain `mailto:`; the contact `ContactPoint` (with the email) is now attached to the single org node by `@id`. **One step left is a Cloudflare setting — see §2.** | `src/app/[locale]/kontakt/page.tsx` |
| **M5** No related-service links | `RELATED_SERVICES` map + a `RelatedServices` block render 2 neighbours on every service page. | `src/content/serviceDetail.ts`, `src/components/services/blocks.tsx` + the three `Flow*.tsx` |
| **M6** Blog cover CLS + empty alt | Explicit `width`/`height` (1200×520) reserve the box (no layout shift) and a real `alt`. Kept as `<img>` on purpose: the covers are **SVG**, which `next/image` does not optimise. | `src/app/[locale]/blog/[slug]/page.tsx` |
| **A11y** Skip link + focus | "Skip to content" as the first focusable element; global `:focus-visible` ring (navy on light, mint inside dark bands). | `src/components/SiteShell.tsx`, `src/app/globals.css`, `common.skipToContent` keys |
| **L1 / L2 / §14** Icons + schema | Added `apple-icon.png` (180), `favicon.ico`, `icon-192/512.png` (manifest updated); org is now a single `@id` node (`/#organization`); logo SVG → **PNG** (`icon-512.png`); services / blog / contact reference the org by `@id` instead of duplicating it. | `src/app/{apple-icon.png,favicon.ico,manifest.ts}`, `public/icon-{192,512}.png`, `src/app/[locale]/layout.tsx` + the pages above |
| **§11** Sitemap hreflang | `alternates.languages` added to every sitemap entry (per-post for blog). | `src/app/sitemap.ts` |
| **§8 / §17** No "why amai" / no SEO definition | New crawlable "Why amai" block on `/services` with four differentiators, including a one-line plain-language SEO definition. | `whyAmai` keys (de/fr/en), `src/app/[locale]/services/page.tsx` |
| **§19** "What happens next" | Already present — `contact.afterText` / `contact.time` say "We get back to you within 1 working day." No change needed. | — |

### Portal (`/app`) — kept out of search + AI
Already had `noindex, nofollow` on every page, not in the sitemap, only linked from
inside the portal. Added two missing layers: `Disallow: /app/` in `robots.txt`
(`src/app/robots.ts`) and an `X-Robots-Tag: noindex, nofollow` response header on
`/app/:path*` (`next.config.mjs`) — the header also protects the portal's PDF/JSON
responses (invoices, quotes) that an HTML `<meta>` tag can't. Takes effect on deploy.

### Verified in this session
- `npx tsc --noEmit` → **clean** (all types, imports, JSX valid).
- All three message files valid JSON and in **perfect parity** (372 key paths each).
- Every new next-intl key referenced by the UI exists and is well-formed in de/fr/en.
- Service-page data test invariant (CTA fields non-empty) still holds.

### Not run here (run on macOS before deploy)
`vitest`, `eslint` and `next build` get killed in this Linux sandbox (the native
SWC/Node issue your `CLAUDE.md` already notes). Please run, in order:

```
npm run typecheck   # already clean here
npm run lint
npm test
npm run build
```

### Note on L4 (font weights)
Left as-is on purpose. Weight 900 is referenced by the portal spinner fallback and
800 by `.h3`; browsers only download the weights actually rendered, so there is no
runtime payload to save by trimming. Not worth the regression risk.

### Note on M7 (German slugs on en/fr)
Intentional per `CLAUDE.md` ("URL slugs keep hyphens / stay stable"). Left unchanged;
only localise later with `next-intl` pathnames **plus** 301s so indexed URLs don't break.

### Deliberately deferred (real code changes, but risky to do blind)
- **L5 — nonce-based CSP.** Today `script-src` allows `'unsafe-inline'` (GA init). A
  nonce CSP needs middleware nonce injection and careful retesting of GA, Stripe and
  Turnstile inline scripts; doing it unverified could silently break analytics or
  checkout. Worth doing as its own change with a live smoke test.
- **Service → landing-page links (§16 opportunity).** I added related *service*
  cross-links (M5). Linking each service to its matching local-SEO landing page (e.g.
  Websites → `website-erstellen-lassen-schweiz`) is a further nicety; left for a pass
  where we agree the mapping.
- **Per-service proof (§18).** A stat or portfolio item on each service page needs real
  numbers/results from you — send them and I'll add them with the testimonials.

---

## 2. Needs you — accounts, settings, real content (cannot be done from code)

1. **Cloudflare email obfuscation (finishes M4).** Dashboard → your zone → **Scrape
   Shield → Email Address Obfuscation → OFF**. Today Cloudflare rewrites the footer
   `mailto:` into `[email protected]` + `/cdn-cgi/l/email-protection`, which no-JS
   readers and AI crawlers can't read. After turning it off, view-source the footer
   and confirm a plain `hello@amai.ch`.
2. **`sameAs` profile URLs (L3).** Add your real profiles to the `sameAs` array in
   `src/app/[locale]/layout.tsx` (currently only Instagram) — LinkedIn, Google
   Business Profile, any directory listings. I did not invent URLs.
3. **Google Business Profile (Bern).** Create/claim it, then add its URL to `sameAs`.
   Helps the local pack and strengthens the entity for GEO.
4. **Search Console + Bing.** Add the apex `amai.ch` property and submit
   `https://amai.ch/sitemap.xml`; add Bing Webmaster Tools for coverage.
5. **GA4 key events → conversions.** In GA, mark `contact_request_submitted`,
   `order_request_submitted`, `package_selected` as key events/conversions.
6. **Consent Mode v2 (L6, optional).** Decide whether you want modelled conversions
   for non-consenters.
7. **Testimonials + About E-E-A-T.** Add 2–3 testimonials (name, company, result) and
   a founder bio (Tom de Vree, Bern). Send me the copy and I'll wire it in.

---

## 3. Live verification checklist (only a live request can confirm)

I could not reach the live site from my environment, so please confirm:

- `curl -I https://amai.ch` → `200` + security headers present (CSP, HSTS, nosniff…).
- `curl -I https://www.amai.ch` → `301`/`308` to the apex (permanent, single hop).
- `curl -I https://amai.ch/en/this-does-not-exist` → `404` (now the branded page).
- **PageSpeed Insights** on home, `/en/services/websites`, `/en/website-abos`, a blog
  post → LCP < 2.5s, CLS < 0.1, INP < 200ms.
- **Rich Results Test** + Schema validator on home, a service page, `/website-abos`, a
  blog post, `/kontakt` → org resolves once via `@id`, no duplicate-entity warnings.
- **hreflang tester** on a blog post → de/fr/en + x-default now present.

---

## 4. One observation (your call, out of scope)

New French copy follows the existing house style in your content, which drops
elision apostrophes (`l email`, `qu un`, `n existe`). If that was unintentional rather
than deliberate, it's a site-wide content decision worth making once — not something I
changed here, to keep parity with what's already shipped.
