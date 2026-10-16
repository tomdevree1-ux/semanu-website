# amai.ch — Technical, SEO, GEO, Performance, Accessibility & Conversion Audit

Date: 2026-06-13 · Auditor: Claude · Source of truth: live site `https://amai.ch` (the `www` host 301/redirects to the apex) cross checked against the Next.js codebase.

How to read this: every issue has a severity (Critical / High / Medium / Low / Opportunity), the affected pages, why it matters, the fix, the expected impact and implementation notes with file paths. Scores are deliberately strict against a 100/100 target.

Verification limits (stated honestly): I cannot run Lighthouse, a real browser or CrUX from here, so field Core Web Vitals, exact render of `<head>` hreflang and JSON LD, and HTTP status codes for redirects and 404s could not be measured directly. Each such item says how to verify. Everything about the implementation is read from the codebase and is therefore reliable for what the server emits.

---

## 1. Executive summary

amai.ch is a Next.js (App Router) marketing site for a Swiss website subscription business, served statically through Vercel behind Cloudflare, in three languages (de default, fr, en) with `localePrefix: 'always'`. The technical foundation is already strong: full security header set, a clean robots policy, a complete sitemap across all locales, per page canonical and hreflang on almost every marketing page, a rich structured data layer (ProfessionalService + WebSite sitewide, Breadcrumb + Service + FAQPage on service pages, Offer on pricing, BlogPosting on posts), consent gated GA4, self hosted fonts with `display: swap`, and the six service pages have just been rebuilt into three distinct content rich flow layouts with plain language explainers and FAQ. This is well above the typical SME site.

It is not yet 100/100. The gaps are mostly finishing touches rather than structural failures: there is no custom 404 page (visitors and crawlers hit Next's bare default), the websites service page renders two identical hero buttons both pointing at the pricing page, blog posts and checkout drop their hreflang because they override the layout alternates with a canonical only object, the services overview title uses a `|` separator instead of the brand `·`, there is no skip to content link, the blog cover image is a raw `<img>` without dimensions, a promo modal auto opens on the mobile homepage, and the contact email is obfuscated by Cloudflare so AI crawlers cannot extract it. Performance looks good in code but must be confirmed with field data.

Fixing the items in sections 24 and 25 should move the technical foundation into the mid to high 90s.

## 2. Overall score

| Category | Score /100 |
|---|---|
| Technical SEO | 88 |
| GEO readiness | 85 |
| Performance (code level, field unverified) | 80 |
| Accessibility | 82 |
| Structured data | 86 |
| Indexability & crawlability | 92 |
| Internal linking | 85 |
| Content quality | 84 |
| Service page quality | 86 |
| Trust & conversion | 80 |
| Mobile UX | 84 |
| **Overall (weighted)** | **≈ 85** |

Interpretation: a genuinely strong, well engineered foundation that is roughly fifteen points of polish away from the 100 target. None of the open items are expensive.

## 3. Critical issues

None. There is no issue that currently blocks indexing, breaks rendering, exposes secrets or makes the site unusable. The site is crawlable, indexable, served over HTTPS with HSTS, and all key pages return content server side.

## 4. High priority issues

**H1 — No custom 404 / not found page.**
Severity: High. Affected: every unknown URL, plus `notFound()` calls (service slug miss, unknown locale). Why it matters: Next's default not found page is unstyled, unlocalised, has no header, footer or navigation, and gives neither users nor crawlers a path back into the site. It looks broken and wastes the crawl. Fix: add `src/app/[locale]/not-found.tsx` (and optionally a root `src/app/not-found.tsx` for pre locale 404s) rendering inside `SiteShell` with a localised headline, a short message and links to the homepage, services and contact. Keep it a real 404 status (App Router does this automatically for `notFound()`; a root `not-found` returns 200, so prefer the `[locale]` one for content routes). Expected impact: recovers lost sessions, removes a soft 404 risk, on brand. Notes: reuse `SiteShell`, `Link` from `@/i18n/navigation`, and `getTranslations`.

**H2 — Duplicate hero CTA on the Websites service page.**
Severity: High. Affected: `/de|fr|en/services/websites`. Why it matters: the hero shows two buttons with the same label "View website plans" both linking to `/website-abos`. It looks like a bug, wastes the primary call to action and gives the visitor no way to start a conversation from the strongest service page. Root cause: `services.ts` sets `ctaLabel: 'View website plans'` + `ctaHref: '/website-abos'` for `websites`, and `serviceDetail.ts` sets `finalSecondaryLabel: 'View website plans'` + `finalSecondaryHref: '/website-abos'` for the same service, so the flow hero renders both. Fix: differentiate the two. Recommended: keep the primary as a start/contact action and make the secondary "How it works" → `/so-funktioniert`, or point the primary at the checkout/request flow. Concretely, change the `websites` entry in `src/content/serviceDetail.ts` so `finalSecondaryLabel`/`finalSecondaryHref` differ from `service.ctaLabel`/`ctaHref` (e.g. label "How it works", href `/so-funktioniert`). Expected impact: clearer conversion path on the highest intent page. Notes: also review whether websites should offer a direct contact CTA, since every CTA on that page currently lands on pricing.

**H3 — All Websites CTAs route to pricing, with no contact option.**
Severity: High (conversion). Affected: `/services/websites`. Why it matters: hero, mid page and final CTA all resolve to `/website-abos`. A visitor who wants to talk rather than self serve has no obvious path. Fix: make at least one CTA on the page go to `/kontakt` (a contact interest value for websites can be added to the contact interest list, mirroring the other services which already use `/kontakt?interest=...`). Expected impact: captures higher intent leads who are not ready to pick a plan. Notes: `HREF.websites` in `src/content/services.ts` is `/website-abos`; consider a secondary contact CTA rather than changing the primary.

## 5. Medium priority issues

**M1 — Blog posts and checkout pages lose hreflang.**
Severity: Medium. Affected: `/[locale]/blog/[slug]`, `/[locale]/checkout`, `/[locale]/checkout/success`. Why it matters: these pages set `alternates: { canonical: ... }` in their own `generateMetadata`, which replaces (not merges with) the layout's `alternates`, so the de/fr/en/x-default hreflang from the layout is dropped. Blog posts that exist in all three languages then fail to tell Google they are translations. Fix: for blog posts, add `alternates.languages` pointing to the same slug per locale when the translation exists; for checkout, hreflang matters less because it should be noindex anyway (it currently is `index:false` for success and `index:false, follow:true` for checkout). Expected impact: correct language clustering for blog content. Notes: `src/app/[locale]/blog/[slug]/page.tsx` generateMetadata; only emit a language alternate when that locale's markdown file exists.

**M2 — Services overview title uses `|` instead of the brand `·`.**
Severity: Medium (brand + house style). Affected: `/services` in all locales. Why it matters: the house style mandates a middle dot separator in titles (`Seite · amai.ch`); the overview uses `Digital Services for Swiss SMEs | amai`, inconsistent with every service detail page (`… · amai`) and the homepage. Fix: change `metaTitle` for the services overview in `src/content/services.ts` (en/de/fr) from `| amai` to `· amai`. Audit the landing pages and any other page for stray `|`. Expected impact: consistent SERP branding. Notes: trivial string change in three places.

**M3 — Promo modal auto opens on the mobile homepage.**
Severity: Medium (mobile UX + possible intrusive interstitial + INP/CLS). Affected: homepage `/[locale]` on mobile, when `PROMO.active`. Why it matters: a modal that covers content ~1.2s after load on mobile is the pattern Google's intrusive interstitial guideline targets and it interrupts the first impression. It is homepage only, dismissible (Esc, backdrop), once per session and has a reduced motion fallback, which lowers the risk, but it is still a mobile UX cost. Fix: on mobile, either do not auto open (trigger on intent such as scroll depth or exit, or a dismissible bottom banner instead of a centred modal), or delay further and ensure it never blocks the LCP element. Expected impact: cleaner mobile first impression, safer against interstitial flags. Notes: `src/components/PromoModal.tsx`, rendered in `src/app/[locale]/page.tsx`.

**M4 — Contact email is obfuscated by Cloudflare email protection.**
Severity: Medium (GEO + accessibility of contact). Affected: footer sitewide. Why it matters: the footer email renders as `[email protected]` behind `/cdn-cgi/l/email-protection`, decoded only by JavaScript. An AI crawler or a no JS reader cannot extract `hello@amai.ch`, which weakens the GEO answer to "how do I contact amai" and the structured contact signal. Fix: expose the email in plain text or a real `mailto:` somewhere crawlable (the contact page, the ContactPoint schema), or turn off Cloudflare email obfuscation for the footer. The contact page's `ContactPoint`/`Organization` schema should carry `email: hello@amai.ch` explicitly. Expected impact: AI assistants and crawlers can state how to reach amai. Notes: verify the live `ContactPoint` JSON LD includes the email; Cloudflare Scrape Shield → Email Address Obfuscation controls this.

**M5 — No related service cross links between the six service pages.**
Severity: Medium (internal linking + GEO topical clustering). Affected: all six service pages. Why it matters: each service page links up to `/services` and out to `/website-abos` and `/kontakt`, but not sideways to related services (for example Email Marketing → Marketing Automation, Business Systems → AI Assistants). Cross links spread authority and help AI map the topical relationships. Fix: add a small "related services" block (2 to 3 links) to each flow, driven by a simple relatedness map keyed by service id. Expected impact: better internal link graph, stronger topical authority, more page depth distributed. Notes: extend the flow components in `src/components/services/`.

**M6 — Blog cover image is a raw `<img>` without dimensions.**
Severity: Medium (CLS + performance). Affected: blog post pages. Why it matters: `src/app/[locale]/blog/[slug]/page.tsx` renders `<img src={meta.cover} alt="" />` with no width/height and no `next/image`, so it is not optimised, not responsive and can shift layout as it loads. The empty `alt` also makes a potentially meaningful cover decorative. Fix: use `next/image` with explicit `width`/`height` (or `fill` + aspect ratio container) and a descriptive `alt`. Expected impact: lower CLS, smaller image payload, better a11y on posts. Notes: the only on page raw `<img>`; the other two raw `<img>` are inside transactional email HTML (correct there).

**M7 — Untranslated URL slugs across locales.**
Severity: Medium (international SEO, by design but worth noting). Affected: all non English content under `/en` and `/fr` (e.g. `/en/so-funktioniert`, `/en/website-abos`, `/en/referenzen`, `/en/kontakt`, `/fr/datenschutz`). Why it matters: English and French pages carry German slugs, which is a small relevance and UX cost and can read oddly to those audiences. Fix: this is an intentional decision (CLAUDE.md keeps slugs stable). If left as is, document it; if localising later, add localised pathnames via next-intl `pathnames` and 301 the old ones. Expected impact: marginal. Notes: low urgency; do not break existing indexed URLs without redirects.

## 6. Low priority improvements

- **L1 — Apple touch icon and favicon.ico.** No `src/app/apple-icon.png` and no `public/favicon.ico`; only `src/app/icon.svg`. Add an `apple-icon.png` (180×180) for iOS home screens and a `favicon.ico` fallback for legacy clients. The brand kit already contains both. Low.
- **L2 — Organization logo is an SVG.** Schema `logo: /icon.svg`. Google's logo guidance prefers a rasterised PNG (≥112×112). Add a PNG logo and reference it. Low.
- **L3 — Thin `sameAs`.** Organization `sameAs` lists only Instagram. Add LinkedIn, Google Business Profile, any directory profiles as they exist. Low / GEO.
- **L4 — Seven Archivo weights loaded.** `next/font` requests Archivo 400–900. Confirm all are used; drop unused weights to shrink the font payload. Low / performance.
- **L5 — CSP uses `script-src 'unsafe-inline'`.** Acceptable today (GA init), but a nonce based CSP is the hardening step. Low / security.
- **L6 — Consent Mode v2 not implemented.** GA loads only after full consent (privacy friendly) but you lose modelled conversions for non consenters. Consider Google Consent Mode v2 with `denied` defaults. Opportunity / analytics.

## 7. Technical SEO audit

Strong overall.

- Title tags: present and unique per page; homepage `amai.ch · Modern websites for Swiss companies from CHF 25/month`, service pages `<Service> for Swiss SMEs · amai`. One inconsistency: services overview uses `| amai` (see M2).
- Meta descriptions: present, unique, within length, intent aligned (verified on homepage and `/services/websites`).
- Headings: one H1 per page (verified homepage = 1, service pages = 1), logical H2/H3 nesting in the flow layouts (Problem, Engine, Use cases, Process, Outcomes, FAQ). Good.
- Canonicals: per page absolute canonical on every important page; homepage inherits `/{locale}` from the layout. Domain is the apex `amai.ch`; `metadataBase` is set, so OG and canonical URLs are absolute and consistent.
- Indexability: utility pages correctly `noindex` (`styleguide`, `admin`, `checkout/success`, `checkout`), and `styleguide` + `api` are disallowed in robots.
- URL structure: clean, lowercase, hyphenated, locale prefixed. Slugs are German across locales (M7).
- Trailing slash: Next default (no trailing slash) — confirm consistency in production (verify with `curl -I`).
- HTTPS + www handling: HTTPS enforced (HSTS preload header), `www` redirects to apex (confirm it is 301/308 permanent with `curl -I https://www.amai.ch`).
- Redirects: none problematic found in code; verify no chains on `www` → apex → locale.
- Duplicate/thin content: service pages are now content rich; pricing, FAQ, how it works, about, legal pages all have substance. Landing pages (7) target local intents.
- Image alt: portfolio uses `next/image` with alt; blog cover uses empty alt (M6).
- Internal/footer/breadcrumb links: present and crawlable (server rendered `<a>`); breadcrumbs on service pages with matching `BreadcrumbList` schema.
- Server response codes: pages 200, utility noindexed; 404 returns Next default (H1). Verify status codes in production.

Score: 88. Deductions for M1 (hreflang drop), M2 (separator), H1 (no 404 page), M7 (slugs).

## 8. GEO audit (Generative Engine Optimisation)

Strong and clearly a focus of the build.

What an AI assistant can answer accurately from the current content:
- What does amai do? Yes — clear entity description in `ProfessionalService` schema and on every page ("website subscriptions for Swiss SMEs … from CHF 25/month").
- Who does amai help? Yes — "Swiss SMEs, self employed professionals, local businesses" stated in copy and audience chips.
- Where does amai operate? Yes — `areaServed: CH`, address in Bern, "Switzerland" in footer.
- What services does amai offer? Yes — six clearly defined services with their own pages, `ItemList` + `Service` schema.
- Does amai build websites / email marketing / automation / booking / CRM & business systems / AI assistants? Yes for all six — each has a dedicated page with definition, audience, build list and FAQ.
- How can a customer contact amai? Partially — the contact form and Bern location are crawlable, but the email is obfuscated (M4).
- How is amai different? Weak — there is no explicit comparison or "why amai" block; the differentiation is implied (managed subscription, no technical hassle) but not stated as a crawlable claim.

Plain language explainers present and crawlable: "What is GEO", "What is a CRM", "What is a customer portal", "What is a booking system", "What is marketing automation", "What is an AI assistant", "What is email marketing" — confirmed in the FAQ and explainer blocks. SEO is used in copy but not explicitly defined in a short block (Opportunity).

GEO strengths: structured service content, plain language, FAQ depth, consistent entity name, schema, areaServed, address, internal links. GEO gaps: obfuscated email (M4), no explicit differentiation block, thin `sameAs`/trust signals (one testimonial), no author/About richness for E E A T.

Score: 85. To push higher: expose contact email in plain text, add a short "Why amai" differentiation block, add a one line SEO definition, strengthen About and `sameAs`.

## 9. Performance and Core Web Vitals audit

Could not be measured here (no browser/CrUX). Code level signals are good; confirm with PageSpeed Insights and Search Console (CrUX) per page.

Positives in code:
- Static generation for all locales and service slugs (`generateStaticParams`) → low TTFB from Vercel/Cloudflare edge.
- `next/image` for portfolio (responsive `w`/`q`, lazy by default).
- Self hosted fonts via `next/font` with `display: swap` (no third party font requests, no blocking).
- GA loaded `afterInteractive` and only after consent → no third party JS on first paint for most visitors.
- Animations are CSS transforms (portfolio marquee, reveals), pause on hover, reduced motion fallback → minimal main thread cost.
- One CSS file (Tailwind v4), security headers, no obvious render blocking third parties.

Risks to verify/fix:
- Blog cover raw `<img>` without dimensions → CLS on posts (M6).
- Seven Archivo weights → font payload (L4).
- Promo modal mounting on homepage → potential INP/CLS on mobile (M3).
- `display: swap` can cause a FOUT flash; acceptable, monitor CLS.

How to verify: run PageSpeed Insights on homepage, `/en/services/websites`, `/en/website-abos`, `/en/blog/<post>`; check LCP element, CLS, INP; check Search Console Core Web Vitals report for field data once traffic exists.

Score: 80 (conservative, pending field data). Likely higher once measured given the static + edge setup.

## 10. Accessibility audit

Good baseline, a few real gaps.

Positives:
- Contact form: `<label htmlFor>` on every field, `required` attributes, localised inline errors (no native bubbles), honeypot + Turnstile, explicit success state.
- Services mega menu: `aria-haspopup`, `aria-expanded`, `aria-controls`, Escape closes, outside click closes, keyboard focus opens, real `<a>` links throughout, mobile accordion with `aria-expanded`.
- FAQ accordion: `aria-expanded`, `aria-controls`, `role="region"` panels, keyboard operable buttons.
- Reduced motion: global `prefers-reduced-motion` rule neutralises animations and smooth scroll.
- Semantic landmarks: `<nav>` (desktop + mobile), `<footer>`, `<section>` structure, one H1 per page.

Gaps:
- No skip to content link (keyboard users must tab through the whole header/mega menu). Add a visually hidden "Skip to content" anchor as the first focusable element. Medium.
- Blog cover `alt=""` (M6) — decide decorative vs meaningful.
- Focus visible states not verified across all interactive elements — confirm a visible focus ring on links, buttons, accordion summaries and the language switcher; add `:focus-visible` styling if missing. Medium.
- Colour contrast not verified — mint `#93E6BE` must never be used as text on white (the build avoids this, but verify mint text/links and `text-ink-soft` on tinted backgrounds meet 4.5:1). Verify with a contrast checker.
- Default 404 page is not accessible/branded (H1).
- Touch target sizes and text zoom not verified on device.

Score: 82.

## 11. Robots and sitemap audit

Robots (`/robots.txt`, generated by `src/app/robots.ts`): valid, reachable, `Allow: /`, `Disallow: /*/styleguide` and `/api/`, and references `https://amai.ch/sitemap.xml`. It does not block CSS/JS, language folders or service pages. Correct. One note: the `www` host redirects `robots.txt` to the apex, which is fine since the apex is canonical.

Sitemap (`src/app/sitemap.ts`): includes, for each of de/fr/en, the homepage, `/services`, all six `/services/<slug>`, `/website-abos`, `/so-funktioniert`, `/blog`, `/faq`, `/kontakt`, `/datenschutz`, `/agb`, `/referenzen`, the 7 landing slugs, and every blog post (with `lastModified` from front matter). `changeFrequency` and `priority` are consistent (home 1.0, pages 0.7, posts 0.5). It is referenced in robots. Good.

Sitemap gaps/notes:
- No hreflang alternates inside the sitemap. Next supports `alternates.languages` per entry; adding them would reinforce the language clustering already declared via `<head>` hreflang. Opportunity.
- Verify the live `sitemap.xml` actually serves all three locales (the raw fetch returned binary/compressed; validate in a browser or with the Search Console sitemap report).
- No custom `sitemap.json` / `routes.json` / `seo.json` / AI index is used by the project (the only machine index is the standard XML sitemap), so nothing custom is out of date.

Score (folded into Indexability): strong.

## 12. Indexability and crawlability audit

Excellent. All important pages are statically generated, server rendered (content present without JS), in the sitemap, internally linked from the header mega menu and the footer, with self referencing canonicals and hreflang. Utility/transactional pages are `noindex` (`styleguide`, `admin`, `checkout`, `checkout/success`) and `styleguide`/`api` are disallowed. No content is hidden behind click only JavaScript — the mega menu and accordions render real `<a>` links server side. The 7 landing pages and `website-analyse` are linked from the footer, so no orphans. The only crawl negatives are the missing 404 page (H1) and the obfuscated email (M4). Score: 92.

## 13. Metadata audit

Per page `generateMetadata` exists on all content pages, each with unique title, description, OG title/description/image (`/og.png`, 1200×630), Twitter `summary_large_image`, canonical and (on most) hreflang. `metadataBase` is set to the apex. Robots meta correctly applied to noindex pages.

Issues: services overview `|` separator (M2); blog/checkout hreflang drop (M1); homepage relies on layout for canonical/hreflang (correct, but note that any future page that sets `alternates.canonical` without `languages` will silently lose hreflang — consider a shared metadata helper to always include both). No duplicate or generic titles like "Services | amai" were found beyond the separator nit. Score: 86 (folded into Technical SEO).

---

## 14. Structured data audit

Rich and mostly correct. Types in use (counted in code): `ProfessionalService` (Organization, sitewide via layout), `WebSite` (sitewide), `BreadcrumbList` + `Service` + `FAQPage` (service pages and services overview), `Offer` + `UnitPriceSpecification` (pricing), `BlogPosting` + `ImageObject` + `Person` (blog posts), `ContactPoint` + `PostalAddress` (contact), `ItemList` (services overview).

Strengths: ProfessionalService carries `name`, `legalName` (Einzelfirma Tom de Vree), `url`, `logo`, `image`, `description`, `email`, `areaServed: CH`, `priceRange`, `sameAs`, and a full `PostalAddress` (Wylerstrasse 75, 3000 Bern, CH). FAQPage entries match the visible FAQ on each service page (verified on websites). Breadcrumbs match the visible breadcrumb. Service `provider` and `areaServed` are correct. No fake reviews/ratings. No Digital Audit references anywhere (confirmed in code and on the live page).

Issues / opportunities:
- **Organization emitted on every page (layout) and additionally inside several pages** (6 `Organization` references in code: website-abos, kontakt, blog post, services overview/detail). Multiple Organization nodes across the same page set can create ambiguous/duplicate entities. Consolidate: emit the full ProfessionalService once (layout), and elsewhere reference it by `@id` rather than repeating a partial Organization. Medium.
- `logo` is an SVG (L2) — add a PNG.
- `sameAs` is thin (L3).
- Verify the live JSON LD renders (it is injected via a server `<script type="application/ld+json">` in `JsonLd`, so it should). Validate with Google Rich Results Test and Schema.org validator on homepage, a service page, pricing, a blog post and contact.
- Consider adding `WebPage` with `@id` and `BreadcrumbList` linkage, and `Offer` `priceCurrency: CHF` consistency check on pricing.

Score: 86.

## 15. International SEO audit

Three locales (de default, fr, en), `localePrefix: 'always'`, `<html lang>` set per locale, hreflang `de`/`fr`/`en` + `x-default → /de` on the layout and on most pages, self referencing. Translated metadata and body content per locale (messages + per locale content modules). Language switcher in header and footer with real links.

Issues:
- Blog posts and checkout drop hreflang (M1).
- URL slugs are not localised (M7) — German slugs on en/fr.
- Sitemap has no hreflang alternates (section 11) — add for reinforcement.
- `x-default → /de` is reasonable (German primary market); acceptable.
- Verify no mixed language content leaks (e.g. a German string on an English page) — spot check `/en` and `/fr` service pages; the new `serviceUi` keys (Before/After, Trigger/Action/Result, Calendar) are translated, which closes the most likely leak.

Score: folded into Technical SEO; international layer is good apart from M1/M7.

## 16. Internal linking audit

Header mega menu links all six services + How it works, Pricing, FAQ. Footer is comprehensive: Services (all six + All services), Company (About, How it works, Pricing, Portfolio, Blog, FAQ, Contact), Topics (7 landing pages), Free tools (website analysis), Contact (email, Bern), Language (DE/FR/EN), legal (Imprint, Privacy, GTC). Homepage "More than a website" section links five services (websites omitted by design as the homepage is the websites story). Breadcrumbs on service pages link back to `/services`. CTAs link to pricing, contact and `/services`.

Gaps:
- No related service cross links between the six service pages (M5).
- Websites service page does not link to a contact path (H3).
- Consider linking the relevant landing pages from the matching service page (e.g. Websites → `website-erstellen-lassen-schweiz`, `webdesign-kmu-schweiz`) to connect the local SEO cluster to the service cluster. Opportunity.

Score: 85.

## 17. Content quality audit

Service pages are now strong mini sales pages: each has a hero with a unique H1, a trust strip, a problem section with cards, a signature engine/visual, a build list, use cases, a process, outcomes, a service specific FAQ and a final CTA, composed differently across three flows so they do not feel templated. Homepage has a clear value proposition, portfolio, an "Explore amai" hub, a "More than a website" services teaser and a testimonial. Pricing, FAQ, How it works, About and legal pages exist.

Gaps:
- Only one testimonial (SEMANU) — add two or three more with name, company and result. Trust + conversion.
- Portfolio items are mostly "in development" (NORA, BIKESTORE, Maison Rosé) with one live (SEMANU) and amai's own site — fine for a young business, but add live results/metrics as they land.
- No explicit "why amai / how we are different" block (GEO + conversion).
- SEO term not defined in a short block (GEO).
- About page depth not audited in detail — ensure it carries founder/E E A T signals (named owner Tom de Vree, Bern, experience), which strengthens GEO trust.

Score: 84.

## 18. Service page audit (per page)

All six now use the three flow system (Flow 1 Presence & Growth: websites, email-marketing; Flow 2 Automation & Operations: marketing-automation, booking; Flow 3 Systems & Intelligence: business-systems, ai-assistants). Common status: unique H1, unique meta title/description/OG, canonical + hreflang, Breadcrumb + Service + FAQPage schema, content rich, mobile responsive, accessible FAQ, server rendered. Performance pending field check.

- **/en/services/websites** (Flow 1). First impression: strong, clear promise, 8 layer stack visual, before/after. Content depth: high. Conversion: weakened by the duplicate hero CTA and pricing only CTAs (H2, H3). SEO/GEO: excellent (explicit GEO explainer, SEO/GEO trust block). Fix: H2, H3; add a contact CTA; add related links (M5).
- **/en/services/email-marketing** (Flow 1). Signup journey visual, campaign use cases, permission/consent FAQ, plain language "what is email marketing". Strong. Fix: related link to Marketing Automation (M5).
- **/en/services/marketing-automation** (Flow 2). Dark problem band ("Stop losing leads after the first contact"), trigger→action→result flow visual, vertical process. Distinct and strong. Fix: related links (Email Marketing, Booking).
- **/en/services/booking-appointment** (Flow 2). Calendar mock + booking steps, industry use cases, reminders/payment FAQ. Product like and clear. Fix: related links.
- **/en/services/business-systems** (Flow 3). Hub diagram, three paths (CRM, Dashboard, Customer Portal) from sub modules, control framing, "outgrows spreadsheets" problem. Strong, avoids enterprise heaviness. Fix: related link to AI Assistants.
- **/en/services/ai-assistants** (Flow 3). Assistant type cards, "AI only when it solves a real problem", control & safety panel, no hype. Strong and on message. Fix: related link to Business Systems.

Common improvements: differentiate/repair CTAs (H2/H3), add related service cross links (M5), confirm field performance, consider a short proof element (a relevant portfolio item or stat) per page.

Score: 86.

## 19. Trust and conversion audit

Present: portfolio section, one testimonial, transparent pricing with plans and a process, Bern address, legal pages (Imprint/Impressum, Privacy/Datenschutz, GTC/AGB), "no technical hassle" and "from CHF 25/month" messaging, consistent professional tone, clear company identity (Einzelfirma Tom de Vree). A visitor can understand what amai does, roughly why it is credible and how to start.

Gaps:
- Only one testimonial; no client logos or trust badges.
- Websites CTA duplication + pricing only CTAs (H2/H3) hurt the highest intent page.
- No explicit differentiation ("why amai") statement.
- Email obfuscation makes the lightest weight contact method invisible to some readers/AI (M4).
- "What happens after you contact us" is implied (24 hour reply in the outreach email) but not stated on the contact page — add a one line expectation ("We reply within one working day").

Score: 80.

## 20. Mobile UX audit

Responsive layouts, a mobile accordion for services, reduced motion support, server rendered content, `viewport` meta present. The hero, cards and forms stack cleanly (verified by structure). 

Gaps to verify on a real device: tap target sizes (mega menu items, footer links, language switcher), the promo modal on mobile (M3), horizontal scrolling (the portfolio marquee is masked/overflow hidden — good), sticky header height vs `scroll-padding-top` (set to 88px), and form usability with the on screen keyboard. Score: 84.

## 21. Security and technical hygiene audit

Strong. `next.config` sets: Content Security Policy (default-src self; object-src none; frame-ancestors none; img/font/style scoped; script-src self + GA + Stripe + Turnstile; connect-src self + GA + Supabase + Turnstile; frame-src Stripe + Turnstile; form-action self + Stripe; upgrade-insecure-requests), HSTS `max-age=63072000; includeSubDomains; preload`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`. Portal pages set `Cache-Control: no-store`. HTTPS enforced. Cookie banner gates analytics. Forms protected by honeypot + Cloudflare Turnstile. No secrets in client code (service role and Stripe secret are server only by design).

Hardening opportunities: CSP `script-src 'unsafe-inline'` → nonce based CSP (L5); verify no source maps are publicly served in production (`productionBrowserSourceMaps` is not enabled, so this is fine — confirm); confirm `www` → apex is a permanent redirect; verify mixed content is absent (CSP `upgrade-insecure-requests` covers it). Verify the security headers are actually present on the live response (`curl -I https://amai.ch` — Vercel applies `headers()`; Cloudflare in front should pass them through). Score: high (no separate number; folds into overall).

## 22. Analytics and tracking audit

GA4 present (`G-0LHEQCEQRD` default), consent gated (loads only when the cookie banner consent is "all"), `afterInteractive`, SPA page_view on route change. Event coverage is good: `service_cta_clicked`, `contact_cta_clicked`, `contact_form_started`, `contact_request_submitted` / `_failed`, `order_form_started`, `package_selected`, `order_request_submitted` / `_failed`. This covers CTA clicks, form starts and form submissions for both contact and order flows.

Gaps / opportunities:
- Consent Mode v2 not implemented (L6) — without it, non consenting traffic is invisible; with it you keep modelled conversions.
- Define GA4 key events (conversions) in the GA UI: `contact_request_submitted`, `order_request_submitted`, `package_selected`. Mark them as conversions.
- Search Console: verify the property is added and the sitemap submitted (cannot verify from here). Bing Webmaster Tools: add for completeness. Google Business Profile: create/claim for Bern local presence and link it (also helps `sameAs` and local SEO).
- Consider tracking service page scroll depth or FAQ opens for content engagement (optional).

## 23. Local and Swiss relevance audit

Good. The site is explicitly Swiss SME focused: "Swiss SMEs", "Switzerland", Bern address (Wylerstrasse 75, 3000 Bern), `areaServed: CH`, CHF pricing, `.ch` domain, Swiss German spelling conventions (e.g. "Grüsse", "massgeschneidert"), and German as the default locale. ProfessionalService + PostalAddress schema reinforce locality. Three Swiss national languages are served (de/fr; Italian is not offered — acceptable for the target, note as an option if expanding to Ticino).

Improvements: create/claim a Google Business Profile (Bern) and link it (`sameAs` + local pack eligibility); add Swiss specific trust cues (e.g. "Schweizer Hosting", data residency in the EU/CH, local references) where true; ensure NAP (name, address, contact) is consistent everywhere and that the email is crawlable (M4). Local relevance score is strong.

## 24. Final prioritized action plan

**Quick wins (under ~30 min each)**
1. Fix the services overview title separator `|` → `·` (M2). Effort: trivial. Impact: brand consistency. Files: `src/content/services.ts` (en/de/fr `metaTitle`).
2. Differentiate the Websites hero CTAs (H2). Effort: small. Impact: conversion clarity. Files: `src/content/serviceDetail.ts` (websites `finalSecondary*`), optionally `services.ts`.
3. Add `apple-icon.png` (180×180) and `favicon.ico` from the brand kit (L1). Effort: small. Files: `src/app/apple-icon.png`, `public/favicon.ico`.
4. Add a one line "we reply within one working day" to the contact page (section 19). Files: `kontakt` page + messages.

**Critical technical fixes (highest leverage)**
5. Add `src/app/[locale]/not-found.tsx` (and a root fallback) — branded, localised, with links (H1). Effort: ~1h. Impact: recovers 404 traffic, removes soft 404. 
6. Add a contact CTA to the Websites page so not every CTA goes to pricing (H3). Effort: small to medium (add a `websites` interest value or a `/kontakt` secondary). 
7. Restore hreflang on blog posts (and confirm checkout stays noindex) (M1). Effort: ~30 min. Files: `blog/[slug]/page.tsx`. Add a shared metadata helper that always merges canonical + languages to prevent recurrence.

**SEO and GEO improvements**
8. Expose the contact email in plain text / `mailto:` and in `ContactPoint` schema; disable Cloudflare email obfuscation for it (M4). Impact: GEO contact extractability.
9. Add related service cross links (M5) and link matching landing pages from service pages (section 16). Impact: internal graph + topical authority.
10. Add a short "Why amai / how we are different" block and a one line SEO definition (sections 8, 17). Impact: GEO + conversion.
11. Add hreflang alternates to the XML sitemap (section 11). 
12. Consolidate Organization schema to a single `@id` referenced node (section 14). 

**Performance improvements (after field measurement)**
13. Convert the blog cover to `next/image` with width/height + real alt (M6). Impact: CLS, payload, a11y.
14. Trim unused Archivo font weights (L4). 
15. Re-evaluate the promo modal on mobile: intent trigger or bottom banner (M3). Impact: mobile UX + CWV.
16. Run PageSpeed Insights on the key pages and fix whatever LCP/CLS/INP issues surface (section 9).

**Content and conversion improvements**
17. Add two or three more testimonials with names + results (section 19). 
18. Strengthen the About page with founder/E E A T signals (sections 17, 23). 
19. Add proof (a relevant portfolio item or metric) to each service page (section 18). 

**Accessibility improvements**
20. Add a "Skip to content" link as the first focusable element (section 10). 
21. Verify and, if needed, add visible `:focus-visible` styles across links, buttons, accordions and the language switcher (section 10). 
22. Run a contrast check on mint/ink-soft text combinations (section 10). 

**Longer term / hardening**
23. Move CSP to a nonce based policy (L5). 
24. Implement Google Consent Mode v2 (L6). 
25. Create and link a Google Business Profile (Bern); add LinkedIn etc. to `sameAs` (sections 22, 23, L3). 
26. Consider localised URL slugs with redirects if expanding internationally (M7). 

## 25. Implementation checklist for a 100/100 technical foundation

Crawlability
- [ ] Custom localised 404 page with links (H1)
- [ ] All important pages reachable via server rendered links (already true — keep it)
- [ ] No content hidden behind JS only handlers (already true)

Indexability
- [ ] Utility/transactional pages noindex (done: styleguide, admin, checkout, checkout/success)
- [ ] No accidental noindex on content pages (verify in production headers)

Metadata
- [ ] Unique title + description per page (done; fix `|`→`·` on overview, M2)
- [ ] OG + Twitter on every page (done)
- [ ] Shared helper guarantees canonical + hreflang together (prevents M1 recurrence)

Sitemap
- [ ] All locales + all pages + posts (done)
- [ ] hreflang alternates inside sitemap (todo)
- [ ] Submitted in Search Console (verify)

Robots
- [ ] Valid, references sitemap, blocks only styleguide + api (done)

Canonical
- [ ] Self referencing absolute canonical per page on the apex domain (done)
- [ ] www → apex is a permanent redirect (verify `curl -I`)

Hreflang
- [ ] de/fr/en + x-default on every indexable page including blog posts (todo: M1)
- [ ] Self referencing + return links (verify with hreflang tester)

Schema
- [ ] ProfessionalService + WebSite sitewide (done)
- [ ] Breadcrumb + Service + FAQPage on service pages (done)
- [ ] Offer on pricing, BlogPosting on posts, ContactPoint on contact (done)
- [ ] Single Organization `@id` (consolidate, section 14)
- [ ] PNG logo + richer sameAs (L2, L3)
- [ ] Validate all in Rich Results Test (verify)

Performance
- [ ] PageSpeed: LCP < 2.5s, CLS < 0.1, INP < 200ms on homepage + service pages (measure)
- [ ] Blog cover via next/image with dimensions (M6)
- [ ] Font weights trimmed (L4)
- [ ] Promo modal not blocking mobile LCP (M3)

Accessibility
- [ ] Skip to content link (todo)
- [ ] Visible focus states everywhere (verify)
- [ ] Contrast ≥ 4.5:1 for text (verify)
- [ ] Forms labelled, mega menu + accordions ARIA correct (done)
- [ ] Reduced motion respected (done)

Mobile
- [ ] Tap targets ≥ 44px, no horizontal scroll, readable type (verify on device)
- [ ] Promo modal mobile behaviour (M3)

Internal links
- [ ] Header + footer + breadcrumbs cover all key pages (done)
- [ ] Related service cross links (M5)
- [ ] Service pages link to matching landing pages (opportunity)
- [ ] Websites page has a contact CTA (H3)

Content depth
- [ ] Each service page: hero, problem, solution, examples, process, benefits, FAQ, CTA (done)
- [ ] More testimonials + proof (todo)
- [ ] "Why amai" differentiation block (todo)

GEO
- [ ] Entity, services, audience, area, pricing, contact all crawlable (mostly done; fix email M4)
- [ ] Plain language explainers for technical terms (done; add SEO definition)
- [ ] Contact email in plain text + schema (M4)

Forms
- [ ] Labels, validation, success/error, honeypot + Turnstile, tracking (done)
- [ ] "What happens next" expectation line (todo)

Security
- [ ] CSP, HSTS preload, nosniff, frame DENY, Referrer-Policy, Permissions-Policy (done)
- [ ] Headers present on live response (verify `curl -I`)
- [ ] Nonce based CSP (hardening, L5)

Analytics
- [ ] GA4 consent gated with event coverage (done)
- [ ] Key events marked as conversions in GA (todo)
- [ ] Consent Mode v2 (L6)
- [ ] Search Console + Bing + Google Business Profile (todo/verify)

Trust
- [ ] Legal pages, address, identity (done)
- [ ] More testimonials, differentiation, crawlable contact (todo)

---

### Appendix: how to verify the items I could not check from here
- Field Core Web Vitals: PageSpeed Insights + Search Console → Core Web Vitals (CrUX).
- `<head>` hreflang + JSON LD as served: view source on the live page, Google Rich Results Test, and an hreflang tester.
- Redirect status codes (`www`→apex, trailing slash, 404): `curl -I <url>` and Search Console → Page indexing.
- Security headers on live: `curl -I https://amai.ch`.
- Sitemap contents: open `https://amai.ch/sitemap.xml` in a browser or the Search Console sitemap report.

