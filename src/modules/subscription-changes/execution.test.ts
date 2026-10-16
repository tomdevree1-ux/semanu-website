import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { requestStatusExecutable, executePermissionFor, retryIdempotencyKey } from './guards';

/** Strip comments so prose mentioning forbidden calls doesn't trip the checks. */
function strip(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
}
const actions = strip(readFileSync(join(process.cwd(), 'src/modules/subscription-changes/actions.ts'), 'utf8'));
const exec = strip(readFileSync(join(process.cwd(), 'src/modules/subscription-changes/stripe-execute.ts'), 'utf8'));
const sync = strip(readFileSync(join(process.cwd(), 'src/modules/subscriptions/sync.ts'), 'utf8'));

describe('P12B2 execution guards', () => {
  it('requestStatusExecutable: plan/quantity only from previewed/approved', () => {
    expect(requestStatusExecutable('change_plan', 'previewed')).toBe(true);
    expect(requestStatusExecutable('change_plan', 'approved')).toBe(true);
    expect(requestStatusExecutable('change_plan', 'draft')).toBe(false);
    expect(requestStatusExecutable('change_quantity', 'previewed')).toBe(true);
  });
  it('requestStatusExecutable: cancel/undo/immediate from draft/previewed/approved', () => {
    expect(requestStatusExecutable('cancel_at_period_end', 'draft')).toBe(true);
    expect(requestStatusExecutable('undo_cancel_at_period_end', 'previewed')).toBe(true);
    expect(requestStatusExecutable('cancel_immediately', 'approved')).toBe(true);
  });
  it('requestStatusExecutable: never from executing/executed/cancelled/archived/failed', () => {
    for (const s of ['executing', 'executed', 'cancelled', 'archived', 'failed']) {
      expect(requestStatusExecutable('change_plan', s)).toBe(false);
      expect(requestStatusExecutable('cancel_immediately', s)).toBe(false);
    }
  });
  it('executePermissionFor maps actions; pause/resume → null', () => {
    expect(executePermissionFor('change_plan')).toBe('subscriptions.change_plan');
    expect(executePermissionFor('change_quantity')).toBe('subscriptions.change_quantity');
    expect(executePermissionFor('cancel_at_period_end')).toBe('subscriptions.cancel');
    expect(executePermissionFor('undo_cancel_at_period_end')).toBe('subscriptions.cancel');
    expect(executePermissionFor('cancel_immediately')).toBe('subscriptions.cancel');
    expect(executePermissionFor('pause_collection')).toBeNull();
    expect(executePermissionFor('resume_collection')).toBeNull();
  });
  it('retryIdempotencyKey is fresh + derived from the request id', () => {
    const k = retryIdempotencyKey('abc');
    expect(k.startsWith('abc:r')).toBe(true);
    expect(retryIdempotencyKey('abc')).not.toBe(k); // time-based → fresh
  });
});

describe('execute action: P12B2 security invariants (source check)', () => {
  it('exports execute + retry; both delegate through the flag-gated core', () => {
    expect(actions).toMatch(/export async function executeSubscriptionChange/);
    expect(actions).toMatch(/export async function retrySubscriptionChange/);
    expect(actions).toContain('performExecution');
  });
  it('hard-gates on the config flag BEFORE any work', () => {
    expect(actions).toContain('env.stripeSubscriptionMutationsEnabled');
    const i = actions.indexOf('function performExecution');
    const body = actions.slice(i, i + 400);
    expect(body).toContain('stripeSubscriptionMutationsEnabled'); // first line of the core
  });
  it('gates per-action admin permission via executePermissionFor + hasPermission', () => {
    expect(actions).toContain('executePermissionFor(action)');
    expect(actions).toMatch(/hasPermission\(perm\)/);
  });
  it('re-previews plan/quantity, uses idempotency, syncs the registry, and confirms destructive cancel', () => {
    expect(actions).toContain('buildChangePreview');
    expect(actions).toContain('idempotencyKey');
    expect(actions).toContain('syncRegistryFromStripe');
    expect(actions).toMatch(/cancel_immediately[\s\S]*?confirmMatches/);
  });
  it('marks failure with a sanitized error (no secret) and supports retry with a fresh key', () => {
    expect(actions).toContain('sanitizeStripeError');
    expect(actions).toMatch(/replace\(\/sk_/);
    expect(actions).toContain('retryIdempotencyKey');
  });
  it('never writes a legacy table, never calls checkout, never hard-deletes', () => {
    for (const t of ['subscriptions', 'customers', 'orders', 'payments', 'payment_links', 'stripe_events', 'invoice_payments', 'invoice_payment_links']) {
      expect(actions).not.toContain(`.from('${t}')`);
    }
    expect(actions).not.toContain('/api/checkout');
    expect(actions).not.toMatch(/\.delete\(/);
  });
  it('the actual Stripe writes are isolated in the server-only execute helper (not actions.ts)', () => {
    expect(actions).not.toMatch(/\.subscriptions\.update\(/);
    expect(actions).not.toMatch(/\.subscriptions\.cancel\(/);
    expect(actions).not.toContain('getStripe');
  });
});

describe('stripe-execute helper: server-only, only update/cancel, idempotency-keyed (source check)', () => {
  it('is server-only and uses getStripe', () => {
    expect(exec).toContain("import 'server-only'");
    expect(exec).toContain('getStripe');
  });
  it('uses subscriptions.update + subscriptions.cancel, each with an idempotency key', () => {
    expect(exec).toMatch(/subscriptions\.update\(/);
    expect(exec).toMatch(/subscriptions\.cancel\(/);
    expect(exec).toMatch(/idempotencyKey:\s*p\.idempotencyKey/);
  });
  it('contains NO forbidden Stripe calls', () => {
    expect(exec).not.toMatch(/subscriptions\.resume\(/);
    expect(exec).not.toMatch(/pause_collection\s*:/);
    expect(exec).not.toMatch(/checkout\.sessions\.create/);
    expect(exec).not.toMatch(/\.refunds\./);
  });
});

describe('registry sync helper: server-only, registry-only (source check)', () => {
  it('is server-only, retrieves the snapshot, writes only customer_subscriptions', () => {
    expect(sync).toContain("import 'server-only'");
    expect(sync).toContain('retrieveSubscriptionSnapshot');
    expect(sync).toContain("from('customer_subscriptions')");
    for (const t of ['subscriptions', 'orders', 'payments', 'payment_links', 'stripe_events', 'invoice_payments', 'invoice_payment_links']) {
      expect(sync).not.toContain(`.from('${t}')`);
    }
    // `customers` is READ-only in sync.ts (the P12C webhook-reconcile company bridge) — never written
    expect(sync).not.toMatch(/\.from\('customers'\)\.(update|insert|upsert|delete)/);
  });
});
