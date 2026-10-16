'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import {
  retryWebsiteAnalysisReport,
  reviewWebsiteAnalysisReport,
  updateWebsiteAnalysisReportNotes,
  generateWebsiteAnalysisReport,
  archiveWebsiteAnalysisReport,
  restoreWebsiteAnalysisReport,
} from '@/modules/website-reports/actions';
import type { WebsiteReportActionState } from '@/modules/website-reports/schema';
import type { WebsiteReportDetail } from '@/modules/website-reports/types';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';

const empty: WebsiteReportActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: WebsiteReportActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function WebsiteReportDetailActions({
  report,
  canGenerate,
  canReview,
  canArchive,
  flagEnabled,
}: {
  report: WebsiteReportDetail;
  canGenerate: boolean;
  canReview: boolean;
  canArchive: boolean;
  flagEnabled: boolean;
}) {
  const [retryState, retryAction, retryPending] = useActionState(retryWebsiteAnalysisReport, empty);
  const [reviewState, reviewAction, reviewPending] = useActionState(reviewWebsiteAnalysisReport, empty);
  const [regenState, regenAction, regenPending] = useActionState(generateWebsiteAnalysisReport, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreWebsiteAnalysisReport, empty);

  if (report.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This report is archived (hidden from the default list). No data was deleted. Restore it to review or
          regenerate again.
        </p>
        <Notice s={restoreState} okText="Report restored." />
        {canArchive ? (
          <form action={restoreAction} className="mt-3">
            <input type="hidden" name="id" value={report.id} />
            <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
              {restorePending ? 'Restoring…' : 'Restore report'}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  const succeeded = report.generationStatus === 'succeeded';

  return (
    <div className="space-y-4">
      {/* Generation state / retry */}
      {!succeeded ? (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Generation</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Status: <span className="text-ink">{report.generationStatus}</span>
            {report.errorSummary ? <> · last error: <span className="text-red">{report.errorSummary}</span></> : null}
          </p>
          {!flagEnabled ? (
            <p className="mt-2 text-sm text-ink-soft">Generation is disabled (WEBSITE_REPORTS_ENABLED is off).</p>
          ) : null}
          <Notice s={retryState} okText="Retry started." />
          {canGenerate && flagEnabled ? (
            <form action={retryAction} className="mt-3">
              <input type="hidden" name="id" value={report.id} />
              <button type="submit" disabled={retryPending} className={ghost}>
                {retryPending ? 'Retrying…' : 'Retry generation'}
              </button>
            </form>
          ) : null}
        </div>
      ) : null}

      {/* Review */}
      {succeeded ? (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Review</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Current decision: <span className="text-ink">{report.reviewStatus}</span>
            {report.reviewedByName ? <> · by {report.reviewedByName}</> : null}
          </p>
          <Notice s={reviewState} okText="Review saved." />
          {canReview ? (
            <form action={reviewAction} className="mt-3 flex flex-wrap gap-2">
              <input type="hidden" name="id" value={report.id} />
              <button type="submit" name="decision" value="approved" disabled={reviewPending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {reviewPending ? 'Saving…' : 'Approve'}
              </button>
              <button type="submit" name="decision" value="rejected" disabled={reviewPending} className={dangerBtn}>
                Reject
              </button>
            </form>
          ) : (
            <p className="mt-2 text-sm text-ink-soft">You do not have review permission.</p>
          )}

          {canGenerate && flagEnabled ? (
            <div className="mt-4 border-t border-ink/10 pt-4">
              <p className="text-sm text-ink-soft">Regenerate creates a new version and supersedes this one.</p>
              <Notice s={regenState} okText="New version created." />
              {regenState.ok && regenState.id ? (
                <Link href={`/app/website-reports/${regenState.id}`} className="mt-1 inline-block text-sm text-red hover:underline">
                  Open new version →
                </Link>
              ) : null}
              <form action={regenAction} className="mt-2">
                <input type="hidden" name="funnelSubmissionId" value={report.funnelSubmissionId} />
                <button type="submit" disabled={regenPending} className={ghost}>
                  {regenPending ? 'Generating…' : 'Regenerate report'}
                </button>
              </form>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* Notes */}
      {canReview ? (
        <EditableBlock
          title="Notes"
          action={updateWebsiteAnalysisReportNotes}
          hiddenFields={{ id: report.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-3">
              <Read label="Notes" value={report.notes} />
              <Read label="Internal notes" value={report.internalNotes} />
              <Read label="Internal sales note" value={report.internalSalesNotes} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" defaultValue={report.notes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={report.internalNotes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal sales note</span>
                <textarea name="internalSalesNotes" defaultValue={report.internalSalesNotes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {/* Danger zone */}
      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides this report from the default list (no hard delete; restore any time).
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive report"
              triggerClassName={dangerBtn}
              title="Archive this report"
              description="Type the domain to archive this report version."
              confirmWord={report.normalizedDomain || 'archive'}
              confirmLabel="Archive report"
              action={archiveWebsiteAnalysisReport}
              hiddenFields={{ id: report.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="whitespace-pre-wrap break-words text-ink">{value || '—'}</dd>
    </div>
  );
}
