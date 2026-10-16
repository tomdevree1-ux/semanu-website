-- 0016: allow the 'webshop' plan on orders + subscriptions.
--
-- The pricing redesign adds a third self-serve subscription plan (Webshop,
-- 55 CHF/mo) alongside Starter and Business. The `plan` CHECK constraints from
-- 0002_init_billing.sql only permitted ('starter', 'business'); widen them so the
-- checkout/request flow can record a webshop order. RLS is unchanged.
--
-- After applying, regenerate src/lib/types/database.ts (PlanId already widened).

alter table public.orders drop constraint if exists orders_plan_check;
alter table public.orders
  add constraint orders_plan_check
  check (plan in ('starter', 'business', 'webshop'));

alter table public.subscriptions drop constraint if exists subscriptions_plan_check;
alter table public.subscriptions
  add constraint subscriptions_plan_check
  check (plan in ('starter', 'business', 'webshop'));
