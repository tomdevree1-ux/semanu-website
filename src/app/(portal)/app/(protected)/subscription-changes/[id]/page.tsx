import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getSubscriptionChangeRequest, getExecutableSubscriptionActions } from '@/modules/subscription-changes/queries';
import { actionNeedsPreview } from '@/modules/subscription-changes/status';
import { executePermissionFor } from '@/modules/subscription-changes/guards';
import { env } from '@/lib/env';
import { changeActionLabel } from '@/modules/subscription-changes/format';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { ChangeRequestDetailActions } from '@/components/portal/subscription-changes/ChangeRequestDetailActions';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export default async function ChangeRequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('subscriptions.read');
  const { id } = await params;

  const [permKeys, rows] = await Promise.all([
    getUserPermissions(),
    getHistory('subscription_change', id, 80, 0),
  ]);
  const canRequest = permKeys.includes('subscriptions.request_change');
  const canPreview = permKeys.includes('subscriptions.preview_change');
  const canArchive = permKeys.includes('subscriptions.archive');
  const canTech = permKeys.includes('audit.read_technical');

  const req = await getSubscriptionChangeRequest(id, canTech);
  if (!req) notFound();

  // P12B2 execution gating: per-action admin execute permission + the live config flag + executability.
  const execPerm = executePermissionFor(req.actionType);
  const canExecute = execPerm ? permKeys.includes(execPerm) : false;
  const exec = await getExecutableSubscriptionActions(id);
  const executionEnabled = env.stripeSubscriptionMutationsEnabled;
  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('subscription_change', id, 80);
    technical = {};
    for (const r of raw) {
      technical[r.id] = { metadata: r.metadata, old_values: r.old_values, new_values: r.new_values, ip_address: r.ip_address, user_agent: r.user_agent };
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/subscription-changes" className="text-sm text-red hover:underline">
        ← Back to subscription changes
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs text-ink-soft">{req.id.slice(0, 8)}</span>
            <StatusBadge entityType="subscription_change" status={req.status} size="md" />
          </div>
          <h1 className="mt-1 page-title">{changeActionLabel(req.actionType)}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <span>
              for{' '}
              <Link href={`/app/subscriptions/${req.customerSubscriptionId}`} className="text-red hover:underline">
                {req.stripeSubscriptionId}
              </Link>
            </span>
            {req.companyId ? (
              <span>
                ·{' '}
                <Link href={`/app/companies/${req.companyId}`} className="text-red hover:underline">{req.companyName || 'company'}</Link>
              </span>
            ) : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Change request history" />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-ink-soft sm:grid-cols-4">
        <div>Requested {fmt(req.requestedAt)}</div>
        <div>{req.requestedByName ? `By ${req.requestedByName}` : ''}</div>
        <div>Created {fmt(req.createdAt)}</div>
        <div>Updated {fmt(req.updatedAt)}</div>
      </div>

      <div className="mt-4">
        <ChangeRequestDetailActions
          req={req}
          canPreview={canPreview}
          canRequest={canRequest}
          canArchive={canArchive}
          needsPreview={actionNeedsPreview(req.actionType)}
          canExecute={canExecute}
          executionEnabled={executionEnabled}
          executable={exec.executable}
          needsConfirm={exec.needsConfirm}
          stripeSubscriptionId={req.stripeSubscriptionId}
        />
      </div>
    </div>
  );
}
