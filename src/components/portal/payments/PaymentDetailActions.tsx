'use client';

import { useActionState } from 'react';
import { updatePayment, changePaymentStatus, archivePayment, restorePayment } from '@/modules/payments/actions';
import type { PaymentActionState } from '@/modules/payments/schema';
import { legalNextPaymentStatuses, permissionForPaymentTransition, PAYMENT_CONFIRM_STATUSES, type PaymentStatus } from '@/modules/payments/status';
import { formatMoney } from '@/modules/payments/totals';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { PaymentDetail } from '@/modules/payments/types';

const empty: PaymentActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

const METHODS = ['manual', 'bank_transfer', 'cash', 'card', 'stripe', 'other'];
const PROVIDERS = ['manual', 'stripe', 'bank', 'other'];

function Notice({ s, okText = 'Saved.' }: { s: PaymentActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function PaymentDetailActions({
  payment,
  canUpdate,
  canArchive,
  canMarkSucceeded,
  canRefund,
  canCancel,
}: {
  payment: PaymentDetail;
  canUpdate: boolean;
  canArchive: boolean;
  canMarkSucceeded: boolean;
  canRefund: boolean;
  canCancel: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changePaymentStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restorePayment, empty);

  const permMap: Record<string, boolean> = {
    'payments.mark_succeeded': canMarkSucceeded,
    'payments.refund': canRefund,
    'payments.cancel': canCancel,
    'payments.update': canUpdate,
  };
  const targets = legalNextPaymentStatuses(payment.status as PaymentStatus).filter(
    (t) => permMap[permissionForPaymentTransition(payment.status as PaymentStatus, t)],
  );

  const archivable = ['pending', 'failed', 'cancelled', 'refunded'].includes(payment.status);

  if (payment.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">
            This payment is archived and hidden from the default list. Restore it (to Pending) to manage again.
          </p>
          <Notice s={restoreState} okText="Payment restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="paymentId" value={payment.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore payment'}
              </button>
            </form>
          ) : null}
        </div>
        <DetailsView payment={payment} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {targets.length > 0 ? (
        <form
          action={statusAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('status') as HTMLSelectElement | null)?.value ?? '';
            if (PAYMENT_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Set this payment to "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="paymentId" value={payment.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={targets[0]} disabled={statusPending} className={`${input} max-w-xs`}>
              {targets.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Apply'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-soft">Marking a payment Succeeded updates the invoice balance. No Stripe call is made.</p>
        </form>
      ) : null}

      {payment.isPending && canUpdate ? (
        <EditableBlock
          title="Payment details"
          action={updatePayment}
          hiddenFields={{ paymentId: payment.id }}
          readView={<DetailsGrid payment={payment} />}
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Amount ({payment.currency}) <span className="text-red">*</span></span>
                <input name="amount" type="number" min="0.01" step="0.01" defaultValue={String(payment.amount)} required disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Method</span>
                <select name="method" defaultValue={payment.method} disabled={pending} className={input}>
                  {METHODS.map((m) => <option key={m} value={m}>{statusLabel(m)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Provider</span>
                <select name="provider" defaultValue={payment.provider} disabled={pending} className={input}>
                  {PROVIDERS.map((p) => <option key={p} value={p}>{statusLabel(p)}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Provider payment id</span>
                <input name="providerPaymentId" defaultValue={payment.providerPaymentId ?? ''} maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Checkout session id</span>
                <input name="providerCheckoutSessionId" defaultValue={payment.providerCheckoutSessionId ?? ''} maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Payment intent id</span>
                <input name="providerPaymentIntentId" defaultValue={payment.providerPaymentIntentId ?? ''} maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Notes (customer facing)</span>
                <textarea name="notes" defaultValue={payment.notes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={payment.internalNotes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Payment details</h2>
          <div className="mt-3"><DetailsGrid payment={payment} /></div>
          {!payment.isPending ? (
            <p className="mt-2 text-xs text-ink-soft">Only pending payments are editable.</p>
          ) : null}
        </div>
      )}

      {canArchive && archivable ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the payment from the default list (no hard delete; it can be restored). A
            succeeded payment must be refunded before it can be archived.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive payment"
              triggerClassName={dangerBtn}
              title="Archive this payment"
              description={`Type the invoice number ${payment.invoiceNumber ?? ''} to archive this payment. It can be restored later.`}
              confirmWord={payment.invoiceNumber ?? payment.id.slice(0, 8)}
              confirmLabel="Archive payment"
              action={archivePayment}
              hiddenFields={{ paymentId: payment.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailsGrid({ payment }: { payment: PaymentDetail }) {
  return (
    <dl className="grid gap-3 sm:grid-cols-2">
      <Read label="Amount" value={formatMoney(payment.amount, payment.currency)} />
      <Read label="Method" value={statusLabel(payment.method)} />
      <Read label="Provider" value={statusLabel(payment.provider)} />
      <Read label="Provider payment id" value={payment.providerPaymentId} />
      <Read label="Checkout session id" value={payment.providerCheckoutSessionId} />
      <Read label="Payment intent id" value={payment.providerPaymentIntentId} />
      <Read label="Notes" value={payment.notes} />
      <Read label="Internal notes" value={payment.internalNotes} />
    </dl>
  );
}

function DetailsView({ payment }: { payment: PaymentDetail }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Payment details</h2>
      <div className="mt-3"><DetailsGrid payment={payment} /></div>
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
