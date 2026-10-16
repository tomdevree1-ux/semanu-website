# Acquisition (Fase 1)

Lean, native marketing-intelligence tile in the portal: closed-loop attribution +
acquisition economics, with calm guardrails. Design spec: `PORTAL_ACQUISITION_SPEC.md`.

## What's here

- **Migration `0037_marketing_acquisition.sql`** — APPLIED to production (project
  `bkwwlmflsbhrsfwydbnv`). New tables `marketing_touchpoints`, `marketing_spend_daily`,
  `marketing_change_log`, `acquisition_targets` (one seed row), + attribution columns on
  `leads`. RLS select-only, gated by `acquisition.read`; writes are service-role via
  permission-checked server actions (`acquisition.manage`). Reuses companies/leads/funnels/
  customers/customer_subscriptions/orders — nothing duplicated.
- **`calc.ts` / `guardrails.ts`** — pure, n/a-safe economics (LTV, CAC, payback, LTV:CAC)
  and the status/recommendation classifier (too-early → tracking → watch → healthy → problem
  → cooldown → early-churn → **scale candidate**, conversion-based scaling). 24 unit tests.
- **`queries.ts`** — `getOverview(from,to)`: leads+funnels → channel (last-touch) → paid
  orders by email → MRR + per-source metrics + recommendations + funnel + data-quality.
  Loosely-typed service-role reads, isolated from the generated `database.ts` (deliberate:
  the live DB carries extra dual-provenance tables, so a full type regen was avoided).
- **`actions.ts`** — `createSpendEntry` (currency→base, FX required for non-CHF),
  `createChangeLogEntry`.
- **UI** — `/app/acquisition` (dashboard) + `/app/acquisition/spend` (entry). Card on the
  portal dashboard. Hand-rolled SVG/CSS visuals (no chart dependency).
- **`@/lib/attribution.ts`** — `readAttribution()` last-touch capture wired into the contact
  form + `/api/leads`.

## How to use

1. Open **Acquisition** from the portal dashboard (admin).
2. **Enter ad spend** per day + channel. Use the same channel names the dashboard derives
   (`google_ads`, `organic_search`, `google_business`, `outbound_email`, `cold_call`,
   `referral`, `partner`). For paid, add `campaign_id` so spend matches leads later.
3. Read CAC / payback / LTV:CAC per source. With little data most rows say **"too early"** —
   that is correct, not a bug.

## Economics (defaults in `acquisition_targets`, editable in the row)

LTV = 80 × 24 = 1920 · max healthy CAC = 640 · max payback CAC = 240 (the stricter wins) ·
target LTV:CAC 3:1 · target payback 3 mo · scale only at ≥ 30 conversions + stable, in ~20% steps.

## Deliberately deferred (Fase 2 — gated by the Dec-2026 review)

- Start-modal attribution capture (contact form is wired; same one-line `...readAttribution()`).
- First-touch / true multi-touch (Fase 1 is last-touch, no cookie).
- Google Ads / GA4 / Search Console API sync (replaces manual spend).
- Early-churn rate (placeholder 0 until cancellation dates are wired), experiments, cohorts.
- Adding the 4 new tables to the generated `database.ts` once a full regen is verified safe.
