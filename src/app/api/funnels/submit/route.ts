import { NextResponse, type NextRequest } from 'next/server';
import { createHash } from 'node:crypto';
import { funnelSubmitSchema } from '@/lib/validation';
import { env } from '@/lib/env';
import { checkRateLimit, ipIdentifier, emailIdentifier } from '@/lib/security/ratelimit';
import { verifyTurnstile, clientIp } from '@/lib/security/turnstile';
import { ingestFunnelSubmission } from '@/modules/funnels/ingest';
import { notifyNewFunnelSubmission } from '@/modules/funnels/notify';
import { normalizeDomain } from '@/modules/funnels/guards';
import { enqueueReportGeneration, autoReportDedupeKey } from '@/lib/outbox/enqueue';
import { shouldEnqueueAutoGeneration } from '@/modules/website-reports/auto/policy';

export const runtime = 'nodejs';

/**
 * POST /api/funnels/submit — public website funnel / lead-magnet ingestion (P13). Hardened like
 * /api/leads: zod → honeypot → rate-limit (IP + email) → Turnstile → service-role insert + best-effort
 * CRM link. Stores ONLY hashed IP/User-Agent. Never trusts client status/owner/CRM-link fields (not in the
 * schema). ALWAYS returns `{ok:true}` on a valid+passing request so it never reveals whether a contact
 * exists. No crawling, no AI. A BEST-EFFORT internal operator notification email is sent on success (to
 * LEAD_NOTIFICATION_TO, never to the lead; no-op without RESEND_API_KEY; never blocks the response).
 */
function sha256(value: string): string {
  return createHash('sha256').update(`${env.rateLimitSalt}:${value}`).digest('hex');
}

export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = funnelSubmitSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ error: 'validation', issues: parsed.error.flatten() }, { status: 422 });
  }
  const data = parsed.data;

  // Honeypot — `companyUrl` is hidden and must be empty (the real website is `website`). Silently accept.
  if (data.companyUrl) return NextResponse.json({ ok: true });

  const ip = clientIp(req);
  if (!(await checkRateLimit('funnels', ipIdentifier(ip), 10, 3600)).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  if (!(await checkRateLimit('funnels_email', emailIdentifier(data.email), 5, 3600)).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ error: 'captcha' }, { status: 400 });
  }

  const ipHash = ip && ip !== 'unknown' ? sha256(ip) : null;
  const ua = req.headers.get('user-agent');
  const userAgentHash = ua ? sha256(ua) : null;

  const result = await ingestFunnelSubmission(data, { ipHash, userAgentHash });
  if (result.duplicate) {
    // Same email already requested a website analysis within the cooldown window — acknowledge, do nothing else.
    return NextResponse.json({ ok: true, alreadyRequested: true, previousAt: result.previousAt ?? null });
  }

  // Best-effort operator notification (never to the lead; sendEmail no-ops without a key and never throws,
  // so this cannot affect the public response or reveal contact existence).
  if (result.ok && result.id) {
    await notifyNewFunnelSubmission(data, result.id);

    // WAF-4: best-effort enqueue of an auto report-generation job (NO AI in this request). Gated by the
    // AUTO_GENERATE_ENABLED flag; the worker re-checks the daily cap + per-domain dedup before any spend.
    // A failure here never affects the public response.
    if (shouldEnqueueAutoGeneration({ enabled: env.autoGenerateEnabled, sourceType: data.sourceType, hasWebsiteUrl: !!data.website })) {
      try {
        const day = new Date().toISOString().slice(0, 10);
        const dedupeKey = autoReportDedupeKey(normalizeDomain(data.website) || result.id, day);
        await enqueueReportGeneration(result.id, dedupeKey);
      } catch (e) {
        // best-effort: never break ingestion, but log so a silent enqueue failure is visible in the logs.
        console.error('[funnels/submit] auto-generation enqueue failed:', e instanceof Error ? e.message : 'unknown');
      }
    }
  }

  // Always a safe success — never reveal whether a contact/email exists or whether the CRM link matched.
  return NextResponse.json({ ok: true });
}
