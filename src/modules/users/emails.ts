import 'server-only';
import type { OutboxEmailPayload } from '@/lib/outbox/enqueue';
import type { EmailLocale } from '@/lib/email/branded';
import { INVITE } from '@/lib/email/copy';

/**
 * Branded invite email payload for the outbox. The worker renders + sends it via
 * Resend in the house style + the given locale. The acceptance link is carried in
 * `vars.actionUrl` (email body only) — it points at the P1 /app/auth/confirm route
 * (verifyOtp) and is never logged or placed in audit metadata. Locale defaults to
 * EN (the portal is English today); pass de/fr once the portal is localized.
 */
export function buildInviteEmail(opts: {
  to: string;
  firstName?: string | null;
  actionUrl: string;
  locale?: EmailLocale;
}): OutboxEmailPayload {
  const locale: EmailLocale = opts.locale ?? 'en';
  return {
    to: opts.to,
    template: 'invite',
    subject: INVITE[locale].subject,
    vars: {
      firstName: opts.firstName ?? '',
      actionUrl: opts.actionUrl,
      locale,
    },
  };
}
