# PORTAL — P4 RUNBOOK (Hardening + Archive/Anonymize + Legacy-Admin Retirement)

Operational reference for the P4 changes. Authority: `AMAI_PORTAL_MASTER_PLAN.md` Parts IV/V/VI.
Migrations applied live: **0016** (archive foundation), **0017** (audit_history grant + anonymize
helper), **function-grants hardening** (applied live as `0018_function_grants_hardening`; repo mirror
`0019_function_grants_hardening` to avoid colliding with the existing webshop `0018`), and **0020**
(grant_role/trigger-fn PUBLIC lockdown — corrective from the P4 review).

## 1. User archive / restore / anonymize runbook

**Archive (default "delete user")** — permission `users.archive` (admin role).
- On the user detail page → **Danger zone → Archive user** → type the user's email to confirm.
- Effect: `profiles.status='archived'`, `archived_at/by` set, **all `user_roles` removed**,
  `organization_members.status='archived'`, Supabase Auth **banned**. The avatar is **kept**.
- The user is blocked from login immediately (next-request `requireAuth()`), hidden from the default
  list. Audit: `user.archived` (warning).

**Restore** — permission `users.archive`.
- On an archived user → **Restore user** → status becomes **`disabled`** (NOT active). Roles are
  **not** restored — re-grant a role deliberately, then enable. Auth is unbanned. Audit:
  `user.restored`.

**Anonymize (GDPR erasure)** — **platform-super-admin only**, **irreversible**, archived-first.
- On an archived user → **Anonymize (GDPR)** → type the email to confirm.
- Effect: profile email → `deleted-<uuid>@anonymized.invalid`, names → null, avatar object deleted +
  `avatar_url` null, **Supabase Auth email** rewritten to the same placeholder (user stays banned),
  and the denormalised `audit_logs.actor_email/actor_name` for that user are scrubbed (via the
  service-role `anonymize_audit_actor` RPC) while `actor_id`/action/timestamps stay intact.
- **No hard delete** of `auth.users` or business data. Audit: `user.anonymized` (critical); the event
  logs only `{ scope: 'pii' }` — never the original PII.

**Guards (all server-enforced):** self-archive blocked; last-active-admin archive blocked; a normal
admin cannot archive/anonymize a platform-super-admin.

## 2. Security hardening notes

- **Turnstile + rate limiting** added to the public POST endpoints (`/api/leads`, `/api/checkout`).
- **0017**: `audit_history()` EXECUTE revoked from `anon`/`public` (kept `authenticated` +
  `service_role`); added `anonymize_audit_actor(uuid)` (service-role-only, SECURITY DEFINER) for the
  GDPR audit scrub.
- **0018**: pinned `search_path=public` on `touch_updated_at` + `profiles_block_privileged_self_update`;
  revoked anon/authenticated EXECUTE on the trigger functions, `grant_role`, and `hit_rate_limit`
  (closes a privilege-escalation + abuse surface). RBAC predicates (`is_admin`, `has_permission`, …)
  intentionally **kept** `authenticated`-executable — RLS policies call them.

## 3. Turnstile / rate-limit configuration

| Item | Value |
|---|---|
| Env (client) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` |
| Env (server) | `TURNSTILE_SECRET_KEY` |
| Behaviour when unset | **Fail-safe**: forms keep working (`verifyTurnstile` returns true). |
| `/api/leads` limiter | bucket `leads`, 10 / hour / hashed-IP |
| `/api/checkout` limiter | bucket `checkout`, 20 / hour / hashed-IP |
| Identifiers | hashed (`ipIdentifier`), never raw IP/email |
| App limiter | `hit_rate_limit()` via service-role (defense in depth behind Cloudflare WAF) |

**Manual config required (P4-D6):** provision the two Turnstile keys in Vercel, then add the
Turnstile widget to the lead/contact forms so a token is sent (the server verify is already wired and
will enforce once the secret is set). **Follow-up:** wire a Turnstile token into the subscribe form to
extend verification to `/api/checkout` (currently rate-limited only).

## 4. Supabase advisor review (post-P4)

| Finding | Level | Action |
|---|---|---|
| `audit_history` EXECUTE to anon/PUBLIC | WARN | **Fixed** (0017) — authenticated + service_role only. |
| `function_search_path_mutable` (touch_updated_at, profiles_block_privileged_self_update) | WARN | **Fixed** (0018) — `search_path=public`. |
| anon/authenticated can RPC `grant_role`, trigger fns, `hit_rate_limit` | WARN | **Fixed** — 0019 revoked anon/authenticated; **0020 revoked the PUBLIC grant** too (0019 alone left `grant_role` — an unguarded SECURITY DEFINER — callable via PUBLIC, a privilege-escalation hole). `grant_role`/trigger fns are now service_role-only. |
| anon/authenticated can RPC RBAC predicates (`is_admin`, `has_permission`, `is_org_admin`, `is_platform_super_admin`, `get_user_permissions`, `current_org`, `has_role`, `my_roles`, `is_staff`, `is_blocked`) | WARN | **Accepted/deferred** — RLS policies call these; revoking `authenticated` breaks row-level security. anon receives only false/empty (no session → no roles). Safe. |
| `rls_enabled_no_policy` (email_log, leads, orders, outbox, rate_limit, stripe_events) | INFO | **Accepted** — intentional: RLS-on + no-policy = deny-all to anon/authenticated; these are **service-role-only** tables. |
| Performance advisors | — | Reviewed; no blocking items for P4. Revisit indexes when CRM tables land. |

## 5. Deployment checklist

1. Migrations `0016`/`0017`/`0018` already applied live (verified). 2. `git push` the P4 code.
3. Vercel green. 4. (Optional) set Turnstile keys + redeploy. 5. Hard-refresh `/app/users`.

## 6. Smoke-test checklist

Archive a test user → hidden by default → **Show archived** (status filter → Archived) reveals →
archived user blocked from login → **Restore** → status `disabled` → enable separately → as
super-admin **Anonymize** → PII scrubbed + avatar gone + audit/history still readable (no PII) →
confirm `auth.users` row still exists (banned, not deleted) → `/api/leads` + `/api/checkout` reject
abusive bursts (429) → `/app/login`, `/app/profile`, `/app/users`, history, outbox cron still work →
old `/[locale]/admin` still works.

## 7. Rollback checklist

- **Code:** revert the P4 commit. Archive/anonymize UI disappears; the DB columns/permissions are
  additive and harmless if left.
- **Migrations (reverse order):** `0018` re-grant EXECUTE; `0017` re-grant audit_history + drop
  `anonymize_audit_actor`; `0016` drop `archived_at/by` + narrow the CHECKs + remove the permissions —
  **CHECK narrowing only works if no `archived` rows exist** (restore/disable them first). Each file
  has `-- ROLLBACK:` steps.
- **Newly archived users:** restore (→ disabled) before narrowing the status CHECK.

## 8. Legacy `/[locale]/admin` retirement plan (planning only — not executed in P4)

**Inventory:** a password-gated panel (`src/lib/admin/auth.ts`, separate from Supabase auth) —
`adminLogin/Logout`, `updateLeadStatus`, `updateOrderStatus`; reads/writes **`leads`** + **`orders`**
only; `(panel)` dashboard + `login`.

**Mapping:** the portal has **no leads/orders module yet** (CRM/orders — out of P4). So `/admin`
**stays as the fallback** for leads/orders management.

**Plan:**
1. Add a feature flag **`LEGACY_ADMIN_ENABLED`** (default true). When a portal leads/orders module
   ships (separate spec), set it false to retire `/admin`.
2. **Do not migrate leads/orders in P4** (needs its own spec; business-table writes stay untouched).
3. Marketing site untouched; `/admin` untouched in P4.

**Cutover checklist (future):** build portal leads/orders → validate parity → migrate any admin-only
state → set `LEGACY_ADMIN_ENABLED=false` → remove `/admin` routes in a dedicated PR.
**Rollback (future):** set `LEGACY_ADMIN_ENABLED=true` to restore the legacy panel.
