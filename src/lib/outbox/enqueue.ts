import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/types/database';

/**
 * SERVER ONLY. Enqueue an email job. C6: dedupe_key is required + unique, so a
 * retried server action never double-sends — a duplicate key is a no-op and the
 * existing row id is returned. The worker (outbox/worker.ts) delivers it.
 */
/** A pointer to a private-bucket object the worker downloads + attaches at send time (P15). Never bytes. */
export type OutboxEmailAttachment = { bucket: string; path: string; filename: string; mimeType: string };

export type OutboxEmailPayload = {
  to: string;
  template: 'invite' | 'password_reset' | 'website_report';
  subject: string;
  vars: Record<string, string>;
  from?: string;
  replyTo?: string;
  attachment?: OutboxEmailAttachment;
};

/** Deterministic dedupe key, e.g. `password_reset:user@x.com:<token-jti>`. */
export function emailDedupeKey(template: string, to: string, purposeToken: string): string {
  return `${template}:${to.trim().toLowerCase()}:${purposeToken}`;
}

export async function enqueueEmail(
  payload: OutboxEmailPayload,
  dedupeKey: string,
  organizationId?: string | null,
): Promise<string | null> {
  const supabase = createAdminClient();
  const inserted = await supabase
    .from('outbox')
    .insert({
      dedupe_key: dedupeKey,
      payload: payload as unknown as Json,
      organization_id: organizationId ?? null,
    })
    .select('id')
    .maybeSingle();

  if (!inserted.error && inserted.data) return inserted.data.id;

  // Likely a duplicate dedupe_key — return the existing row instead of inserting twice.
  const existing = await supabase.from('outbox').select('id').eq('dedupe_key', dedupeKey).maybeSingle();
  return existing.data?.id ?? null;
}

/**
 * SERVER ONLY. WAF-4 auto-pilot: enqueue a background report-generation job on the generic outbox using a
 * distinct `channel` so the worker dispatches it to the generation handler instead of the email sender. The
 * payload is intentionally minimal (just the submission id) — the worker reloads everything it needs under
 * the service role. The dedupe_key (one per domain per day) makes a duplicate submission a no-op.
 */
export type OutboxReportGenerationPayload = { kind: 'report_generation'; funnelSubmissionId: string };

/** Deterministic per-domain-per-day key, e.g. `auto_report:example.ch:2026-06-13`. */
export function autoReportDedupeKey(domainOrId: string, day: string): string {
  return `auto_report:${domainOrId.trim().toLowerCase()}:${day}`;
}

export async function enqueueReportGeneration(funnelSubmissionId: string, dedupeKey: string): Promise<string | null> {
  const supabase = createAdminClient();
  const payload: OutboxReportGenerationPayload = { kind: 'report_generation', funnelSubmissionId };
  const inserted = await supabase
    .from('outbox')
    .insert({
      channel: 'report_generation',
      dedupe_key: dedupeKey,
      payload: payload as unknown as Json,
    })
    .select('id')
    .maybeSingle();

  if (!inserted.error && inserted.data) return inserted.data.id;

  // Duplicate dedupe_key (same domain, same day) — treat as a no-op and return the existing job id.
  const existing = await supabase.from('outbox').select('id').eq('dedupe_key', dedupeKey).maybeSingle();
  return existing.data?.id ?? null;
}
