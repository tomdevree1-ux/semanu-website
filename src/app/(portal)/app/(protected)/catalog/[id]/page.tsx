import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getCatalogItem } from '@/modules/catalog/queries';
import { formatCatalogPrice } from '@/modules/catalog/price';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge, statusLabel } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { CatalogDetailActions } from '@/components/portal/catalog/CatalogDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function CatalogItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('catalog.read');
  const { id } = await params;
  const item = await getCatalogItem(id);
  if (!item) notFound();

  const [permKeys, rows] = await Promise.all([
    getUserPermissions(),
    getHistory('catalog_item', id, 50, 0),
  ]);
  const canUpdate = permKeys.includes('catalog.update');
  const canArchive = permKeys.includes('catalog.archive');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('catalog_item', id, 50);
    technical = {};
    for (const r of raw) {
      technical[r.id] = {
        metadata: r.metadata,
        old_values: r.old_values,
        new_values: r.new_values,
        ip_address: r.ip_address,
        user_agent: r.user_agent,
      };
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/catalog" className="text-sm text-red hover:underline">
        ← Back to catalog
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{item.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <StatusBadge entityType="catalog" status={item.status} size="md" />
            <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-xs">{statusLabel(item.itemType)}</span>
            {item.code ? <span className="font-mono text-xs">{item.code}</span> : null}
            <span className="font-medium text-ink">{formatCatalogPrice(item)}</span>
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Catalog history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {fmt(item.createdAt)}</div>
        <div>Updated {fmt(item.updatedAt)}</div>
        <div>{item.category ? `Category: ${item.category}` : 'No category'}</div>
        <div>{item.isPublic ? 'Public flag: on' : 'Internal only'}</div>
      </div>

      <div className="mt-4">
        <CatalogDetailActions item={item} canUpdate={canUpdate} canArchive={canArchive} />
      </div>
    </div>
  );
}
