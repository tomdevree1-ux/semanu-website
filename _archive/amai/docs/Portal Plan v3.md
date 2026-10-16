# Portal Plan v3 (final) — Auth, RBAC, Audit & Platform Foundation (CRM/ERP-ready)

> **Read Part B at the end first.** It holds the approved final refinements and the full
> execution plan (phases, migration order, exact v1 tables/files, test checklist, rollback,
> manual config) and **overrides Part A** wherever they differ.

> Status: **plan only. Nothing new is built.** The v1 foundation files already written
> (`0006_profiles_and_roles.sql`, `lib/security/rbac.ts`, the zod schemas, the extended
> `database.ts`) stay valid and are a correct *subset* of this plan.
>
> Scope shift: design the portal so it can grow into a multi-module **CRM/ERP** (clients,
> projects, products, finance, documents, NDAs, quotes, invoices, external client portals)
> without schema rewrites. The platform is **English-only**, lives under **`/app`**, and is
> isolated from the multilingual marketing site.
>
> Reference: this mirrors patterns already proven in your **SEMANU** database (generic
> append-only `audit_log`, per-entity event streams with `actor_type`/IP/status, a DB
> `edge_rate_limit`, role on `profiles`, `profiles.client_id` for external users,
> `emails_sent` with `resend_id`+status, immutable `quote_versions`). We adopt the same
> shapes so your two systems stay consistent.

---

## 1. Is the current plan enough? (short conclusion)

The v1 plan is **correct but too narrow** for a future CRM/ERP. It models a single-tenant
`admin`/`user` auth module. Four things are cheap to design now and **very expensive to
retrofit** once data exists, so we extend the plan in exactly these four places:

1. **A permissions layer** — not just a `role` enum, but `roles` / `permissions` /
   `role_permissions`, resolved through one `has_permission()` function. Adding a role later
   becomes *data*, not a code change.
2. **An organization (tenant) scope on every table** — an `organization_id` column + RLS
   that scopes by membership, so multi-org, external clients and partners are possible later.
3. **A generic, append-only audit/event store** — one rich `audit_log` that every module
   writes to, powering the history-clock timeline you want everywhere.
4. **An event/outbox spine** — so outbound email/webhooks/PDF/API calls are reliable and
   logged, not fire-and-forget.

Everything else (MFA, notifications, finance, NDA, external portals) can be added **later
without migrations** *if* these four exist. **Recommendation: extend the plan; build v1
thin, on a wide foundation.**

---

## 2. Improved target architecture

**Layers (strict):**

- `app/(portal)/…` — routing, layouts, pages. Thin. Calls module actions/queries. Guards
  the session/permissions. **No business logic, no SQL.**
- `modules/<domain>/` — the logic. Each domain ships `actions.ts`, `queries.ts`,
  `schema.ts` (zod), `types.ts`, `events.ts` (which audit/notification/outbox events it
  emits), `policies.md` (the RLS rules + why), and `*.test.ts`.
- `lib/` — cross-cutting infra: `supabase/`, `security/` (authorize, rbac, step-up),
  `audit/` (the event writer), `outbox/`, `ratelimit/`, `status/` (state machines + colors).
- **Database** — the real security boundary: RLS on every table, `SECURITY DEFINER`
  authorize functions, guard triggers, append-only audit.

**Three cross-cutting principles:**

- **Multi-tenant from day one.** Every domain row carries `organization_id`. RLS scopes by
  membership. v1 has exactly one organization, but the column and policies exist now.
- **One authorization spine.** `has_permission(perm)` (SQL, `SECURITY DEFINER`) is used by
  RLS; `requirePermission(perm)` (server, live DB read) guards every action; the UI uses
  permissions **only for display**, never as the security boundary.
- **One write path.** A meaningful mutation does, ideally in a single transaction:
  `(1)` domain write → `(2)` `audit_log` append → `(3)` optional `notification` →
  `(4)` optional `outbox` job. Audit is evidence; notifications are user-facing; they are
  linked but not the same thing.

**Domains:** `auth`, `users`, `organizations`, `companies`, `contacts`, `projects`,
`products`, `finance`, `documents`, `nda`, `audit`, `notifications`, `integrations`,
`shared`.

```
src/
  app/(portal)/  login  forgot-password  reset-password  (app)/{dashboard,profile,users,...}
  modules/<domain>/  actions.ts queries.ts schema.ts types.ts events.ts policies.md *.test.ts
  lib/
    supabase/   client.ts server.ts admin.ts
    security/   authorize.ts rbac.ts stepup.ts ratelimit.ts upload.ts
    audit/      log.ts queries.ts
    outbox/     enqueue.ts worker.ts (later)
    status/     machines.ts colors.ts
  components/portal/  shell/  history/{HistoryButton,HistoryTimeline}  ui/{DataTable,Badge,Drawer,Spinner}
supabase/migrations/  0006…0013
```

---

## 3. Improved data model (rings)

**Ring A — Identity & access** (v1):
`organizations`, `organization_members`, `profiles` (have it), `roles`, `permissions`,
`role_permissions`.

**Ring B — Platform spine** (v1):
`audit_log` (generic), `rate_limit`, `email_log`; *prepared:* `notifications`, `outbox`.

**Ring C — CRM core** (thin in v1, full later):
`companies` (= SEMANU `clients`: customer legal entities), `contacts` (a person, **no
login**), `company_contacts` (link).

**Ring D — Domain modules** (later): `projects`, `project_activities`, `products`,
`documents`, `ndas`, `quotes`, `invoices`, `payments`. Every Ring-D row carries
`organization_id`, usually `company_id` and/or `project_id`, and a `status`.

**What already exists vs new:**

| Exists (0001–0006) | New in this plan |
|---|---|
| `leads`, `customers`, `orders`, `subscriptions`, `documents`(old), `requests`(old), `profiles` | `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `audit_log`, `rate_limit`, `email_log`, `companies`, `contacts`, (later) `notifications`, `outbox`, domain tables |

Note: the old `documents`/`requests` from 0003 (removed customer portal) are unused and will
be repurposed or dropped when the CRM document module is built.

---

## 4. RBAC / permissions model

**Tables**

- `roles(id, key unique, label, is_system bool, created_at)` — seed: `super_admin`, `admin`,
  `user` (system). Later: `project_manager`, `finance`, `sales`, `viewer`, `external_client`,
  `external_partner`, `auditor` — **inserted as data, no code change**.
- `permissions(id, key unique, module, label)` — seed the catalog below.
- `role_permissions(role_id, permission_id)` — which permissions a role grants.
- **Assignment lives on `organization_members(user_id, organization_id, role_id, member_type,
  status)`** — role is **per-organization** (the right model for multi-tenant; a user can be
  `admin` in one org and `viewer` in another). A global `user_roles` table is unnecessary.
- *Later:* `entity_grants(user_id, entity_type, entity_id, permission_id)` for sharing a
  single record (e.g. one project) with an external client.

**Permission catalog (seed):** `users.read/create/update/disable/change_role`,
`projects.read/create/update/delete`, `finance.read/create_invoice/send_invoice`,
`documents.read/upload/send`, `nda.create/send/revoke/view_audit`, `products.read/update`,
`audit.read`, `audit.read_technical` (IP/UA), `org.manage`, `roles.manage`.

**Resolution helpers (one place, used everywhere):**

- SQL: `public.has_permission(perm text) returns bool` — `SECURITY DEFINER`, reads the
  caller's membership → role → permissions for the **current org**. Used inside RLS.
- SQL: `public.is_admin()` (already shipped) becomes a thin wrapper:
  `has_permission('org.manage')`.
- Server: `requirePermission('users.create')`, `requireAuth()`, `can(action, entity)`,
  `getUserPermissions()` — live DB reads, cached per request.
- **No hardcoded role string checks** anywhere except the seed data.

**Why this stays simple in v1:** we seed only `admin` (all permissions) and `user` (read own
profile). `requireAdmin()` keeps working (now `requirePermission('org.manage')`). The whole
machinery is present but you only *use* two roles. Adding `finance` later = a few INSERTs.

**Migration from the current `profiles.role`:** keep `profiles.role` as a **denormalized
cache** for fast display only; the **source of truth is `organization_members.role_id`**.
A trigger keeps the cache in sync. (Or drop `profiles.role` entirely — see §18 for the
recommended choice.)

---

## 5. Organization / workspace model

| Concept | Table | Has login? | Notes |
|---|---|---|---|
| Tenant / workspace | `organizations` | – | v1: one row, "amai internal" |
| Membership + role | `organization_members` | – | `member_type`: internal / external_client / partner / auditor |
| Login identity | `profiles` (+ `auth.users`) | **yes** | internal staff or external client user |
| Customer legal entity | `companies` | – | name, VAT, address, account_manager |
| Person (no login) | `contacts` | **no** | linked to a company; may *later* be linked to a profile |

**Rules (mirroring SEMANU):**

- A **contact is not a user.** A company has many contacts. A portal **user** may optionally
  be linked to a `company_id` (that makes them an *external client user*).
- **Internal users**: `organization_members.member_type = internal`, no `company_id`.
- **External client users**: `member_type = external_client`, `company_id` set; RLS limits
  them to **their company's** rows plus any `entity_grants`.
- **RLS scoping pattern (every domain table):**
  `using ( organization_id = current_org() and has_permission('x.read')
           and ( member_type = 'internal' or company_id = current_company() or granted(...) ) )`.

**v1:** one org, all staff are internal members, `companies`/`contacts` exist but are barely
used, external users are **designed and disabled**.

---

## 6. Audit / event model

**One generic, append-only `audit_log`** (superset of SEMANU's `audit_log` + `*_events`):

```
id bigint pk
created_at timestamptz
organization_id uuid
actor_id uuid            actor_email text   actor_name text   actor_role text
actor_type text          -- internal_user | external_user | system | link_user | integration
action text              -- created | sent | opened | viewed | downloaded | signed | revoked
                         --  | status_changed | role_changed | file_uploaded | login | ...
entity_type text         entity_id text     entity_display_name text
parent_entity_type text  parent_entity_id text
old_status text          new_status text
old_values jsonb         new_values jsonb
metadata jsonb
ip_address inet          user_agent text
request_id text          session_id text
source text              -- portal | public_link | email_link | api | system_job | webhook
severity text            -- info | warning | critical
visible_to_admin bool default true
visible_to_client bool default false
```

- **Append-only, enforced.** RLS grants `SELECT` only; **no** `UPDATE`/`DELETE` policy for
  anyone. Writes go through a `SECURITY DEFINER` `log_event(...)` RPC (so the app cannot forge
  `actor_*`) or the service role. Deletion for retention = a new `redacted` event, never a
  mutation, unless legally required.
- **Status history is just audit rows** with `action='status_changed'` + `old_status` →
  `new_status`. (SEMANU keeps both a generic log *and* per-entity `*_events`; for v1 we use
  the **single table** and add per-entity materialization only if a hot path needs it — §18.)
- **Retention tiers** (different horizons, set per `entity_type`/`severity`):
  operational, security, document/NDA, finance, and GDPR delete-requests.

This one table powers the history-clock timeline for **every** module.

---

## 7. History icon / timeline UI

**Reusable, entity-agnostic components:**

```
<HistoryButton entityType="nda" entityId="…" />      // clock icon + "Last updated 2h ago"
<HistoryTimeline entityType="project" entityId="…" /> // the drawer body
```

- Data: a single server action / route `getHistory(entityType, entityId)` reads `audit_log`
  filtered by entity (RLS-enforced). Technical metadata (IP/UA, `metadata`) is returned only
  when `has_permission('audit.read_technical')`.
- **Drawer UX** (right side): title "Activity history"; top = current status + last event;
  then a timeline. Per event: icon, status color, title, actor + actor_type, timestamp,
  one detail line, expand for technical metadata, optional link to the related PDF/email.
- **Filters:** All · Status changes · Emails · Documents · Security · System.
- **Empty state**, loading skeleton, "load more". Normal users see only business-friendly
  events (`visible_to_client`/non-technical); admins see everything.
- **Placement:** a clock at the right of the header on user, company, contact, project,
  product, invoice, quote, NDA, document, outgoing email, payment request, portal invitation,
  customer request, readiness check, download, form submission.

Example timelines (User / Invoice / NDA / Project) are exactly the rows the schema in §6
produces. This is one component, reused — not NDA-specific.

---

## 8. Outbound actions / outbox model

**`outbox` table** (reliability for anything that leaves the system):

```
id, created_at, organization_id,
channel text         -- email | webhook | api | pdf | reminder
dedupe_key text       -- idempotency
payload jsonb
status text           -- pending | processing | sent | failed | retrying | cancelled
attempts int          last_attempt_at   next_retry_at
provider_message_id text
error text            -- sanitised
audit_event_id bigint -- link to the audit row
```

- A **worker** (Supabase cron / edge function) claims `pending`/`retrying` rows, processes
  them, updates status with exponential backoff; `dedupe_key` makes it idempotent.
- **Email truth levels** (be explicit in the UI):
  `email_sent` = we handed it to Resend · `email_delivered` = Resend webhook confirmed ·
  `email_bounced`/`email_complained` = webhook · `email_opened`/`email_link_clicked` =
  tracking pixels, **unreliable**, and only if privacy-allowed.
- **Email log:** `email_log(to_email, subject, template_key, resend_id, status, error,
  outbox_id, audit_event_id)` — mirrors SEMANU's `emails_sent` (`resend_id`+`status`).
- **v1 (your choice — full spine):** ship the `outbox` table **and** a **worker** (Supabase
  cron / edge function) with exponential backoff and an idempotent `dedupe_key`, plus
  `email_log` and the Resend **webhook** that flips delivered/bounced. Outbound email is
  **enqueued, not sent inline** — the app writes an outbox row, the worker delivers it.

---

## 9. Disabled-user security (immediate revocation)

Five layers so a disabled user is blocked on the **next request**, not at token expiry:

1. `profiles.status='disabled'` (or `organization_members.status`). `requireAuth()` /
   `requirePermission()` do a **live DB read** every request → immediate reject + redirect.
2. **RLS** `has_permission()` requires an **active** membership → DB rejects queries too.
3. **Supabase Auth ban**: `auth.admin.updateUserById(id, { ban_duration })` to stop token
   refresh, plus revoke existing refresh tokens / `auth.admin.signOut(id)` to force re-login.
4. **Audit**: `user_disabled` event with actor + reason + timestamp (admin can see *who*
   and *when*).
5. Protected layout + middleware fast-path redirect.

Re-enable mirrors this (`user_enabled` event, clear ban). This is why the **DB is the source
of truth** (a JWT-only check would keep working until the token expires — see §11/§12).

---

## 10. MFA / 2FA readiness (architecture, not built in v1)

- Use **Supabase Auth native TOTP MFA** + AAL levels — no custom crypto.
- Design the checkpoints now: `requireStepUp()` / `requireRecentAuth()` wrappers around
  **sensitive actions** (change role, disable user, finance export, invoice send, NDA revoke);
  policy hook "MFA required for admins"; backup codes + recovery flow; audit `mfa_enabled` /
  `mfa_disabled`.
- v1 ships the **checkpoints as no-op stubs** and an `aal` read helper; enforcement is a
  later flip. Optionally, later, RLS can require AAL2 for finance tables.

---

## 11. Rate limiting & abuse protection

**Two cooperating layers:**

- **Cloudflare** (already in front): network/IP throttling + **Turnstile** on sensitive
  public flows (password reset, public signing/intake links, contact form).
- **App-level `rate_limit` table** (`bucket, identifier, window_start, hits` — exactly
  SEMANU's `edge_rate_limit` sliding window) checked in server actions/route handlers for
  **email-based** and **account-based** limits that Cloudflare can't see: login, password
  reset, invite resend, file upload, public-link access, webhook ingest.
- **Hygiene:** generic error messages, **no account enumeration** (reset always says "if that
  address exists…"), and every suspicious hit logged to `audit_log` (`severity='warning'`).
- v1: limiter on login / reset / invite-resend + Turnstile on reset & public links. Folds in
  pending task #18 (Turnstile + rate-limit on `/api/leads`, `/api/checkout`).

---

## 12. RLS / security strategy & the role-check decision

**Decision: hybrid, DB-authoritative.**

- **Source of truth = the database.** RLS + `has_permission()`/`is_admin()` (`SECURITY
  DEFINER`) on every table; server actions call `requirePermission()` (live read) for
  sensitive operations; the **UI uses role/permission info only to show/hide**, never to
  authorize.
- **JWT custom claims** (org_id, coarse role) are allowed **only as a display/perf hint** to
  avoid a read on hot, low-risk paths. They are **stale until token refresh**, so they are
  **never** the sole check for sensitive actions, and RLS re-checks server-side regardless.
- **How fast does a role/disable change take effect?** Immediately, because sensitive paths
  read the DB live (§9). Claims would lag — that's why we don't rely on them for authz.
- **Where each check lives:** RLS (every table) · server actions (every mutation + sensitive
  read) · UI (cosmetic only).
- Service-role key: server-only (outbox worker, admin user-create, audit writer); a CI
  **bundle scan** asserts it never ships to the client. Anti-escalation triggers already in
  `0006`. Step-up re-auth for the most sensitive actions (§10).

---

## 13. Test plan (concrete)

**Access & authz (Vitest integration):** guest → protected route redirects; `user` →
`/app/users` blocked; `user` cannot read another profile; `user` cannot change own
role/status; `user` cannot read `audit_log`; `admin` can. **Disabled:** disabled user
rejected on next request; **stale session** of a disabled user rejected. **Escalation:**
crafted update of `role`/`status` is reverted (trigger). **Bundle:** service-role key name
absent from the client build. **Uploads:** wrong MIME rejected; oversize rejected.
**Auth flows:** reset for unknown email returns the generic message; invite resend is
rate-limited. **Audit assertions:** role change logged; user disable logged; the event shows
in the history timeline. **Public links:** access logged; expired/old link handled; webhook
signature validated.

**RLS tests (SQL harness run as a low-privilege role / pgTAP-style):** select/update/insert
policies per table; storage policies; privilege-escalation attempts; **organization-boundary**
checks (org A cannot see org B). Wire into CI as a gate.

---

## 14. Implementation phases (re-sequenced for the wide foundation)

- **P0 — Foundation+** *(extends 0006, still no UI)*: `organizations`, `organization_members`,
  `roles`, `permissions`, `role_permissions` + `has_permission()`/`requirePermission()`;
  generic `audit_log` + `log_event()`; `rate_limit`; **`outbox` + worker + `email_log` +
  Resend webhook**. Seed the org, roles, permission catalog, map `admin`/`user`.
- **P1 — Auth**: `/app` login, secure sessions, route protection, **password reset** (branded
  Resend, **enqueued via the outbox**), **disabled-user** handling.
- **P2 — Profile + avatar** (storage bucket + RLS, safe upload).
- **P3 — User management (admin)** + the reusable **HistoryButton/HistoryTimeline** on the
  user detail page + status-color system + audit on every user action.
- **P4 — Hardening**: rate limiting on sensitive flows, security + RLS tests, Supabase
  advisors, docs; **migrate leads/orders into the portal** under permissions; **retire the old
  `/admin`** password gate.
- **Later (designed, not built now)**: companies/contacts CRM · projects · documents · NDA ·
  finance · **outbox worker + Resend webhooks** · notifications center · **MFA** · external
  client portal · per-entity `entity_grants`.

---

## 15. v1 must vs later (explicit)

**Tables that must exist in v1:** `profiles` (have it), `organizations`,
`organization_members`, `roles`, `permissions`, `role_permissions`, `audit_log`,
`rate_limit`, `outbox`, `email_log`, plus thin `companies`/`contacts`. Storage `avatars` bucket.

**Tables prepared but created later:** `notifications`, `entity_grants`,
`projects`, `project_activities`, `products`, `documents`(new), `ndas`, `nda_events`,
`quotes`, `quote_versions`, `invoices`, `invoice_events`, `payments`.

**Build in v1:** Supabase Auth · `/app` login · password reset · profiles · admin/user roles
(via the permission tables, seeded) · user management · generic `audit_log` · the history
clock on the user detail page · audit timeline base component · disabled-user handling · safe
avatar upload · basic rate limiting · **outbox worker + email_log + Resend webhook** · RLS tests.

**Prepare only (no build):** organizations/workspaces UI · granular permissions UI · external
client users · finance/NDA/project modules · notifications center · MFA · the full CRM/ERP.

---

## 16. Risks & attention points

- **Multi-tenant retrofit is the big one** — that's why `organization_id` goes on every table
  *now*, even with one org.
- **Over-engineering the permission UI** — keep v1 seeded to two roles; don't build a
  role-editor yet.
- **Audit write-path discipline** — the audit append must be in the **same transaction** as
  the domain write, or you get gaps. Enforce via the `log_event()` helper / module `events.ts`.
- **Outbox/worker ops** — needs a cron/edge runner; that's why the full worker is later.
- **Supabase MFA/AAL caveats** — AAL handling and recovery need care; stub now.
- **amai Supabase is NOT in the connected MCP account** (only SEMANU is) — you apply these
  migrations to the amai project yourself, and I can't auto-test against it.
- **Live permission checks cost a read** — cache per request; JWT claim is an optional later
  optimization, never the authz.
- **GDPR** — personal data across the CRM: soft vs hard delete, access auditing, retention,
  IP/UA admin-only.
- **Don't break the live marketing site** — the portal is isolated under `/app`; the
  middleware split must exclude it from i18n.
- **Status colors are semantic, not brand** — introduce a small semantic palette beside the
  brand red so badges read correctly across modules (§17 `lib/status/colors.ts`).

---

## 17. Concrete files / migrations to touch first

**Migrations (0006 already written; new ones additive):**

- `0007_organizations.sql` — `organizations`, `organization_members` (+ `current_org()`,
  `current_company()` helpers), seed one org + memberships; backfill from `profiles`.
- `0008_rbac.sql` — `roles`, `permissions`, `role_permissions`, `has_permission()`; reseat
  `is_admin()` on top; seed catalog + admin/user.
- `0009_audit_log.sql` — generic `audit_log` + `log_event()` RPC + append-only RLS.
- `0010_rate_limit.sql` — sliding-window table + helper.
- `0011_companies_contacts.sql` — thin `companies`, `contacts`, link table (RLS on).
- `0012_avatars_storage.sql` — private `avatars` bucket + per-user storage policies.
- `0013_outbox_email.sql` — `outbox` (queue + status), `email_log`, Resend webhook (v1).

**Code to add/extend:** `lib/types/database.ts` (extend types); `lib/security/authorize.ts`
+ extend `rbac.ts` (`requirePermission`, `can`, `getUserPermissions`); `lib/audit/log.ts`;
`lib/ratelimit.ts`; `lib/status/{machines,colors}.ts`; `modules/{organizations,companies,
contacts,audit,users,auth}/*`; `components/portal/history/{HistoryButton,HistoryTimeline}`;
`components/portal/ui/{Badge,Drawer,DataTable,Spinner}`; the middleware split for `/app`.

**Read first (no change yet):** `src/i18n/routing.ts` (matcher), `next.config.*` (headers),
`src/app/globals.css` (tokens), `src/app/[locale]/admin/*` (leads/orders to migrate),
and SEMANU's `email_templates` shape as a style reference.

---

## 18. My recommended choices

1. **Multi-tenant now:** `organization_id` on every domain table from the first migration.
2. **Permission tables now, seeded to `admin`/`user`:** gate everything via
   `requirePermission()` / `has_permission()`; adding roles later is data.
3. **`organization_members.role_id` is the source of truth.** **Drop `profiles.role`** (don't
   keep a cache to drift) — resolve role/permissions through membership. (`0006`'s `role`
   column becomes a transitional default we migrate off in `0008`.)
4. **One generic append-only `audit_log`** as the history source for v1; add per-entity
   materialized event tables only where a hot path proves it's needed.
5. **DB live checks are the authority**; JWT claims are a display/perf hint only; **step-up
   re-auth checkpoints stubbed now**.
6. **Disabled = `status` + live check + Supabase ban + session revoke** (all five layers).
7. **Rate limit = Cloudflare + DB sliding-window table**; **Turnstile** on reset + public
   links.
8. **Outbox: full spine in v1 (your choice)** — `outbox` (pending/processing/sent/failed/
   retrying/cancelled) + a Supabase cron/edge **worker** with backoff, `email_log`, and the
   Resend webhook. Outbound email is enqueued, not sent inline.
9. **MFA: Supabase native, designed + stubbed, off in v1; required-for-admins later.**
10. **Status colors:** a small semantic palette (`draft=grey, sent=blue, waiting=amber,
    opened=purple, done/paid=green, cancelled=grey-red, revoked/failed=red, system=neutral,
    warning=amber, critical=red`) reused across badges, timelines, tables.
11. Carried from v1: **path `/app`**, **branded Resend (`generateLink`)**, **admin-only
    sign-ups**, **replace the old `/admin`** (migrate leads/orders under permissions, last).

**Decisions you locked (this plan reflects them):**

- **A — Permission tables in v1: yes**, seeded to `admin`/`user`; gate everything via
  `has_permission()` / `requirePermission()`. Adding a role later is data, not code.
- **B — Membership is the source of truth: yes.** `profiles.role` is dropped (no synced cache
  that can drift); role/permissions resolve through `organization_members`.
- **C — Full outbox spine in v1.** The complete `outbox` + retry **worker** + `email_log` +
  Resend webhook ship in v1; outbound email is enqueued, not sent inline.

Build starts only on your explicit go.

---

# Part B — Final refinements (approved) & execution plan (v3)

> Part B is the **authoritative final layer**; where it differs from Part A above, **Part B
> wins**. The architecture is approved; these are the refinements to apply before building.
> **Nothing is built yet.**

## B1 · Approved refinements (deltas over Part A)

1. **Outbox = minimal reliable in v1.** Ship only: an `outbox` table, an `email_log` table,
   `enqueueEmail()`, a **worker** that moves rows `pending → sent | failed`, **basic retry**
   with backoff, and an idempotent **`dedupe_key`**. **Deferred to a later phase:** Resend
   delivery/bounce **webhook**, open/click **tracking**, notification center, delivery
   dashboards — none are needed for invite or password-reset (those only need a reliable send).

2. **Platform `super_admin` (two planes).**
   - *Organization plane* (normal, org-scoped): roles on `organization_members` —
     `organization_admin`, `organization_user`, `external_client`, `external_partner`,
     `auditor`; resolved by `has_permission()`.
   - *Platform plane* (reserved): **`platform_super_admin`**, stored in a separate
     `platform_admins` table (**not** an org role), resolved by `is_platform_super_admin()`.
     It grants **cross-organization** access for internal platform administration, emergency
     support and migrations, and is used sparingly. **Every** platform_super_admin action is
     audited (`source='platform'`, `severity ≥ warning`). RLS adds `or is_platform_super_admin()`
     only where cross-org access is legitimate, and those paths always log.
   - v1 actively uses `organization_admin` + `organization_user`; the owner is also
     `platform_super_admin` (bootstrap + support). The other roles are seeded but unused.

3. **Impersonation — prepared, not built.** Documented future design only: requires
   `platform_super_admin` + step-up/MFA + an explicit **reason**; emits `impersonation_started`
   / `impersonation_stopped` audit events (target, reason, duration); shows a persistent UI
   **banner**; explicit start/stop; and a **deny-list** of sensitive actions (role changes,
   finance exports, security settings) unless explicitly allowed. v1 adds nothing beyond
   leaving the audit `action`/`source` values open-ended.

4. **Soft-delete & archiving (convention).** Business entities carry `deleted_at`,
   `deleted_by`, `deletion_reason`, `archived_at`, `archived_by`. Default queries/RLS exclude
   `deleted_at is not null`; soft-deleted rows leave the normal UI but remain for audit. **Hard
   delete** is reserved for technical cleanup or legal erasure and itself emits an audit event.
   The convention applies from `companies`/`contacts` onward — the v1 table set has no business
   entities yet (users use `status`, not soft-delete, because they are bound to `auth.users`;
   a GDPR erase is a separate hard-delete + anonymise procedure).

5. **Formal status machines.** One definition per domain (`modules/<domain>/status.ts`, shared
   types in `lib/status/`): each status has a **label** + **color token**; each transition
   declares `from→to`, allowed/forbidden, **terminal**, **required permission**, **audit event
   emitted**, and **whether an outbound action fires**. A single `applyTransition()` enforces
   it. **No status logic in UI components or ad-hoc server actions.** v1 wires the user
   `status` and the existing leads/orders statuses into this shape.

6. **Raw vs display audit.** `audit_log` is the **raw evidence** layer (immutable, complete).
   The UI renders **display events** from a template map (`lib/audit/display.ts`, keyed by
   `action` + `entity_type`) into safe human sentences. **Technical fields** (`ip_address`,
   `user_agent`, webhook payloads, `error`, provider responses, raw `before/after`) are returned
   **only** to holders of `audit.read_technical`; the history query strips them otherwise.

7. **Migration discipline — additive only.** Never edit an applied migration; corrections are
   new migrations. **One-time exception:** `0006` has **not** been applied anywhere (the amai
   Supabase is not in the connected account and it has never been run), so it is **revised in
   place** as part of the coherent foundation set in B3. From the first apply onward,
   additive-only, and `leads`/`customers`/`orders` are never touched.

8. **v1 scope is fixed** — exactly the build / do-not-build lists you gave; see B4 (tables) and
   B5 (files).

## B2 · Final implementation phases

| Phase | Builds | Done when |
|---|---|---|
| **P0 Foundation** | migrations 0006–0012, extended types, libs (`authorize`, `rbac`, `audit`, `ratelimit`, `outbox`, `status`), seed | `tsc` green, no UI |
| **P1 Auth** | `/app` routing split, login, session refresh, `/auth/callback`, sign-out, **password reset** (branded, enqueued via outbox), **disabled-user** revocation, PortalShell + `!` spinner | login + reset work for a test user |
| **P2 Profile** | profile view/edit (self), **avatar upload** (storage + RLS, validated) | user edits self + uploads avatar |
| **P3 Users + History** | admin user mgmt (list/create/edit/disable/resend), **HistoryButton/HistoryTimeline** on user detail, status colors, audit on every action | admin manages users; timeline shows events |
| **P4 Hardening** | rate limiting on sensitive flows, **RLS + abuse tests**, advisors pass, **migrate leads/orders** under permissions, **retire old `/admin`**, docs | tests green; advisors clean |

Every phase: `npx tsc --noEmit` clean, tests green, the live marketing site untouched, all
migrations additive.

## B3 · Exact migration order (v1)

Applied to the **amai** Supabase project in order. `0006` is revised **before** first apply;
all are additive thereafter.

1. **`0006_profiles.sql`** *(revised)* — `profiles` (identity + account `status`, **no role
   column**), `handle_new_user()` (insert a profile on auth signup), `updated_at` trigger. The
   role model + privilege-guard move to `0008` (they need the authz functions first).
2. **`0007_organizations.sql`** — `organizations`, `organization_members`
   (`user_id, organization_id, role_id, member_type, status`), `current_org()`; seed one org.
3. **`0008_rbac.sql`** — `roles`, `permissions`, `role_permissions`, `platform_admins`;
   `has_permission()`, `is_org_admin()`, `is_platform_super_admin()`; the `profiles`
   privilege-guard trigger; seed the permission catalog + the 6 roles + map the owner to
   `platform_super_admin` + `organization_admin`.
4. **`0009_audit_log.sql`** — `audit_log` (raw, append-only), `log_event()`, RLS (select gated
   by `audit.read`; technical columns reachable only through the permission-checked path).
5. **`0010_rate_limit.sql`** — `rate_limit` (sliding window) + `hit_rate_limit()`.
6. **`0011_outbox_email.sql`** — `outbox`, `email_log`, `claim_outbox()`/`complete_outbox()`
   for the worker. **No webhook.**
7. **`0012_avatars_storage.sql`** — private `avatars` bucket + per-user-folder storage policies.

*(Later, additive: companies/contacts, projects, products, documents, nda, finance,
notifications, entity_grants, impersonation, resend-webhook + tracking.)*

## B4 · Exact v1 tables

`profiles` · `organizations` · `organization_members` · `roles` · `permissions` ·
`role_permissions` · `platform_admins` · `audit_log` · `rate_limit` · `outbox` · `email_log`
+ storage bucket **`avatars`**. **No** companies/contacts/domain tables in v1.

## B5 · Exact v1 files

```
supabase/migrations/
  0006_profiles.sql (revised)   0007_organizations.sql   0008_rbac.sql
  0009_audit_log.sql            0010_rate_limit.sql       0011_outbox_email.sql
  0012_avatars_storage.sql

src/lib/
  supabase/admin.ts                 service-role + auth-admin client (server only)
  security/authorize.ts             has_permission / is_org_admin / is_platform_super_admin wrappers
  security/rbac.ts (extend)         requireAuth / requirePermission / requireOrgAdmin / getUserPermissions / can
  security/ratelimit.ts             hit() over rate_limit
  security/upload.ts                avatar validation (mime + size + magic bytes)
  audit/log.ts                      logEvent() server writer (via log_event RPC)
  audit/queries.ts                  getHistory(entityType, entityId) (+ technical-field strip)
  audit/display.ts                  action+entity -> human message templates
  outbox/enqueue.ts                 enqueueEmail()
  outbox/worker.ts                  processPending() (claim / send / complete / retry)
  email/{render.ts, templates/}     branded invite + reset HTML
  status/{types.ts, colors.ts}      state-machine types + semantic color tokens
  types/database.ts (extend)        regenerate after apply

src/modules/
  auth/  actions.ts queries.ts schema.ts(have) emails.ts *.test.ts
  users/ actions.ts queries.ts schema.ts(have) types.ts(have) *.test.ts
  organizations/ queries.ts types.ts

src/app/
  (portal)/login/page.tsx  forgot-password/page.tsx  reset-password/page.tsx
  (portal)/(app)/layout.tsx  dashboard/page.tsx  profile/page.tsx
  (portal)/(app)/users/page.tsx  users/new/page.tsx  users/[id]/page.tsx
  auth/callback/route.ts
  api/cron/outbox/route.ts          CRON_SECRET-guarded worker trigger

src/components/portal/
  shell/{PortalShell,Sidebar,Topbar}.tsx
  ui/{Spinner,Badge,Drawer,DataTable,FormField,Avatar}.tsx   Spinner = the gold ! loader
  history/{HistoryButton,HistoryTimeline}.tsx

src/middleware.ts (edit)            exclude /app from i18n + Supabase session refresh
vercel.json (new/edit)              outbox cron schedule
```

## B6 · Test checklist (v1)

**Route & permission (Vitest):** guest → `/app/*` redirects to login · `organization_user`
cannot open `/app/users` · cannot read another profile · cannot read `audit_log` ·
`organization_admin` can · `platform_super_admin` cross-org reads are **audited**.
**Privilege escalation:** crafted update of own `status`/`email` is reverted by the guard
trigger · a user cannot self-assign a role. **Disabled user:** rejected on the **next**
request · a **stale session** is rejected · Supabase ban blocks token refresh. **Secrets:**
service-role key name is **absent** from the client bundle. **Avatar upload:** wrong MIME
rejected · oversize rejected · filename sanitised to `{user_id}/…`. **Auth flows:** reset for
an unknown email returns the **generic** message (no enumeration) · invite-resend and login are
**rate-limited**. **Outbox:** enqueue writes `pending` · worker → `sent` · failure → `failed`
+ retry · `dedupe_key` prevents a double send. **Audit:** `user_created` / `role_changed` /
`user_disabled` logged · technical fields hidden without `audit.read_technical` · the display
message renders · the event shows in `HistoryTimeline`.
**RLS (SQL harness, low-priv role):** profiles select/update · org-member scoping ·
`audit_log` is append-only (no update/delete) · `rate_limit`/`outbox` unreadable by `anon` ·
storage `avatars` own-folder only · **org-boundary** (org A cannot see org B) ·
`platform_super_admin` override paths are logged.

## B7 · Rollback strategy

- **Code:** the portal is isolated under `/app`, so reverting is a **Vercel rollback** to the
  previous deployment (or `git revert`) — it removes `/app` entirely and the marketing site is
  untouched (separate routes; the middleware change is additive).
- **Feature flag:** `/app` is gated behind **`PORTAL_ENABLED`**, so it can be switched off
  without a redeploy.
- **DB:** migrations are **additive** — new tables are inert when the code isn't deployed, so a
  code rollback alone is safe. To undo schema, ship a **corrective additive migration** (e.g.
  `00xx_drop_outbox.sql`); never hand-edit or delete an applied one, and **never** touch
  `leads`/`customers`/`orders`. Each migration file carries a commented `-- ROLLBACK:` block
  with the exact `drop` statements.
- **Auth fallback:** the old `/admin` password gate stays live until **P4**, so a broken portal
  release never locks you out.

## B8 · Manual configuration

**Supabase (the amai project — NOT a SEMANU project):**
- Apply `0006–0012` in order (SQL editor or CLI); then regenerate `src/lib/types/database.ts`.
- Auth → Providers: email/password **on**, public **sign-ups OFF** (admin-created only).
- Auth → URL config: site URL `https://amai.ch`; redirect allow-list
  `https://amai.ch/app/auth/callback` and `https://amai.ch/app/reset-password` (+ preview URLs).
- Auth emails: we send via **Resend through our outbox** (branded `generateLink`), so Supabase
  SMTP is optional. If you also want Supabase's own mails branded, set custom SMTP = Resend.
- Storage: confirm the `avatars` bucket (created by `0012`) is **private**.
- Copy the **service-role key** to Vercel (server-only). Run **Advisors** (security +
  performance) after applying.

**Vercel:**
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET`,
  `PORTAL_ENABLED`, (Turnstile site + secret).
- **Cron:** add a Vercel Cron (≈ every minute) → `POST /api/cron/outbox`, guarded by
  `CRON_SECRET`, that runs the outbox worker. *(Alternative: Supabase pg_cron + edge function.)*
- Confirm `/app` is server-rendered and **not cached** (auth pages `no-store`).

**Resend:**
- Verified domain `amai.ch` (done); API key in Vercel.
- From address `amai! <noreply@amai.ch>` for invite/reset.
- v1 = **send only**; no webhook configured yet (deferred with delivery tracking).

**Cloudflare:**
- Rate-limit rules on `/app/login`, `/app/forgot-password`, `/app/reset-password`, `/api/*`.
- **Turnstile** (site + secret) for password reset and any public flow (folds in task #18).
- Cache rule: **bypass cache** for `/app/*` and `/api/*`. Keep Full (strict) SSL + WAF (on).

---

**This is the final plan. Build starts only on your explicit go — I will begin with P0
(migrations 0006–0012 + the lib spine, type-safe, no UI).**
