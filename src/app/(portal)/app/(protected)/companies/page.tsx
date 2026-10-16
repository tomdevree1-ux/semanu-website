import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listCompanies } from '@/modules/companies/queries';
import { CompanyTable } from '@/components/portal/companies/CompanyTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const CRM_STATUSES = ['lead', 'qualified', 'active', 'dormant', 'lost', 'blocked', 'archived'] as const;
const SOURCES = ['csv', 'manual', 'contact_form', 'daily_audit', 'external'] as const;
const LEAD_STATUSES = [
  'imported', 'ready_for_analysis', 'analysis_in_progress', 'analysis_failed', 'report_generated',
  'waiting_for_review', 'pdf_reviewed', 'email_draft_generated', 'approved_for_sending', 'sent',
  'replied', 'not_interested', 'opted_out', 'do_not_contact', 'won', 'lost',
] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('companies.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';
  const permKeys = await getUserPermissions();
  const canCreate = permKeys.includes('companies.create');

  const { rows, total, pageSize } = await listCompanies({
    q: sp.q,
    crmStatus: sp.crmStatus,
    leadStatus: sp.leadStatus,
    source: sp.source,
    showArchived,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.crmStatus) u.set('crmStatus', sp.crmStatus);
    if (sp.leadStatus) u.set('leadStatus', sp.leadStatus);
    if (sp.source) u.set('source', sp.source);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Companies"
        action={canCreate ? <NewButton href="/app/companies/new" label="New company" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Name, domain or email" />
        <FilterSelect name="crmStatus" defaultValue={sp.crmStatus} allLabel="All statuses" options={CRM_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="leadStatus" defaultValue={sp.leadStatus} allLabel="All pipeline stages" options={LEAD_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="source" defaultValue={sp.source} allLabel="All sources" options={SOURCES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <CompanyTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="companies" href={qs} />
    </div>
  );
}
