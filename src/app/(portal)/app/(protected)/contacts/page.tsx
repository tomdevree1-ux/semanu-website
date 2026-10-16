import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listContacts } from '@/modules/contacts/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { ContactTable } from '@/components/portal/contacts/ContactTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const CONTACT_STATUSES = ['lead', 'qualified', 'active', 'dormant', 'blocked', 'archived'] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('contacts.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies, permKeys] = await Promise.all([
    listContacts({ q: sp.q, status: sp.status, companyId: sp.companyId, showArchived, page }),
    listCompanyOptions(500),
    getUserPermissions(),
  ]);
  const canCreate = permKeys.includes('contacts.create');
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
        title="Contacts"
        action={canCreate ? <NewButton href="/app/contacts/new" label="New contact" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Name, email, role or company" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={CONTACT_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <ContactTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="contacts" href={qs} />
    </div>
  );
}
