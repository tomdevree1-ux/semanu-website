# PORTAL P18 — WAF Go-Live Readiness & Consolidated Enablement Runbook — Technical Specification *(proposal)*

Status: specification proposal only. **No production code, no migration, nothing enabled.** Authority:
`AMAI_PORTAL_MASTER_PLAN.md` Part IV / V / VI (§VI.9 WAF; Part IV L8/L9 go-live + the `PORTAL_ENABLED`
kill-switch). Baseline: P13–P17 are approved and committed (P17 = `bbf623d`), all shipping **dark**. This phase
is the **production-readiness capstone** for the Website Analysis Funnel branch: it makes the dark→live path
explicit, verified, and reversible **without** building any new business behaviour.

---

## 0. Recommended phase choice

**P18 = WAF Go-Live Readiness & Consolidated Enablement Runbook** — a documentation + verification phase that
(a) consolidates the existing P14 smoke / P15 combined-smoke / P16 webhook-smoke / P17 enable steps into one
authoritative, ordered go-live runbook with per-flag rollback, (b) adds a pre-flight launch-readiness checklist,
(c) records a fresh in-repo verification pass (tsc, full Vitest, `next build`, Supabase advisors, RLS), and
(d) defines a "what to watch after enablement" section using **existing** signals only. It writes **no business
code, no schema, no new flag**, and changes **no** P13–P17 behaviour.

Why this is the safest, most valuable next increment:

| Candidate | Verdict |
|---|---|
| **Go-live readiness + consolidated enablement runbook (doc + verification)** | **RECOMMENDED.** The WAF branch is fully built but 100% dark; the only thing between it and launch is an **ordered, verified, reversible enablement procedure** that a human operator runs in non-prod then prod. Pure documentation + verification = lowest possible risk, highest launch value, expands no automation, touches no schema/behaviour. |
| Monitoring / observability (build new infra) | Defer. Useful later, but adds integrations/surface and is not needed for a first, flag-gated launch. P18's runbook instead points at the signals that **already exist** (Supabase logs/advisors, `email_log`, `audit_logs`, Resend dashboard, the engagement columns). |
| Lint / build cleanup "for launch" | **Not launch-blocking** — `next.config.mjs` sets `eslint.ignoreDuringBuilds: true`, so the 4 pre-existing `react/no-unescaped-entities` errors do not break `next build` or deploy (TypeScript still gates the build). Keep as a **separate, optional** CI-hygiene cleanup (see §13 + the open question). |
| Notification center / MFA / other master-plan items | Defer — bigger, riskier, not launch-critical. |

> **Boundary headline.** P18 produces a runbook + checklist + a verification record (and, only if approved, a
> 4-character lint cleanup in 2 unrelated files). It **enables nothing** — flag flips and the live smokes are
> performed by the operator (Tom) in a non-production environment first. P18 cannot regress P13–P17.

---

## 1. Objective

Make the WAF branch launchable with confidence: one document that states exactly which env vars + flags to set,
in what order, with which smoke at each step, how to verify success, what to watch afterwards, and how to roll
back each step instantly — plus a pre-flight readiness checklist and a fresh green verification record. The live
smokes remain operator-run (real AI + Resend cannot be exercised from the build environment).

---

## 2. Non-goals (explicitly out)

- **Enabling anything in production.** P18 does not flip `WEBSITE_REPORTS_ENABLED`, `WEBSITE_REPORT_DELIVERY_ENABLED`,
  `ENABLE_RESEND_WEBHOOK`, `ENABLE_EMAIL_OPEN_CLICK_TRACKING` or `ENABLE_FOLLOWUP_WORKLIST`.
- No new feature, schema, migration, permission, secret, env flag, table, bucket, or audit event.
- No monitoring/alerting infrastructure build; no new outbound path; no automation.
- No customer-facing/public surface; no notification center; no quote/project/invoice/payment/subscription
  automation; no CRM mutation; no funnel-status change from engagement; no checkout/Stripe change.
- No change to P13 ingestion, P14 generation, P15 delivery/send, P16 webhook/engagement, or P17 worklist.
- Not running the live smokes for the operator (P18 specifies them; Tom executes them in non-prod).

---

## 3. Schema changes

**None.** P18 is documentation + verification. Migrations `0032`–`0035` are already applied live + mirrored;
next migration number stays **`0036`** (unused by P18).

---

## 4. Flags / envs

**No new flag or secret.** P18 *documents* the existing ones and their required values for go-live:

- P14: `WEBSITE_REPORTS_ENABLED`, `AI_PROVIDER`, `AI_MODEL`, `ANTHROPIC_API_KEY`, `WEBSITE_REPORT_MAX_COST`.
- P15: `WEBSITE_REPORT_DELIVERY_ENABLED`, `RESEND_API_KEY`, `WEBSITE_REPORT_PDF_MAX_BYTES`, `CRON_SECRET`.
- P16: `ENABLE_RESEND_WEBHOOK`, `RESEND_WEBHOOK_SECRET`, and (privacy-gated) `ENABLE_EMAIL_OPEN_CLICK_TRACKING`.
- P17: `ENABLE_FOLLOWUP_WORKLIST`.
- Platform: `PORTAL_ENABLED` (master `/app` kill-switch, L9), Supabase + site URL.

All WAF flags are **default-off** (verified: each getter is `=== 'true'`). The runbook records the exact flip
order and that each is reversible by setting it back to off.

---

## 5. Server / client boundaries

Unchanged — P18 adds no runtime code. The runbook reiterates the standing invariants it must preserve and
verify: service-role only on the server (no service-role/secret in any client component), permission-gated
reads, signature-gated webhook, no public report URL, PDF as attachment not link, and open/click privacy-gated.

---

## 6. Audit / privacy / security model

No new audit events. The runbook's security section confirms (not changes): the Resend webhook stays
signature-verified + deduped + IP/UA/raw-payload-free; open/click stay behind `ENABLE_EMAIL_OPEN_CLICK_TRACKING`
and labelled indicative; `audit_logs` technical fields stay gated by `audit.read_technical`; no secret reaches
the client. The "what to watch" section reads only privacy-safe aggregates (`email_log.status`, `audit_logs`,
the engagement count columns, Resend's own dashboard) — no new personal-data collection.

---

## 7. UI / permission model

**None new.** No route, component, nav, or permission is added. The runbook documents the existing
permission-gated surfaces (`website_reports.read` / `.deliver` / `.review` / `.generate` / `.archive`) and the
role expectations for the go-live smoke (admin / sales / read_only).

---

## 8. Regression risks

Effectively zero for the doc + verification core: it adds Markdown and re-runs read-only checks; it cannot
change P13–P17 behaviour. The **only** code-touching option is the optional §13 lint cleanup — 4 JSX text
escapes in 2 unrelated P7 catalog files, zero behaviour change, covered by tsc + the full suite + a fresh
`next lint`. If that option is declined, P18 is pure documentation with no code diff at all.

---

## 9. Test plan (verification record, for the build phase)

Re-run and record, with results, in the runbook: `npx tsc --noEmit` (clean); full Vitest suite (expect 423
pass); `next lint` (expect P17/WAF clean; record the 4 known pre-existing catalog errors and their disposition);
`npm run build` (**run to completion on macOS** — the sandbox can't, per CLAUDE.md — and record pass/fail);
Supabase `get_advisors` security + performance (expect zero-new beyond the accepted `rls_enabled_no_policy`
INFO on the service-role sinks); an RLS deny/allow spot-check on the WAF tables. If §13 is approved, add a focused
assertion that the 2 catalog files lint clean afterwards and behaviour is unchanged.

## 10. Manual smoke plan (operator-run, non-production → production)

The runbook's core: one ordered sequence, each step gated on the previous passing, all in **non-prod first**.

1. **P14 on** (`WEBSITE_REPORTS_ENABLED=true` + AI env) → run the P14 generation / SSRF (`127.0.0.1`,
   `169.254.169.254`) / actor-rate-limit smoke (per `PORTAL_P14_SMOKE_RUNBOOK.md`).
2. **P15 on** (`WEBSITE_REPORT_DELIVERY_ENABLED=true` + `RESEND_API_KEY` + `CRON_SECRET`) → run the **combined
   P14+P15 smoke**: create `website_analysis` submission → link/create contact → generate → approve → deliver →
   confirm the email arrives **with the PDF attached and no link**, the **internal sales note is absent**,
   `status='sent'`, funnel `report_sent`, follow-up → `follow_up_planned`, role gating, and **no public URL**.
3. **P16 on** (register the Resend webhook; `RESEND_WEBHOOK_SECRET`; `ENABLE_RESEND_WEBHOOK=true`) → run the P16
   webhook smoke: `delivered`/`bounced` → engagement columns + `report_delivery.*` audit + `email_log.status`;
   dedup a replayed event; tampered signature → 400; flag-off → 200 ignored; **no IP/UA stored**. Optionally
   `ENABLE_EMAIL_OPEN_CLICK_TRACKING=true` only with privacy sign-off → confirm opened/clicked + indicative
   labels.
4. **P17 on** (`ENABLE_FOLLOWUP_WORKLIST=true`) → confirm worklist ordering, the compact insights, inline
   follow-up set/clear (reusing P15, gated by `website_reports.deliver`), and read-only for non-deliver roles.
5. **Production**: repeat the flips in the same order only after non-prod passes, each behind `PORTAL_ENABLED`,
   with the Cloudflare **bypass-cache** rule for `/app/*` + `/api/cron/*` and the cron schedule driving
   `/api/cron/outbox`. Confirm checkout/Stripe/P10–P12, `/api/leads`, and the marketing site are unaffected.

**What to watch after each flip (existing signals only):** Supabase logs + `get_advisors`; `email_log` (sent/
delivered/bounced/complained); `audit_logs` (`website_report.*`, `report_delivery.*`, `funnel.*`); the Resend
dashboard (delivery/bounce/complaint rates + webhook delivery success); the `website_report_deliveries`
engagement columns; outbox cron success.

## 11. Rollback plan

Per-flag, instant, no data change: set any WAF flag back to off (delivery/generation/webhook/worklist stop;
existing rows are inert). `PORTAL_ENABLED=false` removes `/app` entirely (L9 kill-switch). Code: redeploy the
previous build or `git revert`. Migrations `0032`–`0035` are **additive/inert** when the code/flags are off, so
no DB rollback is needed to stand down. No Stripe/billing rollback is involved. (If §13 is taken, its rollback
is a one-commit revert of the 2 catalog files.)

## 12. Open questions (decide before the build)

1. **Lint cleanup (§13):** fold the 4-escape fix into P18 for a single "launch-ready, CI-green" commit, or keep
   it as a separate cleanup phase? (Recommended: fold it in — it is trivial, zero-behaviour, and gets
   `npm run lint`/CI green; but it is explicitly optional since it does not block the build.)
2. **Runbook artifact:** one consolidated `PORTAL_P18_GOLIVE_RUNBOOK.md` that supersedes/links the P14/P15/P16
   runbooks, or a thin index that points at them? (Recommended: one consolidated runbook that links the
   existing per-phase runbooks, so there is a single go-live source of truth.)
3. **Open/click at launch:** enable `ENABLE_EMAIL_OPEN_CLICK_TRACKING` at go-live (with privacy sign-off) or
   launch with it off and turn it on later? (Recommended: launch off; turn on after a privacy decision.)
4. **Scope of the verification record:** include the macOS `next build` result + Supabase advisor output inline
   in the runbook, or just reference them? (Recommended: inline a short PASS/blockers summary.)

## 13. The pre-existing lint errors — decision

There are exactly **4 `react/no-unescaped-entities` errors in 2 files** — `src/components/portal/catalog/
CatalogDetailActions.tsx` and `src/components/portal/catalog/CatalogForm.tsx` (P7, unrelated to WAF). They are
literal `"` in JSX text that should be `&quot;`/`&ldquo;`/`&rdquo;`. Because `next.config.mjs` has
`eslint.ignoreDuringBuilds: true`, **they do not break `next build` or deploy** — they only show in
`npm run lint`/CI. **Recommendation:** treat as a tiny, optional, zero-behaviour CI-hygiene fix that P18 *may*
fold in (open question 1); they are **not** a launch blocker and are **not** fixed during this planning step.

---

## 14. Final readiness & approval question

- **Proposal ready:** yes — grounded in the live config (`eslint.ignoreDuringBuilds`), the default-off WAF
  flags, the existing P14/P15/P16 runbooks, and the master plan's go-live primitives (L9 `PORTAL_ENABLED`,
  Cloudflare bypass-cache, redeploy/revert rollback).
- **Recommended phase:** **P18 = WAF Go-Live Readiness & Consolidated Enablement Runbook** (documentation +
  verification; no code/schema/behaviour change; optional 4-escape lint cleanup).
- **Exact approval question:**

  > "Approve P18 WAF Go-Live Readiness as specified: produce a single consolidated `PORTAL_P18_GOLIVE_RUNBOOK.md`
  > (pre-flight readiness checklist + the ordered non-prod→prod enablement sequence with the P14/P15/P16/P17
  > smokes + per-flag rollback + an existing-signals 'what to watch' section), record a fresh verification pass
  > (tsc, full Vitest, macOS `next build`, Supabase advisors, RLS), and — per open question 1 —
  > [fold in / keep separate] the 4-escape `react/no-unescaped-entities` cleanup in the 2 P7 catalog files. **No
  > new code/schema/flag/permission/secret, no enabling anything in production, no change to P13–P17 behaviour or
  > to checkout/Stripe/leads/old admin.** Confirm open questions 1–4."

Stop after this P18 specification proposal. **No production code, no migration, no destructive commands, and
nothing enabled** until this spec is explicitly approved. Even though the build phase is low-risk, I will stop
here and wait for explicit approval before doing any of it.
