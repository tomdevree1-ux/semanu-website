# Security hardening — open items (for the back end / Stripe session)

From the audit (`AUDIT.md`). The marketing/SEO/headers fixes are done; these touch
the API routes + deps and are best handled by the session that owns Stripe/portal.
Keep `npx tsc --noEmit` green and the three locale files in parity.

## 🔴 Before launch

### 1. Cloudflare Turnstile on the public POST endpoints
Both `/api/leads` and `/api/checkout` write to the DB via the service role with only
a honeypot. Add a real CAPTCHA.
- Env already scaffolded: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- Client: render the Turnstile widget in `ContactForm.tsx` and `SubscribeForm.tsx`,
  send the token in the JSON body (`turnstileToken`; the leads zod schema already
  has an optional `turnstileToken`, add it to `checkoutSchema` too).
- Server: in `src/app/api/leads/route.ts` and `src/app/api/checkout/route.ts`,
  verify the token against `https://challenges.cloudflare.com/turnstile/v0/siteverify`
  before storing/charging (there are TODO markers in both files).

### 2. Rate limiting on `/api/leads` and `/api/checkout`
No throttling today → a bot can fill `leads`/`orders` and create Stripe sessions.
- Easiest: a Cloudflare rate-limiting rule on `/api/*`.
- Or in-app: `@upstash/ratelimit` + Upstash Redis, keyed on the client IP
  (`x-forwarded-for`), e.g. 5 requests / minute / IP. Return `429` on limit.

## 🟠 Soon after

### 3. `/api/checkout` redirect URLs
`success_url` / `cancel_url` are built from `req.headers.get('origin')`. Use the
trusted `env.siteUrl` instead so the redirect target cannot be influenced by a
spoofed `Origin` header.

### 4. Escape the admin notification email
In `src/app/api/stripe/webhook/route.ts`, the admin email interpolates `to` and
`plan` into HTML without escaping (only `firstname` is escaped in
`confirmationHtml`). Run every interpolated value through `escapeHtml`.

### 5. next-intl advisory
`npm audit` flags an open-redirect advisory (GHSA-8f24-v5vv-gm5j) in next-intl.
`npm i next-intl@latest`, then `npx tsc --noEmit` + a quick `npm run dev` smoke test.

## 🟢 Later / Phase 4

### 6. Nonce-based CSP
`next.config.mjs` ships a working CSP, but `script-src` uses `'unsafe-inline'` for
the GA init. Move to a per-request nonce (middleware sets a nonce header + GA script
uses it) to drop `'unsafe-inline'`.

### 7. Link `customers.user_id` at portal sign-in
The webhook inserts `customers` with `user_id = null`. When Supabase Auth lands
(Phase 4), match the signed-in user to their customer row (by email or at first
login) and set `user_id`, otherwise the owner `SELECT` RLS policy on
`customers`/`subscriptions` will not return anything in the portal.

## ✅ Already done (this pass)
Security headers (CSP/HSTS/nosniff/Referrer-Policy/Permissions-Policy/X-Frame-Options)
in `next.config.mjs`; structured data; favicon/manifest/OG; `llms.txt`; About page.
Stripe webhook signature verification + server-side amounts were already correct.
