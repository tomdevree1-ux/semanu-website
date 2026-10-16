import { describe, it, expect } from 'vitest';
import { decideAutoGeneration, shouldEnqueueAutoGeneration } from './policy';

const base = {
  enabled: true,
  sourceType: 'website_analysis',
  hasWebsiteUrl: true,
  domainHasRecentReport: false,
  todayAutoCount: 0,
  dailyCap: 10,
};

describe('decideAutoGeneration', () => {
  it('allows a clean website_analysis submission under the cap', () => {
    expect(decideAutoGeneration(base)).toEqual({ allowed: true });
  });

  it('blocks when the feature flag is off', () => {
    expect(decideAutoGeneration({ ...base, enabled: false })).toEqual({ allowed: false, reason: 'disabled' });
  });

  it('blocks non website_analysis sources', () => {
    expect(decideAutoGeneration({ ...base, sourceType: 'contact' })).toEqual({
      allowed: false,
      reason: 'not_website_analysis',
    });
  });

  it('blocks when there is no website to analyse', () => {
    expect(decideAutoGeneration({ ...base, hasWebsiteUrl: false })).toEqual({ allowed: false, reason: 'no_website' });
  });

  it('blocks a domain that already has a recent report (dedup)', () => {
    expect(decideAutoGeneration({ ...base, domainHasRecentReport: true })).toEqual({
      allowed: false,
      reason: 'duplicate_domain',
    });
  });

  it('blocks when the daily cap is reached', () => {
    expect(decideAutoGeneration({ ...base, todayAutoCount: 10, dailyCap: 10 })).toEqual({
      allowed: false,
      reason: 'daily_cap_reached',
    });
  });

  it('allows exactly one below the cap and blocks at the cap (boundary)', () => {
    expect(decideAutoGeneration({ ...base, todayAutoCount: 9, dailyCap: 10 }).allowed).toBe(true);
    expect(decideAutoGeneration({ ...base, todayAutoCount: 10, dailyCap: 10 }).allowed).toBe(false);
  });

  it('evaluates the flag before anything else', () => {
    // disabled + every other problem present → still reports disabled first
    expect(
      decideAutoGeneration({
        enabled: false,
        sourceType: 'contact',
        hasWebsiteUrl: false,
        domainHasRecentReport: true,
        todayAutoCount: 999,
        dailyCap: 1,
      }),
    ).toEqual({ allowed: false, reason: 'disabled' });
  });

  it('checks dedup before the daily cap', () => {
    expect(
      decideAutoGeneration({ ...base, domainHasRecentReport: true, todayAutoCount: 999, dailyCap: 1 }),
    ).toEqual({ allowed: false, reason: 'duplicate_domain' });
  });
});

describe('shouldEnqueueAutoGeneration', () => {
  it('is true only for an enabled website_analysis submission with a website', () => {
    expect(shouldEnqueueAutoGeneration({ enabled: true, sourceType: 'website_analysis', hasWebsiteUrl: true })).toBe(true);
  });
  it('is false when disabled', () => {
    expect(shouldEnqueueAutoGeneration({ enabled: false, sourceType: 'website_analysis', hasWebsiteUrl: true })).toBe(false);
  });
  it('is false for other sources', () => {
    expect(shouldEnqueueAutoGeneration({ enabled: true, sourceType: 'contact', hasWebsiteUrl: true })).toBe(false);
  });
  it('is false without a website', () => {
    expect(shouldEnqueueAutoGeneration({ enabled: true, sourceType: 'website_analysis', hasWebsiteUrl: false })).toBe(false);
  });
});
