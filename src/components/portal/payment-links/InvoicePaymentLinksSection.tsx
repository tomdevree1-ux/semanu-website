'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { createStripeCheckoutForInvoice, regeneratePaymentLink, cancelPaymentLink } from '@/modules/payment-links/actions';
import type { PaymentLinkActionState } from '@/modules/payment-links/schema';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { Spinner } from '@/components/portal/ui/Spinner';
import { CopyLinkButton } from './CopyLinkButton';
import { formatMoney } from '@/modules/payments/totals';
import type { InvoiceLinkRow } from '@/modules/payment-links/types';

const empty: PaymentLinkActionState = {};
const ghost = 'rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/**
 * Additive Payment-links section on the invoice detail (P11). Shows the active link
 * (copy/open/cancel/regenerate) or a Generate button, plus past links. Generating a
 * link never moves the invoice's paid figures (the P10 Payments section is unchanged).
 */
export function InvoicePaymentLinksSection({
  invoiceId,
  currency,
  activeLink,
  links,
  canCreate,
  canCancel,
  canGenerate,
}: {
  invoiceId: string;
  currency: string;
  activeLink: InvoiceLinkRow | null;
  links: InvoiceLinkRow[];
  canCreate: boolean;
  canCancel: boolean;
  canGenerate: boolean;
}) {
  const past = links.filter((l) => l.id !== activeLink?.id);

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Payment links</h2>
      <p className="mt-1 text-xs text-ink-soft">A Stripe payment page for the outstanding balance. Generating a link does not change the invoice balance.</p>

      {activeLink ? (
        <div className="mt-3 rounded-lg border border-ink/10 bg-paper/40 p-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <StatusBadge entityType="payment_link" status={activeLink.status} />
            <span className="text-ink">{formatMoney(activeLink.amount, activeLink.currency)}</span>
            {activeLink.isStale ? (
              <span className="rounded-pill bg-spark/15 px-2 py-0.5 text-xs text-ink">Amount stale — regenerate</span>
            ) : null}
            <span className="text-xs text-ink-soft">created {fmt(activeLink.createdAt)}{activeLink.expiresAt ? ` · expires ${fmt(activeLink.expiresAt)}` : ''}</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {activeLink.url ? <CopyLinkButton url={activeLink.url} /> : null}
            {activeLink.url ? (
              <a href={activeLink.url} target="_blank" rel="noopener noreferrer" className={ghost}>Open payment page</a>
            ) : null}
            {canCancel ? <CancelButton linkId={activeLink.id} /> : null}
            {canCreate ? <RegenerateButton invoiceId={invoiceId} /> : null}
            <Link href={`/app/payment-links/${activeLink.id}`} className="text-xs text-red hover:underline">Details</Link>
          </div>
        </div>
      ) : canCreate && canGenerate ? (
        <GenerateButton invoiceId={invoiceId} />
      ) : (
        <p className="mt-3 text-sm text-ink-soft">
          {canCreate
            ? 'A payment link can be generated once the invoice is issued or overdue with a balance due.'
            : 'No active payment link.'}
        </p>
      )}

      {past.length ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
              <tr><th className="py-2 pr-2 font-medium">Ref</th><th className="py-2 pr-2 font-medium">Amount</th><th className="py-2 pr-2 font-medium">Status</th><th className="py-2 pr-2 font-medium">Created</th></tr>
            </thead>
            <tbody>
              {past.map((l) => (
                <tr key={l.id} className="border-b border-ink/5 last:border-0">
                  <td className="py-2 pr-2"><Link href={`/app/payment-links/${l.id}`} className="font-mono text-xs text-red hover:underline">{l.id.slice(0, 8)}</Link>{l.archivedAt ? <span className="text-xs text-ink-soft"> (archived)</span> : null}</td>
                  <td className="py-2 pr-2 text-ink">{formatMoney(l.amount, l.currency)}</td>
                  <td className="py-2 pr-2"><StatusBadge entityType="payment_link" status={l.status} /></td>
                  <td className="py-2 pr-2 text-ink-soft">{fmt(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}

function GenerateButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(createStripeCheckoutForInvoice, empty);
  return (
    <form action={formAction} className="mt-3">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      {state.error ? <p className="mb-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p> : null}
      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Generate payment link'}
      </button>
    </form>
  );
}

function RegenerateButton({ invoiceId }: { invoiceId: string }) {
  const [state, formAction, pending] = useActionState(regeneratePaymentLink, empty);
  return (
    <form action={formAction} onSubmit={(e) => { if (!window.confirm('Regenerate the payment link? The current active link will be cancelled.')) e.preventDefault(); }} className="inline">
      <input type="hidden" name="invoiceId" value={invoiceId} />
      <button type="submit" disabled={pending} className={ghost}>{pending ? 'Working…' : 'Regenerate'}</button>
      {state.error ? <span className="ml-2 text-xs text-danger">{state.error}</span> : null}
    </form>
  );
}

function CancelButton({ linkId }: { linkId: string }) {
  const [, formAction] = useActionState(cancelPaymentLink, empty);
  return (
    <form action={formAction} onSubmit={(e) => { if (!window.confirm('Cancel this payment link?')) e.preventDefault(); }} className="inline">
      <input type="hidden" name="paymentLinkId" value={linkId} />
      <button type="submit" className="rounded-pill border border-danger/40 px-3 py-1.5 text-sm text-danger hover:bg-danger/5">Cancel link</button>
    </form>
  );
}
