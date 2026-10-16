'use client';

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { signIn } from '@/modules/auth/actions';
import type { AuthState } from '@/modules/auth/schema';
import { Spinner } from '@/components/portal/ui/Spinner';

const initial: AuthState = {};

type Notice = { text: string; kind: 'success' | 'error' };

const label = 'mb-2 block text-[15px] font-semibold text-ink';
const field =
  'h-[52px] w-full rounded-xl border border-[#E5E7EB] bg-white text-ink outline-none transition placeholder:text-ink-soft/60 focus:border-mint focus:ring-4 focus:ring-mint/20 disabled:opacity-60';
const leftIcon = 'pointer-events-none absolute inset-y-0 left-4 grid place-items-center text-ink-soft';

export function LoginForm({ next, notice }: { next: string | null; notice: Notice | null }) {
  const [state, action, pending] = useActionState(signIn, initial);
  const [showPw, setShowPw] = useState(false);

  return (
    <form action={action}>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      {notice ? (
        <p
          className={`mb-6 rounded-xl px-4 py-3 text-sm ${notice.kind === 'success' ? 'bg-ok/10 text-ok' : 'bg-danger/10 text-danger'}`}
          role={notice.kind === 'error' ? 'alert' : undefined}
        >
          {notice.text}
        </p>
      ) : null}
      {state.error ? (
        <p className="mb-6 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}

      {/* Email */}
      <div>
        <label htmlFor="login-email" className={label}>Email</label>
        <div className="relative">
          <span className={leftIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="3" y="5" width="18" height="14" rx="2" />
              <path d="M3 7l9 6 9-6" />
            </svg>
          </span>
          <input id="login-email" name="email" type="email" autoComplete="email" required disabled={pending} placeholder="you@amai.ch" className={`${field} !pl-12 !pr-4`} />
        </div>
      </div>

      {/* Password */}
      <div className="mt-6">
        <label htmlFor="login-password" className={label}>Password</label>
        <div className="relative">
          <span className={leftIcon}>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="4" y="11" width="16" height="9" rx="2" />
              <path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
          </span>
          <input id="login-password" name="password" type={showPw ? 'text' : 'password'} autoComplete="current-password" required disabled={pending} placeholder="••••••••••••" className={`${field} !pl-12 !pr-12`} />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            disabled={pending}
            aria-label={showPw ? 'Hide password' : 'Show password'}
            className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-lg text-ink-soft transition-colors hover:text-ink"
          >
            {showPw ? (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M3 3l18 18" />
                <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
                <path d="M9.4 5.2A9.5 9.5 0 0 1 12 5c5 0 9 4.5 10 7a13.2 13.2 0 0 1-2.2 3M6.1 6.1A13.3 13.3 0 0 0 2 12c1 2.5 5 7 10 7 1.5 0 2.9-.3 4.1-.9" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Remember me */}
      <label className="mt-6 flex items-center gap-3 text-sm text-ink">
        <input type="checkbox" name="remember" value="1" disabled={pending} className="h-[18px] w-[18px] rounded-[5px] border-ink/25 accent-mint" />
        Stay signed in
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="mt-6 grid h-[52px] w-full place-items-center rounded-[14px] bg-mint font-semibold text-ink shadow-[0_12px_28px_-14px_rgba(147,230,190,0.95)] transition hover:brightness-[0.97] disabled:opacity-70"
      >
        {pending ? <Spinner size="sm" /> : 'Sign in'}
      </button>

      <div className="mt-5">
        <Link href="/app/forgot-password" className="text-sm font-semibold text-[color:var(--accent-text)] hover:underline">
          Forgot password?
        </Link>
      </div>
    </form>
  );
}
