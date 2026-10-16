/**
 * cal.com booking config for the "book a strategy call" buttons.
 *
 * CAL_LINK is your cal.com event link: the part after "cal.com/", for example
 * "amai/strategiegespraech" or "tom-de-vree/30min". Set the real value here, or
 * override it with NEXT_PUBLIC_CAL_LINK in the environment (e.g. on Vercel).
 */
export const CAL_LINK = process.env.NEXT_PUBLIC_CAL_LINK ?? 'hello-amai/strategy-call';

/** Embed namespace (groups the popup config; any stable string works). */
export const CAL_NAMESPACE = 'strategy-call';
