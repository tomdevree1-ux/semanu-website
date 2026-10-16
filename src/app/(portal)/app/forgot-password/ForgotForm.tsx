'use client';

import { useActionState } from 'react';
import { requestPasswordReset } from '@/modules/auth/actions';
import type { AuthState } from '@/modules/auth/schema';
import { Spinner } from '@/components/portal/ui/Spinner';
import { AuthField } from '@/components/portal/ui/AuthField';

const initial: AuthState = {};
const GENERIC = "If an account exists for that address, we've sent a reset link.";

export function ForgotForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial);

  if (state.ok) {
    return <p className="rounded-xl bg-ok/10 px-4 py-3 text-sm text-ok">{GENERIC}</p>;
  }

  return (
    <form action={action} className="space-y-6">
      <AuthField label="Email" name="email" type="email" autoComplete="email" required disabled={pending} />
      <button
        type="submit"
        disabled={pending}
        className="pa-btn pa-btn-primary mt-1 w-full !py-3 disabled:opacity-70"
      >
        {pending ? <Spinner size="sm" /> : 'Send reset link'}
      </button>
    </form>
  );
}
