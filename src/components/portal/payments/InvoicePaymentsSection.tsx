import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { formatMoney } from '@/modules/payments/totals';
import type { InvoicePaymentRow, InvoicePaymentSummary } from '@/modules/payments/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/**
 * Additive Payments section on the invoice detail (P10). Shows the derived payment
 * summary + the invoice's payment rows + an "Add payment" link. Server-rendered.
 */
export function InvoicePaymentsSection({
  invoiceId,
  currency,
  summary,
  payments,
  canCreate,
  canAddPayment,
}: {
  invoiceId: string;
  currency: string;
  summary: InvoicePaymentSummary | null;
  payments: InvoicePaymentRow[];
  canCreate: boolean;
  canAddPayment: boolean;
}) {
  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg text-ink">Payments</h2>
        {canCreate && canAddPayment ? (
          <Link href={`/app/payments/new?invoiceId=${invoiceId}`} className="rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5">
            Add payment
          </Link>
        ) : null}
      </div>

      {summary ? (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-soft">Total</dt>
            <dd className="text-ink">{formatMoney(summary.totalAmount, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Paid</dt>
            <dd className="text-ink">{formatMoney(summary.amountPaid, currency)}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Balance due</dt>
            <dd className="font-medium text-ink">{formatMoney(summary.balanceDue, currency)}</dd>
          </div>
        </dl>
      ) : null}
      {summary?.overpaid ? (
        <p className="mt-2 rounded-lg bg-spark/10 px-3 py-2 text-xs text-ink">
          Overpaid by {formatMoney(summary.amountPaid - summary.totalAmount, currency)}.
        </p>
      ) : null}

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="py-2 pr-2 font-medium">Ref</th>
              <th className="py-2 pr-2 font-medium">Amount</th>
              <th className="py-2 pr-2 font-medium">Status</th>
              <th className="py-2 pr-2 font-medium">Method</th>
              <th className="py-2 pr-2 font-medium">Paid</th>
            </tr>
          </thead>
          <tbody>
            {payments.length === 0 ? (
              <tr><td colSpan={5} className="py-4 text-center text-ink-soft">No payments recorded.</td></tr>
            ) : null}
            {payments.map((p) => (
              <tr key={p.id} className="border-b border-ink/5 last:border-0">
                <td className="py-2 pr-2">
                  <Link href={`/app/payments/${p.id}`} className="font-mono text-xs text-red hover:underline">{p.id.slice(0, 8)}</Link>
                  {p.archivedAt ? <span className="text-xs text-ink-soft"> (archived)</span> : null}
                </td>
                <td className="py-2 pr-2 text-ink">{formatMoney(p.amount, p.currency)}</td>
                <td className="py-2 pr-2"><StatusBadge entityType="payment" status={p.status} /></td>
                <td className="py-2 pr-2 text-ink-soft">{p.method.replace(/_/g, ' ')}</td>
                <td className="py-2 pr-2 text-ink-soft">{fmt(p.paidAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
