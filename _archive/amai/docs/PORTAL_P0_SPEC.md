# Portal — P0 Technical Implementation Specification (Foundation)

> Master architecture: **Portal Plan v3** (`PORTAL_PLAN.md`), Part B authoritative.
> This document specifies **P0 only**. It is database-first and security-first.
> **No code is written yet.** This is the spec to approve before building.

---

## 1. P0 objective

**Achieve:** a complete, secure data + authorization foundation for the `/app` platform,
with **no UI**. After P0, the database enforces multi-tenant access, a permission model,
append-only audit, rate limiting and a minimal reliable email outbox; and a thin, server-only
TypeScript layer exposes typed helpers (`requirePermission`, `logEvent`, `enqueueEmail`,
worker, rate-limit) for P1+ to build on.

**P0 delivers:** migrations `0006`–`0012`; tables `profiles`, `organizations`,
`organization_members`, `roles`, `permissions`, `role_permissions`, `platform_admins`,
`audit_log`, `rate_limit`, `outbox`, `email_log`; functions `current_org()`,
`has_permission()`, `is_org_admin()`, `is_platform_super_admin()`, `log_event()`,
`hit_rate_limit()`, `claim_outbox()`, `complete_outbox()`; RLS on every new table; the seed
(org + roles + permission catalog + mapping); the `avatars` storage bucket + policies (DDL
only); and the server-only lib spine.

**P0 must NOT include:** any UI, auth pages, user-management screens, profile screen, the
HistoryTimeline component, CRM/ERP modules, companies/contacts, the old `/admin` migration,
Resend webhooks, open/click tracking, notifications, MFA, or impersonation. `current_company()`
is **deferred** (no companies table in P0).

**Definition of done:** `npx tsc --noEmit` clean; the SQL/RLS/function test checklist (§12)
passes on a throwaway database; the live marketing site and the existing `leads`/`customers`/
`orders`/`subscriptions`/`documents`/`requests` tables are untouched.

---

## 2. Exact migration plan

All migrations are **additive**. `0006` has not been applied anywhere, so it is **revised in
place** (its current role/`is_admin` content moves to `0007`/`0008`). The existing file
`0006_profiles_and_roles.sql` is **renamed** to `0006_profiles.sql`. From first apply onward,
additive-only; never touch `leads`, `customers`, `orders`, `subscriptions`, `documents`,
`requests`.

Each migration file ends with a `-- ROLLBACK:` comment block listing the exact `drop`
statements a corrective migration would use (we never hand-edit an applied migration).

### 0006_profiles.sql
- **Purpose:** identity + account status per auth user. No role here (roles live on
  membership).
- **Tables:** `public.profiles` (see §3).
- **Indexes:** `unique (lower(email))`; `(status)`.
- **Constraints:** PK `id`; FK `id → auth.users(id) on delete cascade`; FK
  `created_by → auth.users(id) on delete set null`; `check status in
  ('active','disabled','invited')`.
- **Triggers:** `profiles_touch` (BEFORE UPDATE → `updated_at = now()`); `on_auth_user_created`
  (AFTER INSERT on `auth.users` → `handle_new_user()`).
- **Functions:** `public.touch_updated_at()` (idempotent); `public.handle_new_user()`
  (SECURITY DEFINER; inserts the profile from `raw_user_meta_data`).
- **RLS:** enable; `profiles_select_self` (id = auth.uid()); `profiles_update_self`
  (id = auth.uid()). Admin/platform read+update policies and the privilege-guard trigger are
  added in `0008` (they need the authz functions).
- **Seed:** none.
- **Rollback:** `drop trigger on_auth_user_created on auth.users; drop function
  handle_new_user; drop table profiles;` (touch_updated_at kept — shared).

### 0007_organizations.sql
- **Purpose:** the tenant + membership backbone.
- **Tables:** `public.organizations`, `public.organization_members` (see §3).
- **Indexes:** `organizations(unique slug)`; `organization_members(unique (organization_id,
  user_id))`, `(user_id)`, `(organization_id)`, `(role_id)`.
- **Constraints:** `organization_members.role_id` is `uuid not null` **without** an FK yet
  (the `roles` table is created in `0008`; the FK is added there). FKs:
  `organization_id → organizations(id) on delete cascade`,
  `user_id → profiles(id) on delete cascade`. Checks on `member_type`, `status`.
- **Functions:** `public.current_org()` (SECURITY DEFINER, see §4).
- **RLS:** enable on both. `organizations`: select where caller is an active member or platform
  super-admin. `organization_members`: select own rows or (admin/platform) all in the org;
  no client insert/update/delete (managed by service role / P3 actions).
- **Seed:** one organization — `slug='amai'`, `name='amai'` (idempotent `on conflict (slug)
  do nothing`).
- **Rollback:** `drop table organization_members; drop table organizations; drop function
  current_org;`

### 0008_rbac.sql
- **Purpose:** the permission model + platform plane + the privilege guard.
- **Tables:** `public.roles`, `public.permissions`, `public.role_permissions`,
  `public.platform_admins` (see §3).
- **Constraints:** unique `roles.key`, `permissions.key`; `role_permissions` PK
  `(role_id, permission_id)` with cascading FKs; `platform_admins.user_id` PK FK
  `→ profiles(id) on delete cascade`. **Adds** the deferred FK
  `organization_members.role_id → roles(id)`.
- **Functions:** `has_permission(text)`, `is_org_admin()`, `is_platform_super_admin()`
  (all SECURITY DEFINER, see §4). Re-defines nothing from `0006` except adding the
  `profiles_guard_privilege()` trigger function + trigger.
- **Triggers:** `profiles_guard` (BEFORE UPDATE on `profiles`): non-admins cannot change
  `status`, `email`, `created_by`, `created_at`, `id`.
- **RLS:** add `profiles_select_admin`/`profiles_update_admin` (using `is_org_admin()`);
  `roles`/`permissions`/`role_permissions` are **read-only** to authenticated
  (`select` true), writes service-role only; `platform_admins` select = `is_platform_super_admin()`,
  writes service-role only.
- **Seed:** the permission catalog, the five org roles, and the role→permission mapping (§6).
  Idempotent.
- **Rollback:** `alter table organization_members drop constraint …; drop trigger
  profiles_guard …; drop function profiles_guard_privilege, has_permission, is_org_admin,
  is_platform_super_admin; drop table role_permissions, platform_admins, permissions, roles;`

### 0009_audit_log.sql
- **Purpose:** the single, raw, append-only event store.
- **Tables:** `public.audit_log` (see §3).
- **Indexes:** `(entity_type, entity_id, created_at desc)`; `(organization_id, created_at
  desc)`; `(actor_id)`; `(action)`.
- **Functions:** `public.log_event(...)` (SECURITY DEFINER, derives actor from `auth.uid()`,
  see §4).
- **RLS:** enable; **select** gated by `has_permission('audit.read')` or
  `is_platform_super_admin()`; **no insert/update/delete policies** (append-only — the only
  writer is `log_event()` as definer, or the service role).
- **Seed:** none.
- **Rollback:** `drop function log_event; drop table audit_log;`

### 0010_rate_limit.sql
- **Purpose:** DB-backed windowed counters for sensitive flows.
- **Tables:** `public.rate_limit` (see §3).
- **Functions:** `public.hit_rate_limit(text, text, int, int)` (SECURITY DEFINER, see §4).
- **RLS:** enable; **no policies** (deny all) → reachable only by the service role and the
  definer function. `execute` on the function granted to `authenticated` + `service_role`.
- **Seed:** none.
- **Rollback:** `drop function hit_rate_limit; drop table rate_limit;`

### 0011_outbox_email.sql
- **Purpose:** minimal reliable outbound-email spine.
- **Tables:** `public.outbox`, `public.email_log` (see §3).
- **Indexes:** `outbox(status, next_retry_at)`, `outbox(unique dedupe_key)`;
  `email_log(to_email, created_at)`, `email_log(outbox_id)`.
- **Functions:** `claim_outbox(int, text)`, `complete_outbox(uuid, boolean, text, text)`
  (SECURITY DEFINER; `execute` to `service_role` only — see §4/§8).
- **RLS:** enable on both; **no policies** (service-role only). No client access in P0.
- **Seed:** none.
- **Rollback:** `drop function claim_outbox, complete_outbox; drop table email_log, outbox;`

### 0012_avatars_storage.sql
- **Purpose:** private avatar storage (policies only; no upload UI in P0).
- **Storage:** create private bucket `avatars` (`public=false`).
- **Policies (storage.objects):** a user may `select/insert/update/delete` objects whose first
  path segment equals their `auth.uid()`; `is_org_admin()`/`is_platform_super_admin()` may
  manage any object in the bucket.
- **Seed:** the bucket row (idempotent `on conflict (id) do nothing`).
- **Rollback:** `drop policy … on storage.objects; delete from storage.buckets where
  id='avatars';` (only if empty).

---

## 3. Exact table definitions

Conventions: all `id` defaults `gen_random_uuid()` unless noted; `created_at`/`updated_at` are
`timestamptz not null default now()`; text status fields are constrained by `check`.

### profiles
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | — | PK; FK `auth.users(id)` on delete cascade |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | touched by trigger |
| status | text | no | 'invited' | check in (active, disabled, invited) |
| first_name | text | yes | — | |
| last_name | text | yes | — | |
| email | text | no | — | unique on `lower(email)` |
| phone | text | yes | — | |
| avatar_url | text | yes | — | |
| created_by | uuid | yes | — | FK `auth.users(id)` on delete set null |

Indexes: `unique profiles_email_key (lower(email))`, `profiles_status_idx (status)`.

### organizations
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| slug | text | no | — | unique |
| name | text | no | — | |
| status | text | no | 'active' | check in (active, disabled) |

### organization_members
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| organization_id | uuid | no | — | FK `organizations(id)` cascade |
| user_id | uuid | no | — | FK `profiles(id)` cascade |
| role_id | uuid | no | — | FK `roles(id)` **added in 0008** |
| member_type | text | no | 'internal' | check in (internal, external) |
| status | text | no | 'invited' | check in (active, disabled, invited) |

Constraints: `unique (organization_id, user_id)`. Indexes: `(user_id)`, `(organization_id)`,
`(role_id)`.

### roles
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| key | text | no | — | unique (e.g. `organization_admin`) |
| label | text | no | — | |
| is_system | boolean | no | true | system roles are not user-deletable |
| created_at | timestamptz | no | now() | |

`platform_super_admin` is **not** a row here — it is the `platform_admins` table.

### permissions
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| key | text | no | — | unique (e.g. `users.create`) |
| module | text | no | — | e.g. `users`, `audit`, `org` |
| label | text | no | — | |
| created_at | timestamptz | no | now() | |

### role_permissions
| column | type | null | default | notes |
|---|---|---|---|---|
| role_id | uuid | no | — | FK `roles(id)` cascade |
| permission_id | uuid | no | — | FK `permissions(id)` cascade |

PK `(role_id, permission_id)`.

### platform_admins
| column | type | null | default | notes |
|---|---|---|---|---|
| user_id | uuid | no | — | PK; FK `profiles(id)` cascade |
| granted_by | uuid | yes | — | FK `auth.users(id)` set null |
| granted_at | timestamptz | no | now() | |
| reason | text | yes | — | why this account is platform super-admin |

### audit_log
| column | type | null | default | notes |
|---|---|---|---|---|
| id | bigint | no | generated always as identity | PK |
| created_at | timestamptz | no | now() | |
| organization_id | uuid | yes | — | FK `organizations(id)` set null |
| actor_id | uuid | yes | — | auth user; null = system |
| actor_email | text | yes | — | snapshot |
| actor_name | text | yes | — | snapshot |
| actor_role | text | yes | — | role key or `platform_super_admin` |
| actor_type | text | no | 'internal_user' | check: internal_user, external_user, system, link_user, integration |
| action | text | no | — | free text, e.g. `user.created` |
| entity_type | text | yes | — | polymorphic |
| entity_id | text | yes | — | text (any id type) |
| entity_display_name | text | yes | — | |
| parent_entity_type | text | yes | — | |
| parent_entity_id | text | yes | — | |
| old_status | text | yes | — | |
| new_status | text | yes | — | |
| old_values | jsonb | yes | — | technical |
| new_values | jsonb | yes | — | technical |
| metadata | jsonb | yes | — | technical |
| ip_address | inet | yes | — | technical |
| user_agent | text | yes | — | technical |
| request_id | text | yes | — | technical |
| session_id | text | yes | — | technical |
| source | text | no | 'portal' | check: portal, public_link, email_link, api, system_job, webhook, platform |
| severity | text | no | 'info' | check: info, warning, critical |
| visible_to_admin | boolean | no | true | |
| visible_to_client | boolean | no | false | |

### rate_limit
| column | type | null | default | notes |
|---|---|---|---|---|
| bucket | text | no | — | e.g. `login` |
| identifier | text | no | — | hashed ip / email / user id |
| window_start | timestamptz | no | — | bucket start |
| hits | integer | no | 0 | |

PK `(bucket, identifier, window_start)`. Index `(window_start)` for cleanup.

### outbox
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| updated_at | timestamptz | no | now() | |
| organization_id | uuid | yes | — | FK `organizations(id)` set null |
| channel | text | no | 'email' | check in (email) — only email in v1 |
| dedupe_key | text | yes | — | **unique** (idempotency) |
| payload | jsonb | no | — | see §8 |
| status | text | no | 'pending' | check: pending, processing, sent, failed, retrying, cancelled |
| attempts | integer | no | 0 | |
| max_attempts | integer | no | 5 | |
| last_attempt_at | timestamptz | yes | — | |
| next_retry_at | timestamptz | yes | — | due time for retry |
| locked_at | timestamptz | yes | — | claim marker |
| locked_by | text | yes | — | worker id |
| provider_message_id | text | yes | — | Resend id |
| error | text | yes | — | sanitised |
| audit_event_id | bigint | yes | — | FK `audit_log(id)` |

Indexes: `(status, next_retry_at)`, `unique (dedupe_key)`.

### email_log
| column | type | null | default | notes |
|---|---|---|---|---|
| id | uuid | no | gen_random_uuid() | PK |
| created_at | timestamptz | no | now() | |
| outbox_id | uuid | yes | — | FK `outbox(id)` set null |
| organization_id | uuid | yes | — | |
| to_email | text | no | — | |
| subject | text | no | — | |
| template_key | text | yes | — | |
| status | text | no | 'sent' | check in (sent, failed) — delivered/bounced later |
| provider_message_id | text | yes | — | |
| error | text | yes | — | |
| audit_event_id | bigint | yes | — | FK `audit_log(id)` |

Indexes: `(to_email, created_at)`, `(outbox_id)`.

---

## 4. Authorization SQL functions

All are `SECURITY DEFINER` with `set search_path = ''` (every object schema-qualified), so
they run as the owner and **bypass RLS** without recursion, while `auth.uid()` still returns
the **calling** user. All return safe defaults when there is no authenticated user.

- **`current_org() → uuid`** — `stable`. Returns the caller's single active membership org:
  `select organization_id from public.organization_members where user_id = auth.uid() and
  status='active' limit 1`. Returns `null` when unauthenticated or no membership. *v1
  assumption: a user belongs to one org; multi-org "active org" selection (JWT claim or session
  GUC) is a later change.* No escalation: reads membership as owner, keyed to `auth.uid()`.

- **`current_company()`** — **DEFERRED in P0** (no `companies` table). Documented for later:
  will return the caller's `company_id` from membership. Not created now.

- **`has_permission(p_key text) → boolean`** — `stable`. Returns `true` if
  `is_platform_super_admin()` (short-circuit), else `true` when an **active** membership in
  `current_org()` has a role mapped to `p_key` **and** the caller's `profiles.status='active'`:
  joins `organization_members → role_permissions → permissions`. Returns `false` when
  unauthenticated. Escalation-proof: reads `role_permissions`/`permissions` (not user-writable
  under RLS) as owner; key by `auth.uid()`.

- **`is_org_admin() → boolean`** — `stable`. Thin wrapper:
  `select public.has_permission('org.manage')` (so platform super-admins and org-admins both
  pass). Used by the profiles guard + admin RLS policies.

- **`is_platform_super_admin() → boolean`** — `stable`. `true` when a row exists in
  `public.platform_admins` for `auth.uid()` **and** the profile is `active`. `false` when
  unauthenticated. This is the only cross-org escalation path and every use is audited.

- **`log_event(...) → bigint`** — inserts one `audit_log` row and returns its id.
  **Derives `actor_*` from `auth.uid()`** (joins `profiles` + membership + `platform_admins`),
  so a caller **cannot forge** the actor. `actor_type` = `system` when `auth.uid()` is null
  (service-role/system jobs), else `internal_user` (external/link/integration set explicitly by
  caller param later). Parameters supplied by the caller are the **non-identity** fields:
  `action`, `entity_type`, `entity_id`, `entity_display_name`, `old_status`, `new_status`,
  `old_values`, `new_values`, `metadata`, `organization_id` (defaults `current_org()`),
  `severity`, `source`, `ip_address`, `user_agent`, `request_id`, `session_id`. No permission
  needed to *write* (every action must be auditable); it is the **only** insert path
  (append-only RLS blocks direct inserts). `execute` to `authenticated` + `service_role`.

- **`hit_rate_limit(p_bucket text, p_identifier text, p_limit int, p_window_seconds int) →
  boolean`** — computes the current fixed window
  (`to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds)`),
  upserts the counter (`insert … on conflict (bucket, identifier, window_start) do update set
  hits = rate_limit.hits + 1`), and returns `true` when `hits <= p_limit` else `false`
  (over limit). No auth required (called pre-login with an ip/email identifier). `execute` to
  `authenticated` + `service_role`. *(Fixed-window counter; a true sliding-log limiter is a
  later refinement.)*

- **`claim_outbox(p_limit int, p_worker text) → setof outbox`** — atomically selects up to
  `p_limit` **due** rows (`status in ('pending','retrying') and (next_retry_at is null or
  next_retry_at <= now()) and locked_at is null`) using `for update skip locked`, marks them
  `status='processing', locked_at=now(), locked_by=p_worker, attempts=attempts+1,
  last_attempt_at=now()`, and returns them. `execute` to **`service_role` only**.

- **`complete_outbox(p_id uuid, p_success boolean, p_provider_message_id text, p_error text) →
  void`** — on success: `status='sent'`, set `provider_message_id`, clear lock/error, insert an
  `email_log` row (`status='sent'`). On failure: if `attempts >= max_attempts` →
  `status='failed'` + `email_log(status='failed', error=...)`; else `status='retrying'`,
  `next_retry_at = now() + backoff(attempts)`, clear lock. `execute` to **`service_role`
  only**. Backoff: `least(power(2, attempts) , 60) * interval '1 minute'` (cap ~1h).

**Grants summary:** authz/`current_org`/`has_permission`/`is_*`/`log_event`/`hit_rate_limit`
→ `authenticated` (+ `service_role`); `claim_outbox`/`complete_outbox` → `service_role` only.
`execute` is **revoked from `public`/`anon`** on all of them.

---

## 5. RLS strategy

| table | RLS | select | insert | update | delete |
|---|---|---|---|---|---|
| profiles | on | self **or** `is_org_admin()` | none (only `handle_new_user` trigger / service role) | self **or** `is_org_admin()` (guard trigger limits fields) | none (auth.users cascade) |
| organizations | on | active member **or** platform super | service role | service role | none |
| organization_members | on | own rows **or** `is_org_admin()` | service role (P3 action) | service role | service role |
| roles | on | `authenticated` (read-only) | service role | service role | service role |
| permissions | on | `authenticated` (read-only) | service role | service role | service role |
| role_permissions | on | `authenticated` (read-only) | service role | service role | service role |
| platform_admins | on | `is_platform_super_admin()` | service role | service role | service role |
| audit_log | on | `has_permission('audit.read')` **or** platform super | **none** (only `log_event()` / service role) | **none** | **none** |
| rate_limit | on | **none** | **none** | **none** | **none** (function/service role only) |
| outbox | on | **none** | **none** | **none** | **none** (function/service role only) |
| email_log | on | **none** | **none** | **none** | **none** (service role only) |

- **Who can access what:** a user sees only their own profile + membership; org-admins see all
  profiles/members of their org; auditors can read `audit_log`; nobody but the service role
  touches `rate_limit`/`outbox`/`email_log`.
- **platform_super_admin:** never via a blanket bypass — RLS policies that legitimately need
  cross-org access add `or is_platform_super_admin()` explicitly, and those paths always call
  `log_event(... source='platform', severity>='warning')`.
- **Organization boundaries:** every membership-scoped policy filters on
  `organization_id = current_org()`; a user in org A cannot resolve org B rows because
  `current_org()` returns only their org and `has_permission()` checks membership in that org.
- **Disabled users:** `has_permission()` and the `is_*` helpers all require
  `profiles.status='active'` (and membership `status='active'`), so a disabled user fails every
  permission check at the DB layer; the server `requireAuth()` (P1) also rejects them live, and
  a Supabase ban (P1) stops token refresh.
- **Append-only audit:** `audit_log` has select-only policies and **no** insert/update/delete
  policy, so even an authenticated user cannot mutate it; `log_event()` (definer) is the sole
  writer.
- **Privilege guard:** `profiles_guard` reverts `status`/`email`/`created_by`/`created_at`/`id`
  for non-admins, so escalation is impossible even with a crafted update that passes the RLS
  `using` clause.

---

## 6. Seed data

Seeded inside migrations (idempotent: `insert … on conflict (key) do nothing`), **except the
owner bootstrap**, which is a documented post-apply one-off (no auth user exists at migration
time).

- **Organization (0007):** one row — `slug='amai'`, `name='amai'`, `status='active'`.
- **Roles (0008):** `organization_admin`, `organization_user`, `external_client`,
  `external_partner`, `auditor` (all `is_system=true`). *(`platform_super_admin` is the
  `platform_admins` table, not a role.)*
- **Permissions (0008) — full catalog (seeded now, most unused until later modules):**
  `users.read`, `users.create`, `users.update`, `users.disable`, `users.change_role`,
  `audit.read`, `audit.read_technical`, `org.manage`, `roles.manage`,
  `projects.read/create/update/delete`, `finance.read/create_invoice/send_invoice`,
  `documents.read/upload/send`, `nda.create/send/revoke/view_audit`, `products.read/update`.
- **Role → permission mapping (0008):**
  - `organization_admin` → `users.*`, `audit.read`, `audit.read_technical`, `org.manage`,
    `roles.manage` (and every future module permission, granted as those rows exist).
  - `organization_user` → **none** (a normal user reads/edits only their own profile via RLS;
    no management permissions).
  - `auditor` → `audit.read`, `audit.read_technical`.
  - `external_client`, `external_partner` → **none** in v1 (company-scoped later).
- **Owner bootstrap (post-apply, manual, documented):** after the owner's auth user exists,
  run once:
  ```sql
  -- 1) make the owner a platform super-admin
  insert into public.platform_admins (user_id, reason)
  select id, 'founder/bootstrap' from auth.users where lower(email)=lower('you@amai.ch')
  on conflict (user_id) do nothing;
  -- 2) add an active organization_admin membership in the 'amai' org
  insert into public.organization_members (organization_id, user_id, role_id, member_type, status)
  select o.id, u.id, r.id, 'internal', 'active'
  from public.organizations o, auth.users u, public.roles r
  where o.slug='amai' and lower(u.email)=lower('you@amai.ch') and r.key='organization_admin'
  on conflict (organization_id, user_id) do update set role_id=excluded.role_id, status='active';
  -- 3) activate the profile
  update public.profiles set status='active' where lower(email)=lower('you@amai.ch');
  ```

---

## 7. TypeScript foundation files

All are **server-only** unless noted. None import the service-role key into client code.

| file | purpose | exports | safety |
|---|---|---|---|
| `src/lib/supabase/admin.ts` | service-role + auth-admin client | `createAdminClient()` (exists in `server.ts` today → moved/duplicated here), `authAdmin()` helpers | **server only**; never imported by a client component; reads `SUPABASE_SERVICE_ROLE_KEY` |
| `src/lib/security/authorize.ts` | typed wrappers over the SQL authz fns | `hasPermission(key)`, `isOrgAdmin()`, `isPlatformSuperAdmin()`, `currentOrg()` | server only; call via the cookie (authenticated) client so `auth.uid()` resolves |
| `src/lib/security/rbac.ts` (**revise existing**) | route/action guards | `requireAuth()`, `requirePermission(key)`, `requireOrgAdmin()`, `getCurrentProfile()`, `getUserPermissions()`, `can(action, entity?)`, `LOGIN_PATH`, `DASHBOARD_PATH` | server only; **remove** the old `requireAdmin`/`isAdmin` (role-on-profile); redirects unauth → `/app/login` |
| `src/lib/security/ratelimit.ts` | app-level limiter | `checkRateLimit(bucket, identifier, limit, windowSeconds)` → `{ allowed }` (calls `hit_rate_limit`) | server only |
| `src/lib/audit/log.ts` | audit writer | `logEvent(input)` (calls `log_event` RPC) + the `AuditInput` type | server only; never trust client-supplied actor |
| `src/lib/outbox/enqueue.ts` | enqueue an email job | `enqueueEmail(input)` (insert into `outbox`, dedupe-aware) + `OutboxEmailPayload` type | server only |
| `src/lib/outbox/worker.ts` | process the queue | `processPending(limit?)` (calls `claim_outbox`, sends via Resend, `complete_outbox`) | server only; uses the **admin** client |
| `src/lib/status/types.ts` | state-machine types | `StatusMachine`, `Transition`, `StatusToken` types + `applyTransition()` signature (no domain machines yet) | client-safe (types only) |
| `src/lib/status/colors.ts` | semantic status colors | `STATUS_COLORS` map (draft/sent/waiting/opened/done/cancelled/revoked/failed/system/warning/critical) + `statusColor(token)` | client-safe |
| `src/lib/types/database.ts` (**revise existing**) | typed schema | add `organizations`, `organization_members`, `roles`, `permissions`, `role_permissions`, `platform_admins`, `rate_limit`, `outbox`, `email_log`; **change** `profiles` (drop `role`), **replace** `audit_log` with the rich shape; drop the `Role`/`AuditAction` narrow enums in favour of new types | regenerate from the DB after apply, then hand-verify standalone exports still present |

Dependencies: `@supabase/ssr`, `@supabase/supabase-js`, `zod` (already in the project), Resend
SDK (already used for lead emails). No new runtime deps expected.

---

## 8. Outbox v1 technical design (minimal reliable)

- **`enqueueEmail(input)`** writes one `outbox` row: `channel='email'`, `status='pending'`,
  `payload`, optional `dedupe_key`, `organization_id`. Returns the row id. If `dedupe_key`
  collides (unique), it is a no-op (returns the existing row) — safe to call twice.
- **Payload shape** (`OutboxEmailPayload`, stored in `payload jsonb`):
  ```
  { to: string, template: 'invite' | 'password_reset', subject: string,
    vars: { firstName?: string, actionUrl: string, ... }, from?: string,
    replyTo?: string }
  ```
  The actual HTML is rendered by the worker from `template` + `vars` (branded templates in
  `lib/email/templates`), so payloads stay small and no secrets are stored.
- **dedupe_key strategy:** `"{template}:{to}:{purpose-token}"`, e.g.
  `password_reset:user@x.com:{reset_token_jti}` or `invite:user@x.com:{membership_id}`. Prevents
  duplicate sends on retried server actions.
- **Status transitions:** `pending → processing` (claim) → `sent` (success) **or**
  `retrying → processing → …` (transient failure) → `failed` (after `max_attempts`).
  `cancelled` is a manual/admin terminal state (no UI in P0; value reserved).
- **Retry:** exponential backoff `least(2^attempts, 60)` minutes, capped ~1h, until
  `max_attempts` (default 5). `claim_outbox` uses `for update skip locked` so multiple worker
  runs never double-send.
- **email_log link:** `complete_outbox` writes an `email_log` row referencing `outbox_id` with
  the final `status` (`sent`/`failed`), `provider_message_id`, and sanitised `error` — the
  durable record of what actually went out.
- **Explicitly deferred (NOT in P0/v1):** Resend delivery **webhook**, **open** tracking,
  **click** tracking, notification center, delivery dashboard. `email_log.status` therefore
  has only `sent`/`failed` in v1 (no `delivered`/`bounced`).

---

## 9. Audit technical design

- **`logEvent()`** (TS) calls the **`log_event()`** RPC with the cookie (authenticated) client
  for user actions, or the admin client for system jobs. The RPC derives `actor_*` from
  `auth.uid()` server-side, so the application layer **cannot spoof** who did what; the caller
  only provides the event's business fields + request context (ip/ua/request_id).
- **Raw vs display:** `audit_log` is the **raw evidence** layer — complete and immutable. The
  future `HistoryTimeline` (P3) will **not** render raw rows; it calls a query that maps each
  row through `lib/audit/display.ts` (keyed by `action`+`entity_type`) into a safe human
  sentence, and **omits** technical columns unless the viewer has `audit.read_technical`.
- **Append-only:** no update/delete RLS policies and no direct insert path (only the definer
  function). Corrections/retention are **new** events (e.g. `audit.redacted`), never mutations
  — this preserves evidentiary integrity.
- **Technical-field protection:** `ip_address`, `user_agent`, `old_values`, `new_values`,
  `metadata`, provider responses are returned only to `audit.read_technical` holders; the P3
  read query strips them for everyone else.
- **platform_super_admin logging:** any action taken through a platform-super-admin path is
  written with `source='platform'` and `severity>='warning'`, and `actor_role` =
  `platform_super_admin`, so cross-org access is always visible in the trail.
- **P0 scope:** the table + `log_event()` + the TS `logEvent()` writer + the display-template
  **shape** (an empty/initial map). The actual templates and the timeline UI are P3.

---

## 10. Rate-limiting technical design

- **Table:** `rate_limit(bucket, identifier, window_start, hits)`, PK
  `(bucket, identifier, window_start)`.
- **Window logic:** fixed window of `window_seconds`; `window_start` =
  `floor(epoch / window_seconds) * window_seconds`. `hit_rate_limit` upserts and returns
  whether `hits <= limit`. (True sliding-log limiting is a later refinement; fixed-window is
  reliable and cheap for v1.)
- **Buckets (defined now, enforced in P1/P4):** `login`, `password_reset`, `invite_resend`,
  `outbox_send` (worker self-throttle), `public_link` (reserved). P0 ships the table + function
  + the TS `checkRateLimit` wrapper; the **call sites** land with the flows in P1/P4.
- **Identifiers:** never raw PII in the key — use a salted hash of IP for ip-based buckets, the
  lowercased email for email-based buckets, or the user id for account-based buckets. Format
  `"{kind}:{value-or-hash}"`.
- **No account enumeration:** rate-limit responses are uniform; the `password_reset` flow
  always returns the same generic message whether or not the address exists, and the limiter
  never reveals counts to the client.
- **P0 vs later:** P0 = table + `hit_rate_limit()` + `checkRateLimit()` only. Wiring into
  login/reset/invite + Cloudflare Turnstile is P1/P4 (folds in task #18).

---

## 11. Security checks (must hold in P0)

- **Service-role key is server-only** — referenced solely in `lib/supabase/admin.ts` and the
  worker; a CI/bundle scan (P4, but principle enforced now) asserts the key name never appears
  in client output. Never `NEXT_PUBLIC_*`.
- **RLS is the boundary** — every new table has RLS on; nothing relies on the UI for access
  control.
- **Server-side permission checks** — `requirePermission()` / `has_permission()` guard
  sensitive operations; live DB reads, not cached claims.
- **No hardcoded role checks** anywhere except the **seed** and the **owner bootstrap**. All
  runtime checks go through `has_permission()` / `is_org_admin()` / `is_platform_super_admin()`.
- **platform_super_admin safety** — stored in its own table, never a blanket RLS bypass, every
  use audited (`source='platform'`).
- **Disabled-user strategy prepared** — `profiles.status` + membership `status` are checked by
  every authz function; the live `requireAuth` check and Supabase ban land in P1.
- **Org-boundary enforcement** — `current_org()` + membership-scoped policies; verified by the
  org-boundary tests (§12).
- **Additive migration discipline** — `0006` revised pre-apply only; thereafter additive; the
  six existing business tables are never modified.

---

## 12. Test specification for P0

Run on a **throwaway** Postgres/Supabase (local `supabase start` or a scratch project), never
the amai or SEMANU databases.

**Function tests**
- `current_org()` returns the seeded org for a member; `null` for a non-member / unauthenticated.
- `is_platform_super_admin()` true only for `platform_admins` rows + active profile.
- `has_permission('users.create')` true for org_admin, false for org_user, true for platform
  super; false when the profile is `disabled`.
- `is_org_admin()` mirrors `has_permission('org.manage')`.

**RLS tests (as a low-privilege `authenticated` role with a set `auth.uid()`)**
- profiles: a user selects only their own row; an org_admin selects all in the org; update of
  own `first_name` succeeds; update of own `status`/`email` is **reverted** by the guard.
- organization_members: a user sees only own membership; cannot insert/update.
- roles/permissions/role_permissions: readable; not writable.
- platform_admins: readable only by a platform super-admin.
- audit_log: readable with `audit.read`; **insert/update/delete all rejected** for
  authenticated (append-only); `log_event()` insert succeeds.
- rate_limit / outbox / email_log: **no** authenticated select/insert/update/delete.

**Permission & escalation**
- org_user cannot read another profile, cannot read `/users`-scope data, cannot read
  `audit_log`, cannot self-assign a role, cannot self-activate.
- platform-super-admin cross-org read works **and** writes a `source='platform'` audit row.

**Org boundary**
- Two orgs, two users: user A cannot see org B's profiles/members; `current_org()` returns only
  A's org.

**Audit append-only**
- direct `update`/`delete` on `audit_log` raise (RLS); a redaction is a **new** row.
- `log_event()` stamps `actor_*` from `auth.uid()` and ignores any client-supplied actor.

**Rate limit**
- `hit_rate_limit('login','ip:hash',5,60)` returns true for hits 1–5, false on 6; a new window
  resets the counter.

**Outbox claim/complete**
- `enqueueEmail` writes `pending`; duplicate `dedupe_key` is a no-op.
- `claim_outbox(10,'w1')` flips due rows to `processing` and is concurrency-safe (a second
  concurrent claim returns disjoint rows via `skip locked`).
- `complete_outbox(id,true,'rs_x',null)` → `sent` + an `email_log(status='sent')` row.
- `complete_outbox(id,false,null,'smtp error')` → `retrying` with a future `next_retry_at`,
  then `failed` once `attempts >= max_attempts`.

**Bundle safety**
- a grep of the built client output for the service-role key name returns nothing (principle
  check now; automated in P4).

**Type gate**
- `npx tsc --noEmit` clean after the `database.ts` revision.

---

## 13. Manual configuration required (P0 only)

**Supabase (the amai project — NOT a SEMANU project; it is not in the connected MCP account, so
you apply these yourself):**
- Apply `0006`–`0012` **in order** (SQL editor or `supabase db push`).
- Create your owner auth user (Auth → Users → Add user, email + password) **then** run the
  owner-bootstrap SQL from §6.
- Confirm the `avatars` bucket is **private**.
- Copy the **Project URL**, **anon key**, **service-role key** into the env (below).
- Regenerate `src/lib/types/database.ts` (`supabase gen types …`) and re-add the standalone
  type aliases the app imports.
- Run **Advisors** (security + performance) and clear any RLS findings.

**Vercel:** for P0 there is **no UI/route to deploy**, so no runtime change is required. Just
ensure the env vars exist (locally in `.env.local`, and in Vercel for later phases):
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`. (Cron + `CRON_SECRET` + `PORTAL_ENABLED` come in P1.)

**Resend:** verified domain `amai.ch` (already done) and `RESEND_API_KEY` present so the worker
lib compiles/tests. No webhook, no templates required for P0 (templates land in P1).

**Cloudflare:** **nothing for P0.** Rate-limit rules + Turnstile are wired in P1/P4.

---

## 14. Risks, assumptions, open questions, recommended decisions

**Risks**
- The amai Supabase is not in the connected MCP account → I cannot apply or auto-test against
  it; you run migrations manually and we test on a throwaway DB.
- Revising `0006` in place is safe **only** because it is unapplied; if it has been applied
  anywhere, switch to an additive corrective migration instead.
- `log_event()` adds one row + a small lookup per audited action → acceptable at our volume.

**Assumptions**
- A user belongs to exactly one organization in v1 (`current_org()` returns it directly).
- `audit_log.id` is `bigint` identity (matches the SEMANU precedent); `entity_id` is `text` to
  stay polymorphic.
- Admin profile mutations (status/disable) run with the **authenticated admin** client (so
  `is_org_admin()` holds), not the service role; user creation uses the service-role admin API.

**Open questions**
- `organization_user` default permissions: recommended **none** (own data via RLS). Confirm.
- Worker runner: **Vercel Cron** → `/api/cron/outbox` (recommended) vs Supabase pg_cron. The
  route is P1; the `processPending()` function is testable now without it.
- Owner email for the bootstrap SQL (which address becomes `platform_super_admin`).

**Recommended decisions before building**
1. Confirm `bigint` audit id + `text` entity_id. *(Recommended: yes.)*
2. Confirm the permission catalog + the role→permission mapping in §6. *(Recommended: as
   written.)*
3. Confirm `organization_user` gets no explicit permissions. *(Recommended: yes.)*
4. Provide the **owner email** for the bootstrap.
5. Confirm `0006` is unapplied everywhere (so in-place revision is allowed).

---

## 15. Implementation-readiness checklist (must be true before approving the P0 build)

- [ ] You confirm `0006` has **not** been applied on any environment (so it may be revised in
      place); otherwise we switch to additive-only from `0007`.
- [ ] The target **amai Supabase project ref** is identified (and, ideally, connected — or you
      will apply migrations manually).
- [ ] The **owner email** for the platform-super-admin bootstrap is provided.
- [ ] The **permission catalog** (§6) and **role→permission mapping** are approved.
- [ ] `organization_user` default-permission decision is confirmed (recommended: none).
- [ ] `audit_log.id = bigint`, `entity_id = text` confirmed.
- [ ] Env vars available locally (`SUPABASE_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`).
- [ ] Agreement that P0 ships **no UI** and that the live site + the six existing business
      tables stay untouched.
- [ ] A throwaway database is available for the §12 test run.

**On all boxes checked, P0 build = migrations `0006`–`0012` + the server-only lib spine, type-
safe (`tsc` clean) and verified against the §12 checklist. No UI.**
