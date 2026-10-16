'use client';

import { useActionState } from 'react';
import { createContact } from '@/modules/contacts/actions';
import type { ContactActionState } from '@/modules/contacts/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: ContactActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/** Create-contact form. A company is required (decision P5-D3). Redirects on success. */
export function ContactForm({
  companies,
  preselectedCompanyId,
}: {
  companies: Array<{ id: string; name: string }>;
  preselectedCompanyId?: string;
}) {
  const [state, formAction, pending] = useActionState(createContact, empty);

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

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Name <span className="text-red">*</span></span>
          <input name="name" required maxLength={120} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Role</span>
          <input name="role" placeholder="e.g. Owner" maxLength={120} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input name="email" type="email" maxLength={200} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input name="phone" maxLength={50} disabled={pending} className={input} />
        </label>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="isPrimary" value="on" disabled={pending} className="h-4 w-4" />
        Primary contact for this company
      </label>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Create contact'}
      </button>
    </form>
  );
}
