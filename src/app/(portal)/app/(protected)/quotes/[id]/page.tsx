import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import {
  getQuote,
  listContactOptionsForCompany,
  listProjectOptionsForCompany,
  listCatalogPickerItems,
} from '@/modules/quotes/queries';
import { formatMoney } from '@/modules/quotes/totals';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { QuoteDetailActions } from '@/components/portal/quotes/QuoteDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('quotes.read');
  const { id } = await params;
  const quote = await getQuote(id);
  if (!quote) notFound();

  const [permKeys, contactOptions, projectOptions, catalogItems, rows] = await Promise.all([
    getUserPermissions(),
    listContactOptionsForCompany(quote.companyId),
    listProjectOptionsForCompany(quote.companyId),
    listCatalogPickerItems(),
    getHistory('quote', id, 80, 0),
  ]);
  const canUpdate = permKeys.includes('quotes.update');
  const canArchive = permKeys.includes('quotes.archive');
  const canCreateInvoice = permKeys.includes('invoices.create');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('quote', id, 80);
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
      <Link href="/app/quotes" className="text-sm text-red hover:underline">
        ← Back to quotes
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-ink-soft">{quote.quoteNumber}</span>
            <StatusBadge entityType="quote" status={quote.status} size="md" />
          </div>
          <h1 className="mt-1 page-title">{quote.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              for{' '}
              <Link href={`/app/companies/${quote.companyId}`} className="text-red hover:underline">
                {quote.companyName || 'company'}
              </Link>
              {quote.companyArchived ? ' (archived)' : ''}
            </span>
            {quote.contactId ? (
              <span>
                ·{' '}
                <Link href={`/app/contacts/${quote.contactId}`} className="text-red hover:underline">
                  {quote.contactName || 'contact'}
                </Link>
                {quote.contactArchived ? ' (archived)' : ''}
              </span>
            ) : null}
            {quote.projectId ? (
              <span>
                ·{' '}
                <Link href={`/app/projects/${quote.projectId}`} className="text-red hover:underline">
                  {quote.projectName || 'project'}
                </Link>
                {quote.projectArchived ? ' (archived)' : ''}
              </span>
            ) : null}
            <span className="font-medium text-ink">{formatMoney(quote.totalAmount, quote.currency)}</span>
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Quote history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {fmt(quote.createdAt)}</div>
        <div>Updated {fmt(quote.updatedAt)}</div>
        <div>{quote.validUntil ? `Valid until ${fmt(quote.validUntil)}` : 'No validity date'}</div>
      </div>

      <div className="mt-4">
        <QuoteDetailActions
          quote={quote}
          contactOptions={contactOptions}
          projectOptions={projectOptions}
          catalogItems={catalogItems}
          canUpdate={canUpdate}
          canArchive={canArchive}
          canCreateInvoice={canCreateInvoice}
        />
      </div>
    </div>
  );
}
