import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { listCatalogItems, listCatalogCategories } from '@/modules/catalog/queries';
import { CATALOG_ITEM_TYPES, CATALOG_BILLING_INTERVALS } from '@/modules/catalog/schema';
import { CatalogTable } from '@/components/portal/catalog/CatalogTable';
import { ListHeader, NewButton, FilterBar, FilterSearch, FilterSelect, FilterCheckbox, Pager } from '@/components/portal/ui/ListChrome';

const STATUSES = ['draft', 'active', 'inactive', 'archived'] as const;

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('catalog.read');
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1);
  const showArchived = sp.archived === '1';

  const [{ rows, total, pageSize }, categories, permKeys] = await Promise.all([
    listCatalogItems({
      q: sp.q,
      status: sp.status,
      itemType: sp.itemType,
      category: sp.category,
      billingInterval: sp.billingInterval,
      showArchived,
      page,
    }),
    listCatalogCategories(),
    getUserPermissions(),
  ]);
  const canCreate = permKeys.includes('catalog.create');
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const qs = (p: number) => {
    const u = new URLSearchParams();
    if (sp.q) u.set('q', sp.q);
    if (sp.status) u.set('status', sp.status);
    if (sp.itemType) u.set('itemType', sp.itemType);
    if (sp.category) u.set('category', sp.category);
    if (sp.billingInterval) u.set('billingInterval', sp.billingInterval);
    if (showArchived) u.set('archived', '1');
    u.set('page', String(p));
    return `?${u.toString()}`;
  };

  return (
    <div>
      <ListHeader
        title="Catalog"
        action={canCreate ? <NewButton href="/app/catalog/new" label="New item" /> : undefined}
      />

      <FilterBar>
        <FilterSearch defaultValue={sp.q} placeholder="Name, code, description" />
        <FilterSelect name="status" defaultValue={sp.status} allLabel="All statuses" options={STATUSES.map((s) => ({ value: s, label: titleize(s) }))} />
        <FilterSelect name="itemType" defaultValue={sp.itemType} allLabel="All types" options={CATALOG_ITEM_TYPES.map((t) => ({ value: t, label: titleize(t) }))} />
        <FilterSelect name="billingInterval" defaultValue={sp.billingInterval} allLabel="All billing" options={CATALOG_BILLING_INTERVALS.map((b) => ({ value: b, label: titleize(b) }))} />
        {categories.length ? (
          <FilterSelect name="category" defaultValue={sp.category} allLabel="All categories" options={categories.map((c) => ({ value: c, label: c }))} />
        ) : null}
        <FilterCheckbox defaultChecked={showArchived} label="Show archived" />
      </FilterBar>

      <div className="mt-1">
        <CatalogTable rows={rows} />
      </div>

      <Pager page={page} totalPages={totalPages} total={total} noun="items" href={qs} />
    </div>
  );
}
