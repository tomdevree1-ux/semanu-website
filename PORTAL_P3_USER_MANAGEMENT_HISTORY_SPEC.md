# PORTAL — P3 USER MANAGEMENT + HISTORY TIMELINE · TECHNICAL IMPLEMENTATION SPECIFICATION

Single source of truth: `AMAI_PORTAL_MASTER_PLAN.md` (incl. PART IV lessons). Status going in:
P0 implemented + corrected + approved; P1 Auth implemented + reviewed + live smoke-tested; P2
Profile + Avatar implemented + reviewed (live smoke test must pass before P3 build). This document
specifies **P3 only**. No code is written. All facts below were verified against the **live** amai
database (`bkwwlmflsbhrsfwydbnv`) and the current repo.

**Headline: P3 needs no migration.** The role model, permissions, RLS, `audit_history()`, the
outbox, and `handle_new_user` already exist and cover every P3 need. One optional additive RLS
policy is offered as a decision (§21), not a requirement.

---

## 1. P3 objective

Give permitted admins an internal **user-management** area under `/app/users` plus a reusable
**history timeline**:

- list users; create/invite a user; view a user; edit a user's name; change a user's role; enable/
  disable a user; resend an invite or password reset,
- audit every user-management action through the existing `logEvent()`,
- a reusable, entity-agnostic **HistoryButton → HistoryDrawer → HistoryTimeline** that reads the
  **display-safe** `audit_history()` RPC, with technical metadata shown only to `audit.read_technical`
  holders, first wired onto the user detail page,
- semantic **status/role badges** using the existing status palette.

Out of scope (must not appear): CRM/ERP, projects, products, finance, NDA, documents, invoices,
quotes, external client portal, organization-settings UI, role-editor UI, granular-permissions
editor UI, impersonation, MFA enforcement, notification center, Resend webhook/open/click tracking,
migration of the old `/admin`, **destructive user delete**, public profile pages, profile search,
phone field, and any change to business tables (`leads`, `customers`, `orders`, `subscriptions`,
old `documents`, old `requests`). English-only, inside the existing `(portal)` shell, no locale prefix.

---

## 2. Dependency check from P0/P1/P2 (verified)

| Dependency | Live/Repo status | How P3 uses it |
|---|---|---|
| `profiles` | `id,email,full_name,first_name,last_name,status,avatar_url,is_active,last_login_at,created_at,created_by`. **No phone.** RLS on. | Source of user identity for list/detail; admin edits name/status (service role). |
| `roles` (smallint) | `1 admin, 2 analyst, 3 sales, 4 reviewer, 5 read_only`. | Role catalog for the dropdown + role badges. |
| `user_roles` | `(user_id, role_id)`. RLS: `select self-or-admin`, `ALL write is_admin()`. | Read a user's role; assign/replace role on change. |
| `permissions` / `role_permissions` | Seeded: `users.read/create/update/change_role/disable`, `roles.manage`, `org.manage`, `audit.read`, `audit.read_technical`. `admin` role holds all 9. | Per-action server-side permission gates. |
| `has_permission(p_key)` / `get_user_permissions()` | Live RPCs; wrapped in `lib/security/authorize.ts`. | Gate routes + actions + conditional nav. |
| `is_admin()` / `is_org_admin()` / `is_platform_super_admin()` | Live RPCs. | Admin/super-admin protections + RLS predicates. |
| `requireAuth()` / `requirePermission(key)` | `lib/security/rbac.ts`. Redirect to `/app/login` (unauth/disabled) or `/app/dashboard` (no perm). | Gate `/app/users*` pages + every action. |
| Supabase Auth admin API | `lib/supabase/admin.ts` → `authAdmin()` (`createUser`, `generateLink`, `updateUserById`) + `createAdminClient()`. **Server-only.** | Create the auth user; mint invite/reset links; (optional) revoke sessions. |
| `handle_new_user` trigger | On `auth.users` insert → inserts `profiles` from `user_metadata` (`status` defaults `'invited'`, honours `first_name/last_name/full_name/created_by`). | Create action passes metadata; the profile row is auto-created. |
| `outbox` + `enqueueEmail()` + `emailDedupeKey()` | `lib/outbox/enqueue.ts`; `OutboxEmailPayload.template` already includes `'invite'`. | Queue branded invite + reset emails; worker delivers (P1 inline-send pattern on Hobby). |
| `email_log` | Columns `to_email, subject, template_key, status, …`. | Delivery record (written by the worker). |
| P1 reset flow | `/app/auth/confirm` (`verifyOtp({type, token_hash})`) → `/app/reset-password` → `setNewPassword` flips `invited→active`. | **Reused** for invite acceptance (type `invite`) and admin-triggered reset (type `recovery`). |
| `audit_logs` + `audit_history()` | RPC `audit_history(p_entity_type, p_entity_id, p_limit=50, p_offset=0)` returns **display-safe** rows (actor_name/role/type, action, entity_display_name, old/new_status, source, severity — **no** ip/ua/metadata/old_values/new_values). | HistoryTimeline default source. |
| `lib/audit/queries.ts` | **Exists**: `getHistory()` (safe RPC), `getHistoryTechnical()` (raw, returns `[]` unless `audit.read_technical`). | Timeline (safe) + optional technical view. |
| `lib/audit/display.ts` | **Exists**: `auditLabel()`, `auditColor()` + maps incl. `user.created/updated/role_changed/disabled/enabled/invited`. | Render labels + colors; extend for a few new actions. |
| `logEvent()` | `lib/audit/log.ts` (server-only; service-role-only `log_event`). | Emit all P3 audit events. |
| `lib/status/colors.ts` | **Exists**: `StatusToken`, `STATUS_COLORS`, `statusColor()`. | Status + role badges + timeline dots. |
| `modules/users/schema.ts` | **Exists**: `createUserSchema`, `updateUserSchema`, `profileSchema`, `ROLES`, `USER_STATUSES`. (Includes a `phone` field — **unused in P3**, no column.) | Validation; extend with role/status/resend schemas; ignore phone. |
| `modules/users/types.ts` | **Exists**: `Profile`, `Role`, `UserStatus`. | Extend with `UserListRow`/`UserDetail` view types. |
| `PortalShell` / `Topbar` | Exist; Topbar shows avatar→`/app/profile`. | Add a permission-gated **Users** nav entry. |
| Avatar signed-URL / `getSignedAvatarUrl` | P2 `modules/profile/queries.ts`. | Reuse to show avatars in the list/detail (or initials). |
| Database types | `lib/types/database.ts` mirrors live. | Type queries; no regen (no migration). |

---

## 3. Admin access model

`/app/users*` requires permission, checked **server-side** (the UI is never the boundary):

- **View** (list + detail): `requirePermission('users.read')`.
- **Create/invite**: `users.create`. **Edit name**: `users.update`. **Change role**: `users.change_role`.
  **Enable/disable**: `users.disable`. **Resend reset/invite**: `users.update` (or `users.create` for invite resend).
- The **`admin` role** holds all of these (verified). Other roles hold none of `users.*` unless an
  admin grants them later — the gate is the permission, not the role name.
- **Organization admin** (`is_org_admin()`): may be granted `users.*` per-org later; in P3 the access
  decision is purely the permission key, so org-admins with the permission are admitted and ones
  without are denied — no special-casing in P3.
- **Platform super-admin** (`is_platform_super_admin()`): admitted (holds/【overrides】 perms) and additionally
  used for *protections* (only a super-admin may act on another super-admin — §8/§9/§10).
- **Normal user / disabled / invited / external**: denied. `requireAuth()` redirects unauth+non-active
  to `/app/login`; `requirePermission` redirects permitted-but-not-this to `/app/dashboard`.
- **Server-side enforcement** is the boundary: every page calls `requirePermission`, every action
  re-checks its specific permission (never trust the route gate alone).
- **RLS enforcement** stays active: admin **reads** go through the SSR client (RLS already grants
  `is_admin()` on `profiles`/`user_roles`); admin **writes to other users' `profiles`** use the
  **service-role** client (no admin `profiles` UPDATE policy exists — see §5/§15/§21). UI checks
  (hiding buttons) are convenience only.

---

## 4. Routing plan

- `/app/users` → `src/app/(portal)/app/(protected)/users/page.tsx` (list).
- `/app/users/new` → `…/users/new/page.tsx` (create/invite).
- `/app/users/[id]` → `…/users/[id]/page.tsx` (detail + edit + history).

All under `(protected)` (so the layout's `requireAuth()` runs) and additionally call
`requirePermission('users.read')`. Non-permitted → `/app/dashboard`; unauth/disabled → `/app/login`.
No locale prefix (portal middleware rule). No impact on marketing or the old `/[locale]/admin` (left
untouched; retired later in P4).

---

## 5. User-management data model (live)

- **Identity** (`first_name`, `last_name`, `full_name`, `email`, `status`, `avatar_url`,
  `last_login_at`, `created_at`, `created_by`, `is_active`) → `public.profiles`.
- **Role** → `public.user_roles(user_id, role_id)` joined to `public.roles`. One role per user in P3
  (replace-on-change). `org` role lives in `organization_members.role_id` (not edited in P3).
- **Auth record** → `auth.users` via the Admin API (creation, link generation, optional session
  revoke). The `on_auth_user_created` trigger (`handle_new_user`) creates the `profiles` row from
  `user_metadata` (`status` defaults `'invited'`).
- **Status** ∈ `{active, disabled, invited}` (CHECK constraint). `is_active` is kept in sync by the
  `profiles_sync_active` trigger — **P3 writes `status` only, never `is_active` directly**. Lifecycle:
  `invited` (created, not yet accepted) → `active` (password set via the P1 confirm/reset flow) →
  `disabled`/`active` (admin toggles).
- **P2 guard (0014)** blocks non-admin self-changes to `status/is_active/email/id/created_by`; admin
  (`is_admin()`) and service-role (`auth.uid() IS NULL`) are exempt, so P3 admin writes pass.
- **Migration needed? No.** Everything required exists. *Optional* additive item only (§21): an admin
  `profiles` UPDATE RLS policy, if writes should flow through the SSR client instead of service role.

---

## 6. User list specification (`/app/users`)

- **Columns:** avatar/name (full_name or email local-part; avatar via P2 signed URL or initials),
  email, role badge, status badge, `last_login_at`, `created_at`, actions (View; quick Disable/Enable
  if `users.disable`).
- **Search:** by name/email (server-side `ilike`, trimmed). **Filters:** status (all/active/invited/
  disabled) and role (all + the 5 roles). State kept in the URL query (`?q=&status=&role=&page=`).
- **Badges:** `UserStatusBadge` (active→`done`, invited→`waiting`, disabled→`revoked`) + `RoleBadge`
  (neutral token per role) using `status/colors.ts`.
- **Pagination:** server-side, page size 25, `?page=` (count + range). **Empty state:** "No users
  match." **Loading:** server-rendered; client filter controls show the gold `!` spinner while
  navigating.
- **Access:** `requirePermission('users.read')`. Read via the SSR client (RLS `is_admin()` select on
  `profiles`+`user_roles`); avatar URLs minted server-side.

Reads may alternatively use the service-role client for uniformity (see §3); default is SSR/RLS.

---

## 7. Create / invite user (`/app/users/new`)

**Fields:** `firstName`, `lastName`, `email`, `role` (the 5 roles). **No avatar** (set later by the
user in `/app/profile`). **No phone.** Status is **not** chosen — new users are always `invited`.

**Flow (server action `createUser`, service-role, `requirePermission('users.create')`):**
1. Validate with `createUserSchema` (ignore/omit `phone`).
2. `authAdmin().createUser({ email, email_confirm: false, user_metadata: { first_name, last_name, status: 'invited', created_by: <actor.id> } })`. `handle_new_user` creates the `profiles` row.
3. Insert `user_roles(user_id, role_id)` for the chosen role (service role; `user_roles_admin_write`
   would also permit SSR-admin, but the action runs service-role for atomicity with step 2).
4. `authAdmin().generateLink({ type: 'invite', email })` → take `properties.hashed_token`; build
   `actionUrl = ${siteUrl}/app/auth/confirm?token_hash=<hashed>&type=invite&next=/app/reset-password`
   (the **L6** verifyOtp pattern — never the Supabase `action_link`).
5. `enqueueEmail(buildInviteEmail({ to, firstName, actionUrl }), emailDedupeKey('invite', email, <token-hash slice>))`; deliver inline (Hobby) like P1.
6. Audit `user.created` then `user.invited`. Show success → redirect to `/app/users/[id]`.

**Rules:** no public sign-up; **no raw/temporary password** is generated or emailed (the invitee sets
their own password via the confirm→reset flow); **duplicate email** → `createUser` errors → friendly
admin-facing "A user with this email already exists." (admin-only surface, so this is not a public
enumeration leak); **failed invite enqueue** → the user still exists as `invited`, the action returns
a non-fatal notice ("User created; invite email could not be queued — use Resend invite"), and a
`user.created` event is still written.

---

## 8. User detail / edit (`/app/users/[id]`)

**View:** avatar, full name, email, role badge, status badge, `created_at`, `last_login_at`, and a
**history clock** (HistoryButton) in the header. **Admin actions:** edit `first_name`/`last_name`,
change role, enable/disable, resend invite (if `invited`) or send password reset (if `active`).

**Editable by admin:** `first_name`, `last_name` (via `users.update`), `role` (via
`users.change_role`), `status` enable/disable (via `users.disable`). `full_name` is **derived**
server-side (same rule as P2). **Not editable:** `email` (deferred — Supabase Auth email-change flow,
out of P3), `id`, `created_by`, `is_active` (synced), audit rows, and the platform-super-admin flag.

**Protections (server-enforced):**
- **Self:** an admin **cannot disable themselves** and **cannot remove their own `admin` role**
  (prevents lockout) — blocked outright with a clear message (no silent no-op).
- **Last admin:** the action counts users holding `admin`; it refuses to disable, or to role-change
  away from `admin`, the **last remaining admin**.
- **Platform super-admin:** a target who `is_platform_super_admin()` can only be disabled / role-
  changed by another platform-super-admin; a normal admin is blocked.
- **No destructive delete** in P3 (deferred).

---

## 9. Enable / disable user

- **Disable:** service-role `update profiles set status='disabled' where id=:id` →
  `profiles_sync_active` sets `is_active=false`. **Enforced on the next request** by P1
  `requireAuth()` (reads live status) and `signIn` (blocks non-active). *Optional immediacy:*
  `authAdmin().updateUserById(id, { ban_duration })` or refresh-token revoke to kill live sessions now
  (nice-to-have; mark optional).
- **Enable:** `update … set status='active'` (→ `is_active=true`).
- **Status mapping:** P3 writes `status`; `is_active` follows via the sync trigger (never written
  directly).
- **Audit:** `user.disabled` (severity `warning`) / `user.enabled` (`info`), `old_status`/`new_status`
  set.
- **Safeguards** (as §8): no self-disable, no last-admin disable, no super-admin disable by a
  non-super-admin. User-facing result is a generic success/most-specific-safe error.

---

## 10. Role change

- **Allowed roles:** the 5 catalog roles (`admin, analyst, sales, reviewer, read_only`).
- **Mechanism:** replace the row in `user_roles` (delete existing for the user, insert the new
  `role_id`) inside one service-role action; or call the live `grant_role(email, key)` — P3 uses
  direct `user_roles` writes so the last-admin guard is atomic.
- **Who:** `users.change_role` holders.
- **Restrictions:** **platform-super-admin is not a catalog role** and is never assignable here
  (managed out-of-band via `platform_admins`); a normal admin **cannot grant a role beyond its own
  authority** (P3 ships the 5 roles, all ≤ admin; no escalation possible through this UI); **cannot
  remove the last admin**; **cannot change one's own role away from admin**.
- **Audit:** `user.role_changed` (severity `warning`) with `old_values:{role}` / `new_values:{role}`.
- **UI:** a confirm step for sensitive changes (to/from `admin`).

---

## 11. Resend invite / password reset

- **Resend invite** (target `invited`, `users.create`/`users.update`): regenerate
  `generateLink({type:'invite'})`, rebuild the confirm URL, enqueue `buildInviteEmail`, audit
  `user.invite_resent`.
- **Send password reset** (target `active`, `users.update`): `generateLink({type:'recovery'})` →
  `…/app/auth/confirm?token_hash=…&type=recovery&next=/app/reset-password` → `buildPasswordResetEmail`
  (reuse P2/P1) → audit `user.password_reset_sent`.
- **Outbox:** reuse `enqueueEmail` + inline delivery (Hobby). **Dedupe:** `emailDedupeKey(template,
  email, <hashed-token slice>)` — a retried click is a no-op. **Rate limiting:** reuse
  `hit_rate_limit()` (bucket `admin_user_email`, per actor + target) to prevent mail floods. **Safe
  messages:** generic success regardless of internal outcome; never reveal token/link.

---

## 12. History timeline component

Reusable, entity-agnostic, client components under `src/components/portal/history/`:

- **`HistoryButton`** — a clock icon (reduced-motion safe) that opens the drawer; props `{entityType,
  entityId, title?}`.
- **`HistoryDrawer`** — right-side slide-over (focus-trapped, Esc/overlay close, `prefers-reduced-
  motion` respected); hosts the timeline.
- **`HistoryTimeline`** — renders rows from a server query; props `{rows, canReadTechnical}`.

**Data:** the page (server) calls `getHistory(entityType, entityId, limit, offset)` (existing,
display-safe via `audit_history()`); if the viewer holds `audit.read_technical`, the page may also
provide `getHistoryTechnical(...)` rows for an opt-in "technical details" expander. Default view shows
**no** ip/ua/metadata/old_values/new_values.

**Rendering:** `auditLabel(action)` + `auditColor(action)` (existing `display.ts`) → a colored dot +
label + actor_name/role + relative time + optional `old_status→new_status`. **Filters** (client):
All / Status (`user.disabled|enabled|role_changed`) / Security (`auth.*`, `user.password_reset_sent`)
/ Email (`user.invited|invite_resent|password_reset_sent`) / System (`source='system_job'|'vercel-
cron'`). **Empty state:** "No history yet." **Loading:** gold `!` spinner. **Pagination:** "Load
more" via `offset += limit`.

**First use:** the user detail header (`entityType='profile'`, `entityId=<user.id>`), so the timeline
shows the unified lifecycle (P2 self `profile.*` events + P3 admin `user.*` events on the same entity).

---

## 13. Audit event specification

All with `entity_type='profile'`, `entity_id=<target user id>`, `source='portal'`, `actorId=<actor>`,
emitted via `logEvent()`. (Unifies with P2's `profile.*` so one timeline shows everything.)

| action | severity | old/new | metadata | never log |
|---|---|---|---|---|
| `user.created` | `info` | — | `{role}` | password, tokens, links |
| `user.invited` | `info` | — | — | the action link / hashed token |
| `user.invite_resent` | `info` | — | — | the action link / token |
| `user.updated` | `info` | `old/new_values` = changed name fields | — | email/status/privileged fields |
| `user.role_changed` | `warning` | `old_values:{role}` / `new_values:{role}` | — | permissions internals |
| `user.disabled` | `warning` | `old_status`/`new_status` | — | — |
| `user.enabled` | `info` | `old_status`/`new_status` | — | — |
| `user.password_reset_sent` | `info` | — | — | the action link / token |

Avoid noise: **no** `user.viewed` / `history.viewed` events. Never log raw action links, hashed
tokens, passwords, session ids, or full audit payloads. `display.ts` is extended with
`user.invite_resent`, `user.password_reset_sent`, and the P2 `profile.*` labels/colors so the timeline
reads cleanly; events remain display-safe for non-technical admins.

---

## 14. Validation (zod)

Extend `src/modules/users/schema.ts` (most already exist):

- **Create user** — `createUserSchema` (exists: `firstName`, `lastName`, `email`, `role`). **Drop/ignore
  `phone`** (no column).
- **Update user** — `updateUserSchema` (exists: names, role, status). In P3, the name-edit action uses
  only `{firstName,lastName}`; role + status have their own dedicated actions/schemas below.
- **Role change** — `roleChangeSchema = { role: z.enum(ROLES) }`.
- **Status change** — `statusChangeSchema = { status: z.enum(['active','disabled']) }` (invite/accept is
  separate; admins don't set `invited`).
- **Resend** — `resendSchema = { kind: z.enum(['invite','password_reset']) }`.

Rules: emails normalized (`trim().toLowerCase().email()`); names `trim().min(1).max(80)`, block angle
brackets/control chars (same helper approach as P2); roles/statuses restricted to enums; no privileged
fields accepted from the client; trim all strings.

---

## 15. Security requirements

- Service role only inside **server-only** actions (`modules/users/actions.ts`); **no service-role
  import in any client component** (asserted by test).
- Every action calls `requireAuth()` + its specific `requirePermission('users.*')`; the route gate is
  not the sole boundary.
- RLS stays active: admin **reads** via SSR (RLS `is_admin()`); admin **writes to other profiles** via
  service role (no admin `profiles` UPDATE policy) — documented, gated, audited.
- Never log raw tokens/action links/passwords; **no passwords generated or emailed**; invitees set
  their own password via the P1 confirm→reset flow.
- No open redirects (reuse `safeNext`); no client-supplied `role`/`status`/`id`/path trusted; no
  privilege escalation (catalog roles ≤ admin; super-admin not assignable here).
- No editing a platform-super-admin via the normal UI unless the actor is a super-admin; no self-
  disable / self-demotion; no last-admin removal; **no destructive delete**.
- Generic user-facing errors; audit every sensitive action.

---

## 16. Files to create / update (adjusted to the real repo)

**Reuse as-is:** `lib/audit/queries.ts` (`getHistory`/`getHistoryTechnical`), `lib/security/rbac.ts`
(`requirePermission`), `lib/security/authorize.ts`, `lib/supabase/admin.ts` (`authAdmin`),
`lib/outbox/enqueue.ts`, `lib/status/colors.ts`, P1 `/app/auth/confirm` route, P2 `getSignedAvatarUrl`.

**Extend (small):**
- `lib/audit/display.ts` — add `user.invite_resent`, `user.password_reset_sent`, `profile.*` labels+colors.
- `lib/status/colors.ts` *(or a new `lib/status/user.ts`)* — `userStatusToken(status)` mapping.
- `modules/users/schema.ts` — add `roleChangeSchema`, `statusChangeSchema`, `resendSchema`; stop using `phone`.
- `modules/users/types.ts` — add `UserListRow`, `UserDetail` view types.
- `modules/auth/emails.ts` — add `buildInviteEmail({to, firstName, actionUrl})`.
- `components/portal/shell/Topbar.tsx` *(or a new `Sidebar`/nav)* — permission-gated **Users** link.

**Create:**
- `src/app/(portal)/app/(protected)/users/page.tsx`, `users/new/page.tsx`, `users/[id]/page.tsx`.
- `src/modules/users/actions.ts` — `createUser`, `updateUserName`, `changeUserRole`, `setUserStatus`,
  `resendInvite`, `sendUserPasswordReset`.
- `src/modules/users/queries.ts` — `listUsers(filters)`, `getUserDetail(id)`.
- `src/components/portal/users/` — `UserTable.tsx`, `UserForm.tsx`, `UserDetailHeader.tsx`,
  `UserStatusBadge.tsx`, `RoleBadge.tsx`.
- `src/components/portal/history/` — `HistoryButton.tsx`, `HistoryDrawer.tsx`, `HistoryTimeline.tsx`.
- `src/modules/users/users.test.ts` (+ `history` test as needed).

**Migration:** none required. *Optional* `0016_profiles_admin_update_policy.sql` only if §21(1) chooses
the RLS-write path.

---

## 17. Tests for P3

Unit / structural (Vitest, offline — directly testable):
- Schemas: create/update/role/status validate; reject bad email, >80 names, angle brackets, non-enum
  role/status; email normalized.
- Guard helpers (pure functions to extract): `isLastAdmin(count, targetIsAdmin, newRole)`,
  `isSelfDisable(actorId,targetId)`, `blocksSuperAdmin(actorIsSuper, targetIsSuper)` → expected booleans.
- `auditLabel`/`auditColor` cover the new actions; `userStatusToken` mapping.
- No service-role import reachable from client components (`UserTable/UserForm/UserDetailHeader/History*`).
- `npx tsc --noEmit` passes; `next build` passes; existing P1+P2 tests still green.

Behavioral targets (contract + manual §18, no e2e harness): non-permitted/disabled user → `/app/users`
denied; admin admitted; create validates + dedupes email; invite enqueued; `user.created`/`user.invited`
audited; allowed role change works; escalation/last-admin/self-disable blocked; disable blocks next
request; reset resend enqueues; HistoryTimeline uses `getHistory` (safe); technical fields hidden
without `audit.read_technical`; no raw links/tokens in audit rows.

---

## 18. Manual checks after implementation

Create a test user → invite email arrives → invitee sets password via the link → invitee logs in →
appears in `/app/users` → admin edits name (full name updates) → admin changes role → admin disables →
disabled user is blocked on next request → admin re-enables → resend password reset works → the history
clock shows created/invited/role/status events → technical metadata visible only with
`audit.read_technical` → `/app/profile`, `/app/login`, `/app/dashboard`, forgot/reset/sign-out, and the
outbox cron all still work.

---

## 19. Rollback plan

Code-only by default (no migration): revert the P3 commit; P0/P1/P2 untouched; the old `/[locale]/admin`
remains as a fallback admin surface until P4 retires it. If §21(1) adds the optional admin-update RLS
policy, it is additive with `-- ROLLBACK:` (drop policy). No business tables touched in any case.

---

## 20. Risks and open questions

1. **Admin write path** — admin edits to *other* users' `profiles` need the service-role client (no
   admin `profiles` UPDATE RLS policy). Acceptable + documented, or add the policy (§21·1)?
2. **Invite mechanics** — `generateLink({type:'invite'})` for a freshly `createUser`'d (unconfirmed)
   user, delivered via our outbox (not Supabase's email). Confirm `type:'invite'` vs `type:'recovery'`
   for first-password (both work through `/app/auth/confirm`).
3. **`handle_new_user`** sets `status` from metadata (defaults `invited`); the create action passes
   `status:'invited'` + `created_by` explicitly. Verify metadata keys at build time.
4. **Platform-super-admin protection + last-admin protection** — enforced in app actions (counts +
   `is_platform_super_admin()`), not the DB; acceptable for P3.
5. **Email change / user delete** — deferred (out of P3).
6. **Phone** — `modules/users/schema.ts` has a `phone` field but `profiles` has no column → P3 omits
   it; tidy later.
7. **History pagination/performance** — `audit_history()` is indexed by entity; "Load more" via
   offset is fine at P3 volumes.
8. **Audit display completeness** — extend `display.ts` so all P2/P3 actions have labels/colors.
9. **entity_type choice** — P3 uses `'profile'` (unifies with P2). Confirm vs a separate `'user'`.

---

## 21. Final readiness checklist

- **P3 spec ready:** **YES.**
- **Blockers:** none. P3 is buildable **code-only** on the existing foundation; no migration required.
- **Assumptions:** permission-gated access (`users.*`, `audit.read*`); admin reads via SSR/RLS, admin
  writes via service role; invite + reset reuse the P1 `/app/auth/confirm` verifyOtp flow; audit
  `entity_type='profile'`; no phone; no delete; no email change; English-only; one role per user.
- **Decisions needed before build:**
  1. **Admin write path:** service-role writes to other `profiles` (no migration, recommended) **or**
     add additive `0016_profiles_admin_update_policy` so admin writes go through SSR/RLS?
  2. **Self-disable / self-demote:** hard-block (recommended) or allow with an explicit confirm modal?
  3. **Session revocation on disable:** rely on next-request `requireAuth()` (recommended) or also
     hard-revoke sessions via the Admin API immediately?
  4. **Resend-invite/reset rate limit:** confirm the `hit_rate_limit()` bucket + thresholds.

**Exact approval question:** *"Approve P3 as specified — code-only User Management at `/app/users*` +
reusable History timeline, permission-gated, admin writes via service role, invite/reset reusing the P1
confirm flow, audit on `entity_type='profile'`, no migration — with your choices on (1) write path, (2)
self-disable handling, (3) session revocation, and (4) resend rate limits? On approval I build P3 only
and stop."*

No code will be written until this is approved.
