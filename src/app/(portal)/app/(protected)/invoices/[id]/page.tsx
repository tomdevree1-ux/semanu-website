import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import {
  getInvoice,
  listContactOptionsForCompany,
  listProjectOptionsForCompany,
  listQuoteOptionsForCompany,
  listCatalogPickerItems,
} from '@/modules/invoices/queries';
import { getInvoicePaymentSummary, listPaymentsForInvoice } from '@/modules/payments/queries';
import { invoiceAllowsPayment } from '@/modules/payments/guards';
import { InvoicePaymentsSection } from '@/components/portal/payments/InvoicePaymentsSection';
import { getInvoicePaymentLinkSummary, listPaymentLinksForInvoice } from '@/modules/payment-links/queries';
import { invoiceAllowsLink } from '@/modules/payment-links/guards';
import { InvoicePaymentLinksSection } from '@/components/portal/payment-links/InvoicePaymentLinksSection';
import { formatMoney } from '@/modules/invoices/totals';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { InvoiceDetailActions } from '@/components/portal/invoices/InvoiceDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('invoices.read');
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();

  const [permKeys, contactOptions, projectOptions, quoteOptions, catalogItems, rows] =
    await Promise.all([
      getUserPermissions(),
      listContactOptionsForCompany(invoice.companyId),
      listProjectOptionsForCompany(invoice.companyId),
      listQuoteOptionsForCompany(invoice.companyId),
      listCatalogPickerItems(),
      getHistory('invoice', id, 80, 0),
    ]);
  const canUpdate = permKeys.includes('invoices.update');
  const canArchive = permKeys.includes('invoices.archive');
  const canIssue = permKeys.includes('invoices.issue');
  const canMarkPaid = permKeys.includes('invoices.mark_paid');
  const canVoid = permKeys.includes('invoices.void');
  const canTech = permKeys.includes('audit.read_technical');
  const canViewPayments = permKeys.includes('payments.read');
  const canCreatePayments = permKeys.includes('payments.create');
  const canViewLinks = permKeys.includes('payment_links.read');
  const canCreateLinks = permKeys.includes('payment_links.create');
  const canCancelLinks = permKeys.includes('payment_links.cancel');

  const [paymentSummary, invoicePayments, linkSummary, invoiceLinks] = await Promise.all([
    canViewPayments ? getInvoicePaymentSummary(id) : Promise.resolve(null),
    canViewPayments ? listPaymentsForInvoice(id) : Promise.resolve([]),
    canViewLinks ? getInvoicePaymentLinkSummary(id) : Promise.resolve({ activeLink: null, linkCount: 0 }),
    canViewLinks ? listPaymentLinksForInvoice(id) : Promise.resolve([]),
  ]);
  const hasPayments = (paymentSummary?.paymentCount ?? 0) > 0;

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('invoice', id, 80);
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
      <Link href="/app/invoices" className="text-sm text-red hover:underline">
        ← Back to invoices
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-ink-soft">{invoice.invoiceNumber}</span>
            <StatusBadge entityType="invoice" status={invoice.status} size="md" />
          </div>
          <h1 className="mt-1 page-title">{invoice.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              for{' '}
              <Link href={`/app/companies/${invoice.companyId}`} className="text-red hover:underline">
                {invoice.companyName || 'company'}
              </Link>
              {invoice.companyArchived ? ' (archived)' : ''}
            </span>
            {invoice.contactId ? (
              <span>
                ·{' '}
                <Link href={`/app/contacts/${invoice.contactId}`} className="text-red hover:underline">
                  {invoice.contactName || 'contact'}
                </Link>
                {invoice.contactArchived ? ' (archived)' : ''}
              </span>
            ) : null}
            {invoice.projectId ? (
              <span>
                ·{' '}
                <Link href={`/app/projects/${invoice.projectId}`} className="text-red hover:underline">
                  {invoice.projectName || 'project'}
                </Link>
                {invoice.projectArchived ? ' (archived)' : ''}
              </span>
            ) : null}
            {invoice.quoteId ? (
              <span>
                ·{' '}
                <Link href={`/app/quotes/${invoice.quoteId}`} className="text-red hover:underline">
                  {invoice.quoteNumber || 'quote'}
                </Link>
                {invoice.quoteArchived ? ' (archived)' : ''}
              </span>
            ) : null}
            <span className="font-medium text-ink">{formatMoney(invoice.totalAmount, invoice.currency)}</span>
            {invoice.balanceDue > 0 ? (
              <span className="text-ink-soft">balance {formatMoney(invoice.balanceDue, invoice.currency)}</span>
            ) : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Invoice history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Created {fmt(invoice.createdAt)}</div>
        <div>Updated {fmt(invoice.updatedAt)}</div>
        <div>{invoice.issueDate ? `Issued ${fmt(invoice.issueDate)}` : 'Not issued'}</div>
        <div>{invoice.dueDate ? `Due ${fmt(invoice.dueDate)}` : 'No due date'}</div>
      </div>

      <div className="mt-4 space-y-4">
        <InvoiceDetailActions
          invoice={invoice}
          contactOptions={contactOptions}
          projectOptions={projectOptions}
          quoteOptions={quoteOptions}
          catalogItems={catalogItems}
          canUpdate={canUpdate}
          canArchive={canArchive}
          canIssue={canIssue}
          canMarkPaid={canMarkPaid}
          canVoid={canVoid}
          hasPayments={hasPayments}
        />
        {canViewPayments ? (
          <InvoicePaymentsSection
            invoiceId={invoice.id}
            currency={invoice.currency}
            summary={paymentSummary}
            payments={invoicePayments}
            canCreate={canCreatePayments}
            canAddPayment={invoiceAllowsPayment(invoice.status, invoice.archivedAt)}
          />
        ) : null}
        {canViewLinks ? (
          <InvoicePaymentLinksSection
            invoiceId={invoice.id}
            currency={invoice.currency}
            activeLink={linkSummary.activeLink}
            links={invoiceLinks}
            canCreate={canCreateLinks}
            canCancel={canCancelLinks}
            canGenerate={invoiceAllowsLink(invoice.status, invoice.archivedAt, invoice.balanceDue)}
          />
        ) : null}
      </div>
    </div>
  );
}
