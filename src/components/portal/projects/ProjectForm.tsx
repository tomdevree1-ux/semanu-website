'use client';

import { useActionState } from 'react';
import { createProject } from '@/modules/projects/actions';
import type { ProjectActionState } from '@/modules/projects/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: ProjectActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

type Option = { id: string; name: string };

/**
 * Create-project form. A company is required (P6-D2). When the company is
 * preselected (Add project from a company page) its contacts are offered; for
 * the standalone path the contact is set afterward on the project detail page.
 */
export function ProjectForm({
  companies,
  owners,
  preselectedCompanyId,
  contactOptions,
}: {
  companies: Option[];
  owners: Option[];
  preselectedCompanyId?: string;
  contactOptions?: Option[];
}) {
  const [state, formAction, pending] = useActionState(createProject, empty);

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">Company <span className="text-red">*</span></span>
        <select name="companyId" defaultValue={preselectedCompanyId ?? ''} required disabled={pending} className={input}>
          <option value="" disabled>Choose a company…</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">Project name <span className="text-red">*</span></span>
        <input name="name" required maxLength={200} disabled={pending} className={input} />
      </label>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">Description</span>
        <textarea name="description" rows={3} maxLength={5000} disabled={pending} className={input} />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {contactOptions && contactOptions.length ? (
          <label className="block">
            <span className="text-sm font-medium text-ink">Primary contact</span>
            <select name="primaryContactId" defaultValue="" disabled={pending} className={input}>
              <option value="">— None</option>
              {contactOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="block">
          <span className="text-sm font-medium text-ink">Owner</span>
          <select name="ownerId" defaultValue="" disabled={pending} className={input}>
            <option value="">— Unassigned</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Start date</span>
          <input name="startDate" type="date" disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Due date</span>
          <input name="dueDate" type="date" disabled={pending} className={input} />
        </label>
      </div>

      {!contactOptions ? (
        <p className="mt-2 text-xs text-ink-soft">
          Tip: after creating, you can link a primary contact on the project page.
        </p>
      ) : null}

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Create project'}
      </button>
    </form>
  );
}
