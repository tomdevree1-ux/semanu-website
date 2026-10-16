import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { reportDeliveryDisplayStatus } from './delivery-status';
import {
  classifyWorklistItem,
  compareWorklist,
  summariseEngagement,
  type WorklistBucket,
  type EngagementInsights,
} from './worklist-priority';
import type { EngagementView } from '@/components/portal/website-reports/EngagementSummary';

/**
 * SERVER ONLY, READ-ONLY follow-up worklist reads (P17 / WAF-3.2). Callers gate with
 * requirePermission('website_reports.read'). Computes the engagement-prioritised worklist + a compact insights
 * summary purely from existing P15 + P16 columns on website_report_deliveries — it performs NO writes, touches
 * NO CRM/funnel/billing table, and changes no funnel status. The PDF/bytes/secret are never read here.
 */
const SCAN_LIMIT = 500;
type Admin = ReturnType<typeof createAdminClient>;

export type WorklistItem = {
  deliveryId: string;
  reportId: string;
  funnelSubmissionId: string;
  toEmail: string;
  domain: string | null;
  companyName: string | null;
  contactName: string | null;
  deliveryStatus: string;
  displayStatus: string;
  bucket: WorklistBucket;
  reason: string;
  priority: number;
  followUpStatus: string;
  followUpAt: string | null;
  engagement: EngagementView;
};

export type FollowUpWorklist = { items: WorklistItem[]; insights: EngagementInsights; scanned: number };

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

/**
 * Build the actionable follow-up worklist + insights over the most-recent non-archived deliveries. One read;
 * classification + sorting + summarising are pure (worklist-priority.ts). An optional `bucket` filter narrows
 * the list. Open/click are surfaced per the P16 rule (value present, gated by `openClickEnabled`).
 */
export async function getFollowUpWorklist(opts: { openClickEnabled: boolean; bucket?: string }): Promise<FollowUpWorklist> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('website_report_deliveries')
    .select(
      'id,report_id,funnel_submission_id,company_id,contact_id,to_email,status,sent_at,delivered_at,bounced_at,complained_at,first_opened_at,opened_at,open_count,clicked_at,click_count,last_event_at,bounce_type,follow_up_status,follow_up_at,archived_at,created_at',
    )
    .is('archived_at', null)
    .order('created_at', { ascending: false })
    .limit(SCAN_LIMIT);
  const rows = data ?? [];
  const nowMs = Date.now();

  const insights = summariseEngagement(
    rows.map((r) => ({
      deliveredAt: r.delivered_at,
      openedAt: r.opened_at,
      clickedAt: r.clicked_at,
      bouncedAt: r.bounced_at,
      complainedAt: r.complained_at,
    })),
    { openClickEnabled: opts.openClickEnabled },
  );

  type Row = (typeof rows)[number];
  const actionable: Array<{ row: Row; bucket: WorklistBucket; reason: string; priority: number }> = [];
  for (const r of rows) {
    const cls = classifyWorklistItem(
      {
        status: r.status,
        sentAt: r.sent_at,
        deliveredAt: r.delivered_at,
        bouncedAt: r.bounced_at,
        complainedAt: r.complained_at,
        openedAt: r.opened_at,
        clickedAt: r.clicked_at,
        followUpStatus: r.follow_up_status,
        followUpAt: r.follow_up_at,
        archivedAt: r.archived_at,
      },
      { openClickEnabled: opts.openClickEnabled, nowMs },
    );
    if (!cls.actionable) continue;
    if (opts.bucket && opts.bucket !== cls.bucket) continue;
    actionable.push({ row: r, bucket: cls.bucket, reason: cls.reason, priority: cls.priority });
  }
  actionable.sort((a, b) =>
    compareWorklist(
      { priority: a.priority, sentAt: a.row.sent_at, deliveredAt: a.row.delivered_at },
      { priority: b.priority, sentAt: b.row.sent_at, deliveredAt: b.row.delivered_at },
    ),
  );

  const [domains, companies, contacts] = await Promise.all([
    resolveDomains(admin, actionable.map((a) => a.row.report_id)),
    resolveCompanyNames(admin, actionable.map((a) => a.row.company_id ?? '').filter(Boolean)),
    resolveContactNames(admin, actionable.map((a) => a.row.contact_id ?? '').filter(Boolean)),
  ]);

  const items: WorklistItem[] = actionable.map(({ row: r, bucket, reason, priority }) => ({
    deliveryId: r.id,
    reportId: r.report_id,
    funnelSubmissionId: r.funnel_submission_id,
    toEmail: r.to_email,
    domain: domains.get(r.report_id) ?? null,
    companyName: r.company_id ? companies.get(r.company_id) || null : null,
    contactName: r.contact_id ? contacts.get(r.contact_id) || null : null,
    deliveryStatus: r.status,
    displayStatus: reportDeliveryDisplayStatus({ status: r.status, archived_at: r.archived_at }),
    bucket,
    reason,
    priority,
    followUpStatus: r.follow_up_status,
    followUpAt: r.follow_up_at,
    engagement: {
      deliveredAt: r.delivered_at,
      bouncedAt: r.bounced_at,
      complainedAt: r.complained_at,
      firstOpenedAt: r.first_opened_at,
      openedAt: r.opened_at,
      openCount: r.open_count ?? 0,
      clickedAt: r.clicked_at,
      clickCount: r.click_count ?? 0,
      lastEventAt: r.last_event_at,
      bounceType: r.bounce_type,
    },
  }));

  return { items, insights, scanned: rows.length };
}
