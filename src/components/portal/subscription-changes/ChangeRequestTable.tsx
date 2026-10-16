import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { changeActionLabel } from '@/modules/subscription-changes/format';
import type { ChangeRequestListRow } from '@/modules/subscription-changes/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Subscription change-requests list (server-rendered). Whole-row clickable (Part V §V2). */
export function ChangeRequestTable({ rows }: { rows: ChangeRequestListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No change requests match. Open a subscription to request a change.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Action</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Subscription</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Requested by</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} data-row-href={`/app/subscription-changes/${r.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/subscription-changes/${r.id}`}
                  aria-label={`Open change request ${changeActionLabel(r.actionType)}`}
                  className={`font-medium text-ink ${stretchedLinkClass}`}
                >
                  {changeActionLabel(r.actionType)}
                </Link>
                {r.hasPreview ? <span className="ml-2 rounded-pill bg-ink/5 px-2 py-0.5 text-[11px] text-ink-soft">previewed</span> : null}
              </td>
              <td className="px-4 py-3"><StatusBadge entityType="subscription_change" status={r.status} /></td>
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">{r.stripeSubscriptionId}</td>
              <td className="px-4 py-3 text-ink-soft">{r.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{r.requestedByName || '—'}</td>
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
