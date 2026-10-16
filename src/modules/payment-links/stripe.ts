import 'server-only';
import { getStripe } from '@/lib/stripe/server';
import { env } from '@/lib/env';

/**
 * SERVER ONLY Stripe call for P11. Creates a Checkout Session in `mode:'payment'`
 * with an ad-hoc `price_data` line item for the invoice's balance_due (P11-D3). The
 * secret key never leaves the server. Metadata carries `kind:'invoice_payment'` so the
 * webhook guard routes it away from the legacy order/email logic. Idempotency key = the
 * local payment-link row id (P11) so a retried action never creates two sessions.
 */
export type CreatedCheckout = {
  sessionId: string;
  url: string;
  paymentIntentId: string | null;
  expiresAt: string | null;
};

export async function createInvoiceCheckoutSession(params: {
  linkId: string;
  invoiceId: string;
  invoiceNumber: string;
  companyId: string;
  amount: number;
  currency: string;
}): Promise<CreatedCheckout> {
  const stripe = getStripe();
  const cents = Math.round(params.amount * 100);
  const base = env.siteUrl;

  const session = await stripe.checkout.sessions.create(
    {
      mode: 'payment',
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: params.currency.toLowerCase(),
            unit_amount: cents,
            product_data: { name: `Invoice ${params.invoiceNumber}` },
          },
        },
      ],
      success_url: `${base}/de/payment?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/de/payment?status=cancelled`,
      metadata: {
        kind: 'invoice_payment',
        invoice_id: params.invoiceId,
        invoice_payment_link_id: params.linkId,
        invoice_number: params.invoiceNumber,
        company_id: params.companyId,
        env: process.env.NODE_ENV ?? 'unknown',
      },
    },
    { idempotencyKey: params.linkId },
  );

  if (!session.url) throw new Error('Stripe returned no checkout URL');
  const paymentIntentId =
    typeof session.payment_intent === 'string' ? session.payment_intent : session.payment_intent?.id ?? null;
  const expiresAt = session.expires_at ? new Date(session.expires_at * 1000).toISOString() : null;
  return { sessionId: session.id, url: session.url, paymentIntentId, expiresAt };
}
