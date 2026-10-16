# PORTAL — P4 HARDENING + ARCHIVE/ANONYMIZE + LEGACY-ADMIN RETIREMENT · TECHNICAL SPECIFICATION

Single source of truth: `AMAI_PORTAL_MASTER_PLAN.md` — **Parts IV/V/VI authoritative; Part VI is the
execution truth**; Parts I–III legacy. Implements Part VI §VI.6 (archive/anonymize) + §VI.4 (P4
hardening + `/admin` retirement) and the locked decisions V-D1…V-D9. **Inspected against the live
schema + repo. No build, no migration, no DB change in this document.**

> **P4 contains security-sensitive, additive migrations. They are SPECIFIED here but MUST NOT be
> applied until this spec is approved.**

---

## 1. P4 objective

Strengthen platform security and add the safe user-lifecycle endgame, without expanding into
CRM/ERP:
- **Archive / restore / anonymize** users (archive = the default "delete"; no hard delete of
  `auth.users`; GDPR anonymize as a separate, irreversible, super-admin-only action).
- **Security hardening pass** — close the remaining public-endpoint gaps (Turnstile + rate limiting
  on `/api/leads`, `/api/checkout`), run the Supabase advisors, and fix the known `audit_history`
  grant.
- **Prepare retirement** of the legacy `/[locale]/admin` (inventory + cutover plan; do **not** migrate
  leads/orders in P4).
- **Docs/runbooks/tests** for the above. **No CRM/ERP feature work.**

## 2. Prerequisites & dependency check (verified live)

| Dependency | Status |
|---|---|
| P0–P3 | Implemented + reviewed + approved. |
| **P3.5** | **Implemented + reviewed + approved** (clickable rows, EditableBlock, avatar auto-upload, shared `StatusBadge`, focus fix). **Prerequisite satisfied.** |
| Live `profiles` | `id, created_at, updated_at, email, full_name, is_active, last_login_at, first_name, last_name, status, avatar_url, created_by`. **No `archived_at`/`archived_by`.** |
| `profiles.status` CHECK | `active | disabled | invited` (must widen to add `archived`). |
| `profiles_sync_active` | SECURITY DEFINER; `status`-driven branch sets `is_active=(status='active')`, so **`archived`→`is_active=false` already works — no function change required**. (Reverse `is_active`→`status` branch maps `false→'disabled'`; harmless since code writes `status`, not `is_active`.) |
| Role model | `roles` (smallint), `user_roles`, `permissions`, `role_permissions`, `has_permission()`, `is_platform_super_admin()` — all live. Admin role holds the 9 P3 perms. |
| `organization_members` | **Exists**: `id, created_at, updated_at, organization_id, user_id, role_id, member_type, status`. `status` CHECK = `active|disabled|invited` (must widen to add `archived`). |
| Archive perms | `users.archive`, `users.anonymize` — **do not exist yet** (P4 seeds them). |
| P3 user actions | `createUser, updateUserName, changeUserRole, setUserStatus, resendInvite, sendUserPasswordReset` (+ guards `isSelf/isSelfDemotion/wouldDisableLastAdmin/wouldRemoveLastAdmin/blocksSuperAdmin`, `countActiveAdmins`). |
| P1 disabled-user gate | `requireAuth()` reads live `profiles.status`; `signIn` re-checks; non-`active` blocked. **`archived` inherits this** (not `active`). |
| P3 history timeline | `getHistory`/`getHistoryTechnical` + `HistoryButton/Drawer/Timeline`, `entity_type='profile'`. |
| Supabase Auth admin API | `authAdmin()` (`updateUserById` ban/email, `generateLink`). |
| Avatar storage | private `avatars` bucket, own-folder RLS, signed URLs, `avatarObjectPath`. |
| Audit | `logEvent`, `audit_logs` (denormalised actor), `audit_history()` (display-safe). |
| Rate limiting | `lib/security/ratelimit.ts` (`checkRateLimit`, `ipIdentifier/emailIdentifier/userIdentifier`, hashed). |
| Outbox / email_log | reused for any P4 mail (none new expected). |
| Cloudflare / Vercel | proxy + cache-bypass for `/app/*`; Turnstile keys need provisioning (P4-D6). |
| Legacy `/admin` | `src/app/[locale]/admin/{actions.ts,actions.test.ts,(panel)/layout.tsx,(panel)/page.tsx,login/page.tsx}` + `src/lib/admin/auth.ts` (password-gate, **not** Supabase auth). Edits **leads + orders** only. |

## 3. P4 scope boundaries

**In scope:** archive/restore/anonymize model + the additive migration `0016`; security hardening
(Turnstile + rate-limit on `/api/leads` + `/api/checkout`; advisor pass; `audit_history` grant fix);
archived UI + filters; audit events; RLS/abuse tests; `/admin` retirement **planning**; docs/runbooks.

**Out of scope:** any CRM/ERP/companies/contacts/projects/products/finance/NDA/docs/invoices/quotes
/external-portal/notification-center module; impersonation; MFA enforcement (stub/doc only); Resend
open/click tracking; granular role-editor or org-settings UI; business-table rewrite; **hard delete of
`auth.users`** as the default delete.

**Explicitly deferred:** actually migrating leads/orders into the portal (needs its own CRM/orders
spec); audit-actor historical PII scrub beyond the anonymize decision (P4-D2); MFA.

## 4. User archive model

- **Archive = default "delete user".** No hard delete of `auth.users`.
- `profiles.status='archived'` (status-driven `is_active=false` via the existing sync trigger).
- Set `archived_at = now()`, `archived_by = <actor>`.
- **Remove active role grants:** `delete from user_roles where user_id = target` (archived users hold
  no permissions). Record the removed role key in the `user.archived` audit metadata for restore
  reference (key only — not PII).
- **Org membership:** `update organization_members set status='archived' where user_id = target`
  (live table supports it after the CHECK widen). Do **not** delete membership rows.
- **Supabase Auth:** `authAdmin().updateUserById(id, { ban_duration: '876600h' })` + best-effort
  refresh-token/session revoke. `requireAuth()` is the authoritative next-request block.
- **Avatar kept on archive** (deleted only on anonymize — V-D4).
- **Audit/history actor identity preserved** (audit rows keep `actor_id` + denormalised name/email).
- **Hidden from default lists**; a **Show archived** filter reveals them; archived users are **not
  editable** except **restore** / **anonymize**.
- Audit **`user.archived`** (severity `warning`), `old_status`→`new_status`.

## 5. Restore model

- Allowed: **`archived → disabled`**. Re-enable to `active` is a **separate** deliberate action
  (existing `setUserStatus`).
- Unban via `updateUserById(id, { ban_duration: 'none' })` if previously banned.
- **Roles are NOT auto-restored** (safer default — avoids silently re-granting elevated access). The
  admin assigns a role after restore; the previously-removed role is visible in the `user.archived`
  audit metadata for reference. *(Recommended over replaying stored roles.)*
- `archived_at`/`archived_by` cleared (set null) on restore.
- Audit **`user.restored`** (severity `info`), `old_status`→`new_status`.

## 6. GDPR anonymize model

- **Separate from archive; platform-super-admin only; irreversible.**
- **Allowed only for already-`archived` users** (anonymize is a follow-up to archive) unless an
  explicit super-admin override is added later (P4-D4 — default: require archived).
- **Scrub PII:** `email` → an irreversible, unique placeholder (e.g.
  `deleted-<short-uuid>@anonymized.invalid`; `email` is NOT NULL + must stay unique);
  `first_name/last_name/full_name` → null; `avatar_url` → null and **delete the avatar object** from
  storage.
- **Supabase Auth email is PII too:** also set the **`auth.users` email** to the same anonymized
  placeholder via `authAdmin().updateUserById(id, { email, email_confirm: false })`, keeping the user
  banned. (P4-D1: confirm placeholder format + uniqueness + that no confirmation email is sent.)
- **Preserve the audit-row skeleton + `actor_id`.** Do **not** hard-delete business data; do **not**
  hard-delete `auth.users`.
- **Residual PII decision (P4-D2):** historical `audit_logs.actor_email`/`actor_name` for the
  anonymized user remain denormalised. Two options: **(a)** keep them (audit integrity, residual PII)
  or **(b)** a controlled, super-admin-only, audited service-role scrub
  (`update audit_logs set actor_email=null, actor_name='Anonymized user' where actor_id=target`) — a
  documented exception to append-only that achieves GDPR erasure while keeping `actor_id` + actions.
  **Recommend (b).**
- Audit **`user.anonymized`** (severity `critical`). **Never log** the original PII / pre-anonymization
  email in the new audit metadata.

## 7. Additive migration plan — `supabase/migrations/0016_portal_user_archive.sql`

Additive + safe; validate live data first (all current `profiles.status` ∈ the new set). Mirror in the
repo and apply via the MCP (Part IV L2). **`-- ROLLBACK:` comments required.**

1. **Widen `profiles.status` CHECK** to include `archived`:
   `alter table public.profiles drop constraint profiles_status_check;`
   `alter table public.profiles add constraint profiles_status_check check (status in ('active','disabled','invited','archived'));`
   *(Widening — no existing row violates. ROLLBACK only safe if no `archived` rows exist.)*
2. **Add columns:** `alter table public.profiles add column archived_at timestamptz, add column archived_by uuid;`
   Optional FK: `archived_by` → `public.profiles(id) on delete set null` (safe, nullable).
3. **Widen `organization_members.status` CHECK** to include `archived` (same pattern).
4. **`profiles_sync_active`:** **no change** (archived → `is_active=false` already). *(Optional defensive
   hardening: make the `is_active`→`status` reverse branch leave `status` untouched when it is
   `archived`. Low priority; documented, not required.)*
5. **Seed permissions:** `insert into public.permissions(key) values ('users.archive'),('users.anonymize') on conflict do nothing;`
6. **Grant `users.archive` to admin** via `role_permissions`. **Do NOT** grant `users.anonymize` to any
   role; the anonymize action is gated by `is_platform_super_admin()` in code (the permission row
   exists for completeness/auditing only).
7. **No business-table change; no destructive SQL** (the CHECK swap is a widen, not a drop of data).

**Risks:** CHECK changes must be additive (validated before apply); the migration must work with the
live **smallint `roles`** model (it does — only `permissions`/`role_permissions` are touched);
`archived_by` FK target must exist (use `profiles(id)`); rollback of the CHECK requires no `archived`
rows.

## 8. Permission & access model

- **`users.archive`** required for **archive AND restore**.
- **`users.anonymize`** + **`is_platform_super_admin()`** required for **anonymize** (super-admin is
  the real gate).
- A **normal admin cannot archive/anonymize a platform-super-admin** (reuse `blocksSuperAdmin`).
- **Self-archive blocked; last-admin archive blocked** (reuse `isSelf` + active-admin count).
- **Archived users cannot log in** (`requireAuth` status≠active) and **cannot manage anything**.
- **Archived hidden from default lists**; revealed only via Show archived for `users.read` holders.
- Technical metadata stays gated by **`audit.read_technical`**.

## 9. Server actions specification (`src/modules/users/actions.ts`, server-only, reuse pattern)

**`archiveUser(_prev, formData)`** — `userId`, `confirmationEmail`.
- `requireAuth()` + `hasPermission('users.archive')`; load target.
- Guards: `confirmationEmail` must equal target email (type-to-confirm); `isSelf` blocked;
  `blocksSuperAdmin(targetIsSuper, actorIsSuper)` blocked; `wouldArchiveLastAdmin` (target is the sole
  active admin) blocked.
- Writes (service-role): capture removed role key → `delete user_roles` → `update profiles set
  status='archived', archived_at=now(), archived_by=actor` → `update organization_members set
  status='archived'`. Auth: ban + best-effort revoke (try/catch, non-fatal).
- Audit `user.archived` (warning, `old_status`/`new_status`, metadata `{removed_role}`).
- Errors: generic; failures before the status write abort; a failed ban does **not** roll back the
  archive (status is authoritative) — log a warning.

**`restoreUser(_prev, formData)`** — `userId`.
- `requireAuth()` + `hasPermission('users.archive')`; target must be `archived`.
- `blocksSuperAdmin` check. Writes: `update profiles set status='disabled', archived_at=null,
  archived_by=null`; `update organization_members set status='disabled'` (or leave — P4-D7);
  `updateUserById(ban_duration:'none')`. **No role re-grant.**
- Audit `user.restored` (info).

**`anonymizeUser(_prev, formData)`** — `userId`, `confirmationEmail`.
- `requireAuth()` + **`is_platform_super_admin()`** (and `hasPermission('users.anonymize')`); target
  must be `archived`; `confirmationEmail` matches.
- Writes (service-role): delete avatar object; `update profiles set email=<placeholder>,
  first_name=null, last_name=null, full_name=null, avatar_url=null`; `updateUserById({email:placeholder})`;
  optional audit-actor scrub (P4-D2).
- Audit `user.anonymized` (critical). **Never** log original PII.

**Helpers:** `assertCanArchiveUser(actor, target)`, `assertCanAnonymizeUser(actor, target)`,
`getActiveAdminCount()` (reuse `countActiveAdmins`), `wouldArchiveLastAdmin(...)` (pure, in `guards.ts`).

## 10. UI specification (`/app/users`, `/app/users/[id]`)

- **List:** default query **excludes `archived`**; a **Show archived** toggle (status filter gains an
  `Archived` option; default view = non-archived). `archived` rows show the archived badge.
- **Detail:** an archived user renders **read-only** (the EditableBlock name + role + status controls
  are hidden/disabled) except the allowed actions.
- **Archive** — a **type-to-confirm modal** (type the user's email) → `archiveUser`. Hidden for self,
  super-admin targets (to a normal admin), and the last admin.
- **Restore** — shown for archived users (`users.archive`).
- **Anonymize** — shown **only to platform-super-admins** for archived users; a **stronger
  destructive** type-to-confirm ("This permanently erases personal data").
- **No hard-delete button** anywhere.
- History timeline shows `user.archived/restored/anonymized`.

## 11. Status model integration

- Add `archived` to `USER_STATUSES` (`schema.ts`); `TOGGLE_STATUSES` stays `active|disabled` (archive
  is a dedicated action, not the enable/disable toggle).
- `StatusBadge`/`statusTokenFor('user','archived')` already maps to **`cancelled`** (added in P3.5) —
  no badge change needed.
- Every transition audits `old_status`/`new_status`; archive/restore appear in the HistoryTimeline.

## 12. Audit specification

Add to `lib/audit/display.ts` (labels + colours): `user.archived` (`revoked`/"User archived"),
`user.restored` (`done`/"User restored"), `user.anonymized` (`critical`/"User anonymized").
All: `entity_type='profile'`, `entity_id`=target id.

| event | severity | old/new | metadata allowed | metadata forbidden / never log |
|---|---|---|---|---|
| `user.archived` | warning | `old_status`→`archived` | `{ removed_role }` | PII, email, tokens |
| `user.restored` | info | `archived`→`disabled` | — | PII, tokens |
| `user.anonymized` | critical | — | `{ scope: 'pii' }` | **original PII / pre-anonymize email**, tokens, passwords, session data, provider secrets |

## 13. Rate limiting & abuse hardening

| Surface | Current | P4 |
|---|---|---|
| login / forgot / reset | rate-limited (P1) | confirm + audit `auth.rate_limited` warning on block |
| invite/reset resend | rate-limited (P3, `admin_user_email`) | unchanged |
| **`/api/leads`** | Turnstile **stubbed**, no limiter | **verify Turnstile server-side** + `checkRateLimit('leads', ipIdentifier(ip), 10, 3600)`; generic error |
| **`/api/checkout`** | no limiter | `checkRateLimit('checkout', ipIdentifier(ip), 20, 3600)` + Turnstile if a public form |
| avatar upload | server-validated | optional `checkRateLimit('avatar', userIdentifier(uid), 20, 3600)` |

Rules: **hashed identifiers only** (no raw email/IP); generic user-facing errors; audit a `warning`
event on limit/abuse (no PII); **Cloudflare WAF + Turnstile** in front, **app-level DB limiter**
(`hit_rate_limit`) as defense in depth. Turnstile needs `NEXT_PUBLIC_TURNSTILE_SITE_KEY` +
`TURNSTILE_SECRET_KEY` (P4-D6) and a server verify helper `lib/security/turnstile.ts`.

## 14. Supabase advisor & security review plan

Run `get_advisors(security)` + `get_advisors(performance)` and document each finding + fix/defer:
- **`audit_history()` EXECUTE granted to `anon`/`PUBLIC`** (found in P3 review) → **revoke from anon,
  public; keep authenticated** (small additive migration or a `grant`/`revoke` step). *Known item.*
- RLS warnings (any table without RLS / permissive policy); **function `search_path`** (confirm all
  SECURITY DEFINER fns pin `search_path=public`); **function grants** (service-role-only fns locked —
  re-verify per L3); **leaked-password protection** (on); **OTP expiry** (3600s — review/justify);
  **storage policies** (avatars private + own-folder); **service-role usage** (server-only).
- Output a short advisor table: finding · severity · action (fix now / defer + why).

## 15. RLS & abuse test plan

Archived user cannot log in / reach `/app`; archived user has **no** `user_roles`; archived hidden by
default; Show archived reveals for permitted admin; normal admin **cannot** archive/anonymize a
super-admin; self-archive blocked; last-admin archive blocked; restore → `disabled`; restored user
still **cannot** log in until enabled; anonymize **super-admin only**; anonymize scrubs PII + deletes
avatar; audit/history readable after anonymize; **no hard delete** occurred (auth.users row still
exists, banned); rate limits block abusive calls; Turnstile required where configured; P1/P2/P3 flows
still pass. (Live-DB checks via rolled-back transactions like the P2/P3 guard tests where feasible.)

## 16. Legacy `/[locale]/admin` retirement / migration plan (planning only)

- **Inventory:** a password-gated panel (`lib/admin/auth.ts`, separate from Supabase auth) with
  `adminLogin/Logout`, **`updateLeadStatus`**, **`updateOrderStatus`**; reads/writes **`leads`** +
  **`orders`** only; `(panel)` dashboard + `login`.
- **Mapping:** the portal has **no leads/orders module yet** (that is CRM/orders — out of P4 scope).
- **Decision (P4-D5):** **P4 only PREPARES retirement; it does NOT migrate leads/orders.** The
  `/admin` panel stays as a fallback until a future portal leads/orders module replaces it.
- **Guardrails:** marketing site untouched; `/admin` remains until replacements are validated; add a
  feature flag (`LEGACY_ADMIN_ENABLED`) to disable it on cutover.
- **Cutover checklist + rollback** documented in the runbook (re-enable the flag to roll back).
- **No business-table rewrite** without a separate spec.

## 17. Documentation / runbook updates

`docs/` (or repo root): **archive/restore/anonymize runbook** (who/when/how, type-to-confirm,
irreversibility of anonymize); **security-hardening notes** (Turnstile, rate limits, advisor fixes);
**rate-limit/Turnstile config** (env keys, buckets, limits); **Supabase advisor review notes**
(table); **deployment checklist**; **smoke-test checklist**; **rollback checklist**; **`/admin`
retirement checklist**.

## 18. Files likely to create / update (repo-accurate)

**Create:** `supabase/migrations/0016_portal_user_archive.sql`; `src/lib/security/turnstile.ts`;
`src/components/portal/ui/ConfirmDialog.tsx` (type-to-confirm modal); docs/runbooks; tests
(`users.archive.test.ts`, advisor/RLS notes).
**Update:** `src/modules/users/{actions,queries,schema,types,guards}.ts`; `src/lib/audit/display.ts`;
`src/lib/status/colors.ts` *(archived already mapped — likely no change)*; `StatusBadge.tsx` *(no
change)*; `src/components/portal/users/{UserTable,UserDetailActions,UserDetailHeader}.tsx`;
`src/app/api/leads/route.ts` + `src/app/api/checkout/route.ts` (Turnstile + limiter);
`src/lib/types/database.ts` (regen for `archived_at/archived_by` + the new permissions);
`.env.example` (Turnstile + any new keys).

## 19. Tests for P4

Unit: schema (archive/anonymize inputs, confirmationEmail), guards (`wouldArchiveLastAdmin`,
super-admin, self), audit display mapping, Turnstile verify (mock). Action contracts: archive/restore/
anonymize permission + guard branches. Security: **no service-role import in client**; **no raw PII in
audit** (assert anonymize logs no email/name); rate-limit identifiers hashed. RLS/manual SQL
(rolled-back): archived can't be read by default policy paths; archived `user_roles` empty.
Integration/manual smoke (§20). Commands: `npx tsc --noEmit`, `npx vitest run`, `next build`.

## 20. Manual smoke checklist

Archive a test user → hidden by default → Show archived reveals → archived user blocked from login →
restore to `disabled` → enable separately → anonymize (as super-admin) → PII scrubbed + avatar deleted
→ audit/history still readable (no PII) → confirm **no hard delete** (auth row exists, banned) →
normal auth/profile/users flows OK → rate limits + Turnstile enforced on `/api/leads` + `/api/checkout`
→ `/admin` still works until retired.

## 21. Rollback plan

- **Code:** revert the P4 commit; gate archive/anonymize UI behind a feature flag to disable instantly.
- **Migration:** additive; rollback drops `archived_at/archived_by` + narrows the CHECKs **only if no
  `archived` rows exist** — otherwise first restore/disable those users, or keep the columns (additive
  columns are harmless). Document the order.
- **Newly archived users on rollback:** their `status='archived'` would violate a narrowed CHECK — so
  rollback must restore them to `disabled` first (runbook step).
- **`/admin`:** remains the fallback (flag re-enable).

## 22. Risks & open questions

- **CHECK widening** complexity + rollback constraint (archived rows block narrowing).
- **Anonymizing the Supabase Auth email** — uniqueness, no confirmation email, banned state (P4-D1).
- **Residual PII in historical `audit_logs.actor_email`** vs append-only integrity (P4-D2).
- **Restore does not re-grant roles** — confirm admins are fine re-assigning (P4-D3).
- **`organization_members`** archived handling (live table differs per org; P4-D7).
- **Session revocation limits** — ban prevents refresh; existing access tokens valid until expiry
  (~1h), but `requireAuth` blocks immediately.
- **Turnstile config** depends on provisioning keys (P4-D6).
- **`/admin` cutover risk** — mitigated by keeping it as fallback + flag.
- **P3.5 prerequisite** — satisfied (approved).

## 23. Final readiness checklist

- **P4 spec ready:** **YES.**
- **Blockers:** none technical; build is gated on the decisions below + Turnstile key provisioning.
- **Decisions needed before build:**
  - **P4-D1** Anonymize also rewrites the `auth.users` email to a unique placeholder
    (`deleted-<uuid>@anonymized.invalid`), no confirmation mail — approve?
  - **P4-D2** On anonymize, also scrub `audit_logs.actor_email/actor_name` for that `actor_id`
    (stronger GDPR, documented append-only exception) — **recommended**; approve, or keep audit
    actor PII for integrity?
  - **P4-D3** Restore does **not** auto-restore roles (admin re-grants; removed role recorded in
    `user.archived` metadata) — approve?
  - **P4-D4** Anonymize requires the user to be **`archived` first** — approve?
  - **P4-D5** P4 **only prepares** `/admin` retirement (no leads/orders migration) — approve?
  - **P4-D6** Provision Turnstile keys (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`) +
    apply Turnstile to `/api/leads` (+ `/api/checkout` if public) — approve?
  - **P4-D7** One migration `0016` (profiles + org_members + permissions) — approve number/grouping.
- **Exact approval question:** *"Approve P4 as specified — additive migration `0016`
  (status `archived` + `archived_at/by` + org_members widen + `users.archive`/`users.anonymize`
  seed), archive/restore/anonymize actions with super-admin/self/last-admin guards + type-to-confirm,
  archived UI + Show-archived, the security hardening (Turnstile + rate-limit on `/api/leads`
  /`/api/checkout`, advisor pass + `audit_history` grant fix), and `/admin` retirement planning only —
  with your answers to P4-D1…P4-D7? On approval I build P4 (apply `0016` to live + mirror) and stop."*

No code, migration, or DB change until approved.
