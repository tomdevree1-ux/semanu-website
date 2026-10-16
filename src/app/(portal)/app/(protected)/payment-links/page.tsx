import { requirePermission } from '@/lib/security/rbac';
import { listPaymentLinks } from '@/modules/payment-links/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { PaymentLinkTable } from '@/components/portal/payment-links/PaymentLinkTable';
import { ListHeader, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const STATUSES = ['draft', 'active', 'paid', 'expired', 'cancelled', 'failed', 'archived'] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function PaymentLinksPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('payment_links.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies] = await Promise.all([
    listPaymentLinks({ q: sp.q, status: sp.status, companyId: sp.companyId, invoiceId: sp.invoiceId, showArchived, page }),
    listCompanyOptions(500),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (sp.invoiceId) u.set('invoiceId', sp.invoiceId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Payment links"
        subtitle="Stripe payment links are generated from an invoice. Open an invoice to generate one."
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Reference or note" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        {sp.invoiceId ? <input type="hidden" name="invoiceId" value={sp.invoiceId} /> : null}
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <PaymentLinkTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="payment links" href={qs} />
    </div>
  );
}
