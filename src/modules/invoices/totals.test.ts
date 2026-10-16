import { describe, it, expect } from 'vitest';
import { round2, computeLine, computeInvoiceTotals, computeBalanceDue, suggestedTax, formatMoney } from './totals';

describe('round2', () => {
  it('rounds to 2 decimals without float drift', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(round2(2.345)).toBe(2.35);
    expect(round2(2.344)).toBe(2.34);
  });
});

describe('computeLine', () => {
  it('line_subtotal = round(qty * unit); line_total = line_subtotal', () => {
    expect(computeLine(3, 10.5)).toEqual({ lineSubtotal: 31.5, lineTotal: 31.5 });
    expect(computeLine(2, 39)).toEqual({ lineSubtotal: 78, lineTotal: 78 });
  });
});

describe('computeInvoiceTotals', () => {
  it('subtotal = Σ lineTotal; total = subtotal − discount + tax', () => {
    expect(computeInvoiceTotals([{ lineTotal: 78 }, { lineTotal: 31.5 }], 10, 5)).toEqual({ subtotal: 109.5, total: 104.5 });
    expect(computeInvoiceTotals([], 0, 0)).toEqual({ subtotal: 0, total: 0 });
  });
  it('clamps total at 0 when discount exceeds subtotal', () => {
    expect(computeInvoiceTotals([{ lineTotal: 50 }], 100, 0)).toEqual({ subtotal: 50, total: 0 });
  });
});

describe('computeBalanceDue', () => {
  it('balance = max(0, total − amountPaid)', () => {
    expect(computeBalanceDue(104.5, 0)).toBe(104.5);
    expect(computeBalanceDue(104.5, 104.5)).toBe(0);
    expect(computeBalanceDue(100, 150)).toBe(0); // clamped
  });
});

describe('suggestedTax (8.1% helper)', () => {
  it('applies 8.1% to (subtotal − discount)', () => {
    expect(suggestedTax(100, 0)).toBe(8.1);
    expect(suggestedTax(100, 10)).toBe(7.29);
    expect(suggestedTax(10, 50)).toBe(0); // clamped
  });
});

describe('formatMoney', () => {
  it('formats CHF with 2 decimals', () => {
    expect(formatMoney(78, 'CHF')).toBe('CHF 78.00');
    expect(formatMoney(0, 'CHF')).toBe('CHF 0.00');
  });
});
