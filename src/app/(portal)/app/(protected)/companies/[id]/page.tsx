import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getCompany, listAssignableOwners } from '@/modules/companies/queries';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { CompanyDetailActions } from '@/components/portal/companies/CompanyDetailActions';
import { CompanyProjects } from '@/components/portal/projects/CompanyProjects';
import { listProjectsForCompany } from '@/modules/projects/queries';
import { CompanySubscriptionsSection } from '@/components/portal/subscriptions/CompanySubscriptionsSection';
import { listSubscriptionsForCompany } from '@/modules/subscriptions/queries';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('companies.read');
  const { id } = await params;
  const company = await getCompany(id);
  if (!company) notFound();

  const [permKeys, owners, companyProjects, companySubs, rows] =
    await Promise.all([
      getUserPermissions(),
      listAssignableOwners(),
      listProjectsForCompany(id),
      listSubscriptionsForCompany(id),
      getHistory('company', id, 50, 0),
    ]);
  const canUpdate = permKeys.includes('companies.update');
  const canArchive = permKeys.includes('companies.archive');
  const canCreateContact = permKeys.includes('contacts.create');
  const canTech = permKeys.includes('audit.read_technical');
  const canProjectsRead = permKeys.includes('projects.read');
  const canProjectsCreate = permKeys.includes('projects.create');
  const canSubsRead = permKeys.includes('subscriptions.read');
  const canSubsLink = permKeys.includes('subscriptions.link');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('company', id, 50);
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

  const activeContacts = company.contacts.filter((c) => !c.archivedAt);

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/app/companies" className="text-sm text-red hover:underline">
        ← Back to companies
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{company.companyName}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge entityType="company" status={company.crmStatus} size="md" />
            <span className="rounded-pill bg-ink/5 px-2 py-0.5 text-xs text-ink-soft">
              Pipeline: {company.leadStatus.replace(/[_-]+/g, ' ')}
            </span>
            {company.domain ? <span className="text-sm text-ink-soft">{company.domain}</span> : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Company history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {fmt(company.createdAt)}</div>
        <div>Updated {fmt(company.updatedAt)}</div>
        <div>Source: {company.source.replace(/[_-]+/g, ' ')}</div>
        <div>{company.ownerName ? `Owner: ${company.ownerName}` : 'No owner assigned'}</div>
      </div>

      <div className="mt-4">
        <CompanyDetailActions company={company} owners={owners} canUpdate={canUpdate} canArchive={canArchive} />
      </div>

      <section className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-lg text-ink">Contacts</h2>
          {canCreateContact && !company.isArchived ? (
            <Link href={`/app/contacts/new?companyId=${company.id}`} className="rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5">
              Add contact
            </Link>
          ) : null}
        </div>
        {activeContacts.length ? (
          <ul className="mt-3 divide-y divide-ink/5">
            {activeContacts.map((ct) => (
              <li key={ct.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <Link href={`/app/contacts/${ct.id}`} className="font-medium text-ink hover:text-red">
                    {ct.name || ct.email || 'Unnamed contact'}
                  </Link>
                  <div className="truncate text-xs text-ink-soft">
                    {[ct.role, ct.email].filter(Boolean).join(' · ') || '—'}
                    {ct.isPrimary ? ' · Primary' : ''}
                  </div>
                </div>
                <StatusBadge entityType="contact" status={ct.contactStatus} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">No contacts yet.</p>
        )}
      </section>

      {canProjectsRead ? (
        <CompanyProjects
          projects={companyProjects}
          companyId={company.id}
          canCreate={canProjectsCreate}
          companyArchived={company.isArchived}
        />
      ) : null}

      {canSubsRead ? (
        <CompanySubscriptionsSection subscriptions={companySubs} companyId={company.id} canLink={canSubsLink} />
      ) : null}
    </div>
  );
}
