# PORTAL P15 — Website Report Delivery & Sales Follow-up — Technical Specification

Status: specification only. Do not build. Do not create migrations. Authority: `AMAI_PORTAL_MASTER_PLAN.md`
Part IV / V / VI (§VI.9 WAF-3) plus the live Supabase schema and current repo, which override theoretical
names. P15 is the WAF-3 phase of the independent Website Analysis Funnel branch.

> **Hard gate (read first).** P15 delivers internal P14 reports to leads. It must not ship enabled and must
> not bypass the unresolved P14 live-smoke gate. Concretely: (a) delivery is behind its own flag
> `WEBSITE_REPORT_DELIVERY_ENABLED`, default **off**; (b) only reports with `review_status='approved'` are
> ever deliverable; (c) P15 adds **no** report-generation path of its own — it acts only on reports P14
> produced, so enabling delivery in production is downstream of P14 being enabled and live-smoked; (d)
> delivery is **staff-initiated, one report at a time** — never automatic or bulk.

---

## 1. P15 objective

Turn an **approved** P14 website analysis report into a deliverable: render a branded PDF from the validated
report JSON, email it to the report's linked CRM contact (via the existing outbox + Resend pipeline), record
the delivery + its result, advance the funnel forward to `report_sent` (and optionally `follow_up_planned`),
and give staff a lightweight follow-up reminder. Nothing is sent automatically; a staff member with the
delivery permission triggers a single send on a single approved report, behind a default-off flag.

---

## 2. Current-state dependency check (inspected live + repo)

**P14 (the source, unchanged by P15):** `public.website_analysis_reports` (migration 0033) holds the
validated `report_json`, `report_markdown`, per-axis 0–10 scores, `recommendations`, `internal_sales_notes`,
`review_status` (`review_needed`/`approved`/`rejected`), `contact_id`/`company_id`, `is_current`, and the
`website_reports.read/generate/review/archive` permissions. **`review_status='approved'` is P15's delivery
precondition.** P15 reads this table and writes only its own delivery rows + a forward-only funnel status.

**Email pipeline (reuse + extend):** `src/lib/outbox/enqueue.ts` (`enqueueEmail(payload, dedupeKey, orgId)`,
idempotent via the unique `outbox.dedupe_key`), the `outbox` table, the `CRON_SECRET`-guarded
`/api/cron/outbox` route, `src/lib/outbox/worker.ts` (`processPending` → `claim_outbox` → `sendViaResend` →
`complete_outbox`, which applies retry/backoff and writes `email_log`). Two gaps P15 must close: the worker
currently has **no attachment support** and **no open/click tracking** (its own comment: "No webhook / open /
click tracking in v1"), and the `OutboxEmailPayload.template` union is `'invite' | 'password_reset'` only.
P15 adds a `website_report` template + an attachment mechanism.

**Storage (reuse pattern, new bucket):** two **private** buckets (`avatars`, `customer-documents`) with the
`supabase.storage.from(bucket).createSignedUrl(path, ttl)` pattern (`src/modules/profile/queries.ts`). P15
needs a new **private** bucket for report PDFs (recommended `website-reports`); PDFs are never public.

**`documents` table (live, do NOT couple):** a pre-existing `public.documents` (`id, created_at,
customer_id NOT NULL, name, storage_path NOT NULL, size_bytes, mime_type`) exists but is **not wired into the
app** and is keyed on the billing `customers` table, not on reports/contacts. P15 must not repurpose it;
report PDFs live in the new bucket + a P15 delivery row.

**Funnel statuses (no schema change):** `funnel_submissions.status` CHECK already includes `report_sent` and
`follow_up_planned` (and `converted`), so P15's forward-only advance needs no migration to the funnel table.

**CRM (source of truth, unchanged):** `company_contacts` (the recipient's email lives here) and `companies`.
P15 reads the contact email; it never mutates CRM fields.

**Conventions reused:** service-role server actions, `requireAuth()` + `hasPermission()`, permission-gated
read RLS + no write policies, append-only `audit_logs` via `logEvent()`, `StatusBadge` + status tokens,
`env` lazy getters, `checkRateLimit`/`userIdentifier`, soft-archive + no hard delete.

**No PDF library is installed** (`package.json` checked) — P15 introduces one server-side. **Next migration:
`0034`.** `/api/leads`, `/api/checkout`, the Stripe webhook, P10–P12 and old `/[locale]/admin` are unrelated
and stay unchanged.

---

## 3. Scope boundaries

**In scope (P15):**
1. A new `website_report_deliveries` table (greenfield, additive) — one row per delivery attempt, linked to a
   P14 report + contact.
2. Server-side **PDF generation** from the validated `report_json` (branded, deterministic, no arbitrary
   HTML), stored to a private bucket.
3. **Email delivery** of the PDF to the report's linked contact, via the existing outbox + Resend, extended
   with attachment support and a `website_report` template.
4. Reliable **sent / failed** tracking from the outbox result; a delivery status lifecycle.
5. A **forward-only funnel advance** to `report_sent` on delivery (+ optional `follow_up_planned`), audited.
6. A **lightweight follow-up** reminder (a `follow_up_at` + status on the delivery, surfaced as a portal
   filter) — not a full task system.
7. Portal UI: a Deliver control on an approved report, a deliveries view, staff PDF preview (authenticated,
   short-TTL signed URL), delivery status + history.
8. Permission-gated read RLS, service-role writes, audit on every step, a default-off feature flag, idempotency
   + rate/abuse control.

**Out of scope / deferred (later phase, gated):**
- **Open / click tracking** (needs a Resend webhook + signed events). Optional add-on; deferred from P15 v1.
- **Quote / project / invoice creation on conversion** (the master plan's optional WAF-3 step) — explicitly
  deferred; P15 creates none of these.
- **Public report URLs / a public or customer self-serve portal** — never; the customer receives the PDF as an
  email attachment, not a link.
- Automatic or bulk/scheduled delivery; delivery to anyone other than the report's linked contact.
- Any change to P13 ingestion, P14 generation, CRM fields, checkout/Stripe/P10–P12, or the legacy admin.
- SMS or any non-email channel.

---

## 4. Gating, preconditions & flags (mandatory)

- **`WEBSITE_REPORT_DELIVERY_ENABLED`** (server-authoritative, default **false**). Delivery/preview-send
  actions hard-block when off; the UI shows a disabled state. Independent of `WEBSITE_REPORTS_ENABLED`.
- **Production enablement order:** P14 live smoke completed/accepted → `WEBSITE_REPORTS_ENABLED=true` →
  reports generated + **approved** → P15 live smoke (non-prod) → only then `WEBSITE_REPORT_DELIVERY_ENABLED=
  true` in production. The spec states this dependency explicitly; P15 must not provide a shortcut that
  generates or delivers a report without an approved P14 report.
- **Approved-only:** the deliver action hard-rejects any report whose `review_status != 'approved'`, or that
  is archived, or not `is_current`.
- **Recipient:** only the report's linked `contact_id` email. If there is no linked contact, delivery is
  blocked (no override — unlike generation; delivering to an unknown recipient is never allowed).
- **Email send still no-ops without `RESEND_API_KEY`** (existing worker behavior), so a misconfigured env
  fails safe rather than sending.

---

## 5. Delivery model decision

**Create `website_report_deliveries`** (a dedicated greenfield entity), not columns on the report. A report
may be delivered, fail, and be re-sent; a per-attempt row keeps each send auditable and lets the status
lifecycle live independently of the report's review lifecycle. Each row links `report_id →
website_analysis_reports(id)` and snapshots the recipient + the PDF reference. The PDF binary lives in the
private bucket (path on the row); the row never stores the PDF bytes or report content.

- **One active/current delivery per report** is not required (re-sends are legitimate); instead the report
  detail shows the latest delivery + full history.
- Idempotency: the outbox `dedupe_key` (e.g. `website_report:<report_id>:<delivery_id>`) makes a retried
  action a no-op rather than a double-send.

---

## 6. Data model proposal (`website_report_deliveries`)

Greenfield, additive; finalize at build. Proposed columns:

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK default `gen_random_uuid()` | |
| `created_at` / `updated_at` | timestamptz NOT NULL default `now()` | `touch_updated_at` trigger |
| `report_id` | uuid NOT NULL → `website_analysis_reports(id)` ON DELETE CASCADE | the approved report |
| `funnel_submission_id` | uuid NOT NULL → `funnel_submissions(id)` ON DELETE CASCADE | denormalized for listing/advance |
| `contact_id` | uuid NULL → `company_contacts(id)` ON DELETE SET NULL | recipient link snapshot |
| `company_id` | uuid NULL → `companies(id)` ON DELETE SET NULL | snapshot |
| `to_email` | text NOT NULL | resolved recipient at send time (immutable record) |
| `channel` | text NOT NULL default `'email'` | CHECK in (`email`) for now |
| `status` | text NOT NULL default `'queued'` | see §7 |
| `pdf_bucket` | text NULL | e.g. `website-reports` |
| `pdf_path` | text NULL | object path in the private bucket |
| `pdf_size_bytes` | bigint NULL | |
| `outbox_id` | uuid NULL → `outbox(id)` ON DELETE SET NULL | the enqueued email job |
| `provider_message_id` | text NULL | Resend id (from `email_log`) |
| `subject` | text NULL | the email subject used |
| `error_summary` | text NULL | safe code only (see §7) |
| `sent_at` | timestamptz NULL | set when the worker reports success |
| `failed_at` | timestamptz NULL | |
| `follow_up_at` | timestamptz NULL | optional reminder |
| `follow_up_status` | text NOT NULL default `'none'` | CHECK in (`none`,`planned`,`done`) |
| `archived_at` / `archived_by` | timestamptz / uuid NULL → profiles | soft archive only |
| `created_by` / `updated_by` | uuid NULL → profiles | actor provenance |
| `notes` | text NULL | staff notes |

Never stored on the row: the PDF bytes, the report content/markdown, the AI key, raw provider responses.

---

## 7. Status model

Single `status` lifecycle (the email is async via the cron worker, so the row passes through pending states):

| Value | Meaning | Token |
|---|---|---|
| `queued` | row created, PDF + email being prepared | `draft` |
| `rendering` | PDF generation in progress | `waiting` |
| `sending` | email enqueued to the outbox, awaiting the worker | `waiting` |
| `sent` | the worker delivered it (Resend accepted) | `done` |
| `failed` | PDF or send failed (see `error_summary`) | `failed` |
| `bounced` | hard bounce reported (only if open/click webhook is later added) | `revoked` |
| `cancelled` | staff cancelled before send | `cancelled` |

Plus soft archive (`archived_at`). Add a `StatusBadge` entity `'report_delivery'` + a
`reportDeliveryStatusToken` mapper. `error_summary` codes (safe): `no_contact`, `not_approved`, `pdf_failed`,
`enqueue_failed`, `send_failed`, `disabled`, `unknown`. The transition `sending → sent|failed` is driven by
the worker/`email_log` (see §10), not the action.

---

## 8. PDF generation design

- **Source:** the validated `report_json` (P14) only — never arbitrary HTML or model free-text — so the PDF is
  deterministic and injection-safe. Reuse the section order + scorecard from `format.renderReportMarkdown`,
  rendered into a branded layout (amai red/bordeaux, the report sections, the radar/scorecard, impact/effort).
  **The customer-facing PDF excludes `internal_sales_notes`** (staff-only).
- **Library (build decision):** a pure-JS, serverless-friendly renderer (recommended **`@react-pdf/renderer`**)
  — no headless browser (avoids the Puppeteer/Chromium security + cold-start surface). If a headless browser
  is ever proposed, it must be justified + sandboxed; not in P15 v1.
- **Where it runs:** server-only (`src/modules/website-reports/pdf.ts`), invoked by the deliver action. PDF
  generation is CPU/time-bound; do it within the action behind a hard time budget, and if the deployed
  function timeout is too short, move rendering into the cron worker (status `rendering` already models this).
- **Storage:** upload to the private `website-reports` bucket at a non-guessable path (e.g.
  `<report_id>/<delivery_id>.pdf`) via the service role. Record `pdf_bucket`/`pdf_path`/`pdf_size_bytes`.
- **Staff preview:** an authenticated, permission-gated server action returns a **short-TTL signed URL** (e.g.
  60–300 s) for staff to view the PDF in the portal. This is internal only; it is not emailed and not public.
- **Size cap:** reject/skip if the rendered PDF exceeds a sane cap (e.g. 10 MB).

---

## 9. Email delivery design (extend the outbox)

- Extend `OutboxEmailPayload`: add `template: 'website_report'` and an `attachment?: { bucket: string; path:
  string; filename: string }` reference (a pointer, not bytes — keeps the outbox row small).
- Extend `worker.ts`: when `template==='website_report'`, render the report email (branded HTML: greeting to
  the contact, a short message that their analysis is attached, amai signature, reply-to `hello@amai.ch`), and
  when `attachment` is set, **download the PDF via the service role at send time and attach it** to the Resend
  request (`attachments: [{ filename, content: <base64> }]`). No public/signed URL is placed in the email.
- The deliver action: render + store the PDF → create the `website_report_deliveries` row (`sending`) →
  `enqueueEmail({ to, subject, template:'website_report', vars, attachment }, dedupeKey)` with
  `dedupe_key = website_report:<report_id>:<delivery_id>` → store `outbox_id` on the row. The worker sends
  asynchronously; idempotency prevents double-sends on retry.
- `from`/`reply_to`: `env.notificationFrom` / `hello@amai.ch` (existing).

---

## 10. Tracking design

- **v1 (reliable):** `sent` / `failed` derived from the outbox worker result. Mechanism: have
  `complete_outbox`/the worker, on finalizing a `website_report` job, update the linked delivery row (status
  `sent` + `provider_message_id` + `sent_at`, or `failed` + `error_summary`). Cleanest approach: the worker,
  after `complete_outbox`, calls a small P15 reconciler `markDeliveryResult(outbox_id, success, providerId,
  error)` that updates `website_report_deliveries` by `outbox_id`. (Alternative: a periodic reconcile reading
  `email_log` by `outbox_id`.) Either keeps the delivery status truthful without the action blocking on the
  async send.
- **Opened / clicked / bounced:** deferred. Would require a public Resend **webhook** endpoint with signature
  verification (like the Stripe webhook) writing safe events; flagged as an optional later add-on, not P15 v1.
  The `bounced` status + a `report_delivery.bounced` event are reserved for that.

---

## 11. Follow-up design (lightweight)

No tasks/activities table exists, and P15 will not build a general task system. Instead: on the delivery row,
`follow_up_at` (timestamptz) + `follow_up_status` (`none`/`planned`/`done`). A staff action sets/clears a
follow-up; the deliveries list offers a "follow-up due" filter (`follow_up_status='planned' and follow_up_at
<= now()`). Optionally, setting a follow-up advances the funnel to `follow_up_planned` (forward-only). A full
CRM activity/task system is deferred.

---

## 12. Funnel status side effect

On a successful first delivery of a report for a submission: advance `funnel_submissions.status` **forward
only** to `report_sent` (from `analyzed`/earlier sales-safe states; never from `converted`/`closed`/`archived`
and never backward), via the existing service-role path, and emit `funnel.report_sent` (or
`funnel.status_changed` with `via:'report_delivery'`). Setting a follow-up may advance to `follow_up_planned`.
P15 changes no other funnel field and never touches P13 ingestion.

---

## 13. Permission model

Add `website_reports.deliver` (send/cancel/re-send + set follow-up). Reuse `website_reports.read` for viewing
deliveries. Grants:

| Role | read deliveries | deliver |
|---|---|---|
| admin | ✓ | ✓ |
| sales | ✓ | ✓ |
| analyst / reviewer | ✓ | |
| read_only | ✓ | |

Delivery is admin + sales only (it leaves the building + bears email reputation). Archiving a delivery row can
reuse `website_reports.archive` (admin-only). No public access; no new role editor UI.

---

## 14. RLS / security model

- Enable RLS on `website_report_deliveries`; one SELECT policy `has_permission('website_reports.read') OR
  is_platform_super_admin()`; **no write policies** (service-role server actions + worker only).
- Storage: the `website-reports` bucket is **private**; objects are reachable only via service-role
  server-generated short-TTL signed URLs (staff preview) or service-role download (worker attach). No public
  bucket, no public object policy.
- No service-role / Resend / AI keys in client components. The customer email carries the PDF as an
  attachment; **no public or signed report URL is exposed to the customer**.
- Audit metadata stays safe (no PDF bytes, no report content, no provider tokens, no raw recipient beyond the
  hashed/needed `to_email` field which is operationally necessary on the row but not echoed into audit
  metadata beyond the contact id).
- Delivery is the first egress of report content; the deliver action re-checks approved-status + linked-contact
  + the flag on every call (defense in depth).

---

## 15. Server actions / pipeline

Module `src/modules/website-reports/` (extend) or a `delivery.ts` submodule:
- `deliverWebsiteAnalysisReport(reportId)` — `website_reports.deliver` + flag; asserts `review_status=
  'approved'`, not archived, `is_current`, linked contact with an email; renders + stores the PDF; creates the
  delivery row; enqueues the email; audits. Idempotent per `(report_id, delivery_id)`.
- `cancelWebsiteReportDelivery(deliveryId)` — cancel a `queued`/`sending` delivery before the worker sends
  (best-effort; if already sent, no-op with a message).
- `resendWebsiteAnalysisReport(reportId)` — a new delivery row (re-send), same guards + rate limit.
- `setWebsiteReportFollowUp(deliveryId, at)` / `clearWebsiteReportFollowUp(deliveryId)` — follow-up.
- `getReportPdfSignedUrl(deliveryId)` — staff preview; short-TTL signed URL (server-only).
- `archive/restoreWebsiteReportDelivery` — soft archive.
- Queries: `listWebsiteReportDeliveries(filters)`, `getWebsiteReportDelivery(id)`,
  `getLatestDeliveryForReport(reportId)` (server-only, archived-hidden, paginated).
- Worker extension: `markDeliveryResult(...)` called after `complete_outbox` for `website_report` jobs.

**Execution model:** synchronous PDF render + enqueue in the action (behind a time budget), async email send via
the existing cron worker — reusing proven infra, no new cron. If render exceeds the function budget, move
render to the worker (status `rendering`) — documented, no schema change.

---

## 16. Portal UI / routes

- **Report detail (`/app/website-reports/[id]`):** when `review_status='approved'`, add a **Deliver** panel
  (gated `website_reports.deliver` + flag): recipient (the linked contact email), a Deliver / Re-send button,
  the latest delivery status, a **Preview PDF** action (staff signed URL), and a flag-off disabled state. No
  send-to-arbitrary-address field. **No public-link or "copy link" control.**
- **Deliveries view (optional `/app/website-reports/deliveries` or a tab):** list with filters (status,
  follow-up due, date), recipient, report link, status badge, pagination; row → report detail.
- **Funnel detail:** show the delivery status alongside the report panel (read-only).
- Read-only/analyst/reviewer see status + can preview (if granted read) but no Deliver/Re-send/follow-up
  controls. **No Send/PDF-to-public/public-link anywhere** (PDF preview is an internal signed URL only).

---

## 17. Audit / history

New events (`entity_type='report_delivery'`, `entity_id=delivery id`): `report_delivery.requested`,
`report_delivery.pdf_generated`, `report_delivery.email_enqueued`, `report_delivery.sent`,
`report_delivery.failed`, `report_delivery.cancelled`, `report_delivery.bounced` (reserved),
`report_delivery.follow_up_set`, `report_delivery.follow_up_cleared`, `report_delivery.archived`/`restored`.
Plus `funnel.report_sent` (entity_type `funnel`). Safe metadata only: report_id, delivery_id, contact_id,
domain, outbox_id, provider_message_id, status transitions, pdf_size_bytes, follow_up_at. **Never** in
ordinary metadata: PDF bytes, report content/markdown, AI/Resend keys, raw provider payloads, raw email body.
Technical fields gated by `audit.read_technical`.

---

## 18. Cost / rate / abuse control

- Actor-scoped throttle (reuse `checkRateLimit('website_report_delivery', userIdentifier(actorId), N, 3600)`),
  e.g. max 10 deliveries/re-sends per actor per hour; fail-closed with a safe message.
- One report → one recipient (its linked contact); never a list. No bulk/scheduled delivery.
- Idempotent dedupe_key prevents double-send on retried actions.
- PDF size cap; email attachment size cap (Resend limit aware).
- The whole feature is behind `WEBSITE_REPORT_DELIVERY_ENABLED` (default off); the email worker no-ops without
  `RESEND_API_KEY`.

---

## 19. Relationship with existing systems

- **P14:** delivers only `approved`, `is_current`, non-archived reports; reads `report_json` for the PDF;
  writes no P14 field except (optionally) nothing — the report's review status is unchanged by delivery (the
  delivery row carries the send state).
- **Outbox/Resend (P1):** reused; extended with a `website_report` template + attachment support + a delivery
  result hook. The `invite`/`password_reset` flows are unaffected.
- **`documents` table + billing `customers`:** untouched; P15 uses its own bucket + delivery table.
- **P13 / `/api/leads` / checkout / Stripe / P10–P12 / old `/admin`:** unchanged. No quote/project/invoice is
  created.
- **CRM:** the contact email is read; no CRM field is mutated. The funnel advances forward-only.

---

## 20. Migration plan (to write at build, not now)

`supabase/migrations/0034_website_report_deliveries.sql` (next number). Additive, greenfield, non-destructive,
`-- ROLLBACK:` comments per object, `0033` style. Includes: the `website_report_deliveries` table (§6) with
CHECKs (`status`, `channel`, `follow_up_status`), FKs (report/funnel CASCADE; contact/company/profiles SET
NULL; `outbox_id` SET NULL), indexes (`report_id`, `funnel_submission_id`, `status`, partial active `(status)
where archived_at is null`, `follow_up` partial, `created_at desc`), `touch_updated_at` trigger, RLS + the
single SELECT policy (no write policies), seed `website_reports.deliver` + grants (admin, sales). Plus a
**private storage bucket** `website-reports` (created via the Supabase storage API / a storage migration) with
**no public policy** (service-role access only). Mirror to repo, hand-maintain `database.ts`, append to
`supabase/migrations/README.md`. No change to `website_analysis_reports`, `funnel_submissions`, CRM, billing or
`documents`.

---

## 21. Files likely to create / update

Create: `0034_website_report_deliveries.sql`; `src/modules/website-reports/{delivery.ts, pdf.ts}` (+ delivery
schema/types/status/queries); `src/lib/outbox/` attachment extension; `src/components/portal/website-reports/
{DeliverPanel, DeliveryTable, DeliveryStatus}.tsx`; optional `/app/website-reports/deliveries` route;
`PORTAL_P15_RUNBOOK.md`; tests. Update: `worker.ts` (template + attachment + `markDeliveryResult`),
`enqueue.ts` (`OutboxEmailPayload`), `env.ts` (`WEBSITE_REPORT_DELIVERY_ENABLED`, PDF/cap config),
`status/colors.ts` + `StatusBadge` (`report_delivery`), `audit/display.ts` (the `report_delivery.*` +
`funnel.report_sent` events), the report detail page (Deliver panel), Topbar/nav if a deliveries route is
added, `database.ts`, `.env.example`, `supabase/migrations/README.md`.

---

## 22. Tests

Migration/RLS (columns/checks/FKs/indexes/trigger/policy + grants + deny/allow probe); flag-off blocks
delivery; **only approved + linked-contact + is_current + non-archived reports deliver** (each negative case
blocked); PDF rendered from validated JSON only and **excludes internal_sales_notes**; PDF stored in the
private bucket; no public/signed URL emailed (attachment path); dedupe_key idempotency (no double enqueue);
worker `website_report` template + attachment download + `markDeliveryResult` (`sent`/`failed`) with mocked
Resend/storage; funnel advances forward-only to `report_sent`; actor rate limit; audit metadata safe (no
PDF/report/keys); permission gates (admin/sales deliver, others read-only); no service-role/Resend/AI key in
client; **no public report URL / no customer portal / no quote-project-invoice creation** (source scans); no
P13/P14/leads/checkout/Stripe/P10–P12 change; `tsc`/`vitest`/`build`/advisors-zero-new.

---

## 23. Manual smoke (after build, non-prod, behind both flags)

Generate + approve a P14 report (P14 smoke must already pass) → Deliver → confirm PDF rendered + stored,
delivery row `sending → sent`, the email arrives **with the PDF attached and no link**, `funnel.status='report_sent'`,
audit chain correct; staff Preview PDF works (signed URL, short TTL, not public); Re-send creates a new
delivery; flag-off blocks delivery; non-approved/no-contact/archived reports are not deliverable; sales can
deliver, read_only cannot; rate limit blocks the N+1; confirm **no public report URL exists** and the email
contains no report link; confirm P13/P14/leads/checkout/Stripe/admin unchanged.

---

## 24. Rollback

Code: revert the P15 commit. Flag: `WEBSITE_REPORT_DELIVERY_ENABLED=false` disables delivery with no DB
rollback. Data: additive/isolated — `drop table public.website_report_deliveries;` + delete the
`website_reports.deliver` permission/grants + (optionally) the `website-reports` bucket. Outbox/worker
extensions are backward-compatible (the new template/attachment are additive). No Stripe/billing rollback.

---

## 25. Risks & open questions

- **Email reputation / deliverability** — attachments + a new template; verify SPF/DKIM/DMARC for the sending
  domain before enabling; keep volume low (manual, rate-limited).
- **PDF library choice + serverless timeout** — confirm `@react-pdf/renderer` fits the function budget, or move
  rendering to the worker. Confirm the PDF size cap + attachment limit.
- **Delivery-result sync** — confirm the cleanest hook for `markDeliveryResult` (worker post-`complete_outbox`
  vs an `email_log` reconcile); ensure a failed send leaves a truthful `failed` status, not a stuck `sending`.
- **Open/click/bounce tracking** — deferred; decide later whether to add a Resend webhook (new public endpoint
  + signature verification).
- **Privacy/consent** — delivering the analysis to the contact who requested it fulfills their request; confirm
  the consent + content posture (own-site analysis only, no third-party data) with the DPA stance.
- **Quote/project on conversion** — the master plan's optional WAF-3 step; confirm it stays deferred.
- **Re-send semantics** — confirm whether re-send should supersede prior deliveries or simply append (spec
  appends + shows history).

---

## 26. Final readiness checklist

- **P15 spec ready:** **Yes** — grounded in the live schema + repo (outbox/Resend reuse, no attachment/tracking
  today, private buckets, `documents` left alone, next migration `0034`, funnel `report_sent`/`follow_up_planned`
  exist, no PDF lib yet) and the WAF-3 brief.
- **Blockers to writing/approving the spec:** none. **Build is additionally gated by the P14 live smoke** (P15
  cannot be enabled in production until P14 is enabled + smoked, since it has no report source of its own).
- **Decisions needed before build:** (1) PDF library + serverless-vs-worker render; (2) delivery-result sync
  hook; (3) whether a follow-up advances the funnel to `follow_up_planned`; (4) re-send supersede vs append;
  (5) bucket name (`website-reports`) + signed-URL TTL; (6) actor rate-limit numbers.
- **Recommended safe defaults:** `WEBSITE_REPORT_DELIVERY_ENABLED` default off; approved-only + linked-contact
  required (no override); PDF from validated JSON, internal sales note excluded; **attachment delivery, no
  public/signed URL to the customer**; private bucket + short-TTL staff-only preview; sent/failed tracking now,
  open/click deferred; forward-only funnel advance; soft archive; no quote/project/invoice.
- **Exact approval question before P15 build:**

  > "Approve P15 Website Report Delivery & Sales Follow-up as specified: greenfield `website_report_deliveries`
  > (migration `0034`, RLS read-gated on `website_reports.read`, service-role writes only) + a private
  > `website-reports` bucket; server-side PDF from the validated P14 `report_json` (internal sales note
  > excluded) stored privately; email delivery via the existing outbox + Resend extended with a `website_report`
  > template + **PDF attachment** (no public or signed URL to the customer); deliver only `approved` +
  > `is_current` + non-archived reports to the **linked contact**, admin/sales only, behind
  > `WEBSITE_REPORT_DELIVERY_ENABLED` (default off); sent/failed tracking via the worker (open/click deferred);
  > a lightweight follow-up; forward-only funnel advance to `report_sent`; `report_delivery.*` +
  > `funnel.report_sent` audit with safe metadata; actor rate limit; staff-only short-TTL PDF preview. No public
  > report URL, no customer portal, no quote/project/invoice, no automatic/bulk delivery; no P13/P14/CRM/checkout/
  > Stripe/P10–P12/admin change. P15 must not bypass the P14 live-smoke gate: it acts only on approved P14
  > reports and ships flag-off. Confirm the six build decisions."

Stop after the P15 specification. Do not build, and do not create migrations, until this is approved — and do
not enable delivery in production until both the P14 and P15 live smokes pass.
