'use client';

import { useEffect } from 'react';
import { getCalApi } from '@calcom/embed-react';
import { CAL_LINK, CAL_NAMESPACE } from '@/lib/cal';
import { Link } from '@/i18n/navigation';

/**
 * Opens the cal.com booking popup (in a modal on the site) for the strategy call.
 * Drop-in replacement for the "book a strategy call" CTAs: pass the same `btn …`
 * className and the label as children. Without a configured cal.com link it
 * falls back to a plain link to the contact page.
 */
export function BookCallButton({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!CAL_LINK) return;
    (async () => {
      const cal = await getCalApi({ namespace: CAL_NAMESPACE });
      // House palette (Marine + Mint) mapped onto Cal's embed colour tokens.
      // Cal's embed only exposes colours (not fonts/layout); we force light.
      // Navy carries the primary buttons / selected day (white text needs the
      // dark tone); mint comes in as the hover/selected background tint.
      cal('ui', {
        theme: 'light',
        cssVarsPerTheme: {
          light: {
            'cal-brand': '#1B2A4A', // navy: primary buttons + selected day
            'cal-text-emphasis': '#07221F', // ink: headings / strong text
            'cal-text': '#2C4641', // ink-soft: body text
            'cal-text-muted': '#6E807B', // muted labels
            'cal-border-booker': '#E2E8F2', // calendar grid lines
            'cal-border': '#E2E8F2',
            'cal-border-subtle': '#EEF1F6',
            'cal-border-emphasis': '#C9D4E2',
            'cal-bg-emphasis': '#E8F5EF', // mint tint: hover / selected backgrounds
          },
          dark: { 'cal-brand': '#93E6BE' },
        },
        hideEventTypeDetails: false,
        layout: 'month_view',
      });
    })();
  }, []);

  if (!CAL_LINK) {
    return (
      <Link href="/kontakt" className={className}>
        {children}
      </Link>
    );
  }
  return (
    <button
      type="button"
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_LINK}
      data-cal-config='{"layout":"month_view"}'
      className={className}
    >
      {children}
    </button>
  );
}
