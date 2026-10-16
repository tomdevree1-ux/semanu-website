import { describe, it, expect } from 'vitest';
import {
  ltv,
  maxHealthyCac,
  maxPaybackCac,
  maxAllowedCac,
  cpl,
  cac,
  paybackMonths,
  ltvCacRatio,
  leadToCustomer,
  earlyChurnRate,
} from './calc';

describe('acquisition calc (amai defaults: 80/mo, 24 months, 3:1, 3-month payback)', () => {
  it('LTV = price × retention', () => {
    expect(ltv(80, 24)).toBe(1920);
  });

  it('max healthy CAC = LTV / ratio, null on zero ratio', () => {
    expect(maxHealthyCac(1920, 3)).toBe(640);
    expect(maxHealthyCac(1920, 0)).toBeNull();
  });

  it('max payback CAC = price × payback months', () => {
    expect(maxPaybackCac(80, 3)).toBe(240);
  });

  it('max ALLOWED CAC is the stricter of ratio and payback', () => {
    expect(maxAllowedCac(80, 24, 3, 3)).toBe(240); // min(640, 240)
  });

  it('CPL, null when no leads', () => {
    expect(cpl(100, 10)).toBe(10);
    expect(cpl(100, 0)).toBeNull();
  });

  it('CAC, null when no customers', () => {
    expect(cac(480, 3)).toBe(160);
    expect(cac(480, 0)).toBeNull();
  });

  it('payback months, null on null CAC or zero price', () => {
    expect(paybackMonths(240, 80)).toBe(3);
    expect(paybackMonths(null, 80)).toBeNull();
    expect(paybackMonths(240, 0)).toBeNull();
  });

  it('LTV:CAC, null on null/zero CAC', () => {
    expect(ltvCacRatio(1920, 640)).toBe(3);
    expect(ltvCacRatio(1920, null)).toBeNull();
    expect(ltvCacRatio(1920, 0)).toBeNull();
  });

  it('lead→customer rate, null when no leads', () => {
    expect(leadToCustomer(3, 10)).toBeCloseTo(0.3);
    expect(leadToCustomer(3, 0)).toBeNull();
  });

  it('early churn rate, null when none evaluable', () => {
    expect(earlyChurnRate(2, 5)).toBeCloseTo(0.4);
    expect(earlyChurnRate(2, 0)).toBeNull();
  });
});
