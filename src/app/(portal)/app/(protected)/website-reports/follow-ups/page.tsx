import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { env } from '@/lib/env';
import { getFollowUpWorklist } from '@/modules/website-reports/worklist-queries';
import { FollowUpWorklist } from '@/components/portal/website-reports/FollowUpWorklist';
import { ListHeader, HeaderLink, FilterBar, FilterSelect } from '@/components/portal/ui/ListChrome';

const BUCKET_FILTERS: Array<{ value: string; label: string }> = [
  { value: '', label: 'All' },
  { value: 'delivery_problem', label: 'Delivery problem' },
  { value: 'follow_up_due', label: 'Follow up due' },
  { value: 'clicked', label: 'Clicked' },
  { value: 'opened_no_follow_up', label: 'Opened' },
  { value: 'delivered_cold', label: 'Going cold' },
];

function Stat({ label, value, sub, tone = 'ink' }: { label: string; value: string; sub?: string; tone?: 'ink' | 'ok' | 'danger' }) {
  const cls = tone === 'ok' ? 'text-ok' : tone === 'danger' ? 'text-danger' : 'text-ink';
  return (
    <div className="rounded-xl border border-ink/10 bg-white px-4 py-3">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className={`font-display text-2xl ${cls}`}>{value}</p>
      {sub ? <p className="text-xs text-ink-soft">{sub}</p> : null}
    </div>
  );
}

/**
 * P17 Follow-up worklist + engagement insights (WAF-3.2). Internal, READ-ONLY. Behind ENABLE_FOLLOWUP_WORKLIST.
 * View gated by website_reports.read; inline follow-up controls (reusing the P15 actions) gated by
 * website_reports.deliver. No customer-facing surface.
 */
export default async function FollowUpsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('website_reports.read');
  const sp = await searchParams;

  if (!env.enableFollowUpWorklist) {
    return (
      <div>
        <ListHeader title="Follow-ups" />
        <p className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
          The follow-up worklist is disabled (ENABLE_FOLLOWUP_WORKLIST is off).
        </p>
      </div>
    );
  }

  const openClickEnabled = env.enableEmailOpenClickTracking;
  const permKeys = await getUserPermissions();
  const canDeliver = permKeys.includes('website_reports.deliver');
  const bucket = sp.bucket && BUCKET_FILTERS.some((b) => b.value === sp.bucket) ? sp.bucket : '';
  const { items, insights, scanned } = await getFollowUpWorklist({ openClickEnabled, bucket: bucket || undefined });

  return (
    <div>
      <ListHeader
        title="Follow-ups"
        subtitle="Delivered website analysis reports that need attention, ranked. Read-only signals; nothing is sent automatically."
        action={<HeaderLink href="/app/website-reports/deliveries" label="All deliveries" />}
      />

      {/* Compact engagement insights */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label="Deliveries scanned" value={String(scanned)} />
        <Stat label="Delivered" value={String(insights.delivered)} sub={`${insights.deliveredRate}% of ${insights.total}`} tone="ok" />
        {insights.openClickVisible ? <Stat label="Opened" value={String(insights.opened)} sub={`${insights.openRate}% of delivered`} /> : null}
        {insights.openClickVisible ? <Stat label="Clicked" value={String(insights.clicked)} sub={`${insights.clickRate}% of delivered`} /> : null}
        <Stat label="Bounced" value={String(insights.bounced)} sub={`${insights.bounceRate}% of ${insights.total}`} tone={insights.bounced ? 'danger' : 'ink'} />
        <Stat label="Complaints" value={String(insights.complained)} sub={`${insights.complaintRate}% of ${insights.total}`} tone={insights.complained ? 'danger' : 'ink'} />
      </div>
      {insights.openClickVisible ? (
        <p className="mt-2 text-xs text-ink-soft">Open and click figures are indicative and may be blocked by email clients.</p>
      ) : null}

      {/* Bucket filter */}
      <div className="mt-6">
        <FilterBar>
          <FilterSelect name="bucket" defaultValue={bucket} allLabel="All reasons" options={BUCKET_FILTERS.filter((b) => b.value)} />
        </FilterBar>
      </div>

      <div className="mt-1">
        <FollowUpWorklist items={items} canDeliver={canDeliver} openClickEnabled={openClickEnabled} />
      </div>
    </div>
  );
}
