import type { InputHTMLAttributes } from 'react';

/** One labelled input for the pre-auth forms. Shared so login / forgot / reset
 *  all get the same generous spacing and mint focus ring. */
export function AuthField({
  label,
  hint,
  ...input
}: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        {...input}
        className="mt-2 w-full rounded-xl border border-ink/20 bg-white px-4 py-3 text-ink outline-none transition focus:border-mint focus:ring-4 focus:ring-mint/30 disabled:opacity-60"
      />
      {hint ? <span className="mt-2 block text-xs text-ink-soft">{hint}</span> : null}
    </label>
  );
}
