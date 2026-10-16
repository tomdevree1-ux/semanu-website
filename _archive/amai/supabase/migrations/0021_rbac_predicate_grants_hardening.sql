-- 0021_rbac_predicate_grants_hardening.sql
-- Post-P4 cleanup. The RBAC predicate functions were EXECUTE-able by PUBLIC/anon
-- (advisor 0028). They return false/empty for anon (no session) so it is not an
-- escalation, but anon should not be able to probe them via PostgREST RPC.
--
-- These functions ARE required by RLS policies (current_org, has_permission,
-- is_admin, is_platform_super_admin, is_staff) and by the app's authenticated SSR
-- client (has_permission, is_org_admin, is_platform_super_admin, get_user_permissions,
-- current_org). So we GRANT authenticated + service_role explicitly FIRST, then
-- revoke PUBLIC + anon — RLS never loses access. No function bodies, RLS policies,
-- permissions, or app logic change.
--
-- ROLLBACK: grant execute on each function below to public.

do $$
declare
  f text;
  sigs text[] := array[
    'public.is_admin()',
    'public.is_staff()',
    'public.has_role(text)',
    'public.my_roles()',
    'public.has_permission(text)',
    'public.is_org_admin()',
    'public.is_platform_super_admin()',
    'public.get_user_permissions()',
    'public.current_org()',
    'public.is_blocked(text, text)'
  ];
begin
  foreach f in array sigs loop
    execute format('grant execute on function %s to authenticated, service_role', f);
    execute format('revoke execute on function %s from public, anon', f);
  end loop;
end $$;
