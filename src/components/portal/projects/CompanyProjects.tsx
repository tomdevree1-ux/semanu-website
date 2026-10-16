import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import type { CompanyProjectRow } from '@/modules/projects/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Projects section on the company detail page (P6-Q2). */
export function CompanyProjects({
  projects,
  companyId,
  canCreate,
  companyArchived,
}: {
  projects: CompanyProjectRow[];
  companyId: string;
  canCreate: boolean;
  companyArchived: boolean;
}) {
  return (
    <section className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-ink">Projects</h2>
        {canCreate && !companyArchived ? (
          <Link
            href={`/app/projects/new?companyId=${companyId}`}
            className="rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5"
          >
            Add project
          </Link>
        ) : null}
      </div>
      {projects.length ? (
        <ul className="mt-3 divide-y divide-ink/5">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link href={`/app/projects/${p.id}`} className="font-medium text-ink hover:text-red">
                  {p.name}
                </Link>
                <div className="truncate text-xs text-ink-soft">
                  {[p.ownerName, p.dueDate ? `Due ${fmt(p.dueDate)}` : null].filter(Boolean).join(' · ') || '—'}
                </div>
              </div>
              <StatusBadge entityType="project" status={p.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">No projects yet.</p>
      )}
    </section>
  );
}
