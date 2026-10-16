'use client';

import { useActionState } from 'react';
import { updateCompany, changeCompanyStatus, archiveCompany, restoreCompany } from '@/modules/companies/actions';
import { COMPANY_LANGUAGES, type CompanyActionState } from '@/modules/companies/schema';
import { COMPANY_SELECTABLE_STATUSES, COMPANY_CONFIRM_STATUSES } from '@/modules/companies/status';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { CompanyDetail } from '@/modules/companies/types';

const empty: CompanyActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: CompanyActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function CompanyDetailActions({
  company,
  owners,
  canUpdate,
  canArchive,
}: {
  company: CompanyDetail;
  owners: Array<{ id: string; name: string }>;
  canUpdate: boolean;
  canArchive: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeCompanyStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreCompany, empty);

  if (company.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This company is archived and hidden from the default list. Restore it to manage again.
          Its contacts are not affected.
        </p>
        <Notice s={restoreState} okText="Company restored." />
        {canArchive ? (
          <form action={restoreAction} className="mt-3">
            <input type="hidden" name="companyId" value={company.id} />
            <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
              {restorePending ? 'Restoring…' : 'Restore company'}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUpdate ? (
        <EditableBlock
          title="Company info"
          action={updateCompany}
          hiddenFields={{ companyId: company.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Domain" value={company.domain} />
              <Read label="Website" value={company.websiteUrl} />
              <Read label="Email" value={company.email} />
              <Read label="Phone" value={company.phone} />
              <Read label="City" value={company.city} />
              <Read label="Canton" value={company.canton} />
              <Read label="Country" value={company.country} />
              <Read label="Language" value={company.language ? company.language.toUpperCase() : null} />
              <Read label="Industry" value={company.industry} />
              <Read label="Owner" value={company.ownerName} />
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-soft">Notes</dt>
                <dd className="whitespace-pre-wrap text-ink">{company.notes || '—'}</dd>
              </div>
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company name" name="companyName" defaultValue={company.companyName} required pending={pending} />
              <Field label="Domain" name="domain" defaultValue={company.domain} pending={pending} />
              <Field label="Website" name="websiteUrl" defaultValue={company.websiteUrl} pending={pending} />
              <Field label="Email" name="email" type="email" defaultValue={company.email} pending={pending} />
              <Field label="Phone" name="phone" defaultValue={company.phone} pending={pending} />
              <Field label="City" name="city" defaultValue={company.city} pending={pending} />
              <Field label="Canton" name="canton" defaultValue={company.canton} pending={pending} />
              <Field label="Country" name="country" defaultValue={company.country} pending={pending} maxLength={2} />
              <label className="block">
                <span className="text-sm font-medium text-ink">Language</span>
                <select name="language" defaultValue={company.language ?? ''} disabled={pending} className={input}>
                  <option value="">—</option>
                  {COMPANY_LANGUAGES.map((l) => (
                    <option key={l} value={l}>{l.toUpperCase()}</option>
                  ))}
                </select>
              </label>
              <Field label="Industry" name="industry" defaultValue={company.industry} pending={pending} />
              <label className="block">
                <span className="text-sm font-medium text-ink">Owner</span>
                <select name="ownerId" defaultValue={company.ownerId ?? ''} disabled={pending} className={input}>
                  <option value="">— Unassigned</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Notes</span>
                <textarea name="notes" rows={3} defaultValue={company.notes ?? ''} maxLength={5000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canUpdate ? (
        <form
          action={statusAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('status') as HTMLSelectElement | null)?.value ?? '';
            if (COMPANY_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Set this company to "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">CRM status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="companyId" value={company.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={company.crmStatus} disabled={statusPending} className={`${input} max-w-xs`}>
              {COMPANY_SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Update'}
            </button>
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            CRM lifecycle, separate from the prospecting pipeline status.
          </p>
        </form>
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the company from the default list. It is kept (no hard delete) and can be
            restored. Contacts are not auto-archived.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive company"
              triggerClassName={dangerBtn}
              title="Archive this company"
              description={`This hides ${company.companyName} from the default list. It can be restored later.`}
              confirmWord={company.companyName}
              confirmLabel="Archive company"
              action={archiveCompany}
              hiddenFields={{ companyId: company.id }}
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
      <dd className="text-ink">{value || '—'}</dd>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = 'text',
  required = false,
  pending,
  maxLength,
}: {
  label: string;
  name: string;
  defaultValue: string | null;
  type?: string;
  required?: boolean;
  pending: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-ink">
        {label} {required ? <span className="text-red">*</span> : null}
      </span>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        maxLength={maxLength}
        disabled={pending}
        className={input}
      />
    </label>
  );
}
