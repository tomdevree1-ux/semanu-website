import 'server-only';
import type { OutboxEmailPayload } from '@/lib/outbox/enqueue';
import type { EmailLocale } from '@/lib/email/branded';
import { RESET } from '@/lib/email/copy';

/**
 * Builds the branded password-reset email payload for the P0 outbox. The worker
 * (outbox/worker.ts) renders + sends it via Resend in the house style + the given
 * locale. The action link is carried in `vars.actionUrl` (the email body only) —
 * never logged or put in audit metadata. Locale defaults to EN (the portal is
 * English today); pass de/fr once the portal is localized.
 */
export function buildPasswordResetEmail(opts: {
  to: string;
  firstName?: string | null;
  actionUrl: string;
  locale?: EmailLocale;
}): OutboxEmailPayload {
  const locale: EmailLocale = opts.locale ?? 'en';
  return {
    to: opts.to,
    template: 'password_reset',
    subject: RESET[locale].subject,
    vars: {
      firstName: opts.firstName ?? '',
      actionUrl: opts.actionUrl,
      locale,
    },
  };
}
