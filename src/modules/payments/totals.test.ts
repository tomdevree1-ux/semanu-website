import { describe, it, expect } from 'vitest';
import { round2, computeAmountPaid, computeBalanceDue, isOverpaid, formatMoney } from './totals';

describe('round2', () => {
  it('rounds to 2 decimals without float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.345)).toBe(2.35);
  });
});

describe('computeAmountPaid', () => {
  const p = (status: string, amount: number, archivedAt: string | null = null) => ({ status, amount, archivedAt });
  it('counts only succeeded, non-archived payments', () => {
    expect(
      computeAmountPaid([
        p('succeeded', 50),
        p('succeeded', 30),
        p('pending', 100),
        p('failed', 100),
        p('cancelled', 100),
        p('refunded', 50),
        p('succeeded', 20, '2026-01-01'), // archived → excluded
      ]),
    ).toBe(80);
  });
  it('is 0 with no succeeded payments', () => {
    expect(computeAmountPaid([p('pending', 100), p('refunded', 100)])).toBe(0);
    expect(computeAmountPaid([])).toBe(0);
  });
});

describe('computeBalanceDue', () => {
  it('balance = max(0, total − amountPaid) (overpayment clamps at 0)', () => {
    expect(computeBalanceDue(100, 40)).toBe(60);
    expect(computeBalanceDue(100, 100)).toBe(0);
    expect(computeBalanceDue(100, 150)).toBe(0);
  });
});

describe('isOverpaid', () => {
  it('true only when amountPaid strictly above total', () => {
    expect(isOverpaid(100, 150)).toBe(true);
    expect(isOverpaid(100, 100)).toBe(false);
    expect(isOverpaid(100, 80)).toBe(false);
  });
});

describe('formatMoney', () => {
  it('formats CHF with 2 decimals', () => {
    expect(formatMoney(78, 'CHF')).toBe('CHF 78.00');
    expect(formatMoney(0, 'CHF')).toBe('CHF 0.00');
  });
});
