import { requirePermission } from '@/lib/security/rbac';
import { listSubscriptionChangeRequests } from '@/modules/subscription-changes/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { CHANGE_STATUSES } from '@/modules/subscription-changes/status';
import { CHANGE_ACTIONS } from '@/modules/subscription-changes/schema';
import { changeActionLabel } from '@/modules/subscription-changes/format';
import { ChangeRequestTable } from '@/components/portal/subscription-changes/ChangeRequestTable';
import { ListHeader, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SubscriptionChangesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('subscriptions.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies] = await Promise.all([
    listSubscriptionChangeRequests({ q: sp.q, status: sp.status, actionType: sp.actionType, companyId: sp.companyId, showArchived, page }),
    listCompanyOptions(500),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.actionType) u.set('actionType', sp.actionType);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Subscription changes"
        subtitle="Change requests + previews for Stripe subscriptions. Preview/request only; execution is deferred to P12B2."
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Stripe id, action, company" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={CHANGE_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="actionType" defaultValue={sp.actionType} allLabel="All actions" options={CHANGE_ACTIONS.map((a) => ({ value: a, label: changeActionLabel(a) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <ChangeRequestTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="requests" href={qs} />
    </div>
  );
}
