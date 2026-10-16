import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { reportDeliveryStatusToken } from '@/lib/status/colors';
import {
  REPORT_DELIVERY_STATUSES,
  REPORT_DELIVERY_FOLLOW_UP_STATUSES,
  reportDeliveryDisplayStatus,
  CANCELLABLE_DELIVERY_STATUSES,
  FUNNEL_ADVANCE_TO_REPORT_SENT_FROM,
  FUNNEL_TERMINAL_STATUSES,
} from './delivery-status';
import { deliverReportSchema, deliveryIdSchema, setFollowUpSchema } from './delivery-schema';
import { renderReportPdf, reportPdfFilename } from './pdf';
import type { WebsiteReportContent } from './schema';

const root = process.cwd();
const pdfSrc = readFileSync(join(root, 'src/modules/website-reports/pdf.tsx'), 'utf8');
const deliverySrc = readFileSync(join(root, 'src/modules/website-reports/delivery.ts'), 'utf8');
const actionsSrc = readFileSync(join(root, 'src/modules/website-reports/delivery-actions.ts'), 'utf8');
const workerSrc = readFileSync(join(root, 'src/lib/outbox/worker.ts'), 'utf8');
const enqueueSrc = readFileSync(join(root, 'src/lib/outbox/enqueue.ts'), 'utf8');
const panelSrc = readFileSync(join(root, 'src/components/portal/website-reports/DeliverPanel.tsx'), 'utf8');
const tableSrc = readFileSync(join(root, 'src/components/portal/website-reports/DeliveryTable.tsx'), 'utf8');

const content: WebsiteReportContent = {
  executive_summary: 'EXEC_SUMMARY_MARKER good site.',
  scorecard: { overall: 7, seo: 6, ux: 8, conversion: 5, performance: 6, trust: 7, content: 6, mobile: 8 },
  first_impression: 'a', positioning_message: 'a', conversion_lead_generation: 'a', ux_structure: 'a',
  visual_design_impression: 'a', seo_findability: 'a', performance_technical_impression: 'a', trust_proof: 'a', mobile_impression: 'a',
  concrete_improvement_opportunities: ['Add a CTA'],
  impact_effort_recommendations: [{ title: 'Add CTA', impact: 'high', effort: 'low', rationale: 'lifts conversion' }],
  commercial_conclusion: 'Good fit.',
  internal_sales_note: 'SALES_NOTE_MARKER pitch business plan.',
};

describe('delivery status model', () => {
  it('token mapping', () => {
    expect(reportDeliveryStatusToken('queued')).toBe('draft');
    expect(reportDeliveryStatusToken('rendering')).toBe('waiting');
    expect(reportDeliveryStatusToken('sending')).toBe('waiting');
    expect(reportDeliveryStatusToken('sent')).toBe('done');
    expect(reportDeliveryStatusToken('failed')).toBe('failed');
    expect(reportDeliveryStatusToken('bounced')).toBe('revoked');
    expect(reportDeliveryStatusToken('cancelled')).toBe('cancelled');
    expect(reportDeliveryStatusToken('archived')).toBe('cancelled');
    expect(reportDeliveryStatusToken('???')).toBe('system');
  });
  it('constants + display status + funnel advance sets', () => {
    expect(REPORT_DELIVERY_STATUSES).toContain('sent');
    expect(REPORT_DELIVERY_FOLLOW_UP_STATUSES).toEqual(['none', 'planned', 'done']);
    expect(reportDeliveryDisplayStatus({ status: 'sent', archived_at: null })).toBe('sent');
    expect(reportDeliveryDisplayStatus({ status: 'sent', archived_at: '2026-01-01' })).toBe('archived');
    expect([...CANCELLABLE_DELIVERY_STATUSES].sort()).toEqual(['queued', 'rendering', 'sending']);
    for (const s of ['new', 'to_review', 'qualified', 'in_progress', 'analyzed']) expect(FUNNEL_ADVANCE_TO_REPORT_SENT_FROM.has(s)).toBe(true);
    for (const s of ['converted', 'closed_not_relevant', 'archived']) expect(FUNNEL_TERMINAL_STATUSES.has(s)).toBe(true);
  });
});

describe('delivery schemas', () => {
  it('ids must be uuid; follow-up date coerces', () => {
    const id = crypto.randomUUID();
    expect(deliverReportSchema.safeParse({ reportId: id }).success).toBe(true);
    expect(deliverReportSchema.safeParse({ reportId: 'x' }).success).toBe(false);
    expect(deliveryIdSchema.safeParse({ id }).success).toBe(true);
    const fu = setFollowUpSchema.safeParse({ id, at: '2026-12-01' });
    expect(fu.success).toBe(true);
    if (fu.success) expect(fu.data.at instanceof Date).toBe(true);
    expect(setFollowUpSchema.safeParse({ id, at: 'not-a-date' }).success).toBe(false);
  });
});

describe('PDF generation', () => {
  it('renders a valid PDF buffer + deterministic filename', async () => {
    const buf = await renderReportPdf(content, { domain: 'example.ch', websiteUrl: 'https://example.ch', generatedAt: '2026-06-12T00:00:00Z', locale: 'de' });
    expect(buf.length).toBeGreaterThan(500);
    expect(buf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(reportPdfFilename('Example.CH', '2026-06-12T00:00:00Z')).toBe('website-analysis-example.ch-2026-06-12.pdf');
  });
  it('the PDF renderer never renders the internal sales note (source)', () => {
    // the renderer must not ACCESS internal_sales_note (prose mentions in comments are fine)
    expect(pdfSrc).not.toMatch(/\.internal_sales_note|\binternal_sales_note\s*[:=]|\['internal_sales_note'\]/);
    expect(pdfSrc).toContain('executive_summary');
    expect(pdfSrc).toContain('commercial_conclusion');
  });
});

describe('outbox extension', () => {
  it('payload supports the website_report template + attachment pointer (not bytes)', () => {
    expect(enqueueSrc).toMatch(/'invite' \| 'password_reset' \| 'website_report'/);
    expect(enqueueSrc).toMatch(/OutboxEmailAttachment = \{ bucket: string; path: string; filename: string; mimeType: string \}/);
  });
  it('worker renders the report email, attaches the PDF, and reconciles the delivery — invite/reset preserved', () => {
    expect(workerSrc).toMatch(/template === 'website_report'/);
    expect(workerSrc).toContain('REPORT['); // localized report copy
    expect(workerSrc).toMatch(/storage\.from\([^)]*\)\.download/);
    expect(workerSrc).toContain('markDeliveryResult');
    // generic invite/reset path preserved
    expect(workerSrc).toMatch(/template === 'password_reset'/);
    expect(workerSrc).toMatch(/template === 'invite'/);
    expect(workerSrc).toContain('actionUrl');
    // the report email must not embed a report link / signed URL: its branch carries no CTA
    const start = workerSrc.indexOf("p.template === 'website_report'");
    const branch = workerSrc.slice(start, workerSrc.indexOf('return null', start));
    expect(branch).not.toMatch(/cta|href=|signedUrl|actionUrl/i);
  });
});

describe('delivery pipeline + worker hook (source)', () => {
  it('email carries a PDF attachment pointer, never a link/signed URL; pdf from validated json', () => {
    expect(deliverySrc).toContain("import 'server-only'");
    expect(deliverySrc).toMatch(/attachment: \{ bucket: BUCKET, path, filename, mimeType: 'application\/pdf' \}/);
    expect(deliverySrc).toMatch(/websiteReportContentSchema\.safeParse\(report\.report_json\)/);
    expect(deliverySrc).not.toMatch(/createSignedUrl|signedUrl|public:\s*true/);
  });
  it('markDeliveryResult marks sent/failed and advances the funnel forward to report_sent', () => {
    expect(deliverySrc).toMatch(/export async function markDeliveryResult/);
    expect(deliverySrc).toMatch(/status: 'sent'/);
    expect(deliverySrc).toMatch(/advanceFunnelToReportSent/);
    expect(deliverySrc).toMatch(/newStatus: 'report_sent'/);
  });
});

describe('delivery actions (source invariants)', () => {
  it('server module; gates flag + exact permissions; rate limited; approved + contact required', () => {
    expect(actionsSrc).toContain("'use server'");
    expect(actionsSrc).toMatch(/websiteReportDeliveryEnabled/);
    expect(actionsSrc).toMatch(/deliverWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.deliver'\)/);
    expect(actionsSrc).toMatch(/resendWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.deliver'\)/);
    expect(actionsSrc).toMatch(/getReportPdfSignedUrl[\s\S]*?hasPermission\('website_reports\.read'\)/);
    expect(actionsSrc).toMatch(/archiveWebsiteReportDelivery[\s\S]*?hasPermission\('website_reports\.archive'\)/);
    expect(actionsSrc).toMatch(/RL_BUCKET = 'website_report_delivery'/);
    expect(actionsSrc).toMatch(/RL_LIMIT = 10\b/);
    expect(actionsSrc).toMatch(/RL_WINDOW = 3600/);
    expect(actionsSrc).toMatch(/checkRateLimit\(RL_BUCKET, userIdentifier\(actor\.id\), RL_LIMIT, RL_WINDOW\)/);
    expect(actionsSrc).toMatch(/review_status !== 'approved'/);
    expect(actionsSrc).toMatch(/Link a contact/);
    expect(actionsSrc).toMatch(/SIGNED_URL_TTL = 300/); // staff preview is short-TTL
    expect(actionsSrc).toMatch(/createSignedUrl\(d\.pdf_path, SIGNED_URL_TTL\)/);
  });
  it('never hard-deletes; archive sets archived_at, restore clears it; no quote/project/invoice/stripe', () => {
    expect(actionsSrc).not.toMatch(/\.delete\(/);
    expect(actionsSrc).toMatch(/archived_at: new Date/);
    expect(actionsSrc).toMatch(/archived_at: null/);
    for (const src of [actionsSrc, deliverySrc]) {
      expect(src).not.toMatch(/\.from\('(quotes|projects|invoices|orders|payments|subscriptions)'\)/);
      expect(src).not.toMatch(/\/api\/checkout|stripe\./i);
    }
  });
});

describe('client components carry no secrets', () => {
  it('DeliverPanel + DeliveryTable have no service-role / Resend / AI key', () => {
    for (const src of [panelSrc, tableSrc]) {
      expect(src).not.toMatch(/createAdminClient|SERVICE_ROLE|service_role|RESEND_API_KEY|resendApiKey|ANTHROPIC_API_KEY|anthropicApiKey/);
    }
    expect(panelSrc).toContain("'use client'");
  });
});
