import { env } from '@/lib/env';

/**
 * Minimal Resend wrapper (no SDK — one fetch call). SERVER ONLY.
 *
 * Sends are best-effort: if `RESEND_API_KEY` is unset (e.g. before the project
 * is provisioned) the call is skipped and logged, never thrown. Callers should
 * not block their main flow on the result.
 */
export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  attachments?: Array<{ filename: string; content: string; content_id?: string; content_type?: string }>;
};

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  if (!env.resendApiKey) {
    console.warn('[email] RESEND_API_KEY missing — skipping send:', input.subject);
    return false;
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: input.from ?? env.notificationFrom,
        to: Array.isArray(input.to) ? input.to : [input.to],
        subject: input.subject,
        html: input.html,
        ...(input.replyTo ? { reply_to: input.replyTo } : {}),
        ...(input.attachments ? { attachments: input.attachments } : {}),
      }),
    });
    if (!res.ok) {
      console.error('[email] Resend error', res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send failed:', err);
    return false;
  }
}
