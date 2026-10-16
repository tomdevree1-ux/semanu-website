'use client';

import { useActionState } from 'react';
import {
  syncSubscriptionFromStripe,
  updateSubscriptionNotes,
  updateSubscriptionCrmLinks,
  archiveSubscriptionLink,
  restoreSubscriptionLink,
} from '@/modules/subscriptions/actions';
import type { SubscriptionActionState } from '@/modules/subscriptions/schema';
import type { SubscriptionDetail, CompanyOption, ContactOption } from '@/modules/subscriptions/types';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { formatSubAmount, planLabel } from '@/modules/subscriptions/format';

const empty: SubscriptionActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: SubscriptionActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export function SubscriptionDetailActions({
  sub,
  canSync,
  canLink,
  canArchive,
  companies,
  contacts,
}: {
  sub: SubscriptionDetail;
  canSync: boolean;
  canLink: boolean;
  canArchive: boolean;
  companies: CompanyOption[];
  contacts: ContactOption[];
}) {
  const [syncState, syncAction, syncPending] = useActionState(syncSubscriptionFromStripe, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreSubscriptionLink, empty);

  if (sub.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">
            This subscription link is archived (hidden from the default list). Archiving never changed the Stripe
            subscription. Restore it to manage the CRM link again.
          </p>
          <Notice s={restoreState} okText="Subscription restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="id" value={sub.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore subscription'}
              </button>
            </form>
          ) : null}
        </div>
        <DetailsCard sub={sub} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Sync</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Stripe is the source of truth for subscription state. This view shows the last synced snapshot. P12A does not
          change the subscription in Stripe (no plan, quantity, cancel or pause).
        </p>
        <Notice s={syncState} okText="Synced from Stripe." />
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="text-ink-soft">
            Sync status: <span className="text-ink">{sub.syncStatus}</span> · last synced {fmt(sub.lastSyncedAt)}
          </span>
          {canSync ? (
            <form action={syncAction} className="inline">
              <input type="hidden" name="id" value={sub.id} />
              <button type="submit" disabled={syncPending} className={ghost}>
                {syncPending ? 'Syncing…' : 'Sync from Stripe'}
              </button>
            </form>
          ) : null}
        </div>
      </div>

      <DetailsCard sub={sub} />

      {canLink ? (
        <EditableBlock
          title="CRM links"
          action={updateSubscriptionCrmLinks}
          hiddenFields={{ id: sub.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Company" value={sub.companyName} />
              <Read label="Contact" value={sub.contactName} />
              <Read label="Customer" value={sub.customerLabel} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Company</span>
                <select name="companyId" defaultValue={sub.companyId ?? ''} disabled={pending} className={input}>
                  <option value="">No company</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Contact</span>
                <select name="contactId" defaultValue={sub.contactId ?? ''} disabled={pending} className={input}>
                  <option value="">No contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
                  ))}
                </select>
                <span className="mt-1 block text-xs text-ink-soft">Contacts are from the currently linked company. Save a new company first, then pick its contact.</span>
              </label>
              <input type="hidden" name="customerId" value={sub.customerId ?? ''} />
            </div>
          )}
        />
      ) : null}

      {canLink ? (
        <EditableBlock
          title="Notes"
          action={updateSubscriptionNotes}
          hiddenFields={{ id: sub.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Notes" value={sub.notes} />
              <Read label="Internal notes" value={sub.internalNotes} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" defaultValue={sub.notes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={sub.internalNotes ?? ''} rows={2} maxLength={10000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides this subscription link from the default list (no hard delete; restore any time). It does NOT
            cancel or change the Stripe subscription.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive subscription link"
              triggerClassName={dangerBtn}
              title="Archive this subscription link"
              description="Type the Stripe subscription id to archive this registry link. The Stripe subscription is unaffected."
              confirmWord={sub.stripeSubscriptionId}
              confirmLabel="Archive subscription link"
              action={archiveSubscriptionLink}
              hiddenFields={{ id: sub.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function DetailsCard({ sub }: { sub: SubscriptionDetail }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Details</h2>
      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <Read label="Plan" value={planLabel(sub.planKey, sub.stripePriceId)} />
        <Read label="Amount" value={formatSubAmount(sub.amount, sub.currency, sub.interval)} />
        <Read label="Quantity" value={sub.quantity != null ? String(sub.quantity) : null} />
        <Read label="Cancel at period end" value={sub.cancelAtPeriodEnd ? 'Yes' : 'No'} />
        <Read label="Current period" value={`${fmt(sub.currentPeriodStart)} → ${fmt(sub.currentPeriodEnd)}`} />
        <Read label="Trial" value={sub.trialStart || sub.trialEnd ? `${fmt(sub.trialStart)} → ${fmt(sub.trialEnd)}` : null} />
        <Read label="Cancelled at" value={sub.cancelledAt ? fmt(sub.cancelledAt) : null} />
        <Read label="Stripe customer id" value={sub.stripeCustomerId} />
        <Read label="Stripe subscription id" value={sub.stripeSubscriptionId} />
        <Read label="Stripe product id" value={sub.stripeProductId} />
        <Read label="Stripe price id" value={sub.stripePriceId} />
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
