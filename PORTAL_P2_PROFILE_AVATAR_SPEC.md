# PORTAL — P2 PROFILE + AVATAR · TECHNICAL IMPLEMENTATION SPECIFICATION

Single source of truth: `AMAI_PORTAL_MASTER_PLAN.md` (incl. PART IV lessons learned).
Status going in: P0 foundation implemented + corrected + approved; P1 Auth implemented,
reviewed and live smoke-tested (passed). This document specifies **P2 only**. No code is
written here. No files are modified. No migration is applied. One **optional** corrective
migration is identified and put up for approval in §16.

All facts below were verified against the **live** amai database (`bkwwlmflsbhrsfwydbnv`) and
the current repo, not assumed.

---

## 1. P2 objective

P2 gives an authenticated, active user a single self-service **profile page** at `/app/profile`:

- view their own profile (read-only identity + status fields),
- edit a small allowlist of their own fields (`first_name`, `last_name`; `full_name` is derived),
- upload a profile **avatar** into the existing **private** `avatars` bucket, with server-side
  validation, own-folder path scoping, and **signed-URL** display,
- and have both the profile update and the avatar upload **audit-logged** via the existing
  `logEvent()`.

P2 must **not** include: user management, an admin user list, role editing, status editing by
normal users, the history-timeline UI, any CRM/ERP/finance/NDA/external-client modules, the old
`/admin` migration, public profile pages, profile search, organization settings, or MFA. P2 must
not touch business tables (`leads`, `customers`, `orders`, `subscriptions`, old `documents`, old
`requests`). P2 is **English-only** and lives entirely inside the existing `(portal)` shell.

P2 is intended to be **code-only** (no required migration). A defense-in-depth column guard on
`profiles` is recommended but optional; see §15–§16.

---

## 2. Dependency check from P0/P1 (verified)

| Dependency | Live/Repo status | How P2 uses it |
|---|---|---|
| `public.profiles` | Columns: `id, created_at, updated_at, email, full_name(null), is_active, last_login_at(null), first_name(null), last_name(null), status, avatar_url(null), created_by(null)`. **No `phone`.** RLS **on**. | Read own row for the view; update only `first_name,last_name,full_name`; store avatar path in `avatar_url`. |
| `profiles` RLS | `profiles_select_self_or_admin` (SELECT: `id=auth.uid() OR is_admin()`); `profiles_update_self` (UPDATE: USING+CHECK `id=auth.uid()`, **no column restriction**). Triggers: `profiles_sync_active`, `profiles_touch`. | Self read/update run under the **SSR session client** (RLS-enforced); the action restricts columns. The missing column restriction is addressed by an app allowlist + an optional DB guard (§16). |
| `avatars` storage bucket | Exists, **`public=false`** (private). No `file_size_limit`, no `allowed_mime_types` at the bucket level. | Store avatars privately; enforce size/MIME in the app (§6, §8). |
| avatars storage policies | `avatars read own` (SELECT), `avatars write own` (INSERT), `avatars update own` (UPDATE), `avatars delete own` (DELETE) — all `authenticated`, own-folder. | All avatar I/O runs under the **SSR session client**; no service role. Path must start with `auth.uid()`. |
| `requireAuth()` (`src/lib/security/rbac.ts`) | Returns active `Profile` or redirects to `/app/login`. | Gate the page and every action; reads **live `profiles.status`**. |
| `getCurrentProfile()` / `getSessionUser()` | Server-only; SSR client. | Resolve the session user + profile inside queries/actions. |
| `PortalShell` + `(protected)` layout | `(protected)/layout.tsx` calls `requireAuth()` then renders `PortalShell` with `Topbar`. | `/app/profile` lives under `(protected)`, so it inherits the gate + shell automatically. |
| `logEvent()` (`src/lib/audit/log.ts`) | Server-only writer; rich input (`action, actorId, entityType, entityId, oldValues, newValues, metadata, severity, source`); DB `log_event` is service-role-only. | Emit `profile.updated`, `profile.avatar_uploaded` (and `profile.avatar_removed` if delete is in scope). |
| `audit_logs` / `audit_history()` | Append-only; technical fields gated by `audit.read_technical`. | P2 only **writes** events; it does not render history (that is P3). |
| Upload helper (`src/lib/security/upload.ts`) | **Exists**: `AVATAR_MAX_BYTES=2MB`, `AVATAR_MIME=[png,jpeg,webp]`, `validateAvatarMeta({type,size})→{ok,ext}`. Magic-byte check noted as "enforced in the P2 upload action". | Reuse `validateAvatarMeta`; P2 **adds** a magic-byte sniff helper here. |
| Database types (`src/lib/types/database.ts`) | Mirrors the live schema; `profiles` Row present. | Type the queries/actions; regenerate only if a migration is approved. |
| Supabase clients | `createServerSupabase()` (SSR/RLS), `createAdminClient()` (service-role, server-only). | Profile/avatar I/O → SSR client. Service role is **not** used by P2 modules (only indirectly inside `logEvent`). |
| Gold `!` spinner (`src/components/portal/ui/Spinner.tsx`) | Exists. | Loading state on Save + Upload buttons. |
| Account avatar (`src/components/portal/shell/Avatar.tsx`) | Exists (pink bg, gold ring, initials fallback). | Reused on the profile header; Topbar avatar gains a link to `/app/profile` and a signed URL source. |

---

## 3. Profile fields and permissions

**Viewable (read-only on the page unless listed as editable):**
`first_name`, `last_name`, `full_name`, `email`, `avatar_url` (as a signed URL), `status`,
`last_login_at`, `created_at`. `phone` is **not viewable** — the column does not exist.

**Editable by a normal user:** `first_name`, `last_name`, and the **avatar** (separate upload
flow). `phone` is excluded (no column).

**Never editable by a normal user:** `email` (Auth-managed; out of P2 scope), `status`,
`is_active`, `created_by`, `id`, any role/permission/organization-membership/platform-admin flag
(these are not columns on `profiles` and live in separately protected tables).

**`full_name` derivation:** `full_name` is **derived server-side**, never a free-text field. On
update, `full_name = [first_name, last_name].map(trim).filter(Boolean).join(' ') || null`. If both
names are empty, `full_name` becomes `null`. This keeps the header/topbar name consistent with the
edited parts and avoids a third editable field drifting out of sync.

---

## 4. Routing plan

- **Route:** `/app/profile` → `src/app/(portal)/app/(protected)/profile/page.tsx`.
- **Protection:** inside the `(protected)` route group, so the existing `(protected)/layout.tsx`
  runs `await requireAuth()` before the page renders. No new guard logic needed.
- **Active-user requirement:** `requireAuth()` redirects unauthenticated **and** non-`active`
  (disabled/invited) users to `/app/login` (live status check) — reusing P1 logic verbatim.
- **Shell:** renders inside the existing `PortalShell` with the `Topbar` (no layout changes beyond
  linking the topbar avatar to `/app/profile`).
- **Isolation:** no locale prefix (portal rule), `noindex`, no effect on the marketing site or
  `/admin`. The page is server-rendered with `no-store` (inherited from the `/app/:path*` header).

---

## 5. UI/UX specification

Single-column, responsive, brand-styled (red/gold, `paper` background, `font-display` headings),
English-only. Layout (max-w-2xl, stacked cards):

1. **Header** — the circular account avatar (signed URL or initials fallback), the user's
   `full_name`/name, `email` (muted), and a `status` pill (e.g. "Active"). `last_login_at` and
   `created_at` shown as small muted metadata.
2. **Avatar upload card** — current avatar preview, a file input (PNG/JPG/WebP, max 2 MB), a
   short helper line, an **Upload** button with the gold `!` spinner while pending, inline
   success ("Photo updated") and error states. Optional **Remove photo** action (decision §16).
3. **Profile form card** — `first_name` and `last_name` inputs (labelled), `email` shown
   **read-only/disabled** with a note that it cannot be changed here, a **Save** button with the
   gold `!` spinner, inline success ("Profile saved", green = `ok`) and error (red = `red`)
   banners matching the P1 auth-notice convention, plus per-field validation messages.

States, both cards: idle → submitting (disabled inputs + spinner) → success (green inline) or
error (red inline). Forms use React `useActionState` like the P1 forms. No client storage. No
optimistic privileged data. Responsive: cards stack full-width on mobile, comfortable padding.

---

## 6. Avatar upload design

- **Accepted types:** `image/png`, `image/jpeg`, `image/webp` (from `AVATAR_MIME`).
- **Max size:** 2 MB (`AVATAR_MAX_BYTES`). Enforced **server-side** (client size hint is advisory).
- **Server-side validation order:** (1) presence + `validateAvatarMeta({type,size})`; (2) read
  bytes; (3) **magic-byte sniff** (PNG `89 50 4E 47`, JPEG `FF D8 FF`, WebP `RIFF…WEBP`) and
  confirm it matches the declared MIME/`ext`; reject on mismatch. The bucket has no DB-level
  MIME/size limit, so the **app is the enforcement point**.
- **Filename / path strategy:** `"{auth.uid}/avatar.{ext}"`. The folder segment is the user id, so
  the object satisfies the own-folder storage RLS. The path is **always derived server-side from
  the session user** — never taken from client input.
- **Overwrite strategy:** `upload(path, file, { upsert: true, contentType })`. If the new `ext`
  differs from the previously stored one, the prior object(s) in the user's folder are removed so a
  stale `avatar.png` cannot linger beside a new `avatar.webp`.
- **Signed URL strategy:** display uses `storage.from('avatars').createSignedUrl(path, 60)` (≈60 s
  TTL) generated **server-side** under the user's SSR session (the `avatars read own` policy
  permits it — **no service role**). Signed URLs are never persisted or logged.
- **Cache busting:** each render generates a fresh signed URL (unique token), so the browser
  always fetches the current object; no manual cache-bust param needed. (If desired, append the
  object `updated_at` as `?v=` for extra safety — optional.)
- **`avatar_url` storage:** `profiles.avatar_url` stores the **object path** (`"{uid}/avatar.{ext}"`),
  **not** a signed or public URL (the bucket is private; a stored signed URL would expire). Display
  resolves the path → signed URL on demand.
- **Private bucket preserved:** no public bucket, no `getPublicUrl`, bucket stays `public=false`.

---

## 7. Server actions / queries

All in `src/modules/profile/*`. Server modules are `server-only`; the action file is `'use server'`.
Avatar/profile I/O uses the **SSR session client** (RLS). Service role is not imported into P2.

- **`getMyProfile()`** — *queries.ts, server-only.*
  Input: none. Resolves session user (`getSessionUser()`), selects own `profiles` row (RLS). Permission:
  implicit (own row only). Returns `Profile | null`. Errors: returns `null` on no session/row (page
  handles via `requireAuth`). No audit (reads are not audited).

- **`getSignedAvatarUrl(path: string | null, ttl = 60)`** — *queries.ts, server-only.*
  Input: stored avatar path. Validates the path begins with the session user's id (defense in depth);
  returns a signed URL string or `null`. Never throws to the caller; logs nothing. SSR client.

- **`updateMyProfile(prev, formData)`** — *actions.ts, 'use server'.*
  Input: `first_name`, `last_name` (FormData). Validation: `profileUpdateSchema` (§8). Permission:
  `requireAuth()`; updates **only** the session user's row, **only** the allowlisted columns
  `{ first_name, last_name, full_name(derived) }` via the SSR client. Boundary: server action.
  Returns `{ ok: true } | { error: string }`. Errors: generic message; never leaks DB detail. Audit:
  `profile.updated` with old/new of the name fields only (§9).

- **`uploadMyAvatar(prev, formData)`** — *actions.ts, 'use server'.*
  Input: `file` (FormData). Validation: `validateAvatarMeta` + magic-byte sniff. Permission:
  `requireAuth()`; derives path `"{user.id}/avatar.{ext}"` server-side. Uploads (upsert) under the
  SSR client, removes a prior differing-ext object, writes `profiles.avatar_url = path`. Returns
  `{ ok: true } | { error: string }`. Audit: `profile.avatar_uploaded` (§9).

- **`removeMyAvatar()`** — *actions.ts, 'use server'.* **Only if approved (§16).** Deletes the
  user's avatar object(s), sets `avatar_url = null`, audits `profile.avatar_removed`.

Return shapes mirror P1's `AuthState` style (`{ ok?: boolean; error?: string }`) for `useActionState`.

---

## 8. Validation (zod)

`src/modules/profile/schema.ts`:

- **`profileUpdateSchema`**
  - `first_name`: `z.string().trim().max(80)`, transform `'' → null`, optional ⇒ `string | null`.
  - `last_name`: same as `first_name`.
  - Reject control characters and angle brackets (`<`, `>`) to avoid stored-markup/injection; output
    is also escaped at render (React) — validation is defense in depth, not the only guard.
  - `full_name` is **not** in the schema (derived in the action).
  - `phone`: **not present** (no column). If added later (§16), `phone` becomes
    `z.string().trim().max(32).regex(/^[+0-9 ()-]*$/)` `'' → null`.
- **Avatar metadata** — handled by the existing `validateAvatarMeta({ type, size })` plus the new
  magic-byte sniff; no separate zod schema needed. A small `sniffImageMagic(bytes, ext)` helper is
  added to `src/lib/security/upload.ts`.

Rules: trim all strings; empty → `null`; reject invalid/oversized; enforce MIME by declared type
**and** magic bytes; never trust client-provided paths or sizes as authoritative.

---

## 9. Audit logging

Via `logEvent()` (server-only). `actorId` = the server-resolved session user; `source: 'portal'`.

| Event | severity | entityType | entityId | old/new values | metadata | never log |
|---|---|---|---|---|---|---|
| `profile.updated` | `info` | `profile` | `user.id` | only changed name fields (`first_name,last_name,full_name`) | — | email, status, avatar bytes, any privileged field |
| `profile.avatar_uploaded` | `info` | `profile` | `user.id` | — | `{ ext, size_bytes, path }` | the file bytes, the signed URL, any token |
| `profile.avatar_removed` *(only if §16 approves removal)* | `info` | `profile` | `user.id` | — | `{ path }` | signed URL |

`profile.update_failed` is **not** emitted for routine validation/user errors (audit-noise rule).
Display: these are user-facing, non-technical events; they surface safely through the existing
`audit_history()` in P3 (the raw technical reader stays gated by `audit.read_technical`). No raw
PII or secrets enter audit rows.

---

## 10. Security requirements

- `requireAuth()` on the page and on **every** action (live `profiles.status`); disabled/invited
  users are redirected by existing P1 logic.
- A user can read/update **only their own** profile — enforced by `profiles` RLS **and** by the
  action's explicit own-id + column allowlist.
- A normal user **cannot** change `status`, `is_active`, `created_by`, `email`, `id`, or any
  role/permission/membership/platform flag. The action writes only `{first_name,last_name,full_name}`.
  (Hardening note: `profiles_update_self` has no column restriction, so a hand-crafted direct API
  call by an *active* user could still write `is_active`/`status` on their **own** row. This cannot
  escalate privileges — role grants live in separately protected tables, and only active users hold
  a session — but it permits self-sabotage. The optional guard in §16 closes this at the DB level.)
- Avatar object path is **always** `"{auth.uid}/…"` derived server-side; client-supplied paths are
  never trusted. `getSignedAvatarUrl` re-checks the path prefix against the session user.
- **No public bucket**, no `getPublicUrl`; display is via short-lived (≈60 s) signed URLs only.
- **No service-role** client in P2 modules or any client component; avatar/profile I/O is RLS-bound
  via the SSR session client. `logEvent` (service-role) stays server-only and isolated.
- Generic, non-leaky error messages to the user; storage RLS enforces own-folder access; signed
  URLs are short-lived and never logged or persisted.

---

## 11. Files to create / update (adjusted to the real repo)

**Create**
- `src/app/(portal)/app/(protected)/profile/page.tsx` — server page: `requireAuth()`, load profile +
  signed avatar URL, render header + the two client cards.
- `src/modules/profile/schema.ts` — `profileUpdateSchema` + `ProfileFormState` type.
- `src/modules/profile/queries.ts` — `getMyProfile`, `getSignedAvatarUrl` (`server-only`).
- `src/modules/profile/actions.ts` — `updateMyProfile`, `uploadMyAvatar` (+ `removeMyAvatar` if
  approved) (`'use server'`).
- `src/components/portal/profile/ProfileForm.tsx` — client form (`useActionState`, gold spinner).
- `src/components/portal/profile/AvatarUpload.tsx` — client upload card (preview, `useActionState`,
  gold spinner).
- `src/modules/profile/profile.test.ts` — unit tests (§12).

**Update (small)**
- `src/lib/security/upload.ts` — add `sniffImageMagic(bytes, ext)` (the magic-byte check the file
  already anticipates). No change to the existing exports.
- `src/components/portal/shell/Topbar.tsx` — link the avatar to `/app/profile` and source it from
  the signed avatar URL (fallback to initials when `avatar_url` is null). The pre-P2 static
  `/public/avatar-tom.png` placeholder becomes the ultimate fallback only.
- *(Optional)* relocate/duplicate `Avatar` to `src/components/portal/ui/Avatar.tsx` if it is reused
  on the profile header; otherwise import the existing `shell/Avatar.tsx`. No behavior change.

**Reuse as-is** — `rbac.ts` (`requireAuth`, `getSessionUser`), `audit/log.ts` (`logEvent`),
`supabase/server.ts` (SSR client), `types/database.ts`, `ui/Spinner.tsx`, `validateAvatarMeta`.

No business-table files, no `/admin` files, no migration files (unless §16 is approved).

---

## 12. Tests for P2

Unit / structural (Vitest, run offline) — these are directly testable:
- `profileUpdateSchema`: trims; `'' → null`; rejects `>80` chars and angle brackets; valid names pass.
- `full_name` derivation helper: `("Tom","de Vree")→"Tom de Vree"`; `("","")→null`; trims.
- `validateAvatarMeta`: rejects wrong MIME; rejects `> 2 MB`; returns correct `ext`.
- `sniffImageMagic`: accepts real PNG/JPEG/WebP byte headers; rejects a mismatched/forged header.
- Avatar path builder: always yields `"{uid}/avatar.{ext}"`; a client-supplied path is ignored.
- Static guard test: no `createAdminClient` / `service_role` import reachable from the client
  components (`ProfileForm`, `AvatarUpload`).
- `npx tsc --noEmit` passes; existing P1 auth tests (33) still pass.

Behavioral targets (asserted via the action/query contracts + manual §13, since there is no e2e
harness): unauthenticated → `/app/profile` redirects to login; disabled user redirected; active
user views own profile; status/role/is_active not updatable through the action; `first_name`/
`last_name` update succeeds and updates `full_name`; oversized/wrong-MIME upload rejected; signed
URL returned for an existing object; `profile.updated` and `profile.avatar_uploaded` audit rows
written.

---

## 13. Manual checks (after implementation)

- Upload a real PNG, a JPG and a WebP avatar; each displays in the header **and** the topbar.
- Refresh the page → avatar still displays (a fresh signed URL is minted).
- Confirm the object is **not** publicly reachable (constructing the public storage URL fails).
- Verify form success and error states (valid save; oversized file; wrong type; angle-bracket name).
- Verify `audit_logs` rows exist for `profile.updated` and `profile.avatar_uploaded` (no secrets).
- Regression: `/app/login`, `/app/dashboard`, `/app/forgot-password`, `/app/reset-password`,
  `/app/auth/confirm`, sign-out all still work.

---

## 14. Rollback plan

- **Code-only path (default):** revert the P2 commit. Nothing in P0/P1 depends on P2; auth,
  dashboard and the outbox stay intact. `profiles.avatar_url` rows that were set remain harmless
  (a null/ path string); no schema change to undo.
- **If the optional guard migration (§16) is applied:** it is additive (a trigger/policy). Rollback
  = a follow-up additive migration that drops the trigger/policy, with the down steps documented in
  the migration header. No data change, no business tables touched.

---

## 15. Risks and open questions

1. **`phone` does not exist** on live `profiles`. P2 excludes phone. Adding it would require an
   additive migration + `database.ts` regen — **out of P2** unless explicitly requested.
2. **`avatar_url` stores the object path** (decided), not a signed/public URL, because the bucket is
   private and signed URLs expire. Confirm no other consumer expects a URL there (none found).
3. **`full_name` is derived** from `first_name`+`last_name` on update (decided). Confirm no external
   process writes `full_name` independently (P0 `handle_new_user` sets it at creation; P2's derive
   keeps it consistent thereafter).
4. **Avatar removal** (`removeMyAvatar` + `profile.avatar_removed`) is **not** in the stated P2
   scope. Recommended to include (trivial, good UX) — decision in §16.
5. **Crop/resize is deferred.** P2 stores the validated original (≤2 MB). No server-side image
   processing in P2.
6. **Bucket has no DB-level size/MIME limit.** P2 enforces both in the app. Optionally tighten the
   bucket (`file_size_limit`, `allowed_mime_types`) as additive hardening — decision in §16.
7. **`profiles_update_self` has no column restriction.** Not a privilege-escalation path (role
   grants are elsewhere; only active users have sessions), but it allows self-sabotage via a direct
   API call. Optional DB guard recommended — decision in §16.

---

## 16. Final readiness checklist

- **P2 spec ready:** **YES.**
- **Hard blockers:** none. P2 can ship **code-only** on the existing P0/P1 foundation.
- **Assumptions:** `avatar_url` = object path; `full_name` derived; avatar path `"{uid}/avatar.{ext}"`;
  signed-URL TTL ≈60 s; all avatar/profile I/O via the SSR (RLS) client; English-only; no `phone`.
- **Decisions needed before build (please answer):**
  1. **Privileged-column guard** — approve an **additive** hardening migration
     `0014_profiles_self_update_guard` (a `BEFORE UPDATE` trigger that blocks a non-admin from
     changing `status`, `is_active`, `created_by`, `email`, `id` on their own row)? **Recommended.**
     Or ship P2 **code-only** (app allowlist only)?
  2. **Avatar removal** — include `removeMyAvatar` + a "Remove photo" button (+ `profile.avatar_removed`
     audit) in P2, or defer?
  3. **Bucket hardening** — also set `avatars` `file_size_limit` + `allowed_mime_types` at the bucket
     level (additive), or rely on app-side validation only?
  4. **Phone** — leave out (default), or add a `phone` column + field now (extra additive migration)?

**Exact approval question:** *"Approve P2 as specified — code-only profile + avatar at `/app/profile`
using the existing private `avatars` bucket and RLS — with your choices on (1) the optional
`profiles` self-update guard migration, (2) avatar removal, (3) bucket-level limits, and (4) phone?
On approval I will build P2 only and stop."*

No code will be written until this is approved.
