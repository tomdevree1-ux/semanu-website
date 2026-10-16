# SEO + GEO audit — amai.ch (15.06.2026)

Scope: the rebuilt SEO landing pages (7), the rebuilt `/so-funktioniert`, and the
global SEO/GEO setup.

**Verdict:** strong shape. The rebuilds added the content depth + structured data that
were the main gaps. What remains is mostly off-page (forcing the re-crawl) plus two quick
on-page items.

---

## 1. SEO — on-page (verdict: strong)

Working well:

- **Metadata.** Every page routes through `pageMetadata()`: `title` + `og:title` +
  `twitter:title` aligned, self-referencing **canonical**, **hreflang** (de/fr/en +
  x-default), OG/Twitter image + card.
- **Indexation.** Public content is indexable; correct `noindex` on transactional/private
  pages only (checkout, checkout/success, `/app` portal, styleguide, admin).
- **Headings.** One `<h1>` per page, clean `<h2>` section hierarchy on landings + the
  process page.
- **Structured data.** Per page: WebPage + Service (now with `Offer` + org `@id`) +
  FAQPage + BreadcrumbList. Global: ProfessionalService + WebSite (on every page).
- **Sitemap.** All public pages + 7 landings + blog × 3 locales, with hreflang,
  `lastModified`, `changeFrequency` (weekly for landings), `priority` (0.8 landings).
  `robots.txt` allows all + references the sitemap.
- **Content + linking.** 12-section landings, 10-section process page; the landing cluster
  + core pages interlink; FAQ is real DOM text (not hidden behind JS).
- **Rendering.** Static (SSG) → fast, CDN-served, regenerated per deploy.

Gaps / opportunities (prioritized):

- **P1 — Homepage title cannibalization.** The homepage DE `<title>` targets
  "Website erstellen lassen Schweiz" — the exact keyword of the dedicated landing page.
  Let the homepage own a broader brand/category term (e.g.
  `amai! · Website Abo für Schweizer KMU · ab 35 CHF/Monat`) and let the landing own the
  long-tail. Not changed yet — it is your primary page; say the word.
- **P2 — `lastModified` = build date on every page.** Strong re-crawl signal now (intended),
  but it tells crawlers everything changed on every deploy. If Google later discounts it,
  switch to a deliberate "content updated" constant in `src/app/sitemap.ts`.
- **P3 — Generic OG image.** All pages share `/og.png`. Per-template OG (page title on the
  card) would lift social/SERP click-through. Bigger job, optional.
- **Done this pass:** `Service.provider` linked to the org `@id` + a `from 35 CHF/mo` `Offer`
  added on every landing.

## 2. GEO — AI search (verdict: strong baseline)

Working well:

- **Entity.** The entity sentence ("amai! ist ein Anbieter für Website Abos aus Bern …") on
  every landing + the process page; global **ProfessionalService** with `sameAs` (Instagram
  + Google), `address` (Bern), `founder`, `priceRange`.
- **Extractable structure.** FAQPage Q&A, Service (+ Offer), clear facts (price 35 CHF/mo,
  Bern, audience, what is included, the 36-month term, "rankings not guaranteed").
- **llms.txt** present: the offering, the plans + prices, all landing pages and the process
  page.
- **Access.** AI crawlers allowed (robots `*`).
- The pages answer the GEO questions directly: what / who / where / cost / process /
  after-launch / limitations.

Opportunities:

- **P2 — IndexNow.** A key file + a ping of the changed URLs on deploy → instant re-crawl
  for Bing + AI-search engines (Google ignores IndexNow; GSC covers Google). Can wire it.
- **P3 — Process-page Service/HowTo.** `so-funktioniert` has WebPage/FAQPage/Breadcrumb; a
  HowTo is optional.
- **Maintenance.** `llms.txt` is hand-maintained — keep it current as pages change.

## 3. Forcing it into caches + crawlers

- **Vercel (your CDN):** `git push` → redeploy regenerates the static HTML and
  auto-invalidates the edge cache. Pushing **is** the purge.
- **Cloudflare:** you use Cloudflare (Turnstile). **Verify whether `amai.ch` is proxied**
  (orange cloud in DNS). If yes → purge the Cloudflare cache after each deploy (Caching →
  Purge, or by URL), or add a rule that bypasses cache for HTML. If grey (DNS-only), skip.
- **Google (the real lever):** Search Console → resubmit `sitemap.xml` → URL Inspection →
  **Request indexing** for each rebuilt URL. Queues an immediate re-crawl.
- **Bing:** Webmaster Tools → submit sitemap + URL submission (also feeds Copilot).
- **AI engines:** cannot be forced — they re-crawl on their own and pull from Google/Bing.
  Levers = everything above (fresh sitemap + llms.txt + being indexed in Google/Bing).

## 4. Action checklist

**Code (amai can do):**

- [x] Homepage title de-cannibalization (all locales — `amai! · Website Abo …`).
- [x] IndexNow key + ping script (`scripts/indexnow-ping.ts`, run after deploy).
- [x] Google Ads privacy disclosure added (DE/FR/EN).
- [ ] Per-template OG images — parked (needs an embeddable font + visual QA; marginal value).
- [x] Service `@id` + `Offer` on landings.
- [x] `lastModified` on every sitemap entry.
- [x] `llms.txt` lists the landings + process page.

**Manual (you):**

- [ ] `git push` + deploy (forces the Vercel cache).
- [ ] If Cloudflare proxies `amai.ch` → purge the Cloudflare cache.
- [ ] Google Search Console: resubmit the sitemap + Request indexing on the rebuilt URLs
  (7 landings + `/so-funktioniert`).
- [ ] Bing Webmaster Tools: submit the sitemap.

**Rebuilt URLs to (re)index:**
`/de/website-erstellen-lassen-schweiz`, `/de/webdesign-kmu-schweiz`,
`/de/website-fuer-selbstaendige`, `/de/website-fuer-lokale-unternehmen`,
`/de/website-betreuung-schweiz`, `/de/seo-basis-fuer-kmu`, `/de/website-abo-schweiz`,
`/de/so-funktioniert` (plus the `/fr` and `/en` variants).

---

## Pass 2 — homepage rebuild + freshness (same day)

**Homepage (`/de`, `/fr`, `/en`) rebuilt** into a problem → solution → proof → offer →
action flow: problem, solution, portfolio showcase, real cases (from `referenzen.ts`:
situation/solution/why + status + live links, no invented metrics), a transparent
subscription block (included / not included + clear terms: term, cancellation, ownership,
changes), a concrete "what SEO includes / does not include" block, the process, the SEMANU
testimonial, services, an FAQ accordion and the final CTA. Long-form copy lives in the new
typed module `src/content/home.ts`. Hero and its CTAs were left unchanged on request.

**Structured data added on the homepage:** `FAQPage` + `WebPage` (with `dateModified`).
`dateModified` also added to the `WebPage` JSON-LD on the landings and `/so-funktioniert`.

**Consistency / trust fixes (all locales):**
- Removed the non-compliant "48 Stunden / 48 hours / 48 heures" claim from the plan
  features and the process step; replaced with "wenigen Werktagen / a few working days /
  quelques jours ouvrés" (matches the rest of the site).
- Added a dedicated meta description for the pricing page (`/website-abos`); it previously
  inherited the sitewide default.
- Verified: no stale prices (all 35 / 79 / 99), titles consistent (`… · amai.ch`), noindex
  correct (checkout, checkout/success, admin, styleguide).

**Sitemap completeness:** added `/about`, `/impressum` and `/website-analyse` (indexable
pages that were missing). Every entry still carries the deploy date as `lastModified`.

**Still manual (you):** push + deploy, purge Cloudflare, and in Search Console resubmit the
sitemap + Request indexing on `/` (home) in all three locales plus the rebuilt URLs above.
