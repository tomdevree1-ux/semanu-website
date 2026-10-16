# Portal — P0 Foundation Retrospective Audit

> Source of truth: `AMAI_PORTAL_MASTER_PLAN.md` (Part B authoritative). Inspect/compare/report
> only — **nothing built or modified.** Audited against the **as-applied** live amai DB
> (ref `bkwwlmflsbhrsfwydbnv`) + the repo.

## Headline

The **database foundation is implemented correctly, securely, and additively** on the existing
amai platform — solid and ready to build on. **But two repo-level artifacts diverged from
reality** and must be reconciled before P1:

1. **The repo migration files `0006–0012` are OBSOLETE and dangerous** — they are the abandoned
   *from-scratch* "drop `profiles`/`roles`/`documents`/`requests` then recreate" versions that
   were **never applied**. The migrations actually applied are seven **additive** ones recorded
   only in Supabase (`portal_profiles_extend` … `portal_lock_service_role_functions`). If anyone
   ran the repo's `0006`, it would **drop the live `profiles`/`roles`** and break the system.
2. **The TypeScript libs + `database.ts` target the from-scratch schema, not the live schema**
   (roles `uuid` vs `smallint`, `audit_log` vs `audit_logs`, no `user_roles`, wrong `profiles`
   shape). `tsc` passes only because `database.ts` is hand-written to the *wrong* shape. This is
   task **#73**.

Everything else conforms (with a few minor, documented build-on deviations).

---

## 1. Migration review

**Applied (live, in `supabase_migrations.schema_migrations`) — all additive:**
`portal_profiles_extend`, `portal_organizations`, `portal_permissions`, `portal_audit_extend`,
`portal_outbox`, `portal_avatars_storage`, `portal_lock_service_role_functions`.

- **Created/modified:** the 7 additive migrations above (ALTER + CREATE only).
- **0006 revised safely before first apply?** N/A in the way the plan meant — the from-scratch
  `0006` was **abandoned, not applied**; an additive `portal_profiles_extend` was applied
  instead. So no destructive 0006 ever ran. ✅ (but the obsolete file still sits in the repo — see Headline #1).
- **Additive from here?** ✅ every applied migration is `ALTER ADD`/`CREATE`/`CREATE OR REPLACE`;
  nothing dropped. `documents`/`requests` were **kept** (not dropped), which is safer than the
  plan's intent.
- **Business tables touched?** ❌ none — `leads/customers/orders/subscriptions/documents/requests`
  untouched (verified: only profiles + audit_logs were ALTERed, both additively).
- **Rollback comments?** ⚠️ present in the **repo** files (obsolete) but **not** stored with the
  applied migrations (MCP applies don't carry the `-- ROLLBACK` comments). Low risk (DB is not
  yet live), but the repo record is misleading.
- **Order correct?** ✅ applied in dependency order (profiles → orgs → permissions → audit →
  outbox → avatars → lockdown).
- **FK-ordering / missing-dependency risk?** ✅ none at apply time (`organization_members.role_id
  → roles` worked because `roles` pre-existed). ⚠️ **Latent reproducibility risk:** these additive
  migrations ALTER pre-existing tables (`profiles`,`roles`,`user_roles`,`audit_logs`) that were
  built **manually** (no migration history). A fresh Supabase **branch** that replays only the
  recorded migrations would **fail** (those base tables wouldn't exist). Not a P1 blocker, but
  branching/repro is broken until the base schema is also captured as migrations.

## 2. Profiles review

- Identity/account metadata only ✅ (`first_name`,`last_name`,`email`,`full_name`,`avatar_url`,
  `last_login_at`,`status`,`is_active`,`created_by`). No role column as source of truth ✅
  (roles live in `user_roles`).
- Disabled-user support ✅ `status` ∈ (active/disabled/invited) + `profiles_sync_active` keeps
  `is_active` ⇄ `status` so the existing functions/policies stay correct.
- `handle_new_user()` ✅ safe (`SECURITY DEFINER`, `search_path=public`, `on conflict do nothing`,
  reads metadata; sets status default `invited`).
- `updated_at` trigger ✅ (`touch_updated_at`, pre-existing).
- RLS ✅ enabled; policies `profiles_select_self_or_admin`, `profiles_update_self` (pre-existing).
  ⚠️ Note: the master plan's anti-escalation **privilege-guard trigger** (force role/status back
  for non-admins) was **not** added — `profiles_update_self` lets a user update their own row;
  `status` is protected only by app logic, not a DB trigger. **Should-fix** (add a guard trigger)
  before user-management (P3), not strictly P1.

## 3. Organizations review

- `organizations` ✅, `organization_members` ✅ (FK `role_id → roles` smallint), `amai` org seeded ✅.
- `current_org()` ✅ exists (`select … where status='active' limit 1`).
- v1-only documentation: ⚠️ the applied function has **no** "v1 assumption only" comment (it was
  in the abandoned repo file). **Documentation-only** gap.
- Hidden multi-org assumptions: none — but **membership is NOT yet the source of truth for
  access**: `has_permission()` resolves through **`user_roles`** (the existing RBAC), not
  `organization_members`. Org membership is currently informational. **Deviation from plan**
  (acceptable build-on; org-scoped authorization is deferred). Document.

## 4. RBAC review

- `roles` ✅, `permissions` ✅ (9), `role_permissions` ✅, `platform_admins` ✅.
- `organization_admin` / `organization_user` seeded? ❌ **No.** The live roles are the existing
  **`admin, analyst, sales, reviewer, read_only`**. The plan's role names were **not** introduced;
  the existing functional roles are reused. **Deviation from plan** (intentional build-on).
- Future roles seeded-but-unused: partially — `analyst/sales/reviewer/read_only` exist and map to
  `audit.read`; they're the outreach roles, not the plan's `finance/project_manager/...`.
- `platform_super_admin` separate from org roles ✅ (`platform_admins` table + `is_platform_super_admin()`).
- `has_permission()` ✅ works — resolves via `user_roles → role_permissions → permissions`
  (+ super-admin short-circuit) and requires `profiles.status='active'`.
- `is_org_admin()` ✅ (`is_admin() or is_platform_super_admin()`).
- `is_platform_super_admin()` ✅.
- No hardcoded role checks except seed/bootstrap ✅ (runtime checks go through the functions).
- Catalog not broadly readable ✅ `permissions`/`role_permissions` select = **admin-only**
  (`permissions_select_admin`); normal users get only resolved keys via `get_user_permissions()`.
- Resolved permissions via safe server helper ✅ (`get_user_permissions()`; `authorize.ts` wraps it).

## 5. Bootstrap safety

- Owner = **`tomdevree1@gmail.com`** (the only auth user; `hello@amai.ch` doesn't exist yet).
- Verifies exactly one match? ⚠️ **Partial.** The applied DO-block raises if **no** profile is
  found, but does **not** check for **multiple** matches (`select … into` silently takes one).
  The plan's C5 wanted a `count(*)` guard that fails on >1. **Should-fix** (low risk — email is
  effectively unique).
- Fails loudly if none found ✅ (`raise exception`).
- Granted `platform_super_admin` + `admin` role + `amai` org membership ✅ (verified: 1
  platform_admin, 1 org member, admin→9 perms).
- Profile activated ✅ (`status='active'`).
- Silent failure possible? ⚠️ only the >1-match edge case.

## 6. Audit review

- `audit_logs` ✅ (the existing table, extended with all 7 technical columns + actor_*, source,
  severity, organization_id, visibility flags).
- Append-only ✅ — only a `SELECT` policy exists; no insert/update/delete policy, so writes are
  only via `log_event()`/service role.
- Raw `audit_logs` SELECT restricted ✅ but ⚠️ via **`is_admin()`**, not `has_permission('audit.read_technical')`.
  Functionally close (admin is the only role with `audit.read_technical`), but **not literally
  per C8**. A future non-admin granted `audit.read_technical` would not get raw access. **Should-fix**
  (swap the policy to `has_permission('audit.read_technical') or is_platform_super_admin()`).
- Technical fields protected ✅ — `audit_history()` (display-safe RPC, gated by `audit.read`)
  returns **none** of ip/ua/metadata/old/new_values/request_id/session_id; only raw-table readers
  (admins) see them.
- `audit.read` users cannot see technical fields ✅ (they use `audit_history`, not the raw table).
- `audit.read_technical` required for technical metadata ✅ (effectively — admins only).
- `platform_super_admin` access auditable ✅ (`log_event` stamps `actor_role='platform_super_admin'`;
  intended `source='platform'` usage is by convention).
- `log_event()` not client-abusable ✅ **verified** — `anon=false, authenticated=false,
  service_role=true`.
- Client code calls `log_event` directly? ❌ no — only `lib/audit/log.ts` (server, admin client).
- `logEvent()` server wrapper ✅ `src/lib/audit/log.ts`.
- Display templates prepared ✅ `src/lib/audit/display.ts` (initial map) — fine for P0.
- Future HistoryTimeline can read safely ✅ via `audit_history()` + `getHistory()` (`audit/queries.ts`).

## 7. Rate-limit review

- `rate_limit` ✅ (pre-existing, exact shape), `hit_rate_limit()` ✅ (pre-existing, `SECURITY DEFINER`).
- Raw emails in `identifier`? ✅ not stored by design — `ratelimit.ts` builds **hashed**
  `ip_hash:`/`email_hash:`/`user:` identifiers; the DB just stores the string.
- Hashing + server salt ✅ implemented in `lib/security/ratelimit.ts` using `env.rateLimitSalt`
  (`RATE_LIMIT_SALT`). ⚠️ **Not yet exercised** (no flow calls it until P1) and the env var isn't
  set yet — *prepared*, correct.
- Avoids enumeration ✅ helper returns `{allowed}` only; generic-message usage is a P1 concern.

## 8. Outbox review

- `outbox` ✅, `email_log` ✅.
- Statuses ✅ all six: pending/processing/sent/failed/retrying/cancelled (CHECK constraint).
- `claim_outbox()` ✅, `complete_outbox()` ✅ (both `service_role`-only — verified).
- `dedupe_key` required ✅ **NOT NULL + UNIQUE** (verified).
- Duplicate dedupe → no double send ✅ (`enqueueEmail` returns the existing row on conflict;
  unique constraint enforces it).
- `enqueueEmail()` ✅ `src/lib/outbox/enqueue.ts`; worker foundation ✅ `src/lib/outbox/worker.ts`
  (claim → Resend → complete, backoff).
- Resend webhook ❌ not implemented (correctly deferred). Open/click tracking ❌ deferred.
  Notification center ❌ deferred. ✅ all out-of-scope-for-v1, as intended.
- ⚠️ The **worker runner** (`/api/cron/outbox` + Vercel Cron) is **not** created yet — needed in
  P1 for emails to actually send. (Expected; P1.)

## 9. Avatar storage review

- `avatars` bucket ✅ created (`portal_avatars_storage`).
- Private ✅ (`public=false`).
- Per-user folder access ✅ — 4 `storage.objects` policies: `(storage.foldername(name))[1] =
  auth.uid()` OR `is_org_admin()`/`is_platform_super_admin()`.
- No UI upload ✅ (none built).
- Upload validation helper ✅ prepared (`src/lib/security/upload.ts`, mime+size; magic-byte check
  deferred to P2 as noted).

## 10. TypeScript foundation review

All present; **all server-safe** (none imported by a `'use client'` file — verified). **However
all type against the from-scratch schema, not the live DB** → must sync (#73).

| File | Exists | Scope | Exports | Concern |
|---|---|---|---|---|
| `lib/supabase/admin.ts` | ✅ | server | `createAdminClient`, `authAdmin` | ok |
| `lib/security/authorize.ts` | ✅ | server | `currentOrg`,`hasPermission`,`isOrgAdmin`,`isPlatformSuperAdmin`,`getUserPermissions` | rpc names exist live ✅ |
| `lib/security/rbac.ts` | ✅ | server | `requireAuth`,`requirePermission`,`requireOrgAdmin`,`getCurrentProfile`,`can`,… | reads `profile.status` (live has it) — but `Profile` type from wrong `database.ts` |
| `lib/security/ratelimit.ts` | ✅ | server | `checkRateLimit`,`*Identifier` | ok (hashing) |
| `lib/security/upload.ts` | ✅ | client-safe | `validateAvatarMeta` | ok |
| `lib/audit/log.ts` | ✅ | server | `logEvent` | calls live `log_event` ✅ |
| `lib/audit/queries.ts` | ✅ | server | `getHistory`,`getHistoryTechnical` | `getHistoryTechnical` reads `audit_log` (live is `audit_logs`) ❌ name mismatch |
| `lib/audit/display.ts` | ✅ | client-safe | `auditLabel`,`auditColor`,maps | ok |
| `lib/outbox/enqueue.ts` | ✅ | server | `enqueueEmail`,`emailDedupeKey` | `.from('outbox')` typed wrong but table exists |
| `lib/outbox/worker.ts` | ✅ | server | `processPending` | rpc ok; types off |
| `lib/status/types.ts` | ✅ | client-safe | state-machine types | ok |
| `lib/status/colors.ts` | ✅ | client-safe | `STATUS_COLORS`,`statusColor` | ok |
| `lib/types/database.ts` | ✅ | type | `Database`,aliases | **❌ describes from-scratch schema** (roles uuid, `audit_log`, no `user_roles`, wrong `profiles`/`customers`) |

**`database.ts` is the core problem:** it must be regenerated from the live schema; several libs
reference `audit_log`/`organization_members.role_id:uuid`/etc. that don't match live. `tsc` is
green only because the types are *internally* consistent with the wrong shape.

## 11. Security review

- Service-role key never in client components ✅ (verified — no `'use client'` file imports
  `createAdminClient`/service role).
- Server-only files: ⚠️ none carry an explicit `import 'server-only'` marker; isolation relies on
  usage (they use `next/headers`/admin client). **Doc/should-fix** (add `server-only`).
- RLS is the DB boundary ✅ (every portal table RLS-on; advisors confirm).
- Server helpers enforce permissions ✅ (`requirePermission`/`has_permission`).
- No sensitive errors exposed ✅ at the lib level (P1 will own user-facing messages).
- `platform_super_admin` override explicit + auditable ✅ (`is_platform_super_admin()` is the only
  cross-cutting path; `log_event` records it).
- Disabled-user enforcement prepared ✅ (`status` + `requireAuth` reads it; live status check).
- Org-boundary enforcement: ⚠️ **partial** — `current_org()` exists but `has_permission` is not
  org-scoped (uses `user_roles`). For a single internal org this is fine; document.
- No P1/P2/P3 work accidentally built ✅ (no `/app` routes, no auth pages, no UI).
- Advisor notes (from apply): `leaked_password_protection` **off** (enable in Auth — manual);
  `rls_enabled_no_policy` on `outbox/email_log/rate_limit/stripe_events/leads/orders` is
  **intentional** (service-role-only / pre-existing); read-helper `SECURITY DEFINER` functions
  callable by `authenticated` is **by design** (matches existing `is_admin` pattern, needed by RLS).

## 12. Test review

| Check | Status | Note |
|---|---|---|
| TypeScript (`tsc --noEmit`) | **passed** | ⚠️ but against the wrong `database.ts` (see §10) |
| Lint | not run | no separate lint step inspected |
| Migration validation | **partial** | pglast syntax-validated the **obsolete** repo files, not the applied ones; applied ones succeeded live |
| RLS / security smoke tests | not available | no automated RLS test harness; verified manually via SQL + advisors |
| Outbox function tests | not available | `claim/complete` not behaviorally unit-tested |
| Rate-limit tests | partial | identifier-hashing unit-tested (`portal-helpers.test.ts`); DB fn not |
| Service-role client bundle safety | **passed** | no client component imports the admin client |
| Existing app tests (Vitest) | **passed** | 26/26 (18 prior + 8 portal-helpers) |

## 13. Gap analysis

| Requirement | Implemented | Evidence | Risk | Recommended fix | Must-fix before P1 |
|---|---|---|---|---|---|
| Repo migrations = as-applied | **No** | repo `0006–0012` are from-scratch; live = `portal_*` | **High** (dangerous if reapplied) | Replace repo migrations with the applied additive SQL (export from DB) | **Yes** |
| `database.ts` + libs match live schema | **No** (#73) | `database.ts` from-scratch; `audit_log` vs `audit_logs` | **High** (code won't run vs live) | Regenerate types from live + adapt libs | **Yes** |
| Migrations additive / no business tables touched | Yes | applied = ALTER/CREATE; leads etc. intact | Low | — | No |
| profiles identity + status, no role col | Yes | live schema | Low | — | No |
| Privilege-guard trigger on profiles | **No** | only `profiles_update_self` | Med | add guard trigger | No (before P3) |
| organizations + members + current_org | Yes | live | Low | add v1-only comment | No (doc) |
| has_permission via membership | Partial | uses `user_roles`, not `org_members` | Low | document deviation | No (doc) |
| platform roles seeded (organization_admin/user) | **No** (uses existing roles) | roles=admin/analyst/… | Low | document deviation | No (doc) |
| Bootstrap fails on >1 match | **No** | DO-block has no count guard | Low | add count(*) check | No (should) |
| audit append-only + technical gating | Yes / Partial | append-only ✅; raw via `is_admin()` not `audit.read_technical` | Low | swap policy to permission-based | No (should) |
| log_event server-only | Yes | anon/auth=false verified | Low | — | No |
| rate_limit hashed identifiers | Yes (prepared) | `ratelimit.ts` | Low | set `RATE_LIMIT_SALT` env | No |
| outbox minimal + dedupe required | Yes | NOT NULL+UNIQUE | Low | — | No |
| avatars private + per-user | Yes | 4 policies | Low | — | No |
| `server-only` markers | No | libs lack the import | Low | add `import 'server-only'` | No (should) |
| leaked-password protection | No | advisor WARN | Low | enable in Auth | No (manual) |

## 14. Corrective action plan (proposed — not executed)

**Blockers before P1**
- **B1 — Reconcile repo migrations.** Delete the obsolete `supabase/migrations/0006_profiles.sql
  … 0012_avatars_storage.sql`; replace with files that mirror the **applied** additive migrations
  (`portal_profiles_extend` … `portal_lock_service_role_functions`) exported from the DB, each
  with a `-- ROLLBACK` note. Optionally also capture the **pre-existing base schema** as a
  baseline migration so branches/repro work. *Files:* `supabase/migrations/*`.
- **B2 — Sync code to live (#73).** Regenerate `src/lib/types/database.ts` from the live DB
  (re-add the standalone aliases the app imports); fix `lib/audit/queries.ts` (`audit_log` →
  `audit_logs`) and any `organization_members.role_id`/`roles.id` typing (smallint), `Profile`
  shape, `customers` extra columns. Re-run `tsc`. *Files:* `database.ts`, `lib/audit/*`,
  `lib/security/rbac.ts`, `modules/users/{types,schema}.ts`.

**Should fix before P1 (low risk)**
- S1 — audit raw-read policy → `has_permission('audit.read_technical') or is_platform_super_admin()`
  (corrective migration). 
- S2 — add `import 'server-only'` to the server-only libs.

**Can fix later**
- L1 — profiles privilege-guard trigger (before P3 user-management).
- L2 — bootstrap `count(*)` guard; `current_org()` v1-only comment.
- L3 — baseline migration for the manually-built base schema (for branch reproducibility).

**Documentation only**
- D1 — record the intentional deviations: roles are `admin/analyst/sales/reviewer/read_only`;
  `has_permission` resolves via `user_roles`; org membership is informational in v1;
  `documents`/`requests` were kept (not dropped).
- D2 — manual: enable leaked-password protection; set `RATE_LIMIT_SALT`.

## 15. Final recommendation

**Status: P0 approved for P1 *after the two required corrective fixes* (B1 + B2).**

The runtime **database foundation is sound, secure, and verified** — it is genuinely ready to
build auth on. It is **not** a "blocked / corrective DB patch" situation: the DB needs no rework.
The blockers are **repo-artifact reconciliation** — the migration files and the TypeScript
types/libs still describe the abandoned from-scratch design and must be brought in line with the
live schema (B1, B2) before P1 code is written. S1/S2 are quick hardening; L/D items can trail.
