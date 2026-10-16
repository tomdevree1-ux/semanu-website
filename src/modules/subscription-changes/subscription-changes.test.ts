import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { subscriptionChangeStatusToken } from '@/lib/status/colors';
import { CHANGE_STATUSES, actionNeedsPreview, PREVIEW_ACTIONS, P12B1_REACHABLE_STATUSES } from './status';
import { changeRequestIsCancellable, changeRequestIsArchivable, changeRequestIsArchived, confirmMatches } from './guards';
import { createChangeRequestSchema, changeRequestNotesSchema, CHANGE_ACTIONS } from './schema';

/** Strip comments so prose mentioning forbidden calls doesn't cause false positives. */
function strip(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const actions = strip(readFileSync(join(process.cwd(), 'src/modules/subscription-changes/actions.ts'), 'utf8'));
const stripe = strip(readFileSync(join(process.cwd(), 'src/modules/subscription-changes/stripe-mutations.ts'), 'utf8'));
const queries = strip(readFileSync(join(process.cwd(), 'src/modules/subscription-changes/queries.ts'), 'utf8'));

describe('subscriptionChangeStatusToken mapping (P12B1)', () => {
  it('maps each status to its token', () => {
    expect(subscriptionChangeStatusToken('draft')).toBe('draft');
    expect(subscriptionChangeStatusToken('previewed')).toBe('waiting');
    expect(subscriptionChangeStatusToken('approved')).toBe('waiting');
    expect(subscriptionChangeStatusToken('executing')).toBe('warning');
    expect(subscriptionChangeStatusToken('executed')).toBe('done');
    expect(subscriptionChangeStatusToken('failed')).toBe('warning');
    expect(subscriptionChangeStatusToken('cancelled')).toBe('cancelled');
    expect(subscriptionChangeStatusToken('archived')).toBe('cancelled');
  });
  it('status helpers', () => {
    expect(CHANGE_STATUSES).toContain('previewed');
    expect(actionNeedsPreview('change_plan')).toBe(true);
    expect(actionNeedsPreview('change_quantity')).toBe(true);
    expect(actionNeedsPreview('cancel_immediately')).toBe(false);
    expect(PREVIEW_ACTIONS.has('change_plan')).toBe(true);
    expect(P12B1_REACHABLE_STATUSES.has('executed')).toBe(false); // P12B2-reserved
    expect(P12B1_REACHABLE_STATUSES.has('previewed')).toBe(true);
  });
});

describe('schema + guards', () => {
  it('change_plan needs a plan or price; change_quantity needs a quantity', () => {
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: '11111111-1111-1111-1111-111111111111', actionType: 'change_plan' }).success).toBe(false);
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: '11111111-1111-1111-1111-111111111111', actionType: 'change_plan', targetPlanKey: 'business' }).success).toBe(true);
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: '11111111-1111-1111-1111-111111111111', actionType: 'change_quantity' }).success).toBe(false);
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: '11111111-1111-1111-1111-111111111111', actionType: 'change_quantity', targetQuantity: '3' }).success).toBe(true);
    // simple actions need only the subscription + action
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: '11111111-1111-1111-1111-111111111111', actionType: 'cancel_at_period_end' }).success).toBe(true);
    expect(createChangeRequestSchema.safeParse({ customerSubscriptionId: 'bad', actionType: 'cancel_at_period_end' }).success).toBe(false);
    expect(CHANGE_ACTIONS.length).toBe(7);
    expect(changeRequestNotesSchema.safeParse({ notes: 'hi' }).success).toBe(true);
  });
  it('guards', () => {
    expect(changeRequestIsCancellable('draft')).toBe(true);
    expect(changeRequestIsCancellable('previewed')).toBe(true);
    expect(changeRequestIsCancellable('cancelled')).toBe(false);
    expect(changeRequestIsArchivable('cancelled')).toBe(true);
    expect(changeRequestIsArchivable('failed')).toBe(true);
    expect(changeRequestIsArchivable('previewed')).toBe(true);
    expect(changeRequestIsArchivable('draft')).toBe(false);
    expect(changeRequestIsArchived('2026-01-01')).toBe(true);
    expect(confirmMatches('  SUB_x ', 'sub_x')).toBe(true);
  });
});

describe('actions: P12B1 security invariants (source check)', () => {
  it('is a server module and gates each action by the exact permission', () => {
    expect(actions).toContain("'use server'");
    expect(actions).toMatch(/createSubscriptionChangeRequest[\s\S]*?hasPermission\('subscriptions\.request_change'\)/);
    expect(actions).toMatch(/previewSubscriptionChange[\s\S]*?hasPermission\('subscriptions\.preview_change'\)/);
    expect(actions).toMatch(/cancelSubscriptionChangeRequest[\s\S]*?hasPermission\('subscriptions\.request_change'\)/);
    expect(actions).toMatch(/archiveSubscriptionChangeRequest[\s\S]*?hasPermission\('subscriptions\.archive'\)/);
    expect(actions).toMatch(/restoreSubscriptionChangeRequest[\s\S]*?hasPermission\('subscriptions\.archive'\)/);
    expect(actions).toMatch(/updateChangeRequestNotes[\s\S]*?hasPermission\('subscriptions\.request_change'\)/);
  });
  it('performs NO Stripe subscription mutation anywhere in the module', () => {
    for (const src of [actions, stripe, queries]) {
      expect(src).not.toMatch(/\.subscriptions\.update\(/);
      expect(src).not.toMatch(/\.subscriptions\.cancel\(/);
      expect(src).not.toMatch(/\.subscriptions\.resume\(/);
      expect(src).not.toMatch(/pause_collection\s*:/);
      expect(src).not.toMatch(/checkout\.sessions\.create/);
      expect(src).not.toMatch(/\.refunds\./);
    }
  });
  it('execution (P12B2) delegates to the flag-gated core (detailed checks in execution.test.ts)', () => {
    expect(actions).toMatch(/export async function executeSubscriptionChange/);
    expect(actions).toContain('performExecution');
    expect(actions).toContain('env.stripeSubscriptionMutationsEnabled'); // hard flag gate
  });
  it('actions.ts never calls Stripe directly (only the preview helper does)', () => {
    expect(actions).not.toContain('getStripe');
  });
  it('never writes legacy billing tables / checkout; never hard-deletes', () => {
    for (const src of [actions, queries]) {
      for (const t of ['subscriptions', 'customers', 'orders', 'payments', 'payment_links', 'stripe_events', 'invoice_payments', 'invoice_payment_links']) {
        expect(src).not.toContain(`.from('${t}')`);
      }
      expect(src).not.toContain('/api/checkout');
      expect(src).not.toMatch(/\.delete\(/);
    }
  });
  it('no raw amounts/proration payloads in ordinary audit metadata', () => {
    const metas = actions.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m).not.toMatch(/\b(amount|amount_due|total|subtotal|proration|preview_payload|safe_summary)\b/);
    }
  });
});

describe('stripe preview helper: server-only, READ/preview only (source check)', () => {
  it('is server-only, uses getStripe + retrieve + an upcoming-invoice preview, and no writes', () => {
    expect(stripe).toContain("import 'server-only'");
    expect(stripe).toContain('getStripe');
    expect(stripe).toMatch(/subscriptions\.retrieve\(/);
    expect(stripe).toMatch(/retrieveUpcoming|createPreview/);
    expect(stripe).not.toMatch(/\.subscriptions\.update\(/);
    expect(stripe).not.toMatch(/\.subscriptions\.cancel\(/);
    expect(stripe).not.toMatch(/\.subscriptions\.resume\(/);
  });
});
