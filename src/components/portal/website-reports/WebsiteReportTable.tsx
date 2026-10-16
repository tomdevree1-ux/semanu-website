import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { websiteReportStatusLabel, formatScore } from '@/modules/website-reports/format';
import type { WebsiteReportListRow } from '@/modules/website-reports/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Website analysis reports list (server-rendered). Whole-row clickable (Part V §V2). */
export function WebsiteReportTable({ rows }: { rows: WebsiteReportListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No reports match. Generate a report from a website analysis submission in Funnels.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Overall</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Contact</th>
            <th className="px-4 py-3 font-medium">Ver.</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-row-href={`/app/website-reports/${r.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/website-reports/${r.id}`}
                  aria-label={`Open report for ${r.normalizedDomain || r.websiteUrl}`}
                  className={`font-medium text-ink ${stretchedLinkClass}`}
                >
                  {r.normalizedDomain || r.websiteUrl}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge entityType="website_report" status={r.displayStatus} label={websiteReportStatusLabel(r.displayStatus)} />
              </td>
              <td className="px-4 py-3 text-ink">{formatScore(r.scoreOverall)}</td>
              <td className="px-4 py-3 text-ink-soft">{r.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{r.contactName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{r.version}{r.isCurrent ? '' : ' (old)'}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(r.createdAt)}</td>
              <td className="px-4 py-3 text-right">
                <span className="text-ink-soft transition-colors group-hover:text-ink" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
