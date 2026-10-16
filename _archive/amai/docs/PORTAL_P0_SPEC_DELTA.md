# P0 Spec — Corrections Delta (approved, pre-build)

> Refines `PORTAL_P0_SPEC.md`. The master architecture (`PORTAL_PLAN.md`, Part B) is unchanged.
> **Nothing is built yet.** Each item replaces the corresponding section of the P0 spec.
> Migration files will be (re)generated from these corrected sections at build time; the only
> file written so far (`0006_profiles.sql`) already matches and is unaffected by C1–C8.

---

## C1 — `current_org()` is a v1-only assumption

`current_org()` may return the single active membership for v1, but this is **explicitly
temporary**.

```sql
-- V1 ASSUMPTION ONLY: a user has exactly one active organization.
-- Before multi-org support is enabled this MUST be replaced by an explicit
-- "active organization" context — a server-side selected + verified org id,
-- a secure session value, or a JWT claim used ONLY as context and re-validated
-- against organization_members. `limit 1` is NOT the multi-org implementation.
create or replace function public.current_org()
returns uuid language sql stable security definer set search_path = '' as $$
  select organization_id from public.organization_members
  where user_id = (select auth.uid()) and status = 'active'
  limit 1   -- v1 only; see note above
$$;
```

A tracked TODO (`docs` + code comment) records the required change before any second org is
created.

---

## C2 — `log_event()` abuse protection (server-only writer)

The raw event writer is **not** client-callable.

- **`EXECUTE` on `log_event()` is granted to `service_role` only** (revoked from
  `public`/`anon`/`authenticated`). A browser/`authenticated` session **cannot** call it via
  `rpc()`.
- The **only** caller is the server-side wrapper `logEvent()` (`src/lib/audit/log.ts`), which
  runs with the **admin (service-role)** client and passes a **server-verified** `actor_id`
  (the session user resolved via `getUser()` in the same request) and `actor_type`.
- `log_event()` **validates** inputs: `action` non-empty; `source`/`severity` within the
  allowed sets (also enforced by `CHECK`); privileged sources (`platform`, `system_job`,
  `webhook`, `api`) and `severity='critical'` can only originate from server code (guaranteed
  by service-role-only execution). Invalid combinations raise.
- Ordinary users cause audit rows **only indirectly**, through approved server actions.

```sql
create or replace function public.log_event(
  p_action text,
  p_actor_id uuid default null,            -- trusted, supplied by server (session user) or null=system
  p_actor_type text default 'internal_user',
  p_entity_type text default null, p_entity_id text default null,
  p_entity_display_name text default null,
  p_old_status text default null, p_new_status text default null,
  p_old_values jsonb default null, p_new_values jsonb default null, p_metadata jsonb default null,
  p_organization_id uuid default null,
  p_severity text default 'info', p_source text default 'portal',
  p_ip inet default null, p_user_agent text default null,
  p_request_id text default null, p_session_id text default null
) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v_email text; v_name text; v_role text; v_id bigint;
begin
  if coalesce(p_action,'') = '' then raise exception 'log_event: action required'; end if;
  if p_source   not in ('portal','public_link','email_link','api','system_job','webhook','platform')
     then raise exception 'log_event: bad source %', p_source; end if;
  if p_severity not in ('info','warning','critical')
     then raise exception 'log_event: bad severity %', p_severity; end if;

  if p_actor_id is not null then
    select email, nullif(trim(coalesce(first_name,'')||' '||coalesce(last_name,'')),'')
      into v_email, v_name from public.profiles where id = p_actor_id;
    select case when exists (select 1 from public.platform_admins where user_id = p_actor_id)
                then 'platform_super_admin'
                else (select r.key from public.organization_members om
                        join public.roles r on r.id = om.role_id
                       where om.user_id = p_actor_id
                         and om.organization_id = coalesce(p_organization_id, public.current_org())
                       limit 1) end
      into v_role;
  end if;

  insert into public.audit_log (
    organization_id, actor_id, actor_email, actor_name, actor_role, actor_type,
    action, entity_type, entity_id, entity_display_name,
    old_status, new_status, old_values, new_values, metadata,
    ip_address, user_agent, request_id, session_id, source, severity)
  values (
    p_organization_id, p_actor_id, v_email, v_name, v_role, p_actor_type,
    p_action, p_entity_type, p_entity_id, p_entity_display_name,
    p_old_status, p_new_status, p_old_values, p_new_values, p_metadata,
    p_ip, p_user_agent, p_request_id, p_session_id, p_source, p_severity)
  returning id into v_id;
  return v_id;
end; $$;

revoke execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) from public;
grant  execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) to service_role;
```

---

## C3 — `roles` / `permissions` / `role_permissions` are admin-only readable

Normal users never read the permission catalog.

- RLS `select` on `roles`, `permissions`, `role_permissions` =
  `using (public.is_org_admin() or public.is_platform_super_admin())` (replaces `using (true)`).
- Normal users get **only their resolved permission keys** through a definer helper:

```sql
create or replace function public.get_user_permissions()
returns setof text language sql stable security definer set search_path = '' as $$
  select perm.key
  from public.organization_members om
  join public.role_permissions rp on rp.role_id = om.role_id
  join public.permissions perm    on perm.id = rp.permission_id
  where om.user_id = (select auth.uid())
    and om.organization_id = public.current_org()
    and om.status = 'active'
  union
  select key from public.permissions where public.is_platform_super_admin();  -- super-admin = all
$$;
grant execute on function public.get_user_permissions() to authenticated, service_role;
```

TS `getUserPermissions()` wraps this RPC; the catalog tables are never read by normal users.

---

## C4 — `organization_members.role_id` FK ordering (explicit)

Chosen approach (no ordering failure possible):

- **`0007`** creates `organization_members.role_id uuid NOT NULL` **without** a foreign key.
- **`0008`** (after `roles` exists) runs:
  ```sql
  alter table public.organization_members
    add constraint organization_members_role_id_fkey
    foreign key (role_id) references public.roles (id);
  ```

`0007` therefore never references `roles`; the FK is added once `roles` exists. (Already
reflected in the draft migrations.)

---

## C5 — Owner bootstrap fails loudly

Run **after** the owner's auth user exists. Replace `OWNER_EMAIL`.

```sql
do $$
declare v_uid uuid; v_org uuid; v_role uuid; v_count int;
begin
  select count(*) into v_count from auth.users where lower(email) = lower('OWNER_EMAIL');
  if v_count = 0 then raise exception 'Owner bootstrap: no auth user matches %', 'OWNER_EMAIL'; end if;
  if v_count > 1 then raise exception 'Owner bootstrap: % auth users match %', v_count, 'OWNER_EMAIL'; end if;

  select id into v_uid  from auth.users         where lower(email) = lower('OWNER_EMAIL');
  select id into v_org  from public.organizations where slug = 'amai';
  select id into v_role from public.roles         where key  = 'organization_admin';
  if v_org  is null then raise exception 'Owner bootstrap: org amai missing (run 0007)'; end if;
  if v_role is null then raise exception 'Owner bootstrap: role organization_admin missing (run 0008)'; end if;

  insert into public.platform_admins (user_id, reason)
    values (v_uid, 'founder/bootstrap') on conflict (user_id) do nothing;
  insert into public.organization_members (organization_id, user_id, role_id, member_type, status)
    values (v_org, v_uid, v_role, 'internal', 'active')
    on conflict (organization_id, user_id) do update set role_id = excluded.role_id, status = 'active';
  update public.profiles set status = 'active' where id = v_uid;
end $$;
```

No silent no-op: wrong/missing/duplicate email raises.

---

## C6 — `outbox.dedupe_key` is required, unique, non-null

```sql
dedupe_key text not null unique
```

- `enqueueEmail()` **always** computes or receives a `dedupe_key` (e.g.
  `"{template}:{lower(to)}:{purpose_token}"`, where `purpose_token` is the reset-token jti or
  the membership/invite id).
- On `dedupe_key` conflict the insert is a **no-op** and `enqueueEmail()` returns the existing
  row id (`on conflict (dedupe_key) do nothing` + select), so retried server actions never
  double-send. No nullable dedupe keys in v1.

---

## C7 — `rate_limit.identifier` is hashed, never raw PII

`identifier` only ever holds:

- `ip_hash:<hash>` — salted SHA-256 of the client IP,
- `email_hash:<hash>` — salted SHA-256 of `lower(email)`,
- `user:<uuid>` — the auth user id.

Hashing happens **server-side** in `src/lib/security/ratelimit.ts` using a secret pepper
`RATE_LIMIT_SALT` (env, server-only). **Raw or lowercased e-mail addresses are never stored**
in `rate_limit`. The DB function `hit_rate_limit()` receives the already-built identifier and
stays unchanged.

---

## C8 — Audit technical fields are protected; safe history via RPC

- **Raw `audit_log` `SELECT`** is restricted to **`audit.read_technical` or
  `platform_super_admin`** (replaces the `audit.read` select policy):
  ```sql
  create policy audit_select_technical on public.audit_log
    for select to authenticated
    using (public.has_permission('audit.read_technical') or public.is_platform_super_admin());
  ```
- Normal audit history (and `HistoryTimeline`) goes through a **display-safe RPC** that returns
  **no** technical columns (`ip_address`, `user_agent`, `metadata`, `old_values`, `new_values`,
  `request_id`, `session_id` are omitted) and checks `audit.read` internally:
  ```sql
  create or replace function public.audit_history(
    p_entity_type text, p_entity_id text, p_limit int default 50, p_offset int default 0)
  returns table (id bigint, created_at timestamptz, actor_name text, actor_role text,
                 actor_type text, action text, entity_type text, entity_id text,
                 entity_display_name text, old_status text, new_status text,
                 source text, severity text)
  language sql stable security definer set search_path = '' as $$
    select id, created_at, actor_name, actor_role, actor_type, action, entity_type,
           entity_id, entity_display_name, old_status, new_status, source, severity
    from public.audit_log
    where (public.has_permission('audit.read') or public.is_platform_super_admin())
      and entity_type = p_entity_type and entity_id = p_entity_id
    order by created_at desc
    limit greatest(p_limit,0) offset greatest(p_offset,0)
  $$;
  grant execute on function public.audit_history(text,text,int,int) to authenticated, service_role;
  ```
- **TypeScript audit query plan:** `getHistory(entityType, entityId)` calls `audit_history`
  (display-safe) by default. A separate `getHistoryTechnical(...)` reads the raw table and is
  only used when the server has confirmed `has_permission('audit.read_technical')`. The P3
  `HistoryTimeline` uses the safe path by default and reveals technical metadata only to
  `audit.read_technical` holders.

*(Note: `audit.read` no longer grants raw-table access; it grants the display-safe RPC.
`audit.read_technical` grants both.)*

---

## C9 — No UI, no business-table changes (reconfirmed) + one clarification

P0 remains: **no UI, no auth pages, no user-management screens, no CRM/ERP modules.**

**Real business data is never touched:** `leads`, `customers`, `orders`, `subscriptions`
are not modified in any way.

**Clarification (please confirm):** your generic list in C9 also names `documents`/`requests`,
but those are the **empty, dead leftovers** (0 rows) of the removed customer portal, and you
explicitly chose **"direct droppen"** earlier. So `0006` still drops the dead
`documents`/`requests`/old-`profiles`/old-`roles`. If instead you now want them **left in
place untouched**, say so and I will remove the drops from `0006` and simply create the new
tables alongside — but then the old `profiles`/`roles` name clash must be resolved another way
(rename). Default, per your earlier decision: **drop the dead leftovers.**

---

## Updated “ready for P0 build” checklist

- [ ] **amai Supabase connected** to me (so I can introspect + apply with advisors).
- [ ] **Introspection confirms** before any drop: no *kept* table has an FK into old
      `roles`/`profiles`; the only user triggers on `auth.users` are the dead portal ones;
      `documents`/`requests` are empty.
- [ ] **C9 cleanup confirmed:** drop the dead `documents`/`requests`/old-`profiles`/old-`roles`
      (your "direct droppen"), real tables untouched.
- [ ] **Owner email** for the bootstrap provided (used in C5; must match exactly one auth user).
- [ ] **`RATE_LIMIT_SALT`** pepper decided + added to env (C7).
- [ ] **Corrections C1–C8 accepted** as written (or amendments noted).
- [ ] Env present: `SUPABASE_*`, `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL` (+ `CRON_SECRET`,
      `PORTAL_ENABLED` for later phases).
- [ ] Agreement: **no UI** in P0; **no changes** to `leads`/`customers`/`orders`/`subscriptions`.
- [ ] A **throwaway DB** (or a Supabase branch) is available to run the §12 test checklist
      before touching production.

**When these are checked, P0 build = the corrected migrations `0006`–`0012` + the server-only
lib spine (`authorize`, `rbac` incl. `getUserPermissions`, `audit` incl. safe `audit_history`,
`ratelimit` with hashing, `outbox`), type-safe and test-verified. No UI.**
