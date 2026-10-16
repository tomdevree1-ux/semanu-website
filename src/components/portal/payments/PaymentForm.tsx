'use client';

import { useActionState } from 'react';
import { createManualPayment } from '@/modules/payments/actions';
import type { PaymentActionState } from '@/modules/payments/schema';
import { formatMoney } from '@/modules/payments/totals';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: PaymentActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

const METHODS = [
  { value: 'manual', label: 'Manual' },
  { value: 'bank_transfer', label: 'Bank transfer' },
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'other', label: 'Other' },
];
const PROVIDERS = [
  { value: 'manual', label: 'Manual' },
  { value: 'stripe', label: 'Stripe' },
  { value: 'bank', label: 'Bank' },
  { value: 'other', label: 'Other' },
];

type FixedInvoice = { id: string; invoiceNumber: string; companyName: string | null; balanceDue: number; currency: string };

/** Record a manual payment (always created as `pending`; an admin confirms it as succeeded). */
export function PaymentForm({
  fixedInvoice,
  invoiceOptions,
}: {
  fixedInvoice: FixedInvoice | null;
  invoiceOptions: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, pending] = useActionState(createManualPayment, empty);

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      {state.error ? (
        <p className="mb-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      {fixedInvoice ? (
        <div className="rounded-lg border border-ink/10 bg-paper/40 p-3 text-sm">
          <input type="hidden" name="invoiceId" value={fixedInvoice.id} />
          <div className="text-ink">
            Invoice <span className="font-mono">{fixedInvoice.invoiceNumber}</span>
            {fixedInvoice.companyName ? <span className="text-ink-soft"> · {fixedInvoice.companyName}</span> : null}
          </div>
          <div className="text-ink-soft">Balance due {formatMoney(fixedInvoice.balanceDue, fixedInvoice.currency)}</div>
        </div>
      ) : (
        <label className="block">
          <span className="text-sm font-medium text-ink">Invoice <span className="text-red">*</span></span>
          <select name="invoiceId" defaultValue="" required disabled={pending} className={input}>
            <option value="" disabled>Choose an invoice…</option>
            {invoiceOptions.map((i) => (
              <option key={i.id} value={i.id}>{i.name}</option>
            ))}
          </select>
        </label>
      )}

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="text-sm font-medium text-ink">Amount ({fixedInvoice?.currency ?? 'CHF'}) <span className="text-red">*</span></span>
          <input
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            required
            disabled={pending}
            defaultValue={fixedInvoice && fixedInvoice.balanceDue > 0 ? String(fixedInvoice.balanceDue) : ''}
            className={input}
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Method</span>
          <select name="method" defaultValue="manual" disabled={pending} className={input}>
            {METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Provider</span>
          <select name="provider" defaultValue="manual" disabled={pending} className={input}>
            {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </label>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer text-sm text-ink-soft">Provider references (optional)</summary>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="text-xs text-ink-soft">Payment id</span>
            <input name="providerPaymentId" maxLength={200} disabled={pending} className={input} />
          </label>
          <label className="block">
            <span className="text-xs text-ink-soft">Checkout session id</span>
            <input name="providerCheckoutSessionId" maxLength={200} disabled={pending} className={input} />
          </label>
          <label className="block">
            <span className="text-xs text-ink-soft">Payment intent id</span>
            <input name="providerPaymentIntentId" maxLength={200} disabled={pending} className={input} />
          </label>
        </div>
      </details>

      <label className="mt-4 block">
        <span className="text-sm font-medium text-ink">Internal notes</span>
        <textarea name="internalNotes" rows={2} maxLength={10000} disabled={pending} className={input} />
      </label>

      <p className="mt-2 text-xs text-ink-soft">
        The payment is recorded as <strong>Pending</strong>. An admin confirms it as Succeeded, which
        updates the invoice balance. Recording a payment never calls Stripe.
      </p>

      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-5 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Record payment'}
      </button>
    </form>
  );
}
