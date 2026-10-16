import 'server-only';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createAdminClient } from '@/lib/supabase/admin';
import type { LeadSubmission } from './types';

/** Every form submission tied to a lead, newest first (the interaction timeline). */
export async function listLeadSubmissions(leadId: string): Promise<LeadSubmission[]> {
  const admin = createAdminClient() as unknown as SupabaseClient;
  const { data } = await admin
    .from('lead_submissions')
    .select('id, form_type, channel, message, lang, created_at')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false });
  return ((data ?? []) as Array<{
    id: string; form_type: string | null; channel: string | null; message: string | null; lang: string | null; created_at: string;
  }>).map((s) => ({
    id: s.id,
    formType: s.form_type,
    channel: s.channel,
    message: s.message,
    lang: s.lang,
    createdAt: s.created_at,
  }));
}
