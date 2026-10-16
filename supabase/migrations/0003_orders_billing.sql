-- 0003_orders_billing.sql
-- B2B billing identity on orders, captured in checkout step 3 (Privatperson/Firma).
-- Additive and nullable (customer_type has a default), so existing rows and the
-- prior insert path keep working. RLS is unchanged: orders stays service-role only,
-- no anon access. Applied to production (project bkwwlmflsbhrsfwydbnv) on 2026-06-15.

alter table public.orders
  add column if not exists customer_type text not null default 'person',
  add column if not exists vat_number text,
  add column if not exists billing_street text,
  add column if not exists billing_postal_code text,
  add column if not exists billing_city text,
  add column if not exists billing_country text;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'orders_customer_type_chk') then
    alter table public.orders
      add constraint orders_customer_type_chk check (customer_type in ('person', 'company'));
  end if;
end $$;
