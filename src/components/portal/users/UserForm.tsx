'use client';

import { useActionState } from 'react';
import { createUser } from '@/modules/users/actions';
import { ROLES, ROLE_LABELS, type UserActionState } from '@/modules/users/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const empty: UserActionState = {};
const input =
  'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';

/** Create + invite a new user. Redirects to the detail page on success. */
export function UserForm() {
  const [state, action, pending] = useActionState(createUser, empty);
  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium text-ink">First name</span>
          <input name="firstName" maxLength={80} required disabled={pending} className={input} />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink">Last name</span>
          <input name="lastName" maxLength={80} required disabled={pending} className={input} />
        </label>
      </div>

      <label className="block">
        <span className="text-sm font-medium text-ink">Email</span>
        <input name="email" type="email" required disabled={pending} className={input} />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-ink">Role</span>
        <select name="role" defaultValue="read_only" disabled={pending} className={input}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        disabled={pending}
        className="pa-btn pa-btn-primary justify-center !py-2.5 disabled:opacity-70"
      >
        {pending ? <Spinner size="sm" /> : 'Create and send invite'}
      </button>
      <p className="text-xs text-ink-soft">
        The user receives an email to set their own password. No password is created here.
      </p>
    </form>
  );
}
