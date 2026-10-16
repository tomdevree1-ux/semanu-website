import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getPayment } from '@/modules/payments/queries';
import { formatMoney } from '@/modules/payments/totals';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { PaymentDetailActions } from '@/components/portal/payments/PaymentDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('payments.read');
  const { id } = await params;
  const payment = await getPayment(id);
  if (!payment) notFound();

  const [permKeys, rows] = await Promise.all([
    getUserPermissions(),
    getHistory('payment', id, 80, 0),
  ]);
  const canUpdate = permKeys.includes('payments.update');
  const canArchive = permKeys.includes('payments.archive');
  const canMarkSucceeded = permKeys.includes('payments.mark_succeeded');
  const canRefund = permKeys.includes('payments.refund');
  const canCancel = permKeys.includes('payments.cancel');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('payment', id, 80);
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

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/payments" className="text-sm text-red hover:underline">
        ← Back to payments
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{payment.id.slice(0, 8)}</span>
            <StatusBadge entityType="payment" status={payment.status} size="md" />
          </div>
          <h1 className="mt-1 page-title">{formatMoney(payment.amount, payment.currency)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              for invoice{' '}
              <Link href={`/app/invoices/${payment.invoiceId}`} className="text-red hover:underline">
                {payment.invoiceNumber || 'invoice'}
              </Link>
              {payment.invoiceArchived ? ' (archived)' : ''}
            </span>
            <span>
              ·{' '}
              <Link href={`/app/companies/${payment.companyId}`} className="text-red hover:underline">
                {payment.companyName || 'company'}
              </Link>
              {payment.companyArchived ? ' (archived)' : ''}
            </span>
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Payment history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Created {fmt(payment.createdAt)}</div>
        <div>{payment.paidAt ? `Paid ${fmt(payment.paidAt)}` : 'Not paid'}</div>
        <div>{payment.failedAt ? `Failed ${fmt(payment.failedAt)}` : ''}</div>
        <div>{payment.refundedAt ? `Refunded ${fmt(payment.refundedAt)}` : ''}</div>
      </div>

      <div className="mt-4">
        <PaymentDetailActions
          payment={payment}
          canUpdate={canUpdate}
          canArchive={canArchive}
          canMarkSucceeded={canMarkSucceeded}
          canRefund={canRefund}
          canCancel={canCancel}
        />
      </div>
    </div>
  );
}
