import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listQuotes } from '@/modules/quotes/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { QuoteTable } from '@/components/portal/quotes/QuoteTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'archived'] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function QuotesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('quotes.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies, permKeys] = await Promise.all([
    listQuotes({ q: sp.q, status: sp.status, companyId: sp.companyId, showArchived, page }),
    listCompanyOptions(500),
    getUserPermissions(),
  ]);
  const canCreate = permKeys.includes('quotes.create');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Quotes"
        action={canCreate ? <NewButton href="/app/quotes/new" label="New quote" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Number or title" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <QuoteTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="quotes" href={qs} />
    </div>
  );
}
