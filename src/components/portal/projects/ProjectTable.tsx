import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import type { ProjectListRow } from '@/modules/projects/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Projects list (server-rendered). Whole-row clickable (Part V §V2). */
export function ProjectTable({ rows }: { rows: ProjectListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No projects match. Create one to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Project</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Owner</th>
            <th className="px-4 py-3 font-medium">Due</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} data-row-href={`/app/projects/${p.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/projects/${p.id}`}
                  aria-label={`Open ${p.name}`}
                  className={`font-medium text-ink ${stretchedLinkClass}`}
                >
                  {p.name}
                </Link>
                {p.primaryContactName ? (
                  <div className="truncate text-xs text-ink-soft">{p.primaryContactName}</div>
                ) : null}
              </td>
              <td className="px-4 py-3 text-ink-soft">{p.companyName || '—'}</td>
              <td className="px-4 py-3"><StatusBadge entityType="project" status={p.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{p.ownerName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(p.dueDate)}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(p.updatedAt)}</td>
              <td className="px-4 py-3 text-right">
                <span className="text-ink-soft transition-colors group-hover:text-ink" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
