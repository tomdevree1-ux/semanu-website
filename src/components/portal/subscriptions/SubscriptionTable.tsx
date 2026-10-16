import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { clickableRowClass, stretchedLinkClass } from '@/components/portal/ui/rowLink';
import { formatSubAmount, planLabel } from '@/modules/subscriptions/format';
import type { SubscriptionListRow } from '@/modules/subscriptions/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/** Subscriptions registry list (server-rendered). Whole-row clickable (Part V §V2). */
export function SubscriptionTable({ rows }: { rows: SubscriptionListRow[] }) {
  if (!rows.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        No subscriptions match. Link an existing Stripe subscription to get started.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Subscription</th>
            <th className="px-4 py-3 font-medium">Company</th>
            <th className="px-4 py-3 font-medium">Plan</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Period end</th>
            <th className="px-4 py-3 font-medium">Synced</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} data-row-href={`/app/subscriptions/${s.id}`} className={`border-b border-ink/5 last:border-0 ${clickableRowClass}`}>
              <td className="px-4 py-3">
                <Link
                  href={`/app/subscriptions/${s.id}`}
                  aria-label={`Open subscription ${s.stripeSubscriptionId}`}
                  className={`font-mono text-xs font-medium text-ink ${stretchedLinkClass}`}
                >
                  {s.stripeSubscriptionId}
                </Link>
                <div className="text-xs text-ink-soft">{s.contactName || s.stripeCustomerId}</div>
              </td>
              <td className="px-4 py-3 text-ink-soft">{s.companyName || '—'}</td>
              <td className="px-4 py-3 text-ink-soft">{planLabel(s.planKey, null)}</td>
              <td className="px-4 py-3 text-ink">{formatSubAmount(s.amount, s.currency, s.interval)}</td>
              <td className="px-4 py-3">
                <StatusBadge entityType="subscription" status={s.status} />
                {s.cancelAtPeriodEnd ? (
                  <span className="ml-1 rounded-pill bg-spark/15 px-2 py-0.5 text-[11px] text-ink">Ends at period</span>
                ) : null}
              </td>
              <td className="px-4 py-3 text-ink-soft">{fmt(s.currentPeriodEnd)}</td>
              <td className="px-4 py-3 text-ink-soft">{fmt(s.lastSyncedAt)}</td>
              <td className="px-4 py-3 text-right">
                <span className="text-ink-soft transition-colors group-hover:text-ink" aria-hidden>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline">
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
