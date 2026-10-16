import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getProject, listProjectOwnerOptions, listContactOptionsForCompany } from '@/modules/projects/queries';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { ProjectDetailActions } from '@/components/portal/projects/ProjectDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('projects.read');
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const [permKeys, owners, contactOptions, rows] = await Promise.all([
    getUserPermissions(),
    listProjectOwnerOptions(),
    listContactOptionsForCompany(project.companyId),
    getHistory('project', id, 50, 0),
  ]);
  const canUpdate = permKeys.includes('projects.update');
  const canArchive = permKeys.includes('projects.archive');
  const canTech = permKeys.includes('audit.read_technical');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('project', id, 50);
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
      <Link href="/app/projects" className="text-sm text-red hover:underline">
        ← Back to projects
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title">{project.name}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <StatusBadge entityType="project" status={project.status} size="md" />
            <span>
              for{' '}
              <Link href={`/app/companies/${project.companyId}`} className="text-red hover:underline">
                {project.companyName || 'company'}
              </Link>
              {project.companyArchived ? ' (archived)' : ''}
            </span>
            {project.primaryContactId ? (
              <span>
                ·{' '}
                <Link href={`/app/contacts/${project.primaryContactId}`} className="text-red hover:underline">
                  {project.primaryContactName || 'contact'}
                </Link>
                {project.primaryContactArchived ? ' (archived)' : ''}
              </span>
            ) : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Project history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft">
        <div>Created {fmt(project.createdAt)}</div>
        <div>Updated {fmt(project.updatedAt)}</div>
        <div>{project.startDate ? `Starts ${fmt(project.startDate)}` : 'No start date'}</div>
        <div>{project.dueDate ? `Due ${fmt(project.dueDate)}` : 'No due date'}</div>
        <div>{project.ownerName ? `Owner: ${project.ownerName}` : 'No owner assigned'}</div>
      </div>

      <div className="mt-4">
        <ProjectDetailActions
          project={project}
          contactOptions={contactOptions}
          owners={owners}
          canUpdate={canUpdate}
          canArchive={canArchive}
        />
      </div>
    </div>
  );
}
