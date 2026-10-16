'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { generateWebsiteAnalysisReport } from '@/modules/website-reports/actions';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { websiteReportStatusLabel } from '@/modules/website-reports/format';

const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-sm text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/**
 * Funnel-detail panel (P14). Lets staff generate / regenerate the internal website analysis report for a
 * `website_analysis` submission. Generation is gated by the flag + `website_reports.generate`; the contact
 * requirement can be overridden only by an admin with a reason. No send/PDF/public-link control.
 */
export function GenerateReportPanel({
  funnelSubmissionId,
  hasContact,
  canGenerate,
  canOverride,
  flagEnabled,
  currentReport,
}: {
  funnelSubmissionId: string;
  hasContact: boolean;
  canGenerate: boolean;
  canOverride: boolean;
  flagEnabled: boolean;
  currentReport: { id: string; displayStatus: string } | null;
}) {
  const [state, action, pending] = useActionState(generateWebsiteAnalysisReport, {});
  const [override, setOverride] = useState(false);

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Website analysis report</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Generate an internal AI analysis of this website. It is reviewed under Website reports; nothing is sent
        automatically.
      </p>

      {currentReport ? (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-ink-soft">Current report:</span>
          <StatusBadge entityType="website_report" status={currentReport.displayStatus} label={websiteReportStatusLabel(currentReport.displayStatus)} />
          <Link href={`/app/website-reports/${currentReport.id}`} className="text-red hover:underline">open →</Link>
        </p>
      ) : (
        <p className="mt-3 text-sm text-ink-soft">No report generated yet.</p>
      )}

      {canGenerate ? (
        <>
          {state.ok ? (
            <p className="mt-3 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">
              Generation finished.{' '}
              {state.id ? (
                <Link href={`/app/website-reports/${state.id}`} className="text-red hover:underline">Open report →</Link>
              ) : null}
            </p>
          ) : null}
          {state.error ? (
            <p className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p>
          ) : null}

          {!flagEnabled ? (
            <p className="mt-3 text-sm text-ink-soft">Generation is disabled (WEBSITE_REPORTS_ENABLED is off).</p>
          ) : (
            <form action={action} className="mt-3 space-y-2">
              <input type="hidden" name="funnelSubmissionId" value={funnelSubmissionId} />
              {!hasContact ? (
                <div className="rounded-lg border border-spark/40 bg-spark/10 p-3 text-sm text-ink">
                  This submission has no linked contact. Link or create one first.
                  {canOverride ? (
                    <div className="mt-2 space-y-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="overrideNoContact"
                          value="true"
                          checked={override}
                          onChange={(e) => setOverride(e.target.checked)}
                          className="h-4 w-4"
                        />
                        Override (admin) and generate without a linked contact
                      </label>
                      {override ? (
                        <input type="text" name="overrideReason" required maxLength={500} placeholder="Reason for override (required)" className={input} />
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-ink-soft">Only an admin can override the contact requirement.</p>
                  )}
                </div>
              ) : null}
              <button
                type="submit"
                disabled={pending || (!hasContact && !override)}
                className="pa-btn pa-btn-primary !py-2 disabled:opacity-70"
              >
                {pending ? 'Generating…' : currentReport ? 'Regenerate report' : 'Generate report'}
              </button>
            </form>
          )}
        </>
      ) : null}
    </section>
  );
}
