import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listCompanyOptions } from '@/modules/companies/queries';
import { InvoiceForm } from '@/components/portal/invoices/InvoiceForm';

export default async function NewInvoicePage() {
  await requirePermission('invoices.create');
  const companies = await listCompanyOptions(1000);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/invoices" className="text-sm text-red hover:underline">
        ← Back to invoices
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New invoice</h1>
      <p className="mt-1 text-sm text-ink-soft">An invoice always belongs to one company.</p>

      <div className="mt-5">
        {companies.length ? (
          <InvoiceForm companies={companies} />
        ) : (
          <div className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
            You need a company first.{' '}
            <Link href="/app/companies/new" className="text-red hover:underline">
              Create a company
            </Link>{' '}
            then create invoices for it.
          </div>
        )}
      </div>
    </div>
  );
}
