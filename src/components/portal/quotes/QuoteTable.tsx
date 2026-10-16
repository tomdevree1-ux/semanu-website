import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatMoney } from '@/modules/quotes/totals';
import type { QuoteListRow } from '@/modules/quotes/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Quotes list (server-rendered). Whole-row clickable (Part V §V2). */
export function QuoteTable({ rows }: { rows: QuoteListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No quotes match. Create one to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Number</th>
            <th className="px-4 py-3 font-medium">Title</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((q) => (
            <tr key={q.id} data-row-href={`/app/quotes/${q.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/quotes/${q.id}`}
                  aria-label={`Open ${q.quoteNumber}`}
                  className={`font-mono font-medium text-ink ${stretchedLinkClass}`}
                >
                  {q.quoteNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink">{q.title}</td>
              <td className="px-4 py-3 text-ink-soft">{q.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{formatMoney(q.totalAmount, q.currency)}</td>
              <td className="px-4 py-3"><StatusBadge entityType="quote" status={q.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{fmt(q.updatedAt)}</td>
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
