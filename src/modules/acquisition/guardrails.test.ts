import { describe, it, expect } from 'vitest';
import { classifySource, daysSince } from './guardrails';
import type { AcquisitionTargets, SourceMetrics } from './types';

const T: AcquisitionTargets = {
  baseCurrency: 'CHF',
  defaultSubscriptionPrice: 80,
  expectedRetentionMonths: 24,
  targetLtvCacRatio: 3,
  targetPaybackMonths: 3,
  minClicksBeforeJudgement: 100,
  minLeadsBeforeJudgement: 10,
  minCustomersBeforeJudgement: 3,
  earlyChurnWindowDays: 90,
  campaignCooldownDays: 14,
  minConversionsToScale: 30,
  scaleStepPct: 20,
  stableWindowDays: 14,
};

const NOW = Date.parse('2026-06-16T00:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

function M(over: Partial<SourceMetrics>): SourceMetrics {
  return {
    source: 'google_ads',
    spend: 0,
    clicks: null,
    leads: 0,
    customers: 0,
    newMrr: 0,
    earlyChurnCount: 0,
    ...over,
  };
}

describe('daysSince', () => {
  it('counts whole days, null on missing/invalid', () => {
    expect(daysSince(daysAgo(5), NOW)).toBe(5);
    expect(daysSince(null, NOW)).toBeNull();
    expect(daysSince('not-a-date', NOW)).toBeNull();
  });
});

describe('classifySource — operational rules win first', () => {
  it('change fatigue overrides everything', () => {
    const r = classifySource(M({ leads: 20, customers: 5, spend: 1000, changesInLast14Days: 4 }), T, NOW);
    expect(r.status).toBe('cooldown');
    expect(r.title).toBe('Change fatigue');
  });

  it('recent change → learning/cooldown', () => {
    const r = classifySource(M({ leads: 20, customers: 5, spend: 1000, lastChangedAt: daysAgo(2) }), T, NOW);
    expect(r.status).toBe('cooldown');
    expect(r.title).toBe('Learning / cooldown');
    expect(r.reviewInDays).toBe(12);
  });

  it('spend but no leads → tracking issue', () => {
    const r = classifySource(M({ spend: 250, leads: 0 }), T, NOW);
    expect(r.status).toBe('tracking_issue');
    expect(r.title).toBe('Spend but no leads');
  });

  it('gclid but no campaign id → tracking issue', () => {
    const r = classifySource(M({ spend: 250, leads: 5, hasGclidButNoCampaignId: true }), T, NOW);
    expect(r.status).toBe('tracking_issue');
    expect(r.title).toBe('Paid clicks without campaign id');
  });
});

describe('classifySource — calm "too early" before economics', () => {
  it('below min leads → too early', () => {
    const r = classifySource(M({ leads: 5, spend: 50 }), T, NOW);
    expect(r.status).toBe('too_early');
  });

  it('leads but no customers → watch (sales/quality, not ads)', () => {
    const r = classifySource(M({ leads: 15, customers: 0, spend: 300 }), T, NOW);
    expect(r.status).toBe('watch');
    expect(r.title).toBe('Leads but no customers');
  });
});

describe('classifySource — economics', () => {
  it('CAC within ceiling → healthy', () => {
    // 5 customers, 1000 spend → CAC 200 ≤ 240 ceiling
    const r = classifySource(M({ leads: 20, customers: 5, spend: 1000, newMrr: 400 }), T, NOW);
    expect(r.status).toBe('healthy');
  });

  it('CAC above target but low sample → watch (do not overreact)', () => {
    // 2 customers (< 3), 1000 spend → CAC 500 > 240
    const r = classifySource(M({ leads: 15, customers: 2, spend: 1000 }), T, NOW);
    expect(r.status).toBe('watch');
    expect(r.title).toBe('CAC above target (low sample)');
  });

  it('CAC above target with enough data → problem', () => {
    // 5 customers, 2000 spend → CAC 400 > 240
    const r = classifySource(M({ leads: 20, customers: 5, spend: 2000 }), T, NOW);
    expect(r.status).toBe('problem');
    expect(r.title).toBe('CAC above target');
  });

  it('high early churn with enough customers → problem', () => {
    // 5 customers, 2 early churn (0.4 ≥ 0.34)
    const r = classifySource(M({ leads: 20, customers: 5, spend: 1000, earlyChurnCount: 2 }), T, NOW);
    expect(r.status).toBe('problem');
    expect(r.title).toBe('High early churn');
  });
});

describe('classifySource — scaling is conversion-based, not calendar-based', () => {
  it('healthy + enough conversions + stable → scale candidate', () => {
    // 40 conversions (≥ 30), CAC 200 ≤ 240, no recent change
    const r = classifySource(M({ leads: 40, customers: 8, spend: 1600 }), T, NOW);
    expect(r.status).toBe('healthy');
    expect(r.title).toBe('Scale candidate');
  });

  it('healthy but too few conversions → hold to scale (do not scale yet)', () => {
    const r = classifySource(M({ leads: 20, customers: 5, spend: 1000 }), T, NOW);
    expect(r.status).toBe('healthy');
    expect(r.title).toBe('Economics healthy (hold to scale)');
  });

  it('enough conversions but changed recently → not a scale candidate (cooldown wins)', () => {
    const r = classifySource(M({ leads: 40, customers: 8, spend: 1600, lastChangedAt: daysAgo(3) }), T, NOW);
    expect(r.status).toBe('cooldown');
  });
});
