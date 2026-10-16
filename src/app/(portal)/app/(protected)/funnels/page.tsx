import { requirePermission } from '@/lib/security/rbac';
import { listFunnelSubmissions, listFunnelOwners, listLinkableCompanies } from '@/modules/funnels/queries';
import { FUNNEL_SOURCE_TYPES, FUNNEL_STATUSES, FUNNEL_SPAM_STATUSES } from '@/modules/funnels/status';
import { funnelSourceLabel } from '@/modules/funnels/format';
import { FunnelTable } from '@/components/portal/funnels/FunnelTable';
import { ListHeader, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function FunnelsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('funnels.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, owners, companies] = await Promise.all([
    listFunnelSubmissions({
      q: sp.q,
      sourceType: sp.sourceType,
      status: sp.status,
      spamStatus: sp.spamStatus,
      ownerId: sp.ownerId,
      companyId: sp.companyId,
      showArchived,
      page,
    }),
    listFunnelOwners(),
    listLinkableCompanies(),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.sourceType) u.set('sourceType', sp.sourceType);
    if (sp.status) u.set('status', sp.status);
    if (sp.spamStatus) u.set('spamStatus', sp.spamStatus);
    if (sp.ownerId) u.set('ownerId', sp.ownerId);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Website funnels"
        subtitle="Lead magnet submissions from the public site. The CRM is the source of truth; link or create a contact or company to follow up."
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Email, name, domain" />
        <FilterSelect name="sourceType" defaultValue={sp.sourceType} allLabel="All sources" options={FUNNEL_SOURCE_TYPES.map((s) => ({ value: s, label: funnelSourceLabel(s) }))} />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={FUNNEL_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="spamStatus" defaultValue={sp.spamStatus} allLabel="All spam states" options={FUNNEL_SPAM_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="ownerId" defaultValue={sp.ownerId} allLabel="All owners" options={owners.map((o) => ({ value: o.id, label: o.name }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: `${c.name}${c.archived ? ' (archived)' : ''}` }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <FunnelTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="submissions" href={qs} />
    </div>
  );
}
