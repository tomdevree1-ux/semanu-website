'use client';

import { useActionState } from 'react';
import { createSubscriptionChangeRequest } from '@/modules/subscription-changes/actions';
import type { ChangeRequestActionState } from '@/modules/subscription-changes/schema';
import type { AllowedAction } from '@/modules/subscription-changes/types';
import { changeActionLabel } from '@/modules/subscription-changes/format';

const empty: ChangeRequestActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-40';
const danger = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5 disabled:opacity-40';

/**
 * P12B1 subscription action panel. Creates change REQUESTS (and, for plan/quantity, the request can be
 * previewed on its detail page). It NEVER applies a change to Stripe — there is deliberately no
 * "Apply"/"Execute" control. Live execution is P12B2 (separate approval). Hidden entirely for users
 * without `subscriptions.request_change`.
 */
export function SubscriptionActionPanel({
  customerSubscriptionId,
  allowed,
  planOptions,
}: {
  customerSubscriptionId: string;
  allowed: AllowedAction[];
  planOptions: { key: string; label: string }[];
}) {
  const [state, formAction] = useActionState(createSubscriptionChangeRequest, empty);
  const by = (a: string) => allowed.find((x) => x.action === a);
  const e = (a: string) => !!by(a)?.eligible;
  const reason = (a: string) => by(a)?.reason ?? '';

  function SimpleAction({ action, dangerStyle = false }: { action: string; dangerStyle?: boolean }) {
    const ok = e(action);
    return (
      <form action={formAction} className="inline">
        <input type="hidden" name="customerSubscriptionId" value={customerSubscriptionId} />
        <input type="hidden" name="actionType" value={action} />
        <button type="submit" disabled={!ok} title={ok ? '' : reason(action)} className={dangerStyle ? danger : ghost}>
          {changeActionLabel(action)}
        </button>
      </form>
    );
  }

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Subscription actions</h2>
      <div className="mt-2 rounded-lg bg-spark/10 px-3 py-2 text-xs text-ink">
        Preview and request only. <strong>No change is applied to Stripe in this phase.</strong> Stripe stays the source
        of truth; executing a change (with proration) requires the separate P12B2 approval.
      </div>
      {state.error ? <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p> : null}

      {/* Change plan — creates a request you can then preview */}
      <form action={formAction} className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <input type="hidden" name="customerSubscriptionId" value={customerSubscriptionId} />
        <input type="hidden" name="actionType" value="change_plan" />
        <label className="block">
          <span className="text-sm font-medium text-ink">Change plan</span>
          <select name="targetPlanKey" disabled={!e('change_plan')} className={input}>
            <option value="">Select a target plan…</option>
            {planOptions.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={!e('change_plan')} title={e('change_plan') ? '' : reason('change_plan')} className="pa-btn pa-btn-primary !py-2 disabled:opacity-40">
          Request plan change
        </button>
      </form>

      {/* Change quantity */}
      <form action={formAction} className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <input type="hidden" name="customerSubscriptionId" value={customerSubscriptionId} />
        <input type="hidden" name="actionType" value="change_quantity" />
        <label className="block">
          <span className="text-sm font-medium text-ink">Change quantity</span>
          <input name="targetQuantity" type="number" min={1} step={1} disabled={!e('change_quantity')} placeholder="New quantity" className={input} />
        </label>
        <button type="submit" disabled={!e('change_quantity')} title={e('change_quantity') ? '' : reason('change_quantity')} className="pa-btn pa-btn-primary !py-2 disabled:opacity-40">
          Request quantity change
        </button>
      </form>

      {/* Simple actions (request only; no preview, no execution) */}
      <div className="mt-4">
        <p className="text-xs font-medium text-ink-soft">Other change requests (no preview; execution deferred to P12B2)</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <SimpleAction action="cancel_at_period_end" />
          <SimpleAction action="undo_cancel_at_period_end" />
          <SimpleAction action="pause_collection" />
          <SimpleAction action="resume_collection" />
          <SimpleAction action="cancel_immediately" dangerStyle />
        </div>
      </div>
    </div>
  );
}
