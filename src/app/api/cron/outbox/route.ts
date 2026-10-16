import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';
import { processPending } from '@/lib/outbox/worker';
import { createAdminClient } from '@/lib/supabase/server';

/** Best-effort: prune dead rate_limit windows so the table cannot grow unbounded. */
async function pruneRateLimit(): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    await createAdminClient().from('rate_limit').delete().lt('window_start', cutoff);
  } catch {
    // Housekeeping only — never fail the cron run on this.
  }
}

/**
 * Outbox worker trigger. Invoked by Vercel Cron (GET with
 * `Authorization: Bearer <CRON_SECRET>`). Sends pending portal emails (e.g.
 * password-reset) via Resend. Locked when CRON_SECRET is unset.
 */
export const dynamic = 'force-dynamic';
// WAF-4: this cron also drives auto report generation (SSRF fetch + AI + external PDF render), which is far
// slower than an email send. Allow up to 300s (Vercel Pro; clamped to the plan max on lower tiers).
export const maxDuration = 300;

async function run(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const provided = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!env.cronSecret || provided !== env.cronSecret) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  // Two passes in one run: pass 1 generates reports (each enqueues its delivery email); pass 2 sends those
  // freshly-enqueued emails — so a single (daily) cron tick both generates AND delivers.
  const first = await processPending(20, 'vercel-cron');
  const second = await processPending(20, 'vercel-cron');
  await pruneRateLimit();
  return NextResponse.json({ first, second });
}

export async function GET(request: NextRequest) {
  return run(request);
}
export async function POST(request: NextRequest) {
  return run(request);
}
