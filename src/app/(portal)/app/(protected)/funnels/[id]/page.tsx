import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getFunnelSubmission, listFunnelOwners, listLinkableCompanies, listLinkableContacts } from '@/modules/funnels/queries';
import { funnelSourceLabel, fullName } from '@/modules/funnels/format';
import { getHistory, getHistoryTechnical } from '@/lib/audit/queries';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { HistoryButton } from '@/components/portal/history/HistoryButton';
import { FunnelDetailActions } from '@/components/portal/funnels/FunnelDetailActions';
import { GenerateReportPanel } from '@/components/portal/website-reports/GenerateReportPanel';
import { getCurrentReportForSubmission } from '@/modules/website-reports/queries';
import { env } from '@/lib/env';
import type { TechnicalDetail } from '@/components/portal/history/HistoryTimeline';

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="break-words text-ink">{value || '—'}</dd>
    </div>
  );
}

export default async function FunnelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission('funnels.read');
  const { id } = await params;
  const funnel = await getFunnelSubmission(id);
  if (!funnel) notFound();

  const [permKeys, currentReport, owners, companies, contacts, rows] =
    await Promise.all([
      getUserPermissions(),
      getCurrentReportForSubmission(id),
      listFunnelOwners(),
      listLinkableCompanies(),
      listLinkableContacts(),
      getHistory('funnel', id, 80, 0),
    ]);
  const canUpdate = permKeys.includes('funnels.update');
  const canAssign = permKeys.includes('funnels.assign');
  const canArchive = permKeys.includes('funnels.archive');
  const canTech = permKeys.includes('audit.read_technical');
  const canCreateCompany = permKeys.includes('companies.create');
  const canCreateContact = permKeys.includes('contacts.create');
  const canGenReport = permKeys.includes('website_reports.generate');
  const canOverrideReport = permKeys.includes('website_reports.archive');

  let technical: Record<number, TechnicalDetail> | undefined;
  if (canTech) {
    const raw = await getHistoryTechnical('funnel', id, 80);
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

  const name = fullName(funnel.firstName, funnel.lastName);
  const utm = [
    ['Source', funnel.utmSource],
    ['Medium', funnel.utmMedium],
    ['Campaign', funnel.utmCampaign],
    ['Term', funnel.utmTerm],
    ['Content', funnel.utmContent],
  ].filter(([, v]) => v) as [string, string][];
  const payloadEntries = Object.entries(funnel.payload ?? {});

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/app/funnels" className="text-sm text-red hover:underline">
        ← Back to website funnels
      </Link>

      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-ink-soft">{funnelSourceLabel(funnel.sourceType)}</span>
            <StatusBadge entityType="funnel" status={funnel.status} size="md" />
            {funnel.spamStatus === 'spam' ? (
              <span className="rounded-pill bg-danger/10 px-2 py-0.5 text-xs text-danger">Spam</span>
            ) : funnel.spamStatus === 'suspected' ? (
              <span className="rounded-pill bg-spark/15 px-2 py-0.5 text-xs text-ink">Suspected spam</span>
            ) : null}
          </div>
          <h1 className="mt-1 page-title">{name || funnel.email}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
            <a href={`mailto:${funnel.email}`} className="text-red hover:underline">{funnel.email}</a>
            {funnel.phone ? <span>· {funnel.phone}</span> : null}
            {funnel.companyId ? (
              <span>
                ·{' '}
                <Link href={`/app/companies/${funnel.companyId}`} className="text-red hover:underline">
                  {funnel.companyNameLinked || 'company'}
                </Link>
                {funnel.companyArchived ? ' (archived)' : ''}
              </span>
            ) : (
              <span>· not linked to a company</span>
            )}
            {funnel.contactId ? (
              <span>
                ·{' '}
                <Link href={`/app/contacts/${funnel.contactId}`} className="text-red hover:underline">
                  {funnel.contactName || 'contact'}
                </Link>
                {funnel.contactArchived ? ' (archived)' : ''}
              </span>
            ) : null}
          </div>
        </div>
        <HistoryButton rows={rows} technical={technical} title="Submission history" />
      </div>

      {funnel.duplicateCount > 0 ? (
        <p className="mt-3 rounded-lg bg-spark/10 px-3 py-2 text-sm text-ink">
          {funnel.duplicateCount} other non archived submission{funnel.duplicateCount === 1 ? '' : 's'} share this email
          or domain. Check before following up.
        </p>
      ) : null}

      {/* Submission snapshot */}
      <div className="mt-4 rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Submission</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Read label="Website" value={funnel.websiteUrl} />
          <Read label="Domain" value={funnel.normalizedDomain} />
          <Read label="Owner" value={funnel.ownerName} />
          <Read label="Locale" value={funnel.locale} />
          <Read label="Privacy consent" value={funnel.consentPrivacy ? 'Yes' : 'No'} />
          <Read label="Marketing consent" value={funnel.consentMarketing ? 'Yes' : 'No'} />
          <Read label="Spam status" value={funnel.spamStatus} />
          <Read label="Received" value={fmt(funnel.createdAt)} />
          <Read label="Updated" value={fmt(funnel.updatedAt)} />
        </dl>

        {funnel.websiteUrl ? (
          <p className="mt-3 text-sm">
            <a href={funnel.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="text-red hover:underline">
              Open submitted website ↗
            </a>
          </p>
        ) : null}

        {(utm.length || funnel.referrer || funnel.pagePath) ? (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Attribution</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {utm.map(([k, v]) => (
                <Read key={k} label={`UTM ${k}`} value={v} />
              ))}
              <Read label="Referrer" value={funnel.referrer} />
              <Read label="Page" value={funnel.pagePath} />
            </dl>
          </div>
        ) : null}

        {payloadEntries.length ? (
          <div className="mt-4 border-t border-ink/10 pt-4">
            <h3 className="text-xs font-medium uppercase tracking-wide text-ink-soft">Funnel data</h3>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {payloadEntries.map(([k, v]) => (
                <Read key={k} label={k} value={v === null ? null : String(v)} />
              ))}
            </dl>
          </div>
        ) : null}
      </div>

      {funnel.sourceType === 'website_analysis' ? (
        <div className="mt-4">
          <GenerateReportPanel
            funnelSubmissionId={funnel.id}
            hasContact={!!funnel.contactId}
            canGenerate={canGenReport}
            canOverride={canOverrideReport}
            flagEnabled={env.websiteReportsEnabled}
            currentReport={currentReport ? { id: currentReport.id, displayStatus: currentReport.displayStatus } : null}
          />
        </div>
      ) : null}

      <div className="mt-4">
        <FunnelDetailActions
          funnel={funnel}
          canUpdate={canUpdate}
          canAssign={canAssign}
          canArchive={canArchive}
          canCreateCompany={canCreateCompany}
          canCreateContact={canCreateContact}
          owners={owners}
          companies={companies}
          contacts={contacts}
        />
      </div>
    </div>
  );
}
