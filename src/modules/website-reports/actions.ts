'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/types/database';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { checkRateLimit, userIdentifier } from '@/lib/security/ratelimit';
import { logEvent } from '@/lib/audit/log';
import { env } from '@/lib/env';
import {
  generateReportSchema,
  reviewReportSchema,
  reportNotesSchema,
  reportIdSchema,
  type WebsiteReportActionState,
} from './schema';
import { reportIsArchivable } from './guards';
import { runReportPipeline } from './generate';
import type { ReportInputContext, WebsiteReport } from './types';

/**
 * SERVER actions for website analysis reports (P14, portal). Every action: requires the feature flag where
 * relevant, gates on the exact `website_reports.*` permission, writes via the service role, audits, and
 * revalidates. Generation requires a `website_analysis` submission with a linked contact, or an admin-only
 * audited override (admin = the only role holding `website_reports.archive`). Reports are versioned and soft
 * archived; never hard-deleted. No checkout/Stripe/CRM-field mutation.
 */
const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
const DISABLED = 'Website report generation is disabled.';
const RATE_LIMITED = 'Too many report generations recently. Please wait a while before trying again.';
type Admin = ReturnType<typeof createAdminClient>;

/**
 * Actor-scoped generation throttle (cost protection). ONE shared bucket for generate + retry +
 * regenerate, since every one of those can trigger a website fetch + an AI call: max 8 attempts per
 * authenticated user per hour (conservative). Fails OPEN (a limiter outage never blocks legitimate work).
 * Checked after auth + permission + input parse, and BEFORE any report row insert / website fetch / AI call.
 */
const RL_BUCKET = 'website_reports';
const RL_LIMIT = 8;
const RL_WINDOW_SECONDS = 3600;
async function withinGenerationRateLimit(actorId: string): Promise<boolean> {
  return (await checkRateLimit(RL_BUCKET, userIdentifier(actorId), RL_LIMIT, RL_WINDOW_SECONDS)).allowed;
}

function revalidate(reportId?: string, funnelId?: string) {
  revalidatePath('/app/website-reports');
  if (reportId) revalidatePath(`/app/website-reports/${reportId}`);
  if (funnelId) revalidatePath(`/app/funnels/${funnelId}`);
}
function localeOf(v: string | null): 'de' | 'fr' | 'en' {
  return v === 'fr' || v === 'en' ? v : 'de';
}
async function loadReport(admin: Admin, id: string): Promise<WebsiteReport | null> {
  const { data } = await admin.from('website_analysis_reports').select('*').eq('id', id).maybeSingle();
  return data;
}
async function rebuildContext(admin: Admin, report: WebsiteReport): Promise<ReportInputContext | null> {
  const snap = report.input_snapshot as Record<string, unknown> | null;
  if (snap && typeof snap === 'object' && typeof snap.website_url === 'string' && typeof snap.locale === 'string') {
    return snap as unknown as ReportInputContext;
  }
  const { data: f } = await admin
    .from('funnel_submissions')
    .select('website_url, normalized_domain, first_name, last_name, email, payload, locale, company_id, contact_id')
    .eq('id', report.funnel_submission_id)
    .maybeSingle();
  if (!f || !f.website_url) return null;
  return {
    website_url: f.website_url,
    normalized_domain: f.normalized_domain,
    locale: localeOf(f.locale),
    funnel: { first_name: f.first_name, last_name: f.last_name, email: f.email, payload: (f.payload as Record<string, unknown>) ?? {} },
    company: f.company_id ? { name: null } : null,
    contact: f.contact_id ? { name: null } : null,
  };
}

// ── generate (new version) ───────────────────────────────────────────────────────
export async function generateWebsiteAnalysisReport(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!env.websiteReportsEnabled) return { error: DISABLED };
  if (!(await hasPermission('website_reports.generate'))) return { error: NOT_ALLOWED };

  const overrideRaw = formData.get('overrideNoContact');
  const parsed = generateReportSchema.safeParse({
    funnelSubmissionId: formData.get('funnelSubmissionId'),
    overrideNoContact: overrideRaw === 'on' || overrideRaw === 'true',
    overrideReason: formData.get('overrideReason'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const { funnelSubmissionId, overrideNoContact, overrideReason } = parsed.data;

  // Cost protection: throttle per actor BEFORE any DB insert / website fetch / AI call.
  if (!(await withinGenerationRateLimit(actor.id))) return { error: RATE_LIMITED };

  const admin = createAdminClient();
  const { data: funnel } = await admin
    .from('funnel_submissions')
    .select('id, source_type, status, website_url, normalized_domain, first_name, last_name, email, payload, locale, company_id, contact_id')
    .eq('id', funnelSubmissionId)
    .maybeSingle();
  if (!funnel) return { error: 'Submission not found.' };
  if (funnel.source_type !== 'website_analysis') return { error: 'Reports can only be generated for website analysis submissions.' };
  if (!funnel.website_url) return { error: 'This submission has no website URL to analyse.' };

  let usedOverride = false;
  if (!funnel.contact_id) {
    if (!overrideNoContact) return { error: 'Link or create a contact for this submission before generating a report.' };
    if (!(await hasPermission('website_reports.archive'))) return { error: 'Only an admin can override the contact requirement.' };
    if (!overrideReason || !overrideReason.trim()) return { error: 'An override reason is required.' };
    usedOverride = true;
  }

  const [companyName, contactName] = await Promise.all([
    funnel.company_id
      ? admin.from('companies').select('company_name').eq('id', funnel.company_id).maybeSingle().then((r) => r.data?.company_name ?? null)
      : Promise.resolve(null),
    funnel.contact_id
      ? admin.from('company_contacts').select('name, email').eq('id', funnel.contact_id).maybeSingle().then((r) => (r.data ? r.data.name || r.data.email : null))
      : Promise.resolve(null),
  ]);

  const context: ReportInputContext = {
    website_url: funnel.website_url,
    normalized_domain: funnel.normalized_domain,
    locale: localeOf(funnel.locale),
    funnel: { first_name: funnel.first_name, last_name: funnel.last_name, email: funnel.email, payload: (funnel.payload as Record<string, unknown>) ?? {} },
    company: funnel.company_id ? { name: companyName } : null,
    contact: funnel.contact_id ? { name: contactName } : null,
  };

  // next version + flip the prior current row (partial unique allows one is_current per submission)
  const { data: existing } = await admin
    .from('website_analysis_reports')
    .select('version')
    .eq('funnel_submission_id', funnelSubmissionId)
    .order('version', { ascending: false })
    .limit(1);
  const nextVersion = (existing && existing[0]?.version ? existing[0].version : 0) + 1;
  await admin.from('website_analysis_reports').update({ is_current: false }).eq('funnel_submission_id', funnelSubmissionId).eq('is_current', true);

  const { data: row, error } = await admin
    .from('website_analysis_reports')
    .insert({
      funnel_submission_id: funnelSubmissionId,
      version: nextVersion,
      is_current: true,
      company_id: funnel.company_id,
      contact_id: funnel.contact_id,
      website_url: funnel.website_url,
      normalized_domain: funnel.normalized_domain,
      generation_status: 'queued',
      review_status: 'review_needed',
      input_snapshot: context as unknown as Json,
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('*')
    .single();
  if (error || !row) return { error: GENERIC };

  await logEvent({
    action: 'website_report.generation_requested', actorId: actor.id, entityType: 'website_report', entityId: row.id,
    metadata: { domain: funnel.normalized_domain, version: nextVersion, override: usedOverride, ...(usedOverride && overrideReason ? { override_reason: overrideReason } : {}) },
    source: 'portal',
  });

  await runReportPipeline(row, context);
  revalidate(row.id, funnelSubmissionId);
  return { ok: true, id: row.id };
}

// ── retry (pre-success only) ──────────────────────────────────────────────────────
export async function retryWebsiteAnalysisReport(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!env.websiteReportsEnabled) return { error: DISABLED };
  if (!(await hasPermission('website_reports.generate'))) return { error: NOT_ALLOWED };
  const parsed = reportIdSchema.safeParse({ id: formData.get('id') });
  if (!parsed.success) return { error: 'Invalid report.' };

  // Cost protection: same shared per-actor throttle as generation, BEFORE any fetch / AI call.
  if (!(await withinGenerationRateLimit(actor.id))) return { error: RATE_LIMITED };

  const admin = createAdminClient();
  const report = await loadReport(admin, parsed.data.id);
  if (!report) return { error: 'Report not found.' };
  if (report.archived_at) return { error: 'Restore the report before retrying.' };
  if (report.generation_status === 'succeeded') return { error: 'This report already succeeded. Use Generate to create a new version.' };

  const context = await rebuildContext(admin, report);
  if (!context) return { error: 'The submission is no longer available.' };

  await admin.from('website_analysis_reports').update({ generation_status: 'queued', error_summary: null, updated_by: actor.id }).eq('id', report.id);
  await logEvent({
    action: 'website_report.generation_requested', actorId: actor.id, entityType: 'website_report', entityId: report.id,
    metadata: { domain: report.normalized_domain, retry: true }, source: 'portal',
  });

  await runReportPipeline({ ...report, created_by: report.created_by ?? actor.id }, context);
  revalidate(report.id, report.funnel_submission_id);
  return { ok: true, id: report.id };
}

// ── review (approve / reject) ─────────────────────────────────────────────────────
export async function reviewWebsiteAnalysisReport(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.review'))) return { error: NOT_ALLOWED };
  const parsed = reviewReportSchema.safeParse({ id: formData.get('id'), decision: formData.get('decision') });
  if (!parsed.success) return { error: 'Invalid input.' };

  const admin = createAdminClient();
  const report = await loadReport(admin, parsed.data.id);
  if (!report) return { error: 'Report not found.' };
  if (report.archived_at) return { error: 'This report is archived.' };
  if (report.generation_status !== 'succeeded') return { error: 'Only a generated report can be reviewed.' };

  await admin
    .from('website_analysis_reports')
    .update({ review_status: parsed.data.decision, reviewed_at: new Date().toISOString(), reviewed_by: actor.id, updated_by: actor.id })
    .eq('id', report.id);
  await logEvent({
    action: 'website_report.reviewed', actorId: actor.id, entityType: 'website_report', entityId: report.id,
    oldStatus: report.review_status, newStatus: parsed.data.decision, metadata: { decision: parsed.data.decision }, source: 'portal',
  });
  await logEvent({
    action: parsed.data.decision === 'approved' ? 'website_report.approved' : 'website_report.rejected',
    actorId: actor.id, entityType: 'website_report', entityId: report.id,
    severity: parsed.data.decision === 'approved' ? 'info' : 'warning', metadata: {}, source: 'portal',
  });
  revalidate(report.id, report.funnel_submission_id);
  return { ok: true };
}

// ── notes ──────────────────────────────────────────────────────────────────────────
export async function updateWebsiteAnalysisReportNotes(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.review'))) return { error: NOT_ALLOWED };
  const parsed = reportNotesSchema.safeParse({
    id: formData.get('id'),
    notes: formData.get('notes'),
    internalNotes: formData.get('internalNotes'),
    internalSalesNotes: formData.get('internalSalesNotes'),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const admin = createAdminClient();
  const report = await loadReport(admin, parsed.data.id);
  if (!report) return { error: 'Report not found.' };

  await admin
    .from('website_analysis_reports')
    .update({
      notes: parsed.data.notes ?? null,
      internal_notes: parsed.data.internalNotes ?? null,
      internal_sales_notes: parsed.data.internalSalesNotes ?? null,
      updated_by: actor.id,
    })
    .eq('id', report.id);
  revalidate(report.id, report.funnel_submission_id);
  return { ok: true };
}

// ── archive / restore ────────────────────────────────────────────────────────────
export async function archiveWebsiteAnalysisReport(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };
  const admin = createAdminClient();
  const report = await loadReport(admin, id);
  if (!report) return { error: 'Report not found.' };
  if (!reportIsArchivable(report.archived_at)) return { ok: true };

  await admin.from('website_analysis_reports').update({ archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id }).eq('id', id);
  await logEvent({ action: 'website_report.archived', actorId: actor.id, severity: 'warning', entityType: 'website_report', entityId: id, metadata: {}, source: 'portal' });
  revalidate(id, report.funnel_submission_id);
  return { ok: true };
}

export async function restoreWebsiteAnalysisReport(_prev: WebsiteReportActionState, formData: FormData): Promise<WebsiteReportActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('website_reports.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('id') ?? '');
  if (!id) return { error: GENERIC };
  const admin = createAdminClient();
  const report = await loadReport(admin, id);
  if (!report) return { error: 'Report not found.' };
  if (!report.archived_at) return { error: 'This report is not archived.' };

  await admin.from('website_analysis_reports').update({ archived_at: null, archived_by: null, updated_by: actor.id }).eq('id', id);
  await logEvent({ action: 'website_report.restored', actorId: actor.id, entityType: 'website_report', entityId: id, metadata: {}, source: 'portal' });
  revalidate(id, report.funnel_submission_id);
  return { ok: true };
}
