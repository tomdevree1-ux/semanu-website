-- ============================================================
-- amai.ch · 0009 · portal: extend audit_logs + log_event/audit_history (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_audit_extend`.
-- Extends the EXISTING `audit_logs` (id,created_at,actor_id,action,entity_*,metadata)
-- with technical fields. Drops nothing.
-- ============================================================
alter table public.audit_logs
  add column if not exists organization_id uuid references public.organizations(id) on delete set null,
  add column if not exists actor_email text,
  add column if not exists actor_name text,
  add column if not exists actor_role text,
  add column if not exists actor_type text not null default 'internal_user'
        check (actor_type in ('internal_user','external_user','system','link_user','integration')),
  add column if not exists entity_display_name text,
  add column if not exists parent_entity_type text,
  add column if not exists parent_entity_id text,
  add column if not exists old_status text,
  add column if not exists new_status text,
  add column if not exists old_values jsonb,
  add column if not exists new_values jsonb,
  add column if not exists ip_address inet,
  add column if not exists user_agent text,
  add column if not exists request_id text,
  add column if not exists session_id text,
  add column if not exists source text not null default 'portal'
        check (source in ('portal','public_link','email_link','api','system_job','webhook','platform')),
  add column if not exists severity text not null default 'info'
        check (severity in ('info','warning','critical')),
  add column if not exists visible_to_admin boolean not null default true,
  add column if not exists visible_to_client boolean not null default false;

-- C2: server-only writer; derives actor snapshot from a trusted actor_id.
create or replace function public.log_event(
  p_action text, p_actor_id uuid default null, p_actor_type text default 'internal_user',
  p_entity_type text default null, p_entity_id text default null, p_entity_display_name text default null,
  p_old_status text default null, p_new_status text default null,
  p_old_values jsonb default null, p_new_values jsonb default null, p_metadata jsonb default null,
  p_organization_id uuid default null, p_severity text default 'info', p_source text default 'portal',
  p_ip inet default null, p_user_agent text default null, p_request_id text default null, p_session_id text default null
) returns bigint language plpgsql security definer set search_path to 'public' as $$
declare v_email text; v_name text; v_role text; v_id bigint;
begin
  if coalesce(p_action,'') = '' then raise exception 'log_event: action required'; end if;
  if p_source not in ('portal','public_link','email_link','api','system_job','webhook','platform')
    then raise exception 'log_event: invalid source %', p_source; end if;
  if p_severity not in ('info','warning','critical')
    then raise exception 'log_event: invalid severity %', p_severity; end if;
  if p_actor_id is not null then
    select email, full_name into v_email, v_name from public.profiles where id = p_actor_id;
    if exists (select 1 from public.platform_admins where user_id = p_actor_id) then
      v_role := 'platform_super_admin';
    else
      select r.key into v_role from public.user_roles ur join public.roles r on r.id = ur.role_id
       where ur.user_id = p_actor_id limit 1;
    end if;
  end if;
  insert into public.audit_logs (
    actor_id, action, entity_type, entity_id, metadata, organization_id, actor_email, actor_name,
    actor_role, actor_type, entity_display_name, old_status, new_status, old_values, new_values,
    ip_address, user_agent, request_id, session_id, source, severity)
  values (
    p_actor_id, p_action, p_entity_type, p_entity_id, coalesce(p_metadata,'{}'::jsonb),
    coalesce(p_organization_id, public.current_org()), v_email, v_name, v_role, p_actor_type,
    p_entity_display_name, p_old_status, p_new_status, p_old_values, p_new_values,
    p_ip, p_user_agent, p_request_id, p_session_id, p_source, p_severity)
  returning id into v_id;
  return v_id;
end; $$;
-- Service-role only (see 0012 for the full lockdown that removes anon/authenticated too).
revoke execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) from public;
grant  execute on function public.log_event(text,uuid,text,text,text,text,text,text,jsonb,jsonb,jsonb,uuid,text,text,inet,text,text,text) to service_role;

-- C8: display-safe history (no technical fields), gated by audit.read.
create or replace function public.audit_history(
  p_entity_type text, p_entity_id text, p_limit int default 50, p_offset int default 0)
returns table (id bigint, created_at timestamptz, actor_name text, actor_role text, actor_type text,
               action text, entity_type text, entity_id text, entity_display_name text,
               old_status text, new_status text, source text, severity text)
language sql stable security definer set search_path to 'public' as $$
  select id, created_at, actor_name, actor_role, actor_type, action, entity_type, entity_id,
         entity_display_name, old_status, new_status, source, severity
  from public.audit_logs
  where (public.has_permission('audit.read') or public.is_platform_super_admin())
    and entity_type = p_entity_type and entity_id = p_entity_id
  order by created_at desc
  limit greatest(coalesce(p_limit,50),0) offset greatest(coalesce(p_offset,0),0)
$$;
grant execute on function public.audit_history(text,text,int,int) to authenticated, service_role;

-- ROLLBACK: drop function if exists public.audit_history(text,text,int,int);
--   drop function if exists public.log_event(...all 18 args...);
--   alter table public.audit_logs drop column if exists organization_id, actor_email, ... (the added cols).
--   (audit_logs base columns id/created_at/actor_id/action/entity_*/metadata are pre-existing; keep.)
