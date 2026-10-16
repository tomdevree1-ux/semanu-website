'use client';

import { useActionState } from 'react';
import {
  updateFunnelStatus,
  updateFunnelNotes,
  assignFunnelOwner,
  linkFunnelToContact,
  linkFunnelToCompany,
  createCompanyFromFunnel,
  createContactFromFunnel,
  archiveFunnelSubmission,
  restoreFunnelSubmission,
} from '@/modules/funnels/actions';
import type { FunnelActionState } from '@/modules/funnels/schema';
import type { FunnelDetail, OwnerOption, CompanyOption, ContactOption } from '@/modules/funnels/types';
import { FUNNEL_EDITABLE_STATUSES } from '@/modules/funnels/status';
import { StatusBadge } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';

const empty: FunnelActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const ghost = 'rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function titleize(v: string): string {
  return v.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function Notice({ s, okText = 'Saved.' }: { s: FunnelActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="break-words text-ink">{value || '—'}</dd>
    </div>
  );
}

export function FunnelDetailActions({
  funnel,
  canUpdate,
  canAssign,
  canArchive,
  canCreateCompany,
  canCreateContact,
  owners,
  companies,
  contacts,
}: {
  funnel: FunnelDetail;
  canUpdate: boolean;
  canAssign: boolean;
  canArchive: boolean;
  canCreateCompany: boolean;
  canCreateContact: boolean;
  owners: OwnerOption[];
  companies: CompanyOption[];
  contacts: ContactOption[];
}) {
  const [linkCompanyState, linkCompanyAction, linkCompanyPending] = useActionState(linkFunnelToCompany, empty);
  const [linkContactState, linkContactAction, linkContactPending] = useActionState(linkFunnelToContact, empty);
  const [createCompanyState, createCompanyAction, createCompanyPending] = useActionState(createCompanyFromFunnel, empty);
  const [createContactState, createContactAction, createContactPending] = useActionState(createContactFromFunnel, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreFunnelSubmission, empty);

  if (funnel.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">
            This submission is archived (hidden from the default list). No data was deleted. Restore it to manage and
            follow up again.
          </p>
          <Notice s={restoreState} okText="Submission restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="id" value={funnel.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore submission'}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Status */}
      {canUpdate ? (
        <EditableBlock
          title="Status"
          action={updateFunnelStatus}
          hiddenFields={{ id: funnel.id }}
          readView={<StatusBadge entityType="funnel" status={funnel.status} size="md" />}
          editView={(pending) => (
            <label className="block">
              <span className="text-sm font-medium text-ink">Status</span>
              <select name="status" defaultValue={funnel.status} disabled={pending} className={input}>
                {FUNNEL_EDITABLE_STATUSES.map((s) => (
                  <option key={s} value={s}>{titleize(s)}</option>
                ))}
              </select>
            </label>
          )}
        />
      ) : null}

      {/* Owner */}
      {canAssign ? (
        <EditableBlock
          title="Owner"
          action={assignFunnelOwner}
          hiddenFields={{ id: funnel.id }}
          readView={<p className="text-sm text-ink">{funnel.ownerName || 'Unassigned'}</p>}
          editView={(pending) => (
            <label className="block">
              <span className="text-sm font-medium text-ink">Owner</span>
              <select name="ownerId" defaultValue={funnel.ownerId ?? ''} disabled={pending} className={input}>
                <option value="">Unassigned</option>
                {owners.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </label>
          )}
        />
      ) : null}

      {/* CRM links + create */}
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">CRM</h2>
        <p className="mt-1 text-sm text-ink-soft">
          The CRM is the source of truth. Linking never overwrites a contact or company; creating fills empty fields
          only.
        </p>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <Read label="Linked company" value={funnel.companyNameLinked ? `${funnel.companyNameLinked}${funnel.companyArchived ? ' (archived)' : ''}` : null} />
          <Read label="Linked contact" value={funnel.contactName ? `${funnel.contactName}${funnel.contactArchived ? ' (archived)' : ''}` : null} />
        </dl>

        {canUpdate ? (
          <div className="mt-4 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
            {/* Link existing company */}
            <form action={linkCompanyAction}>
              <input type="hidden" name="id" value={funnel.id} />
              <label className="block">
                <span className="text-sm font-medium text-ink">Link existing company</span>
                <select name="companyId" defaultValue={funnel.companyId ?? ''} className={input}>
                  <option value="">Select a company…</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={linkCompanyPending} className={`${ghost} mt-2`}>
                {linkCompanyPending ? 'Linking…' : 'Link company'}
              </button>
              <Notice s={linkCompanyState} okText="Company linked." />
            </form>

            {/* Link existing contact */}
            <form action={linkContactAction}>
              <input type="hidden" name="id" value={funnel.id} />
              <label className="block">
                <span className="text-sm font-medium text-ink">Link existing contact</span>
                <select name="contactId" defaultValue={funnel.contactId ?? ''} className={input}>
                  <option value="">Select a contact…</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
                  ))}
                </select>
              </label>
              <button type="submit" disabled={linkContactPending} className={`${ghost} mt-2`}>
                {linkContactPending ? 'Linking…' : 'Link contact'}
              </button>
              <Notice s={linkContactState} okText="Contact linked." />
            </form>
          </div>
        ) : null}

        {/* Create from submission */}
        {canUpdate && (canCreateCompany || canCreateContact) ? (
          <div className="mt-4 grid gap-4 border-t border-ink/10 pt-4 sm:grid-cols-2">
            {canCreateCompany ? (
              <div>
                <p className="text-sm font-medium text-ink">Create company</p>
                <p className="mt-1 text-xs text-ink-soft">
                  {funnel.companyId ? 'Already linked to a company.' : 'Uses the domain or name from this submission.'}
                </p>
                <form action={createCompanyAction} className="mt-2">
                  <input type="hidden" name="id" value={funnel.id} />
                  <button type="submit" disabled={createCompanyPending || !!funnel.companyId} className={ghost}>
                    {createCompanyPending ? 'Creating…' : 'Create company from submission'}
                  </button>
                </form>
                <Notice s={createCompanyState} okText="Company created and linked." />
              </div>
            ) : null}

            {canCreateContact ? (
              <div>
                <p className="text-sm font-medium text-ink">Create contact</p>
                <p className="mt-1 text-xs text-ink-soft">A contact needs a company. Pick the company to attach it to.</p>
                <form action={createContactAction} className="mt-2">
                  <input type="hidden" name="id" value={funnel.id} />
                  <select name="companyId" defaultValue={funnel.companyId ?? ''} className={input}>
                    <option value="">Select a company…</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}{c.archived ? ' (archived)' : ''}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={createContactPending} className={`${ghost} mt-2`}>
                    {createContactPending ? 'Creating…' : 'Create contact from submission'}
                  </button>
                </form>
                <Notice s={createContactState} okText="Contact created and linked." />
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {/* Notes */}
      {canUpdate ? (
        <EditableBlock
          title="Notes"
          action={updateFunnelNotes}
          hiddenFields={{ id: funnel.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Notes" value={funnel.notes} />
              <Read label="Internal notes" value={funnel.internalNotes} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" defaultValue={funnel.notes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Internal notes</span>
                <textarea name="internalNotes" defaultValue={funnel.internalNotes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
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
            Archiving hides this submission from the default list (no hard delete; restore any time). Linked CRM records
            are unaffected.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive submission"
              triggerClassName={dangerBtn}
              title="Archive this submission"
              description="Type the submission email to archive it. Linked CRM records are unaffected."
              confirmWord={funnel.email}
              confirmLabel="Archive submission"
              action={archiveFunnelSubmission}
              hiddenFields={{ id: funnel.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
