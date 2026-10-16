-- WAF-4: the outbox became a generic job queue, but its channel CHECK only allowed 'email', so
-- report_generation jobs were silently rejected (the public route swallows enqueue errors best-effort).
-- Broaden the constraint to allow the new channel. Additive + reversible.
alter table public.outbox drop constraint if exists outbox_channel_check;
alter table public.outbox add constraint outbox_channel_check check (channel in ('email', 'report_generation'));

-- ROLLBACK:
--   alter table public.outbox drop constraint if exists outbox_channel_check;
--   alter table public.outbox add constraint outbox_channel_check check (channel = 'email');
