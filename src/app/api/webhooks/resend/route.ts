import { NextResponse, type NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { env } from '@/lib/env';
import { verifyResendSignature, parseResendEvent } from '@/modules/website-reports/engagement-events';
import { applyResendEvent } from '@/modules/website-reports/engagement';

export const runtime = 'nodejs';

/**
 * POST /api/webhooks/resend — Resend (Svix) email event sink (P16 / WAF-3.1). Reflects delivery engagement
 * (delivered/bounced/complained, and — behind ENABLE_EMAIL_OPEN_CLICK_TRACKING — the indicative opened/clicked)
 * onto the matching website_report_deliveries row. Mirrors the Stripe-webhook posture.
 *
 * Response policy (per the approved P16 decisions):
 *  - ENABLE_RESEND_WEBHOOK off            → 200 { ignored: true } (ships dark; a stray registration is a no-op)
 *  - missing / invalid / stale signature  → 400 (nothing parsed or processed)
 *  - duplicate event (svix-id seen)       → 200 { ignored: true }
 *  - unknown / unmatched / unsupported     → 200 { ignored: true }
 *  - dedup insert fails (infra)           → 500 (a retry is useful — nothing was recorded yet)
 *  - apply fails after dedup              → 200 (already recorded; a retry would be skipped) + safe log
 *
 * Verification is the only gate (no auth context on a webhook). The raw body is parsed ONLY after the signature
 * verifies. Writes are service-role only; nothing is ever sent from here.
 */
export async function POST(req: NextRequest) {
  // Ships dark: when the flag is off the route processes nothing.
  if (!env.enableResendWebhook) return NextResponse.json({ ignored: true });

  const raw = await req.text();
  const headers = {
    id: req.headers.get('svix-id'),
    timestamp: req.headers.get('svix-timestamp'),
    signature: req.headers.get('svix-signature'),
  };

  const verdict = verifyResendSignature({ payload: raw, headers, secret: env.resendWebhookSecret });
  if (!verdict.ok) {
    console.warn('[webhooks/resend] signature rejected:', verdict.reason);
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  // Parse only AFTER the signature verifies. A verified-but-malformed body cannot be processed and will not
  // change on retry → acknowledge so Resend stops retrying.
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ignored: true });
  }
  const event = parseResendEvent(json);
  if (!event) return NextResponse.json({ ignored: true });

  // Dedup on the svix-id (stable across Resend retries of the same delivery). Insert-first makes processing
  // idempotent and records late/unmatched events as seen. Verification guarantees a non-null id here.
  const eventId = headers.id as string;
  const admin = createAdminClient();
  const events = admin.from('resend_events') as unknown as {
    insert: (v: { id: string; type: string }) => Promise<{ error: { code?: string } | null }>;
  };
  const { error: insErr } = await events.insert({ id: eventId, type: event.type });
  if (insErr) {
    if (insErr.code === '23505') return NextResponse.json({ ignored: true }); // already processed
    // Could not even record the event → a Resend retry is useful.
    console.error('[webhooks/resend] dedup insert failed:', insErr.code ?? 'unknown');
    return NextResponse.json({ error: 'dedup_failed' }, { status: 500 });
  }

  try {
    await applyResendEvent(event);
  } catch (e) {
    // Already deduped, so a retry would be skipped → acknowledge and log safely. Engagement is supplementary;
    // a rare lost event is acceptable (reliable bounce/complaint will also surface in Resend's dashboard).
    console.error('[webhooks/resend] apply failed:', e instanceof Error ? e.message : 'unknown');
  }

  return NextResponse.json({ received: true });
}
