import { requirePermission } from '@/lib/security/rbac';
import { env } from '@/lib/env';
import { listWebsiteReportDeliveries } from '@/modules/website-reports/delivery-queries';
import { REPORT_DELIVERY_STATUSES } from '@/modules/website-reports/delivery-status';
import { DeliveryTable } from '@/components/portal/website-reports/DeliveryTable';
import { ListHeader, HeaderLink, FilterBar, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ReportDeliveriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('website_reports.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';
  const followUpDue = sp.followUp === 'due';

  const { rows, total, pageSize } = await listWebsiteReportDeliveries({ status: sp.status, followUpDue, showArchived, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.status) u.set('status', sp.status);
    if (followUpDue) u.set('followUp', 'due');
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Report deliveries"
        subtitle="Approved website analysis reports sent to leads. Nothing is sent automatically."
        action={<HeaderLink href="/app/website-reports" label="All reports" />}
      />

      <FilterBar>
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={REPORT_DELIVERY_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterCheckbox name="followUp" value="due" defaultChecked={followUpDue} label="Follow up due" />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <DeliveryTable rows={rows} openClickEnabled={env.enableEmailOpenClickTracking} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="deliveries" href={qs} />
    </div>
  );
}
