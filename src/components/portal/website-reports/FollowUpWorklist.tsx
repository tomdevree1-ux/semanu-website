'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import {
  setWebsiteReportFollowUp,
  clearWebsiteReportFollowUp,
} from '@/modules/website-reports/delivery-actions';
import type { DeliveryActionState } from '@/modules/website-reports/delivery-schema';
import type { WorklistItem } from '@/modules/website-reports/worklist-queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { EngagementSummary } from './EngagementSummary';
import { websiteReportStatusLabel } from '@/modules/website-reports/format';

/**
 * Read-only follow-up worklist table (P17). Each row shows the priority reason, the report, the recipient, the
 * P16 engagement summary, and (for website_reports.deliver holders) inline follow-up controls that reuse the
 * EXISTING P15 server actions — no new mutation is introduced here.
 */
const empty: DeliveryActionState = {};
const ghost = 'rounded-pill border border-ink/15 px-3 py-1 text-xs text-ink transition-colors hover:bg-ink/5 disabled:opacity-70';
const input = 'rounded-lg border border-ink/15 px-2 py-1 text-xs text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

const BUCKET_META: Record<string, { label: string; cls: string }> = {
  delivery_problem: { label: 'Delivery problem', cls: 'bg-danger/10 text-danger' },
  follow_up_due: { label: 'Follow up due', cls: 'bg-ink/10 text-ink' },
  clicked: { label: 'Clicked', cls: 'bg-ok/10 text-ok' },
  opened_no_follow_up: { label: 'Opened', cls: 'bg-ink/5 text-ink' },
  delivered_cold: { label: 'Going cold', cls: 'bg-ink/5 text-ink-soft' },
};

export function FollowUpWorklist({
  items,
  canDeliver,
  openClickEnabled,
}: {
  items: WorklistItem[];
  canDeliver: boolean;
  openClickEnabled: boolean;
}) {
  if (!items.length) {
    return (
      <p className="rounded-xl border border-ink/10 bg-white p-8 text-center text-sm text-ink-soft">
        Nothing needs follow up right now. Delivered reports that bounce, get opened or go cold will appear here.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-ink/10 bg-white">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
          <tr>
            <th className="px-4 py-3 font-medium">Why</th>
            <th className="px-4 py-3 font-medium">Website</th>
            <th className="px-4 py-3 font-medium">Recipient</th>
            <th className="px-4 py-3 font-medium">Engagement</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium">Follow up</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <FollowUpRow key={it.deliveryId} it={it} canDeliver={canDeliver} openClickEnabled={openClickEnabled} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FollowUpRow({ it, canDeliver, openClickEnabled }: { it: WorklistItem; canDeliver: boolean; openClickEnabled: boolean }) {
  const [setState, setAction, setPending] = useActionState(setWebsiteReportFollowUp, empty);
  const [clearState, clearAction, clearPending] = useActionState(clearWebsiteReportFollowUp, empty);
  const [showSet, setShowSet] = useState(false);
  const meta = BUCKET_META[it.bucket] ?? { label: it.bucket, cls: 'bg-ink/5 text-ink-soft' };
  const planned = it.followUpStatus === 'planned' && it.followUpAt;

  return (
    <tr className="border-b border-ink/5 align-top last:border-0">
      <td className="px-4 py-3">
        <span className={`inline-block rounded-pill px-2 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
        <p className="mt-1 text-xs text-ink-soft">{it.reason}</p>
      </td>
      <td className="px-4 py-3">
        <Link href={`/app/website-reports/${it.reportId}`} className="font-medium text-red hover:underline">
          {it.domain || '—'}
        </Link>
      </td>
      <td className="px-4 py-3 text-ink-soft">
        <div className="text-ink">{it.contactName || it.toEmail}</div>
        {it.companyName ? <div className="text-xs">{it.companyName}</div> : null}
      </td>
      <td className="px-4 py-3">
        <EngagementSummary e={it.engagement} openClickEnabled={openClickEnabled} variant="compact" />
      </td>
      <td className="px-4 py-3">
        <StatusBadge entityType="report_delivery" status={it.displayStatus} label={websiteReportStatusLabel(it.displayStatus)} />
      </td>
      <td className="px-4 py-3">
        {!canDeliver ? (
          <span className="text-xs text-ink-soft">{planned ? new Date(it.followUpAt!).toLocaleDateString() : it.followUpStatus === 'done' ? 'done' : '—'}</span>
        ) : planned ? (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="text-ink">{new Date(it.followUpAt!).toLocaleDateString()}</span>
            <form action={clearAction} className="inline"><input type="hidden" name="id" value={it.deliveryId} /><input type="hidden" name="done" value="true" /><button type="submit" disabled={clearPending} className="text-red hover:underline">mark done</button></form>
            <form action={clearAction} className="inline"><input type="hidden" name="id" value={it.deliveryId} /><button type="submit" disabled={clearPending} className="text-ink-soft hover:underline">clear</button></form>
          </div>
        ) : !showSet ? (
          <button type="button" onClick={() => setShowSet(true)} className="text-xs text-red hover:underline">Set follow up</button>
        ) : (
          <form action={setAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="id" value={it.deliveryId} />
            <input type="date" name="at" required className={input} />
            <button type="submit" disabled={setPending} className={ghost}>{setPending ? 'Saving…' : 'Set'}</button>
          </form>
        )}
        {setState.error ? <p className="mt-1 text-xs text-danger" role="alert">{setState.error}</p> : null}
        {clearState.error ? <p className="mt-1 text-xs text-danger" role="alert">{clearState.error}</p> : null}
      </td>
    </tr>
  );
}
