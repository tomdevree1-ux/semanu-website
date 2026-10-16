import 'server-only';
import { createServerSupabase } from '@/lib/supabase/server';
import { hasPermission } from '@/lib/security/authorize';
import type { AuditHistoryRow, Database } from '@/lib/types/database';

/**
 * SERVER ONLY audit readers (C8).
 * - getHistory(): display-safe rows via the audit_history() RPC. No technical
 *   fields (ip, user agent, payloads, before/after). Needs audit.read.
 * - getHistoryTechnical(): raw rows incl. technical fields. Only returns data
 *   when the caller holds audit.read_technical (also enforced by RLS).
 */

export async function getHistory(
  entityType: string,
  entityId: string,
  limit = 50,
  offset = 0,
): Promise<AuditHistoryRow[]> {
  const supabase = await createServerSupabase();
  const { data } = await supabase.rpc('audit_history', {
    p_entity_type: entityType,
    p_entity_id: entityId,
    p_limit: limit,
    p_offset: offset,
  });
  return data ?? [];
}

type RawAuditRow = Database['public']['Tables']['audit_logs']['Row'];

export async function getHistoryTechnical(
  entityType: string,
  entityId: string,
  limit = 50,
): Promise<RawAuditRow[]> {
  if (!(await hasPermission('audit.read_technical'))) return [];
  const supabase = await createServerSupabase();
  const { data } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data as RawAuditRow[] | null) ?? [];
}
