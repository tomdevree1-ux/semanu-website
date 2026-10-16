import Link from 'next/link';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { formatSubAmount, planLabel } from '@/modules/subscriptions/format';
import type { CompanySubscriptionRow } from '@/modules/subscriptions/types';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

/**
 * Company-detail Subscriptions section (P12A, additive). Read-only list of the company's linked
 * Stripe subscriptions. Stripe is the source of truth for state; "Link subscription" opens the
 * registry link flow. Hidden when the viewer lacks subscriptions.read (the parent gates).
 */
export function CompanySubscriptionsSection({
  subscriptions,
  companyId,
  canLink,
}: {
  subscriptions: CompanySubscriptionRow[];
  companyId: string;
  canLink: boolean;
}) {
  const active = subscriptions.filter((s) => !s.archivedAt);
  return (
    <section className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg text-ink">Subscriptions</h2>
        {canLink ? (
          <Link
            href={`/app/subscriptions/link?companyId=${companyId}`}
            className="rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5"
          >
            Link subscription
          </Link>
        ) : null}
      </div>
      {active.length ? (
        <ul className="mt-3 divide-y divide-ink/5">
          {active.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <Link href={`/app/subscriptions/${s.id}`} className="font-mono text-xs font-medium text-ink hover:text-red">
                  {s.stripeSubscriptionId}
                </Link>
                <div className="truncate text-xs text-ink-soft">
                  {planLabel(s.planKey, null)} · {formatSubAmount(s.amount, s.currency, s.interval)} · ends {fmt(s.currentPeriodEnd)}
                  {s.cancelAtPeriodEnd ? ' · cancels at period end' : ''}
                </div>
              </div>
              <StatusBadge entityType="subscription" status={s.status} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">No subscriptions linked yet.</p>
      )}
    </section>
  );
}
