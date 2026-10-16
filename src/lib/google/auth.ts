import 'server-only';
import { GoogleAuth } from 'google-auth-library';
import { env } from '@/lib/env';

/**
 * Read-only Google auth for the marketing data pipeline (GA4 + Search Console).
 *
 * Uses a single Google Cloud *service account* whose JSON key is stored, base64
 * encoded, in GOOGLE_SA_B64. The same service account email must be granted:
 *   - Viewer on the GA4 property (Admin → Property Access Management)
 *   - a user on the Search Console site (Settings → Users and permissions)
 *
 * The key never lives in the codebase; it is read from the environment at runtime.
 */
const SCOPES = [
  'https://www.googleapis.com/auth/analytics.readonly',
  'https://www.googleapis.com/auth/webmasters.readonly',
];

export function googleAuth(): GoogleAuth {
  const b64 = env.googleSaB64;
  if (!b64) {
    throw new Error(
      'GOOGLE_SA_B64 is not set. Add the base64 encoded service account JSON key to your environment.',
    );
  }
  let credentials: { client_email: string; private_key: string };
  try {
    credentials = JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
  } catch {
    throw new Error('GOOGLE_SA_B64 is not valid base64 encoded JSON.');
  }
  return new GoogleAuth({ credentials, scopes: SCOPES });
}
