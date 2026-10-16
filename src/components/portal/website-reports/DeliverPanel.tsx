'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import {
  deliverWebsiteAnalysisReport,
  resendWebsiteAnalysisReport,
  cancelWebsiteReportDelivery,
  getReportPdfSignedUrl,
  setWebsiteReportFollowUp,
  clearWebsiteReportFollowUp,
} from '@/modules/website-reports/delivery-actions';
import type { DeliveryActionState } from '@/modules/website-reports/delivery-schema';
import type { DeliveryDetail } from '@/modules/website-reports/delivery-types';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { EngagementSummary } from './EngagementSummary';
import { websiteReportStatusLabel } from '@/modules/website-reports/format';

const empty: DeliveryActionState = {};
const input = 'mt-1 rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70';

function Notice({ s, okText = 'Done.' }: { s: DeliveryActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}
function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

/**
 * Report-detail delivery panel (P15). Only for APPROVED reports. Deliver / re-send (PDF emailed as an
 * attachment), cancel a pending send, preview the PDF (staff-only short-TTL signed URL), and manage a
 * follow-up. Gated by `website_reports.deliver` + the delivery flag. No send-to-arbitrary-email, no public link.
 */
export function DeliverPanel({
  reportId,
  reviewStatus,
  hasContact,
  contactName,
  latest,
  canDeliver,
  flagEnabled,
  openClickTrackingEnabled,
}: {
  reportId: string;
  reviewStatus: string;
  hasContact: boolean;
  contactName: string | null;
  latest: DeliveryDetail | null;
  canDeliver: boolean;
  flagEnabled: boolean;
  openClickTrackingEnabled: boolean;
}) {
  const [deliverState, deliverAction, deliverPending] = useActionState(reviewStatus === 'approved' && latest ? resendWebsiteAnalysisReport : deliverWebsiteAnalysisReport, empty);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelWebsiteReportDelivery, empty);
  const [previewState, previewAction, previewPending] = useActionState(getReportPdfSignedUrl, empty);
  const [followState, followAction, followPending] = useActionState(setWebsiteReportFollowUp, empty);
  const [clearState, clearAction, clearPending] = useActionState(clearWebsiteReportFollowUp, empty);
  const [showFollow, setShowFollow] = useState(false);
  const openedRef = useRef<string | null>(null);

  // Open the staff PDF preview in a new tab when a signed URL comes back.
  useEffect(() => {
    if (previewState.ok && previewState.signedUrl && previewState.signedUrl !== openedRef.current) {
      openedRef.current = previewState.signedUrl;
      window.open(previewState.signedUrl, '_blank', 'noopener,noreferrer');
    }
  }, [previewState]);

  if (reviewStatus !== 'approved') {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Delivery</h2>
        <p className="mt-1 text-sm text-ink-soft">Approve the report before it can be delivered.</p>
      </div>
    );
  }

  const cancellable = latest && ['queued', 'rendering', 'sending'].includes(latest.status);

  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Delivery</h2>
      <p className="mt-1 text-sm text-ink-soft">
        The approved report is sent as a PDF attachment to the linked contact. Nothing is shared via a public
        link.
      </p>

      <div className="mt-3 text-sm">
        <span className="text-ink-soft">Recipient: </span>
        {hasContact ? <span className="text-ink">{contactName || 'linked contact'}</span> : <span className="text-danger">no linked contact — link one first</span>}
      </div>

      {latest ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">Latest:</span>
          <StatusBadge entityType="report_delivery" status={latest.displayStatus} label={websiteReportStatusLabel(latest.displayStatus)} />
          {latest.sentAt ? <span className="text-ink-soft">sent {fmt(latest.sentAt)}</span> : null}
          {latest.errorSummary ? <span className="text-danger">· {latest.errorSummary}</span> : null}
        </div>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">Not delivered yet.</p>
      )}

      {latest ? (
        <div className="mt-3">
          <EngagementSummary e={latest.engagement} openClickEnabled={openClickTrackingEnabled} variant="detail" />
        </div>
      ) : null}

      {!flagEnabled ? (
        <p className="mt-3 text-sm text-ink-soft">Delivery is disabled (WEBSITE_REPORT_DELIVERY_ENABLED is off).</p>
      ) : null}

      {canDeliver && flagEnabled ? (
        <div className="mt-4 space-y-3 border-t border-ink/10 pt-4">
          <Notice s={deliverState} okText="Delivery started. The email sends shortly." />
          <Notice s={cancelState} okText="Delivery cancelled." />
          <div className="flex flex-wrap gap-2">
            <form action={deliverAction}>
              <input type="hidden" name="reportId" value={reportId} />
              <button type="submit" disabled={deliverPending || !hasContact} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
                {deliverPending ? 'Sending…' : latest ? 'Re-send report' : 'Deliver report'}
              </button>
            </form>
            {cancellable ? (
              <form action={cancelAction}>
                <input type="hidden" name="id" value={latest!.id} />
                <button type="submit" disabled={cancelPending} className={ghost}>{cancelPending ? 'Cancelling…' : 'Cancel'}</button>
              </form>
            ) : null}
            {latest?.pdfPath ? (
              <form action={previewAction}>
                <input type="hidden" name="id" value={latest.id} />
                <button type="submit" disabled={previewPending} className={ghost}>{previewPending ? 'Opening…' : 'Preview PDF'}</button>
              </form>
            ) : null}
          </div>
          {previewState.error ? <p className="text-sm text-danger" role="alert">{previewState.error}</p> : null}

          {/* Follow-up */}
          {latest ? (
            <div className="border-t border-ink/10 pt-3">
              <Notice s={followState} okText="Follow up set." />
              <Notice s={clearState} okText="Follow up updated." />
              {latest.followUpStatus === 'planned' && latest.followUpAt ? (
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-soft">Follow up:</span>
                  <span className="text-ink">{new Date(latest.followUpAt).toLocaleDateString()}</span>
                  <form action={clearAction} className="inline"><input type="hidden" name="id" value={latest.id} /><input type="hidden" name="done" value="true" /><button type="submit" disabled={clearPending} className="text-red hover:underline">mark done</button></form>
                  <form action={clearAction} className="inline"><input type="hidden" name="id" value={latest.id} /><button type="submit" disabled={clearPending} className="text-ink-soft hover:underline">clear</button></form>
                </div>
              ) : (
                <div>
                  {!showFollow ? (
                    <button type="button" onClick={() => setShowFollow(true)} className="text-sm text-red hover:underline">Set a follow up</button>
                  ) : (
                    <form action={followAction} className="flex flex-wrap items-end gap-2">
                      <input type="hidden" name="id" value={latest.id} />
                      <label className="block">
                        <span className="text-xs text-ink-soft">Follow up date</span>
                        <input type="date" name="at" required className={input} />
                      </label>
                      <button type="submit" disabled={followPending} className={ghost}>{followPending ? 'Saving…' : 'Set follow up'}</button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
