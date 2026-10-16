'use client';

import { useActionState } from 'react';
import { linkExistingStripeSubscription } from '@/modules/subscriptions/actions';
import type { SubscriptionActionState } from '@/modules/subscriptions/schema';
import type { CompanyOption } from '@/modules/subscriptions/types';

const empty: SubscriptionActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/**
 * Link an EXISTING Stripe subscription into the registry (P12A). The snapshot (status, period,
 * plan/price, amount) is fetched server-side from Stripe — only the id + optional CRM links are
 * entered here. No Stripe mutation happens. On success the action redirects to the detail page.
 */
export function SubscriptionLinkForm({
  companies,
  prefillCompanyId,
}: {
  companies: CompanyOption[];
  prefillCompanyId?: string;
}) {
  const [state, formAction, pending] = useActionState(linkExistingStripeSubscription, empty);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">Stripe subscription id</span>
        <input name="stripeSubscriptionId" required placeholder="sub_1A2b3C…" autoComplete="off" className={`${input} font-mono`} />
        <span className="mt-1 block text-xs text-ink-soft">Find this in the Stripe dashboard. The subscription details are read from Stripe.</span>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Company (optional)</span>
        <select name="companyId" defaultValue={prefillCompanyId ?? ''} className={input}>
          <option value="">Suggest from the Stripe customer</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Stripe customer id (optional)</span>
        <input name="stripeCustomerId" placeholder="cus_… (read from the subscription if omitted)" autoComplete="off" className={`${input} font-mono`} />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Notes (optional)</span>
        <textarea name="notes" rows={2} maxLength={10000} className={input} />
      </label>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
        {pending ? 'Linking…' : 'Link subscription'}
      </button>
      <p className="text-xs text-ink-soft">Stripe stays the source of truth. Linking does not change the subscription in Stripe.</p>
    </form>
  );
}
