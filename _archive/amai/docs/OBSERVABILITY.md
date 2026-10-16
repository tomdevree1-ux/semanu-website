# Observability — amai.ch

Error tracking is wired with **Sentry** (`@sentry/nextjs`) and **ships dark**: with no
DSN set, nothing initialises and no events are sent, so it is safe to deploy before a
Sentry project exists.

## What is captured

- **Server + edge errors** via `src/instrumentation.ts` (`register()` + `onRequestError`):
  uncaught errors in App Router server components, route handlers and server actions.
- **Critical-path failures** via `captureError()` (`src/lib/observability.ts`), called in
  the catch blocks that matter: the checkout Stripe-session path (`/api/checkout`) and the
  Stripe webhook (`/api/stripe/webhook`). `captureError` always logs structured context and
  forwards to Sentry when a DSN is present.

Errors-only by default (`tracesSampleRate: 0`, no performance tracing) and **no PII**
(`sendDefaultPii: false`) — no IP, cookies or user data leave the server.

## Turn it on

1. Create a Sentry project (Next.js platform) → copy the **DSN**.
2. Set `SENTRY_DSN` (and, if you later add client capture, `NEXT_PUBLIC_SENTRY_DSN`) in
   Vercel → redeploy.
3. In Sentry, add an **alert rule** (e.g. notify Slack/email on a new issue or a spike) —
   that is the "know when checkout breaks at 2am" piece.

## Not wired yet (deliberate)

- **Browser/client error capture** is omitted to keep the client bundle lean (the Sentry
  browser SDK is ~tens of KB and would load on every page). Add it later with a single
  `src/instrumentation-client.ts` that calls `Sentry.init({ dsn: NEXT_PUBLIC_SENTRY_DSN })`.
- **Source-map upload** (readable stack traces) needs `withSentryConfig` in `next.config.mjs`
  plus a `SENTRY_AUTH_TOKEN`. Add when you adopt Sentry; test a local `next build` first.
- **Performance tracing** is off (`tracesSampleRate: 0`); raise it if you want latency data.
