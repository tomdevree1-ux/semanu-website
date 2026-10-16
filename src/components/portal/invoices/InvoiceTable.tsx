import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatMoney } from '@/modules/invoices/totals';
import type { InvoiceListRow } from '@/modules/invoices/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Invoices list (server-rendered). Whole-row clickable (Part V §V2). */
export function InvoiceTable({ rows }: { rows: InvoiceListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No invoices match. Create one to get started.
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
            <th className="px-4 py-3 font-medium">Balance</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((iv) => (
            <tr key={iv.id} data-row-href={`/app/invoices/${iv.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/invoices/${iv.id}`}
                  aria-label={`Open ${iv.invoiceNumber}`}
                  className={`font-mono font-medium text-ink ${stretchedLinkClass}`}
                >
                  {iv.invoiceNumber}
                </Link>
              </td>
              <td className="px-4 py-3 text-ink">{iv.title}</td>
              <td className="px-4 py-3 text-ink-soft">{iv.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{formatMoney(iv.totalAmount, iv.currency)}</td>
              <td className="px-4 py-3 text-ink-soft">{formatMoney(iv.balanceDue, iv.currency)}</td>
              <td className="px-4 py-3"><StatusBadge entityType="invoice" status={iv.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{fmt(iv.dueDate)}</td>
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
