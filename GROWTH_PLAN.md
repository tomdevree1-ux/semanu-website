# amai.ch — off-page growth playbook

The on-page SEO/GEO is done (see `SEO_GEO_AUDIT_2026-06-15.md`). What is left is
off-page and lives in your accounts, not in the code. This is the checklist.

---

## 1. Force a re-crawl after every deploy (5 min routine)

1. **Push + deploy.** `git push origin main` regenerates the static HTML on Vercel and
   invalidates the Vercel edge cache. Pushing is the Vercel purge.
2. **Cloudflare.** Check the DNS record for `amai.ch`: orange cloud (proxied) or grey
   (DNS only). If proxied, purge the cache after each deploy: Cloudflare dashboard →
   Caching → Configuration → Purge Everything (or purge by URL). If grey, skip.
3. **IndexNow ping** (Bing + Yandex + AI search): `npx tsx scripts/indexnow-ping.ts`.
   It reads the live sitemap and submits every URL. Key file: `public/91282c3159800b44aa13d4505dc2ec90.txt`.
4. **Google** (the real lever): see section 2.

## 2. Google Search Console (the most important lever)

One-time: verify `amai.ch` (DNS TXT or the Cloudflare integration). Then, after a deploy:

- **Sitemaps** → submit `https://amai.ch/sitemap.xml` (re-submit after big changes).
- **URL Inspection** → paste a URL → **Request indexing**. Do this for the pages you most
  want re-crawled:
  - `/de`, `/fr`, `/en` (homepage, all three)
  - `/de/website-erstellen-lassen-schweiz`, `/de/webdesign-kmu-schweiz`,
    `/de/website-fuer-selbstaendige`, `/de/website-fuer-lokale-unternehmen`,
    `/de/website-betreuung-schweiz`, `/de/seo-basis-fuer-kmu`, `/de/website-abo-schweiz`
  - `/de/so-funktioniert`
  - the `/fr` and `/en` variants of the above
- Watch **Pages** (indexed vs not) and **Performance** (queries, impressions) weekly.

## 3. Bing Webmaster Tools

Import the site from Search Console (one click), submit `sitemap.xml`, and use URL
submission for the key pages. Bing also feeds Copilot, so this helps AI answers.

## 4. Google Business Profile + reviews

A GBP is the highest-leverage local move for a Bern web studio.

1. **Create / claim** the profile at business.google.com. Name: `amai!`. Primary category
   **Website designer**; secondary **Marketing agency** / **Internet marketing service**.
2. **Service area** business (you visit clients / work remotely): set Bern + the cantons
   you serve, hide the street address if you prefer.
3. Complete everything: short description (reuse the entity line), services (Websites,
   Email Marketing, Booking, Business Systems, AI Assistants), hours, `hello@amai.ch`,
   website link, a few photos (logo, work screenshots, you).
4. **Reviews** are the ranking + trust driver. Ask every happy client for one with a direct
   review link. Start with the live ones (SEMANU, and any other reference). Reply to every
   review. Target: 5+ in the first month, then a steady trickle.
5. Post the occasional update (a launched site, an offer) — it keeps the profile active.

## 5. Backlinks + citations (NAP consistency first)

Keep the Name / Address / contact identical everywhere: `amai!`, Bern, `hello@amai.ch`,
`https://amai.ch`. Then build:

**Swiss business directories (citations):**
- local.ch, search.ch, moneyhouse.ch, Zefix (commercial register), local.ch maps,
  cylex.ch, hotfrog.ch, tel.search.ch, firmenwissen, and your canton's KMU directory.

**Web-agency / industry listings:**
- Clutch, Sortlist, The Manifest, DesignRush, GoodFirms (Switzerland filter), and Swiss
  startup/agency lists. Many give a do-follow link + referral traffic.

**Relationships + content (the durable links):**
- Partner pages: tools you use (Supabase, Stripe, Vercel, Resend) sometimes list customers
  or accept a case study. Local partners (photographers, copywriters, accountants) can swap
  referrals + links.
- Guest articles / local press: a short piece on "Website Abo for Swiss KMU" for a regional
  business blog or chamber of commerce.
- Your own content: the blog posts already exist; promote them on LinkedIn + Instagram
  (`amai.swiss`) so they earn natural links and shares.

**Social + brand profiles (consistent NAP, low-effort links):**
- LinkedIn company page, Instagram (live), and a short company description that matches the
  site. Cross-link them.

## 6. Keep current

- `llms.txt` and the entity line are hand-maintained — update them when pages/prices change.
- Re-run the deploy routine (section 1) after each meaningful content change.
- Revisit Search Console monthly: fix any "not indexed" reasons, double down on the queries
  that are gaining impressions.

---

### Status of the SEO/GEO backlog

- Done (code): metadata, canonical/hreflang, structured data (+ Offer + org @id), full
  sitemap, `llms.txt`, homepage title de-cannibalization (all locales), Google Ads privacy
  disclosure, IndexNow key + ping script.
- Manual (this doc): deploy routine, Cloudflare purge, GSC + Bing indexing, Google Business
  Profile + reviews, backlinks/citations, real testimonials.
- Parked (optional, needs visual QA): per-page OG images, CSP nonce, major dependency upgrades.
