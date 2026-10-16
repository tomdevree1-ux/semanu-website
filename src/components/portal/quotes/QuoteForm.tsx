'use client';

import { useActionState } from 'react';
import { createQuote } from '@/modules/quotes/actions';
import type { QuoteActionState } from '@/modules/quotes/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: QuoteActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/** Create a quote. A company is required; contact/project/lines are added on the detail page. */
export function QuoteForm({ companies }: { companies: Array<{ id: string; name: string }> }) {
  const [state, formAction, pending] = useActionState(createQuote, empty);

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">Title <span className="text-red">*</span></span>
        <input name="title" required maxLength={200} disabled={pending} className={input} />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Company <span className="text-red">*</span></span>
          <select name="companyId" defaultValue="" required disabled={pending} className={input}>
            <option value="" disabled>Choose a company…</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Valid until</span>
          <input name="validUntil" type="date" disabled={pending} className={input} />
        </label>
      </div>

      <p className="mt-2 text-xs text-ink-soft">
        After creating, you can add a contact, a project, line items, discount, tax and notes on the
        quote page.
      </p>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Create quote'}
      </button>
    </form>
  );
}
