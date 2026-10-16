-- 0018_function_grants_hardening.sql
-- P4 advisor follow-up (security). Lock down SECURITY DEFINER functions that were
-- needlessly RPC-callable by anon/authenticated, and pin search_path on two of them.
--
-- IMPORTANT: the RBAC predicates (is_admin, has_role, has_permission, is_org_admin,
-- is_platform_super_admin, get_user_permissions, current_org, my_roles, is_staff,
-- is_blocked) are intentionally LEFT executable by `authenticated` — RLS policies call
-- them, so revoking would break row-level security. anon gets harmless false/empty.
-- This migration only touches functions that are NOT used in RLS USING clauses and are
-- NOT RPC-called by the app: trigger functions, the privileged grant_role, and the
-- service-role-only hit_rate_limit.
--
-- ROLLBACK: grant execute on each function below back to anon, authenticated.

-- Pin search_path (advisor: function_search_path_mutable).
alter function public.touch_updated_at() set search_path = public;
alter function public.profiles_block_privileged_self_update() set search_path = public;

-- Trigger functions — invoked by triggers, never meant as RPC.
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.profiles_sync_active() from anon, authenticated;
revoke execute on function public.touch_updated_at() from anon, authenticated;
revoke execute on function public.profiles_block_privileged_self_update() from anon, authenticated;
revoke execute on function public.link_customer_to_user() from anon, authenticated;
revoke execute on function public.link_user_to_customer() from anon, authenticated;

-- Privileged / service-role-only helpers.
revoke execute on function public.grant_role(text, text) from anon, authenticated;
revoke execute on function public.hit_rate_limit(text, text, integer, integer) from anon, authenticated;
