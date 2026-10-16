# Security posture — amai.ch

Verified 2026-06-15. This documents how the app is secured and the known residual
items, so a review can see the reasoning, not just the code.

## Authentication & access control

- **Row Level Security on every table.** `orders`, `leads`, `outbox`, `rate_limit`,
  `stripe_events` etc. have RLS enabled with **zero policies** → deny-all, reachable only
  by the server's service-role key (which bypasses RLS). No `anon`/`authenticated` access
  to lead/order data. Customer-facing tables (`customers`, `subscriptions`) are
  owner-scoped (`authenticated`, select-own) for the future portal.
- **Admin area** (`/admin`): single-password gate. The password never reaches the browser;
  the session cookie is an HMAC of a server secret (httpOnly, secure, sameSite=lax). Login
  is **rate-limited** (5 / 15 min per IP). Constant-time password comparison.
  - *Residual:* single shared password, deterministic 30-day token (no per-user / MFA).
    Acceptable for a solo operator; revisit if the team grows.
- **Server-authoritative feature flags** for every non-core capability (portal, Stripe
  mutations, AI report generation, webhooks). Default off — code ships dark.

## Secrets

- Service-role key, Stripe secret, webhook secret, AI key, PDF-service secret are all
  **server-only** (no `NEXT_PUBLIC_` prefix) and documented as such. Only the publishable
  Stripe key, Supabase anon key, site URL, GA id and Turnstile site key are public — all of
  which are public by design (RLS enforces the anon key's limits).
- `.env.example` lists every variable; `.env*` is git-ignored; no secrets are committed.

## Network & headers

- Security headers on every response: **CSP**, **HSTS** (2y, includeSubDomains, preload),
  `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy` (camera/mic/geo off). Portal/transactional routes add
  `Cache-Control: no-store` + `X-Robots-Tag: noindex`.
- CSP: `default-src 'self'`, `object-src 'none'`, `base-uri 'self'`,
  `frame-ancestors 'none'`, strict host allowlist for scripts/connect/frames (GA, Stripe,
  Turnstile, Supabase), `unsafe-eval` only in dev.
  - *Residual:* `script-src` keeps `'unsafe-inline'` (for the GA init snippet). Verified
    there is **no HTML-injection sink**: every `dangerouslySetInnerHTML` renders
    repo-authored markdown (legal/blog), our own JSON-LD, or a static `<style>`; user input
    (e.g. contact messages) is React-escaped. So practical XSS exposure is low. The proper
    fix is a per-request **nonce CSP**; it is entangled with the next-intl middleware and
    must be browser-verified on a preview deploy before shipping (it can break hydration if
    wrong), so it is intentionally not shipped blind.

## Input validation & abuse

- All public POST bodies validated with **zod** (checkout, contact, funnel).
- **Rate limiting** (fixed-window, centralised in Postgres, hashed IP/email — never raw)
  on checkout, contact, funnel submit and admin login. Fails open on limiter error.
- **Cloudflare Turnstile** + a hidden **honeypot** on public forms.
- **Stripe webhook** verifies the signature (`constructEvent`) and 400s on mismatch;
  a `stripe_events` table backs idempotency.
- Cron route guarded by a `CRON_SECRET` bearer token.

## Data & privacy

- Rate-limit identifiers are SHA-256 hashed with a server pepper (no raw IP/email stored).
- Error tracking (Sentry) runs with `sendDefaultPii: false` — no IP/cookies/user data sent;
  ships dark without a DSN.
- Processors (Supabase EU, Resend, Cloudflare, Stripe, GA on consent) are in the privacy
  policy; GA loads only after explicit cookie consent.

## Observability & delivery

- **Sentry** server/edge capture via `instrumentation.ts` + `captureError()` on the
  critical paths (checkout, webhook). See `OBSERVABILITY.md`.
- **CI** (`.github/workflows/ci.yml`): typecheck + lint + 47 Vitest files + `npm audit` on
  every push/PR. **Dependabot** weekly. **Playwright** E2E smoke for the checkout wizard
  (`.github/workflows/e2e.yml`, manual trigger until selectors are confirmed green).
- Deploys via Vercel on push to `main`; DB migrations under `supabase/migrations/`.

## Known residual items (prioritised)

1. **CSP nonce** — remove `script-src 'unsafe-inline'`; do it against a preview + browser
   smoke (low practical risk today, see above).
2. **Admin** — per-user accounts + MFA if the team grows.
3. **Sentry source maps + client capture** — add `withSentryConfig` + an
   `instrumentation-client.ts` when readable browser stack traces are wanted.
4. **Promote the E2E workflow** to push/PR once the selectors pass one green run.
