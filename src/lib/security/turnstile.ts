import 'server-only';
import { env } from '@/lib/env';

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Server-side Cloudflare Turnstile verification.
 *
 * Fail-safe (P4-D6): when no secret is configured, returns `true` so public
 * forms keep working until the keys are provisioned. When configured, a missing
 * or invalid token returns `false`. Never throws.
 */
export async function verifyTurnstile(
  token: string | undefined | null,
  remoteIp?: string | null,
): Promise<boolean> {
  const secret = env.turnstileSecret;
  if (!secret) return true; // not configured yet → do not block
  if (!token) return false;
  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp && remoteIp !== 'unknown') body.set('remoteip', remoteIp);
    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** True when a Turnstile secret is configured. */
export function turnstileConfigured(): boolean {
  return !!env.turnstileSecret;
}

// The visitor IP lives in ./client-ip.ts (X-Real-IP set by Caddy).
export { clientIp } from './client-ip';
