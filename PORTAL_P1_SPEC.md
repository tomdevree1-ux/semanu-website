# Portal — P1 Auth Technical Implementation Specification

> Source of truth: `AMAI_PORTAL_MASTER_PLAN.md` (Part B authoritative). This spec covers
> **P1 (Auth) only**. **No code is written yet.** It respects the **as-implemented P0**, which
> was applied *additively on the existing amai schema* (not the from-scratch design): `profiles`
> keeps `full_name` + `is_active` and gained `first_name/last_name/status/avatar_url/created_by`
> (a `profiles_sync_active` trigger keeps `is_active` ⇄ `status`); roles are the existing
> `roles`(smallint: admin/analyst/sales/reviewer/read_only) + `user_roles`; auth helpers are the
> live `is_admin()/is_staff()/has_role()/has_permission()/current_org()/get_user_permissions()`;
> audit is `audit_logs` (extended) + `log_event()`/`audit_history()`; plus `outbox`/`email_log`,
> `rate_limit`/`hit_rate_limit()`, and a private `avatars` bucket. amai Supabase ref
> `bkwwlmflsbhrsfwydbnv`.

---

## 1. P1 objective

**Achieve:** a working, secure authentication surface for the internal platform at **`/app`**,
isolated from the multilingual marketing site, using **Supabase Auth (email + password)**.
A user can sign in, stay signed in (SSR session refresh), sign out, and reset a forgotten
password through a **branded Resend email sent via the P0 outbox**. Disabled accounts are
rejected on the next request. After login the user lands on a **minimal protected dashboard
placeholder** inside a basic **PortalShell** with the gold `!` spinner.

**Must NOT include:** user-management screens, profile editing, avatar upload, the history-
timeline UI, any CRM/ERP/finance/NDA module, a role editor, external-client portal, or the
old `/admin` migration. No new business logic on `leads/customers/orders/subscriptions/old
documents/old requests`. No new P0 migrations unless a specific corrective one is listed here
(none required).

**Done when:** a seeded active user logs in and reaches `/app/dashboard`; a guest is redirected
to `/app/login`; an authenticated user visiting `/app/login` is sent to the dashboard; a
disabled user is rejected; forgot→reset works end-to-end (email enqueued, worker sends, link
resets, account activates if invited); `npx tsc --noEmit` is clean; tests (§13) pass; the
marketing site and `/[locale]/admin` are untouched.

---

## 2. Dependency check from P0 (as implemented)

| P0 dependency | State | How P1 uses it |
|---|---|---|
| `profiles` | live (full_name, is_active, **status**, last_login_at, …) | `requireAuth()` reads `status='active'`; login updates `last_login_at` |
| `organization_members` + `current_org()` | live | not gated in P1 (single org); `current_org()` only feeds `log_event` org scoping |
| `permissions` / `role_permissions` / `has_permission()` | live | available via `requirePermission()`, **not used by P1** (dashboard is `requireAuth` only) |
| `requireAuth()` | `src/lib/security/rbac.ts` | guards the protected layout + every auth server action |
| `requirePermission()` | `rbac.ts` | present for later phases; **not used in P1** |
| `outbox` + `enqueueEmail()` | live + `src/lib/outbox/enqueue.ts` | enqueue the branded reset email |
| `email_log` | live | written by `complete_outbox()` when the worker sends/fails |
| `rate_limit` + `hit_rate_limit()` + `checkRateLimit()` | live + `src/lib/security/ratelimit.ts` | throttle login / forgot / reset |
| `log_event()` + `logEvent()` | live (service-role only) + `src/lib/audit/log.ts` | audit auth events |
| status handling | `profiles.status` + `profiles_sync_active` trigger | disabled enforcement |
| server-only Supabase clients | `createServerSupabase()` (cookie), `createAdminClient()` (service role) | session + admin (generateLink, ban) |

**Prerequisite (small):** the libs `rbac.ts` / `authorize.ts` / `audit/log.ts` /
`outbox/enqueue.ts` were drafted against the from-scratch schema and must be **synced to the
live schema** (task #73) before P1 — `database.ts` regenerated from the live DB, `Profile`
pointing at the real `profiles` row, `requireAuth` reading the live `status`. P1 assumes #73 is
done. The **outbox worker** also needs its runner (`/api/cron/outbox` + Vercel Cron) wired in P1.

---

## 3. Routing plan

Portal lives **outside** `[locale]`, English-only, under a route group so it has its **own root
layout** (the marketing root stays `src/app/[locale]/layout.tsx`, untouched):

```
src/app/(portal)/
  layout.tsx                       PUBLIC root: <html><body>, English, no NextIntlProvider, PortalShell(public)
  app/
    login/page.tsx                 PUBLIC
    forgot-password/page.tsx       PUBLIC
    reset-password/page.tsx        PUBLIC (link/token-gated)
    auth/callback/route.ts         PUBLIC route handler (code exchange)
    (protected)/
      layout.tsx                   requireAuth() guard + authed PortalShell
      dashboard/page.tsx           PROTECTED
src/app/api/cron/outbox/route.ts   PUBLIC but CRON_SECRET-guarded (worker trigger)
```

| Route | Access | Redirect rule |
|---|---|---|
| `/app/login` | public | if already authenticated **and active** → `/app/dashboard` |
| `/app/forgot-password` | public | — |
| `/app/reset-password` | public (token) | invalid/expired token → `/app/forgot-password` (generic msg) |
| `/app/auth/callback` | public | exchanges `code` → recovery: `/app/reset-password`; else `/app/dashboard`; failure: `/app/login?error=link` |
| `/app/dashboard` | protected | unauthenticated/disabled → `/app/login` |
| sign-out | action (POST) | always → `/app/login` |

- **`/app` excluded from i18n:** the middleware branches — for `pathname.startsWith('/app')`
  (and `/api/cron`) it runs the Supabase session refresh and returns, **without** next-intl, so
  no `/de`-style prefix is added. Everything else still goes through `createMiddleware(routing)`.
  Two root layouts are allowed because there is **no** `src/app/layout.tsx` today; if `next
  build` requires both branches to be route groups, move the existing `[locale]` into
  `src/app/(site)/[locale]` — a **URL-neutral folder move, no marketing code change** (validate
  with `next build`).
- **Marketing untouched:** no file under `[locale]/` changes; `/[locale]/admin` (password gate)
  stays as-is.

---

## 4. Middleware / session plan

- **New** `src/lib/supabase/middleware.ts` → `updateSession(req)`: builds a `createServerClient`
  (`@supabase/ssr`) bound to the **request + response cookies**, calls `supabase.auth.getUser()`
  to refresh/rotate the session, and returns the response with refreshed cookies.
- **`src/middleware.ts`** (edited): 
  ```
  if (pathname.startsWith('/app')) return updateSession(req);   // portal: SSR refresh, no i18n
  return intlMiddleware(req);                                    // marketing: unchanged
  ```
  Matcher stays broad (`'/((?!api|_next|_vercel|.*\\..*).*)'`) so `/app` is included for refresh;
  `/api/cron/outbox` is reached directly (api is matcher-excluded, which is fine — it self-guards).
- **Touches:** all `/app/*` (session refresh) + all marketing routes (i18n). **Skips:** `api`,
  `_next`, `_vercel`, static assets.
- **Disabled users:** the middleware only **refreshes** the cookie; it does **not** authorize.
  Authorization is the protected layout + `requireAuth()` (live `status` read) on every request,
  so a disabled user is blocked on the **next** request even if the cookie is valid.
- **No caching:** `/app/*` pages are dynamic (they call cookies()/getUser()), so Next marks them
  `no-store`; we additionally send `Cache-Control: no-store` for `/app/:path*` (next.config) and
  bypass Cloudflare cache for `/app/*`.
- **Cookies:** httpOnly, `secure`, `sameSite=lax`, managed entirely by `@supabase/ssr`; tokens
  never touch JS/localStorage.
- **Stale sessions:** `getUser()` revalidates the JWT with the Auth server (not `getSession()`),
  so a tampered/stale cookie fails; a disabled account fails the `status` check regardless.

---

## 5. Auth flows (exact)

**Login** (`/app/login` → action `signIn`): validate (zod) → `checkRateLimit('login', ip+email)`
→ `supabase.auth.signInWithPassword` → on error: generic "Invalid email or password",
`logEvent('auth.login_failed', warning)` → on success: load profile; if `status!='active'` →
`signOut()` + show disabled message + `logEvent('auth.disabled_user_blocked', warning)`; else
update `last_login_at`, `logEvent('auth.login_success')`, redirect `/app/dashboard`.

**Logout** (action `signOut`): `supabase.auth.signOut()` → `logEvent('auth.logout')` → redirect
`/app/login`.

**Forgot password** (`/app/forgot-password` → action `requestPasswordReset`): validate →
`checkRateLimit('password_reset', ip+email)` → look up user (admin); **always** return the same
generic success; if the account exists **and is active**, mint a recovery link and enqueue the
email (§6); `logEvent('auth.password_reset_requested')`.

**Reset password** (`/app/reset-password` → action `setPassword`): requires a valid recovery
session (set by the callback). Validate password rules → `supabase.auth.updateUser({password})`
→ if the profile was `invited`, set `status='active'` (activation) → `logEvent(
'auth.password_reset_completed', warning)` → redirect `/app/login?reset=ok`.

**Auth callback** (`/app/auth/callback`): `exchangeCodeForSession(code)`; on success →
`logEvent('auth.callback_completed')` → if `type=recovery` redirect `/app/reset-password` else
`/app/dashboard`; on failure → `/app/login?error=link`.

**Invalid/expired reset link:** callback exchange fails → `/app/forgot-password` with
"This link is invalid or has expired. Request a new one." (no detail).

**Disabled account:** any request → `requireAuth()` sees `status!='active'` → `signOut()` +
redirect `/app/login?disabled=1`; message: *"Your account has been deactivated. Contact your
administrator."*

**Authenticated user visits `/app/login`:** the page server-checks the session; if active →
redirect `/app/dashboard`.

**Unauthenticated user visits `/app/dashboard`:** `(protected)/layout.tsx` → `requireAuth()` →
redirect `/app/login`.

---

## 6. Password reset via the P0 outbox

- **Link generation (secure, server-only):** `createAdminClient().auth.admin.generateLink({
  type: 'recovery', email, options: { redirectTo: `${siteUrl}/app/auth/callback?next=/app/reset-password` } })`.
  Supabase Auth mints the token; we never invent our own. We read `data.properties.action_link`
  (the URL the user clicks) and `data.properties.hashed_token` (for dedupe only — never emailed
  or logged).
- **Enqueue:** `enqueueEmail({ to: email, template: 'password_reset', subject: 'Reset your amai
  password', vars: { firstName, actionUrl: action_link } }, dedupeKey, orgId?)`. The worker
  (`/api/cron/outbox`, Vercel Cron) renders the branded HTML and sends via **Resend**.
- **dedupe_key strategy:** `password_reset:{lower(email)}:{sha256(hashed_token)[:16]}` — a fresh
  token per request means a genuine re-request enqueues a new row, while a **retried server
  action** (same token) is a no-op returning the existing row. (Rapid re-requests are bounded by
  the rate limiter, §7.)
- **email_log:** updated by `complete_outbox()` — `status='sent'` + `provider_message_id` on
  success, `status='failed'` + sanitised error after `max_attempts`.
- **If `enqueueEmail` fails:** log server-side, still show the **generic success** (never leak).
- **If the worker fails:** the row goes `retrying` with backoff, then `failed` after 5 attempts
  (logged to `email_log`); the user already saw the generic message — no error surfaced.
- **Shown to the user:** always *"If an account exists for that address, we've sent a reset
  link."* (same text, success or not).
- **No enumeration:** identical message + rate-limited + no timing branch that reveals existence;
  the admin lookup happens server-side only.

---

## 7. Rate limiting (P0 helpers, hashed identifiers)

| Flow | bucket | identifiers | suggested limit |
|---|---|---|---|
| Login submit | `login` | `ipIdentifier(ip)` **and** `emailIdentifier(email)` | 10 / 15 min per ip; 5 / 15 min per email |
| Forgot-password | `password_reset` | `ipIdentifier`, `emailIdentifier` | 5 / hour per email; 20 / hour per ip |
| Reset submit | `password_reset_submit` | `ipIdentifier` | 10 / hour per ip |
| Auth callback | (not rate-limited) | — | Supabase token validation already bounds abuse |

Identifiers are **hashed server-side** (`ip_hash:` / `email_hash:` with `RATE_LIMIT_SALT`) —
**no raw e-mail/IP** in `rate_limit.identifier` (C7). On limit hit: generic *"Too many attempts,
please try again later."* The limiter **fails open** on a DB error (never locks everyone out).

---

## 8. Disabled-user enforcement

- **`requireAuth()`** (rbac.ts): live read of `profiles.status`; `!= 'active'` → redirect
  `/app/login?disabled=1`. This is the authoritative **next-request** gate.
- **Protected layout** (`(protected)/layout.tsx`): calls `requireAuth()` before rendering.
- **Server actions:** every authenticated action calls `requireAuth()` first.
- **RLS / `has_permission()`:** already requires `profiles.status='active'`, so a disabled user
  fails permission checks at the DB layer too.
- **Login path:** even with a correct password, a `status!='active'` profile is signed out
  immediately (§5).
- **Supabase Auth ban / session revoke:** the act of *disabling* lives in P3; when it lands it
  will call `auth.admin.updateUserById(id, { ban_duration })` + revoke sessions for hard
  revocation. **P1 only enforces** via the live status read (sufficient for "next request").
- **Message:** *"Your account has been deactivated. Contact your administrator."*

---

## 9. Audit logging (via `logEvent()` → service-role `log_event()`)

| event action | severity | metadata (business) | technical-only | notes |
|---|---|---|---|---|
| `auth.login_success` | info | — | ip, user_agent | + `last_login_at` update |
| `auth.login_failed` | **warning** | attempted email | ip, user_agent | never the password |
| `auth.logout` | info | — | — | |
| `auth.password_reset_requested` | info | email | ip | always (even if no account) |
| `auth.password_reset_email_enqueued` | info | outbox_id | — | only when actually enqueued |
| `auth.password_reset_completed` | **warning** | — | ip | activation if was `invited` |
| `auth.disabled_user_blocked` | **warning** | email | ip, user_agent | |
| `auth.callback_completed` | info | type (recovery/login) | — | |

- **Security severity:** `login_failed`, `password_reset_completed`, `disabled_user_blocked`
  (warning). `source='portal'` for all; `actor_type='internal_user'` (or `system` when no user).
- **Never logged:** passwords, reset tokens, `hashed_token`, the full `action_link`, session
  cookies. Reset events log only that they happened + the email (technical) + ip.
- **Avoid noise:** **do not** log `session_refreshed` (middleware runs constantly). `login_failed`
  is logged but the **email is technical-only** (admin/`audit.read_technical`) to avoid leaking
  attempted addresses to ordinary `audit.read` viewers.
- Writes go through the server-only `logEvent()` (passes a server-verified `actorId`); clients
  cannot call `log_event` (revoked).

---

## 10. UI / UX specification

**Brand:** reuse `BrandLogo`/`Brand` (gold `!`), tokens from `globals.css` (red `#E5392B`, ink
`#4A1419`, paper `#FBF1EF`, gold `#F7B500`, Archivo Black). English only.

- **Login** (`/app/login`): centered card on `paper`, `BrandLogo` top; email + password fields
  (labelled, autocomplete `email`/`current-password`); inline **error state** ("Invalid email or
  password"); **loading state** = button shows the gold `!` spinner, fields disabled; "Forgot
  password?" link → `/app/forgot-password`; on success redirect `/app/dashboard`. Disabled-account
  and rate-limit messages render in the same error slot.
- **Forgot password** (`/app/forgot-password`): single email field; on submit always show the
  **generic success** ("If an account exists…"); rate-limit message in the error slot; **no
  enumeration**; "Back to sign in" link.
- **Reset password** (`/app/reset-password`): new password + confirm; **validation** — ≥ 10 chars,
  ≤ 72, both must match (zod, client + server); **success state** → "Password updated" then
  redirect to login; **invalid/expired** state → message + link to request a new one.
- **Dashboard placeholder** (`/app/dashboard`): authenticated only; minimal "Welcome, {first
  name or email}" + a couple of static placeholder cards; **no** CRM/ERP features, no data fetch
  beyond the profile.
- **PortalShell** (`src/components/portal/shell/`): basic layout only — a top bar with the
  `amai!` logo + a sign-out button (authed) ; **no** full nav modules yet (placeholder only);
  mobile-safe (responsive, no horizontal scroll); content container.
- **`Spinner`** (`src/components/portal/ui/Spinner.tsx`): the gold `!` loader — a pulsing/rotating
  gold exclamation; respects `prefers-reduced-motion`; sizes sm/md.

---

## 11. Security requirements

- **Supabase Auth only** — no custom auth; email/password via `@supabase/ssr`.
- Service-role key **server-only** (`createAdminClient` in actions/worker); never `NEXT_PUBLIC_*`,
  never in a client component. (Bundle test in §13.)
- **No tokens in localStorage** — sessions are httpOnly cookies via `@supabase/ssr`.
- **No sensitive errors** — generic auth messages; details logged server-side only.
- **No reset token / link logged**; no password logged.
- **No raw email/IP** in `rate_limit.identifier` (hashed).
- **All forms validated server-side** (zod in the action) in addition to client hints.
- **Safe redirects only** — `next`/redirect params are validated against an allow-list of
  internal `/app/...` paths; **no open redirect** (reject absolute/external URLs).
- **Server-side route protection** — `requireAuth()` in the protected layout + every action; UI
  hiding is never the boundary.
- **RLS stays on** for every table; the portal uses the anon/authenticated client (RLS-enforced)
  except the few admin operations (generateLink, status reads via service role where needed).

---

## 12. Files to create / update (actual repo structure)

**Create**
```
src/app/(portal)/layout.tsx                          portal root (html/body, English, public shell)
src/app/(portal)/app/login/page.tsx
src/app/(portal)/app/forgot-password/page.tsx
src/app/(portal)/app/reset-password/page.tsx
src/app/(portal)/app/auth/callback/route.ts
src/app/(portal)/app/(protected)/layout.tsx          requireAuth() guard + authed shell
src/app/(portal)/app/(protected)/dashboard/page.tsx
src/app/api/cron/outbox/route.ts                     CRON_SECRET-guarded → processPending()
src/lib/supabase/middleware.ts                       updateSession(req)
src/modules/auth/actions.ts                          signIn, signOut, requestPasswordReset, setPassword
src/modules/auth/queries.ts                          getSessionUser, getCurrentProfile (or re-export rbac)
src/modules/auth/emails.ts                           reset email subject/vars builder
src/components/portal/shell/PortalShell.tsx
src/components/portal/shell/Topbar.tsx
src/components/portal/ui/Spinner.tsx                  gold ! spinner
```
**Update**
```
src/middleware.ts                                    branch /app → updateSession; else next-intl
src/lib/security/rbac.ts                             confirm LOGIN_PATH='/app/login'; requireAuth uses live profiles.status
src/lib/env.ts                                       add PORTAL_ENABLED; ensure siteUrl
next.config.(ts|mjs)                                 add Cache-Control: no-store for /app/:path*
src/modules/auth/schema.ts                           (exists) login/forgot/reset schemas — keep/align
```
**Reuse as-is:** `src/lib/outbox/enqueue.ts`, `src/lib/outbox/worker.ts`, `src/lib/audit/log.ts`,
`src/lib/security/ratelimit.ts`, `src/lib/supabase/{server,admin}.ts`, `src/components/Brand*`.

*(Routing-group note from §3: if `next build` rejects two root layouts, move `src/app/[locale]`
→ `src/app/(site)/[locale]` — URL-neutral, no marketing code change.)*

---

## 13. Tests for P1

**Integration (Vitest, mocked Supabase):** guest → `/app/dashboard` redirects to login;
active user reaches `/app/dashboard`; active user on `/app/login` → redirect to dashboard;
disabled user (`status='disabled'`) rejected with the deactivated message; forgot-password
returns the **generic** message for an unknown email (no enumeration); a valid forgot-password
**enqueues** an outbox row (`enqueueEmail` called); a duplicate reset request is **deduped**
(same `dedupe_key`) or rate-limited; **reset token / link is never passed to `logEvent`**; login
rate limit blocks after the threshold; `requirePermission('users.read')` would block an `analyst`
on a *future* admin route (guard works, even though no admin route ships in P1).

**Static / build:** service-role key name **absent** from the client bundle; the marketing site
+ `/[locale]/admin` build unchanged; **i18n does not prefix `/app`** (a request to `/app/login`
is not redirected to `/de/app/login`); `npx tsc --noEmit` clean.

---

## 14. Manual configuration

- **Supabase Auth:** enable **email/password**; **disable public sign-ups**; **Redirect URLs**
  allow-list: `${SITE_URL}/app/auth/callback` (and `${SITE_URL}/app/reset-password`) + Vercel
  preview URLs; leaked-password protection **on**. We use `generateLink` + Resend, so Supabase's
  own email templates aren't required (custom SMTP optional).
- **Vercel env:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `RATE_LIMIT_SALT`
  (generated), `CRON_SECRET`, `PORTAL_ENABLED=true`.
- **Vercel Cron:** schedule `POST /api/cron/outbox` (e.g. every minute) with the `CRON_SECRET`.
- **Cloudflare:** bypass cache for `/app/*` and `/api/cron/*`; optional **Turnstile** on
  forgot-password/reset (keys) — recommended but can follow in P4.
- **Resend:** verified sender domain `amai.ch` (done); from `amai! <noreply@amai.ch>`.

---

## 15. Rollback plan

- **`PORTAL_ENABLED` flag:** when `false`, `src/app/(portal)/layout.tsx` (and the middleware
  branch) return **404/redirect** for `/app/*`, switching the whole portal off without a redeploy
  of the marketing site.
- **Revert P1:** P1 is **code-only** — remove the `(portal)` tree, the cron route, the middleware
  branch, and the new lib/components. **No P0 DB change to undo** (P1 adds **zero** migrations).
- **Why minimal/no DB change:** the entire auth foundation already exists in P0; P1 only wires
  UI + flows to it.
- **Fallback:** the old `/[locale]/admin` password gate stays fully available throughout P1.

---

## 16. Out-of-scope confirmation

P1 will **not** build: user management, profile editing, avatar upload, the history-timeline UI,
any CRM/ERP module, finance, NDA, the external-client portal, a role editor, or the old `/admin`
migration. It will not touch `leads/customers/orders/subscriptions/old documents/old requests`.
It adds **no** new P0 migrations.

---

## 17. Final readiness checklist

- **P1 spec ready:** **yes.**
- **Blockers:** none hard. One **prerequisite**: task #73 (sync `database.ts` + the rbac/audit/
  outbox libs to the live schema) must be completed first so `requireAuth()` reads the real
  `profiles.status` and the rpc wrappers type-check.
- **Assumptions:** (a) the owner account `tomdevree1@gmail.com` is active + has a password (or
  will set one via the reset flow) for first sign-in; (b) the outbox worker runs via Vercel Cron;
  (c) `next build` accepts two root layouts, else the URL-neutral `(site)/[locale]` move is made;
  (d) `RESEND_API_KEY` + `RATE_LIMIT_SALT` + `CRON_SECRET` are set before reset emails are tested.
- **Exact approval question before build:** *"Approve building P1 Auth exactly as specified —
  `/app` routing split, login/forgot/reset/callback/sign-out, SSR session refresh, disabled-user
  enforcement, branded reset email via the P0 outbox, protected dashboard placeholder + PortalShell
  + gold `!` spinner — with task #73 done first and no other scope?"*

**Do not build until that approval is given.**
