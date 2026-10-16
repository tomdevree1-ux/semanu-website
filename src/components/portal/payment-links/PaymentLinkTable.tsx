import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatMoney } from '@/modules/payments/totals';
import type { PaymentLinkListRow } from '@/modules/payment-links/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Payment-links list (server-rendered). Whole-row clickable (Part V §V2). */
export function PaymentLinkTable({ rows }: { rows: PaymentLinkListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No payment links match. Generate one from an invoice to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Ref</th>
            <th className="px-4 py-3 font-medium">Invoice</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Created</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((l) => (
            <tr key={l.id} data-row-href={`/app/payment-links/${l.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/payment-links/${l.id}`}
                  aria-label={`Open payment link ${l.id.slice(0, 8)}`}
                  className={`font-mono text-xs font-medium text-ink ${stretchedLinkClass}`}
                >
                  {l.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">{l.invoiceNumber || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{l.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink">{formatMoney(l.amount, l.currency)}</td>
              <td className="px-4 py-3"><StatusBadge entityType="payment_link" status={l.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{fmt(l.createdAt)}</td>
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
