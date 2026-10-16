import { loadStripe, type Stripe } from '@stripe/stripe-js';

/**
 * Browser Stripe.js loader (singleton). Reads the publishable key
 * (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, inlined at build time). Safe to import in
 * client components. Resolves to null if the key is not configured.
 */
let _promise: Promise<Stripe | null> | null = null;

export function getStripeClient(): Promise<Stripe | null> {
  if (!_promise) {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    _promise = key ? loadStripe(key) : Promise.resolve(null);
  }
  return _promise;
}
