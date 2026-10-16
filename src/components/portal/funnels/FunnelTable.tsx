import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { funnelSourceLabel, fullName } from '@/modules/funnels/format';
import type { FunnelListRow } from '@/modules/funnels/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Spam marker — only shown when a submission is flagged, so the list stays calm by default. */
function SpamPill({ status }: { status: string }) {
  if (status === 'spam') {
    return <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-[11px] text-danger">Spam</span>;
  }
  if (status === 'suspected') {
    return <span className="rounded-pill bg-spark/15 px-2 py-0.5 text-[11px] text-ink">Suspected</span>;
  }
  return <span className="text-ink-soft">—</span>;
}

/** Funnel submissions list (server-rendered). Whole-row clickable (Part V §V2). */
export function FunnelTable({ rows }: { rows: FunnelListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No submissions match. Website funnels land here as visitors request a free analysis.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">CRM</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Spam</th>
            <th className="px-4 py-3 font-medium">Received</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const name = fullName(r.firstName, r.lastName);
            const crm = r.companyName || r.contactName || (r.companyId || r.contactId ? 'linked' : null);
            return (
              <tr key={r.id} data-row-href={`/app/funnels/${r.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
                <td className="px-4 py-3">
                  <Link
                    href={`/app/funnels/${r.id}`}
                    aria-label={`Open submission from ${name || r.email}`}
                    className={`font-medium text-ink ${stretchedLinkClass}`}
                  >
                    {funnelSourceLabel(r.sourceType)}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge entityType="funnel" status={r.status} />
                </td>
                <td className="px-4 py-3 text-ink">{name || '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{r.email}</td>
                <td className="px-4 py-3 text-ink-soft">{r.normalizedDomain || '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{crm || '—'}</td>
                <td className="px-4 py-3 text-ink-soft">{r.ownerName || '—'}</td>
                <td className="px-4 py-3"><SpamPill status={r.spamStatus} /></td>
                <td className="px-4 py-3 text-ink-soft">{fmt(r.createdAt)}</td>
                <td className="px-4 py-3 text-right">
                  <span className="text-ink-soft transition-colors group-hover:text-ink" aria-hidden>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                      <path d="M9 6l6 6-6 6" />
                    </svg>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
