'use client';

import { useActionState } from 'react';
import { cancelPaymentLink, archivePaymentLink, restorePaymentLink, updatePaymentLinkNotes } from '@/modules/payment-links/actions';
import type { PaymentLinkActionState } from '@/modules/payment-links/schema';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { CopyLinkButton } from './CopyLinkButton';
import { formatMoney } from '@/modules/payments/totals';
import type { PaymentLinkDetail } from '@/modules/payment-links/types';

const empty: PaymentLinkActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: PaymentLinkActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function PaymentLinkDetailActions({
  link,
  canCreate,
  canCancel,
  canArchive,
}: {
  link: PaymentLinkDetail;
  canCreate: boolean;
  canCancel: boolean;
  canArchive: boolean;
}) {
  const [cancelState, cancelAction] = useActionState(cancelPaymentLink, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restorePaymentLink, empty);

  const archivable = ['cancelled', 'expired', 'failed', 'paid'].includes(link.status);

  if (link.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">This payment link is archived. Restore it (to Cancelled) to manage again.</p>
          <Notice s={restoreState} okText="Payment link restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="paymentLinkId" value={link.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore payment link'}
              </button>
            </form>
          ) : null}
        </div>
        <DetailsCard link={link} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Payment page</h2>
        {link.isStale ? (
          <p className="mt-1 text-xs text-ink"><span className="rounded-pill bg-spark/15 px-2 py-0.5">Amount stale</span> The invoice balance changed since this link was generated. Regenerate from the invoice.</p>
        ) : null}
        <Notice s={cancelState} okText="Payment link cancelled." />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {link.url && link.isActive ? <CopyLinkButton url={link.url} /> : null}
          {link.url && link.isActive ? <a href={link.url} target="_blank" rel="noopener noreferrer" className={ghost}>Open payment page</a> : null}
          {!link.isActive ? <span className="text-sm text-ink-soft">This link is {link.status} and can no longer be paid.</span> : null}
          {canCancel && link.isActive ? (
            <form action={cancelAction} onSubmit={(e) => { if (!window.confirm('Cancel this payment link?')) e.preventDefault(); }} className="inline">
              <input type="hidden" name="paymentLinkId" value={link.id} />
              <button type="submit" className={dangerBtn}>Cancel link</button>
            </form>
          ) : null}
        </div>
      </div>

      <DetailsCard link={link} />

      {canCreate ? (
        <EditableBlock
          title="Notes"
          action={updatePaymentLinkNotes}
          hiddenFields={{ paymentLinkId: link.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Notes" value={link.notes} />
              <Read label="Internal notes" value={link.internalNotes} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" defaultValue={link.notes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={link.internalNotes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canArchive && archivable ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">Archiving hides the payment link from the default list (no hard delete; restore to Cancelled). Only cancelled, expired, failed or paid links can be archived.</p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive payment link"
              triggerClassName={dangerBtn}
              title="Archive this payment link"
              description={`Type the invoice number ${link.invoiceNumber ?? ''} to archive this payment link.`}
              confirmWord={link.invoiceNumber ?? link.id.slice(0, 8)}
              confirmLabel="Archive payment link"
              action={archivePaymentLink}
              hiddenFields={{ paymentLinkId: link.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailsCard({ link }: { link: PaymentLinkDetail }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Details</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Read label="Amount" value={formatMoney(link.amount, link.currency)} />
        <Read label="Provider" value={link.provider} />
        <Read label="Checkout session id" value={link.providerCheckoutSessionId} />
        <Read label="Payment intent id" value={link.providerPaymentIntentId} />
        <Read label="Linked payment" value={link.invoicePaymentId} />
        <Read label="Expires" value={link.expiresAt ? new Date(link.expiresAt).toLocaleString() : null} />
      </dl>
    </div>
  );
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="break-all text-ink">{value || '—'}</dd>
    </div>
  );
}
