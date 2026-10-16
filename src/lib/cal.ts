/**
 * cal.com booking config for the "book a strategy call" buttons.
 *
 * NEXT_PUBLIC_CAL_LINK is the part after "cal.com/" (for example
 * "semanu/kennismaking"). Empty = the buttons link to the contact page instead.
 */
export const CAL_LINK = (process.env.NEXT_PUBLIC_CAL_LINK ?? '').trim();

/** Embed namespace (groups the popup config; any stable string works). */
export const CAL_NAMESPACE = 'strategy-call';
