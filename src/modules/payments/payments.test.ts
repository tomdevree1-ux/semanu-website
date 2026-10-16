import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { canTransition } from '@/lib/status/types';
import {
  paymentStatusMachine,
  PAYMENT_TARGET_STATUSES,
  PAYMENT_CONFIRM_STATUSES,
  permissionForPaymentTransition,
  legalNextPaymentStatuses,
} from './status';
import {
  isLegalPaymentTransition,
  confirmMatches,
  invoiceAllowsPayment,
  paymentIsEditable,
  paymentIsArchivable,
  paymentCounts,
} from './guards';
import { paymentCreateSchema, paymentUpdateSchema, paymentStatusChangeSchema } from './schema';
import { paymentStatusToken } from '@/lib/status/colors';

describe('paymentStatusMachine transitions', () => {
  it('allows the lifecycle + reopen moves', () => {
    expect(canTransition(paymentStatusMachine, 'pending', 'succeeded')).toBe(true);
    expect(canTransition(paymentStatusMachine, 'pending', 'failed')).toBe(true);
    expect(canTransition(paymentStatusMachine, 'pending', 'cancelled')).toBe(true);
    expect(canTransition(paymentStatusMachine, 'failed', 'pending')).toBe(true);
    expect(canTransition(paymentStatusMachine, 'cancelled', 'pending')).toBe(true);
    expect(canTransition(paymentStatusMachine, 'succeeded', 'refunded')).toBe(true);
  });
  it('rejects illegal jumps + any archived transition', () => {
    expect(canTransition(paymentStatusMachine, 'pending', 'refunded')).toBe(false);
    expect(canTransition(paymentStatusMachine, 'succeeded', 'pending')).toBe(false);
    expect(canTransition(paymentStatusMachine, 'refunded', 'pending')).toBe(false); // terminal
    expect(canTransition(paymentStatusMachine, 'pending', 'archived')).toBe(false);
    expect(canTransition(paymentStatusMachine, 'archived', 'pending')).toBe(false);
    expect(isLegalPaymentTransition('pending', 'refunded')).toBe(false);
    expect(isLegalPaymentTransition('pending', 'succeeded')).toBe(true);
  });
  it('maps the right permission to each transition', () => {
    expect(permissionForPaymentTransition('pending', 'succeeded')).toBe('payments.mark_succeeded');
    expect(permissionForPaymentTransition('succeeded', 'refunded')).toBe('payments.refund');
    expect(permissionForPaymentTransition('pending', 'cancelled')).toBe('payments.cancel');
    expect(permissionForPaymentTransition('pending', 'failed')).toBe('payments.update');
    expect(permissionForPaymentTransition('failed', 'pending')).toBe('payments.update');
  });
  it('confirm set + target list + legalNext', () => {
    expect(PAYMENT_CONFIRM_STATUSES.has('succeeded')).toBe(true);
    expect(PAYMENT_CONFIRM_STATUSES.has('refunded')).toBe(true);
    expect(PAYMENT_CONFIRM_STATUSES.has('cancelled')).toBe(true);
    expect(PAYMENT_CONFIRM_STATUSES.has('failed')).toBe(false);
    expect(PAYMENT_TARGET_STATUSES).not.toContain('archived');
    expect(legalNextPaymentStatuses('pending').sort()).toEqual(['cancelled', 'failed', 'succeeded']);
    expect(legalNextPaymentStatuses('succeeded')).toEqual(['refunded']);
    expect(legalNextPaymentStatuses('refunded')).toEqual([]);
  });
});

describe('paymentStatusToken mapping (P10)', () => {
  it('maps each status to its token', () => {
    expect(paymentStatusToken('pending')).toBe('waiting');
    expect(paymentStatusToken('succeeded')).toBe('done');
    expect(paymentStatusToken('failed')).toBe('cancelled');
    expect(paymentStatusToken('cancelled')).toBe('cancelled');
    expect(paymentStatusToken('refunded')).toBe('warning');
    expect(paymentStatusToken('archived')).toBe('cancelled');
  });
});

describe('payment schema validation', () => {
  it('create requires invoice + positive amount', () => {
    const ok = paymentCreateSchema.safeParse({ invoiceId: '11111111-1111-1111-1111-111111111111', amount: '50' });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.amount).toBe(50);
      expect(ok.data.method).toBe('manual');
      expect(ok.data.provider).toBe('manual');
    }
    expect(paymentCreateSchema.safeParse({ invoiceId: 'nope', amount: '50' }).success).toBe(false);
    expect(paymentCreateSchema.safeParse({ invoiceId: '11111111-1111-1111-1111-111111111111', amount: '0' }).success).toBe(false);
    expect(paymentCreateSchema.safeParse({ invoiceId: '11111111-1111-1111-1111-111111111111', amount: '-5' }).success).toBe(false);
  });
  it('update amount must be > 0; status change enum', () => {
    expect(paymentUpdateSchema.safeParse({ amount: '12.50' }).success).toBe(true);
    expect(paymentUpdateSchema.safeParse({ amount: '0' }).success).toBe(false);
    expect(paymentStatusChangeSchema.safeParse({ status: 'succeeded' }).success).toBe(true);
    expect(paymentStatusChangeSchema.safeParse({ status: 'archived' }).success).toBe(false);
  });
});

describe('guards', () => {
  it('relationship + confirm + editable + archivable + counts', () => {
    expect(confirmMatches('  INV-00001 ', 'inv-00001')).toBe(true);
    expect(invoiceAllowsPayment('issued', null)).toBe(true);
    expect(invoiceAllowsPayment('paid', null)).toBe(true);
    expect(invoiceAllowsPayment('void', null)).toBe(false);
    expect(invoiceAllowsPayment('archived', null)).toBe(false);
    expect(invoiceAllowsPayment('issued', '2026-01-01')).toBe(false);
    expect(paymentIsEditable('pending', null)).toBe(true);
    expect(paymentIsEditable('succeeded', null)).toBe(false);
    expect(paymentIsEditable('pending', '2026-01-01')).toBe(false);
    expect(paymentIsArchivable('pending')).toBe(true);
    expect(paymentIsArchivable('refunded')).toBe(true);
    expect(paymentIsArchivable('succeeded')).toBe(false);
    expect(paymentCounts('succeeded', null)).toBe(true);
    expect(paymentCounts('succeeded', '2026-01-01')).toBe(false);
    expect(paymentCounts('pending', null)).toBe(false);
  });
});

describe('payments actions: security invariants (source check)', () => {
  const src = readFileSync(join(process.cwd(), 'src/modules/payments/actions.ts'), 'utf8');
  it('gates every action by the right permission', () => {
    expect(src).toContain("'use server'");
    expect(src).toMatch(/createManualPayment[\s\S]*?hasPermission\('payments\.create'\)/);
    expect(src).toMatch(/updatePayment[\s\S]*?hasPermission\('payments\.update'\)/);
    expect(src).toMatch(/changePaymentStatus[\s\S]*?hasPermission\('payments\.update'\)/);
    expect(src).toContain('permissionForPaymentTransition');
    expect(src).toMatch(/archivePayment[\s\S]*?hasPermission\('payments\.archive'\)/);
    expect(src).toMatch(/restorePayment[\s\S]*?hasPermission\('payments\.archive'\)/);
  });
  it('recalculates invoice state; payments never hard-deleted', () => {
    expect(src).toContain('recalculateInvoicePaymentState');
    expect(src).not.toContain("from('invoice_payments').delete");
    expect(src).toContain("status: 'archived'"); // archive is soft
    expect(src).toContain("status: 'pending'"); // create + restore
  });
  it('makes no Stripe calls and never touches the legacy billing tables', () => {
    expect(src).not.toMatch(/STRIPE_SECRET|sk_(live|test)|new Stripe|import Stripe|stripe\.(charges|paymentIntents|checkout|subscriptions|refunds)/i);
    expect(src).not.toMatch(/\.from\('payments'\)|\.from\('payment_links'\)|\.from\('orders'\)|\.from\('subscriptions'\)|\.from\('customers'\)|\.from\('stripe_events'\)/);
    expect(src).not.toContain('/api/checkout');
    expect(src).not.toContain('/api/stripe');
  });
  it('no raw money VALUES in ordinary metadata (field-name strings are fine)', () => {
    const metas = src.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m).not.toMatch(/\b(amount|amount_paid|balance_due|total_amount)\s*:/);
    }
  });
});

describe('P9 invoice guard for payment authority', () => {
  const inv = readFileSync(join(process.cwd(), 'src/modules/invoices/actions.ts'), 'utf8');
  it('blocks manual mark-paid / un-pay when invoice_payments exist', () => {
    expect(inv).toContain('invoice_payments');
    expect(inv).toContain('This invoice has payment records. Update payment records instead.');
  });
});
