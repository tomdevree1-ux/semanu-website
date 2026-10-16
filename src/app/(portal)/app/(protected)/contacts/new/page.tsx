import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listCompanyOptions } from '@/modules/companies/queries';
import { ContactForm } from '@/components/portal/contacts/ContactForm';

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('contacts.create');
  const sp = await searchParams;
  const companies = await listCompanyOptions(1000);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/contacts" className="text-sm text-red hover:underline">
        ← Back to contacts
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New contact</h1>
      <p className="mt-1 text-sm text-ink-soft">A contact always belongs to one company.</p>

      <div className="mt-5">
        {companies.length ? (
          <ContactForm companies={companies} preselectedCompanyId={sp.companyId} />
        ) : (
          <div className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
            You need a company first.{' '}
            <Link href="/app/companies/new" className="text-red hover:underline">
              Create a company
            </Link>{' '}
            then add contacts to it.
          </div>
        )}
      </div>
    </div>
  );
}
