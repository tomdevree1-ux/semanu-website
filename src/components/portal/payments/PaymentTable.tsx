import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatMoney } from '@/modules/payments/totals';
import type { PaymentListRow } from '@/modules/payments/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}
function method(m: string): string {
  return m.replace(/_/g, ' ');
}

/** Payments list (server-rendered). Whole-row clickable (Part V §V2). */
export function PaymentTable({ rows }: { rows: PaymentListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No payments match. Record one from an invoice to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Ref</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Method</th>
            <th className="px-4 py-3 font-medium">Invoice</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Paid</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} data-row-href={`/app/payments/${p.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/payments/${p.id}`}
                  aria-label={`Open payment ${p.id.slice(0, 8)}`}
                  className={`font-mono text-xs font-medium text-ink ${stretchedLinkClass}`}
                >
                  {p.id.slice(0, 8)}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink">{formatMoney(p.amount, p.currency)}</td>
              <td className="px-4 py-3"><StatusBadge entityType="payment" status={p.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{method(p.method)}</td>
              <td className="px-4 py-3 font-mono text-xs text-ink-soft">{p.invoiceNumber || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{p.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(p.paidAt)}</td>
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
