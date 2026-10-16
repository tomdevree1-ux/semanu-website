'use client';

import { useActionState } from 'react';
import {
  updateUserName,
  changeUserRole,
  setUserStatus,
  resendInvite,
  sendUserPasswordReset,
  archiveUser,
  restoreUser,
  anonymizeUser,
} from '@/modules/users/actions';
import { ROLES, ROLE_LABELS, type UserActionState } from '@/modules/users/schema';
import { Spinner } from '@/components/portal/ui/Spinner';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import type { UserDetail } from '@/modules/users/types';

const empty: UserActionState = {};
const input =
  'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: UserActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

export function UserDetailActions({
  user,
  canUpdate,
  canCreate,
  canChangeRole,
  canDisable,
  canArchive,
  isSuperAdmin,
}: {
  user: UserDetail;
  canUpdate: boolean;
  canCreate: boolean;
  canChangeRole: boolean;
  canDisable: boolean;
  canArchive: boolean;
  isSuperAdmin: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeUserRole, empty);
  const [statusState, statusAction, statusPending] = useActionState(setUserStatus, empty);
  const [inviteState, inviteAction, invitePending] = useActionState(resendInvite, empty);
  const [resetState, resetAction, resetPending] = useActionState(sendUserPasswordReset, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreUser, empty);

  // ── Archived users are read-only except restore / anonymize. ──
  if (user.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This user is archived and cannot sign in. Restore them to manage again, or anonymize to
          permanently erase their personal data.
        </p>
        <Notice s={restoreState} okText="User restored to disabled." />
        <div className="mt-3 flex flex-wrap gap-2">
          {canArchive ? (
            <form action={restoreAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore user'}
              </button>
            </form>
          ) : null}
          {isSuperAdmin ? (
            <ConfirmDialog
              triggerLabel="Anonymize (GDPR)"
              triggerClassName={dangerBtn}
              title="Anonymize this user"
              description={`This permanently erases personal data for ${user.email}. It cannot be undone.`}
              confirmWord={user.email}
              confirmLabel="Anonymize permanently"
              action={anonymizeUser}
              hiddenFields={{ userId: user.id }}
              danger
            />
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUpdate ? (
        <EditableBlock
          title="Name"
          action={updateUserName}
          hiddenFields={{ userId: user.id }}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-soft">First name</dt>
                <dd className="text-ink">{user.firstName || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs text-ink-soft">Last name</dt>
                <dd className="text-ink">{user.lastName || '—'}</dd>
              </div>
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">First name</span>
                <input name="firstName" defaultValue={user.firstName ?? ''} maxLength={80} required disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Last name</span>
                <input name="lastName" defaultValue={user.lastName ?? ''} maxLength={80} required disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canChangeRole ? (
        <form
          action={roleAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('role') as HTMLSelectElement | null)?.value;
            if ((v === 'admin' || user.role === 'admin') && !window.confirm('Change the admin role for this user?')) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Role</h2>
          <Notice s={roleState} />
          <input type="hidden" name="userId" value={user.id} />
          <select name="role" defaultValue={user.role ?? 'read_only'} disabled={rolePending} className={`${input} max-w-xs`}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
          <div>
            <button type="submit" disabled={rolePending} className="pa-btn pa-btn-primary mt-3 !py-2 disabled:opacity-70">
              {rolePending ? <Spinner size="sm" /> : 'Change role'}
            </button>
          </div>
        </form>
      ) : null}

      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Access</h2>
        {canDisable ? <Notice s={statusState} /> : null}
        <Notice s={inviteState} okText="Invite resent." />
        <Notice s={resetState} okText="Password reset sent." />

        <div className="mt-3 flex flex-wrap gap-2">
          {canDisable && user.status === 'active' && !user.isSelf ? (
            <form action={statusAction} onSubmit={(e) => { if (!window.confirm('Disable this user?')) e.preventDefault(); }}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="status" value="disabled" />
              <button type="submit" disabled={statusPending} className={`${dangerBtn} disabled:opacity-70`}>
                {statusPending ? 'Working…' : 'Disable user'}
              </button>
            </form>
          ) : null}

          {canDisable && user.status === 'disabled' ? (
            <form action={statusAction}>
              <input type="hidden" name="userId" value={user.id} />
              <input type="hidden" name="status" value="active" />
              <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {statusPending ? 'Working…' : 'Enable user'}
              </button>
            </form>
          ) : null}

          {user.status === 'invited' && canCreate ? (
            <form action={inviteAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" disabled={invitePending} className="rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70">
                {invitePending ? 'Sending…' : 'Resend invite'}
              </button>
            </form>
          ) : null}

          {user.status === 'active' && canUpdate ? (
            <form action={resetAction}>
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit" disabled={resetPending} className="rounded-pill border border-ink/15 px-4 py-1.5 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70">
                {resetPending ? 'Sending…' : 'Send password reset'}
              </button>
            </form>
          ) : null}
        </div>

        {user.isSelf ? (
          <p className="mt-2 text-xs text-ink-soft">You cannot disable or demote your own account.</p>
        ) : null}
      </div>

      {canArchive && !user.isSelf ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving removes access and roles. The account is kept (no hard delete) and can be
            restored.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive user"
              triggerClassName={dangerBtn}
              title="Archive this user"
              description={`This removes ${user.email}'s access and roles. The account is kept and can be restored.`}
              confirmWord={user.email}
              confirmLabel="Archive user"
              action={archiveUser}
              hiddenFields={{ userId: user.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
