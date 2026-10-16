// @vitest-environment node
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/leads/route';
import { resetRateLimits } from '@/lib/security/memory-ratelimit';

const SECRET = 'f'.repeat(64);

const contact = {
  formType: 'contact',
  firstname: 'Anna',
  lastname: 'Peeters',
  email: 'anna@example.be',
  company: 'Peeters BV',
  phone: '+32 3 123 45 67',
  message: 'Wij zoeken een configurator.',
  consent: true,
  lang: 'nl',
};

function post(headers: Record<string, string> = {}, body: unknown = contact) {
  return POST(
    new NextRequest('http://localhost/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body),
    }),
  );
}

type Sent = { url: string; headers: Record<string, string> };
let sent: Sent[];
let upstream: { status: number; body: unknown };

beforeEach(() => {
  resetRateLimits();
  sent = [];
  upstream = { status: 200, body: { ok: true } };
  process.env.SEMANU_SUPABASE_ANON_KEY = 'anon-test';
  process.env.SEMANU_EU_FORWARD_SECRET = SECRET;
  delete process.env.TURNSTILE_SECRET_KEY;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init: RequestInit) => {
      sent.push({ url: String(url), headers: init.headers as Record<string, string> });
      return new Response(JSON.stringify(upstream.body), { status: upstream.status });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.SEMANU_EU_FORWARD_SECRET;
  delete process.env.SEMANU_SUPABASE_ANON_KEY;
});

describe('/api/leads rate limit (X-Real-IP from Caddy)', () => {
  it('5 submissions from one IP pass, the 6th gets 429 rate_limited', async () => {
    for (let i = 0; i < 5; i++) expect((await post({ 'X-Real-IP': '203.0.113.5' })).status).toBe(200);
    const res = await post({ 'X-Real-IP': '203.0.113.5' });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
    expect(sent).toHaveLength(5);
  });

  it('different IPs have independent limits', async () => {
    for (let i = 0; i < 5; i++) await post({ 'X-Real-IP': '203.0.113.5' });
    expect((await post({ 'X-Real-IP': '203.0.113.5' })).status).toBe(429);
    expect((await post({ 'X-Real-IP': '203.0.113.6' })).status).toBe(200);
    expect((await post({ 'X-Real-IP': '2001:db8::1' })).status).toBe(200);
  });

  it('a client-supplied X-Forwarded-For cannot escape the limit', async () => {
    for (let i = 0; i < 5; i++) {
      await post({ 'X-Real-IP': '203.0.113.5', 'X-Forwarded-For': `198.51.100.${i}` });
    }
    expect((await post({ 'X-Real-IP': '203.0.113.5', 'X-Forwarded-For': '198.51.100.99' })).status).toBe(429);
  });
});

describe('/api/leads forwarding to submit-contact', () => {
  it('sends the secret and the Caddy IP, never the client XFF', async () => {
    await post({ 'X-Real-IP': '203.0.113.5', 'X-Forwarded-For': '6.6.6.6' });
    expect(sent[0].url).toContain('/functions/v1/submit-contact');
    expect(sent[0].headers['X-Forward-Secret']).toBe(SECRET);
    expect(sent[0].headers['X-Visitor-IP']).toBe('203.0.113.5');
    expect(sent[0].headers['X-Forwarded-For']).toBeUndefined();
  });

  it('sends no forwarding headers when the secret is not configured', async () => {
    delete process.env.SEMANU_EU_FORWARD_SECRET;
    await post({ 'X-Real-IP': '203.0.113.5' });
    expect(sent[0].headers['X-Forward-Secret']).toBeUndefined();
    expect(sent[0].headers['X-Visitor-IP']).toBeUndefined();
  });

  it('does not forward an IP when X-Real-IP is missing or malformed', async () => {
    await post({ 'X-Real-IP': '203.0.113.5, 1.1.1.1' });
    expect(sent[0].headers['X-Visitor-IP']).toBeUndefined();
    expect(sent[0].headers['X-Forward-Secret']).toBe(SECRET);
  });

  it('passes a submit-contact 429 on as 429 rate_limited', async () => {
    upstream = { status: 429, body: { ok: false, error: 'rate_limited' } };
    const res = await post({ 'X-Real-IP': '203.0.113.5' });
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: 'rate_limited' });
  });

  it('other upstream failures stay 502', async () => {
    upstream = { status: 500, body: { ok: false, error: 'x' } };
    expect((await post({ 'X-Real-IP': '203.0.113.5' })).status).toBe(502);
  });
});
