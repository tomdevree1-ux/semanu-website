import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listConfigurations } from '@/modules/configurations/queries';
import { ListHeader, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const STATUSES = ['draft', 'quoted', 'archived'] as const;

function chf(n: number): string {
  return Math.round(n).toLocaleString('de-CH').replace(/,/g, "'");
}
function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ConfigurationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('configurations.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const { rows, total, pageSize } = await listConfigurations({ q: sp.q, status: sp.status, showArchived, page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Configurations"
        subtitle="Website configurations from the pricing calculator, versioned and convertible to a quote."
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Number or title" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1 overflow-x-auto rounded-xl border border-ink/10">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Number</th>
              <th className="px-4 py-3">Lead</th>
              <th className="px-4 py-3">Situation</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ver.</th>
              <th className="px-4 py-3 text-right">Monthly</th>
              <th className="px-4 py-3 text-right">One time</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-ink-soft">No configurations yet.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-b border-ink/5 hover:bg-ink/[0.02]">
                  <td className="px-4 py-3">
                    <Link href={`/app/configurations/${r.id}`} className="font-medium text-red hover:underline">
                      {r.configNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <span className="block text-ink">{r.leadName ?? '—'}</span>
                    {r.leadEmail ? <span className="block text-xs text-ink-soft">{r.leadEmail}</span> : null}
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{r.situation === 'new' ? 'New site' : 'Existing'}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-pill border border-ink/15 px-2 py-0.5 text-xs uppercase tracking-wide text-ink-soft">
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">v{r.currentVersion}</td>
                  <td className="px-4 py-3 text-right font-mono">{chf(r.monthly)} CHF</td>
                  <td className="px-4 py-3 text-right font-mono">{chf(r.oneTime)} CHF</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="configurations" href={qs} />
    </div>
  );
}
