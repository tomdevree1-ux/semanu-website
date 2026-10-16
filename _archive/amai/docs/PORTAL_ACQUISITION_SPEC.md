# Acquisition Dashboard — Fase 1 spec (plan, pre-approval)

Native, admin-only **Acquisition** tile in the existing portal. Closed-loop attribution +
acquisition economics. No separate app, no Prisma, no duplicated CRM/billing tables.
Authority: AMAI_PORTAL_MASTER_PLAN.md; mirrors the 0032 funnels RLS/permission pattern.

## 0. Key finding from the inspection (why this is lean)

~70% already exists and is reused as-is:

- **`funnel_submissions` (0032)** already stores full attribution: `utm_source/medium/campaign/term/content`,
  `referrer`, `page_path`, `locale`, `consent_privacy`, `consent_marketing`, `ip_hash` (hashed, not raw),
  `email`, `company_id`, `contact_id`, and a `status` that includes `converted`. This is the attribution backbone.
- **Billing exists:** `orders` + `customers` (Stripe checkout, joined by email + customer_id), and
  **`customer_subscriptions` (0029)** with `amount` + `interval` + `status` → the MRR source.
- **RLS pattern:** `enable row level security` + select policy `using (has_permission('x.read') or is_platform_super_admin())`,
  no write policies (service-role/server-action writes only), permissions seeded into `permissions` + `role_permissions`.
- **No chart library** installed (only zod). Recommendation: hand-rolled SVG/CSS visuals (lean, zero new deps,
  matches the project's hand-rolled UI) — the five visuals are simple bars/funnel/line.

## 1. Reuse (do NOT duplicate)

| Existing | Used for |
|---|---|
| `funnel_submissions` | source attribution + email + `converted` status (the 4 lead-magnet funnels) |
| `leads` (0001) | contact/start-form leads — **no attribution today** (gap, see §3) |
| `orders`, `customers` | paid checkout; join key = `lower(email)` + `customer_id` |
| `customer_subscriptions` (0029) | MRR (`amount` × `interval`, `status` active) |
| `companies` / `company_contacts` | authoritative CRM link |
| `has_permission()` / `role_permissions` | RLS gating |
| Stripe webhook | left untouched — we only read the result |

## 2. New DB objects (minimal: 3 tables + 1 column add)

1. **`marketing_spend_daily`** — `id, date, channel, source, medium, campaign, currency, spend_amount numeric, impressions, clicks, notes, created_by, created_at, updated_at`. Manual ad-spend entry.
2. **`marketing_change_log`** — `id, changed_at, changed_by, channel, campaign, change_type, description, reason, expected_impact, cooldown_until, next_review_at, status, created_at, updated_at`. Anti-doom-loop.
3. **`acquisition_targets`** — single config row: `currency, default_subscription_price (80 CHF), expected_retention_months (24), target_ltv_cac_ratio (3), target_payback_months (3), max_healthy_cac, min_leads_before_judgement (10), min_customers_before_judgement (3), min_clicks_before_judgement (100), campaign_cooldown_days (7–14)`.
4. **Column add on `leads`**: `utm_source, utm_medium, utm_campaign, utm_term, utm_content, gclid, referrer, page_path` (so contact-form leads carry source too, mirroring funnel_submissions). Optional: add `gclid` to `funnel_submissions` (it has utm but no gclid column).

**Deliberately NOT added in Fase 1:**
- No `marketing_touchpoints` table — `funnel_submissions` already holds funnel attribution inline; a second table would duplicate it. (Touchpoints = Fase 2, only if we want anonymous pre-conversion or true multi-touch.)
- No `acquisition_recommendations` table — recommendations are **computed server-side** per request (your stated preference), not persisted.

## 3. Closed-loop link (lead → paying customer)

- **Automatic:** `lower(email)` match `funnel_submissions`/`leads` → `orders` → `customers` → `customer_subscriptions`.
- **Authoritative:** the manual `status='converted'` + `company_id` on `funnel_submissions` (a human confirmed it). The dashboard uses both; rows with neither are bucketed as **"unknown source"**.
- **Last-touch** attribution in Fase 1 (the source stored on the submission). Multi-touch later.

## 4. Migration outline — `0037_marketing_acquisition.sql`

- `create table` for the 3 new tables (+ `touch_updated_at` triggers, indexes on date/channel/source/campaign).
- `alter table public.leads add column …` the 8 attribution columns; optional `gclid` on funnel_submissions.
- `enable row level security` on all 3 new tables.
- Select policies: `using (has_permission('acquisition.read') or is_platform_super_admin())`. No write policies (writes via service role inside permission-checked server actions).
- `insert into public.permissions (key, module, label)` → `acquisition.read`, `acquisition.manage`.
- `role_permissions`: admin → both; analyst/reviewer/read_only → `acquisition.read`. Spend/change-log/targets writes require `acquisition.manage`.
- Then regenerate `src/lib/types/database.ts`.

## 5. Privacy

Mirror `funnel_submissions`: `ip_hash` only (never raw IP), respect `consent_marketing` (no non-essential capture without marketing consent — gclid/utm are functional/business and OK), keep any metadata JSONB small and controlled. API keys server-only (none needed in Fase 1 — manual spend).

## 6. Tracking helper

Small client helper reads `utm_*` / `gclid` / `referrer` / `page_path` from the URL, stores first-touch in a cookie/localStorage and last-touch at submit, and passes them to: `/api/funnels/submit` (exists, already fills utm) and `/api/leads` (extend to fill the new columns). Consent-gated.

## 7. UI — one tile, `/app/acquisition`, behind `requirePermission('acquisition.read')`

- **A. KPI cards:** spend, leads, paying customers, new MRR, CPL, CAC, LTV, payback months, LTV:CAC — each with previous period + status chip (Healthy / Watch / Problem / Too early / Tracking issue).
- **B. Visuals (decision-framed titles, hand-rolled SVG/CSS):**
  1. **Funnel** (leads → qualified → converted → paying) — "Where do we lose people?"
  2. **Channel bars** (leads vs customers vs MRR per source) — "Which channels create customers, not just leads?"
  3. **CAC vs max-healthy-CAC** (target reference line) — "What can we scale, what is too expensive?"
  4. **Payback per channel** (target line) — "How long until it pays back?"
  5. **Trend** (weekly, never daily): spend/leads/customers/CAC — "Are we improving?"
- **C. Source table:** source/campaign → spend, leads, customers, lead→customer %, MRR, CPL, CAC, LTV:CAC, payback, status, recommendation.
- **D. Recommendations panel** (computed): each with what it means / why / next action / review date.
- **E. Data-quality panel:** leads without source, subs without lead/source, spend without campaign, campaign with spend but 0 touchpoints, touchpoints missing utm/gclid, payments not linked.
- **F. Change-log panel** (recent marketing changes + cooldown/next-review).
- Manual spend entry UI (permission-gated, `acquisition.manage`).
- Default view: last 30 days; trend charts weekly. Filters: date range, channel, source, campaign, sales motion, currency.

## 8. Formulas (real amai economics)

- `LTV = price × retention` → 80 × 24 = **1920 CHF**
- `max healthy CAC = LTV / target_ltv_cac (3)` → **640 CHF**
- `max payback CAC = price × target_payback_months (3)` → **240 CHF**
- `CPL = spend / leads` · `CAC = spend / paying_customers` · `payback = CAC / price` · `LTV:CAC = LTV / CAC` · `lead→customer = customers / leads`
- Edge cases: zero denominator → "n/a"; no customers → CAC = "n/a" with label; no attribution → "unknown".

## 9. Guardrails (computed, calm-by-default)

- < `min_leads` (10) → **Too early** ("hold, not enough data").
- spend but 0 tracked leads → **Tracking issue** ("check tracking/UTM/form").
- leads but 0 linked subs → **Watch** ("check lead quality / sales follow-up, not ads").
- CAC < max-healthy & payback ≤ target → **Healthy**.
- CAC > target but < `min_customers` (3) → **Watch** ("don't overreact").
- CAC > target & enough data → **Problem**.
- changed within cooldown → **Learning / cooldown** ("don't judge until X").
- > N changes in 14 days → **Change fatigue** ("stop changing, wait for clean data").

**Scaling is conversion-based, not calendar-based.** A healthy source becomes a **Scale candidate** only when it has enough conversion volume (default ≥ 30 ad-conversions / ~2–3 conversion cycles — Google Smart Bidding calibrates around 30–50 events) AND has been stable (no change) for `stable_window_days`. Below that it stays **"Economics healthy (hold to scale)"** — keep running, collect more conversions. To scale: the three conditions must hold (1) tracking is correct and conversions are quality, (2) CAC/ROAS is roughly stable for 7–14 days, (3) the campaign is budget-limited or still has profitable volume — then raise budget in steps of ~`scale_step_pct` (20%) per cycle and re-measure for `stable_window_days`, never a big jump that resets the learning phase. (Fase 1 approximates "stable" as "no recent change"; true CAC/ROAS-stability over time is the Fase 2 trend check.)

## 10. Test plan (vitest — the critical part)

Pure-function tests for: CAC, LTV, payback, LTV:CAC, zero-denominator, missing attribution, spend-without-leads, leads-without-subs, cooldown logic, too-early logic, healthy vs unhealthy CAC, change-fatigue. (Calculation + guardrail utilities are pure → easy to unit-test, no DB.)

## 11. Risks

1. **Email-match attribution is imperfect** (different email at funnel vs checkout) → mitigated by the manual `converted` + company link; unmatched = "unknown".
2. **Low data volume now** → the dashboard will often say "too early." This is by design (calm, not panic), but manage the expectation.
3. **Historical leads have no attribution** → shown in an "unknown" bucket; only new traffic gets full source.
4. **Mixed currencies (CHF/EUR)** → warn, no auto-conversion in Fase 1.
5. **GA4 sessions aren't server-side linked** → the "visitors" funnel stage may be unavailable; show only the stages we actually have.

## 12. Build order (after approval)

migration 0037 → regenerate types → tracking helper + `/api/leads` extend → calculation/guardrail utilities (+ tests) → server reads (getAcquisitionOverview/BySource/Funnel/Trends + computed recommendations + data-quality) → spend/change-log/targets server actions → dashboard tile UI + visuals → seed/mock data → README.

**Open decision:** charts hand-rolled SVG/CSS (recommended — lean, zero deps) vs add `recharts`.
