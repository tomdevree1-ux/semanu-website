# PORTAL P14 — Live Smoke Operator Runbook (non-production)

Purpose: a human or CI runner uses this to complete the P14 Website Analysis Report Engine live smoke in a
**non-production** environment, so production feature-flag enablement can be certified. This is the last
gate: P14 code is implemented, audited and patched; deployment with `WEBSITE_REPORTS_ENABLED=false` is
already approved. **Do not run this against production.** Do not modify P14 code.

Reference: `PORTAL_P14_SPEC.md`, `PORTAL_P14_RUNBOOK.md`, migration `0033_website_analysis_reports.sql`.

---

## 1. Environment prerequisites

**App + auth**
- A running non-production app build (staging or local `npm run dev` / a preview deploy).
- `PORTAL_ENABLED=true` so `/app/...` is reachable; portal login at `/app/login`.
- Portal auth (Supabase) + Cloudflare Turnstile working for the public form.
- Three signed-in test users, each holding exactly one role (assign via `user_roles`):
  - **admin** (role `admin`) — read/generate/review/archive + contact override.
  - **sales** (role `sales`) — read/generate/review (no archive, no override).
  - **read_only** (role `read_only`) — read only.
  - Optional but recommended: an **analyst** or **reviewer** user (read/review, no generate/archive).

**Feature env (non-production values only)**
| Variable | Value |
|---|---|
| `WEBSITE_REPORTS_ENABLED` | `true` |
| `AI_PROVIDER` | `anthropic` |
| `AI_MODEL` | a real Claude model id (e.g. a current Sonnet) |
| `ANTHROPIC_API_KEY` | a **real non-production** key (never commit; set in the env only) |
| `WEBSITE_REPORT_MAX_COST` | leave unset (default 1) or set a small ceiling |
| (existing) | `RATE_LIMIT_SALT`, Supabase URL/keys, `TURNSTILE_*` configured |

**Data**
- At least one `website_analysis` funnel submission (see §2).
- At least one submission with a linked or manually created CRM contact.

**Role assignment helper (SQL, non-prod):**
```sql
-- map a known user to a role (roles: admin, sales, analyst, reviewer, read_only)
insert into public.user_roles (user_id, role_id)
select '<auth-user-uuid>', id from public.roles where key='sales'
on conflict do nothing;
```

---

## 2. Test data setup

Create the following submissions. Method A is the product path (public form); Method B (direct SQL on the
non-prod DB) is faster for the URL-edge cases. Both produce `funnel_submissions` rows with
`source_type='website_analysis'`, `status='new'`.

**A. Public form (`/de/website-analyse`)** — fill Vorname, Name, Email, Ihre Website, tick the privacy box,
pass Turnstile, submit. Expect the success panel; the row appears in `/app/funnels`.

**Submissions to create:**
1. **Linked-contact case** — submit with an Email that already matches exactly one existing CRM contact
   (auto-links on ingest), OR submit any email then, in `/app/funnels/[id]`, use **Link existing contact**
   or **Create contact from submission** (needs a company). Result: `contact_id` set.
2. **Unlinked case** — submit with an email/domain matching no CRM contact or company. Result: `contact_id`
   and `company_id` stay null.
3. **Bad / unreachable URL case** — website `https://no-such-host-xyz123.example` (does not resolve).
4. **SSRF case 1** — website `http://127.0.0.1`.
5. **SSRF case 2** — website `http://169.254.169.254`.
6. **Second valid submission** (with a contact) — for reject / retry / regenerate.

**B. Direct SQL for the URL-edge rows (non-prod only)** — fastest way to set exact URLs and ensure a contact:
```sql
-- a valid, contact-linked submission (replace the contact/company ids with real CRM ids)
insert into public.funnel_submissions (source_type, status, email, first_name, last_name, website_url, normalized_domain, consent_privacy, contact_id, company_id, locale)
values ('website_analysis','new','smoke-ok@example.ch','Smoke','Test','https://example.com','example.com', true, '<contact-uuid>', '<company-uuid>', 'de')
returning id;

-- SSRF + bad-url rows (no contact needed to test the block, but generation also needs the override/contact;
-- attach the same contact to keep generation unblocked while testing the URL guard)
update public.funnel_submissions set website_url='http://127.0.0.1', normalized_domain=null where id='<row>';
update public.funnel_submissions set website_url='http://169.254.169.254', normalized_domain=null where id='<row>';
```

**Read-only inspection queries used throughout:**
```sql
-- find submissions
select id, email, website_url, status, contact_id, company_id
from public.funnel_submissions where source_type='website_analysis' order by created_at desc limit 20;

-- inspect a submission's report versions
select id, version, is_current, generation_status, review_status, error_summary,
       score_overall, cost_estimate, generated_at, reviewed_at
from public.website_analysis_reports where funnel_submission_id='<funnel-id>' order by version;

-- audit trail for a report (entity_type = website_report)
select id, action, actor_id, new_status, created_at, metadata
from public.audit_logs where entity_type='website_report' and entity_id='<report-id>' order by id;

-- funnel-side audit (advance + report_generated)
select action, old_status, new_status, metadata
from public.audit_logs where entity_type='funnel' and entity_id='<funnel-id>'
  and action in ('funnel.report_generated','funnel.status_changed') order by id;
```

---

## 3. Smoke steps

Run in order. Routes: `/app/funnels/[id]` (funnel detail + generate panel), `/app/website-reports`,
`/app/website-reports/[id]`.

1. **Happy path generation** (admin or sales): open the linked-contact submission's funnel detail → **Generate
   report** → watch status `queued → fetching → analyzing → succeeded`.
2. **Report detail validation**: open `/app/website-reports/[id]` → confirm scorecard, all sections,
   impact/effort recommendations, internal sales note, token usage, cost estimate, safe crawl summary.
3. **Approve path**: on the succeeded report → **Approve**.
4. **Reject path**: generate (or use submission #6) → on the succeeded report → **Reject**.
5. **Contact requirement as sales**: as **sales**, open the **unlinked** submission → **Generate** → expect a
   block (link/create a contact first).
6. **Admin override**: as **admin**, on the unlinked submission, tick the override box, leave the reason
   empty → **Generate** → blocked. Then enter a reason → **Generate** → succeeds.
7. **Bad URL failure**: generate on the bad/unreachable-URL submission → expect `failed`.
8. **`http://127.0.0.1` blocked**: generate on SSRF case 1 → expect `failed`, `error_summary='url_blocked_ssrf'`.
9. **`http://169.254.169.254` blocked**: generate on SSRF case 2 → same.
10. **Retry failed report**: on a failed report → **Retry** (allowed only while not succeeded).
11. **Regenerate succeeded report**: on a succeeded report → **Regenerate report**.
12. **Versioning check**: confirm a new version row, prior version `is_current=false`, new `is_current=true`.
13. **Rate limit (8/hour, shared)**: as the SAME actor, trigger 9 generate/retry/regenerate attempts within an
    hour → the 9th returns the rate-limited message. **Cost-free method:** use an SSRF submission and Retry the
    failed report repeatedly (each attempt is blocked before any AI call but still consumes a token): 1
    generate + 7 retries = 8, then the 9th retry → rate-limited, with no new row.
14. **Permissions**: as **read_only** (view only, no action controls), **sales** (generate/review, no archive),
    **analyst/reviewer** (read/review, no generate/archive), **admin** (all + override).
15. **Delivery boundary**: on a report detail, confirm there is **no Send, no PDF, no public-link** control.
16. **Regression**: submit a public funnel at `/de/website-analyse` (P13) → lands in `/app/funnels`; submit the
    contact form (`/api/leads`); run a checkout; confirm the Stripe webhook/P12 path; open old `/[locale]/admin`.

---

## 4. Expected results (UI + DB / audit)

| # | Step | Expected UI | Expected DB / audit |
|---|---|---|---|
| 1 | Happy path | Status progresses to **succeeded** | `generation_status='succeeded'`, `review_status='review_needed'`, `is_current=true`, `version` set, `generated_at` set, `cost_estimate`/`token_usage` populated, `crawl_snapshot` has safe fields. Audit: `website_report.generation_requested`, `fetch_started`, `analysis_started`, `generated` |
| 1b | Funnel advance | — | If funnel `status` was new/to_review/qualified/in_progress → now `analyzed`; audit `funnel.report_generated` (always) + `funnel.status_changed` (when advanced). **Never** moves backward |
| 2 | Detail | Scorecard + 16 sections + impact/effort + internal sales note + tokens + cost + crawl summary; **no send/PDF/public-link** | `report_json` validated, `report_markdown` present, 8 `score_*` in 0..10 |
| 3 | Approve | "Review saved" | `review_status='approved'`, `reviewed_at`/`reviewed_by` set; audit `website_report.reviewed` + `approved` |
| 4 | Reject | "Review saved" | `review_status='rejected'`; audit `website_report.reviewed` + `rejected` |
| 5 | Sales, no contact | Blocked: "Link or create a contact…" | No new report row created; no audit `generation_requested` |
| 6 | Override no reason / with reason | No-reason blocked; with-reason succeeds | Succeeds; audit `generation_requested` metadata includes `override:true` + safe `override_reason` (no other PII) |
| 7 | Bad URL | **failed** | `generation_status='failed'`, `error_summary` in {`unreachable`,`dns_failed`,`timeout`,`http_error`}; audit `fetch_failed` + `failed` |
| 8 | `127.0.0.1` | **failed** | `error_summary='url_blocked_ssrf'`; **`crawl_snapshot='{}'`** (nothing fetched/stored) |
| 9 | `169.254.169.254` | **failed** | `error_summary='url_blocked_ssrf'`; `crawl_snapshot='{}'` |
| 10 | Retry | Re-runs; only available pre-success | Same row re-enters pipeline; succeeded reports show no Retry |
| 11–12 | Regenerate / versioning | New version created; link to new version | New row `version=N+1`, `is_current=true`; prior row `is_current=false`; **exactly one** `is_current` per submission |
| 13 | Rate limit | 9th attempt → "Too many report generations recently…" | No report row created on the 9th; **no website fetch, no AI call** on the blocked attempt (the throttle runs before both) |
| 14 | Permissions | read_only: no action buttons; sales: no Archive, no override; analyst/reviewer: no Generate/Archive; admin: all | Server actions reject out-of-role calls with "You do not have permission to do this." |
| 15 | Delivery boundary | No Send / PDF / public-link controls anywhere | No delivery; no email row; no public report route |
| 16 | Regression | Public funnel submit works; `/api/leads` ok; checkout ok; Stripe/P12 ok; `/admin` loads | No change to those tables/flows |

DB checks for the rate-limited attempt (after step 13): the report-version count for that submission did
**not** increase on the 9th attempt, and no new `website_report.generation_requested` audit row was written
for it.

---

## 5. Pass / fail criteria

**Safe to enable the production flag** — ALL of:
- Happy path reaches `succeeded` with a valid, fully-populated report; approve and reject work.
- Contact requirement blocks sales without a contact; admin override requires + safely audits a reason.
- Both SSRF URLs and the bad URL `failed` with safe `error_summary`; `crawl_snapshot='{}'` for SSRF (nothing
  private fetched/stored).
- Retry is pre-success only; regenerate produces a new version with correct `is_current` flip.
- The 9th attempt is rate-limited with no row/fetch/AI.
- Permissions behave per role; no Send/PDF/public-link control; no email sent.
- Regression: P13 ingestion, `/api/leads`, checkout, Stripe/P12, old `/admin` all unchanged.

**Not safe to enable the production flag** — ANY of:
- Generation never succeeds, or stores an invalid/partial report as `succeeded`.
- An SSRF URL is fetched, or any private response content is stored, or `error_summary` leaks raw detail.
- Rate limit does not block the 9th attempt, or a blocked attempt still fetches/calls AI/creates a row.
- A permission boundary is bypassed (e.g., sales archives, read_only generates, non-admin overrides).
- Any send/PDF/public-URL path exists, or an email is sent.
- Any regression in P13/leads/checkout/Stripe/admin.

**Deploy with flag off only** — code is approved for deploy with `WEBSITE_REPORTS_ENABLED=false` regardless;
choose this if the smoke is not yet run or any non-blocking issue is open.

**Must fix before P15** — any "not safe" item, or a confirmed defect in generation/SSRF/rate-limit/permission.

---

## 6. Copy-pasteable report template

```
# P14 Live Smoke Report

Environment: <staging | local | preview-url>   Date/runner: <...>
Secrets configured (do NOT paste values):
  WEBSITE_REPORTS_ENABLED=true : [ ]
  AI_PROVIDER=anthropic        : [ ]
  AI_MODEL set                 : [ ]
  ANTHROPIC_API_KEY set        : [ ]
  WEBSITE_REPORT_MAX_COST      : <default | value-set>
Users tested: admin [ ]  sales [ ]  analyst/reviewer [ ]  read_only [ ]
Test submissions used (funnel ids): linked=<>  unlinked=<>  bad-url=<>  ssrf1=<>  ssrf2=<>  second=<>

1. Happy path:            PASS / FAIL  (final generation_status=<>, scores present=<>, cost=<>)
2. Review path:           PASS / FAIL  (approved=<> rejected=<>, audit ok=<>)
3. Contact requirement:   PASS / FAIL  (sales blocked=<>)
4. Admin override:        PASS / FAIL  (no-reason blocked=<>, with-reason ok=<>, override_reason audited safe=<>)
5. SSRF result:           PASS / FAIL  (127.0.0.1 blocked=<>, 169.254.169.254 blocked=<>, crawl_snapshot empty=<>, bad-url failed=<>)
6. Retry/regenerate:      PASS / FAIL  (retry pre-success only=<>, new version=<>, is_current flip=<>)
7. Rate-limit:            PASS / FAIL  (9th blocked=<>, no row/fetch/AI on block=<>)
8. Permissions:           PASS / FAIL  (admin/sales/analyst-reviewer/read_only correct=<>)
9. Delivery-boundary:     PASS / FAIL  (no send/PDF/public-link=<>, no email=<>)
10. Regression-boundary:  PASS / FAIL  (P13/leads/checkout/Stripe-P12/admin unchanged=<>)

Issues found: <none | list with severity>

Recommendation:  SAFE TO ENABLE PRODUCTION FLAG  /  NOT SAFE — keep flag off  /  MUST FIX BEFORE P15
Notes: <...>
```

---

## 7. Notes for the runner

- The throttle is **shared** (generate + retry + regenerate) at **8 attempts per actor per hour**, fail-open;
  if a limiter outage occurs it allows (never blocks legitimate work). To re-test after hitting it, wait out
  the hour or use a different actor.
- SSRF-blocked and rate-limited attempts cost nothing (they stop before the AI call), so they are the safe way
  to exercise §8/§13 without spending tokens.
- Keep the AI key to a small non-production budget; `WEBSITE_REPORT_MAX_COST` (default 1) fails a single
  generation closed if it would exceed the ceiling.
- Nothing here changes the database schema or P14 code; all SQL above is read-only except the explicit test-row
  inserts/updates in §2 (run only in non-prod).
```
