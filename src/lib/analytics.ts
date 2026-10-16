'use client';

/**
 * Tiny GA4 event helper. Fires an event only when gtag is present (i.e. the
 * visitor accepted analytics cookies and Analytics.tsx loaded GA).
 *
 * PRIVACY: never pass personal data here. Allowed params are non-identifying
 * facts about the interaction (e.g. the selected plan). Do NOT pass names,
 * emails, phone numbers, addresses, company identifiers or message contents.
 */
export type AnalyticsParams = Record<string, string | number | boolean>;

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

export function track(event: string, params: AnalyticsParams = {}): void {
  if (typeof window === 'undefined') return;
  const gtag = (window as GtagWindow).gtag;
  if (typeof gtag !== 'function') return;
  gtag('event', event, params);
}
