import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { auditLabel, auditColor } from '@/lib/audit/display';

/** Strip comments so prose mentioning forbidden things doesn't cause false positives. */
function strip(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const sync = strip(readFileSync(join(process.cwd(), 'src/modules/subscriptions/sync.ts'), 'utf8'));
const webhook = strip(readFileSync(join(process.cwd(), 'src/app/api/stripe/webhook/route.ts'), 'utf8'));
const env = strip(readFileSync(join(process.cwd(), 'src/lib/env.ts'), 'utf8'));

describe('P12C audit display — webhook events', () => {
  it('labels + colours the four webhook events', () => {
    expect(auditLabel('subscription.webhook_synced')).toBe('Synced from webhook');
    expect(auditLabel('subscription.created_from_webhook')).toBe('Created from webhook');
    expect(auditLabel('subscription.cancelled_from_webhook')).toBe('Cancelled from webhook');
    expect(auditLabel('subscription.webhook_sync_failed')).toBe('Webhook sync failed');
    expect(auditColor('subscription.webhook_synced')).toBe('done');
    expect(auditColor('subscription.created_from_webhook')).toBe('done');
    expect(auditColor('subscription.cancelled_from_webhook')).toBe('warning');
    expect(auditColor('subscription.webhook_sync_failed')).toBe('revoked');
  });
});

describe('P12C env flag', () => {
  it('enableSubscriptionWebhookSync reads ENABLE_SUBSCRIPTION_WEBHOOK_SYNC, default off', () => {
    expect(env).toContain('enableSubscriptionWebhookSync');
    expect(env).toMatch(/ENABLE_SUBSCRIPTION_WEBHOOK_SYNC === 'true'/);
  });
});

describe('P12C reconcile helper (source check)', () => {
  it('is server-only, maps the EVENT object (no Stripe API call) and never mutates Stripe', () => {
    expect(sync).toContain("import 'server-only'");
    expect(sync).toContain('reconcileRegistryFromStripeSubscription');
    expect(sync).toContain('snapshotFromStripe(sub)');
    // the reconcile path must NOT call the Stripe API (retrieve) or Stripe writes
    const i = sync.indexOf('export async function reconcileRegistryFromStripeSubscription');
    const body = sync.slice(i);
    expect(body).not.toContain('retrieveSubscriptionSnapshot');
    expect(body).not.toContain('getStripe');
    expect(body).not.toMatch(/\.subscriptions\.(update|cancel|retrieve)\(/);
  });
  it('writes ONLY customer_subscriptions; reads customers for the bridge; no legacy/P10/P11 writes', () => {
    // legacy/P10/P11 tables are never WRITTEN (customers is read-only for the bridge)
    expect(sync).not.toMatch(/\.from\('subscriptions'\)/);
    expect(sync).not.toMatch(/\.from\('orders'\)/);
    expect(sync).not.toMatch(/\.from\('payments'\)/);
    expect(sync).not.toMatch(/\.from\('payment_links'\)/);
    expect(sync).not.toMatch(/\.from\('invoice_payments'\)/);
    expect(sync).not.toMatch(/\.from\('invoice_payment_links'\)/);
    expect(sync).not.toMatch(/\.from\('stripe_events'\)/);
    expect(sync).not.toMatch(/\.from\('customers'\)\.(update|insert|upsert|delete)/); // customers READ only
    expect(sync).toContain("from('customer_subscriptions')");
  });
  it('the UPDATE patch carries only snapshot+sync fields (CRM links / notes / archive preserved)', () => {
    const i = sync.indexOf('function snapshotColumns');
    const cols = sync.slice(i, sync.indexOf('}', sync.indexOf('return {', i)) + 1);
    for (const re of [/\bcompany_id:/, /\bcontact_id:/, /\bcustomer_id:/, /\bnotes:/, /\binternal_notes:/, /\barchived_at:/, /\bcreated_by:/]) {
      expect(cols).not.toMatch(re); // none of these are in snapshotColumns → preserved on update
    }
  });
  it('audits with source=webhook / actorType=system / no user actor; unknown sub → create + bridge link', () => {
    expect(sync).toMatch(/actorType:\s*'system'/);
    expect(sync).toMatch(/source:\s*'webhook'/);
    expect(sync).toContain('subscription.created_from_webhook');
    expect(sync).toContain('subscription.cancelled_from_webhook');
    expect(sync).toContain('suggestCompanyViaCustomersBridge');
    expect(sync).toContain('rows.length !== 1'); // only auto-link on a single reliable match
  });
});

describe('P12C webhook integration (source check)', () => {
  it('the registry branch is flag-gated, runs AFTER the legacy handler, and is isolated', () => {
    expect(webhook).toContain('reconcileRegistryFromStripeSubscription');
    // reconcile call comes AFTER the legacy handleSubscriptionEvent call in the subscription case
    const legacyIdx = webhook.indexOf('await handleSubscriptionEvent(event.data.object, supabase);');
    const reconcileIdx = webhook.indexOf('await reconcileSubscriptionRegistry(event, supabase);');
    expect(legacyIdx).toBeGreaterThan(-1);
    expect(reconcileIdx).toBeGreaterThan(legacyIdx);
    // flag gate + own try/catch in the branch
    const i = webhook.indexOf('async function reconcileSubscriptionRegistry');
    const body = webhook.slice(i, i + 1200);
    expect(body).toContain('if (!env.enableSubscriptionWebhookSync) return');
    expect(body).toContain('try {');
    expect(body).toContain('catch');
  });
  it('dedups via stripe_events (insert + 23505 skip) and does not call Stripe in the branch', () => {
    expect(webhook).toContain("from('stripe_events')");
    expect(webhook).toMatch(/code === '23505'/);
    const i = webhook.indexOf('async function reconcileSubscriptionRegistry');
    const body = webhook.slice(i, i + 1200);
    expect(body).not.toContain('getStripe');
    expect(body).not.toMatch(/stripe\.subscriptions\./);
  });
  it('preserves existing webhook behavior (verification, P11 guard, legacy mirror upsert, response)', () => {
    expect(webhook).toContain('stripe.webhooks.constructEvent');
    expect(webhook).toMatch(/kind === 'invoice_payment'/); // P11 guard untouched
    expect(webhook).toMatch(/from\('subscriptions'\)\s*\.upsert/m); // legacy mirror upsert present
    expect(webhook).toContain('{ received: true }');
  });
});
