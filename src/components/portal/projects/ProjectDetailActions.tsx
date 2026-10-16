'use client';

import { useActionState } from 'react';
import { updateProject, changeProjectStatus, archiveProject, restoreProject } from '@/modules/projects/actions';
import type { ProjectActionState } from '@/modules/projects/schema';
import { PROJECT_SELECTABLE_STATUSES, PROJECT_CONFIRM_STATUSES } from '@/modules/projects/status';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { ProjectDetail } from '@/modules/projects/types';

const empty: ProjectActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

type Option = { id: string; name: string };

function Notice({ s, okText = 'Saved.' }: { s: ProjectActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function ProjectDetailActions({
  project,
  contactOptions,
  owners,
  canUpdate,
  canArchive,
}: {
  project: ProjectDetail;
  contactOptions: Option[];
  owners: Option[];
  canUpdate: boolean;
  canArchive: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeProjectStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreProject, empty);

  // Keep the current contact selectable even if it is archived (not in the active picker).
  const contacts: Option[] =
    project.primaryContactId && !contactOptions.some((c) => c.id === project.primaryContactId)
      ? [{ id: project.primaryContactId, name: `${project.primaryContactName ?? 'Contact'} (archived)` }, ...contactOptions]
      : contactOptions;

  if (project.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This project is archived and hidden from the default list. Restore it to manage again.
        </p>
        <Notice s={restoreState} okText="Project restored." />
        {canArchive ? (
          <form action={restoreAction} className="mt-3">
            <input type="hidden" name="projectId" value={project.id} />
            <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
              {restorePending ? 'Restoring…' : 'Restore project'}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUpdate ? (
        <EditableBlock
          title="Project info"
          action={updateProject}
          hiddenFields={{ projectId: project.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-soft">Description</dt>
                <dd className="whitespace-pre-wrap text-ink">{project.description || '—'}</dd>
              </div>
              <Read label="Primary contact" value={project.primaryContactName} />
              <Read label="Owner" value={project.ownerName} />
              <Read label="Start date" value={project.startDate} />
              <Read label="Due date" value={project.dueDate} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Project name <span className="text-red">*</span></span>
                <input name="name" defaultValue={project.name} required maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Description</span>
                <textarea name="description" defaultValue={project.description ?? ''} rows={3} maxLength={5000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Primary contact</span>
                <select name="primaryContactId" defaultValue={project.primaryContactId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Owner</span>
                <select name="ownerId" defaultValue={project.ownerId ?? ''} disabled={pending} className={input}>
                  <option value="">— Unassigned</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Start date</span>
                <input name="startDate" type="date" defaultValue={project.startDate ?? ''} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Due date</span>
                <input name="dueDate" type="date" defaultValue={project.dueDate ?? ''} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canUpdate ? (
        <form
          action={statusAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('status') as HTMLSelectElement | null)?.value ?? '';
            if (PROJECT_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Set this project to "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="projectId" value={project.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={project.status} disabled={statusPending} className={`${input} max-w-xs`}>
              {PROJECT_SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the project from the default list. It is kept (no hard delete) and can be
            restored.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive project"
              triggerClassName={dangerBtn}
              title="Archive this project"
              description={`This hides ${project.name} from the default list. It can be restored later.`}
              confirmWord={project.name}
              confirmLabel="Archive project"
              action={archiveProject}
              hiddenFields={{ projectId: project.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="text-ink">{value || '—'}</dd>
    </div>
  );
}
