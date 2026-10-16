import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { subscriptionStatusToken } from '@/lib/status/colors';
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TERMINAL_STATUSES,
  SUBSCRIPTION_MUTABLE_STATUSES,
  isKnownSubscriptionStatus,
} from './status';
import { confirmMatches, subscriptionIsArchived, subscriptionLinkIsArchivable } from './guards';
import { linkSubscriptionSchema, syncForCustomerSchema, subscriptionNotesSchema } from './schema';

const actionsSrc = readFileSync(join(process.cwd(), 'src/modules/subscriptions/actions.ts'), 'utf8');
const stripeSrc = readFileSync(join(process.cwd(), 'src/modules/subscriptions/stripe.ts'), 'utf8');
const queriesSrc = readFileSync(join(process.cwd(), 'src/modules/subscriptions/queries.ts'), 'utf8');

describe('subscriptionStatusToken mapping (P12A)', () => {
  it('maps Stripe statuses to tokens; unknown → warning', () => {
    expect(subscriptionStatusToken('active')).toBe('done');
    expect(subscriptionStatusToken('trialing')).toBe('waiting');
    expect(subscriptionStatusToken('paused')).toBe('waiting');
    expect(subscriptionStatusToken('incomplete')).toBe('warning');
    expect(subscriptionStatusToken('past_due')).toBe('warning');
    expect(subscriptionStatusToken('unpaid')).toBe('warning');
    expect(subscriptionStatusToken('incomplete_expired')).toBe('cancelled');
    expect(subscriptionStatusToken('canceled')).toBe('cancelled');
    expect(subscriptionStatusToken('archived')).toBe('cancelled');
    expect(subscriptionStatusToken('something_new')).toBe('warning');
  });
  it('status helpers', () => {
    expect(isKnownSubscriptionStatus('active')).toBe(true);
    expect(isKnownSubscriptionStatus('nope')).toBe(false);
    expect(SUBSCRIPTION_STATUSES).toContain('trialing');
    expect(SUBSCRIPTION_TERMINAL_STATUSES.has('canceled')).toBe(true);
    expect(SUBSCRIPTION_MUTABLE_STATUSES.has('active')).toBe(true);
    expect(SUBSCRIPTION_MUTABLE_STATUSES.has('canceled')).toBe(false);
  });
});

describe('schema + guards', () => {
  it('link requires a sub_ id; optional company uuid/customer id', () => {
    expect(linkSubscriptionSchema.safeParse({ stripeSubscriptionId: 'sub_123ABC' }).success).toBe(true);
    expect(linkSubscriptionSchema.safeParse({ stripeSubscriptionId: 'nope' }).success).toBe(false);
    expect(linkSubscriptionSchema.safeParse({ stripeSubscriptionId: 'sub_1', companyId: 'not-a-uuid' }).success).toBe(false);
    expect(linkSubscriptionSchema.safeParse({ stripeSubscriptionId: 'sub_1', stripeCustomerId: 'cus_9' }).success).toBe(true);
    expect(linkSubscriptionSchema.safeParse({ stripeSubscriptionId: 'sub_1', stripeCustomerId: 'bad' }).success).toBe(false);
  });
  it('customer-sync requires a cus_ id; notes optional', () => {
    expect(syncForCustomerSchema.safeParse({ stripeCustomerId: 'cus_42' }).success).toBe(true);
    expect(syncForCustomerSchema.safeParse({ stripeCustomerId: 'sub_42' }).success).toBe(false);
    expect(subscriptionNotesSchema.safeParse({ notes: 'hi' }).success).toBe(true);
  });
  it('archive/confirm guards', () => {
    expect(confirmMatches('  SUB_abc ', 'sub_abc')).toBe(true);
    expect(subscriptionIsArchived('2026-01-01')).toBe(true);
    expect(subscriptionIsArchived(null)).toBe(false);
    expect(subscriptionLinkIsArchivable(null)).toBe(true); // not archived → can archive
    expect(subscriptionLinkIsArchivable('2026-01-01')).toBe(false); // already archived
  });
});

describe('actions: P12A security invariants (source check)', () => {
  it('is a server module and gates each action by the exact permission', () => {
    expect(actionsSrc).toContain("'use server'");
    expect(actionsSrc).toMatch(/linkExistingStripeSubscription[\s\S]*?hasPermission\('subscriptions\.link'\)/);
    expect(actionsSrc).toMatch(/syncSubscriptionFromStripe[\s\S]*?hasPermission\('subscriptions\.sync'\)/);
    expect(actionsSrc).toMatch(/syncSubscriptionsForCustomer[\s\S]*?hasPermission\('subscriptions\.sync'\)/);
    expect(actionsSrc).toMatch(/updateSubscriptionNotes[\s\S]*?hasPermission\('subscriptions\.link'\)/);
    expect(actionsSrc).toMatch(/updateSubscriptionCrmLinks[\s\S]*?hasPermission\('subscriptions\.link'\)/);
    expect(actionsSrc).toMatch(/archiveSubscriptionLink[\s\S]*?hasPermission\('subscriptions\.archive'\)/);
    expect(actionsSrc).toMatch(/restoreSubscriptionLink[\s\S]*?hasPermission\('subscriptions\.archive'\)/);
  });
  it('performs NO Stripe subscription mutations anywhere in the module', () => {
    for (const src of [actionsSrc, stripeSrc, queriesSrc]) {
      expect(src).not.toMatch(/subscriptions\.update\(/);
      expect(src).not.toMatch(/subscriptions\.cancel\(/);
      expect(src).not.toMatch(/subscriptions\.resume\(/);
      expect(src).not.toMatch(/subscriptions\.del\(/);
      expect(src).not.toMatch(/pause_collection/);
      expect(src).not.toMatch(/proration/);
      expect(src).not.toMatch(/checkout\.sessions\.create/);
      expect(src).not.toMatch(/\.refunds\./);
    }
  });
  it('never mutates legacy billing tables or the legacy subscriptions mirror', () => {
    // the legacy `subscriptions` mirror must never be touched by this module
    expect(actionsSrc).not.toMatch(/\.from\('subscriptions'\)/);
    expect(queriesSrc).not.toMatch(/\.from\('subscriptions'\)/);
    // no writes to customers/orders/payments/payment_links/stripe_events (customers is read-only)
    for (const src of [actionsSrc, queriesSrc]) {
      expect(src).not.toMatch(/\.from\('customers'\)\.(update|insert|upsert|delete)/);
      expect(src).not.toMatch(/\.from\('orders'\)/);
      expect(src).not.toMatch(/\.from\('payments'\)/);
      expect(src).not.toMatch(/\.from\('payment_links'\)/);
      expect(src).not.toMatch(/\.from\('stripe_events'\)/);
      expect(src).not.toMatch(/\.from\('invoice_payments'\)/);
    }
    expect(actionsSrc).not.toContain('/api/checkout');
  });
  it('never hard-deletes; restore clears archive without overwriting the Stripe status', () => {
    expect(actionsSrc).not.toMatch(/\.delete\(/);
    const i = actionsSrc.indexOf('restoreSubscriptionLink');
    const restoreBody = actionsSrc.slice(i, i + 1100);
    expect(restoreBody).toContain('archived_at: null');
    expect(restoreBody).not.toMatch(/status:\s*'/); // restore must not set a status
  });
  it('the Stripe snapshot writer never carries CRM links / notes (so sync preserves them)', () => {
    const i = actionsSrc.indexOf('function snapshotColumns');
    const body = actionsSrc.slice(i, actionsSrc.indexOf('// ── link', i)); // bound to just this function
    // word boundaries so the allowed `stripe_customer_id` is not a false positive for `customer_id`
    for (const re of [/\bcompany_id:/, /\bcontact_id:/, /\bcustomer_id:/, /\bnotes:/, /\binternal_notes:/, /\barchived_at:/]) {
      expect(body).not.toMatch(re);
    }
  });
  it('no secrets and no money/url in ordinary audit metadata', () => {
    expect(actionsSrc).not.toMatch(/STRIPE_SECRET|sk_(live|test)/);
    const metas = actionsSrc.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m).not.toMatch(/\b(amount|unit_amount|url|balance)\b/);
      expect(m).not.toMatch(/sk_(live|test)/);
    }
  });
});

describe('stripe helper: server-only read/list only (source check)', () => {
  it('is server-only, reads via getStripe, and only retrieves/lists', () => {
    expect(stripeSrc).toContain("import 'server-only'");
    expect(stripeSrc).toContain('getStripe');
    expect(stripeSrc).toMatch(/subscriptions\.retrieve\(/);
    expect(stripeSrc).toMatch(/subscriptions\.list\(/);
    expect(stripeSrc).not.toMatch(/STRIPE_SECRET|sk_(live|test)/);
  });
});
