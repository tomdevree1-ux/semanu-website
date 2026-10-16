-- 0017_security_hardening.sql
-- P4 security hardening (advisor fixes + the GDPR audit-scrub helper). Additive/safe.
--
-- (a) Restrict audit_history() EXECUTE to authenticated + service_role only
--     (it was also granted to anon/PUBLIC — flagged in the P3 review).
-- (b) anonymize_audit_actor(): a service-role-only SECURITY DEFINER scrub of the
--     denormalised actor PII in audit_logs, used by the super-admin anonymize
--     action (P4-D2). It nulls actor_email and sets actor_name='Anonymized user'
--     while keeping actor_id, action, created_at and entity data intact — a
--     documented, narrow exception to the append-only audit rule.
--
-- ROLLBACK:
--   grant execute on function public.audit_history(text, text, integer, integer) to anon, public;
--   drop function if exists public.anonymize_audit_actor(uuid);

revoke execute on function public.audit_history(text, text, integer, integer) from anon, public;

create or replace function public.anonymize_audit_actor(p_actor_id uuid)
returns void
language sql
security definer
set search_path to 'public'
as $$
  update public.audit_logs
     set actor_email = null,
         actor_name  = 'Anonymized user'
   where actor_id = p_actor_id;
$$;

revoke all on function public.anonymize_audit_actor(uuid) from public, anon, authenticated;
grant execute on function public.anonymize_audit_actor(uuid) to service_role;
