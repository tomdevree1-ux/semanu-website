import { describe, it, expect } from 'vitest';
import { normalizeWebsiteUrl, isBlockedIp, assertUrlShape, assertPublicUrl } from './url-guard';

describe('url-guard: normalizeWebsiteUrl', () => {
  it('defaults bare domains to https and rejects empties', () => {
    expect(normalizeWebsiteUrl('example.ch')).toBe('https://example.ch/');
    expect(normalizeWebsiteUrl('http://example.ch')).toBe('http://example.ch/');
    expect(normalizeWebsiteUrl('  ')).toBeNull();
    expect(normalizeWebsiteUrl(null)).toBeNull();
  });
});

describe('url-guard: isBlockedIp', () => {
  it('blocks private / loopback / link-local / metadata / shared / IPv6', () => {
    for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.5.5', '192.168.0.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '::1', 'fc00::1', 'fd12::1', 'fe80::1', '::ffff:127.0.0.1']) {
      expect(isBlockedIp(ip)).toBe(true);
    }
  });
  it('allows public addresses', () => {
    for (const ip of ['8.8.8.8', '1.1.1.1', '93.184.216.34', '2606:2800:220:1:248:1893:25c8:1946']) {
      expect(isBlockedIp(ip)).toBe(false);
    }
  });
});

describe('url-guard: assertUrlShape (no network)', () => {
  it('rejects non-http(s) schemes and dangerous shapes', () => {
    expect(assertUrlShape('file:///etc/passwd').ok).toBe(false);
    expect(assertUrlShape('ftp://host.com').ok).toBe(false);
    expect(assertUrlShape('javascript:alert(1)').ok).toBe(false);
    expect((assertUrlShape('http://user:pass@example.com') as { reason: string }).reason).toBe('userinfo');
    expect((assertUrlShape('http://example.com:8080') as { reason: string }).reason).toBe('bad_port');
    expect((assertUrlShape('http://127.0.0.1') as { reason: string }).reason).toBe('ip_literal');
    expect((assertUrlShape('http://[::1]') as { reason: string }).reason).toBe('ip_literal');
    expect((assertUrlShape('http://localhost') as { reason: string }).reason).toBe('internal_hostname');
    expect((assertUrlShape('http://intranet') as { reason: string }).reason).toBe('internal_hostname');
    expect((assertUrlShape('http://foo.local') as { reason: string }).reason).toBe('internal_hostname');
  });
  it('accepts a normal public https host (shape only)', () => {
    const r = assertUrlShape('https://example.com/pricing');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.host).toBe('example.com');
  });
});

describe('url-guard: assertPublicUrl (injected resolver)', () => {
  it('passes a public host, blocks a host that resolves to a private IP, handles DNS failure', async () => {
    expect((await assertPublicUrl('https://example.com', async () => ['93.184.216.34'])).ok).toBe(true);
    const blocked = await assertPublicUrl('https://rebind.example', async () => ['127.0.0.1']);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe('url_blocked_ssrf');
    const dnsFail = await assertPublicUrl('https://nope.example', async () => { throw new Error('nxdomain'); });
    expect(dnsFail.ok).toBe(false);
    if (!dnsFail.ok) expect(dnsFail.reason).toBe('dns_failed');
  });
});
