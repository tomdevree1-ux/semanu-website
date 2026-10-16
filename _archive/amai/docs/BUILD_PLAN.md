# amai.ch — Build Plan

Production rebuild of the `amai.ch` marketing site (and the back-end behind it)
from the high-fidelity "Signal-Rot" handoff prototype.

**Stack:** Next.js (App Router, TypeScript) · next-intl (DE/FR/EN) · Tailwind CSS v4
(CSS-first tokens) · Supabase (Postgres, Auth, Edge Functions) · transactional email
(Resend or Postmark) · hosting on Vercel (recommended).

**Status:** Phase 0 complete + restructured from a one-pager to a **multipage** site
with a per-language prefix (`/de`, `/fr`, `/en`). Built: Home (landing with teasers),
Website-Abos (real pricing page), So-funktioniert, FAQ, Kontakt (real page + working
form + JSON-LD), a Markdown **Blog** (index + posts in 3 languages), legal stubs,
`sitemap.xml` + `robots.txt`. Phases 1–6 below.

---

## ⚠️ Brand note — read before touching colours

The handoff names the brand **"Signal-Rot" (signal red)** and the README's token
table is red-dominant. The prototype stylesheet (`styles-red.css`), however, opens
with a **yellow** palette and then **overrides it** with a *second* `:root` block
that re-points the same variable names (`--yellow`, `--ink`, …) to the red values.
The later block wins, so the rendered prototype — and the brand guide
(`AMAI Huisstijl.html`, which also uses the red override) — are **red**. Red is
canonical.

In this codebase the tokens use **correct semantic names** (`--color-red`,
`--color-ink` = bordeaux, `--color-spark` = gold) so nothing is misleading. If you
open the reference files and see `--yellow: #E5392B`, that is the legacy naming, not
a different colour.

Canonical tokens (`src/app/globals.css` → `@theme`):

| Token | Hex | Role |
|---|---|---|
| `--color-red` | `#E5392B` | primary / dominant background |
| `--color-red-deep` | `#C82A1E` | hover/darker red |
| `--color-ink` | `#4A1419` | bordeaux — dark sections, body text on light |
| `--color-ink-soft` | `#7A3A33` | muted body text on light |
| `--color-paper` | `#FBF1EF` | light/cream sections & cards |
| `--color-paper-2` | `#F6E4E1` | secondary paper |
| `--color-spark` | `#F7B500` | **gold** — the "!", eyebrows on dark, prices, accents |
| `--color-ok` | `#1F8A4C` | success |

Radii: `--radius-card 16px`, `--radius-lg 24px`, `--radius-pill 100px`.
Type: **Archivo Black** (display), **Archivo** (body/UI), **Space Mono** (labels/eyebrows/prices).
Contrast rule: on red/bordeaux → white/paper text + gold accents; on paper → bordeaux text + red eyebrows. Required-field asterisks and inline errors are **red**.

---

## Architecture decisions

- **Framework:** Next.js App Router. Server-render localized copy from message
  files (the prototype mutated the DOM at runtime; we don't — strings come from
  `src/messages/*.json`).
- **i18n & routing:** `next-intl` with `defaultLocale: 'de'` and
  `localePrefix: 'always'` — **every** URL carries its language segment
  (`/de`, `/de/website-abos`, `/fr/...`, `/en/...`); the bare `/` redirects to the
  detected/default locale. This is the explicit "tussenstuk per taal" structure the
  client asked for, and it's clean for SEO (per-locale canonical + `hreflang`).
- **Styling:** Tailwind v4, configured CSS-first via `@theme` in `globals.css`.
  Brand tokens generate utilities (`bg-red`, `text-ink`, `font-display`, …); raw
  `var(--line)` etc. cover alpha hairlines. Reusable primitives (`.btn`, `.eyebrow`,
  `.h1/.h2/.h3`, `.container-site`) are ported into `@layer components`.
- **Backend:** Supabase. Postgres for form submissions now; Auth + RLS + Edge
  Functions for the Premium portal/payments later.
- **Secrets:** `/api/leads` writes with the service-role key (server-only, bypasses
  RLS). The `leads` table has RLS enabled with **no policies** — fully locked.
- **Hosting:** Vercel recommended (first-class Next.js, preview deploys, edge).
  Confirm with client.

### Information architecture (multipage)

`/{locale}` Home (landing) · `/{locale}/website-abos` (pricing) ·
`/{locale}/so-funktioniert` · `/{locale}/blog` (+ `/blog/[slug]`) · `/{locale}/faq` ·
`/{locale}/kontakt` · legal: `/impressum`, `/datenschutz`, `/agb` ·
`/{locale}/styleguide` (noindex, internal). Header/Footer link to these with
locale-aware `<Link>`.

- **Contact is a real page, not a modal (SEO).** A modal-only contact has no
  crawlable URL — nothing to index, no stable target for `LocalBusiness`/
  `ContactPoint` structured data, nothing for Google Business / external sites to
  link to. `/kontakt` is server-rendered, indexable, carries JSON-LD, and **every
  primary CTA routes to it** (the start modal was dropped per the client's choice).
- **Blog = Markdown in the repo (best practice for a dev-built site).** Posts are
  `content/blog/<slug>.<locale>.md` (frontmatter via `gray-matter`, rendered with
  `marked`). Fast, free, versioned, great SEO. Swap `src/lib/blog.ts` for a headless
  CMS later if non-technical editors need to publish — pages won't change.
- **SEO scaffolding:** native `sitemap.ts` (all locales × pages + blog posts) and
  `robots.ts`; per-page `generateMetadata` with canonical + `hreflang`.

---

## Repository layout

```
amai/
├── BUILD_PLAN.md                ← this file
├── README.md                    ← quick start
├── design-reference/            ← the original handoff (source of truth for pixels)
├── content/blog/                ← Markdown posts: <slug>.<locale>.md
├── public/                      ← portfolio images staged here (+ favicon/OG later)
├── supabase/                    ← README + migrations/0001_init_leads.sql
├── middleware.ts                ← next-intl locale routing
└── src/
    ├── i18n/                    ← routing (localePrefix 'always'), request, navigation
    ├── messages/                ← de.json / fr.json / en.json (102 keys, in parity)
    ├── components/              ← Header, Footer, SiteShell, Brand, LangSwitch,
    │                              ContactForm, LegalShell
    ├── lib/
    │   ├── env.ts               ← lazy-validated env access
    │   ├── validation.ts        ← zod schemas (both forms)
    │   ├── blog.ts              ← read/parse Markdown posts
    │   ├── supabase/            ← browser / server / admin clients
    │   └── types/database.ts    ← regenerate with `supabase gen types`
    └── app/
        ├── globals.css          ← @theme tokens + primitives
        ├── sitemap.ts           ← all locales × pages + blog posts
        ├── robots.ts
        ├── [locale]/
        │   ├── layout.tsx       ← fonts, metadata, NextIntlClientProvider
        │   ├── page.tsx         ← Home (hero + section teasers + CTA)
        │   ├── website-abos/    ← pricing page (plans + add-on)
        │   ├── so-funktioniert/ ← how-it-works (4 steps)
        │   ├── blog/            ← index + [slug]/ post page
        │   ├── faq/             ← accordion (10 items)
        │   ├── kontakt/         ← contact page (form + JSON-LD)
        │   ├── styleguide/      ← internal token reference (noindex)
        │   └── impressum|datenschutz|agb/   ← legal stubs
        └── api/leads/route.ts   ← POST handler (validate → store; email stubbed)
```

---

## Phase 0 — Scaffold + multipage restructure ✅ (done)

Project structure, tooling, tokens, i18n wiring, Supabase integration skeleton and
the leads migration. Restructured to a **multipage** site (`localePrefix: 'always'`):
Home (hero + teasers), Website-Abos (real pricing from ported data), So-funktioniert
(4 steps), FAQ (10 items), Kontakt (working form + JSON-LD), a Markdown Blog (index +
`[slug]`, sample post ×3 locales), `sitemap.ts`/`robots.ts`, and a `/styleguide`.
Copy for nav, hero, pricing, how, FAQ and contact is ported across DE/FR/EN
(102 keys, in parity).

---

## Phase 1 — Foundations & full content port

- [ ] `npm install`, confirm `npm run dev` and `npm run build` are green.
- [ ] **Port the remaining copy** into `src/messages/*.json`. Already ported: nav,
      hero, pricing/plans, add-on, how, FAQ, contact, footer, meta (102 keys, in
      parity). Still to pull: **Problem** (8 pain points), **Solution** (checklist +
      callout), **Portfolio** and **trust/CTA** strings — **DE** from the `data-i18n`
      elements in `design-reference/…Signal-Rot.html`, **FR/EN** from
      `design-reference/i18n.js`. Keep the same key names.
- [ ] Decide rich-text handling for strings containing the **amai!** wordmark
      (use `t.rich` with a `<brand>` tag, as the hero already demonstrates).
- [ ] Port remaining primitives/section styles from `styles-red.css` as needed.
- [ ] Add `not-found.tsx` (localized) and a localized error boundary.
- [ ] Wire favicon, app icons. (OG/Twitter images can come in Phase 6.)

**Done when:** every visible string is locale-driven; switching language changes
all copy + `<title>`/meta; build is green.

---

## Phase 2 — Pixel-faithful build-out, page by page

Pages exist and are locale-driven; now bring each to the reference's fidelity
(`design-reference/`). Extract reusable sections into `src/components/sections/`.

- [ ] **Header** polish: hamburger ≤980px, wordmark 360° spin on hover (gated by
      `prefers-reduced-motion`); active-link state.
- [ ] **Home** — finalize hero browser mock + floating badges; add the **Problem**
      (8 pain cards, distinct **gold line icons**: clock, phone, magnifier, shield,
      envelope, wrench, gear, price-tag), **Solution** (checklist + bordeaux callout),
      **Portfolio** carousel and trust band. (Free-analysis section was removed — do
      not re-add.)
- [ ] **Portfolio carousel** — auto-slide (3.6s, pause on hover, recycle on
      `transform` `transitionend` only; edge-mask gradient). Cards = browser frame
      (blank address bar) + screenshot; live = green pulsing dot, In-Entwicklung =
      amber. Images already in `public/portfolio/`.
- [ ] **Website-Abos** — polish the built pricing page to match the reference card
      styling (featured Business card, "MOST CHOSEN" badge, add-on banner).
- [ ] **So-funktioniert / FAQ / Kontakt** — built; refine to reference (FAQ:
      one-open-at-a-time accordion; Kontakt: response-time/visual polish).
- [ ] **Blog** — list/post styling, optional categories, RSS.
- [ ] **Cookie banner** — slides up after 0.8s; "Alle akzeptieren" / "Nur
      notwendige"; persist via cookie (so SSR can read it).
- [ ] ~~Start modal~~ — **dropped** per client decision; all CTAs link to `/kontakt`.
- [ ] **Reveal-on-scroll** via IntersectionObserver; **respect reduced-motion**.

**Done when:** every page matches the reference across breakpoints in DE/FR/EN.

---

## Phase 3 — Forms back-end

The contact form on `/kontakt` is built: `novalidate` + JS, shared zod validation
(`src/lib/validation.ts`), localized inline errors, honeypot, and an inline success
state — it posts to `/api/leads`. The start modal was dropped; its CTAs route to
`/kontakt`. What's left is the server side:

- [ ] Apply `supabase/migrations/0001_init_leads.sql`; regenerate `database.ts`.
- [ ] Provision Supabase + fill `.env.local` so the route actually stores rows.
- [ ] **Admin notification email** (Resend or Postmark) on submit; don't block the
      response on a slow send (fire-and-forget with logging, or queue/Edge Function).
- [ ] **Spam protection:** honeypot (already in schema) **+ Cloudflare Turnstile**;
      verify the token server-side in the route.
- [ ] **Consent** (Swiss DSG / GDPR) — required checkbox already modeled; store it.
- [ ] Inline success state is built; keep it in sync with server responses.
- [ ] Rate-limit the endpoint (e.g. per-IP) and log failures.

**Done when:** a submission stores a row, emails the admin, returns success for the
UI, and bots are filtered.

---

## Phase 4 — Premium portal (sold on the site)

- [ ] Supabase Auth (email/OTP or password) + session via the SSR server client
      (`createServerSupabase`, already scaffolded).
- [ ] Authenticated area under `src/app/[locale]/(portal)/…` with route protection.
- [ ] Customer **dashboard**, **document area** (Supabase Storage + RLS), and a
      request/quote workflow.
- [ ] Admin view of `leads` behind an explicit RLS `SELECT` policy (or a separate
      admin app). Never open `leads` to `anon`.

**Done when:** a Premium customer can log in and use the dashboard/documents.

---

## Phase 5 — Payments

- [ ] Stripe products/prices mapped to plans (Starter 49, Business 99, add-on 950
      one-time; Premium custom/quote-based).
- [ ] Stripe Checkout + Customer Portal; webhooks → Supabase (subscription status).
- [ ] Gate Premium features on subscription state.

**Done when:** a customer can subscribe and manage billing; entitlements reflect it.

---

## Phase 6 — SEO, performance, a11y, launch

- [ ] Per-locale metadata (in place), `sitemap.xml`, `robots.txt`, `hreflang`.
- [ ] OG/Twitter images (per-locale), structured data (Organization, Product/Offer).
- [ ] Styled localized **404/500**.
- [ ] Performance: image optimization (`next/image`), font-display, Lighthouse ≥95.
- [ ] Accessibility pass: focus management (modal), keyboard nav, contrast, labels.
- [ ] **Fill the legal pages** (Impressum/Datenschutz/AGB) with real company data
      and have them **legally reviewed** (currently placeholder stubs).
- [ ] Analytics (privacy-friendly; respect cookie consent), error monitoring.
- [ ] CI (typecheck + lint + build) and production deploy + custom domain/DNS.

---

## Cross-cutting

- **Testing:** unit (zod schemas, utils), component (Testing Library), a couple of
  Playwright e2e flows (language switch, form submit, modal).
- **Quality gates:** `npm run typecheck` + `npm run lint` in CI. (Build ignores lint
  by config so a style nit never blocks a deploy; CI enforces it separately.)
- **Performance budget:** keep the marketing pages JS-light (most are static/RSC).

---

## Open questions for the client

1. **Hosting** — Vercel ok? Where's the domain/DNS today?
2. **Email provider** — Resend vs Postmark? Sending domain for `noreply@amai.ch`?
3. **Premium portal & payments** — in scope now, or after the marketing launch?
4. **Stripe** — confirm plan→price mapping and whether Premium is quote-only.
5. **Legal content** — who supplies Impressum/Datenschutz/AGB text + review?
6. **Analytics** — preferred tool, and consent behavior (the cookie banner gates it).
7. **Contact details** — confirm `hallo@amai.ch`, Bern, and the stated response time.
