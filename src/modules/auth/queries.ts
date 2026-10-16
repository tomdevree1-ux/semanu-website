import 'server-only';
import { headers } from 'next/headers';
import { createHash } from 'node:crypto';
import { env } from '@/lib/env';

/** Per-request IP + user-agent for audit/rate-limit. SERVER ONLY. */
export async function requestContext(): Promise<{ ip: string; userAgent: string | null }> {
  const h = await headers();
  const fwd = h.get('x-forwarded-for') ?? '';
  const ip = (fwd.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown').slice(0, 64);
  return { ip, userAgent: h.get('user-agent') };
}

/** Salted hash of an email for technical-only audit metadata (never store the raw address). */
export function emailHash(email: string): string {
  return createHash('sha256')
    .update(`${env.rateLimitSalt}:${email.trim().toLowerCase()}`)
    .digest('hex');
}

/** Open-redirect guard: only allow internal `/app/...` targets. */
export function safeNext(next: string | null | undefined): string {
  if (
    typeof next === 'string' &&
    next.startsWith('/app/') &&
    !next.startsWith('/app//') &&
    !next.includes('://') &&
    !next.includes('\\')
  ) {
    return next;
  }
  return '/app/dashboard';
}
