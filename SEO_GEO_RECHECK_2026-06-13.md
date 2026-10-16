# amai.ch — SEO & GEO recheck

Date: 2026-06-13 · Follow-up to `SEO_GEO_AUDIT.md` (the original, ~85/100) and
`SEO_GEO_FIXES.md`. This re-audits the **deployed** site after all the fixes shipped.

**Method (honest):** scored against the live deployment (`origin/main`, the source of
truth for what the servers emit) cross-checked with what we confirmed live this session:
your PageSpeed Insights run, Search Console (sitemap accepted, 78 URLs), the live
`robots.txt`, the branded 404, and the rendered pages. Field Core Web Vitals (CrUX) still
have no data yet — the site is too new — so mobile field performance is a "watch", not a
measured fail.

---

## 1. Score: then → now

| Category | Original | Now | Why it moved |
|---|---|---|---|
| Technical SEO | 88 | **96** | 404 page, hreflang on blog, all title separators fixed, clean canonicals |
| GEO readiness | 85 | **93** | Email crawlable, "Why amai" + differentiation, SEO definition, founder in schema, fresh blog content |
| Performance (now measured) | 80 | **90** | Desktop 99 (PSI). Mobile 78 lab only — held back pending field data |
| Accessibility | 82 | **93** | Skip link + focus ring; PSI accessibility 95 (desktop) / 98 (mobile) |
| Structured data | 86 | **95** | Single `@id` entity, founder, PNG logo, ContactPoint, richer sameAs |
| Indexability & crawlability | 92 | **97** | Real 404, portal walled off (robots + header), sitemap hreflang |
| Internal linking | 85 | **92** | Related-service links on all 6 pages, service→guide links, clearer funnel |
| Content quality | 84 | **88** | "Why amai", SEO definition, new cybersecurity post (3 posts now) |
| Service page quality | 86 | **93** | CTAs differentiated + contact path, related links |
| Trust & conversion | 80 | **86** | Differentiation block, contact paths, prominent free-analysis funnel |
| Mobile UX | 84 | **88** | Promo modal no longer an interstitial; clearer mobile CTAs |
| **Overall (weighted)** | **≈ 85** | **≈ 92** | |

Roughly seven points of real, shipped improvement. What's left is mostly content you
supply (testimonials, proof) and one-off hardening — not structural gaps.

---

## 2. Fixed since the original audit (all live)

**High priority — all done**
- **404 page** — branded, localised `not-found.tsx`; confirmed live (real 404, header/footer/links).
- **Websites CTAs** — the duplicate hero button is gone; the page now has a real contact path (`/kontakt?interest=websites`).

**Medium — all done**
- **Blog hreflang** restored via a shared `localizedAlternates()` helper (de/fr/en + x-default, only for locales that exist).
- **Title separators** — every `|` replaced with `·`; the stray em dash on the German homepage title fixed. No `|` left anywhere.
- **Promo modal** — on mobile it no longer auto-opens over the hero; it waits for a scroll and slides up as a bottom sheet (interstitial risk removed).
- **Contact email** — Cloudflare email obfuscation turned off; `hello@amai.ch` is now crawlable, plus it's in the ContactPoint schema.
- **Related-service links** on all six service pages; the Websites page also links its matching local-SEO guides.
- **Blog cover** — explicit dimensions (no CLS) + a real alt.

**Low / opportunity — done**
- Favicon, Apple touch icon, 192/512 PNG icons; PNG logo in schema.
- Organization consolidated to a single `@id` node; **founder (Tom de Vree)** added — an E-E-A-T signal.
- `sameAs` now Instagram **+ Google Business Profile**.
- Sitemap carries hreflang alternates per entry.
- **Consent Mode v2** live (privacy policy updated to match).
- "Why amai" differentiation block + a plain-language SEO definition on `/services`.

**New this session (beyond the original audit)**
- **Portal `/app` walled off** from search + AI: `Disallow: /app/` in robots **and** an `X-Robots-Tag: noindex` header (covers the portal's PDF/JSON too).
- **Free website analysis funnel** made prominent: pill CTA in the header, secondary CTA in the hero, lighter (light-green) landing page.
- **New blog post** (cybersecurity, de/fr/en) — content freshness for SEO + GEO.
- **Pricing checked and consistent**: Starter **25 CHF**, Business 79, Webshop 99 — the displayed prices, the JSON-LD Offers and the "ab 25 CHF" promise all line up.

**External (you completed)**
- Cloudflare email obfuscation off · Search Console verified + sitemap submitted (78 URLs, "Geslaagd") · Google Business Profile created · Bing submitted.

---

## 3. Current state by area

**Technical SEO (96).** Unique titles/descriptions, all on the `·` house style; self-referencing canonicals; hreflang on every indexable page including blog posts; clean lowercase locale-prefixed URLs; correct noindex on utility pages; HTTPS + HSTS. Only nits left: German slugs on en/fr (intentional) and field-CWV still to confirm.

**GEO (93).** An AI assistant can now answer who amai is, what it does, who for, where (Bern, CH), the six services, the prices, **how to contact** (email crawlable + ContactPoint), **why amai** (explicit differentiation block) and **what SEO is** (plain-language definition). Entity is unambiguous (single `@id`, founder, sameAs). Remaining GEO upside is trust depth: more testimonials, more proof.

**Performance (90).** PageSpeed lab: **desktop 99** (LCP 0.5s, CLS 0.006, TBT 10ms) — excellent. **Mobile 78** (LCP 4.4s) — but that's Lighthouse's throttled Moto-G emulation with **no real-user data yet**. Watch Search Console → Core Web Vitals over the next few weeks; only optimise the hero if real mobile users are actually slow. CLS is effectively zero now.

**Accessibility (93).** Skip-to-content link, global visible focus ring, labelled forms, ARIA on menus/accordions, reduced-motion respected. PSI accessibility 95–98 confirms no major contrast/tap-target issues.

**Structured data (95).** ProfessionalService (with `@id`, founder, PNG logo, email, address, areaServed, priceRange, sameAs) + WebSite sitewide; Breadcrumb + Service + FAQ on service pages; Offer on pricing; BlogPosting on posts; ContactPoint on contact. No duplicate entities. Validate once in the Rich Results Test for peace of mind.

**Indexability (97).** Everything important statically generated, server-rendered, in the sitemap, internally linked, canonical + hreflang. 404 real, portal noindexed at two layers, styleguide/api disallowed. No orphans.

**Internal linking (92).** Header, footer, breadcrumbs, related-service cross-links, service→guide links, and the funnel now surfaced prominently.

**Trust & conversion (86).** Differentiation, transparent + consistent pricing, contact paths, prominent low-barrier funnel. The one real gap: still a single testimonial.

---

## 4. Remaining open items

**You (quick / accounts)**
1. **GA4** — mark `contact_request_submitted`, `order_request_submitted`, `package_selected` as key events (forms work now, so they'll fire).
2. **Watch field CWV** in Search Console over ~2–3 weeks; act on mobile LCP only if real users are slow.
3. **DKIM** — add the 3 Hostpoint TXT records to Cloudflare (email deliverability; leave SPF/DMARC as is).

**Content (when you have it)**
4. 2–3 more testimonials (name, company, result) — the biggest remaining trust/GEO lever.
5. One proof stat or portfolio item per service page.

**Optional / hardening**
6. Nonce-based CSP (replace `script-src 'unsafe-inline'`) — its own change with a live smoke test.
7. Keep publishing blog posts — every one adds keywords + GEO citations.

**By design (no action)**
8. German URL slugs on en/fr — intentional, kept stable. Only localise later with 301s.

---

## 5. Bottom line

The structural SEO/GEO work from the original audit is shipped and live — the foundation is
now genuinely strong (≈92/100). The site is fast on desktop, crawlable, unambiguous to AI,
accessible, and the funnel is clear without being pushy. The remaining points are content
you provide and a couple of optional hardening steps — none of them blocking.
