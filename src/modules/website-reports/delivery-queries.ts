import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { REPORT_DELIVERY_STATUSES, reportDeliveryDisplayStatus } from './delivery-status';
import type { DeliveryListRow, DeliveryDetail, DeliveryFilters } from './delivery-types';

/**
 * SERVER ONLY delivery reads (service role; callers gate with requirePermission('website_reports.read')).
 * Archived hidden by default. The PDF bytes are never returned; staff preview goes through a signed URL action.
 */
const PAGE_SIZE = 25;
type Admin = ReturnType<typeof createAdminClient>;

async function resolveDomains(admin: Admin, reportIds: string[]) {
  const unique = [...new Set(reportIds.filter(Boolean))];
  const map = new Map<string, string | null>();
  if (!unique.length) return map;
  const { data } = await admin.from('website_analysis_reports').select('id, normalized_domain').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.normalized_domain);
  return map;
}
async function resolveCompanyNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('companies').select('id, company_name').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.company_name || '');
  return map;
}
async function resolveContactNames(admin: Admin, ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))];
  const map = new Map<string, string>();
  if (!unique.length) return map;
  const { data } = await admin.from('company_contacts').select('id, name, email').in('id', unique);
  for (const r of data ?? []) map.set(r.id, r.name || r.email || '');
  return map;
}

export async function listWebsiteReportDeliveries(
  filters: DeliveryFilters,
): Promise<{ rows: DeliveryListRow[]; total: number; page: number; pageSize: number }> {
  const admin = createAdminClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let q = admin
    .from('website_report_deliveries')
    .select('id,report_id,funnel_submission_id,to_email,status,company_id,contact_id,follow_up_status,follow_up_at,sent_at,created_at,archived_at,delivered_at,bounced_at,complained_at,first_opened_at,opened_at,clicked_at,open_count,click_count,last_event_at,bounce_type', { count: 'exact' });

  if (!filters.showArchived) q = q.is('archived_at', null);
  if (filters.status && (REPORT_DELIVERY_STATUSES as ReadonlyArray<string>).includes(filters.status)) q = q.eq('status', filters.status);
  if (filters.followUpDue) q = q.eq('follow_up_status', 'planned').lte('follow_up_at', new Date().toISOString());

  q = q.order('created_at', { ascending: false }).range(from, to);
  const { data, count } = await q;
  const list = data ?? [];

  const [domains, companies, contacts] = await Promise.all([
    resolveDomains(admin, list.map((x) => x.report_id)),
    resolveCompanyNames(admin, list.map((x) => x.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, list.map((x) => x.contact_id ?? '').filter(Boolean)),
  ]);

  const rows: DeliveryListRow[] = list.map((x) => ({
    id: x.id,
    reportId: x.report_id,
    funnelSubmissionId: x.funnel_submission_id,
    toEmail: x.to_email,
    status: x.status,
    displayStatus: reportDeliveryDisplayStatus({ status: x.status, archived_at: x.archived_at }),
    domain: domains.get(x.report_id) ?? null,
    companyName: x.company_id ? companies.get(x.company_id) || null : null,
    contactName: x.contact_id ? contacts.get(x.contact_id) || null : null,
    followUpStatus: x.follow_up_status,
    followUpAt: x.follow_up_at,
    sentAt: x.sent_at,
    createdAt: x.created_at,
    archivedAt: x.archived_at,
    engagement: mapEngagement(x),
  }));

  return { rows, total: count ?? rows.length, page, pageSize: PAGE_SIZE };
}

export async function getWebsiteReportDelivery(id: string): Promise<DeliveryDetail | null> {
  const admin = createAdminClient();
  const { data: d } = await admin.from('website_report_deliveries').select('*').eq('id', id).maybeSingle();
  if (!d) return null;
  return mapDetail(d);
}

export async function getLatestDeliveryForReport(reportId: string): Promise<DeliveryDetail | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('website_report_deliveries')
    .select('*')
    .eq('report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return mapDetail(data);
}

function mapDetail(d: Record<string, unknown>): DeliveryDetail {
  const r = d as {
    id: string; report_id: string; funnel_submission_id: string; contact_id: string | null; company_id: string | null;
    to_email: string; status: string; error_summary: string | null; subject: string | null;
    pdf_bucket: string | null; pdf_path: string | null; pdf_size_bytes: number | null;
    outbox_id: string | null; provider_message_id: string | null; sent_at: string | null; failed_at: string | null;
    follow_up_at: string | null; follow_up_status: string; notes: string | null;
    created_at: string; updated_at: string; archived_at: string | null;
    delivered_at: string | null; bounced_at: string | null; complained_at: string | null;
    first_opened_at: string | null; opened_at: string | null; clicked_at: string | null;
    open_count: number | null; click_count: number | null; last_event_at: string | null; bounce_type: string | null;
  };
  return {
    id: r.id, reportId: r.report_id, funnelSubmissionId: r.funnel_submission_id, contactId: r.contact_id, companyId: r.company_id,
    toEmail: r.to_email, status: r.status, displayStatus: reportDeliveryDisplayStatus({ status: r.status, archived_at: r.archived_at }),
    errorSummary: r.error_summary, subject: r.subject, pdfBucket: r.pdf_bucket, pdfPath: r.pdf_path, pdfSizeBytes: r.pdf_size_bytes,
    outboxId: r.outbox_id, providerMessageId: r.provider_message_id, sentAt: r.sent_at, failedAt: r.failed_at,
    followUpAt: r.follow_up_at, followUpStatus: r.follow_up_status, notes: r.notes,
    createdAt: r.created_at, updatedAt: r.updated_at, archivedAt: r.archived_at, isArchived: !!r.archived_at,
    engagement: mapEngagement(r),
  };
}

/** Map the engagement columns (P16) into the view shape. Tolerates null counts (legacy rows). */
function mapEngagement(r: {
  delivered_at: string | null; bounced_at: string | null; complained_at: string | null;
  first_opened_at: string | null; opened_at: string | null; clicked_at: string | null;
  open_count: number | null; click_count: number | null; last_event_at: string | null; bounce_type: string | null;
}) {
  return {
    deliveredAt: r.delivered_at, bouncedAt: r.bounced_at, complainedAt: r.complained_at,
    firstOpenedAt: r.first_opened_at, openedAt: r.opened_at, openCount: r.open_count ?? 0,
    clickedAt: r.clicked_at, clickCount: r.click_count ?? 0, lastEventAt: r.last_event_at, bounceType: r.bounce_type,
  };
}
