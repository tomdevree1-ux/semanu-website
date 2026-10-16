'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

// Both ids come from the environment only; empty = no Google tags at all.
const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? '').trim();
const ADS_ID = (process.env.NEXT_PUBLIC_GOOGLE_ADS_ID ?? '').trim();
const COOKIE_NAME = 'semanu_cc';
// Owner opt-out flag. Visiting ?notrack=1 stores it so GA never loads in this
// browser (across every network); ?notrack=0 clears it. Purely client-side
// analytics suppression for the owner. No SEO or GEO impact: crawlers never set
// the flag, so they always get the normal page, and the markup is unchanged.
const NOTRACK_KEY = 'semanu-notrack';

type GtagWindow = Window & { gtag?: (...args: unknown[]) => void };

function readConsent(): 'all' | 'analytics' | 'necessary' | null {
  if (typeof document === 'undefined') return null;
  const row = document.cookie.split('; ').find((r) => r.startsWith(`${COOKIE_NAME}=`));
  const v = row ? row.split('=')[1] : null;
  return v === 'all' || v === 'analytics' || v === 'necessary' ? v : null;
}
// analytics_storage granted for "analytics" + "all"; the ad signals only for "all".
function consentPayload(choice: string) {
  const analytics = choice === 'all' || choice === 'analytics' ? 'granted' : 'denied';
  const ads = choice === 'all' ? 'granted' : 'denied';
  return { analytics_storage: analytics, ad_storage: ads, ad_user_data: ads, ad_personalization: ads };
}

/**
 * Google Analytics 4 + Google Ads, with Google Consent Mode v2.
 *
 * - gtag loads for every visitor, but consent DEFAULTS TO DENIED, so no
 *   analytics or ad cookies are written and pings stay cookieless until the
 *   visitor accepts. Google can still model conversions for people who decline.
 * - On "Accept all" (cookie `semanu_cc=all`, or the `semanu-consent` event the
 *   banner dispatches) we grant analytics_storage AND the ad signals
 *   (ad_storage, ad_user_data, ad_personalization). "Only necessary" leaves
 *   everything denied.
 * - Google Ads (AW conversion tag) loads alongside GA4 from the same gtag.js,
 *   so conversion tracking respects the exact same consent gate.
 * - Page views: gtag('config') sends the first one (respecting the consent
 *   state set just before it); the effect sends one on each later SPA route
 *   change (App Router does not reload).
 * - Owner opt-out: GA is not loaded at all when the `semanu-notrack` localStorage
 *   flag is set (toggled via ?notrack=1 / ?notrack=0). The component starts in a
 *   non-tracking state and only mounts GA once the flag has been checked on the
 *   client, so an opted-out browser never loads gtag.
 */
export function Analytics() {
  const pathname = usePathname();
  const firstRender = useRef(true);
  // Undecided until the client checks the opt-out flag; GA is not rendered until
  // `track` becomes true, so an opted-out browser never loads it.
  const [track, setTrack] = useState(false);

  // Resolve the opt-out flag on the client and honour ?notrack=1 / ?notrack=0.
  useEffect(() => {
    const nt = new URLSearchParams(window.location.search).get('notrack');
    if (nt === '1') localStorage.setItem(NOTRACK_KEY, '1');
    else if (nt === '0') localStorage.removeItem(NOTRACK_KEY);
    setTrack(localStorage.getItem(NOTRACK_KEY) !== '1');
  }, []);

  // Apply a consent choice made after load, without a page reload.
  useEffect(() => {
    if (!GA_ID || !track) return;
    const stored = readConsent();
    if (stored && stored !== 'necessary') {
      (window as GtagWindow).gtag?.('consent', 'update', consentPayload(stored));
    }
    function onConsent(e: Event) {
      (window as GtagWindow).gtag?.('consent', 'update', consentPayload(String((e as CustomEvent).detail)));
    }
    window.addEventListener('semanu-consent', onConsent as EventListener);
    return () => window.removeEventListener('semanu-consent', onConsent as EventListener);
  }, [track]);

  // SPA page_view on route change. Skip the first render — gtag('config')
  // already sent that one — to avoid double counting.
  useEffect(() => {
    if (!GA_ID || !track) return;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    (window as GtagWindow).gtag?.('event', 'page_view', { page_path: pathname });
  }, [pathname, track]);

  if (!GA_ID || !track) return null;

  return (
    <>
      {/* Consent defaults MUST be set before gtag.js runs. Denied for everyone;
          upgraded to granted right away for returning visitors who already
          accepted, so their first page_view is measured correctly. */}
      <Script id="ga-consent-default" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied'});
var m=document.cookie.split('; ').find(function(r){return r.indexOf('${COOKIE_NAME}=')===0;});
var c=m?m.split('=')[1]:'';
if(c==='all'){gtag('consent','update',{analytics_storage:'granted',ad_storage:'granted',ad_user_data:'granted',ad_personalization:'granted'});}
else if(c==='analytics'){gtag('consent','update',{analytics_storage:'granted'});}`}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="afterInteractive"
      />
      <Script id="ga4-init" strategy="afterInteractive">
        {`gtag('js', new Date());
gtag('config', '${GA_ID}');
${ADS_ID ? `gtag('config', '${ADS_ID}');` : ''}`}
      </Script>
    </>
  );
}
