# PORTAL P16 Runbook — Email Engagement Tracking (Resend Webhook)

Operator guide for P16 (WAF-3.1). Pairs with `PORTAL_P16_SPEC.md` and migration `0035_resend_engagement.sql`.
Ships **dark** behind `ENABLE_RESEND_WEBHOOK` (default off); open/click capture is additionally behind
`ENABLE_EMAIL_OPEN_CLICK_TRACKING` (default off).

## What shipped

A signature-verified, deduplicated webhook `POST /api/webhooks/resend` reflects Resend delivery events onto the
matching `website_report_deliveries` row (matched by `provider_message_id`, captured at send time in P15):
reliable `delivered` / `bounced` / `complained` always, and the **indicative** `opened` / `clicked` only when
open/click tracking is enabled. Staff see a read-only engagement summary on the report-detail Deliver panel and
the deliveries list. **Nothing is ever sent from here; no CRM field is changed; the funnel status is not changed;
no IP / user-agent / raw provider payload is stored.**

## Migration + schema

`0035_resend_engagement.sql` (applied live). Creates `public.resend_events` — a service-role-only dedup sink
(`id text PK` = the `svix-id`, `type`, `created_at`; **RLS on, no policies**, identical to `stripe_events`;
verified `authenticated` sees 0 rows). Adds 11 additive engagement columns to `public.website_report_deliveries`
(`delivered_at`, `bounced_at`, `complained_at`, `first_opened_at`, `opened_at`, `clicked_at`, `open_count`,
`click_count`, `last_event_at`, `bounce_type`, `engagement jsonb`) + 5 indexes (`delivered_at`, `bounced_at`,
`opened_at`, `clicked_at`, `provider_message_id`). No status CHECK change — `bounced` was already an allowed
delivery status. If your environment provisions separately, run the migration; nothing else (bucket, perms) is
needed.

## Environment

```
ENABLE_RESEND_WEBHOOK=false             # master switch (default OFF). Off → the route returns 200 {ignored:true}.
RESEND_WEBHOOK_SECRET=whsec_xxx         # Resend (Svix) signing secret. Empty → every event 400s (nothing processed).
ENABLE_EMAIL_OPEN_CLICK_TRACKING=false  # default OFF. Opens/clicks ignored unless on. delivered/bounced/complained
                                        #   are recorded whenever ENABLE_RESEND_WEBHOOK is on, independent of this.
```

All three are server-authoritative. No secret reaches the client bundle. There is **no new permission**: viewing
engagement reuses `website_reports.read`; the webhook is service-role and unauthenticated (the signature is the gate).

## Registering the webhook in Resend

1. Resend Dashboard → Webhooks → Add endpoint → URL `https://<your-host>/api/webhooks/resend`.
2. Subscribe to: `email.sent`, `email.delivered`, `email.delivery_delayed`, `email.bounced`, `email.complained`,
   and (only if you intend to enable open/click) `email.opened`, `email.clicked`.
3. Copy the endpoint's **Signing Secret** into `RESEND_WEBHOOK_SECRET`.
4. Set `ENABLE_RESEND_WEBHOOK=true` (and, only if privacy-approved, `ENABLE_EMAIL_OPEN_CLICK_TRACKING=true`).
5. Send a test event from Resend and confirm a 2xx + an updated delivery row.

Do this only **after** the combined P14+P15 live smoke has passed — P16 has no delivery source of its own; it
only reacts to emails P15 actually sent.

## Signature verification (manual HMAC, no new dependency)

Resend signs webhooks with the Svix scheme. The route verifies, over the **raw** body:
- headers `svix-id`, `svix-timestamp`, `svix-signature`;
- signed content `${svix-id}.${svix-timestamp}.${rawBody}`, `HMAC-SHA256` with the base64-decoded secret
  (the `whsec_` prefix is stripped), base64-encoded;
- the `svix-signature` header is a space-separated list of `v1,<sig>` entries — any matching entry passes
  (constant-time compare);
- timestamps outside a **5 minute** tolerance are rejected.

Missing / malformed / stale / non-matching signature → **400**, and the body is parsed only **after** the
signature verifies. The `svix` npm package was intentionally **not** added; if Resend ever changes its scheme
incompatibly, add `svix` and swap the verifier — nothing else changes.

## Event mapping

| Resend event | Effect on the matched delivery | Audit (first occurrence) | email_log |
|---|---|---|---|
| `email.sent` | `last_event_at` | — | — |
| `email.delivered` | `delivered_at` (once) + `last_event_at` | `report_delivery.delivered` | `status='delivered'` |
| `email.delivery_delayed` | `last_event_at` | — | — |
| `email.bounced` | `bounced_at` (once) + `status='bounced'` + `bounce_type` | `report_delivery.bounced` | `status='bounced'` |
| `email.complained` | `complained_at` (once), no status change | `report_delivery.complained` | `status='complained'` |
| `email.opened`* | `first_opened_at` (once), `opened_at`, `open_count++`, `last_event_at` | `report_delivery.opened` | — |
| `email.clicked`* | `clicked_at`, `click_count++`, `last_event_at` | `report_delivery.clicked` | — |

`*` only when `ENABLE_EMAIL_OPEN_CLICK_TRACKING=true`; otherwise acknowledged (200) and ignored. A bounce never
overrides a `cancelled` status. Audit is written on the **first** occurrence (timestamp transition) to keep the
timeline clean; counts still increment on every (deduped) event.

## Privacy / open-click caveat

Open and click signals are tracking-pixel based: **unreliable** (blocked by many mail clients) and privacy
sensitive. They are recorded only behind the separate default-off flag, are stored as **timestamps + counts
only** (never IP, user-agent, link, or raw payload — the parser does not even read those sub-objects), and are
labelled "indicative" in the UI. delivered / bounced / complained are operational delivery facts and are always
recorded when the webhook is on.

## Dedup, idempotency & the late-event limitation

Every accepted event's `svix-id` is inserted into `resend_events` **before** processing; a duplicate (`23505`)
returns 200 ignored. Timestamps are set-once and counts increment only on a new event id, so retries are safe.
**Limitation (accepted):** matching is by `provider_message_id`, which P15 writes at send completion. The rare
event that arrives **before** that id is written finds no delivery, is recorded as processed, and is ignored;
a later Resend retry is deduped and will not re-apply it. This is acceptable because such early/unmatched events
are rare and engagement is supplementary (the reliable bounce/complaint also surfaces in Resend's dashboard).
There is intentionally **no** pending unmatched-events table in P16.

## Response policy

- `ENABLE_RESEND_WEBHOOK` off → `200 {ignored:true}`.
- Missing / invalid / stale signature → `400`.
- Verified but unknown / unmatched / unsupported / duplicate → `200 {ignored:true}`.
- Dedup insert fails (infra) → `500` (a Resend retry is useful — nothing was recorded yet).
- Apply fails after dedup → `200` + safe log (already recorded; a retry would be skipped).

## Audit events

`report_delivery.delivered` / `report_delivery.bounced` / `report_delivery.complained` / `report_delivery.opened`
/ `report_delivery.clicked` (entity_type `report_delivery`, `actorType:'system'`, `source:'webhook'`). Safe
metadata only: `report_id`, `delivery_id`, `event_type`, counts, and `bounce_type` where present. Never: IP,
user-agent, raw provider payload, email body, PDF/report content, or secrets. Technical fields stay gated by
`audit.read_technical`.

## Portal display

Report detail → Deliver panel shows a read-only **Engagement** block (Delivered / Bounced / Spam complaint /
Opened·count / Clicked·count / Last event). The deliveries list has a compact Engagement column. Open/click rows
appear only when tracking is enabled **or** a value already exists, with the "indicative … may be blocked"
caption. No new action controls; no customer-facing surface; read gated by `website_reports.read`.

## Manual smoke (non-production, after build + the combined P14+P15 smoke)

1. Register the Resend webhook in non-prod; set `RESEND_WEBHOOK_SECRET`; `ENABLE_RESEND_WEBHOOK=true`; keep
   `ENABLE_EMAIL_OPEN_CLICK_TRACKING=false` initially.
2. Deliver an approved P15 report; wait for / trigger `email.delivered` → confirm `delivered_at` + the
   `report_delivery.delivered` audit, and `email_log.status='delivered'`.
3. Force a bounce (a Resend test bounce address) → confirm `bounced_at`, `status='bounced'`, the audit, and
   `email_log.status='bounced'`.
4. Turn on `ENABLE_EMAIL_OPEN_CLICK_TRACKING=true` only if privacy-approved → open the email (and click a link
   if present) → confirm `opened_at`/`open_count` (and `clicked_at`/`click_count`) and the audit. Confirm NO IP
   or user-agent is stored.
5. Replay the same event id → confirm it is deduped (200 ignored, no double count).
6. Tamper the signature → confirm `400`. Send with the flag off → confirm `200 {ignored:true}`.
7. Confirm no email is sent by the webhook, the funnel status is unchanged, no CRM field changed, and the Stripe
   webhook + invite/password-reset flows still work.

## Rollback

Code: revert the P16 commit. Flag: `ENABLE_RESEND_WEBHOOK=false` (the route no-ops) and/or deregister the Resend
webhook. Data: `drop` the 11 engagement columns + the `provider_message_id` index, then
`drop table public.resend_events` (see the migration's ROLLBACK notes). No Stripe/billing/bucket rollback; the
P15 delivery rows are unaffected.

## Deferred (not in P16)

A pending unmatched-events table / replay queue; per-link click analytics beyond a count; deliverability
dashboards; a notification center; any automated follow-up or outreach driven by engagement; quote/project/
invoice on conversion; a customer portal; public report URLs. Engagement remains a **read-only signal**.

## Unchanged by P16

P13 ingestion, P14 generation, the **P15 send path** (only a read-only engagement display + matching by
`provider_message_id` are added), `website_analysis_reports` / `funnel_submissions` / CRM tables / the
`documents` table / `outbox`, `/api/leads`, checkout, the **Stripe** webhook and `stripe_events`, P10/P11/P12,
and the legacy `/[locale]/admin`. No new permission. No hard deletes. No funnel-status change. No CRM mutation.
