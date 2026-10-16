'use client';

/**
 * First-party, last-touch attribution read from the current URL at submit time.
 * No cookie, no cross-session storage — same posture as the funnel submissions
 * (record the campaign that drove the form the user chose to submit). First-touch
 * persistence + true multi-touch is a deliberate Fase 2 enhancement.
 */
export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  gclid?: string;
  referrer?: string;
  pagePath?: string;
};

export function readAttribution(): Attribution {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const g = (k: string) => p.get(k) || undefined;
  return {
    utmSource: g('utm_source'),
    utmMedium: g('utm_medium'),
    utmCampaign: g('utm_campaign'),
    utmTerm: g('utm_term'),
    utmContent: g('utm_content'),
    gclid: g('gclid'),
    referrer: (typeof document !== 'undefined' && document.referrer) || undefined,
    pagePath: window.location.pathname || undefined,
  };
}
