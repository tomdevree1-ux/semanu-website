-- 0031_subscription_execution_permissions.sql
-- P12B2 Subscription Change Execution (Ring D). PERMISSION SEED ONLY — no table/column change.
-- Seeds the three admin-only execution permissions that gate live Stripe subscription mutations
-- (executed by P12B2 server actions, behind the ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS flag). The P12B1
-- `subscription_change_requests` table already carries every execution field (executed_by/executed_at/
-- approved_by/approved_at/failed_at/result_payload/idempotency_key + the executing/executed statuses), so
-- NO schema change is needed. `subscriptions.pause`/`subscriptions.resume` are intentionally NOT seeded
-- (pause/resume deferred). No legacy table is touched. Authority: AMAI_PORTAL_MASTER_PLAN.md Parts IV/V/VI
-- + the live schema. Never edit an applied migration (Part IV L2); add a new one.
--
-- Mirror of the live apply (Supabase MCP `apply_migration`, name 0031_subscription_execution_permissions).

-- execution permissions (module + label NOT NULL). Admin-only.
insert into public.permissions (key, module, label) values
  ('subscriptions.change_plan',     'subscriptions', 'Execute subscription plan changes'),
  ('subscriptions.change_quantity', 'subscriptions', 'Execute subscription quantity changes'),
  ('subscriptions.cancel',          'subscriptions', 'Execute subscription cancellations')
on conflict (key) do nothing;
-- ROLLBACK: delete from public.permissions where key in ('subscriptions.change_plan','subscriptions.change_quantity','subscriptions.cancel');

-- grants: ADMIN ONLY. No grants for sales/analyst/reviewer/read_only.
insert into public.role_permissions (role_id, permission_id)
select r.id, p.id
from public.roles r
join public.permissions p on (
  r.key = 'admin' and p.key in ('subscriptions.change_plan','subscriptions.change_quantity','subscriptions.cancel')
)
where not exists (
  select 1 from public.role_permissions rp where rp.role_id = r.id and rp.permission_id = p.id
);
-- ROLLBACK: delete from public.role_permissions rp using public.permissions p where rp.permission_id = p.id and p.key in ('subscriptions.change_plan','subscriptions.change_quantity','subscriptions.cancel');

-- NOTE: subscriptions.pause / subscriptions.resume are NOT seeded (pause/resume deferred past P12B2).
