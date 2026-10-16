import 'server-only';
import { sendEmail } from '@/lib/email';
import { env } from '@/lib/env';
import { funnelSourceLabel, fullName } from './format';
import type { FunnelSubmitInput } from '@/lib/validation';

/**
 * BEST-EFFORT internal notification to the operator that a new public funnel / lead-magnet submission arrived.
 * Sent to LEAD_NOTIFICATION_TO (the business inbox) — never to the lead. English, ops-only. Reuses the existing
 * Resend wrapper, which no-ops without RESEND_API_KEY and never throws, so the public /api/funnels/submit
 * response is never blocked or affected. Reply-to is the lead's email so a reply goes straight to the prospect;
 * the body links to the submission in the portal. Stores nothing — it only reads the already-validated input.
 */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function notifyNewFunnelSubmission(data: FunnelSubmitInput, id: string): Promise<void> {
  const name = fullName(data.firstName, data.lastName) || data.email;
  const label = funnelSourceLabel(data.sourceType);
  const link = `${env.siteUrl}/app/funnels/${id}`;
  const rows = [
    `<li>Name: ${esc(name)}</li>`,
    `<li>Email: ${esc(data.email)}</li>`,
    data.website ? `<li>Website: ${esc(data.website)}</li>` : '',
    `<li>Type: ${esc(label)}</li>`,
    data.locale ? `<li>Language: ${esc(data.locale)}</li>` : '',
  ].join('');
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;color:#07221F;line-height:1.5">` +
    `<p>A new ${esc(label)} request just came in via amai.ch.</p>` +
    `<ul>${rows}</ul>` +
    `<p><a href="${esc(link)}" style="color:#1B2A4A">Open it in your platform</a></p>` +
    `</div>`;

  // sendEmail is best-effort (no-op without RESEND_API_KEY; never throws).
  await sendEmail({ to: env.notificationTo, subject: `New lead (${label}): ${name}`, html, replyTo: data.email });
}
