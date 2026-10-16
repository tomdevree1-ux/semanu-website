# PORTAL P18 — WAF Go-Live Runbook (single source of truth)

The one document for taking the **Website Analysis Funnel** branch (P13–P17) from dark to live. It consolidates
and links the per-phase runbooks; where a phase has its own detail, this file points at it rather than
duplicating it. Authority: `AMAI_PORTAL_MASTER_PLAN.md` Part IV/V/VI; per-phase docs `PORTAL_P14_SPEC.md` ·
`PORTAL_P14_RUNBOOK.md` · `PORTAL_P14_SMOKE_RUNBOOK.md` · `PORTAL_P15_SPEC.md` · `PORTAL_P15_RUNBOOK.md` ·
`PORTAL_P16_SPEC.md` · `PORTAL_P16_RUNBOOK.md` · `PORTAL_P17_SPEC.md`.

P18 itself adds **no runtime behaviour** — only this runbook and a 4-character JSX-escape lint cleanup in two
unrelated P7 catalog files. **Nothing here enables a flag**; flag flips and the live smokes are performed by the
operator, in a non-production environment first.

> **Golden rule:** non-prod first, one flag at a time, smoke after each, and confirm rollback works before the
> next. Production repeats the exact same order only after non-prod is green.

---

## 0. What is being launched

| Phase | Feature | Master flag (default off) | Migration (applied live) |
|---|---|---|---|
| P13 | Public funnel ingestion → CRM | *(already live; public form)* | `0032_funnel_submissions` |
| P14 | AI website analysis report engine | `WEBSITE_REPORTS_ENABLED` | `0033_website_analysis_reports` |
| P15 | Report delivery (PDF attachment) + manual follow-up | `WEBSITE_REPORT_DELIVERY_ENABLED` | `0034_website_report_deliveries` |
| P16 | Resend engagement tracking (webhook) | `ENABLE_RESEND_WEBHOOK` (+ `ENABLE_EMAIL_OPEN_CLICK_TRACKING`) | `0035_resend_engagement` |
| P17 | Read-only follow-up worklist + insights | `ENABLE_FOLLOWUP_WORKLIST` | *(none — zero-schema)* |

All four WAF flags are server-authoritative and default **off** (each env getter is `=== 'true'`). Migrations
are additive and inert while the flags/code are off.

---

## 1. Pre-flight readiness checklist (must all be true before any flag flip)

- [ ] **TypeScript**: `npx tsc --noEmit` clean.
- [ ] **Tests**: full Vitest suite green (expected 423).
- [ ] **Build**: `npm run build` completes on macOS (the CI/CD host) — the constrained sandbox cannot run it
      (native SWC); `eslint.ignoreDuringBuilds: true`, so TypeScript gates the build, not lint.
- [ ] **Lint (CI hygiene)**: `npm run lint` clean (the P18 cleanup removed the last `react/no-unescaped-entities`
      errors; WAF files were already clean).
- [ ] **Migrations**: `0032`–`0035` show as applied in the live `supabase_migrations` history and are mirrored
      in `supabase/migrations/`.
- [ ] **Advisors**: Supabase `get_advisors` security + performance show **zero new** issues beyond the accepted
      `rls_enabled_no_policy` INFO on the service-role sinks (`resend_events`, `stripe_events`, `outbox`,
      `email_log`, …).
- [ ] **RLS**: a deny/allow spot-check passes on the WAF tables (`website_analysis_reports`,
      `website_report_deliveries` permission-gated reads; `resend_events` denies `authenticated`).
- [ ] **Flags**: all four WAF flags confirmed **off** in the target environment's config.
- [ ] **Secrets present** for the phase being enabled (see §2); **no** service-role key, Resend key, Resend
      webhook secret or AI key is exposed to any client bundle.
- [ ] **Platform**: `PORTAL_ENABLED=true` only when `/app` should be reachable; Cloudflare **bypass-cache** rule
      covers `/app/*` and `/api/cron/*`; the cron schedule drives `/api/cron/outbox` with `CRON_SECRET` set.
- [ ] **Non-prod environment** available with test Resend sending + a test inbox + admin/sales/read_only users.

---

## 2. Required environment per phase

```
# P14 — report generation
WEBSITE_REPORTS_ENABLED=false        # flip to true to enable
AI_PROVIDER=anthropic
AI_MODEL=...                         # e.g. a Claude Sonnet model id
ANTHROPIC_API_KEY=...                # SERVER ONLY
WEBSITE_REPORT_MAX_COST=1            # per-report ceiling (CHF/USD equiv)

# P15 — delivery
WEBSITE_REPORT_DELIVERY_ENABLED=false
RESEND_API_KEY=...                   # without it the worker no-ops (never sends)
WEBSITE_REPORT_PDF_MAX_BYTES=10000000
CRON_SECRET=...                      # guards /api/cron/outbox (the send driver)

# P16 — engagement webhook
ENABLE_RESEND_WEBHOOK=false
RESEND_WEBHOOK_SECRET=whsec_...      # SERVER ONLY; from the Resend webhook endpoint
ENABLE_EMAIL_OPEN_CLICK_TRACKING=false   # leave OFF at launch (see §6 + privacy sign-off)

# P17 — follow-up worklist
ENABLE_FOLLOWUP_WORKLIST=false

# platform
PORTAL_ENABLED=true
NEXT_PUBLIC_SUPABASE_URL=... / NEXT_PUBLIC_SUPABASE_ANON_KEY=... / SUPABASE_SERVICE_ROLE_KEY=... (server only)
```

---

## 3. Ordered enablement sequence (NON-PROD first)

Run each step, confirm its smoke (§4), and confirm its rollback (§5) before moving on.

1. **Enable P14.** Set `WEBSITE_REPORTS_ENABLED=true` + the AI env. → run the **P14 smoke**.
2. **Enable P15.** Set `WEBSITE_REPORT_DELIVERY_ENABLED=true` + `RESEND_API_KEY` + `CRON_SECRET`; ensure the
   outbox cron runs. → run the **combined P14+P15 smoke** (P15 has no source of its own; it acts on an approved
   P14 report).
3. **Enable P16.** In the Resend dashboard, add the webhook endpoint `https://<host>/api/webhooks/resend`,
   subscribe to `email.sent/delivered/delivery_delayed/bounced/complained` (add `opened/clicked` only if you
   intend to enable open/click later), copy its signing secret into `RESEND_WEBHOOK_SECRET`, then set
   `ENABLE_RESEND_WEBHOOK=true`. Keep `ENABLE_EMAIL_OPEN_CLICK_TRACKING=false`. → run the **P16 webhook smoke**.
4. **Enable P17.** Set `ENABLE_FOLLOWUP_WORKLIST=true`. → run the **P17 worklist smoke**.

**THEN production:** repeat steps 1→4 in the same order in production **only after non-prod is fully green**,
each behind `PORTAL_ENABLED`, with the Cloudflare bypass-cache rule + the cron schedule in place. After each prod
flip, watch the signals in §6 before the next.

---

## 4. Required smoke checks per phase

**P14 (per `PORTAL_P14_SMOKE_RUNBOOK.md`):** create a `website_analysis` submission → link/create a contact →
generate the report → confirm a structured report + 0–10 scores; verify **SSRF blocks** (`127.0.0.1`,
`169.254.169.254` refused), the **actor rate limit** (generation/retry throttled), and that generation is
**flag-gated** (off → disabled). No PDF, no send at this step.

**Combined P14+P15 (per `PORTAL_P15_RUNBOOK.md`):** approve the report → **Deliver** → confirm the email arrives
**with the PDF attached and no link**; verify the PDF content and that the **internal sales note is absent**;
confirm delivery `status='sent'`, funnel `status='report_sent'`; set a follow-up → `follow_up_planned`; confirm
role gating (sales delivers, read_only cannot) and **no public report URL** anywhere.

**P16 webhook (per `PORTAL_P16_RUNBOOK.md`):** trigger/await `email.delivered` → `delivered_at` +
`report_delivery.delivered` audit + `email_log.status='delivered'`; force a bounce → `bounced_at`,
`status='bounced'`, audit, `email_log.status='bounced'`; replay an event id → deduped (200 ignored, no double
count); tampered signature → **400**; flag off → **200 ignored**; confirm **no IP/UA stored**. (Open/click only
if separately enabled after sign-off — then confirm `opened_at`/counts + indicative labels and still no IP/UA.)

**P17 worklist:** with a few delivered/opened/bounced/cold reports, open `/app/website-reports/follow-ups` →
confirm priority ordering (delivery_problem > follow_up_due > clicked > opened > delivered_cold), the compact
insights (open/click cards only when tracking on or values exist, with the indicative caption), inline follow-up
set/clear (reuses the P15 actions, gated by `website_reports.deliver`), and read-only for non-deliver roles.

**Cross-cutting after every step:** confirm checkout/Stripe/P10–P12, the Stripe webhook, `/api/leads`, P13
ingestion, and the marketing site are **unaffected**, and that no email is sent except the intended P15 delivery.

---

## 5. Per-flag rollback (instant, no data loss)

| Set this | Effect |
|---|---|
| `WEBSITE_REPORTS_ENABLED=false` | Generation/retry/regenerate stop; existing reports inert. |
| `WEBSITE_REPORT_DELIVERY_ENABLED=false` | Deliver/re-send/cancel/follow-up stop; no PDF/send; existing rows inert. |
| `ENABLE_RESEND_WEBHOOK=false` | Webhook returns `200 {ignored}`; engagement stops updating; existing data intact. |
| `ENABLE_EMAIL_OPEN_CLICK_TRACKING=false` | Open/click events acknowledged but not recorded; delivered/bounced/complained continue. |
| `ENABLE_FOLLOWUP_WORKLIST=false` | Worklist page + nav disabled; nothing else changes. |
| `PORTAL_ENABLED=false` | Removes `/app` entirely (L9 master kill-switch); marketing site stays up. |

Code rollback: redeploy the previous build or `git revert`. Migrations `0032`–`0035` are additive/inert when off
— **no DB rollback is required to stand down**. No Stripe/billing rollback is involved. To fully remove a phase's
schema (rare), follow the `-- ROLLBACK:` notes in its migration after the flag is off.

---

## 6. What to watch after enablement (existing signals only — no new infra)

- **Supabase**: project logs + `get_advisors` (security/performance) after each flip.
- **`email_log`**: `status` transitions (`sent` → `delivered` / `bounced` / `complained`) by `provider_message_id`.
- **`audit_logs`**: `website_report.*` (generation/review), `report_delivery.*` (requested/pdf/enqueued/sent/
  delivered/bounced/complained/follow_up_*), `funnel.*` (report_sent / status_changed). Technical fields stay
  gated by `audit.read_technical`.
- **Resend dashboard**: delivery / bounce / complaint rates + **webhook delivery success** (retries, 4xx/5xx).
- **`website_report_deliveries`** engagement columns + the **P17 worklist/insights** page (bounce/complaint
  spikes surface as `delivery_problem`; cold reports as `delivered_cold`).
- **Outbox cron**: `/api/cron/outbox` runs on schedule and `processPending` reports sends without piling failures.

**Open/click & privacy:** keep `ENABLE_EMAIL_OPEN_CLICK_TRACKING` **off at launch**. Opens/clicks are
tracking-pixel signals — unreliable and privacy-sensitive. Enabling them requires a **separate privacy sign-off**
(EU/Swiss recipients) and is reversible; even when on, only timestamps + counts are stored (never IP, user-agent,
link, or raw payload), and the UI labels them indicative.

---

## 7. Verification record (P18 build phase)

Recorded at P18 build time on this repo state (P17 `bbf623d` + the P18 docs/lint cleanup):

- **`npx tsc --noEmit`** — **PASS** (clean).
- **Full Vitest** — **PASS** (423/423 at last full run; P18 changes are a doc + 2 JSX-escape edits with no logic
  change). *(Re-run recorded by the build step below.)*
- **`next lint`** — **PASS for WAF + the 2 catalog files**; the 4 pre-existing `react/no-unescaped-entities`
  errors in `CatalogDetailActions.tsx` / `CatalogForm.tsx` are now fixed.
- **`npm run build`** — **operator/CI to confirm on macOS** (sandbox cannot run native SWC). `eslint.ignoreDuring
  Builds:true` means TypeScript (clean) gates the build.
- **Supabase advisors / RLS** — last run **zero-new** (security: only the accepted `rls_enabled_no_policy` INFO;
  RLS deny/allow verified on the WAF tables). Re-run by the operator against the target environment before go-live.

> Blockers: **none.** Items not feasible in the build environment (`npm run build` to completion; advisors/RLS
> against the *target* environment) are flagged here for the operator and are part of §1.

---

## 8. Boundaries P18 preserves

No migration, no new schema/permission/secret/flag, no new feature behaviour, nothing enabled. No change to P13
ingestion, P14 generation, the P15 send path, P16 webhook/engagement, or P17 worklist. No customer-facing/public
report URL; no automated follow-up; no notification center; no quote/project/invoice/payment/subscription
automation; no CRM mutation; no funnel-status change from engagement; no checkout/Stripe change; no new outbound
email path; no service-role/secrets in client; no IP/UA/link/raw-payload storage. The only code change is the 4
JSX escapes in the two named P7 catalog files (zero behaviour/visual change). Unrelated untracked brand/marketing
artifacts are left untouched.
