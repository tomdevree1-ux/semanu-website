import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('server-only', () => ({}));

async function load(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  return import('./turnstile');
}

describe('verifyTurnstile (fail closed op productie, november 2026)', () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; vi.restoreAllMocks(); });

  it('weigert op productie zonder secret', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { verifyTurnstile } = await load({ SITE_ENV: 'production', TURNSTILE_SECRET_KEY: undefined });
    expect(await verifyTurnstile('token', '1.2.3.4')).toBe(false);
  });

  it('laat door op acc zonder secret', async () => {
    const { verifyTurnstile } = await load({ SITE_ENV: 'staging', TURNSTILE_SECRET_KEY: undefined });
    expect(await verifyTurnstile(undefined, null)).toBe(true);
  });

  it('weigert zonder token als er een secret is', async () => {
    const { verifyTurnstile } = await load({ SITE_ENV: 'production', TURNSTILE_SECRET_KEY: 'x' });
    expect(await verifyTurnstile('', null)).toBe(false);
  });
});
