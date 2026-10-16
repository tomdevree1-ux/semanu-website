# CLAUDE.md — amai.ch project context

Read this first. It is the working context for amai.ch. For the full phased plan see
`BUILD_PLAN.md`; for run instructions see `README.md`.

## What this is

Production website + back end for **amai.ch**, a Swiss "website subscription" service
(builds & maintains websites for SMEs on a monthly plan). The marketing site is built
and live in dev. **The next job is the back end: a Premium customer portal + Stripe
payments** (see "Next task" below).

## Stack

Next.js (App Router, TypeScript) · next-intl (DE default, FR, EN, `localePrefix: 'always'`)
· Tailwind CSS v4 (CSS-first tokens) · Supabase (Postgres + Auth + Storage, EU region)
· Resend (transactional email) · Cloudflare (hosting/CDN) · Google Analytics 4
(consent-gated) · zod validation · Stripe (to be wired).

Verify changes with `npx tsc --noEmit` (must stay clean) and keep the three locale
files in parity. `next build` can crash in constrained sandboxes (native SWC) but
builds fine on macOS.

## CRITICAL conventions (do not break)

**Copy style (all user-facing text, every language):**
- **No dashes.** No em/en dashes (—, –). No hyphens in compounds: write `Website Abo`,
  `SEO Grundlagen`, `Email` (not `E-Mail`), `Cookie Hinweis`. Page `<title>` uses a
  middle dot separator: `Seite · amai.ch`.
- **No comma before a coordinating conjunction**: never `, und` / `, oder` / `, aber` /
  `, mit` / `, et` / `, ou` / `, mais` / `, avec` / `, and` / `, or` / `, but` / `, with`.
  In French, rephrase question inversions to avoid hyphens (e.g. `Vous pouvez … ?`).
- **Swiss German spelling (ss, never ß).** amai is a Swiss company for Swiss SMEs, so use
  Swiss Standard German: always `ss`, never `ß` (`Strasse`, `Grüsse`, `gross`, `Mass`,
  `gemäss`, `schliessen`, `weiss`, plus `dass`, `muss`). Applies to all German copy: site
  strings, emails and the quickscan PDFs. (Reverted from a brief High German `ß` pass back to
  Swiss `ss` on 2026-06-16 — Swiss readers expect `ss`.)
- **Exception: URL slugs keep hyphens** (`/website-abos`, `/so-funktioniert`) — that is
  the SEO standard and is intentional.
- The brand wordmark is `amai!` with a gold `!`; the literal domain `amai.ch` stays plain
  in titles/URLs/legal. Legal entity name in legal docs is `SEMANU BV`
  (Belgian BV, owner/manager Tom de Vree, VAT BE0828 291 116, Antwerpen).

**i18n:**
- Every user-facing string lives in `src/messages/{de,fr,en}.json`. Keep all three in
  parity (same keys, currently 122). DE is primary. New portal pages need DE/FR/EN too.
- Config in `src/i18n/` (routing, request, navigation). Use the locale-aware `Link`,
  `useRouter`, `usePathname` from `@/i18n/navigation` — not `next/link`/`next/navigation`.
- Inline links/wordmark in a string → `t.rich(key, { tag: (c) => <…>{c}</…> })`.
- **Emails are localized too.** All outgoing email copy lives in `src/lib/email/copy.ts`
  (one block per `EmailLocale` = de/fr/en), rendered by the shared house layout in
  `src/lib/email/branded.ts` (navy header + amai! wordmark, mint accents, personal
  "Tom von amai!" sign off). Order confirmation uses the order locale; the prospect
  report defaults to DE; portal emails (password reset, invite) default to EN because
  the portal UI is English. **When you add a 4th language, add its block to every table
  in `copy.ts` AND to `SIGNOFF` in `branded.ts`** — not only the message JSON files.
  Preview any time with `npx tsx scripts/send-email-previews.ts`.

**Design tokens (brand = "Marine + Mint", light & airy):**
- Tailwind v4 `@theme` in `src/app/globals.css`. Palette: `navy` (primary #1B2A4A),
  `ink` (teal-black #07221F), `ink-soft` (#2C4641), `paper` (cool light #EEF1F6),
  `paper-2` (#E2E8F2), `mint` (accent #93E6BE — the "!", checks, primary CTA),
  `hero-wash` (#E8F5EF), `band-tint` (#E9F2EE), `portfolio` (#F4F7FA), `ok` (#1F8A4C),
  `danger` (#D1453B, error/danger — stays red). The legacy names (`red`→navy,
  `spark`→mint, `ink`/`paper` repointed) are kept as ALIASES so existing
  `bg-red`/`text-spark` utilities stay on-brand; prefer the new names in new code.
  Use `font-display` (Archivo Black), `font-mono` (Space Mono). Pills: `rounded-pill`.
- Reusable primitives: `.btn`, `.btn-primary|-onink|-spark|-ghost|-ghost-ink`, `.eyebrow`,
  `.h1/.h2/.h3`, `.container-site`.

**Verification step:** after edits, run `npx tsc --noEmit` and a JSON parity check on the
three message files. Keep both green.

## Repository map (what exists)

```
content/
  blog/<slug>.<locale>.md         Markdown blog posts (gray-matter + marked)
  legal/{privacy,impressum,gtc}.<locale>.md   Published legal pages
legal-drafts/                     privacy-policy-draft.md, gtc-draft.md (lawyer source)
supabase/migrations/0001_init_leads.sql       leads table + RLS (apply + regen types)
src/
  i18n/                           routing/request/navigation (next-intl)
  messages/{de,fr,en}.json        ALL copy, keep in parity
  lib/
    env.ts                        lazy-validated env access
    validation.ts                 zod schemas (contact + checkout lead)
    blog.ts, legal.ts             markdown readers
    supabase/{client,server}.ts   browser / SSR (createServerSupabase) / admin (createAdminClient)
    types/database.ts             regenerate with `supabase gen types`
  components/                     Header, Footer, SiteShell, Brand, BrandLogo, LangSwitch,
                                  ContactForm, SubscribeForm, CustomSelect, CookieBanner,
                                  Analytics, LegalShell(unused)
    components/services/          Service page system: 3 flow layouts
                                  (FlowPresenceGrowth, FlowAutomationOperations,
                                  FlowSystemsIntelligence) + shared blocks.tsx +
                                  signature visuals.tsx. /services/[service] dispatches
                                  by FLOW_BY_ID. serviceDetail.ts holds per-service
                                  flow content (de/fr/en); serviceUi.* in messages.
  app/
    globals.css                   @theme tokens + primitives
    sitemap.ts, robots.ts
    [locale]/                     page(Home), website-abos, so-funktioniert, blog(+[slug]),
                                  faq, kontakt, checkout, datenschutz, agb, impressum,
                                  styleguide, layout.tsx
    api/leads/route.ts            POST validate → store via service role (email/Turnstile stubbed)
```

## Current state (done)

Marketing site (Home, pricing, how-it-works timeline, FAQ, blog, contact with form +
JSON-LD), legal pages live (privacy, Impressum, GTC) from `content/legal/`, custom
cookie banner, GA4 gated on consent, sitemap/robots, SEO metadata. Contact form posts to
`/api/leads` (needs Supabase env + Resend to actually store/email).

**Positioning (17.06.2026):** the homepage tells an AI-first digital-partner story across
four pillars (Websites, Portale, CRM Systeme, Automatisierungen) — broadened hero + subtitle
(DE/FR/EN) plus a four-pillar overview section that links into the existing `/services` pages.
No duplicate pillar pages: `/services/business-systems` already covers portals + CRM and
`/services/marketing-automation` covers automation. The website Ads/SEO landing pages stay
as the focused acquisition funnel — never point ads at the broad homepage. Cases belong on
the service pages + the central `/referenzen`. Full strategy + final copy in
`amai-positionering.docx` (repo root).

**Phase 5 — Stripe payments: the public self-serve checkout was REMOVED.** The public
`/checkout` and `/payment` pages, the `/api/checkout` route, the `SubscribeForm` and the
promo modal are gone; the plan and service CTAs now route to `/kontakt` instead of a
self-serve checkout. The internal portal billing module and the Stripe lib stay in place:
Plan→Price mapping in `src/lib/stripe/plans.ts`, the webhook `/api/stripe/webhook` (marks
an order paid, upserts the customer, mirrors the subscription, sends a Resend
confirmation, no-op without a key) and migration
`supabase/migrations/0002_init_billing.sql` (`customers`/`orders`/`subscriptions`, RLS
on) remain for internal billing. Full setup steps in `STRIPE_SETUP.md`.

## Business facts (needed for portal + billing)

- Entity (changed 2026-10-04): **SEMANU BV**, owner/manager **Tom de Vree**, Kattendijkdok-Oostkaai 9,
  2000 Antwerpen, Belgium. Company nr 0828.291.116, **VAT BE0828 291 116**. Email `hello@amai.ch`.
  NOTE: the site is still Swiss-positioned (amai.ch, CHF prices, Swiss VAT 8.1%, GTC under Swiss law /
  Bern courts, "Swiss agency" JSON-LD). These were intentionally left as-is and need Tom's decision —
  a Belgian BV with Swiss-law GTC / CHF / 8.1% VAT is inconsistent. Only the entity identity
  (name, address, VAT, register) was switched to SEMANU BV across legal pages, JSON-LD and footer.
- Plans (monthly recurring, all-in): **Website 99 CHF/mo** (the Beginner 35 CHF entry
  plan was DISCONTINUED 2026-06 — small one page projects are no longer offered),
  **Webshop 125 CHF/mo**. **Software & Applications** = quote/contact (ab 99 CHF/mo).
  **Google Ads** management = quote/contact (ab 195 CHF/mo). Add-on **Logo + brand
  guidelines 750 CHF one-time**.
- **RESTRUCTURE 2026-10 (rebrand + fresh start) — current structure:** the brand is now
  **amai** (no `!`; `Brand`/`BrandText` already render "amai", the literal "amai!" in strings
  stays as the wordmark marker). The site offers **four services** at `/services/<slug>`:
  **Consultancy** (`consultancy`), **Workflowautomatisering** (slug `workflow-automation`,
  internal id `marketing-automation`), **Maatwerksoftware** (slug `maatwerksoftware`, internal
  id `business-systems`), **3D-configuratoren** (`3d-configurators`). Internal ids were kept to
  avoid an id-wide rename. `services.ts` and `serviceDetail.ts` are **NL-first**: content is
  authored once in Dutch and reused across all 5 locale slots (DE/FR/EN/ES still to translate).
  **Prijzen** (`/website-abos`) and **Zo werkt het** (`/so-funktioniert`) were taken offline
  (deleted + 301). Removed services `websites`/`email-marketing`/`ai-assistants` 301 to
  maatwerksoftware/services/consultancy (see `next.config.mjs` redirects). **Eyebrows are hidden
  site-wide** (`.eyebrow { display:none }` + `Eyebrow` renders null). The website-* SEO landing
  pages are intentionally kept for now. NL copy source: `content-strategie-diensten-2026.md`.
  The 2026-06 note below is superseded for the service list.
- Services restructured 2026-06 (digital-agency pivot): **CRM Systeme** and **Kundenportale**
  are no longer standalone services, **Buchung und Termine** became **Consultancy**
  (independent digital advice, quote-based), and **Business Dashboards** became **Digitale
  Plattformen** (the umbrella for dashboards + CRM + customer portals, quote-based). The
  six services are now Websites, Email Marketing, Marketing Automation, Consultancy,
  Digitale Plattformen, AI Assistenten (+ Google Ads, quote-based).
- Pricing tiles (`src/content/pricingTiles.ts`, single source of truth): Website ab 99,
  Webshop ab 125, Email Marketing ab 79, Marketing Automation ab 129, AI Assistenten ab 99,
  Google Ads ab 195, Logo 750 one-time; **Digitale Plattformen and Consultancy show "Auf
  Anfrage"** (no fixed monthly price). The "ab 35 CHF" anchor was removed from all Google
  titles; the homepage/brand titles carry NO price (just the brand line), while the
  website-landing-page titles keep an indicative "ab 99 CHF". Scope and final price still
  agreed per customer.
- **Stripe billing model:** plan = recurring monthly subscription; add-on = a single
  one-time charge on top. Software & Applications and Google Ads are quote-based
  (route to /kontakt).
- GTC (live in `content/legal/gtc.*`, updated 2026-06-07): **36-month minimum term**;
  early cancellation by the customer (reasons not attributable to amai!) = the remaining
  monthly fees to the end of month 36 stay fully due; **CHF 190 administrative fee
  (excl. VAT) on any termination** (file handover + closure); changes after delivery
  95 CHF/h billed per started quarter hour (CHF 23.75); annual indexation (Swiss LIK);
  payment 14 days, 5% default interest, CHF 20 reminder fee; work starts 5 working days
  after first payment; design/code ownership transfers after the minimum term + full
  payment.
- Data/processors (already in the privacy policy): Supabase (DB, EU), Resend (email),
  Cloudflare (hosting/CDN, EU), GA4 (consent). Stripe to add.

## NEXT TASK — Phase 4 (portal)

**Phase 5 — Stripe: DONE** (see "Current state"). To make it live, follow
`STRIPE_SETUP.md`: create the four Prices, fill the `STRIPE_*` env vars, register the
webhook, apply migration `0002`, regenerate `database.ts`. Build with scaffolding only —
no live Stripe/Supabase calls were made.

**Phase 4 — Premium customer portal (the remaining back-end work):**
1. Supabase Auth (email magic-link or password). The SSR client `createServerSupabase()`
   in `src/lib/supabase/server.ts` is already scaffolded for cookie-based sessions.
2. Protected area, e.g. `src/app/[locale]/(portal)/…` with route protection (redirect
   unauthenticated to a login page). Keep DE/FR/EN.
3. Customer **dashboard** (subscription status from Stripe/Supabase), **document area**
   (Supabase Storage + RLS per customer), request/quote workflow.
4. Admin view of `leads`/orders behind an explicit RLS `SELECT` policy (never open the
   table to `anon`).

**Migrations:** add tables (customers, subscriptions, documents, …) under
`supabase/migrations/`, enable RLS with per-user policies, and regenerate
`src/lib/types/database.ts`. Follow the existing `0001_init_leads.sql` style (RLS on).

**Env to add** (see `.env.example`): `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, plus the existing Supabase/Resend/Turnstile/GA keys.

## Don't

- Don't break the copy style rules above (no dashes, no comma-before-conjunction).
- Don't add strings outside the message files, or leave the three locales out of parity.
- Don't expose `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` to the client.
- Keep the brand "Marine + Mint" (navy + mint on a light base). Errors/danger use the
  `danger` token (red), NOT the brand. The legacy `red`/`spark` names stay as aliases
  pointing at the new palette (see globals.css) — do not delete them.
