import 'server-only';
import { createHash } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';

/**
 * App-level rate limiting (fixed-window) over the rate_limit table. SERVER ONLY.
 * C7: identifiers are always hashed — never store raw e-mail / IP. Login and
 * password-reset run before a session exists, so we use the service-role client
 * to call hit_rate_limit().
 */

function hashed(value: string): string {
  return createHash('sha256').update(`${env.rateLimitSalt}:${value.trim().toLowerCase()}`).digest('hex');
}

export function ipIdentifier(ip: string): string {
  return `ip_hash:${hashed(ip)}`;
}
export function emailIdentifier(email: string): string {
  return `email_hash:${hashed(email)}`;
}
export function userIdentifier(userId: string): string {
  return `user:${userId}`;
}

/**
 * Returns { allowed } for one hit in (bucket, identifier). Fails OPEN on a
 * limiter error so a transient DB issue never locks legitimate users out.
 */
export async function checkRateLimit(
  bucket: string,
  identifier: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('hit_rate_limit', {
    p_bucket: bucket,
    p_identifier: identifier,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) return { allowed: true };
  return { allowed: data === true };
}
