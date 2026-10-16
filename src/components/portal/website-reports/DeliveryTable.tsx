import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { EngagementSummary } from './EngagementSummary';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { websiteReportStatusLabel } from '@/modules/website-reports/format';
import type { DeliveryListRow } from '@/modules/website-reports/delivery-types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Report deliveries list (server-rendered). Each row links to its report detail (which has the delivery panel). */
export function DeliveryTable({ rows, openClickEnabled = false }: { rows: DeliveryListRow[]; openClickEnabled?: boolean }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No deliveries match. Approved reports can be delivered from a report detail page.
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
            <th className="px-4 py-3 font-medium">Engagement</th>
            <th className="px-4 py-3 font-medium">Recipient</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Follow up</th>
            <th className="px-4 py-3 font-medium">Sent</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-row-href={`/app/website-reports/${r.reportId}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link href={`/app/website-reports/${r.reportId}`} aria-label={`Open report for ${r.domain || r.toEmail}`} className={`font-medium text-ink ${stretchedLinkClass}`}>
                  {r.domain || '—'}
                </Link>
              </td>
              <td className="px-4 py-3">
                <StatusBadge entityType="report_delivery" status={r.displayStatus} label={websiteReportStatusLabel(r.displayStatus)} />
              </td>
              <td className="px-4 py-3">
                <EngagementSummary e={r.engagement} openClickEnabled={openClickEnabled} variant="compact" />
              </td>
              <td className="px-4 py-3 text-ink-soft">{r.contactName || r.toEmail}</td>
              <td className="px-4 py-3 text-ink-soft">{r.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{r.followUpStatus === 'planned' ? fmt(r.followUpAt) : r.followUpStatus === 'done' ? 'done' : '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(r.sentAt)}</td>
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
