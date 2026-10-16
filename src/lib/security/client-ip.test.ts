import { describe, it, expect } from 'vitest';
import { clientIp, isValidIp } from '@/lib/security/client-ip';
import { interpretSubmitContact, submitContactHeaders } from '@/lib/semanu-leads';

const req = (h: Record<string, string>) => ({ headers: new Headers(h) });

describe('clientIp (X-Real-IP from Caddy only)', () => {
  it('reads X-Real-IP', () => {
    expect(clientIp(req({ 'x-real-ip': '203.0.113.5' }))).toBe('203.0.113.5');
    expect(clientIp(req({ 'x-real-ip': '2001:DB8::1' }))).toBe('2001:db8::1');
  });
  it('ignores X-Forwarded-For and cf-connecting-ip', () => {
    expect(clientIp(req({ 'x-forwarded-for': '1.1.1.1', 'cf-connecting-ip': '2.2.2.2' }))).toBe('unknown');
  });
  it('rejects malformed values', () => {
    for (const v of ['', 'unknown', '1.2.3.4, 5.6.7.8', '1.2.3.4:80', '[::1]', '256.0.0.1', 'fe80::1%eth0']) {
      expect(clientIp(req({ 'x-real-ip': v }))).toBe('unknown');
    }
  });
  it('validates IPv4 and IPv6 literals', () => {
    for (const v of ['0.0.0.0', '255.255.255.255', '::', '::1', '::ffff:192.0.2.1', '1:2:3:4:5:6:7:8']) {
      expect(isValidIp(v)).toBe(true);
    }
    for (const v of ['01.2.3.4', '1::2::3', '1:2:3:4:5:6:7:8:9', 'g::1']) expect(isValidIp(v)).toBe(false);
  });
});

describe('submit-contact request headers', () => {
  it('adds the secret and the visitor IP only with a secret', () => {
    expect(submitContactHeaders('k', 's3cret', '203.0.113.5')).toMatchObject({
      apikey: 'k',
      'X-Forward-Secret': 's3cret',
      'X-Visitor-IP': '203.0.113.5',
    });
    const none = submitContactHeaders('k', '', '203.0.113.5');
    expect(none['X-Forward-Secret']).toBeUndefined();
    expect(none['X-Visitor-IP']).toBeUndefined();
  });
  it('never forwards an invalid IP', () => {
    expect(submitContactHeaders('k', 's3cret', 'unknown')['X-Visitor-IP']).toBeUndefined();
  });
});

describe('submit-contact answer', () => {
  it('maps 429 to rate_limited, ok to ok, everything else to error', () => {
    expect(interpretSubmitContact(429, { ok: false, error: 'rate_limited' })).toBe('rate_limited');
    expect(interpretSubmitContact(200, { ok: true })).toBe('ok');
    expect(interpretSubmitContact(200, { ok: false })).toBe('error');
    expect(interpretSubmitContact(502, null)).toBe('error');
  });
});
