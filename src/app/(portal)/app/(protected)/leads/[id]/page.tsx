import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requirePermission } from '@/lib/security/rbac';
import { getUserPermissions } from '@/lib/security/authorize';
import { getLead, listAssignableUsers } from '@/modules/leads/queries';
import { listLeadNotes } from '@/modules/lead-notes/queries';
import { listLeadSubmissions } from '@/modules/lead-submissions/queries';
import { LEAD_CHANNEL_LABELS, LEAD_STATUS_DOT, LEAD_STATUS_LABELS } from '@/modules/leads/types';
import { LeadStageControl } from '@/components/portal/leads/LeadStageControl';
import { LeadChannelControl } from '@/components/portal/leads/LeadChannelControl';
import { LeadAssigneeControl } from '@/components/portal/leads/LeadAssigneeControl';
import { LeadDeleteButton } from '@/components/portal/leads/LeadDeleteButton';
import { LeadNotes } from '@/components/portal/leads/LeadNotes';

function fmt(iso: string): string {
  return new Date(iso).toLocaleString('de-CH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ERRORS: Record<string, string> = {
  permission: 'You do not have permission to do that.',
  company: 'Could not create the company from this lead.',
  project: 'Could not create the project.',
};

const cardLabel = 'mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-soft';

export default async function LeadDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('leads.read');
  const { id } = await params;
  const sp = await searchParams;
  const [lead, permKeys, notes, submissions, assignableUsers] = await Promise.all([
    getLead(id),
    getUserPermissions(),
    listLeadNotes(id),
    listLeadSubmissions(id),
    listAssignableUsers(),
  ]);
  if (!lead) notFound();
  const canManage = permKeys.includes('leads.manage');
  const name = `${lead.firstname} ${lead.lastname}`.trim() || lead.email;

  return (
    <div className="max-w-5xl">
      <Link href="/app/leads" className="text-sm text-ink-soft hover:underline">← Leads</Link>

      <div className="page-head mt-3">
        <div>
          <span className="pa-eyebrow">{LEAD_CHANNEL_LABELS[lead.channel]} · {lead.lang.toUpperCase()}</span>
          <h1 className="page-title">{lead.firstname} {lead.lastname}</h1>
          {lead.company ? <p className="page-sub">{lead.company}</p> : null}
        </div>
        <div className="page-head-actions">
          {canManage ? (
            <LeadStageControl id={lead.id} status={lead.status} defaultProjectName={lead.company || name} />
          ) : (
            <span className="inline-flex items-center gap-2 rounded-pill border border-ink/15 px-3 py-1.5 text-sm text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: LEAD_STATUS_DOT[lead.status] }} />
              {LEAD_STATUS_LABELS[lead.status]}
            </span>
          )}
          {canManage ? <LeadDeleteButton id={lead.id} name={name} variant="button" redirectTo="/app/leads" /> : null}
        </div>
      </div>

      {sp.error ? (
        <p className="mb-5 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {ERRORS[sp.error] ?? 'Something went wrong.'}
        </p>
      ) : null}

      {lead.status === 'lost' && lead.lostReason ? (
        <p className="mb-6 rounded-xl border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
          <span className="font-semibold">Lost:</span> {lead.lostReason}
        </p>
      ) : null}

      <div className="grid gap-10 lg:grid-cols-[1fr_340px] lg:items-start">
        {/* Main column */}
        <div className="space-y-10">
          <div className="card">
            <div className="flex items-center justify-between gap-3">
              <p className={cardLabel}>{submissions.length > 1 ? 'Submissions' : 'Message'}</p>
              {submissions.length > 1 ? <span className="chip chip-mint">{submissions.length}×</span> : null}
            </div>
            {submissions.length === 0 ? (
              <>
                {lead.message ? (
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{lead.message}</p>
                ) : (
                  <p className="text-sm text-ink-soft">No message.</p>
                )}
                <p className="mt-4 border-t border-ink/10 pt-3 font-mono text-xs text-ink-soft">Received {fmt(lead.createdAt)}</p>
              </>
            ) : (
              <ul className="space-y-5">
                {submissions.map((s, i) => (
                  <li key={s.id} className={i > 0 ? 'border-t border-ink/10 pt-5' : ''}>
                    <p className="font-mono text-[11px] uppercase tracking-wide text-ink-soft">
                      {(s.channel && LEAD_CHANNEL_LABELS[s.channel as keyof typeof LEAD_CHANNEL_LABELS]) || 'Submission'} · {fmt(s.createdAt)}
                    </p>
                    {s.message ? (
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{s.message}</p>
                    ) : (
                      <p className="mt-2 text-sm text-ink-soft">No message.</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lead.notes ? (
            <div className="card">
              <p className={cardLabel}>Report</p>
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink">{lead.notes}</p>
            </div>
          ) : null}

          <div className="card">
            <p className={cardLabel}>Notes</p>
            <LeadNotes leadId={lead.id} notes={notes} canManage={canManage} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-10">
          <div className="card">
            <p className={cardLabel}>Details</p>
            <div className="space-y-3.5 text-sm">
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 flex-none text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
                <a href={`mailto:${lead.email}`} className="truncate hover:underline" style={{ color: 'var(--accent-text)' }}>{lead.email}</a>
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 flex-none text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.4-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                </svg>
                {lead.phone ? <a href={`tel:${lead.phone}`} className="text-ink hover:underline">{lead.phone}</a> : <span className="text-ink-soft">No phone</span>}
              </div>
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 flex-none text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M3 21h18" />
                  <path d="M6 21V7l6-4 6 4v14" />
                  <path d="M10 9h.01M14 9h.01M10 13h.01M14 13h.01M10 17h.01M14 17h.01" />
                </svg>
                <span className="text-ink">{lead.company ?? 'No company'}</span>
              </div>
              {lead.companyId ? (
                <div className="flex items-center gap-3 border-t border-ink/10 pt-3.5">
                  <svg className="h-4 w-4 flex-none text-ink-soft" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M5 7h14M5 12h14M5 17h14" />
                  </svg>
                  <Link href={`/app/companies/${lead.companyId}`} className="text-navy hover:underline">In CRM: view company →</Link>
                </div>
              ) : null}
            </div>
          </div>

          <div className="card">
            <p className={cardLabel}>Assigned to</p>
            {canManage ? (
              <LeadAssigneeControl leadId={lead.id} value={lead.assignedToId} users={assignableUsers} />
            ) : (
              <span className="text-sm text-ink">{lead.assignedToName ?? 'Unassigned'}</span>
            )}
          </div>

          <div className="card">
            <p className={cardLabel}>Channel</p>
            {canManage ? (
              <LeadChannelControl id={lead.id} channel={lead.channel} />
            ) : (
              <span className="chip chip-muted">{LEAD_CHANNEL_LABELS[lead.channel]}</span>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
