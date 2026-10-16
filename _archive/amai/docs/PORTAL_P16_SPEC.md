# PORTAL P16 — Email Engagement Tracking (Resend Webhook) — Technical Specification *(proposal)*

Status: specification proposal only. Do not build. Do not create migrations. Authority:
`AMAI_PORTAL_MASTER_PLAN.md` Part IV / V / VI; the live Supabase schema and current repo override theoretical
names. This is the **delivery-feedback** layer of the Website Analysis Funnel branch (WAF-3.1), the next
logical step after P15 delivery.

---

## 0. Recommended phase choice

**P16 = Email Engagement Tracking via the Resend webhook** (delivered / bounced / complained, plus
best-effort opened / clicked). Chosen over the alternatives:

| Candidate | Verdict |
|---|---|
| **Email engagement tracking (Resend webhook)** | **RECOMMENDED.** Smallest, most contained next layer; completes P15's delivery loop (P15 already reserved the `bounced` delivery status + a `provider_message_id` to match on); reuses the proven Stripe-webhook pattern; no CRM mutation, no automation overreach. The master plan **§ (lines 319–325, 555, 643) authoritatively names exactly this**: `email_bounced`/`email_complained` = webhook, `email_opened`/`email_link_clicked` = unreliable tracking, privacy-gated. |
| Follow-up task automation | Defer. No task system exists; building one is open-ended and risks "automated outreach", which every phase so far has excluded. P15's lightweight follow-up is enough for now. |
| Conversion → quote/project workflow | Defer. Couples the funnel to P6 projects / P8 quotes and edges into "quote/project/invoice automation", which the standing constraints repeatedly forbid. Higher risk, larger surface. |
| Customer portal | Out. Explicitly excluded in every prior phase; a public/customer surface is a different, larger track. |

P16 turns "we sent the PDF" into "we know it was delivered / opened / clicked / bounced", which materially
improves sales follow-up prioritisation with the least new surface and zero new outbound capability.

> **Hard gate.** P16 must not bypass the P14/P15 live-smoke gate. It only **reacts** to provider events for
> emails P15 actually sent (matched by `provider_message_id`); it ships **dark** behind `ENABLE_RESEND_WEBHOOK`
> (default off); it **sends nothing** and creates no new outbound path. Enabling it in production is downstream
> of P15 being enabled + smoked and the webhook being registered in Resend.

---

## 1. Objective

Receive Resend delivery events on a signature-verified public webhook and reflect them onto the matching
`website_report_deliveries` row: reliable `delivered` / `bounced` / `complained`, and best-effort (privacy-
gated) `opened` / `clicked`. Surface the engagement read-only in the portal so staff can prioritise follow-up.
No new email is ever sent; no CRM field is mutated; engagement never changes the funnel status.

---

## 2. Current-state dependency check (inspected)

- **Stripe webhook = the pattern to mirror** (`src/app/api/stripe/webhook/route.ts`): `runtime='nodejs'`, read
  the raw body, **verify the signature**, switch on event type, **always 200** on handled/ignored (400 only on
  bad signature, 500 → provider retries), service-role writes, `logEvent`. P16's Resend route mirrors this.
- **Dedup precedent:** `public.stripe_events` (event-id sink, RLS-on-no-policy, service-role only). P16 adds an
  analogous `resend_events`.
- **P15 delivery row** (`website_report_deliveries`): already has `provider_message_id` (the Resend id, set by
  `markDeliveryResult` on send), `status` whose CHECK **already includes `bounced`**, `outbox_id`, and links to
  the report/funnel/contact. P16 matches events by `provider_message_id` and adds engagement columns.
- **`email_log`** (id, outbox_id, to_email, subject, status, `provider_message_id`, …): the webhook can also
  reflect `delivered`/`bounced` onto `email_log.status` for the generic outbox view.
- **No `svix`/Resend SDK installed.** Resend signs webhooks Svix-style (`svix-id`, `svix-timestamp`,
  `svix-signature`, HMAC-SHA256 over `${id}.${timestamp}.${rawBody}` with a base64 secret). P16 adds
  verification (see §6) — **manual HMAC recommended (no new dependency)**, the `svix` package is the
  alternative.
- **Outbox/worker (P15):** the report email is sent with `template='website_report'` + a PDF attachment; the
  Resend id is captured. P16 changes nothing in the send path.
- **Audit:** `report_delivery.bounced` is already reserved (label + color); P16 adds the remaining engagement
  events.
- **Master plan posture (authoritative):** delivered/bounced/complained are reliable webhook signals; **opened/
  clicked are tracking-pixel signals, "unreliable", and only recorded if privacy-allowed** — P16 honours this.
- **Next migration: `0035`.** The unrelated live `emails`/`documents` tables stay untouched.

---

## 3. Scope boundaries

**In scope (P16):**
1. A public, signature-verified `POST /api/webhooks/resend` route (Node runtime), behind `ENABLE_RESEND_WEBHOOK`.
2. A `resend_events` dedup table (idempotent processing).
3. Additive engagement columns on `website_report_deliveries` + a reflect onto `email_log`.
4. Event mapping: `email.delivered`, `email.bounced`, `email.complained`, `email.delivery_delayed`, and —
   only when open/click tracking is separately enabled — `email.opened`, `email.clicked`.
5. Read-only engagement display on the delivery detail + deliveries list; new `report_delivery.*` audit events.
6. Privacy-aware handling (no raw IP/user-agent stored from open events; open/click flagged "indicative").

**Out of scope / deferred:**
- Any new outbound email, automated follow-up/outreach, or notification center.
- Funnel status changes from engagement (engagement is read-only signal only).
- Conversion → quote/project/invoice, customer portal, public report URL.
- Per-link click analytics beyond a count + last-clicked; A/B; deliverability dashboards.
- Changes to P13 ingestion, P14 generation, the P15 send path, checkout/Stripe/P10–P12, `/api/leads`, the
  `documents`/`emails` tables, or old `/[locale]/admin`.

---

## 4. Gate, flags & privacy

- **`ENABLE_RESEND_WEBHOOK`** (server-authoritative, default **off**): when off, the route verifies nothing and
  returns `200 {ignored:true}` (so a stray registration is a no-op). Processing happens only when on **and** the
  signature verifies.
- **`RESEND_WEBHOOK_SECRET`** (server-only Svix signing secret). Missing secret → the route treats every event
  as unverifiable → 400, never processed.
- **`ENABLE_EMAIL_OPEN_CLICK_TRACKING`** (default **off**): gates the *unreliable* open/click capture
  separately from delivered/bounce. With it off, `email.opened`/`email.clicked` are acknowledged (200) but not
  recorded. Honours the master plan's "open/click = unreliable + only if privacy-allowed".
- Enabling in production is downstream of the combined P14+P15 live smoke + registering the webhook in Resend.

---

## 5. Event mapping

| Resend event | Effect on the matched delivery (by `provider_message_id`) | Status |
|---|---|---|
| `email.sent` | (already `sent` via P15) record `last_event_at`; no-op otherwise | — |
| `email.delivered` | set `delivered_at` (once) | reliable |
| `email.delivery_delayed` | record `last_event_at` (+ optional note) | reliable |
| `email.bounced` | set `bounced_at`; set delivery `status='bounced'` (already in the CHECK) | reliable |
| `email.complained` | set `complained_at` (spam complaint) — does **not** change `status` | reliable |
| `email.opened` | (only if open/click flag on) set `first_opened_at` once, `opened_at`, `open_count++` | **indicative** |
| `email.clicked` | (only if open/click flag on) set `clicked_at`, `click_count++` | **indicative** |

Unmatched `provider_message_id` (e.g. the invite/password_reset emails, or an unknown id) → acknowledged 200,
no write. A hard bounce after a `sent` flips the row to `bounced`; engagement timestamps are set-once / counters
increment only on a new (deduped) event id.

---

## 6. Webhook design

`src/app/api/webhooks/resend/route.ts` (`runtime='nodejs'`), mirroring the Stripe route:
- Read the **raw** body. If `!ENABLE_RESEND_WEBHOOK` → `200 {ignored:true}`.
- Verify the Svix signature: headers `svix-id`, `svix-timestamp`, `svix-signature`; compute
  `HMAC-SHA256(base64-decoded(RESEND_WEBHOOK_SECRET), \`${id}.${timestamp}.${rawBody}\`)`, base64, compare in
  constant time against any of the space-separated `v1,<sig>` entries; reject stale timestamps (± a few
  minutes). Missing/invalid → **400** (no processing). (Manual HMAC recommended; `svix` lib is the alternative —
  a build decision.)
- **Dedup:** insert the event id into `resend_events` (`on conflict do nothing`); if it already existed → 200,
  skip (idempotent).
- Parse the event, resolve the delivery by `provider_message_id`, apply §5 via the service role, reflect
  delivered/bounced onto `email_log`, `logEvent`. Swallow handler errors per event and **always 200** on a
  verified event so Resend stops retrying (log + optionally 500 only for transient infra so Resend retries —
  decide at build).
- No rate limit needed (signature-gated, like the Stripe route); a malformed/oversized body is rejected early.

A small server-only reconciler `applyResendEvent(event)` (in `src/modules/website-reports/engagement.ts`) holds
the mapping so it is unit-testable without the route.

---

## 7. Data model

**New `resend_events`** (dedup sink, greenfield, mirrors `stripe_events`): `id text primary key` (the Svix
event id), `type text`, `created_at timestamptz default now()`. RLS enabled, **no policies** (service-role
only) — matches the existing `stripe_events` baseline advisory.

**Additive columns on `website_report_deliveries`** (no destructive change; `status` CHECK already allows
`bounced`): `delivered_at`, `bounced_at`, `complained_at`, `first_opened_at`, `opened_at`, `clicked_at` (all
`timestamptz null`), `open_count int not null default 0`, `click_count int not null default 0`,
`last_event_at timestamptz null`, optional `bounce_type text null` (hard/soft) + `engagement jsonb not null
default '{}'` for a safe summary. No raw IP / user-agent / full provider payload stored.

---

## 8. Privacy posture

- Delivered / bounced / complained are recorded whenever the webhook is on (operational necessity for a report
  the lead requested).
- **Open / click are gated behind `ENABLE_EMAIL_OPEN_CLICK_TRACKING` (default off)**, stored as set-once
  timestamps + counts only, **never** with the opener's IP or user-agent, and surfaced labelled "indicative
  (tracking pixels can be unreliable or blocked)". This matches the master plan's explicit caveat.
- The webhook stores no raw provider payload in ordinary audit metadata; only safe fields (event type, delivery
  id, status transition, timestamps, counts).

---

## 9. Status & audit

- `StatusBadge` already maps `bounced → revoked`; no new status token needed (engagement is timestamps/counts,
  not a new delivery status). A small engagement summary component renders delivered/opened/clicked/bounced.
- New audit events (entity_type `report_delivery`): `report_delivery.delivered`, `report_delivery.bounced`
  (reuse the reserved one), `report_delivery.complained`, and — gated — `report_delivery.opened`,
  `report_delivery.clicked`. Safe metadata only (delivery_id, report_id, event type, timestamp, counts);
  `actorType:'system'`, `source:'webhook'`. No raw payload/IP/UA. Technical fields gated by `audit.read_technical`.

---

## 10. Portal UI

- **Delivery detail / DeliverPanel:** a read-only "Engagement" block — Delivered / Opened (count) / Clicked
  (count) / Bounced / Complained with timestamps; open/click shown only when the tracking flag is on, with the
  "indicative" caption.
- **Deliveries list:** optional columns/filters for delivered / opened / bounced.
- No new action controls; no customer-facing surface; no public link. Read gated by `website_reports.read`.

---

## 11. Permissions / RLS / security

- **No new permission.** The webhook is service-role (no user). Viewing engagement reuses `website_reports.read`
  (the delivery row's existing SELECT policy already covers the new columns). `resend_events` has RLS on, no
  policies (service-role only).
- Security: signature verification is the gate (no auth context on a webhook); constant-time compare; timestamp
  freshness check; dedup; no secret in any client bundle; no service-role in client; the route writes only via
  the service role.

---

## 12. Relationship with existing systems

P13 ingestion, P14 generation, the **P15 send path**, `/api/leads`, checkout, the **Stripe** webhook, P10–P12,
the invite/password_reset outbox flows, the `documents`/`emails` tables and old `/admin` are all unchanged.
No CRM field is mutated; the funnel status is **not** changed by engagement. Engagement triggers **no** outbound
action.

---

## 13. Migration plan (to write at build, not now)

`supabase/migrations/0035_resend_engagement.sql` (next number). Additive, greenfield, rollback-commented:
create `resend_events` (RLS on, no policies); `alter table public.website_report_deliveries add column …` for
the §7 engagement columns (all nullable / defaulted, no CHECK change — `bounced` already allowed). Mirror to
repo, hand-maintain `database.ts`, append the README. No change to any other table; the `website-reports` bucket
and `website_reports.*` permissions are unchanged.

---

## 14. Files likely to create / update

Create: `0035_resend_engagement.sql`; `src/app/api/webhooks/resend/route.ts`;
`src/modules/website-reports/engagement.ts` (verify + `applyResendEvent` + reconciler);
`src/components/portal/website-reports/EngagementSummary.tsx`; `PORTAL_P16_RUNBOOK.md`; tests. Update:
`src/lib/env.ts` (`ENABLE_RESEND_WEBHOOK`, `RESEND_WEBHOOK_SECRET`, `ENABLE_EMAIL_OPEN_CLICK_TRACKING`),
`src/lib/audit/display.ts` (the engagement events), the delivery detail page + `DeliverPanel`/`DeliveryTable`
(engagement display), `database.ts`, `.env.example`, `supabase/migrations/README.md`.

---

## 15. Tests

Signature verify (valid passes, tampered/stale/missing rejected, flag-off → ignored); dedup (same event id
processed once); event mapping (`delivered`→`delivered_at`; `bounced`→`bounced_at` + `status='bounced'`;
`complained`→`complained_at`, no status change; `opened`/`clicked` only when the tracking flag is on, set-once +
counts; unmatched `provider_message_id` → no write); never stores IP/UA/raw payload (audit-metadata scan);
service-role-only writes; no client secret; invite/password_reset + Stripe webhook unchanged; no
checkout/Stripe/leads/P10–P12/P15-send change; RLS deny/allow for `resend_events` (no read) + the new delivery
columns (read via `website_reports.read`); `tsc`/`vitest`/`build`/advisors-zero-new.

## 16. Manual smoke (after build, non-prod)

Register the Resend webhook → its signing secret in `RESEND_WEBHOOK_SECRET`; `ENABLE_RESEND_WEBHOOK=true`.
Deliver a P15 report (combined smoke) → trigger/await a real `email.delivered` → confirm `delivered_at` set +
audit; force a bounce (bad address) → `bounced_at` + `status='bounced'`; with `ENABLE_EMAIL_OPEN_CLICK_TRACKING`
on, open the email → `opened_at`/`open_count`; verify replayed events are deduped; verify a tampered signature →
400; confirm the Stripe webhook + invite/reset still work and nothing new is sent.

## 17. Rollback

Code: revert the P16 commit. Flag: `ENABLE_RESEND_WEBHOOK=false` (route no-ops). Data: drop the engagement
columns + `resend_events` (additive, isolated). Deregister the Resend webhook. No Stripe/billing rollback.

## 18. Risks & open questions

- **Webhook verification** — confirm Resend's exact Svix scheme + whether to add the `svix` dep or hand-roll the
  HMAC (recommended). Confirm the timestamp tolerance.
- **Open/click reliability + privacy** — pixels are blocked by many clients; keep them flag-gated + "indicative"
  + IP/UA-free. Decide whether open tracking is enabled at all for Swiss/EU recipients.
- **Matching key** — relies on `provider_message_id` being captured at send (it is, in P15). Decide handling for
  events that arrive before `markDeliveryResult` has written the id (rare; the dedup table lets the event be
  reprocessed if needed, or store late-arriving events keyed by message id).
- **200-vs-retry policy** — mirror Stripe (200 on handled/ignored, 500 only for transient infra).
- Still no automation: confirm engagement stays read-only signal (no auto follow-up / no funnel change).

## 19. Final readiness & approval question

- **Proposal ready:** yes — grounded in the live schema (next migration `0035`; `bounced` status +
  `provider_message_id` already present; `stripe_events` dedup precedent; no svix dep) and the master plan's
  authoritative engagement posture.
- **Recommended phase:** **Email Engagement Tracking via the Resend webhook (WAF-3.1).**
- **Decisions before build:** (1) manual HMAC vs `svix`; (2) enable open/click tracking at all (privacy) and its
  flag default; (3) 200-vs-retry policy; (4) whether to reflect onto `email_log` as well; (5) late-event /
  out-of-order handling.
- **Exact approval question:**

  > "Approve P16 Email Engagement Tracking (Resend webhook, WAF-3.1) as specified: a signature-verified public
  > `/api/webhooks/resend` (Node, behind `ENABLE_RESEND_WEBHOOK` default off) with a `resend_events` dedup table
  > (migration `0035`) that reflects `delivered`/`bounced`/`complained` (and, only behind a separate default-off
  > `ENABLE_EMAIL_OPEN_CLICK_TRACKING`, the indicative `opened`/`clicked`) onto `website_report_deliveries` by
  > `provider_message_id` + additive engagement columns; read-only portal engagement display; `report_delivery.*`
  > audit with safe metadata (no IP/UA/raw payload). No new outbound email, no funnel-status change, no customer
  > portal, no quote/project/invoice; no P13/P14/P15-send/CRM/checkout/Stripe/P10–P12/admin change. Ships dark;
  > enabling it is downstream of the P14+P15 live smoke. Confirm the five build decisions."

Stop after this P16 specification proposal. Do not build, do not create migrations, and do not enable any flag
until approved and until the combined P14+P15 live smoke has passed.
