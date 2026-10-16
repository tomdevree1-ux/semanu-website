import Link from 'next/link';
import { StatusBadge, statusLabel } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatCatalogPrice } from '@/modules/catalog/price';
import type { CatalogListRow } from '@/modules/catalog/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Catalog list (server-rendered). Whole-row clickable (Part V §V2). */
export function CatalogTable({ rows }: { rows: CatalogListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No catalog items match. Create one to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 font-medium">Type</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Price</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Updated</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} data-row-href={`/app/catalog/${c.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/catalog/${c.id}`}
                  aria-label={`Open ${c.name}`}
                  className={`font-medium text-ink ${stretchedLinkClass}`}
                >
                  {c.name}
                </Link>
                {c.code ? <div className="truncate font-mono text-xs text-ink-soft">{c.code}</div> : null}
              </td>
              <td className="px-4 py-3 text-ink-soft">{statusLabel(c.itemType)}</td>
              <td className="px-4 py-3 text-ink-soft">{c.category || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{formatCatalogPrice(c)}</td>
              <td className="px-4 py-3"><StatusBadge entityType="catalog" status={c.status} /></td>
              <td className="px-4 py-3 text-ink-soft">{fmt(c.updatedAt)}</td>
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
