import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listCompanyOptions } from '@/modules/companies/queries';
import { QuoteForm } from '@/components/portal/quotes/QuoteForm';

export default async function NewQuotePage() {
  await requirePermission('quotes.create');
  const companies = await listCompanyOptions(1000);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/quotes" className="text-sm text-red hover:underline">
        ← Back to quotes
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New quote</h1>
      <p className="mt-1 text-sm text-ink-soft">A quote always belongs to one company.</p>

      <div className="mt-5">
        {companies.length ? (
          <QuoteForm companies={companies} />
        ) : (
          <div className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
            You need a company first.{' '}
            <Link href="/app/companies/new" className="text-red hover:underline">
              Create a company
            </Link>{' '}
            then create quotes for it.
          </div>
        )}
      </div>
    </div>
  );
}
