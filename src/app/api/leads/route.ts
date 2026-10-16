import { NextResponse, type NextRequest } from 'next/server';
import { leadSchema } from '@/lib/validation';
import { verifyTurnstile } from '@/lib/security/turnstile';
import { clientIp } from '@/lib/security/client-ip';
import { analysisPayload, contactPayload, forwardToSubmitContact } from '@/lib/semanu-leads';
import { hitRateLimit } from '@/lib/security/memory-ratelimit';

export const runtime = 'nodejs';

/**
 * POST /api/leads: receives the contact form (formType 'contact') and the
 * website analysis form (formType 'analysis'), validates them and forwards them
 * server side to the SEMANU edge function submit-contact, which creates
 * company + person + card on the SEMANU leads board. Nothing is stored here.
 */
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  // Honeypots: silently accept (so bots think they succeeded) but do not forward.
  if (data.formType === 'contact' ? data.website : data.companyUrl) {
    return NextResponse.json({ ok: true });
  }

  // First line of defence on our own server (one Node process per environment):
  // max 5 submissions per visitor IP per hour. submit-contact adds its own limits
  // per visitor (we forward the IP with the shared secret) and per email address.
  // The IP is X-Real-IP set by Caddy; a missing one shares the 'unknown' bucket.
  const ip = clientIp(req);
  if (!hitRateLimit(`leads:${ip}`, 5, 3600)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ error: 'captcha' }, { status: 400 });
  }

  const body = data.formType === 'contact' ? contactPayload(data) : analysisPayload(data);
  const result = await forwardToSubmitContact(body, ip === 'unknown' ? undefined : ip);
  if (result === 'rate_limited') return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  if (result !== 'ok') return NextResponse.json({ error: 'server_error' }, { status: 502 });
  return NextResponse.json({ ok: true });
}
