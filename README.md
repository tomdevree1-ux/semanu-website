# amai.ch

Production website (DE/FR/EN) and internal admin portal for `amai.ch`, a Swiss
"website subscription" service.

> **New here?** Read [`CLAUDE.md`](./CLAUDE.md) for the working context and the
> copy + brand rules. The brand is **Marine + Mint** (navy `#1B2A4A` + mint
> `#93E6BE` on a light base); legacy token names like `red`/`spark` are kept as
> aliases that now point at the new palette. See [`BUILD_PLAN.md`](./BUILD_PLAN.md)
> for the phased plan.

## Stack

Next.js (App Router, TypeScript) · next-intl (DE default, FR, EN) · Tailwind CSS v4
(CSS-first design tokens) · Supabase (Postgres + Auth) · zod validation.

## Quick start

```bash
npm install
cp .env.example .env.local      # fill in Supabase + email keys
npm run dev                     # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`, `npm run typecheck`.

> **Multipage**, per language. The bare `/` redirects to a locale. Pages:
> `/{locale}` (Home), `/{locale}/website-abos`, `/so-funktioniert`, `/blog`
> (+ `/blog/[slug]`), `/faq`, `/kontakt`, plus `/impressum` · `/datenschutz` · `/agb`
> and an internal `/styleguide` (noindex). Remaining pixel polish is Phase 2 — see the
> build plan.

## Internationalisation

- German is the default locale; **every** URL is prefixed (`/de`, `/fr`, `/en`)
  via `localePrefix: 'always'`. The bare `/` redirects to the detected/default locale.
- Copy lives in `src/messages/{de,fr,en}.json` (kept in parity across locales).
  Longer typed content also lives under `src/content/` (services, FAQ, pricing
  tiles, landing pages), one block per locale.
- Routing/config: `src/i18n/`, `middleware.ts`.

## Blog

- Markdown posts in `content/blog/<slug>.<locale>.md` (frontmatter + body), read by
  `src/lib/blog.ts` (`gray-matter` + `marked`). Add a post = add a file.

## Backend (Supabase)

- Migration: `supabase/migrations/0001_init_leads.sql` (the `leads` table, RLS
  locked). Apply it and regenerate types — see [`supabase/README.md`](./supabase/README.md).
- Form endpoint: `src/app/api/leads/route.ts` (validates with `src/lib/validation.ts`,
  inserts via the service-role client; Turnstile + notification email are stubbed for
  Phase 3).
- Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.

## Billing model (Stripe)

- **Plans = monthly recurring subscriptions:** Business Website 99 CHF/mo, Webshop
  125 CHF/mo. The broader services (Email Marketing, Marketing Automation, Digital
  Platforms, Consultancy, AI Assistants, Google Ads) carry indicative "ab" prices in
  `src/content/pricingTiles.ts`.
  > History: the Beginner 35 CHF/mo entry plan and the old Beginner/Business/Webshop
  > tiering (with Webshop at 149) were discontinued in June 2026; small one page
  > projects are no longer offered. The entry plan is now Business Website 99 CHF/mo,
  > Webshop 125 CHF/mo. `src/content/pricingTiles.ts` is the live source of truth and
  > the GTC, landing pages and Service schema were updated to match.
- **"Logo + brand guidelines" add-on = a one-time 750 CHF charge** on top.
- **Software & Applications and Google Ads are quote-based** and route to `/kontakt`.

The public self-serve `/checkout` was removed; the plan and service CTAs route to
`/kontakt`. The internal billing module (the Stripe webhook plus the
`customers`/`orders`/`subscriptions` tables) stays in place — see
[`STRIPE_SETUP.md`](./STRIPE_SETUP.md).

## Admin portal

The internal admin portal (CRM, sales, finance, website-funnel tooling) is a
separate route group, `src/app/(portal)/`, served under `/app/*` and isolated
from the multilingual marketing site (English only, `noindex`, hard-gated by
`PORTAL_ENABLED`). Auth + per-request RBAC live in the `(protected)` layout
(`requireAuth` + a permission set); every nav item and page is permission-gated.

**Design system.** One shell — `src/components/portal/shell/PortalShell.tsx`
(sidebar + topbar + command palette ⌘K + toasts) — styled by
`src/app/(portal)/portal.css`, the "Marine + Mint" hifi system ported from the
admin-panel handoff. It supports three live themes via the `data-richting`
attribute (`helder` default · `commando` dark · `redactie` editorial) plus
`data-density` and `data-motion`. Reusable classes: `.card`, `.kpi`, `.tbl`,
`.board/.col/.kcard` (kanban), `.drawer`, `.chip`, `.pa-btn*`, `.pa-eyebrow`.

**Conventions — keep the portal uniform:**

- **Fonts:** Archivo (UI / `--sans`), Archivo Black (`--black`, headings and
  `.page-title`), Space Mono (`--mono`, labels / IDs / amounts). Loaded in
  `(portal)/layout.tsx`; never fall back to a system font.
- **Form controls are house-styled globally** in `portal.css` (the `FORM CONTROLS`
  block): native `select/input/textarea/checkbox/radio` inherit the brand font and
  render Marine + Mint (custom select chevron via `appearance:none`, mint
  check/radio marks, focus ring). Use plain native controls — they pick up the
  house style automatically. For a fully house-styled dropdown whose *open* list is
  not OS-drawn, use `PortalSelect` (`src/components/portal/ui/PortalSelect.tsx`,
  pill/block variants) — it backs the lead stage/channel/owner controls and the
  shared list filters (`ListChrome`).
- **Notifications:** the topbar bell (`NotificationsMenu`) shows an alert dot only
  when there are unread items and opens a house-style panel. The feed is built
  server-side in the `(protected)` layout (currently the new-lead count); add more
  sources to that array.
- **Leads are a full sales pipeline**, not a triage list. The board is a kanban
  across eight stages — To contact · New · Assigned · Contacting · Proposal · Won ·
  Lost · On Hold — with drag-to-move, a per-lead **owner** (assign to any admin/sales
  user), a **channel** field and versioned **notes**. Repeat submissions from the same
  person are de-duplicated onto one lead's timeline (matched by email then phone)
  instead of creating a new row. From **Contacting** onward the lead is mirrored into
  the CRM (Company + Contact, deduped by business-email domain); **Won** also creates a
  Project. Leads can be added manually (`/app/leads/new`) and **Lost** always requires a
  reason. Types/queries/actions live in `src/modules/leads/`.

**Auth, resets & invites.** The pre-auth pages (`/app/login`, `/app/forgot-password`,
`/app/reset-password`) are English and share `AuthCard`. Reset + invite emails are
generated server-side (Supabase admin `generateLink`) and delivered through the
`outbox` table → Resend worker, pointed at our own `/app/auth/confirm` route
(token-hash flow, not the Supabase action link). Password resets only fire for
**active** accounts; an **invited** user must finish their invite first (which also
activates them). To (re)send an invite outside the portal UI (Users → user → Resend
invite), run `scripts/send_invite.py <email> [FirstName]`: it mints a fresh invite link
and emails it via Resend, CC'ing `tom@amai.ch`. Resend sits behind Cloudflare, which
blocks the default `Python-urllib` User-Agent with error `1010`, so the script sends a
browser User-Agent and must run **off the Cowork sandbox** (e.g. on your Mac).

New portal pages should reuse the `portal.css` primitives rather than ad-hoc
Tailwind, so they stay consistent with the design system.

## Project layout

See the tree in [`BUILD_PLAN.md`](./BUILD_PLAN.md#repository-layout).
