'use client';

import { useEffect, useRef, useState } from 'react';
import { useLocale } from 'next-intl';

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '';
const SCRIPT_ID = 'cf-turnstile-script';
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type TurnstileApi = {
  render: (
    el: HTMLElement,
    opts: {
      sitekey: string;
      appearance?: 'always' | 'execute' | 'interaction-only';
      theme?: 'light' | 'dark' | 'auto';
      language?: string;
      callback: (token: string) => void;
      'expired-callback'?: () => void;
      'error-callback'?: () => void;
    },
  ) => string;
  remove: (id: string) => void;
};
declare global {
  // eslint-disable-next-line no-var
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Cloudflare Turnstile, invisible by default. With `interaction-only` the
 * Cloudflare UI only appears if a human check is actually required; otherwise it
 * verifies in the background. While verifying we show a small semanu styled spinner
 * (instead of the Cloudflare badge), which disappears once a token arrives or on
 * error. Renders nothing when no site key is configured, and a render failure
 * (e.g. a misconfigured sitekey) fails safe and never crashes the host page — the
 * server side `verifyTurnstile` is fail-safe in that case.
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onToken);
  cb.current = onToken;
  const locale = useLocale();
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) {
      setVerifying(false);
      return;
    }
    let id: string | null = null;
    let poll: ReturnType<typeof setInterval> | null = null;
    const stopPoll = () => {
      if (poll) {
        clearInterval(poll);
        poll = null;
      }
    };

    const render = () => {
      if (id || !ref.current || !window.turnstile) return;
      try {
        id = window.turnstile.render(ref.current, {
          sitekey: SITE_KEY,
          appearance: 'interaction-only',
          // Match the page: light theme (the form card is white) and the active
          // locale, so the widget never shows in the wrong language when it does
          // appear. The box itself stays Cloudflare-styled (locked iframe).
          theme: 'light',
          language: localeRef.current,
          callback: (t) => {
            cb.current(t);
            setVerifying(false);
          },
          'expired-callback': () => {
            cb.current('');
            setVerifying(true);
          },
          'error-callback': () => {
            cb.current('');
            setVerifying(false);
          },
        });
        stopPoll();
      } catch {
        // Misconfigured/invalid sitekey: fail safe, never crash the host page.
        setVerifying(false);
        stopPoll();
      }
    };

    if (window.turnstile) {
      render();
    } else {
      if (!document.getElementById(SCRIPT_ID)) {
        const s = document.createElement('script');
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        document.head.appendChild(s);
      }
      poll = setInterval(render, 150);
    }

    return () => {
      stopPoll();
      if (id && window.turnstile?.remove) {
        try {
          window.turnstile.remove(id);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, []);

  if (!SITE_KEY) return null;
  return (
    <div className="mt-4">
      {/* Cloudflare renders here only if an interactive challenge is needed. */}
      <div ref={ref} />
      {verifying ? (
        <span
          role="status"
          aria-hidden
          className="inline-flex h-5 w-5 animate-spin rounded-full border-2 border-red/25 border-t-red align-middle"
        />
      ) : null}
    </div>
  );
}
