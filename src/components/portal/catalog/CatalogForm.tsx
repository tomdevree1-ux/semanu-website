'use client';

import { useActionState } from 'react';
import { createCatalogItem } from '@/modules/catalog/actions';
import { CATALOG_ITEM_TYPES, CATALOG_BILLING_INTERVALS, type CatalogActionState } from '@/modules/catalog/schema';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: CatalogActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/** Create a catalog item. Status starts at Draft; redirects on success. */
export function CatalogForm() {
  const [state, formAction, pending] = useActionState(createCatalogItem, empty);

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-sm font-medium text-ink">Name <span className="text-red">*</span></span>
        <input name="name" required maxLength={200} disabled={pending} className={input} />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">Code</span>
          <input name="code" placeholder="e.g. starter" maxLength={60} disabled={pending} className={`${input} font-mono`} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Category</span>
          <input name="category" maxLength={120} disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Type</span>
          <select name="itemType" defaultValue="service" disabled={pending} className={input}>
            {CATALOG_ITEM_TYPES.map((t) => (
              <option key={t} value={t}>{statusLabel(t)}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Billing</span>
          <select name="billingInterval" defaultValue="one_time" disabled={pending} className={input}>
            {CATALOG_BILLING_INTERVALS.map((b) => (
              <option key={b} value={b}>{statusLabel(b)}</option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">Description</span>
        <textarea name="description" rows={3} maxLength={5000} disabled={pending} className={input} />
      </label>

      <fieldset className="mt-4 rounded-lg border border-ink/10 p-4">
        <legend className="px-1 text-xs font-medium uppercase tracking-wide text-ink-soft">Pricing (net, CHF)</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-medium text-ink">Base price (CHF)</span>
            <input name="basePrice" type="number" min="0" step="0.01" placeholder="leave blank = on request" disabled={pending} className={input} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink">Setup fee (CHF)</span>
            <input name="setupFee" type="number" min="0" step="0.01" disabled={pending} className={input} />
          </label>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" name="priceIsFrom" value="on" disabled={pending} className="h-4 w-4" />
          Show as a starting price (&quot;From CHF …&quot;)
        </label>
      </fieldset>

      <label className="mt-4 flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" name="isPublic" value="on" disabled={pending} className="h-4 w-4" />
        Public (internal flag only; no public catalog in P7)
      </label>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Create item'}
      </button>
    </form>
  );
}
