-- ============================================================
-- amai.ch · 0013 · portal: audit raw-read hardening (S1, ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_audit_raw_technical_only`.
-- Swaps the raw audit_logs SELECT policy from is_admin() to permission-based:
-- direct raw access (which exposes technical fields ip_address/user_agent/
-- metadata/old_values/new_values/request_id/session_id) now requires
-- `audit.read_technical` or platform super-admin. Holders of only `audit.read`
-- use the display-safe `audit_history()` RPC. Policy swap only — drops no data.
-- ============================================================
drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_select_technical on public.audit_logs
  for select to authenticated
  using (public.has_permission('audit.read_technical') or public.is_platform_super_admin());

-- ROLLBACK:
--   drop policy if exists audit_logs_select_technical on public.audit_logs;
--   create policy audit_logs_admin_select on public.audit_logs for select to authenticated using (public.is_admin());
