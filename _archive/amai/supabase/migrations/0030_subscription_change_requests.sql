-- 0030_subscription_change_requests.sql
-- P12B1 Subscription Change Requests + Preview (Ring D). GREENFIELD: creates
-- public.subscription_change_requests — the portal request/log layer for subscription mutations,
-- entered through a P12A customer_subscriptions row. P12B1 is REQUEST + PREVIEW ONLY: no Stripe
-- writes, no live execution. `executing`/`executed` statuses + the execute permissions are reserved
-- for P12B2 and are NOT reachable/seeded here. Stripe remains authoritative; the legacy
-- subscriptions / customers / orders / payments / payment_links / stripe_events / invoice_payments /
-- invoice_payment_links / checkout / webhook are NOT modified. Authority: AMAI_PORTAL_MASTER_PLAN.md
-- Parts IV/V/VI + the live schema. Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0030_subscription_change_requests).

create table if not exists public.subscription_change_requests (
  id                       uuid primary key default gen_random_uuid(),
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  customer_subscription_id uuid not null references public.customer_subscriptions(id) on delete restrict,
  company_id               uuid references public.companies(id) on delete set null,
  contact_id               uuid references public.company_contacts(id) on delete set null,
  stripe_subscription_id   text not null,
  action_type              text not null,
  status                   text not null default 'draft',
  proration_behavior       text,
  subscription_item_id     text,
  requested_by             uuid references public.profiles(id) on delete set null,
  approved_by              uuid references public.profiles(id) on delete set null,
  executed_by              uuid references public.profiles(id) on delete set null,
  requested_at             timestamptz,
  approved_at              timestamptz,
  executed_at              timestamptz,
  failed_at                timestamptz,
  request_payload          jsonb not null default '{}'::jsonb,
  preview_payload          jsonb,
  result_payload           jsonb,
  safe_summary             jsonb not null default '{}'::jsonb,
  error_summary            text,
  idempotency_key          text,
  archived_at              timestamptz,
  archived_by              uuid references public.profiles(id) on delete set null,
  created_by               uuid references public.profiles(id) on delete set null,
  updated_by               uuid references public.profiles(id) on delete set null,
  notes                    text,
  internal_notes           text,
  constraint subscription_change_requests_action_check check (action_type in (
    'change_plan','change_quantity','cancel_at_period_end','undo_cancel_at_period_end',
    'cancel_immediately','pause_collection','resume_collection')),
  -- `executing`/`executed` are reserved for P12B2 forward-compat; no P12B1 code path sets them.
  constraint subscription_change_requests_status_check check (status in (
    'draft','previewed','approved','executing','executed','failed','cancelled','archived')),
  constraint subscription_change_requests_proration_check check (
    proration_behavior is null or proration_behavior in ('create_prorations','none','always_invoice'))
);
-- ROLLBACK: drop table public.subscription_change_requests;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname='subscription_change_requests_touch_updated_at') then
    create trigger subscription_change_requests_touch_updated_at before update on public.subscription_change_requests for each row execute function public.touch_updated_at();
  end if;
end $$;

create unique index if not exists subscription_change_requests_idem_uidx       on public.subscription_change_requests (idempotency_key) where idempotency_key is not null;
create index        if not exists subscription_change_requests_sub_idx          on public.subscription_change_requests (customer_subscription_id);
create index        if not exists subscription_change_requests_stripe_sub_idx   on public.subscription_change_requests (stripe_subscription_id);
create index        if not exists subscription_change_requests_company_idx      on public.subscription_change_requests (company_id);
create index        if not exists subscription_change_requests_contact_idx      on public.subscription_change_requests (contact_id);
create index        if not exists subscription_change_requests_status_idx       on public.subscription_change_requests (status);
create index        if not exists subscription_change_requests_action_idx       on public.subscription_change_requests (action_type);
create index        if not exists subscription_change_requests_created_at_idx   on public.subscription_change_requests (created_at desc);
create index        if not exists subscription_change_requests_status_live_idx  on public.subscription_change_requests (status) where archived_at is null;
-- ROLLBACK: indexes drop with the table.

-- RLS: permission-gated reads (anyone who can see a subscription can see its change history).
-- No write policies — service-role writes only.
alter table public.subscription_change_requests enable row level security;
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='subscription_change_requests' and policyname='subscription_change_requests_select') then
    execute $p$create policy subscription_change_requests_select on public.subscription_change_requests for select to authenticated
      using (has_permission('subscriptions.read') or is_platform_super_admin())$p$;
  end if;
end $$;
-- ROLLBACK: policy drops with the table.

-- permissions (module + label NOT NULL). P12B1 = request + preview ONLY.
-- NOTE: subscriptions.change_plan/change_quantity/cancel/pause/resume are intentionally NOT seeded —
-- they are P12B2 (live execution) only. Execution is impossible in P12B1.
insert into public.permissions (key, module, label) values
  ('subscriptions.request_change', 'subscriptions', 'Request subscription changes'),
  ('subscriptions.preview_change', 'subscriptions', 'Preview subscription changes')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('subscriptions.request_change','subscriptions.preview_change');

-- role grants: admin + sales may request + preview; analyst/reviewer/read_only get nothing new.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.key in ('admin','sales') and p.key in ('subscriptions.request_change','subscriptions.preview_change')
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('subscriptions.request_change','subscriptions.preview_change');
