import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getPaymentLink } from '@/modules/payment-links/queries';
import { formatMoney } from '@/modules/payments/totals';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { PaymentLinkDetailActions } from '@/components/portal/payment-links/PaymentLinkDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export default async function PaymentLinkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('payment_links.read');
  const { id } = await params;
  const link = await getPaymentLink(id);
  if (!link) notFound();

  const [permKeys, rows] = await Promise.all([
    getUserPermissions(),
    getHistory('payment_link', id, 80, 0),
  ]);
  const canCreate = permKeys.includes('payment_links.create');
  const canCancel = permKeys.includes('payment_links.cancel');
  const canArchive = permKeys.includes('payment_links.archive');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('payment_link', id, 80);
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
      <Link href="/app/payment-links" className="text-sm text-red hover:underline">
        ← Back to payment links
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{link.id.slice(0, 8)}</span>
            <StatusBadge entityType="payment_link" status={link.status} size="md" />
          </div>
          <h1 className="mt-1 page-title">{formatMoney(link.amount, link.currency)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              for invoice{' '}
              <Link href={`/app/invoices/${link.invoiceId}`} className="text-red hover:underline">
                {link.invoiceNumber || 'invoice'}
              </Link>
              {link.invoiceArchived ? ' (archived)' : ''}
            </span>
            <span>
              ·{' '}
              <Link href={`/app/companies/${link.companyId}`} className="text-red hover:underline">
                {link.companyName || 'company'}
              </Link>
              {link.companyArchived ? ' (archived)' : ''}
            </span>
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Payment link history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Created {fmt(link.createdAt)}</div>
        <div>{link.paidAt ? `Paid ${fmt(link.paidAt)}` : ''}</div>
        <div>{link.cancelledAt ? `Cancelled ${fmt(link.cancelledAt)}` : ''}</div>
        <div>{link.expiresAt ? `Expires ${fmt(link.expiresAt)}` : ''}</div>
      </div>

      <div className="mt-4">
        <PaymentLinkDetailActions link={link} canCreate={canCreate} canCancel={canCancel} canArchive={canArchive} />
      </div>
    </div>
  );
}
