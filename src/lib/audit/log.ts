import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { ActorType, AuditSeverity, AuditSource, Json } from '@/lib/types/database';

/**
 * SERVER ONLY audit writer. The DB function log_event() is service-role-only
 * (C2): clients cannot call it. The caller MUST pass a server-verified actorId
 * (the session user resolved in the same request) — never trust a client value.
 * Privileged sources ('platform','system_job','webhook','api') and
 * severity='critical' can therefore only originate from trusted server code.
 */
export type LogEventInput = {
  action: string;
  actorId?: string | null;
  actorType?: ActorType;
  entityType?: string | null;
  entityId?: string | null;
  entityDisplayName?: string | null;
  oldStatus?: string | null;
  newStatus?: string | null;
  oldValues?: Json | null;
  newValues?: Json | null;
  metadata?: Json | null;
  organizationId?: string | null;
  severity?: AuditSeverity;
  source?: AuditSource;
  ip?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  sessionId?: string | null;
};

/** Write one audit event. Returns the new audit_log id, or null on failure. */
export async function logEvent(input: LogEventInput): Promise<number | null> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('log_event', {
    p_action: input.action,
    p_actor_id: input.actorId ?? null,
    p_actor_type: input.actorType ?? 'internal_user',
    p_entity_type: input.entityType ?? null,
    p_entity_id: input.entityId ?? null,
    p_entity_display_name: input.entityDisplayName ?? null,
    p_old_status: input.oldStatus ?? null,
    p_new_status: input.newStatus ?? null,
    p_old_values: input.oldValues ?? null,
    p_new_values: input.newValues ?? null,
    p_metadata: input.metadata ?? null,
    p_organization_id: input.organizationId ?? null,
    p_severity: input.severity ?? 'info',
    p_source: input.source ?? 'portal',
    p_ip: input.ip ?? null,
    p_user_agent: input.userAgent ?? null,
    p_request_id: input.requestId ?? null,
    p_session_id: input.sessionId ?? null,
  });
  if (error) return null;
  return data ?? null;
}
