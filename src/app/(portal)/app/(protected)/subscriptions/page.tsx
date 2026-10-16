import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listSubscriptions } from '@/modules/subscriptions/queries';
import { listCompanyOptions } from '@/modules/companies/queries';
import { SUBSCRIPTION_STATUSES, SYNC_STATUSES } from '@/modules/subscriptions/status';
import { SubscriptionTable } from '@/components/portal/subscriptions/SubscriptionTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function SubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('subscriptions.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, companies, permKeys] = await Promise.all([
    listSubscriptions({
      q: sp.q,
      status: sp.status,
      syncStatus: sp.syncStatus,
      companyId: sp.companyId,
      showArchived,
      page,
    }),
    listCompanyOptions(500),
    getUserPermissions(),
  ]);
  const canLink = permKeys.includes('subscriptions.link');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.syncStatus) u.set('syncStatus', sp.syncStatus);
    if (sp.companyId) u.set('companyId', sp.companyId);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Subscriptions"
        subtitle="Existing Stripe subscriptions linked to CRM. Stripe is the source of truth; sync to refresh."
        action={canLink ? <NewButton href="/app/subscriptions/link" label="Link subscription" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Stripe id, company, plan" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={SUBSCRIPTION_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="syncStatus" defaultValue={sp.syncStatus} allLabel="All sync states" options={SYNC_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="companyId" defaultValue={sp.companyId} allLabel="All companies" options={companies.map((c) => ({ value: c.id, label: c.name }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <SubscriptionTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="subscriptions" href={qs} />
    </div>
  );
}
