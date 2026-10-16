'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { contactLeadSchema } from '@/lib/validation';
import { readAttribution } from '@/lib/attribution';
import { serviceLinks, SERVICE_ID_BY_SLUG, type ServicesLocale } from '@/content/services';
import { CustomSelect } from '@/components/CustomSelect';
import { track } from '@/lib/analytics';
import { Turnstile } from '@/components/Turnstile';

type Status = 'idle' | 'submitting' | 'success' | 'error';
type Errors = Partial<Record<string, string>>;

/**
 * Contact form — posts to /api/leads (formType: 'contact'). Validates with the
 * shared zod schema and shows localized inline errors (no native bubbles).
 * Includes a honeypot field and passes the active locale as sourceLocale.
 */
export function ContactForm() {
  const t = useTranslations('form');
  const tc = useTranslations('contact');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const startedRef = useRef(false);

  // "What are you interested in?" — options from the shared services list plus
  // "Not sure yet". Preselected from the ?interest= query (set on /services CTAs).
  const interestOptions = [
    ...serviceLinks((['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale).map(
      (s) => ({ value: s.id, label: s.title }),
    ),
    { value: 'not-sure', label: t('interestNotSure') },
  ];
  // Pre-checked interests come from the ?interest= query (service page CTAs), else none.
  const [preselect, setPreselect] = useState<string[]>([]);
  const [prefillMessage, setPrefillMessage] = useState('');
  const [configData, setConfigData] = useState<unknown>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('interest');
    // Service CTAs use the public slug (?interest=workflow-automation,
    // ?interest=maatwerksoftware, ...). Map the slug to the internal service id so
    // the interest preselects correctly; fall back to the raw value.
    const p = raw ? (SERVICE_ID_BY_SLUG[raw] ?? raw) : null;
    if (p && interestOptions.some((o) => o.value === p)) setPreselect([p]);
    // Prefill from the pricing configurator (?from=configurator): drop the saved
    // configuration into the message and preselect the website interest, so the
    // lead reaches the dashboard with everything the visitor clicked.
    if (params.get('from') === 'configurator') {
      try {
        const cfg = sessionStorage.getItem('amai-configurator');
        if (cfg) {
          setPrefillMessage(cfg);
          setPreselect((cur) => (cur.length ? cur : ['3d-configurators']));
          sessionStorage.removeItem('amai-configurator');
        }
        const data = sessionStorage.getItem('amai-configurator-data');
        if (data) {
          try {
            setConfigData(JSON.parse(data));
          } catch {
            /* ignore */
          }
          sessionStorage.removeItem('amai-configurator-data');
        }
      } catch {
        /* ignore */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // GA4 — fire once on first interaction. No personal data.
  function markStarted() {
    if (startedRef.current) return;
    startedRef.current = true;
    track('contact_form_started');
  }

  function messageFor(code: string) {
    if (code === 'email') return t('errEmail');
    if (code === 'invalid') return t('errPhone');
    if (code === 'consent_required') return t('errConsent');
    return t('errRequired');
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    const form = e.currentTarget;
    const data = new FormData(form);

    const payload = {
      formType: 'contact' as const,
      firstname: String(data.get('firstname') ?? ''),
      lastname: String(data.get('lastname') ?? ''),
      company: String(data.get('company') ?? ''),
      phone: String(data.get('phone') ?? ''),
      email: String(data.get('email') ?? ''),
      message: String(data.get('message') ?? ''),
      lang: (String(data.get('lang') ?? 'de') === 'en' ? 'en' : 'de') as 'de' | 'en',
      interests: data.getAll('interests').map(String),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''), // honeypot
      sourceLocale: locale as 'de' | 'fr' | 'en',
      ...readAttribution(),
      turnstileToken: captchaToken || undefined,
      config: configData ?? undefined,
    };

    const parsed = contactLeadSchema.safeParse(payload);
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
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) throw new Error('request failed');
      track('contact_request_submitted', { lang: payload.lang });
      setStatus('success');
      form.reset();
    } catch {
      track('contact_request_failed');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-lg bg-white p-8 text-ink">
        <h3 className="h3 text-ok">{tc('okTitle')}</h3>
        <p className="mt-2 text-ink-soft">{tc('okText')}</p>
      </div>
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
        <Field label={t('firstname')} name="firstname" required error={errors.firstname} />
        <Field label={t('lastname')} name="lastname" required error={errors.lastname} />
        <Field label={t('company')} name="company" required error={errors.company} />
        <Field label={t('phone')} name="phone" type="tel" required error={errors.phone} />
        <Field
          className="sm:col-span-2"
          label={t('email')}
          name="email"
          type="email"
          required
          error={errors.email}
        />
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold">{t('interest')}</span>
          <div key={preselect.join(',')} className="grid gap-2.5 sm:grid-cols-2">
            {interestOptions.map((o) => (
              <label
                key={o.value}
                className="flex cursor-pointer items-center gap-2.5 text-sm text-ink-soft"
              >
                <input
                  type="checkbox"
                  name="interests"
                  value={o.value}
                  defaultChecked={preselect.includes(o.value)}
                  className="h-4 w-4 shrink-0 cursor-pointer accent-red"
                />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">{t('interestHelp')}</p>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-sm font-semibold">
            {t('message')} <span className="text-red">*</span>
          </label>
          <textarea
            key={prefillMessage ? 'prefilled' : 'empty'}
            id="message"
            name="message"
            rows={prefillMessage ? 8 : 4}
            defaultValue={prefillMessage}
            placeholder={t('messagePlaceholder')}
            className={fieldClass(!!errors.message)}
          />
          {errors.message && <FieldError msg={errors.message} />}
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="lang" className="mb-1.5 block text-sm font-semibold">
            {t('lang')}
          </label>
          <CustomSelect
            id="lang"
            name="lang"
            defaultValue={locale === 'en' ? 'en' : 'de'}
            options={[
              { value: 'de', label: 'Deutsch' },
              { value: 'en', label: 'English' },
            ]}
          />
        </div>
      </div>

      {/* Honeypot — hidden from users, catches bots. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm text-ink-soft">
        <span className="relative mt-0.5 inline-flex h-5 w-5 shrink-0">
          <input
            type="checkbox"
            name="consent"
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
        <span>
          {t('consent')} <span className="text-red">*</span>
          {errors.consent && <FieldError msg={errors.consent} />}
        </span>
      </label>

      {status === 'error' && (
        <p className="mt-4 text-sm text-danger">{t('errGeneric')}</p>
      )}

      <Turnstile onToken={setCaptchaToken} />

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="btn btn-onink mt-6 w-full justify-center disabled:opacity-60"
      >
        {status === 'submitting' ? t('sending') : t('send')}
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

function Field({
  label,
  name,
  type = 'text',
  required = false,
  error,
  className = '',
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  error?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={name} className="mb-1.5 block text-sm font-semibold">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input id={name} name={name} type={type} className={fieldClass(!!error)} />
      {error && <FieldError msg={error} />}
    </div>
  );
}
