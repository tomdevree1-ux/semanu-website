'use client';

import type { ComponentProps } from 'react';
import { Link } from '@/i18n/navigation';
import { track, type AnalyticsParams } from '@/lib/analytics';

type Props = ComponentProps<typeof Link> & {
  /** GA4 event name fired on click. */
  event: string;
  eventParams?: AnalyticsParams;
};

/**
 * Locale-aware Link that fires a GA4 event on click. Tracking is consent-gated
 * inside track() (a no-op when analytics cookies are not accepted). Never pass
 * personal data in eventParams.
 */
export function TrackedLink({ event, eventParams, onClick, ...props }: Props) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        track(event, eventParams);
        onClick?.(e);
      }}
    />
  );
}
