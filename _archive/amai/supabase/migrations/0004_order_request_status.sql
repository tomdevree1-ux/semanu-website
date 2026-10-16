-- ============================================================
-- amai.ch · 0004 · allow the 'request_submitted' order status
-- In request mode (ORDER_FLOW_MODE=request) the subscribe form records an
-- order as an enquiry instead of sending the customer to Stripe. Extend the
-- orders.status check constraint to allow that value. Idempotent.
-- ============================================================
alter table public.orders drop constraint if exists orders_status_check;

alter table public.orders
  add constraint orders_status_check
  check (status in ('pending', 'paid', 'failed', 'canceled', 'request_submitted'));
