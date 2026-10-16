import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listProjects, listProjectOwnerOptions } from '@/modules/projects/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { ProjectTable } from '@/components/portal/projects/ProjectTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const STATUSES = ['draft', 'active', 'on_hold', 'completed', 'cancelled', 'archived'] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('projects.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies, owners, permKeys] = await Promise.all([
    listProjects({ q: sp.q, status: sp.status, companyId: sp.companyId, ownerId: sp.ownerId, showArchived, page }),
    listCompanyOptions(500),
    listProjectOwnerOptions(),
    getUserPermissions(),
  ]);
  const canCreate = permKeys.includes('projects.create');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (sp.ownerId) u.set('ownerId', sp.ownerId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Projects"
        action={canCreate ? <NewButton href="/app/projects/new" label="New project" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Name or description" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterSelect name="ownerId" defaultValue={sp.ownerId} allLabel="All owners" options={owners.map((o) => ({ value: o.id, label: o.name }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <ProjectTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="projects" href={qs} />
    </div>
  );
}
