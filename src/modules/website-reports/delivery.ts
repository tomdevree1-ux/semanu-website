import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/audit/log';
import { enqueueEmail } from '@/lib/outbox/enqueue';
import { env } from '@/lib/env';
import { websiteReportContentSchema } from './schema';
import { renderReportPdf, reportPdfFilename } from './pdf';
import { FUNNEL_ADVANCE_TO_REPORT_SENT_FROM, FUNNEL_TERMINAL_STATUSES } from './delivery-status';
import type { ReportDelivery } from './delivery-types';
import type { WebsiteReport } from './types';

/**
 * SERVER ONLY P15 delivery pipeline + the worker reconciliation hook. `runDeliveryPipeline` renders the PDF
 * (from the validated report_json — never AI, never a fetch, internal sales note excluded), stores it
 * privately, and enqueues the email with a PDF attachment (no link). `markDeliveryResult` is called by the
 * outbox worker after a `website_report` send to mark the delivery sent/failed and advance the funnel.
 */
const BUCKET = 'website-reports';
type Admin = ReturnType<typeof createAdminClient>;

type EmailLocaleStrings = { hello: string; subject: (domain: string) => string; intro: string; signoff: string };
const EMAIL_L: Record<'de' | 'fr' | 'en', EmailLocaleStrings> = {
  de: { hello: 'Hallo', subject: (d) => `Ihre Website Analyse für ${d}`, intro: 'Im Anhang finden Sie Ihre Website Analyse als PDF. Bei Fragen antworten Sie einfach auf diese Email.', signoff: 'Freundliche Grüsse, das amai Team' },
  fr: { hello: 'Bonjour', subject: (d) => `Votre analyse de site pour ${d}`, intro: 'Vous trouverez votre analyse de site en pièce jointe au format PDF. Pour toute question, répondez simplement à cet email.', signoff: 'Cordialement, l équipe amai' },
  en: { hello: 'Hello', subject: (d) => `Your website analysis for ${d}`, intro: 'Your website analysis is attached as a PDF. If you have any questions, just reply to this email.', signoff: 'Kind regards, the amai team' },
};

function localeOf(v: unknown): 'de' | 'fr' | 'en' {
  return v === 'fr' || v === 'en' ? v : 'de';
}
function safeHost(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).host || null;
  } catch {
    return null;
  }
}

export async function runDeliveryPipeline(
  report: WebsiteReport,
  delivery: ReportDelivery,
  opts: { contactFirstName?: string | null } = {},
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const fail = async (code: string): Promise<{ ok: false; error: string }> => {
    await admin.from('website_report_deliveries').update({ status: 'failed', failed_at: new Date().toISOString(), error_summary: code }).eq('id', delivery.id);
    await logEvent({ action: 'report_delivery.failed', actorId: delivery.created_by ?? null, entityType: 'report_delivery', entityId: delivery.id, severity: 'warning', newStatus: 'failed', metadata: { report_id: report.id, reason: code }, source: 'portal' });
    return { ok: false, error: code };
  };

  const parsed = websiteReportContentSchema.safeParse(report.report_json);
  if (!parsed.success) return fail('pdf_failed');

  const domain = report.normalized_domain || safeHost(report.website_url) || 'website';
  const locale = localeOf((report.input_snapshot as { locale?: unknown } | null)?.locale);
  const generatedAt = report.generated_at ?? report.created_at;

  await admin.from('website_report_deliveries').update({ status: 'rendering' }).eq('id', delivery.id);

  let pdf: Buffer;
  try {
    pdf = await renderReportPdf(parsed.data, { domain, websiteUrl: report.website_url, generatedAt, locale });
  } catch {
    return fail('pdf_failed');
  }
  if (pdf.length > env.websiteReportPdfMaxBytes) return fail('pdf_too_large');

  const filename = reportPdfFilename(domain, generatedAt);
  const path = `${report.id}/${delivery.id}.pdf`;
  const up = await admin.storage.from(BUCKET).upload(path, pdf, { contentType: 'application/pdf', upsert: true });
  if (up.error) return fail('pdf_failed');

  await admin.from('website_report_deliveries').update({ pdf_bucket: BUCKET, pdf_path: path, pdf_size_bytes: pdf.length }).eq('id', delivery.id);
  await logEvent({ action: 'report_delivery.pdf_generated', actorId: delivery.created_by ?? null, entityType: 'report_delivery', entityId: delivery.id, metadata: { report_id: report.id, pdf_size_bytes: pdf.length }, source: 'portal' });

  const l = EMAIL_L[locale];
  const subject = l.subject(domain);
  const dedupeKey = `website_report:${report.id}:${delivery.id}`;
  let outboxId: string | null = null;
  try {
    outboxId = await enqueueEmail(
      {
        to: delivery.to_email,
        template: 'website_report',
        subject,
        vars: { firstName: opts.contactFirstName ?? '', hello: l.hello, intro: l.intro, signoff: l.signoff },
        attachment: { bucket: BUCKET, path, filename, mimeType: 'application/pdf' },
      },
      dedupeKey,
    );
  } catch {
    return fail('enqueue_failed');
  }
  if (!outboxId) return fail('enqueue_failed');

  await admin.from('website_report_deliveries').update({ status: 'sending', outbox_id: outboxId, subject }).eq('id', delivery.id);
  await logEvent({ action: 'report_delivery.email_enqueued', actorId: delivery.created_by ?? null, entityType: 'report_delivery', entityId: delivery.id, metadata: { report_id: report.id, outbox_id: outboxId }, source: 'portal' });
  return { ok: true };
}

async function advanceFunnelToReportSent(admin: Admin, d: ReportDelivery): Promise<void> {
  const { data: f } = await admin.from('funnel_submissions').select('id, status').eq('id', d.funnel_submission_id).maybeSingle();
  if (!f) return;
  await logEvent({ action: 'funnel.report_sent', actorId: d.created_by ?? null, actorType: 'system', entityType: 'funnel', entityId: f.id, metadata: { report_id: d.report_id, delivery_id: d.id }, source: 'system_job' });
  if (FUNNEL_ADVANCE_TO_REPORT_SENT_FROM.has(f.status)) {
    await admin.from('funnel_submissions').update({ status: 'report_sent' }).eq('id', f.id);
    await logEvent({ action: 'funnel.status_changed', actorId: d.created_by ?? null, actorType: 'system', entityType: 'funnel', entityId: f.id, oldStatus: f.status, newStatus: 'report_sent', metadata: { via: 'report_delivery', delivery_id: d.id }, source: 'system_job' });
  }
}

/** Worker reconciliation hook: mark the delivery sent/failed after the outbox send. Never throws. */
export async function markDeliveryResult(outboxId: string, success: boolean, providerMessageId: string | null, error: string | null): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: d } = await admin.from('website_report_deliveries').select('*').eq('outbox_id', outboxId).maybeSingle();
    if (!d) return;
    if (d.status === 'sent' || d.status === 'cancelled') return; // idempotent
    if (success) {
      await admin.from('website_report_deliveries').update({ status: 'sent', provider_message_id: providerMessageId, sent_at: new Date().toISOString(), error_summary: null }).eq('id', d.id);
      await logEvent({ action: 'report_delivery.sent', actorId: d.created_by ?? null, actorType: 'system', entityType: 'report_delivery', entityId: d.id, newStatus: 'sent', metadata: { report_id: d.report_id, provider_message_id: providerMessageId }, source: 'system_job' });
      await advanceFunnelToReportSent(admin, d);
    } else {
      await admin.from('website_report_deliveries').update({ status: 'failed', failed_at: new Date().toISOString(), error_summary: 'send_failed' }).eq('id', d.id);
      await logEvent({ action: 'report_delivery.failed', actorId: d.created_by ?? null, actorType: 'system', entityType: 'report_delivery', entityId: d.id, severity: 'warning', newStatus: 'failed', metadata: { report_id: d.report_id, reason: 'send_failed' }, source: 'system_job' });
    }
  } catch (e) {
    console.error('[delivery] markDeliveryResult failed:', e instanceof Error ? e.message : 'unknown');
  }
}

/** Forward-only funnel advance to `follow_up_planned` (never changes terminal/already-planned). */
export async function advanceFunnelToFollowUpPlanned(admin: Admin, funnelSubmissionId: string, actorId: string): Promise<void> {
  const { data: f } = await admin.from('funnel_submissions').select('id, status').eq('id', funnelSubmissionId).maybeSingle();
  if (!f) return;
  if (f.status === 'follow_up_planned' || FUNNEL_TERMINAL_STATUSES.has(f.status)) return;
  await admin.from('funnel_submissions').update({ status: 'follow_up_planned', updated_by: actorId }).eq('id', f.id);
  await logEvent({ action: 'funnel.status_changed', actorId, entityType: 'funnel', entityId: f.id, oldStatus: f.status, newStatus: 'follow_up_planned', metadata: { via: 'report_follow_up' }, source: 'portal' });
}
