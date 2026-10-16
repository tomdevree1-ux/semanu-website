'use client';

import { useActionState } from 'react';
import {
  previewSubscriptionChange,
  cancelSubscriptionChangeRequest,
  archiveSubscriptionChangeRequest,
  restoreSubscriptionChangeRequest,
  updateChangeRequestNotes,
  executeSubscriptionChange,
  retrySubscriptionChange,
} from '@/modules/subscription-changes/actions';
import type { ChangeRequestActionState } from '@/modules/subscription-changes/schema';
import type { ChangeRequestDetail } from '@/modules/subscription-changes/types';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { changeActionLabel, formatPreviewAmount } from '@/modules/subscription-changes/format';

const empty: ChangeRequestActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5';
const danger = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: ChangeRequestActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

type Summary = { currency?: string | null; estimatedTotal?: number | null; lineCount?: number | null; periodEnd?: string | null; target?: string | null; prorationBehavior?: string | null };

export function ChangeRequestDetailActions({
  req,
  canPreview,
  canRequest,
  canArchive,
  needsPreview,
  canExecute,
  executionEnabled,
  executable,
  needsConfirm,
  stripeSubscriptionId,
}: {
  req: ChangeRequestDetail;
  canPreview: boolean;
  canRequest: boolean;
  canArchive: boolean;
  needsPreview: boolean;
  /** Viewer holds the per-action execute permission (admin-only). */
  canExecute: boolean;
  /** ENABLE_STRIPE_SUBSCRIPTION_MUTATIONS is on in this environment. */
  executionEnabled: boolean;
  /** Request is in an executable state and the subscription is mutable. */
  executable: boolean;
  /** Destructive action (cancel_immediately) — requires type-to-confirm. */
  needsConfirm: boolean;
  stripeSubscriptionId: string;
}) {
  const [previewState, previewAction, previewPending] = useActionState(previewSubscriptionChange, empty);
  const [cancelState, cancelAction] = useActionState(cancelSubscriptionChangeRequest, empty);
  const [archiveState, archiveAction] = useActionState(archiveSubscriptionChangeRequest, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreSubscriptionChangeRequest, empty);
  const [execState, execAction, execPending] = useActionState(executeSubscriptionChange, empty);
  const [retryState, retryAction, retryPending] = useActionState(retrySubscriptionChange, empty);

  const cancellable = req.status === 'draft' || req.status === 'previewed';
  const archivable = ['previewed', 'cancelled', 'failed', 'executed'].includes(req.status);
  const summary = (req.safeSummary as Summary) ?? {};

  if (req.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">This change request is archived. Restore it (to Cancelled) to view it in the default list again.</p>
          <Notice s={restoreState} okText="Request restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="id" value={req.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore request'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">{changeActionLabel(req.actionType)}</h2>
        <div className="mt-2 rounded-lg bg-spark/10 px-3 py-2 text-xs text-ink">
          Preview and request only. <strong>This does not change the subscription in Stripe.</strong> Executing the change
          (with any proration) is deferred to P12B2.
        </div>

        {needsPreview ? (
          <div className="mt-3">
            <Notice s={previewState} okText="Preview updated." />
            {canPreview && (req.status === 'draft' || req.status === 'previewed') ? (
              <form action={previewAction} className="mt-2">
                <input type="hidden" name="id" value={req.id} />
                <button type="submit" disabled={previewPending} className={ghost}>
                  {previewPending ? 'Previewing…' : req.status === 'previewed' ? 'Re-run preview' : 'Preview change'}
                </button>
              </form>
            ) : null}
            {req.errorSummary ? <p className="mt-2 text-xs text-red">Preview error: {req.errorSummary}</p> : null}
          </div>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">This action does not need a preview. It is a request only; execution is deferred to P12B2.</p>
        )}
      </div>

      {needsPreview && (summary.estimatedTotal != null || summary.lineCount != null) ? (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Preview estimate</h2>
          <p className="mt-1 text-xs text-ink-soft">Stripe upcoming-invoice estimate. Advisory and time-sensitive; it must be recomputed before any future execution.</p>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Read label="Estimated total" value={formatPreviewAmount(summary.estimatedTotal ?? null, summary.currency ?? null)} />
            <Read label="Proration lines" value={summary.lineCount != null ? String(summary.lineCount) : '—'} />
            <Read label="Target" value={summary.target ?? null} />
            <Read label="Proration behavior" value={summary.prorationBehavior ?? null} />
            <Read label="Period end" value={summary.periodEnd ? new Date(summary.periodEnd).toLocaleDateString() : null} />
          </dl>
        </div>
      ) : null}

      {canExecute ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Execution</h2>
          {req.status === 'executed' ? (
            <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">
              Executed. Stripe was updated and the registry was synced.
            </p>
          ) : req.status === 'failed' ? (
            <div className="mt-2">
              <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
                Execution failed{req.errorSummary ? `: ${req.errorSummary}` : '.'}
              </p>
              <Notice s={retryState} okText="Re-executed." />
              {executionEnabled ? (
                <form
                  action={retryAction}
                  onSubmit={(ev) => { if (!window.confirm('Retry this execution against Stripe now?')) ev.preventDefault(); }}
                  className="mt-3"
                >
                  <input type="hidden" name="id" value={req.id} />
                  {needsConfirm ? <input type="hidden" name="confirmationEmail" value={stripeSubscriptionId} /> : null}
                  <button type="submit" disabled={retryPending} className={danger}>{retryPending ? 'Retrying…' : 'Retry execution'}</button>
                </form>
              ) : (
                <FlagOff />
              )}
            </div>
          ) : !executionEnabled ? (
            <FlagOff />
          ) : executable ? (
            <div className="mt-2">
              <p className="rounded-lg bg-spark/10 px-3 py-2 text-xs text-ink">
                <strong>Stripe will be changed.</strong>{' '}
                {needsPreview ? 'A fresh preview runs immediately before applying; proration may apply.' : null}
                {needsConfirm ? ' This cancels the subscription immediately and there is no automatic rollback.' : null}
              </p>
              <Notice s={execState} okText="Executed." />
              <div className="mt-3">
                {needsConfirm ? (
                  <ConfirmDialog
                    triggerLabel="Cancel subscription immediately"
                    triggerClassName={danger}
                    title="Cancel this subscription immediately"
                    description="Type the Stripe subscription id to confirm. This changes Stripe immediately and cannot be automatically rolled back."
                    confirmWord={stripeSubscriptionId}
                    confirmLabel="Cancel immediately"
                    action={executeSubscriptionChange}
                    hiddenFields={{ id: req.id }}
                    danger
                  />
                ) : (
                  <form
                    action={execAction}
                    onSubmit={(ev) => { if (!window.confirm('Apply this change to the Stripe subscription now? Proration may apply.')) ev.preventDefault(); }}
                    className="inline"
                  >
                    <input type="hidden" name="id" value={req.id} />
                    <button type="submit" disabled={execPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
                      {execPending ? 'Executing…' : `Execute ${changeActionLabel(req.actionType).toLowerCase()}`}
                    </button>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">This request cannot be executed in its current state.</p>
          )}
        </div>
      ) : null}

      {canRequest ? (
        <EditableBlock
          title="Notes"
          action={updateChangeRequestNotes}
          hiddenFields={{ id: req.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Notes" value={req.notes} />
              <Read label="Internal notes" value={req.internalNotes} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" defaultValue={req.notes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={req.internalNotes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {canRequest && cancellable ? (
          <form action={cancelAction} onSubmit={(ev) => { if (!window.confirm('Cancel this change request? (This does not affect Stripe.)')) ev.preventDefault(); }} className="inline">
            <input type="hidden" name="id" value={req.id} />
            <button type="submit" className={danger}>Cancel request</button>
          </form>
        ) : null}
        {canArchive && archivable ? (
          <form action={archiveAction} onSubmit={(ev) => { if (!window.confirm('Archive this change request?')) ev.preventDefault(); }} className="inline">
            <input type="hidden" name="id" value={req.id} />
            <button type="submit" className={ghost}>Archive request</button>
          </form>
        ) : null}
      </div>
      <Notice s={cancelState} okText="Request cancelled." />
      <Notice s={archiveState} okText="Request archived." />
    </div>
  );
}

function FlagOff() {
  return (
    <p className="mt-2 rounded-lg bg-ink/5 px-3 py-2 text-sm text-ink-soft">
      Subscription execution is disabled in this environment.
    </p>
  );
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="break-words text-ink">{value || '—'}</dd>
    </div>
  );
}
