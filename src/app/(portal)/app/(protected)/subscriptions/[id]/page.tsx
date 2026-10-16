import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getSubscription, listLinkableCompanies, listLinkableContactsForCompany } from '@/modules/subscriptions/queries';
import { formatSubAmount, planLabel } from '@/modules/subscriptions/format';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { SubscriptionDetailActions } from '@/components/portal/subscriptions/SubscriptionDetailActions';
import { getAllowedSubscriptionActions, listChangeRequestsForSubscription } from '@/modules/subscription-changes/queries';
import { SubscriptionActionPanel } from '@/components/portal/subscription-changes/SubscriptionActionPanel';
import { ChangeRequestTable } from '@/components/portal/subscription-changes/ChangeRequestTable';
import { PLAN_IDS } from '@/lib/stripe/plans';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

const PLAN_OPTIONS = PLAN_IDS.map((k) => ({ key: k, label: k.charAt(0).toUpperCase() + k.slice(1) }));

export default async function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('subscriptions.read');
  const { id } = await params;
  const sub = await getSubscription(id);
  if (!sub) notFound();

  const [permKeys, companies, contacts, allowedActions, changeRequests, rows] = await Promise.all([
    getUserPermissions(),
    listLinkableCompanies(),
    sub.companyId ? listLinkableContactsForCompany(sub.companyId) : Promise.resolve([]),
    getAllowedSubscriptionActions(id),
    listChangeRequestsForSubscription(id),
    getHistory('subscription', id, 80, 0),
  ]);
  const canSync = permKeys.includes('subscriptions.sync');
  const canLink = permKeys.includes('subscriptions.link');
  const canArchive = permKeys.includes('subscriptions.archive');
  const canTech = permKeys.includes('audit.read_technical');
  const canRequestChange = permKeys.includes('subscriptions.request_change');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('subscription', id, 80);
    technical = {};
    for (const r of raw) {
      technical[r.id] = {
        metadata: r.metadata,
        old_values: r.old_values,
        new_values: r.new_values,
        ip_address: r.ip_address,
        user_agent: r.user_agent,
      };
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/subscriptions" className="text-sm text-red hover:underline">
        ← Back to subscriptions
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{sub.stripeSubscriptionId}</span>
            <StatusBadge entityType="subscription" status={sub.status} size="md" />
            {sub.cancelAtPeriodEnd ? (
              <span className="rounded-pill bg-spark/15 px-2 py-0.5 text-xs text-ink">Cancels at period end</span>
            ) : null}
          </div>
          <h1 className="mt-1 page-title">{formatSubAmount(sub.amount, sub.currency, sub.interval)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>{planLabel(sub.planKey, sub.stripePriceId)}</span>
            {sub.companyId ? (
              <span>
                ·{' '}
                <Link href={`/app/companies/${sub.companyId}`} className="text-red hover:underline">
                  {sub.companyName || 'company'}
                </Link>
                {sub.companyArchived ? ' (archived)' : ''}
              </span>
            ) : (
              <span>· not linked to a company</span>
            )}
            {sub.contactId ? (
              <span>
                ·{' '}
                <Link href={`/app/contacts/${sub.contactId}`} className="text-red hover:underline">
                  {sub.contactName || 'contact'}
                </Link>
                {sub.contactArchived ? ' (archived)' : ''}
              </span>
            ) : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Subscription history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Created {fmt(sub.createdAt)}</div>
        <div>Synced {fmt(sub.lastSyncedAt)}</div>
        <div>{sub.currentPeriodEnd ? `Renews ${fmt(sub.currentPeriodEnd)}` : 'No current period'}</div>
        <div>{sub.trialEnd ? `Trial ends ${fmt(sub.trialEnd)}` : ''}</div>
      </div>

      <div className="mt-4">
        <SubscriptionDetailActions
          sub={sub}
          canSync={canSync}
          canLink={canLink}
          canArchive={canArchive}
          companies={companies}
          contacts={contacts}
        />

        {canRequestChange && !sub.isArchived ? (
          <SubscriptionActionPanel customerSubscriptionId={sub.id} allowed={allowedActions} planOptions={PLAN_OPTIONS} />
        ) : null}

        {changeRequests.length ? (
          <section className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-lg text-ink">Change requests</h2>
            <div className="mt-3">
              <ChangeRequestTable rows={changeRequests} />
            </div>
          </section>
        ) : null}
      </div>
    </div>
  );
}
