import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import { paymentLinkStatusMachine, PAYMENT_LINK_CONFIRM_STATUSES } from './status';
import {
  isLegalLinkTransition,
  confirmMatches,
  invoiceAllowsLink,
  linkIsActive,
  linkIsArchivable,
  linkIsStale,
} from './guards';
import { linkCreateSchema, linkNotesSchema } from './schema';
import { paymentLinkStatusToken } from '@/lib/status/colors';

describe('paymentLinkStatusMachine transitions', () => {
  it('allows the lifecycle moves', () => {
    expect(canTransition(paymentLinkStatusMachine, 'draft', 'active')).toBe(true);
    expect(canTransition(paymentLinkStatusMachine, 'active', 'paid')).toBe(true);
    expect(canTransition(paymentLinkStatusMachine, 'active', 'expired')).toBe(true);
    expect(canTransition(paymentLinkStatusMachine, 'active', 'cancelled')).toBe(true);
    expect(canTransition(paymentLinkStatusMachine, 'active', 'failed')).toBe(true);
  });
  it('rejects illegal jumps + archived (a dedicated action)', () => {
    expect(canTransition(paymentLinkStatusMachine, 'draft', 'paid')).toBe(false);
    expect(canTransition(paymentLinkStatusMachine, 'paid', 'active')).toBe(false);
    expect(canTransition(paymentLinkStatusMachine, 'cancelled', 'active')).toBe(false);
    expect(canTransition(paymentLinkStatusMachine, 'active', 'archived')).toBe(false);
    expect(isLegalLinkTransition('draft', 'active')).toBe(true);
    expect(isLegalLinkTransition('draft', 'paid')).toBe(false);
  });
  it('cancel requires confirm', () => {
    expect(PAYMENT_LINK_CONFIRM_STATUSES.has('cancelled')).toBe(true);
  });
});

describe('paymentLinkStatusToken mapping (P11)', () => {
  it('maps each status to its token', () => {
    expect(paymentLinkStatusToken('draft')).toBe('draft');
    expect(paymentLinkStatusToken('active')).toBe('waiting');
    expect(paymentLinkStatusToken('paid')).toBe('done');
    expect(paymentLinkStatusToken('expired')).toBe('warning');
    expect(paymentLinkStatusToken('cancelled')).toBe('cancelled');
    expect(paymentLinkStatusToken('failed')).toBe('cancelled');
    expect(paymentLinkStatusToken('archived')).toBe('cancelled');
  });
});

describe('schema + guards', () => {
  it('create requires an invoice uuid; notes optional', () => {
    expect(linkCreateSchema.safeParse({ invoiceId: '11111111-1111-1111-1111-111111111111' }).success).toBe(true);
    expect(linkCreateSchema.safeParse({ invoiceId: 'nope' }).success).toBe(false);
    expect(linkNotesSchema.safeParse({ notes: 'hi' }).success).toBe(true);
  });
  it('invoiceAllowsLink: issued/overdue + balance>0 + non-archived only', () => {
    expect(invoiceAllowsLink('issued', null, 100)).toBe(true);
    expect(invoiceAllowsLink('overdue', null, 50)).toBe(true);
    expect(invoiceAllowsLink('issued', null, 0)).toBe(false); // fully paid
    expect(invoiceAllowsLink('draft', null, 100)).toBe(false);
    expect(invoiceAllowsLink('void', null, 100)).toBe(false);
    expect(invoiceAllowsLink('paid', null, 0)).toBe(false);
    expect(invoiceAllowsLink('issued', '2026-01-01', 100)).toBe(false); // archived
  });
  it('active + archivable + stale helpers', () => {
    expect(linkIsActive('active')).toBe(true);
    expect(linkIsActive('cancelled')).toBe(false);
    expect(linkIsArchivable('cancelled')).toBe(true);
    expect(linkIsArchivable('expired')).toBe(true);
    expect(linkIsArchivable('failed')).toBe(true);
    expect(linkIsArchivable('paid')).toBe(true);
    expect(linkIsArchivable('active')).toBe(false);
    expect(linkIsArchivable('draft')).toBe(false);
    expect(linkIsStale(100, 100)).toBe(false);
    expect(linkIsStale(100, 80)).toBe(true);
    expect(confirmMatches('  INV-00001 ', 'inv-00001')).toBe(true);
  });
});

describe('payment-links actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/payment-links/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createStripeCheckoutForInvoice[\s\S]*?hasPermission\('payment_links\.create'\)/);
    expect(src).toMatch(/regeneratePaymentLink[\s\S]*?hasPermission\('payment_links\.create'\)/);
    expect(src).toMatch(/cancelPaymentLink[\s\S]*?hasPermission\('payment_links\.cancel'\)/);
    expect(src).toMatch(/archivePaymentLink[\s\S]*?hasPermission\('payment_links\.archive'\)/);
    expect(src).toMatch(/restorePaymentLink[\s\S]*?hasPermission\('payment_links\.archive'\)/);
    expect(src).toContain('invoiceAllowsLink');
  });
  it('never mutates invoice money or recalculates; never hard-deletes; restore → cancelled', () => {
    expect(src).not.toMatch(/\.from\('invoices'\)\.update/); // only reads the invoice, never writes its money
    expect(src).not.toContain('recalculateInvoicePaymentState');
    expect(src).not.toContain('.delete(');
    expect(src).toContain("status: 'archived'");
    // restore returns to cancelled (P11-D16), not active
    const i = src.indexOf('restorePaymentLink');
    expect(src.slice(i, i + 1200)).toContain("status: 'cancelled'");
  });
  it('never touches the legacy billing tables or checkout', () => {
    expect(src).not.toMatch(/\.from\('payment_links'\)|\.from\('payments'\)|\.from\('orders'\)|\.from\('subscriptions'\)|\.from\('customers'\)|\.from\('stripe_events'\)/);
    expect(src).not.toContain('/api/checkout');
    expect(src).not.toMatch(/STRIPE_SECRET|sk_(live|test)/);
  });
  it('no raw URL or money in ordinary metadata', () => {
    const metas = src.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m).not.toMatch(/\burl\s*:/);
      expect(m).not.toMatch(/\b(amount|amount_paid|balance_due)\s*:/);
    }
  });
});

describe('Stripe helper: server-only Checkout Session shape (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/payment-links/stripe.ts'), 'utf8');
  it('is server-only and uses mode payment + ad-hoc price_data + cents + metadata + idempotency', () => {
    expect(src).toContain("import 'server-only'");
    expect(src).toContain('getStripe');
    expect(src).toContain("mode: 'payment'");
    expect(src).toContain('price_data');
    expect(src).toMatch(/unit_amount:\s*cents/);
    expect(src).toMatch(/Math\.round\(params\.amount \* 100\)/);
    expect(src).toContain("kind: 'invoice_payment'");
    expect(src).toMatch(/idempotencyKey:\s*params\.linkId/);
    expect(src).not.toMatch(/STRIPE_SECRET|sk_(live|test)/);
  });
});

describe('defensive Stripe webhook guard (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/app/api/stripe/webhook/route.ts'), 'utf8');
  it('early-returns for invoice-payment / no-order sessions before legacy order + email logic', () => {
    expect(src).toMatch(/if \(!orderId \|\| session\.metadata\?\.kind === 'invoice_payment'\) return;/);
    // the guard sits before the order update + emails
    const guardIdx = src.indexOf("kind === 'invoice_payment'");
    const orderUpdateIdx = src.indexOf("from('orders')");
    const emailIdx = src.indexOf('await sendEmail');
    expect(guardIdx).toBeGreaterThan(-1);
    expect(guardIdx).toBeLessThan(orderUpdateIdx);
    expect(guardIdx).toBeLessThan(emailIdx);
  });
});
