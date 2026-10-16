'use client';

import { useActionState } from 'react';
import { setNewPassword } from '@/modules/auth/actions';
import type { AuthState } from '@/modules/auth/schema';
import { Spinner } from '@/components/portal/ui/Spinner';
import { AuthField } from '@/components/portal/ui/AuthField';

const initial: AuthState = {};

export function ResetForm() {
  const [state, action, pending] = useActionState(setNewPassword, initial);
  return (
    <form action={action} className="space-y-6">
      {state.error ? (
        <p className="rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <AuthField
        label="New password"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        disabled={pending}
        hint="Use at least 10 characters."
      />
      <AuthField
        label="Confirm password"
        name="confirm"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        disabled={pending}
      />
      <button
        type="submit"
        disabled={pending}
        className="pa-btn pa-btn-primary mt-1 w-full !py-3 disabled:opacity-70"
      >
        {pending ? <Spinner size="sm" /> : 'Update password'}
      </button>
    </form>
  );
}
