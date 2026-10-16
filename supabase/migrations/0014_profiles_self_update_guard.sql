-- 0014_profiles_self_update_guard.sql
-- P2 hardening (defense in depth). Prevent a normal (non-admin / non-platform-
-- super-admin) end user from changing account-control fields on their OWN
-- profiles row via a direct, self-authenticated UPDATE. The portal action
-- already restricts the columns it writes; this trigger enforces the same rule
-- at the database so a hand-crafted PostgREST call cannot bypass it.
--
-- Additive + safe: adds one function + one BEFORE UPDATE trigger. No data is
-- moved or changed. No business tables are touched.
--
-- Self-service fields (always allowed): first_name, last_name, full_name,
--   avatar_url, updated_at.
-- Protected fields (blocked for normal users): id, email, status, is_active,
--   created_by.
--
-- Trusted callers are never blocked:
--   * service role / SECURITY DEFINER contexts  -> auth.uid() IS NULL
--   * admins (is_admin()) and platform super-admins (is_platform_super_admin())
--
-- Runs before profiles_sync_active / profiles_touch (alphabetical trigger order),
-- so it evaluates the raw client-submitted row.
--
-- ROLLBACK:
--   DROP TRIGGER IF EXISTS profiles_block_privileged_self_update ON public.profiles;
--   DROP FUNCTION IF EXISTS public.profiles_block_privileged_self_update();

create or replace function public.profiles_block_privileged_self_update()
returns trigger
language plpgsql
as $$
begin
  -- Trusted backend (no end-user JWT) and privileged users may change anything.
  if auth.uid() is null
     or public.is_admin()
     or public.is_platform_super_admin() then
    return new;
  end if;

  -- Normal end user: account-control fields are immutable from the client.
  if (new.id         is distinct from old.id)
     or (new.email      is distinct from old.email)
     or (new.status     is distinct from old.status)
     or (new.is_active  is distinct from old.is_active)
     or (new.created_by is distinct from old.created_by) then
    raise exception 'profiles: account-control fields cannot be modified'
      using errcode = '42501';  -- insufficient_privilege
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_block_privileged_self_update on public.profiles;
create trigger profiles_block_privileged_self_update
  before update on public.profiles
  for each row
  execute function public.profiles_block_privileged_self_update();
