import Stripe from 'stripe';
import { env } from '@/lib/env';

/**
 * Lazily-instantiated server-side Stripe client. SERVER ONLY — uses the secret
 * key, never import this from a client component.
 *
 * We pin no explicit `apiVersion` so the value bundled with the installed SDK
 * is used; upgrading the `stripe` package upgrades the pinned version together
 * with its types, which avoids type/runtime drift.
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(env.stripeSecretKey, {
      appInfo: { name: 'amai.ch', url: 'https://amai.ch' },
      typescript: true,
    });
  }
  return _stripe;
}
