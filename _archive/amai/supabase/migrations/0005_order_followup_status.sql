-- ============================================================
-- amai.ch · 0005 · order follow-up statuses (admin area)
-- Lets the admin mark a checkout enquiry as contacted / done while
-- following up. Extends the orders.status check constraint. Idempotent.
-- ============================================================
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in (
    'pending', 'paid', 'failed', 'canceled', 'request_submitted', 'contacted', 'done'
  ));
