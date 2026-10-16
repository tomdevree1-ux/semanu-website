import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  classifyWorklistItem,
  compareWorklist,
  summariseEngagement,
  DELIVERED_COLD_DAYS,
  type WorklistSignal,
} from './worklist-priority';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');
const prioritySrc = read('src/modules/website-reports/worklist-priority.ts');
const queriesSrc = read('src/modules/website-reports/worklist-queries.ts');
const pageSrc = read('src/app/(portal)/app/(protected)/website-reports/follow-ups/page.tsx');
const worklistSrc = read('src/components/portal/website-reports/FollowUpWorklist.tsx');
const topbarSrc = read('src/components/portal/shell/Topbar.tsx');

const NOW = Date.parse('2026-06-13T12:00:00Z');
const DAY = 86_400_000;
const base: WorklistSignal = {
  status: 'sent', sentAt: '2026-06-01T00:00:00Z', deliveredAt: null, bouncedAt: null, complainedAt: null,
  openedAt: null, clickedAt: null, followUpStatus: 'none', followUpAt: null, archivedAt: null,
};
function cls(s: Partial<WorklistSignal>, openClickEnabled = true) {
  return classifyWorklistItem({ ...base, ...s }, { openClickEnabled, nowMs: NOW });
}
const iso = (ms: number) => new Date(ms).toISOString();

describe('classifyWorklistItem — buckets + ordering', () => {
  it('bounced / complained → delivery_problem (priority 1, top)', () => {
    expect(cls({ deliveredAt: iso(NOW - DAY), bouncedAt: iso(NOW - DAY) })).toMatchObject({ bucket: 'delivery_problem', priority: 1, actionable: true });
    expect(cls({ complainedAt: iso(NOW - DAY) }).bucket).toBe('delivery_problem');
    // a bounce outranks a due follow-up
    expect(cls({ bouncedAt: iso(NOW), followUpStatus: 'planned', followUpAt: iso(NOW - DAY) }).bucket).toBe('delivery_problem');
  });
  it('planned follow-up that is due → follow_up_due (priority 2); future planned → none', () => {
    expect(cls({ followUpStatus: 'planned', followUpAt: iso(NOW - DAY) })).toMatchObject({ bucket: 'follow_up_due', priority: 2 });
    expect(cls({ followUpStatus: 'planned', followUpAt: iso(NOW + DAY) }).bucket).toBe('none');
  });
  it('clicked → priority 3 and beats opened', () => {
    expect(cls({ deliveredAt: iso(NOW - DAY), openedAt: iso(NOW - DAY), clickedAt: iso(NOW - DAY) })).toMatchObject({ bucket: 'clicked', priority: 3 });
  });
  it('opened, no follow-up → priority 4', () => {
    expect(cls({ deliveredAt: iso(NOW - DAY), openedAt: iso(NOW - DAY) })).toMatchObject({ bucket: 'opened_no_follow_up', priority: 4 });
  });
  it('delivered, not opened, older than the cold threshold → delivered_cold (priority 5)', () => {
    expect(cls({ deliveredAt: iso(NOW - (DELIVERED_COLD_DAYS + 1) * DAY) })).toMatchObject({ bucket: 'delivered_cold', priority: 5 });
    expect(cls({ deliveredAt: iso(NOW - 1 * DAY) }).bucket).toBe('none'); // still fresh
    expect(cls({ deliveredAt: iso(NOW - 10 * DAY), openedAt: iso(NOW - 9 * DAY) }).bucket).toBe('opened_no_follow_up'); // opened → not cold
  });
  it('done follow-up or archived → none (never actionable)', () => {
    expect(cls({ bouncedAt: iso(NOW), followUpStatus: 'done' }).bucket).toBe('none');
    expect(cls({ bouncedAt: iso(NOW), archivedAt: iso(NOW) }).bucket).toBe('none');
  });
  it('compareWorklist orders by priority then oldest-sent first', () => {
    const rows = [
      { priority: 5, sentAt: '2026-06-05T00:00:00Z', deliveredAt: null },
      { priority: 1, sentAt: '2026-06-02T00:00:00Z', deliveredAt: null },
      { priority: 1, sentAt: '2026-06-01T00:00:00Z', deliveredAt: null },
    ];
    const sorted = [...rows].sort(compareWorklist);
    expect(sorted.map((r) => `${r.priority}:${r.sentAt.slice(8, 10)}`)).toEqual(['1:01', '1:02', '5:05']);
  });
});

describe('classifyWorklistItem — open/click privacy gating (P16 rule)', () => {
  it('tracking off + no value → open/click buckets suppressed', () => {
    expect(cls({ deliveredAt: iso(NOW - DAY) }, false).bucket).toBe('none'); // fresh, no signals
  });
  it('tracking off + value already exists → still surfaced', () => {
    expect(cls({ deliveredAt: iso(NOW - DAY), openedAt: iso(NOW - DAY) }, false).bucket).toBe('opened_no_follow_up');
    expect(cls({ deliveredAt: iso(NOW - DAY), clickedAt: iso(NOW - DAY) }, false).bucket).toBe('clicked');
  });
});

describe('summariseEngagement — counts, rates, divide-by-zero', () => {
  const row = (o: Partial<{ d: boolean; o: boolean; c: boolean; b: boolean; sp: boolean }>) => ({
    deliveredAt: o.d ? 'x' : null, openedAt: o.o ? 'x' : null, clickedAt: o.c ? 'x' : null, bouncedAt: o.b ? 'x' : null, complainedAt: o.sp ? 'x' : null,
  });
  it('empty set → all zero, no divide-by-zero', () => {
    const s = summariseEngagement([], { openClickEnabled: true });
    expect(s).toMatchObject({ total: 0, delivered: 0, openRate: 0, bounceRate: 0, complaintRate: 0 });
  });
  it('counts + one-decimal rates', () => {
    const rows = [row({ d: true, o: true }), row({ d: true, o: true, c: true }), row({ d: true }), row({ b: true })];
    const s = summariseEngagement(rows, { openClickEnabled: true });
    expect(s).toMatchObject({ total: 4, delivered: 3, opened: 2, clicked: 1, bounced: 1 });
    expect(s.openRate).toBeCloseTo(66.7, 1); // 2/3
    expect(s.clickRate).toBeCloseTo(33.3, 1); // 1/3
    expect(s.bounceRate).toBe(25); // 1/4
  });
  it('openRate is 0 when nothing delivered (no divide-by-zero)', () => {
    const s = summariseEngagement([row({ b: true })], { openClickEnabled: true });
    expect(s.delivered).toBe(0);
    expect(s.openRate).toBe(0);
  });
  it('openClickVisible: gated off by default, on when enabled OR any value exists', () => {
    expect(summariseEngagement([row({ d: true })], { openClickEnabled: false }).openClickVisible).toBe(false);
    expect(summariseEngagement([row({ d: true, o: true })], { openClickEnabled: false }).openClickVisible).toBe(true);
    expect(summariseEngagement([row({ d: true })], { openClickEnabled: true }).openClickVisible).toBe(true);
  });
});

describe('read-only + boundary invariants (source)', () => {
  it('the pure module + queries never write or touch CRM/funnel/billing/outbound', () => {
    for (const src of [prioritySrc, queriesSrc]) {
      expect(src).not.toMatch(/\.update\(|\.insert\(|\.delete\(|\.upsert\(/);
      expect(src).not.toMatch(/enqueueEmail|sendViaResend|api\.resend\.com|\/api\/checkout|stripe\./i);
      expect(src).not.toMatch(/report_sent|advanceFunnel|follow_up_planned/);
      expect(src).not.toMatch(/\.from\('(funnel_submissions|orders|payments|subscriptions|quotes|projects|invoices)'\)/);
    }
  });
  it('queries module is server-only and reads only website_report_deliveries (+ name lookups)', () => {
    expect(queriesSrc).toContain("import 'server-only'");
    expect(queriesSrc).toMatch(/\.from\('website_report_deliveries'\)[\s\S]*\.select\(/);
    expect(queriesSrc).not.toMatch(/markDeliveryResult|runDeliveryPipeline|applyResendEvent/); // P15/P16 paths untouched
  });
  it('no IP / user-agent / raw payload is read here', () => {
    for (const src of [prioritySrc, queriesSrc]) {
      expect(src).not.toMatch(/ip_address|ipAddress|user_agent|userAgent|raw_payload/);
    }
  });
});

describe('page gating + client-boundary (source)', () => {
  it('page gates read permission + the flag, and derives canDeliver from website_reports.deliver', () => {
    expect(pageSrc).toMatch(/requirePermission\('website_reports\.read'\)/);
    expect(pageSrc).toMatch(/env\.enableFollowUpWorklist/);
    // canDeliver is gated on website_reports.deliver via the request-cached
    // permission set (getUserPermissions) instead of a per-call has_permission RPC.
    expect(pageSrc).toMatch(/getUserPermissions\(\)/);
    expect(pageSrc).toMatch(/includes\('website_reports\.deliver'\)/);
    expect(pageSrc).not.toMatch(/\.update\(|\.insert\(|createAdminClient/);
  });
  it('worklist client component reuses ONLY the P15 follow-up actions and carries no secrets', () => {
    expect(worklistSrc).toContain("'use client'");
    expect(worklistSrc).toMatch(/setWebsiteReportFollowUp/);
    expect(worklistSrc).toMatch(/clearWebsiteReportFollowUp/);
    expect(worklistSrc).not.toMatch(/deliverWebsiteAnalysisReport|resendWebsiteAnalysisReport|archiveWebsiteReportDelivery|getReportPdfSignedUrl/);
    expect(worklistSrc).not.toMatch(/createAdminClient|SERVICE_ROLE|service_role|RESEND_API_KEY|resendApiKey|RESEND_WEBHOOK_SECRET|resendWebhookSecret|ANTHROPIC_API_KEY|stripe/i);
    expect(worklistSrc).not.toMatch(/\.from\(|\.update\(|\.insert\(/); // no direct DB access in the client
  });
});

describe('navigation regression (Topbar source)', () => {
  it('adds the flag-gated Follow-ups link without removing Reports/Deliveries', () => {
    expect(topbarSrc).toMatch(/\/app\/website-reports\/follow-ups/);
    expect(topbarSrc).toMatch(/env\.enableFollowUpWorklist/);
    expect(topbarSrc).toMatch(/\/app\/website-reports\/deliveries/);
    expect(topbarSrc).toMatch(/href="\/app\/website-reports"/);
  });
});
