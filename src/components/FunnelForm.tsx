'use client';

import { useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { funnelSubmitSchema, type FunnelSubmitInput } from '@/lib/validation';
import { track } from '@/lib/analytics';
import { Turnstile } from '@/components/Turnstile';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rateLimited';
type Errors = Partial<Record<string, string>>;

/** Source funnels that can mount this form. Public site ships `website_analysis`; the
 *  others are modelled server side and can reuse this component later. */
type FunnelSource = FunnelSubmitInput['sourceType'];

/**
 * Public funnel / lead magnet form (P13). Posts to /api/funnels/submit which hardens the
 * request (rate limit, Turnstile, honeypot) and writes via the service role. The browser
 * never sees a secret and the response never reveals whether a contact already exists, so
 * we always show the same success state on a passing submit. Honeypot field is `companyUrl`
 * (distinct from the real `website`); the privacy consent is required.
 */
export function FunnelForm({ source = 'website_analysis' }: { source?: FunnelSource }) {
  const t = useTranslations('funnel');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const [dismissed, setDismissed] = useState(false);
  const [alreadyRequested, setAlreadyRequested] = useState(false);
  const [previousAt, setPreviousAt] = useState<string | null>(null);
  const startedRef = useRef(false);

  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('funnel_form_started', { source });
  }

  function messageFor(code: string) {
    if (code === 'email') return t('errEmail');
    if (code === 'consent_required') return t('errConsent');
    return t('errRequired');
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      sourceType: source,
      firstName: String(data.get('firstName') ?? ''),
      lastName: String(data.get('lastName') ?? ''),
      email: String(data.get('email') ?? ''),
      website: String(data.get('website') ?? ''),
      consentPrivacy: data.get('consentPrivacy') === 'on',
      consentMarketing: data.get('consentMarketing') === 'on',
      companyUrl: String(data.get('companyUrl') ?? ''), // honeypot
      turnstileToken: captchaToken || undefined,
      locale: locale as 'de' | 'fr' | 'en',
      pagePath: typeof window !== 'undefined' ? window.location.pathname : undefined,
      referrer: typeof document !== 'undefined' && document.referrer ? document.referrer : undefined,
    };

    const parsed = funnelSubmitSchema.safeParse(payload);
    if (!parsed.success) {
      const next: Errors = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? 'form');
        if (!next[field]) next[field] = messageFor(issue.message);
      }
      setErrors(next);
      return;
    }

    setStatus('submitting');
    try {
      const res = await fetch('/api/funnels/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (res.status === 429) {
        setStatus('rateLimited');
        return;
      }
      if (!res.ok) throw new Error('request failed');
      const body = (await res.json().catch(() => ({}))) as { alreadyRequested?: boolean; previousAt?: string | null };
      setAlreadyRequested(Boolean(body.alreadyRequested));
      setPreviousAt(body.previousAt ?? null);
      track('funnel_submitted', { source });
      setStatus('success');
      form.reset();
    } catch {
      track('funnel_failed', { source });
      setStatus('error');
    }
  }

  if (status === 'success') {
    const title = alreadyRequested ? t('dupTitle') : t('okTitle');
    const when = previousAt ? new Date(previousAt).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' }) : '';
    const text = alreadyRequested ? t('dupText', { date: when }) : t('okText');
    return (
      <>
        <div role="status" aria-live="polite" className="rounded-lg bg-white p-8 text-ink">
          <h3 className="h3 text-ok">{title}</h3>
          <p className="mt-2 text-ink-soft">{text}</p>
        </div>
        {!dismissed && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="funnel-ok-title"
          >
            <div className="w-full max-w-md rounded-xl bg-white p-8 text-center text-ink shadow-2xl">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-mint/30 text-ok">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              </span>
              <h3 id="funnel-ok-title" className="h3">{title}</h3>
              <p className="mt-3 text-ink-soft">{text}</p>
              <button
                type="button"
                onClick={() => setDismissed(true)}
                className="btn btn-primary mt-6 w-full justify-center"
              >
                {t('okButton')}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      onFocusCapture={markStarted}
      onChangeCapture={markStarted}
      className="rounded-lg bg-white p-6 text-ink sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t('firstName')} name="firstName" required error={errors.firstName} />
        <Field label={t('lastName')} name="lastName" required error={errors.lastName} />
        <Field
          className="sm:col-span-2"
          label={t('email')}
          name="email"
          type="email"
          required
          error={errors.email}
        />
        <Field
          className="sm:col-span-2"
          label={t('website')}
          name="website"
          type="url"
          placeholder="https://"
          required
          error={errors.website}
        />
      </div>

      {/* Honeypot — hidden from users, catches bots. Distinct from the real `website` field. */}
      <div className="hidden" aria-hidden>
        <label>
          Company URL
          <input type="text" name="companyUrl" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-ink-soft">
        <Checkbox name="consentPrivacy" />
        <span>
          {t('consent')} <span className="text-red">*</span>
          {errors.consentPrivacy && <FieldError msg={errors.consentPrivacy} />}
        </span>
      </label>

      <label className="mt-3 flex items-start gap-3 text-sm text-ink-soft">
        <Checkbox name="consentMarketing" />
        <span>{t('marketing')}</span>
      </label>

      {status === 'error' && (
        <p role="alert" aria-live="assertive" className="mt-4 text-sm text-red">
          {t('errGeneric')}
        </p>
      )}
      {status === 'rateLimited' && (
        <p role="alert" aria-live="assertive" className="mt-4 text-sm text-red">
          {t('errRateLimit')}
        </p>
      )}

      <Turnstile onToken={setCaptchaToken} />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn btn-primary mt-6 w-full justify-center disabled:opacity-60"
      >
        {status === 'submitting' ? t('sending') : t('submit')}
      </button>
    </form>
  );
}

function fieldClass(hasError: boolean) {
  return [
    'w-full rounded-lg border bg-paper px-3.5 py-2.5 text-sm outline-none transition-colors',
    'focus:border-red',
    hasError ? 'border-red' : 'border-[var(--line)]',
  ].join(' ');
}

function FieldError({ msg }: { msg: string }) {
  return <span className="mt-1 block text-xs font-semibold text-danger">{msg}</span>;
}

function Checkbox({ name }: { name: string }) {
  return (
    <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
      <input
        type="checkbox"
        name={name}
        className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 border-[var(--line-strong)] bg-paper transition-colors checked:border-red checked:bg-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/40"
      />
      <svg
        aria-hidden
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 text-white opacity-0 peer-checked:opacity-100"
      >
        <path d="M3 8.5l3.5 3.5L13 4.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required = false,
  error,
  placeholder,
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        className={fieldClass(!!error)}
      />
      {error && <FieldError msg={error} />}
    </div>
  );
}
