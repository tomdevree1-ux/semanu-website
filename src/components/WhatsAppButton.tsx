'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { whatsappHref } from '@/lib/contact';

// "Chat via WhatsApp" reads the same in de/fr/en, so the visible label is shared.
// The aria-label is localized for screen readers (WhatsApp stays a brand name).
const LABEL = 'Chat via WhatsApp';
const ARIA: Record<string, string> = {
  de: 'Auf WhatsApp mit amai! chatten',
  fr: 'Discuter avec amai! sur WhatsApp',
  en: 'Chat with amai! on WhatsApp',
};

function Glyph({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.885-9.885 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.892c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652a12.062 12.062 0 005.71 1.447h.006c6.585 0 11.946-5.335 11.949-11.893a11.821 11.821 0 00-3.495-8.411z" />
    </svg>
  );
}

/**
 * Floating WhatsApp button, fixed bottom-right on every page. Brand navy, in
 * house style. Shows as a "Chat via WhatsApp" pill; a click opens the chat
 * (wa.me, no pre-filled message), then the pill slides down and collapses to a
 * compact round icon that stays reachable. Sits below the cookie banner
 * (z-50 < z-60) so it never covers the consent CTA. Reduced motion + print safe.
 */
export function WhatsAppButton() {
  const locale = useLocale();
  const aria = ARIA[locale] ?? ARIA.de;
  const href = whatsappHref();
  const [collapsed, setCollapsed] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // On click the chat opens (the anchor navigates in a new tab); at the same
  // time the pill slides down and, once the animation ends, becomes the icon.
  const collapseAfterClick = () => {
    setLeaving(true);
    window.setTimeout(() => {
      setCollapsed(true);
      setLeaving(false);
    }, 300);
  };

  if (collapsed) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={aria}
        title={LABEL}
        className="fixed bottom-4 right-4 z-[50] flex h-7 w-7 items-center justify-center rounded-full bg-navy text-white shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-transform duration-200 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none print:hidden"
      >
        <Glyph size={14} />
      </a>
    );
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={aria}
      onClick={collapseAfterClick}
      className={`fixed bottom-4 right-4 z-[50] flex items-center gap-1.5 rounded-pill bg-navy py-1 pl-1 pr-3 text-white shadow-[0_6px_24px_rgba(0,0,0,0.28)] transition-all duration-300 ease-out hover:scale-[1.03] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint motion-reduce:transition-none print:hidden ${
        leaving ? 'translate-y-28 opacity-0' : 'translate-y-0 opacity-100'
      }`}
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-navy">
        <Glyph size={13} />
      </span>
      <span className="text-xs font-semibold">{LABEL}</span>
    </a>
  );
}
