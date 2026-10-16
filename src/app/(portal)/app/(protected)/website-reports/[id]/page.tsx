import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { env } from '@/lib/env';
import { getWebsiteAnalysisReport } from '@/modules/website-reports/queries';
import { formatScore, formatCost, websiteReportStatusLabel } from '@/modules/website-reports/format';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { WebsiteReportDetailActions } from '@/components/portal/website-reports/WebsiteReportDetailActions';
import { DeliverPanel } from '@/components/portal/website-reports/DeliverPanel';
import { getLatestDeliveryForReport } from '@/modules/website-reports/delivery-queries';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}
function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="break-words text-ink">{value || '—'}</dd>
    </div>
  );
}
function ScoreRow({ label, value }: { label: string; value: number | null }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, value * 10));
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 text-sm text-ink-soft">{label}</span>
      <span className="h-2 flex-1 overflow-hidden rounded-pill bg-ink/10">
        <span className="block h-full rounded-pill bg-red" style={{ width: `${pct}%` }} />
      </span>
      <span className="w-10 shrink-0 text-right text-sm text-ink">{formatScore(value)}</span>
    </div>
  );
}

export default async function WebsiteReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('website_reports.read');
  const { id } = await params;
  const report = await getWebsiteAnalysisReport(id);
  if (!report) notFound();

  const [permKeys, latestDelivery, rows] = await Promise.all([
    getUserPermissions(),
    getLatestDeliveryForReport(id),
    getHistory('website_report', id, 80, 0),
  ]);
  const canGenerate = permKeys.includes('website_reports.generate');
  const canReview = permKeys.includes('website_reports.review');
  const canArchive = permKeys.includes('website_reports.archive');
  const canTech = permKeys.includes('audit.read_technical');
  const canDeliver = permKeys.includes('website_reports.deliver');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('website_report', id, 80);
    technical = {};
    for (const r of raw) {
      technical[r.id] = {
        metadata: r.metadata,
        old_values: r.old_values,
        new_values: r.new_values,
        ip_address: r.ip_address,
        user_agent: r.user_agent,
      };
    }
  }

  const crawl = report.crawlSnapshot as {
    title?: string; meta_description?: string; http_status?: number; final_url?: string;
    counts?: { images?: number; links?: number; forms?: number };
    has_viewport?: boolean; has_og?: boolean; detected_language?: string;
  };
  const recs = report.recommendations as Array<{ title?: string; impact?: string; effort?: string; rationale?: string }>;
  const usage = report.tokenUsage as { input?: number; output?: number; total?: number };

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/website-reports" className="text-sm text-red hover:underline">
        ← Back to website reports
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge entityType="website_report" status={report.displayStatus} label={websiteReportStatusLabel(report.displayStatus)} size="md" />
            <span className="text-xs text-ink-soft">v{report.version}{report.isCurrent ? ' · current' : ''}</span>
          </div>
          <h1 className="mt-1 break-words page-title">{report.normalizedDomain || report.websiteUrl}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <Link href={`/app/funnels/${report.funnelSubmissionId}`} className="text-red hover:underline">source submission</Link>
            {report.companyId ? (
              <span>· <Link href={`/app/companies/${report.companyId}`} className="text-red hover:underline">{report.companyName || 'company'}</Link>{report.companyArchived ? ' (archived)' : ''}</span>
            ) : <span>· no company</span>}
            {report.contactId ? (
              <span>· <Link href={`/app/contacts/${report.contactId}`} className="text-red hover:underline">{report.contactName || 'contact'}</Link>{report.contactArchived ? ' (archived)' : ''}</span>
            ) : <span>· no contact</span>}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Report history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Created {fmt(report.createdAt)}</div>
        <div>Generated {fmt(report.generatedAt)}</div>
        <div>Reviewed {fmt(report.reviewedAt)}</div>
        <div>Cost {formatCost(report.costEstimate)}</div>
      </div>

      {/* Scorecard */}
      {report.generationStatus === 'succeeded' ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Scorecard</h2>
          <div className="mt-3 space-y-2">
            <ScoreRow label="Overall" value={report.scores.overall} />
            <ScoreRow label="SEO" value={report.scores.seo} />
            <ScoreRow label="UX" value={report.scores.ux} />
            <ScoreRow label="Conversion" value={report.scores.conversion} />
            <ScoreRow label="Performance" value={report.scores.performance} />
            <ScoreRow label="Trust" value={report.scores.trust} />
            <ScoreRow label="Content" value={report.scores.content} />
            <ScoreRow label="Mobile" value={report.scores.mobile} />
          </div>
        </div>
      ) : null}

      {/* Report body */}
      {report.reportMarkdown ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Report</h2>
          <div className="mt-3 whitespace-pre-wrap break-words text-sm leading-relaxed text-ink">{report.reportMarkdown}</div>
        </div>
      ) : null}

      {/* Recommendations */}
      {recs.length ? (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Impact vs effort</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {recs.map((r, i) => (
              <li key={i} className="flex flex-wrap items-baseline gap-2">
                <span className="font-medium text-ink">{String(r.title ?? '')}</span>
                <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">impact: {String(r.impact ?? '—')}</span>
                <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">effort: {String(r.effort ?? '—')}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Crawl snapshot summary (safe fields only) */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Fetched homepage</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Read label="Final URL" value={crawl.final_url ?? report.websiteUrl} />
          <Read label="HTTP status" value={crawl.http_status != null ? String(crawl.http_status) : null} />
          <Read label="Title" value={crawl.title ?? null} />
          <Read label="Meta description" value={crawl.meta_description ?? null} />
          <Read label="Detected language" value={crawl.detected_language ?? null} />
          <Read label="Images / links / forms" value={crawl.counts ? `${crawl.counts.images ?? 0} / ${crawl.counts.links ?? 0} / ${crawl.counts.forms ?? 0}` : null} />
          <Read label="Viewport / OG tags" value={`${crawl.has_viewport ? 'yes' : 'no'} / ${crawl.has_og ? 'yes' : 'no'}`} />
          <Read label="Model" value={report.modelName ? `${report.modelProvider ?? ''} ${report.modelName}`.trim() : null} />
          <Read label="Tokens (in/out)" value={usage.input != null ? `${usage.input ?? 0} / ${usage.output ?? 0}` : null} />
          <Read label="Prompt version" value={report.promptVersion} />
        </dl>
      </div>

      <div className="mt-4">
        <DeliverPanel
          reportId={report.id}
          reviewStatus={report.reviewStatus}
          hasContact={!!report.contactId}
          contactName={report.contactName}
          latest={latestDelivery}
          canDeliver={canDeliver}
          flagEnabled={env.websiteReportDeliveryEnabled}
          openClickTrackingEnabled={env.enableEmailOpenClickTracking}
        />
      </div>

      <div className="mt-4">
        <WebsiteReportDetailActions report={report} canGenerate={canGenerate} canReview={canReview} canArchive={canArchive} flagEnabled={env.websiteReportsEnabled} />
      </div>
    </div>
  );
}
