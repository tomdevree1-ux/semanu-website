import { requirePermission } from '@/lib/security/rbac';
import { listWebsiteAnalysisReports } from '@/modules/website-reports/queries';
import { WEBSITE_REPORT_GENERATION_STATUSES, WEBSITE_REPORT_REVIEW_STATUSES } from '@/modules/website-reports/status';
import { WebsiteReportTable } from '@/components/portal/website-reports/WebsiteReportTable';
import { ListHeader, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function WebsiteReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('website_reports.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const { rows, total, pageSize } = await listWebsiteAnalysisReports({
    q: sp.q,
    generationStatus: sp.generationStatus,
    reviewStatus: sp.reviewStatus,
    showArchived,
    page,
  });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.generationStatus) u.set('generationStatus', sp.generationStatus);
    if (sp.reviewStatus) u.set('reviewStatus', sp.reviewStatus);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Website reports"
        subtitle="Internal website analysis reports generated from website analysis funnel submissions. Reports are reviewed here before any future delivery; nothing is sent automatically."
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Domain or URL" />
        <FilterSelect name="generationStatus" defaultValue={sp.generationStatus} allLabel="All generation" options={WEBSITE_REPORT_GENERATION_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="reviewStatus" defaultValue={sp.reviewStatus} allLabel="All review" options={WEBSITE_REPORT_REVIEW_STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <WebsiteReportTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="reports" href={qs} />
    </div>
  );
}
