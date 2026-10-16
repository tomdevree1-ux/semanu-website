import type { ReactNode } from 'react';
import { BrandLogo } from '@/components/BrandLogo';

/**
 * Premium centered card chrome for the pre-auth pages (login / forgot / reset).
 * One calm column, everything left-aligned on the same x: logo → eyebrow → 32px →
 * title → 8px → subtitle → 32px → form. Marine + Mint house style; mint only as
 * a quiet accent (glow, focus, links).
 */
export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12"
      style={{
        backgroundImage:
          'radial-gradient(1200px 620px at 50% 32%, rgba(147,230,190,0.22), transparent 62%), linear-gradient(180deg, #F4F6FA 0%, #E9EEF4 100%)',
      }}
    >
      <div aria-hidden className="pointer-events-none absolute -right-56 -top-56 h-[34rem] w-[34rem] rounded-full border border-mint/30" />
      <div aria-hidden className="pointer-events-none absolute -bottom-64 -left-56 h-[40rem] w-[40rem] rounded-full border border-mint/25" />

      <div className="relative w-full max-w-[540px]">
        <div className="rounded-[24px] border border-ink/[0.06] bg-white p-10 shadow-[0_34px_90px_-44px_rgba(7,34,31,0.32)] sm:p-12">
          <span className="block font-display text-5xl leading-none text-navy">
            <BrandLogo />
          </span>
          <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-ink-soft">Admin portal</p>

          <h1 className="mt-8 font-display text-[40px] leading-[1.05] text-navy">{title}</h1>
          {subtitle ? <p className="mt-2 text-lg font-medium leading-relaxed text-ink-soft">{subtitle}</p> : null}

          <div className="mt-8">{children}</div>
        </div>
        {footer ? <div className="mt-6 text-center text-sm text-ink-soft">{footer}</div> : null}
      </div>
    </div>
  );
}
