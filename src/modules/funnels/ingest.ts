import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json } from '@/lib/types/database';
import { logEvent } from '@/lib/audit/log';
import type { FunnelSubmitInput } from '@/lib/validation';
import { normalizeEmail, normalizeDomain } from './guards';

/**
 * SERVER ONLY public funnel ingestion (called by /api/funnels/submit, service role). Inserts the snapshot
 * and BEST-EFFORT links to an existing CRM contact (by email) or company (by domain) when there is exactly
 * one reliable match — it NEVER auto-creates CRM rows and NEVER overwrites CRM data. Client-provided
 * status/owner/contact/company/spam values are not part of `FunnelSubmitInput` and are never used. Returns
 * a plain boolean result; the route always responds `{ok:true}` so it never reveals contact existence.
 */
/** One website_analysis request per email per this many days (cost + spam guard). */
const WEBSITE_ANALYSIS_COOLDOWN_DAYS = 30;

export async function ingestFunnelSubmission(
  data: FunnelSubmitInput,
  meta: { ipHash: string | null; userAgentHash: string | null },
): Promise<{ ok: boolean; id?: string; duplicate?: boolean; previousAt?: string }> {
  const admin = createAdminClient();
  const email = normalizeEmail(data.email);
  const normalizedDomain = normalizeDomain(data.website);

  try {
    // 30-day cooldown: block a repeat website_analysis request from the same email (no new lead, no AI spend).
    if (data.sourceType === 'website_analysis') {
      const since = new Date(Date.now() - WEBSITE_ANALYSIS_COOLDOWN_DAYS * 86_400_000).toISOString();
      const { data: recent } = await admin
        .from('funnel_submissions')
        .select('id, created_at')
        .eq('source_type', 'website_analysis')
        .eq('email', email)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(1);
      if (recent && recent.length > 0) {
        await logEvent({
          action: 'funnel.duplicate_blocked', actorId: null, actorType: 'system', source: 'public_link',
          entityType: 'funnel', entityId: recent[0].id, metadata: { reason: 'email_cooldown', days: WEBSITE_ANALYSIS_COOLDOWN_DAYS },
        });
        return { ok: true, duplicate: true, previousAt: recent[0].created_at };
      }
    }

    const { data: row, error } = await admin
      .from('funnel_submissions')
      .insert({
        source_type: data.sourceType,
        status: 'new',
        spam_status: 'pending',
        first_name: data.firstName,
        last_name: data.lastName,
        email,
        website_url: data.website ?? null,
        normalized_domain: normalizedDomain,
        company_name: null,
        payload: (data.payload ?? {}) as Json,
        utm_source: data.utmSource ?? null,
        utm_medium: data.utmMedium ?? null,
        utm_campaign: data.utmCampaign ?? null,
        utm_term: data.utmTerm ?? null,
        utm_content: data.utmContent ?? null,
        referrer: data.referrer ?? null,
        page_path: data.pagePath ?? null,
        locale: data.locale ?? null,
        ip_hash: meta.ipHash,
        user_agent_hash: meta.userAgentHash,
        consent_privacy: data.consentPrivacy === true,
        consent_marketing: data.consentMarketing ?? false,
      })
      .select('id')
      .single();
    if (error || !row) return { ok: false };

    // Best-effort CRM LINK ONLY (never create, never overwrite). Exactly-one match required.
    let linkedContact: string | null = null;
    let linkedCompany: string | null = null;

    const { data: contacts } = await admin
      .from('company_contacts')
      .select('id, company_id, email, archived_at')
      .ilike('email', email);
    const contactMatches = (contacts ?? []).filter((c) => !c.archived_at && (c.email ?? '').toLowerCase() === email);
    if (contactMatches.length === 1) {
      linkedContact = contactMatches[0].id;
      linkedCompany = contactMatches[0].company_id;
      await admin.from('funnel_submissions').update({ contact_id: linkedContact, company_id: linkedCompany }).eq('id', row.id);
    } else if (normalizedDomain) {
      const { data: companies } = await admin.from('companies').select('id, archived_at').eq('domain', normalizedDomain);
      const companyMatches = (companies ?? []).filter((c) => !c.archived_at);
      if (companyMatches.length === 1) {
        linkedCompany = companyMatches[0].id;
        await admin.from('funnel_submissions').update({ company_id: linkedCompany }).eq('id', row.id);
      }
    }

    await logEvent({
      action: 'funnel.submitted',
      actorId: null,
      actorType: 'external_user',
      source: 'public_link',
      entityType: 'funnel',
      entityId: row.id,
      metadata: { source_type: data.sourceType, has_website: !!data.website, locale: data.locale ?? null },
    });
    if (linkedContact) {
      await logEvent({ action: 'funnel.linked_contact', actorId: null, actorType: 'system', source: 'public_link', entityType: 'funnel', entityId: row.id, metadata: { contact_id: linkedContact, company_id: linkedCompany } });
    } else if (linkedCompany) {
      await logEvent({ action: 'funnel.linked_company', actorId: null, actorType: 'system', source: 'public_link', entityType: 'funnel', entityId: row.id, metadata: { company_id: linkedCompany } });
    }
    return { ok: true, id: row.id };
  } catch (err) {
    console.error('[funnels/ingest] failed:', err instanceof Error ? err.message : 'unknown');
    return { ok: false };
  }
}
