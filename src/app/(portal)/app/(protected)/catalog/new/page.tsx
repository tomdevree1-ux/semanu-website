import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { CatalogForm } from '@/components/portal/catalog/CatalogForm';

export default async function NewCatalogItemPage() {
  await requirePermission('catalog.create');
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/catalog" className="text-sm text-red hover:underline">
        ← Back to catalog
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New catalog item</h1>
      <p className="mt-1 text-sm text-ink-soft">Internal catalog. Prices are net (ex-VAT), in CHF.</p>
      <div className="mt-5">
        <CatalogForm />
      </div>
    </div>
  );
}
