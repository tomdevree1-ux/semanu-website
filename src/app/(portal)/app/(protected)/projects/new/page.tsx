import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { listCompanyOptions } from '@/modules/companies/queries';
import { listProjectOwnerOptions, listContactOptionsForCompany } from '@/modules/projects/queries';
import { ProjectForm } from '@/components/portal/projects/ProjectForm';

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('projects.create');
  const sp = await searchParams;

  const [companies, owners] = await Promise.all([listCompanyOptions(1000), listProjectOwnerOptions()]);
  const preselectedCompanyId = sp.companyId && companies.some((c) => c.id === sp.companyId) ? sp.companyId : undefined;
  const contactOptions = preselectedCompanyId ? await listContactOptionsForCompany(preselectedCompanyId) : undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/projects" className="text-sm text-red hover:underline">
        ← Back to projects
      </Link>
      <h1 className="mt-3 font-display text-3xl text-ink">New project</h1>
      <p className="mt-1 text-sm text-ink-soft">A project always belongs to one company.</p>

      <div className="mt-5">
        {companies.length ? (
          <ProjectForm
            companies={companies}
            owners={owners}
            preselectedCompanyId={preselectedCompanyId}
            contactOptions={contactOptions}
          />
        ) : (
          <div className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
            You need a company first.{' '}
            <Link href="/app/companies/new" className="text-red hover:underline">
              Create a company
            </Link>{' '}
            then add projects to it.
          </div>
        )}
      </div>
    </div>
  );
}
