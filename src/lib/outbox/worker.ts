import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';
import { markDeliveryResult } from '@/modules/website-reports/delivery';
import { runAutoReportJob } from '@/modules/website-reports/auto/job';
import { brandedEmailHtml, brandedEmailText, type EmailLocale, type BrandedEmailOpts } from '@/lib/email/branded';
import { RESET, INVITE, REPORT, greet } from '@/lib/email/copy';
import { signatureAttachment } from '@/lib/email/signature-photo';

/**
 * SERVER ONLY outbox worker. Claims due rows (concurrency-safe via the DB
 * claim_outbox function), sends each email via Resend, and finalizes with
 * complete_outbox (which applies retry/backoff and writes email_log). Invoked
 * from the CRON_SECRET-guarded /api/cron/outbox route in P1.
 *
 * P15: supports the `website_report` template + a private-bucket PDF attachment (downloaded server-side at
 * send time) and reconciles the delivery row via markDeliveryResult after completion. No open/click tracking
 * + no inbound webhook in v1.
 */
type OutboxRow = Database['public']['Tables']['outbox']['Row'];
type Admin = ReturnType<typeof createAdminClient>;

type EmailAttachment = { bucket: string; path: string; filename: string; mimeType: string };
type EmailPayload = {
  to?: string;
  subject?: string;
  template?: string;
  vars?: Record<string, string>;
  from?: string;
  replyTo?: string;
  attachment?: EmailAttachment;
};

/**
 * Build the house-style email options for a templated outbox payload.
 * Copy + layout come from src/lib/email (localized, branded). Locale is carried
 * in vars.locale; portal emails (reset/invite) default to EN, the prospect
 * report defaults to DE.
 */
function brandedOpts(p: EmailPayload): BrandedEmailOpts | null {
  const name = (p.vars?.firstName ?? '').trim();
  const url = p.vars?.actionUrl ?? '#';
  const pick = (fallback: EmailLocale): EmailLocale => {
    const l = p.vars?.locale;
    return l === 'de' || l === 'fr' || l === 'en' ? l : fallback;
  };
  if (p.template === 'password_reset') {
    const locale = pick('en');
    const c = RESET[locale];
    return { locale, greeting: greet(locale, name), paragraphs: c.paragraphs, cta: { label: c.ctaLabel, url }, paragraphsAfter: [c.after] };
  }
  if (p.template === 'invite') {
    const locale = pick('en');
    const c = INVITE[locale];
    return { locale, greeting: greet(locale, name), paragraphs: c.paragraphs, cta: { label: c.ctaLabel, url }, paragraphsAfter: [c.after] };
  }
  if (p.template === 'website_report') {
    const locale = pick('de');
    const c = REPORT[locale];
    return { locale, greeting: greet(locale, name), paragraphs: c.paragraphs };
  }
  return null;
}

function renderEmail(p: EmailPayload): string {
  const o = brandedOpts(p);
  if (o) return brandedEmailHtml(o);
  // Fallback for an unknown template: a minimal branded shell with the action link.
  return brandedEmailHtml({ locale: 'en', greeting: 'Hello,', paragraphs: [], cta: { label: 'Continue', url: p.vars?.actionUrl ?? '#' } });
}

/** Plain-text counterpart of each email. Multipart text+HTML improves deliverability (HTML-only looks spammy). */
function renderEmailText(p: EmailPayload): string {
  const o = brandedOpts(p);
  if (o) return brandedEmailText(o);
  return brandedEmailText({ locale: 'en', greeting: 'Hello,', paragraphs: [], cta: { label: 'Continue', url: p.vars?.actionUrl ?? '' } });
}

async function sendViaResend(payload: EmailPayload, supabase: Admin): Promise<{ id: string | null }> {
  // Always inline the signature photo (CID) so it renders even when remote images are blocked.
  const attachments: Array<{ filename: string; content: string; content_id?: string; content_type?: string }> = [
    signatureAttachment(),
  ];
  if (payload.attachment) {
    const { bucket, path, filename } = payload.attachment;
    const { data, error } = await supabase.storage.from(bucket).download(path);
    if (error || !data) throw new Error('attachment download failed');
    const buf = Buffer.from(await data.arrayBuffer());
    attachments.push({ filename, content: buf.toString('base64') });
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: payload.from ?? env.notificationFrom,
      to: payload.to,
      subject: payload.subject,
      html: renderEmail(payload),
      text: renderEmailText(payload),
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
      ...(payload.template === 'website_report'
        ? { headers: { 'List-Unsubscribe': `<mailto:${env.notificationTo}?subject=unsubscribe>` } }
        : {}),
      attachments,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as { id?: string };
  return { id: json.id ?? null };
}

export async function processPending(
  limit = 20,
  worker = 'cron',
): Promise<{ processed: number; sent: number; failed: number }> {
  const supabase = createAdminClient();
  const { data: claimed } = await supabase.rpc('claim_outbox', { p_limit: limit, p_worker: worker });
  const rows = (claimed ?? []) as OutboxRow[];

  let sent = 0;
  let failed = 0;
  for (const row of rows) {
    // WAF-4: background report-generation jobs (no email) go to the auto-pilot handler, not the email sender.
    if (row.channel === 'report_generation') {
      try {
        const gp = row.payload as unknown as { funnelSubmissionId?: string };
        if (!gp?.funnelSubmissionId) throw new Error('report_generation job missing funnelSubmissionId');
        const r = await runAutoReportJob(gp.funnelSubmissionId);
        await supabase.rpc('complete_outbox', { p_id: row.id, p_success: true, p_provider_message_id: null, p_error: null });
        if (r.status === 'failed') failed += 1;
        else sent += 1;
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'auto report failed';
        await supabase.rpc('complete_outbox', { p_id: row.id, p_success: false, p_provider_message_id: null, p_error: msg });
        failed += 1;
      }
      continue;
    }
    const payload = row.payload as unknown as EmailPayload;
    try {
      if (!env.resendApiKey) throw new Error('RESEND_API_KEY is not set');
      const { id } = await sendViaResend(payload, supabase);
      await supabase.rpc('complete_outbox', {
        p_id: row.id,
        p_success: true,
        p_provider_message_id: id,
        p_error: null,
      });
      // P15: reconcile the delivery row for report emails (no-op for other templates).
      if (payload.template === 'website_report') await markDeliveryResult(row.id, true, id, null);
      sent += 1;
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'send failed';
      await supabase.rpc('complete_outbox', {
        p_id: row.id,
        p_success: false,
        p_provider_message_id: null,
        p_error: msg,
      });
      if (payload.template === 'website_report') await markDeliveryResult(row.id, false, null, msg);
      failed += 1;
    }
  }
  return { processed: rows.length, sent, failed };
}
