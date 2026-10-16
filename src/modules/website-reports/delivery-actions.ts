'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { checkRateLimit, userIdentifier } from '@/lib/security/ratelimit';
import { logEvent } from '@/lib/audit/log';
import { env } from '@/lib/env';
import { deliverReportSchema, deliveryIdSchema, setFollowUpSchema, type DeliveryActionState } from './delivery-schema';
import { CANCELLABLE_DELIVERY_STATUSES } from './delivery-status';
import { runDeliveryPipeline, advanceFunnelToFollowUpPlanned } from './delivery';
import type { WebsiteReport } from './types';
import type { ReportDelivery } from './delivery-types';

/**
 * SERVER actions for P15 report delivery. Gates: feature flag + `website_reports.deliver` (deliver/resend/
 * cancel/follow-up), `website_reports.read` (PDF preview), `website_reports.archive` (archive/restore).
 * Only APPROVED + current + non-archived reports with a linked contact email are deliverable. Service-role
 * writes, audited, rate-limited (10/actor/hour shared). The customer email carries the PDF as an attachment,
 * never a link; the staff preview signed URL is short-TTL (300 s).
 */
const NOT_ALLOWED = 'You do not have permission to do this.';
const DISABLED = 'Report delivery is disabled.';
const RATE_LIMITED = 'Too many deliveries recently. Please wait a while before sending more.';
const BUCKET = 'website-reports';
const SIGNED_URL_TTL = 300;
const RL_BUCKET = 'website_report_delivery';
const RL_LIMIT = 10;
const RL_WINDOW = 3600;
type Admin = ReturnType<typeof createAdminClient>;

function revalidate(reportId: string, deliveryId?: string) {
  revalidatePath('/app/website-reports');
  revalidatePath('/app/website-reports/deliveries');
  revalidatePath(`/app/website-reports/${reportId}`);
  if (deliveryId) revalidatePath(`/app/website-reports/deliveries/${deliveryId}`);
}
async function loadReport(admin: Admin, id: string): Promise<WebsiteReport | null> {
  const { data } = await admin.from('website_analysis_reports').select('*').eq('id', id).maybeSingle();
  return data;
}
async function loadDelivery(admin: Admin, id: string): Promise<ReportDelivery | null> {
  const { data } = await admin.from('website_report_deliveries').select('*').eq('id', id).maybeSingle();
  return data;
}

/** Shared deliver / resend: validate the report + contact, create a delivery row, run the pipeline. */
async function createAndRunDelivery(actorId: string, reportId: string): Promise<DeliveryActionState> {
  const admin = createAdminClient();
  const report = await loadReport(admin, reportId);
  if (!report) return { error: 'Report not found.' };
  if (report.archived_at) return { error: 'This report is archived.' };
  if (!report.is_current) return { error: 'Only the current report version can be delivered.' };
  if (report.review_status !== 'approved') return { error: 'Only an approved report can be delivered.' };
  if (!report.contact_id) return { error: 'Link a contact to this report before delivering.' };

  const { data: contact } = await admin.from('company_contacts').select('id, name, email, archived_at').eq('id', report.contact_id).maybeSingle();
  if (!contact) return { error: 'Linked contact not found.' };
  if (contact.archived_at) return { error: 'The linked contact is archived.' };
  const email = (contact.email ?? '').trim();
  if (!email) return { error: 'The linked contact has no email address.' };
  const firstName = (contact.name ?? '').trim().split(/\s+/)[0] ?? '';

  const { data: row, error } = await admin
    .from('website_report_deliveries')
    .insert({
      report_id: report.id,
      funnel_submission_id: report.funnel_submission_id,
      contact_id: report.contact_id,
      company_id: report.company_id,
      to_email: email,
      status: 'queued',
      created_by: actorId,
      updated_by: actorId,
    })
    .select('*')
    .single();
  if (error || !row) return { error: 'Something went wrong. Please try again.' };

  await logEvent({ action: 'report_delivery.requested', actorId, entityType: 'report_delivery', entityId: row.id, metadata: { report_id: report.id, domain: report.normalized_domain }, source: 'portal' });

  await runDeliveryPipeline(report, row, { contactFirstName: firstName });
  revalidate(report.id, row.id);
  return { ok: true, id: row.id };
}

export async function deliverWebsiteAnalysisReport(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!env.websiteReportDeliveryEnabled) return { error: DISABLED };
  if (!(await hasPermission('website_reports.deliver'))) return { error: NOT_ALLOWED };
  const parsed = deliverReportSchema.safeParse({ reportId: formData.get('reportId') });
  if (!parsed.success) return { error: 'Invalid report.' };
  if (!(await checkRateLimit(RL_BUCKET, userIdentifier(actor.id), RL_LIMIT, RL_WINDOW)).allowed) return { error: RATE_LIMITED };
  return createAndRunDelivery(actor.id, parsed.data.reportId);
}

export async function resendWebsiteAnalysisReport(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!env.websiteReportDeliveryEnabled) return { error: DISABLED };
  if (!(await hasPermission('website_reports.deliver'))) return { error: NOT_ALLOWED };
  const parsed = deliverReportSchema.safeParse({ reportId: formData.get('reportId') });
  if (!parsed.success) return { error: 'Invalid report.' };
  if (!(await checkRateLimit(RL_BUCKET, userIdentifier(actor.id), RL_LIMIT, RL_WINDOW)).allowed) return { error: RATE_LIMITED };
  return createAndRunDelivery(actor.id, parsed.data.reportId);
}

export async function cancelWebsiteReportDelivery(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.deliver'))) return { error: NOT_ALLOWED };
  const parsed = deliveryIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid delivery.' };
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d) return { error: 'Delivery not found.' };
  if (!CANCELLABLE_DELIVERY_STATUSES.has(d.status)) return { error: 'This delivery can no longer be cancelled.' };
  await admin.from('website_report_deliveries').update({ status: 'cancelled', updated_by: actor.id }).eq('id', d.id);
  await logEvent({ action: 'report_delivery.cancelled', actorId: actor.id, entityType: 'report_delivery', entityId: d.id, oldStatus: d.status, newStatus: 'cancelled', metadata: { report_id: d.report_id }, source: 'portal' });
  revalidate(d.report_id, d.id);
  return { ok: true };
}

export async function getReportPdfSignedUrl(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  await requireAuth();
  if (!(await hasPermission('website_reports.read'))) return { error: NOT_ALLOWED };
  const parsed = deliveryIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid delivery.' };
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d || !d.pdf_path) return { error: 'No PDF available for this delivery.' };
  const { data, error } = await admin.storage.from(d.pdf_bucket || BUCKET).createSignedUrl(d.pdf_path, SIGNED_URL_TTL);
  if (error || !data?.signedUrl) return { error: 'Could not generate a preview link.' };
  return { ok: true, signedUrl: data.signedUrl };
}

export async function setWebsiteReportFollowUp(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.deliver'))) return { error: NOT_ALLOWED };
  const parsed = setFollowUpSchema.safeParse({ id: formData.get('id'), at: formData.get('at') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d) return { error: 'Delivery not found.' };
  await admin.from('website_report_deliveries').update({ follow_up_at: parsed.data.at.toISOString(), follow_up_status: 'planned', updated_by: actor.id }).eq('id', d.id);
  await logEvent({ action: 'report_delivery.follow_up_set', actorId: actor.id, entityType: 'report_delivery', entityId: d.id, metadata: { report_id: d.report_id, follow_up_at: parsed.data.at.toISOString() }, source: 'portal' });
  await advanceFunnelToFollowUpPlanned(admin, d.funnel_submission_id, actor.id);
  revalidate(d.report_id, d.id);
  return { ok: true };
}

export async function clearWebsiteReportFollowUp(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.deliver'))) return { error: NOT_ALLOWED };
  const parsed = deliveryIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid delivery.' };
  const markDone = formData.get('done') === 'true';
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d) return { error: 'Delivery not found.' };
  await admin
    .from('website_report_deliveries')
    .update({ follow_up_status: markDone ? 'done' : 'none', follow_up_at: markDone ? d.follow_up_at : null, updated_by: actor.id })
    .eq('id', d.id);
  await logEvent({ action: 'report_delivery.follow_up_cleared', actorId: actor.id, entityType: 'report_delivery', entityId: d.id, metadata: { report_id: d.report_id, done: markDone }, source: 'portal' });
  revalidate(d.report_id, d.id);
  return { ok: true };
}

export async function archiveWebsiteReportDelivery(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.archive'))) return { error: NOT_ALLOWED };
  const parsed = deliveryIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid delivery.' };
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d) return { error: 'Delivery not found.' };
  if (d.archived_at) return { ok: true };
  await admin.from('website_report_deliveries').update({ archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id }).eq('id', d.id);
  await logEvent({ action: 'report_delivery.archived', actorId: actor.id, severity: 'warning', entityType: 'report_delivery', entityId: d.id, metadata: { report_id: d.report_id }, source: 'portal' });
  revalidate(d.report_id, d.id);
  return { ok: true };
}

export async function restoreWebsiteReportDelivery(_prev: DeliveryActionState, formData: FormData): Promise<DeliveryActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.archive'))) return { error: NOT_ALLOWED };
  const parsed = deliveryIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid delivery.' };
  const admin = createAdminClient();
  const d = await loadDelivery(admin, parsed.data.id);
  if (!d) return { error: 'Delivery not found.' };
  if (!d.archived_at) return { error: 'This delivery is not archived.' };
  await admin.from('website_report_deliveries').update({ archived_at: null, archived_by: null, updated_by: actor.id }).eq('id', d.id);
  await logEvent({ action: 'report_delivery.restored', actorId: actor.id, entityType: 'report_delivery', entityId: d.id, metadata: { report_id: d.report_id }, source: 'portal' });
  revalidate(d.report_id, d.id);
  return { ok: true };
}
