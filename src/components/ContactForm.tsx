'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CONTACT_INTERESTS, CONTACT_LANGS, contactLeadSchema } from '@/lib/validation';
import { readAttribution } from '@/lib/attribution';
import { serviceLinks, type ServicesLocale } from '@/content/services';
import { CustomSelect } from '@/components/CustomSelect';
import { track } from '@/lib/analytics';
import { Turnstile } from '@/components/Turnstile';
import { CONTACT_EMAIL } from '@/lib/contact';

type Status = 'idle' | 'submitting' | 'success' | 'error' | 'rateLimited';
type Errors = Partial<Record<string, string>>;

/**
 * Contact form: posts to /api/leads (formType 'contact'), which forwards it to
 * the SEMANU edge function submit-contact (company + person + card on the leads
 * board). Validates with the shared zod schema and shows localized inline errors
 * (no native bubbles). Includes a honeypot field, a render timestamp for the
 * time trap and passes the active locale as sourceLocale.
 */
export function ContactForm() {
  const t = useTranslations('form');
  const tc = useTranslations('contact');
  const locale = useLocale();
  const [status, setStatus] = useState<Status>('idle');
  const [errors, setErrors] = useState<Errors>({});
  const [captchaToken, setCaptchaToken] = useState('');
  const startedRef = useRef(false);
  // Render time for the submit-contact time trap (bots submit within 2 s).
  const [renderedAt] = useState(() => Date.now());

  // "What are you interested in?" — options from the shared services list plus
  // "Not sure yet". Preselected from the ?interest= query (set on /services CTAs).
  const serviceList = serviceLinks((['de', 'fr', 'en', 'es', 'nl'].includes(locale) ? locale : 'de') as ServicesLocale);
  const interestOptions = [
    ...serviceList.map((s) => ({ value: s.id, label: s.title })),
    { value: 'not-sure', label: t('interestNotSure') },
  ];
  // Pre-checked interests come from the ?interest= query (service page CTAs), else none.
  const [preselect, setPreselect] = useState<string[]>([]);
  const [prefillMessage, setPrefillMessage] = useState('');
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('interest');
    // Service CTAs use the public slug (?interest=business-software,
    // ?interest=3d-configurators). Map the slug to the internal service id so
    // the interest preselects correctly; fall back to the raw value.
    const p = raw ? (serviceList.find((s) => s.slug === raw)?.id ?? raw) : null;
    if (p && interestOptions.some((o) => o.value === p)) setPreselect([p]);
    // Prefill from the pricing configurator (?from=configurator): drop the saved
    // configuration into the message and preselect the website interest, so the
    // lead reaches the dashboard with everything the visitor clicked.
    if (params.get('from') === 'configurator') {
      try {
        const cfg = sessionStorage.getItem('semanu-configurator');
        if (cfg) {
          setPrefillMessage(cfg);
          setPreselect((cur) => (cur.length ? cur : ['3d-configurators']));
          sessionStorage.removeItem('semanu-configurator');
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
      lang: toContactLang(String(data.get('lang') ?? '')),
      interests: data
        .getAll('interests')
        .map(String)
        .filter((v): v is (typeof CONTACT_INTERESTS)[number] =>
          (CONTACT_INTERESTS as readonly string[]).includes(v),
        ),
      consent: data.get('consent') === 'on',
      website: String(data.get('website') ?? ''), // honeypot
      sourceLocale: locale as 'de' | 'fr' | 'en' | 'es' | 'nl',
      ...readAttribution(),
      turnstileToken: captchaToken || undefined,
      renderedAt,
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
      // Too many submissions from this visitor (our own limit or submit-contact's).
      if (res.status === 429) {
        track('contact_request_rate_limited');
        setStatus('rateLimited');
        return;
      }
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
      <div className="rounded-[28px] bg-white p-8 text-ink sm:p-10">
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
      className="rounded-[28px] bg-white p-6 text-ink shadow-[0_30px_80px_-50px_rgba(16,35,61,0.35)] sm:p-8"
    >
      <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2">
        <Field label={t('firstname')} name="firstname" required error={errors.firstname} />
        <Field label={t('lastname')} name="lastname" required error={errors.lastname} />
        <Field label={t('company')} name="company" required error={errors.company} />
        <Field label={t('phone')} name="phone" type="tel" required error={errors.phone} />
        <Field label={t('email')} name="email" type="email" required error={errors.email} />
        <div>
          <label htmlFor="lang" className="mb-1.5 block text-[14px] font-semibold text-navy">
            {t('lang')}
          </label>
          <CustomSelect
            id="lang"
            name="lang"
            defaultValue={toContactLang(locale)}
            options={[
              { value: 'nl', label: 'Nederlands' },
              { value: 'en', label: 'English' },
              { value: 'de', label: 'Deutsch' },
              { value: 'fr', label: 'Français' },
            ]}
          />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[14px] font-semibold text-navy">{t('interest')}</span>
          <div key={preselect.join(',')} className="flex flex-wrap gap-2.5">
            {interestOptions.map((o) => (
              // Interest options as toggle chips: a visually hidden checkbox drives the pill.
              <label key={o.value} className="cursor-pointer">
                <input
                  type="checkbox"
                  name="interests"
                  value={o.value}
                  defaultChecked={preselect.includes(o.value)}
                  className="peer sr-only"
                />
                <span className="inline-flex items-center rounded-full border border-[var(--line)] bg-[#EEF1F6] px-4 py-2 text-[15px] text-ink transition-colors hover:border-navy/30 peer-checked:border-navy peer-checked:bg-navy peer-checked:text-white peer-focus-visible:ring-4 peer-focus-visible:ring-navy/15">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="message" className="mb-1.5 block text-[14px] font-semibold text-navy">
            {t('message')} <span className="text-red">*</span>
          </label>
          <textarea
            key={prefillMessage ? 'prefilled' : 'empty'}
            id="message"
            name="message"
            rows={prefillMessage ? 6 : 3}
            defaultValue={prefillMessage}
            placeholder={t('messagePlaceholder')}
            className={fieldClass(!!errors.message)}
          />
          {errors.message && <FieldError msg={errors.message} />}
        </div>
      </div>

      {/* Honeypot — hidden from users, catches bots. */}
      <div className="hidden" aria-hidden>
        <label>
          Website
          <input type="text" name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex items-start gap-3 text-sm text-ink-soft sm:max-w-[60%]">
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
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn btn-onink min-h-[54px] w-full shrink-0 justify-center text-[16px] disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {status === 'submitting' ? t('sending') : t('send')}
        </button>
      </div>

      {status === 'error' && (
        <p className="mt-4 text-sm text-danger">{t('errGeneric')}</p>
      )}
      {status === 'rateLimited' && (
        <p role="alert" aria-live="assertive" className="mt-4 text-sm text-danger">
          {t('errRateLimit', { email: CONTACT_EMAIL })}
        </p>
      )}

      <Turnstile onToken={setCaptchaToken} />
    </form>
  );
}

/** Correspondence language: the site locale when supported, else English. */
function toContactLang(v: string): (typeof CONTACT_LANGS)[number] {
  return (CONTACT_LANGS as readonly string[]).includes(v) ? (v as (typeof CONTACT_LANGS)[number]) : 'en';
}

function fieldClass(hasError: boolean) {
  return [
    'w-full rounded-2xl border bg-[#EEF1F6] px-4 py-3 text-[16px] text-ink outline-none transition',
    'placeholder:text-ink-soft/70 focus:bg-white focus:ring-4 focus:ring-navy/10',
    hasError ? 'border-red' : 'border-transparent focus:border-navy/40',
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
      <label htmlFor={name} className="mb-1.5 block text-[14px] font-semibold text-navy">
        {label} {required && <span className="text-red">*</span>}
      </label>
      <input id={name} name={name} type={type} className={fieldClass(!!error)} />
      {error && <FieldError msg={error} />}
    </div>
  );
}
