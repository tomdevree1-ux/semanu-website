-- ============================================================
-- amai.ch · 0010 · portal: outbox + email_log + worker fns (ADDITIVE)
-- Mirrors the AS-APPLIED live migration `portal_outbox`.
-- `rate_limit` + `hit_rate_limit()` already existed (pre-portal) and are reused — not recreated.
-- Drops nothing.
-- ============================================================
create table if not exists public.outbox (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  organization_id uuid references public.organizations(id) on delete set null,
  channel text not null default 'email' check (channel in ('email')),
  dedupe_key text not null unique,
  payload jsonb not null,
  status text not null default 'pending'
    check (status in ('pending','processing','sent','failed','retrying','cancelled')),
  attempts int not null default 0,
  max_attempts int not null default 5,
  last_attempt_at timestamptz, next_retry_at timestamptz,
  locked_at timestamptz, locked_by text,
  provider_message_id text, error text,
  audit_event_id bigint references public.audit_logs(id) on delete set null
);
create index if not exists outbox_due_idx on public.outbox (status, next_retry_at);
drop trigger if exists outbox_touch on public.outbox;
create trigger outbox_touch before update on public.outbox
  for each row execute function public.touch_updated_at();

create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  outbox_id uuid references public.outbox(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  to_email text not null, subject text not null, template_key text,
  status text not null default 'sent' check (status in ('sent','failed')),
  provider_message_id text, error text,
  audit_event_id bigint references public.audit_logs(id) on delete set null
);
create index if not exists email_log_to_idx on public.email_log (to_email, created_at);

create or replace function public.claim_outbox(p_limit int, p_worker text)
returns setof public.outbox language plpgsql security definer set search_path to 'public' as $$
begin
  return query
  update public.outbox o set status='processing', locked_at=now(), locked_by=p_worker,
         attempts=o.attempts+1, last_attempt_at=now()
   where o.id in (
     select id from public.outbox
      where status in ('pending','retrying')
        and (next_retry_at is null or next_retry_at <= now()) and locked_at is null
      order by created_at limit p_limit for update skip locked)
  returning o.*;
end; $$;

create or replace function public.complete_outbox(
  p_id uuid, p_success boolean, p_provider_message_id text default null, p_error text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v public.outbox;
begin
  select * into v from public.outbox where id = p_id;
  if not found then return; end if;
  if p_success then
    update public.outbox set status='sent', provider_message_id=p_provider_message_id,
           error=null, locked_at=null, locked_by=null where id=p_id;
    insert into public.email_log (outbox_id, organization_id, to_email, subject, template_key, status, provider_message_id)
    values (v.id, v.organization_id, v.payload->>'to', v.payload->>'subject', v.payload->>'template', 'sent', p_provider_message_id);
  elsif v.attempts >= v.max_attempts then
    update public.outbox set status='failed', error=p_error, locked_at=null, locked_by=null where id=p_id;
    insert into public.email_log (outbox_id, organization_id, to_email, subject, template_key, status, error)
    values (v.id, v.organization_id, v.payload->>'to', v.payload->>'subject', v.payload->>'template', 'failed', p_error);
  else
    update public.outbox set status='retrying', error=p_error, locked_at=null, locked_by=null,
           next_retry_at = now() + (least(power(2, v.attempts)::int, 60) * interval '1 minute') where id=p_id;
  end if;
end; $$;

alter table public.outbox enable row level security;
alter table public.email_log enable row level security;
revoke execute on function public.claim_outbox(int,text) from public;
revoke execute on function public.complete_outbox(uuid,boolean,text,text) from public;
grant execute on function public.claim_outbox(int,text) to service_role;
grant execute on function public.complete_outbox(uuid,boolean,text,text) to service_role;

-- ROLLBACK: drop function if exists public.claim_outbox(int,text), public.complete_outbox(uuid,boolean,text,text);
--           drop table if exists public.email_log, public.outbox;
