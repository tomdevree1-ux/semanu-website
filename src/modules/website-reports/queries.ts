import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { WEBSITE_REPORT_GENERATION_STATUSES, WEBSITE_REPORT_REVIEW_STATUSES } from './status';
import { websiteReportDisplayStatus } from './guards';
import type { WebsiteReportListRow, WebsiteReportDetail, WebsiteReportFilters } from './types';

/**
 * SERVER ONLY website-report reads (service role; callers gate with requirePermission('website_reports.read')).
 * Archived hidden by default. Sensitive raw fields (full crawl/report) are returned only on the detail view
 * for permitted staff; the list never carries them.
 */
const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

function sanitizeSearch(q: string): string {
  return q.replace(/[,%()*\\]/g, ' ').trim().slice(0, 80);
}
async function resolveCompanyNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, { name: string; archived: boolean }>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name, archived_at').in('id', unique);
  for (const r of data ?? []) map.set(r.id, { name: r.company_name || '', archived: !!r.archived_at });
  return map;
}
async function resolveContactNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, { name: string; archived: boolean }>();
  if (!unique.length) return map;
  const { data } = await admin.from('company_contacts').select('id, name, email, archived_at').in('id', unique);
  for (const r of data ?? []) map.set(r.id, { name: r.name || r.email || '', archived: !!r.archived_at });
  return map;
}
async function resolveProfileNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('profiles').select('id, full_name, email').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.full_name || r.email || '');
  return map;
}

export async function listWebsiteAnalysisReports(
  filters: WebsiteReportFilters,
): Promise<{ rows: WebsiteReportListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('website_analysis_reports')
    .select(
      'id,funnel_submission_id,version,is_current,website_url,normalized_domain,generation_status,review_status,score_overall,company_id,contact_id,created_at,archived_at',
      { count: 'exact' },
    );

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.generationStatus && (WEBSITE_REPORT_GENERATION_STATUSES as ReadonlyArray<string>).includes(filters.generationStatus)) {
    q = q.eq('generation_status', filters.generationStatus);
  }
  if (filters.reviewStatus && (WEBSITE_REPORT_REVIEW_STATUSES as ReadonlyArray<string>).includes(filters.reviewStatus)) {
    q = q.eq('review_status', filters.reviewStatus);
  }
  const s = filters.q ? sanitizeSearch(filters.q) : '';
  if (s) q = q.or(`normalized_domain.ilike.%${s}%,website_url.ilike.%${s}%`);

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [companyNames, contactNames] = await Promise.all([
    resolveCompanyNames(admin, list.map((x) => x.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, list.map((x) => x.contact_id ?? '').filter(Boolean)),
  ]);

  const rows: WebsiteReportListRow[] = list.map((x) => ({
    id: x.id,
    funnelSubmissionId: x.funnel_submission_id,
    version: x.version,
    isCurrent: x.is_current,
    websiteUrl: x.website_url,
    normalizedDomain: x.normalized_domain,
    generationStatus: x.generation_status,
    reviewStatus: x.review_status,
    displayStatus: websiteReportDisplayStatus({ generation_status: x.generation_status, review_status: x.review_status, archived_at: x.archived_at }),
    scoreOverall: x.score_overall,
    companyId: x.company_id,
    companyName: x.company_id ? companyNames.get(x.company_id)?.name || null : null,
    contactId: x.contact_id,
    contactName: x.contact_id ? contactNames.get(x.contact_id)?.name || null : null,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getWebsiteAnalysisReport(id: string): Promise<WebsiteReportDetail | null> {
  const admin = createAdminClient();
  const { data: r } = await admin.from('website_analysis_reports').select('*').eq('id', id).maybeSingle();
  if (!r) return null;

  const [company, contact, reviewer, funnel] = await Promise.all([
    r.company_id ? admin.from('companies').select('company_name, archived_at').eq('id', r.company_id).maybeSingle() : Promise.resolve({ data: null }),
    r.contact_id ? admin.from('company_contacts').select('name, email, archived_at').eq('id', r.contact_id).maybeSingle() : Promise.resolve({ data: null }),
    r.reviewed_by ? admin.from('profiles').select('full_name, email').eq('id', r.reviewed_by).maybeSingle() : Promise.resolve({ data: null }),
    admin.from('funnel_submissions').select('source_type, status').eq('id', r.funnel_submission_id).maybeSingle(),
  ]);

  return {
    id: r.id,
    funnelSubmissionId: r.funnel_submission_id,
    version: r.version,
    isCurrent: r.is_current,
    websiteUrl: r.website_url,
    normalizedDomain: r.normalized_domain,
    generationStatus: r.generation_status,
    reviewStatus: r.review_status,
    displayStatus: websiteReportDisplayStatus({ generation_status: r.generation_status, review_status: r.review_status, archived_at: r.archived_at }),
    modelProvider: r.model_provider,
    modelName: r.model_name,
    promptVersion: r.prompt_version,
    inputSnapshot: (r.input_snapshot as Record<string, unknown>) ?? {},
    crawlSnapshot: (r.crawl_snapshot as Record<string, unknown>) ?? {},
    reportJson: (r.report_json as Record<string, unknown> | null) ?? null,
    reportMarkdown: r.report_markdown,
    scores: {
      overall: r.score_overall, seo: r.score_seo, ux: r.score_ux, conversion: r.score_conversion,
      performance: r.score_performance, trust: r.score_trust, content: r.score_content, mobile: r.score_mobile,
    },
    recommendations: (r.recommendations as Array<Record<string, unknown>>) ?? [],
    internalSalesNotes: r.internal_sales_notes,
    errorSummary: r.error_summary,
    costEstimate: r.cost_estimate,
    tokenUsage: (r.token_usage as Record<string, unknown>) ?? {},
    generatedAt: r.generated_at,
    reviewedAt: r.reviewed_at,
    reviewedById: r.reviewed_by,
    reviewedByName: reviewer.data ? reviewer.data.full_name || reviewer.data.email || null : null,
    companyId: r.company_id,
    companyName: company.data?.company_name ?? null,
    companyArchived: !!company.data?.archived_at,
    contactId: r.contact_id,
    contactName: contact.data?.name ?? contact.data?.email ?? null,
    contactArchived: !!contact.data?.archived_at,
    notes: r.notes,
    internalNotes: r.internal_notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    archivedAt: r.archived_at,
    isArchived: !!r.archived_at,
    funnelSourceType: funnel.data?.source_type ?? '',
    funnelStatus: funnel.data?.status ?? '',
  };
}

/** Current (is_current) report id for a funnel submission, if any — used by the funnel detail panel. */
export async function getCurrentReportForSubmission(funnelSubmissionId: string): Promise<WebsiteReportListRow | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('website_analysis_reports')
    .select('id,funnel_submission_id,version,is_current,website_url,normalized_domain,generation_status,review_status,score_overall,company_id,contact_id,created_at,archived_at')
    .eq('funnel_submission_id', funnelSubmissionId)
    .eq('is_current', true)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id, funnelSubmissionId: data.funnel_submission_id, version: data.version, isCurrent: data.is_current,
    websiteUrl: data.website_url, normalizedDomain: data.normalized_domain,
    generationStatus: data.generation_status, reviewStatus: data.review_status,
    displayStatus: websiteReportDisplayStatus({ generation_status: data.generation_status, review_status: data.review_status, archived_at: data.archived_at }),
    scoreOverall: data.score_overall, companyId: data.company_id, companyName: null,
    contactId: data.contact_id, contactName: null, createdAt: data.created_at, archivedAt: data.archived_at,
  };
}
