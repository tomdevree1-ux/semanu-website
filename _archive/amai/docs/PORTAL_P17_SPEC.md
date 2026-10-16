# PORTAL P17 — Website Report Follow-up Worklist & Engagement Insights — Technical Specification *(proposal)*

Status: specification proposal only. **No production code, no migration.** Authority:
`AMAI_PORTAL_MASTER_PLAN.md` Part IV / V / VI (§VI.9 WAF branch); the live Supabase schema + current repo
override theoretical names. Baseline: **P16 (commit `358e8b6`) is approved**, ships dark, and is the engagement
data source for this phase. This is the **read-only payoff layer** of the Website Analysis Funnel branch
(WAF-3.2), the next logical step after P16.

---

## 0. Recommended phase choice

**P17 = Website Report Follow-up Worklist & Engagement Insights (WAF-3.2)** — a **read-only, internal**,
engagement-prioritised follow-up view that turns the signals P16 now collects (delivered / opened / clicked /
bounced / complained, plus P15's `follow_up_status` / `follow_up_at`) into an actionable "who to follow up with
next" worklist for sales, reusing P15's **existing** manual follow-up controls. A compact engagement-insights
strip (delivery / open / bounce counts over a window) rides on the same page at zero extra cost.

Why this is the safest, most valuable next increment:

| Candidate | Verdict |
|---|---|
| **Follow-up worklist + engagement insights (read-only)** | **RECOMMENDED.** Highest value-to-risk: it is the direct payoff of P16 (otherwise the engagement data just sits there), needs **zero schema change** (all signals already exist), adds **no new permission, env, secret, webhook, or outbound path**, mutates nothing, and reuses P15's existing follow-up actions. Matches the master plan's "delivery dashboards" + WAF-3 "follow-up" intent (§VI.9, line 2462). |
| Notification center (alert on open / bounce) | Defer. New subsystem + a new delivery channel (in-app or email) = larger surface and edges toward outbound; the plan lists it but it is heavier than a read-only worklist. |
| Late / unmatched webhook event reconciliation (the documented P16 limitation) | Defer. Low value (rare edge), and P16 explicitly chose **not** to add a pending-events table. |
| Conversion → quote / project (the rest of WAF-3) | Out — forbidden by the standing constraints (no quote/project/invoice automation). |
| Automated follow-up / customer portal / public URL | Out — forbidden by the standing constraints. |

> **Boundary headline.** P17 is **pure read** over existing tables. The only write it can cause is the
> **already-shipped P15** manual follow-up (`setWebsiteReportFollowUp` / `clearWebsiteReportFollowUp`),
> surfaced from a new place. It introduces **no automation, no new mutation, no CRM/funnel change, no schema
> change.**

---

## 1. Objective

Give sales a single internal screen that ranks delivered website-analysis reports by what deserves attention
next — bounced/complained (delivery broken), follow-up due, opened-but-not-yet-followed-up, clicked (strong
intent), and delivered-but-cold — computed read-only from P15 + P16 data, with the existing manual follow-up
set/clear available inline. Plus a small read-only engagement-insights summary (counts/rates over a window).

---

## 2. Non-goals (explicitly out)

- No automated follow-up, no scheduled outreach, no new outbound email/SMS/in-app notification.
- No notification center / alerting subsystem.
- No funnel-status change driven by engagement (the worklist triggers nothing automatic; manual P15 follow-up
  keeps its existing, unchanged behaviour).
- No CRM source-of-truth mutation (CRM names are read, never written).
- No conversion automation (no quote/project/invoice creation), no customer portal, no public report URL.
- No change to P16 webhook behaviour, P15 send path, P14 generation, P13 ingestion, checkout, Stripe (incl. its
  webhook), P10–P12, `/api/leads`, or old `/[locale]/admin`.
- No new permission, no new storage bucket, no new secret.
- No reconciliation of late/unmatched webhook events (stays a documented P16 limitation).

---

## 3. Schema changes

**None.** P17 needs no migration. Every input already exists:

- `website_report_deliveries`: `status`, `sent_at`, `follow_up_status`, `follow_up_at` (P15) +
  `delivered_at`, `bounced_at`, `complained_at`, `opened_at`, `open_count`, `clicked_at`, `click_count`,
  `last_event_at` (P16).
- `funnel_submissions`: `status`, `owner_id` (for "my worklist" filtering).
- CRM `companies` / `company_contacts`: display names only (read).

Next migration number stays **`0036`** (unused by P17). If review later wants a per-row "snooze/dismiss"
beyond P15's `follow_up_status='done'`, that would be a *separate, additive* follow-up decision — **not** in
this spec.

---

## 4. Server / client boundaries

- **Server (service role, read-only):** a new query module `src/modules/website-reports/worklist-queries.ts`
  (`listFollowUpWorklist(filters)`, `getEngagementInsights(window)`), gated by
  `requirePermission('website_reports.read')`, reading via the service-role admin client exactly like the
  existing `delivery-queries.ts`. No writes.
- **Pure (testable):** a `worklist-priority.ts` pure module — `classifyWorklistItem(row, { openClickEnabled, now })`
  → a priority bucket + reason label, and `summariseEngagement(rows)` → counts/rates. No DB, no env, no secrets;
  this is where all logic lives and is unit-tested (mirrors the P16 `engagement-events.ts` split).
- **Client/presentational:** a new portal page `/app/(portal)/app/(protected)/website-reports/follow-ups/page.tsx`
  + a `FollowUpWorklist` table component, reusing the existing read-only `EngagementSummary` (P16) and `StatusBadge`,
  and the existing P15 `setWebsiteReportFollowUp` / `clearWebsiteReportFollowUp` server actions for inline
  set/clear. **No service-role import, no secret, no `createAdminClient` in any client component** (same rule the
  P16 audit verified).
- Topbar gets one nav link "Follow-ups" gated by `website_reports.read`.

---

## 5. Flags / envs

- **Recommended:** ship behind a default-off flag **`ENABLE_FOLLOWUP_WORKLIST`** (server-authoritative, like the
  prior phases) purely for clean, instant rollback and house-style consistency — even though the feature is pure
  read with no external side effect. When off, the nav link + route return a disabled state.
- **No new secret. No `RESEND_*` / Stripe / AI env.** Open/click visibility reuses the **existing**
  `ENABLE_EMAIL_OPEN_CLICK_TRACKING` (P16): open/click-derived rows/insights appear only when that flag is on
  **or** the value already exists, always with the "indicative" caption.

---

## 6. Audit / privacy model

- **No new audit events.** The worklist is read-only; the only writes are the P15 follow-up set/clear, which
  already emit `report_delivery.follow_up_set` / `report_delivery.follow_up_cleared` — unchanged.
- **Privacy:** the worklist reads only the **safe** engagement columns (timestamps + counts). It never reads or
  renders IP / user-agent / link URL / raw payload (P16 never stored them). Open/click stay privacy-gated and
  labelled indicative; delivered/bounced/complained are operational and always shown. No personal data is added
  to any URL/query string; CRM data is displayed, never compiled or exported.
- Read access is gated by `website_reports.read`; the inline follow-up control stays gated by
  `website_reports.deliver` (the existing P15 permission) so non-deliver roles see a read-only worklist.

---

## 7. Regression risks (and why they're low)

- **Reuses existing reads/actions** — no change to `delivery-queries`/`delivery.ts`/the worker/the webhook, so
  P15 send + P16 tracking are untouched. The new query module is additive and read-only.
- **No schema/RLS/permission change** → no advisor surface, no migration risk, no RLS regression.
- **Boundary tests** (carried over from P15/P16 style) assert the new module/components never write CRM/funnels,
  never call checkout/Stripe/enqueueEmail, and carry no secrets — catching accidental scope creep.
- Main residual risk is **UI-only** (a new page/table/nav link) — covered by component tests + the full suite +
  `tsc`/`next lint`/`build`.

---

## 8. Test plan (for the build phase, once approved)

Pure logic (`worklist-priority.test.ts`): priority ordering (bounced/complained > follow-up-due > clicked >
opened-not-followed > delivered-cold > the rest); open/click buckets suppressed when tracking off; "delivered
cold" threshold; `summariseEngagement` counts/rates incl. divide-by-zero. Source-invariant tests
(`worklist-queries`/components): read-only (no `.update(`/`.insert(`/`.delete(` on CRM/funnels/billing, no
`enqueueEmail`/`stripe.`/`/api/checkout`), no `createAdminClient`/secrets in client, read gated by
`website_reports.read`, follow-up reuse of the P15 actions only. Plus the full suite, `tsc --noEmit`,
`next lint`, `npm run build`, and a Supabase advisors check confirming **zero new** advisories (expected, since
no DDL).

---

## 9. Manual smoke plan (non-production, after build)

With `ENABLE_FOLLOWUP_WORKLIST=true`: seed a few delivered reports across states (delivered-only, opened,
clicked with tracking on, bounced, follow-up-due) → open `/app/.../follow-ups` → confirm ordering matches the
priority rules, the reasons read correctly, the engagement-insights counts are right, and open/click rows only
appear/are labelled indicative when `ENABLE_EMAIL_OPEN_CLICK_TRACKING` is on. Set + clear a follow-up inline →
confirm it routes through the existing P15 actions (and emits the existing audit events) with no new side
effect. Confirm a `read_only`/non-deliver role sees the worklist but **cannot** set follow-ups. Confirm no CRM
field changed, no funnel status changed by merely viewing, and P13/P14/P15/P16 + checkout/Stripe still work.

---

## 10. Rollback plan

Code: revert the P17 commit. Flag: `ENABLE_FOLLOWUP_WORKLIST=false` disables the page + nav with **no DB
rollback** (there is no migration). Because P17 adds no schema, no permission, no env secret and no write path,
rollback is purely removing a read-only screen; P15/P16 are entirely unaffected.

---

## 11. Open questions for review (decide before build)

1. **Flag:** ship behind default-off `ENABLE_FOLLOWUP_WORKLIST`, or gate purely on `website_reports.read` (no
   new flag) given it is pure-read? (Recommended: the flag, for consistency + clean rollback.)
2. **"Delivered cold" threshold** — what age (e.g., delivered ≥ 3 working days ago with no open) flips a report
   into the worklist? (Recommended: 3 days, configurable as a constant.)
3. **Scope of insights** — keep the compact counts strip in P17, or split a fuller "delivery dashboard" into a
   later phase? (Recommended: keep the compact strip; defer any charts.)
4. **Inline follow-up** — surface set/clear inline (reusing P15 actions) or keep the worklist purely a
   read-only list that links back to the report detail? (Recommended: inline, reusing the P15 actions, gated by
   `website_reports.deliver`.)
5. **Snooze/dismiss** — rely on P15's `follow_up_status='done'`, or add a small additive column later?
   (Recommended: reuse `done`; no schema in P17.)

---

## 12. Final readiness & approval question

- **Proposal ready:** yes — grounded in the live schema (no migration needed; all signals already present) and
  the master plan (WAF-3 follow-up + "delivery dashboards", §VI.9).
- **Recommended phase:** **P17 = Website Report Follow-up Worklist & Engagement Insights (WAF-3.2),** read-only,
  zero-schema, reusing P15 follow-up + P16 engagement.
- **Exact approval question:**

  > "Approve P17 Website Report Follow-up Worklist & Engagement Insights (WAF-3.2) as specified: a read-only,
  > internal, engagement-prioritised follow-up worklist + compact insights at `/app/.../follow-ups`, computed
  > from existing P15 + P16 data with a pure priority module, gated by `website_reports.read`, reusing the
  > existing P15 follow-up set/clear actions inline (gated by `website_reports.deliver`), behind a default-off
  > `ENABLE_FOLLOWUP_WORKLIST` flag. **No migration, no new permission/secret, no new outbound, no automation,
  > no CRM/funnel mutation, no schema change**, and no change to P13/P14/P15/P16/checkout/Stripe/P10–P12/
  > `/api/leads`/old admin. Confirm the five open questions (flag, cold threshold, insights scope, inline
  > follow-up, snooze)."

Stop after this P17 specification proposal. **No production code, no migration, nothing enabled** until this
spec is explicitly approved. Per the request: even though implementation looks safe, I am stopping here and
asking for explicit approval before writing any code.
