import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import { logEvent } from '@/lib/audit/log';
import { env } from '@/lib/env';
import type { Database } from '@/lib/types/database';
import {
  SUPPORTED_EVENTS,
  computeEngagementEffect,
  type ParsedResendEvent,
} from './engagement-events';

/**
 * SERVER ONLY engagement reconciler (P16 / WAF-3.1). Called by the signature-verified, deduplicated
 * `/api/webhooks/resend` route. Matches a parsed Resend event to its `website_report_deliveries` row by
 * `provider_message_id` and applies the computed engagement patch (see `engagement-events.ts`) via the service
 * role, writes a safe audit event, and reflects reliable delivery state onto `email_log.status`.
 *
 * Invariants: never mutates the CRM, never changes the funnel status, never sends email, never stores IP /
 * user-agent / raw provider payload. Opened/clicked are gated by ENABLE_EMAIL_OPEN_CLICK_TRACKING. An unmatched
 * `provider_message_id` is a no-op (the route still records the event id as processed and returns 200).
 */
type Admin = ReturnType<typeof createAdminClient>;

/**
 * Reflect a reliable delivery status onto email_log (matched by provider_message_id). Best-effort: a failure
 * here never affects the primary website_report_deliveries update. email_log is RPC-written elsewhere, so this
 * narrow status update is typed locally rather than widening the hand-maintained email_log type.
 */
async function reflectEmailLog(admin: Admin, providerMessageId: string, status: string): Promise<void> {
  try {
    const tbl = admin.from('email_log') as unknown as {
      update: (v: { status: string }) => { eq: (col: string, val: string) => Promise<{ error: unknown }> };
    };
    await tbl.update({ status }).eq('provider_message_id', providerMessageId);
  } catch (e) {
    console.error('[engagement] email_log reflect failed (primary update unaffected):', e instanceof Error ? e.message : 'unknown');
  }
}

export async function applyResendEvent(
  event: ParsedResendEvent,
  opts: { nowIso?: string } = {},
): Promise<{ applied: boolean; reason?: string }> {
  if (!SUPPORTED_EVENTS.has(event.type)) return { applied: false, reason: 'unsupported' };
  const messageId = event.providerMessageId;
  if (!messageId) return { applied: false, reason: 'no_message_id' };

  const admin = createAdminClient();
  // Match the delivery by the Resend message id captured at send time (P15). At most one row per id; limit(1)
  // guards against any accidental duplicate without throwing.
  const { data: rows } = await admin
    .from('website_report_deliveries')
    .select('*')
    .eq('provider_message_id', messageId)
    .order('created_at', { ascending: false })
    .limit(1);
  const d = rows?.[0];
  if (!d) return { applied: false, reason: 'no_delivery' };

  const nowIso = opts.nowIso ?? new Date().toISOString();
  const effect = computeEngagementEffect(event, {
    openClickEnabled: env.enableEmailOpenClickTracking,
    current: {
      status: d.status,
      delivered_at: d.delivered_at,
      bounced_at: d.bounced_at,
      complained_at: d.complained_at,
      first_opened_at: d.first_opened_at,
      open_count: d.open_count ?? 0,
      click_count: d.click_count ?? 0,
    },
    nowIso,
  });
  if (!effect.applied) return { applied: false, reason: effect.reason };

  const update = effect.update as Database['public']['Tables']['website_report_deliveries']['Update'];
  await admin.from('website_report_deliveries').update(update).eq('id', d.id);

  if (effect.auditAction) {
    const warn = effect.auditAction === 'report_delivery.bounced' || effect.auditAction === 'report_delivery.complained';
    await logEvent({
      action: effect.auditAction,
      actorId: null,
      actorType: 'system',
      source: 'webhook',
      severity: warn ? 'warning' : 'info',
      entityType: 'report_delivery',
      entityId: d.id,
      newStatus: effect.auditNewStatus ?? null,
      metadata: { report_id: d.report_id, delivery_id: d.id, event_type: event.type, ...effect.metadata },
    });
  }

  if (effect.emailLogStatus) await reflectEmailLog(admin, messageId, effect.emailLogStatus);

  return { applied: true };
}
