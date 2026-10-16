import 'server-only';
import { NextResponse } from 'next/server';
import { isPlatformSuperAdmin } from '@/lib/security/authorize';
import { fetchGa4Summary, fetchGscSummary } from '@/lib/google/marketing';

// Pulls live data per request and uses the Node runtime (the Google client
// libraries are not Edge compatible).
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * GET /api/admin/marketing-report
 *
 * Returns a combined GA4 + Search Console snapshot as JSON. Locked to the
 * platform super admin (Supabase session). One source failing (e.g. access not
 * granted yet) does not break the other — the error is reported inline.
 */
export async function GET() {
  if (!(await isPlatformSuperAdmin())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [ga4, gsc] = await Promise.allSettled([fetchGa4Summary(), fetchGscSummary()]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    ga4: ga4.status === 'fulfilled' ? ga4.value : { error: String(ga4.reason?.message ?? ga4.reason) },
    gsc: gsc.status === 'fulfilled' ? gsc.value : { error: String(gsc.reason?.message ?? gsc.reason) },
  });
}
