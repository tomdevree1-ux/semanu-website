'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

// Cookieless visitor count for the SEMANU OPS dashboard (Statistiek, November 2026).
// One beacon per page view to the record-visit edge function, which hashes
// IP + browser with a daily salt and stores no raw IP and no cookie. Only the live
// build sets NEXT_PUBLIC_VISIT_URL (deploy/build-live.env); staging counts nothing.
// Skipped for the owner (?notrack=1, same flag as Analytics) and with Global Privacy Control.
const VISIT_URL = (process.env.NEXT_PUBLIC_VISIT_URL ?? '').trim();
const NOTRACK_KEY = 'semanu-notrack';

function optedOut(): boolean {
  try {
    if (localStorage.getItem(NOTRACK_KEY) === '1') return true;
  } catch {
    /* storage blocked: count normally */
  }
  return (navigator as Navigator & { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

export function VisitBeacon() {
  const pathname = usePathname();
  useEffect(() => {
    if (!VISIT_URL || !pathname || optedOut()) return;
    const ref = document.referrer && !document.referrer.startsWith(location.origin) ? document.referrer : '';
    const body = JSON.stringify({ path: pathname, referer: ref });
    try {
      if (!navigator.sendBeacon?.(VISIT_URL, new Blob([body], { type: 'text/plain' }))) {
        void fetch(VISIT_URL, { method: 'POST', body, keepalive: true, headers: { 'Content-Type': 'text/plain' } });
      }
    } catch {
      /* statistics must never break the page */
    }
  }, [pathname]);
  return null;
}
