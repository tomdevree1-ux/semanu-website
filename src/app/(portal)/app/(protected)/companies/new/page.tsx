import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { CompanyForm } from '@/components/portal/companies/CompanyForm';

export default async function NewCompanyPage() {
  await requirePermission('companies.create');
  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/companies" className="text-sm text-red hover:underline">
        ← Back to companies
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New company</h1>
      <p className="mt-1 text-sm text-ink-soft">Create a CRM company record. Source is set to Manual.</p>
      <div className="mt-5">
        <CompanyForm />
      </div>
    </div>
  );
}
