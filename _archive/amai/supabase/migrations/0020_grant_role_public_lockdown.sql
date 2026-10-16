-- 0020_grant_role_public_lockdown.sql
-- CORRECTIVE (P4 review). 0019 revoked anon/authenticated EXECUTE on these
-- functions but the PUBLIC pseudo-role grant remained, so they were still
-- callable by everyone via PostgREST RPC. Most critically, grant_role() is a
-- SECURITY DEFINER function with NO internal authorization check (it inserts
-- into user_roles for any email/role), so a PUBLIC grant is a privilege-
-- escalation hole. Revoke PUBLIC EXECUTE; service_role retains it for internal
-- bootstrap use. The app never calls grant_role via RPC (verified). Trigger
-- functions fire regardless of EXECUTE grants.
--
-- ROLLBACK: grant execute on each function below to public.

revoke execute on function public.grant_role(text, text) from public;
revoke execute on function public.handle_new_user() from public;
revoke execute on function public.profiles_sync_active() from public;
revoke execute on function public.touch_updated_at() from public;
revoke execute on function public.profiles_block_privileged_self_update() from public;
revoke execute on function public.link_customer_to_user() from public;
revoke execute on function public.link_user_to_customer() from public;
