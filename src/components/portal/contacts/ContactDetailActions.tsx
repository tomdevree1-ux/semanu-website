'use client';

import { useActionState } from 'react';
import { updateContact, changeContactStatus, archiveContact, restoreContact } from '@/modules/contacts/actions';
import type { ContactActionState } from '@/modules/contacts/schema';
import { CONTACT_SELECTABLE_STATUSES, CONTACT_CONFIRM_STATUSES } from '@/modules/contacts/status';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { ContactDetail } from '@/modules/contacts/types';

const empty: ContactActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: ContactActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function ContactDetailActions({
  contact,
  canUpdate,
  canArchive,
}: {
  contact: ContactDetail;
  canUpdate: boolean;
  canArchive: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeContactStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreContact, empty);

  const confirmWord = contact.name || contact.email || 'this contact';

  if (contact.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This contact is archived and hidden from the default list. Restore it to manage again.
        </p>
        <Notice s={restoreState} okText="Contact restored." />
        {canArchive ? (
          <form action={restoreAction} className="mt-3">
            <input type="hidden" name="contactId" value={contact.id} />
            <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
              {restorePending ? 'Restoring…' : 'Restore contact'}
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
          title="Contact info"
          action={updateContact}
          hiddenFields={{ contactId: contact.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Name" value={contact.name} />
              <Read label="Role" value={contact.role} />
              <Read label="Email" value={contact.email} />
              <Read label="Phone" value={contact.phone} />
              <Read label="Primary" value={contact.isPrimary ? 'Yes' : 'No'} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Name <span className="text-red">*</span></span>
                <input name="name" defaultValue={contact.name ?? ''} required maxLength={120} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Role</span>
                <input name="role" defaultValue={contact.role ?? ''} maxLength={120} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Email</span>
                <input name="email" type="email" defaultValue={contact.email ?? ''} maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Phone</span>
                <input name="phone" defaultValue={contact.phone ?? ''} maxLength={50} disabled={pending} className={input} />
              </label>
              <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
                <input type="checkbox" name="isPrimary" value="on" defaultChecked={contact.isPrimary} disabled={pending} className="h-4 w-4" />
                Primary contact for this company
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
            if (CONTACT_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Set this contact to "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="contactId" value={contact.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={contact.contactStatus} disabled={statusPending} className={`${input} max-w-xs`}>
              {CONTACT_SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the contact from the default list. It is kept (no hard delete) and can be
            restored.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive contact"
              triggerClassName={dangerBtn}
              title="Archive this contact"
              description={`This hides ${confirmWord} from the default list. It can be restored later.`}
              confirmWord={confirmWord}
              confirmLabel="Archive contact"
              action={archiveContact}
              hiddenFields={{ contactId: contact.id }}
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
