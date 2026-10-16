'use client';

import { useActionState } from 'react';
import { createCompany } from '@/modules/companies/actions';
import { COMPANY_LANGUAGES, type CompanyActionState } from '@/modules/companies/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: CompanyActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/** Create-company form. The action redirects to the new company on success. */
export function CompanyForm() {
  const [state, formAction, pending] = useActionState(createCompany, empty);

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">Company name <span className="text-red">*</span></span>
        <input name="companyName" required maxLength={200} disabled={pending} className={input} />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Domain</span>
          <input name="domain" placeholder="example.ch" maxLength={255} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Website</span>
          <input name="websiteUrl" placeholder="https://example.ch" maxLength={500} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Email</span>
          <input name="email" type="email" maxLength={200} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Phone</span>
          <input name="phone" maxLength={50} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">City</span>
          <input name="city" maxLength={120} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Canton</span>
          <input name="canton" maxLength={120} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Country</span>
          <input name="country" defaultValue="CH" maxLength={2} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Language</span>
          <select name="language" defaultValue="" disabled={pending} className={input}>
            <option value="">—</option>
            {COMPANY_LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink">Industry</span>
          <input name="industry" maxLength={120} disabled={pending} className={input} />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">Notes</span>
        <textarea name="notes" rows={3} maxLength={5000} disabled={pending} className={input} />
      </label>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Create company'}
      </button>
    </form>
  );
}
