-- ============================================================
-- amai.ch · 0012 · portal: lock service-role-only functions (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_lock_service_role_functions`.
-- Supabase grants EXECUTE to anon/authenticated by default; this removes it for
-- the trusted-server-only functions (C2). Grants/revokes only — drops nothing.
-- ============================================================
revoke execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) from anon, authenticated;
revoke execute on function public.claim_outbox(int,text) from anon, authenticated;
revoke execute on function public.complete_outbox(uuid,boolean,text,text) from anon, authenticated;
grant execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) to service_role;
grant execute on function public.claim_outbox(int,text) to service_role;
grant execute on function public.complete_outbox(uuid,boolean,text,text) to service_role;

-- ROLLBACK: re-grant execute to authenticated if ever needed (not recommended):
--   grant execute on function public.log_event(...) to authenticated; (etc.)
