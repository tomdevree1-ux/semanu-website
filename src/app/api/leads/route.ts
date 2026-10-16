import { NextResponse, type NextRequest } from 'next/server';
import { leadSchema } from '@/lib/validation';
import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email';
import { env } from '@/lib/env';
import { checkRateLimit, ipIdentifier } from '@/lib/security/ratelimit';
import { verifyTurnstile, clientIp } from '@/lib/security/turnstile';
import type { SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

/**
 * POST /api/leads — receives submissions from both the start modal and the
 * contact form (discriminated by `formType`).
 *
 * Phase-3 TODOs are marked inline: this handler validates + stores today;
 * Turnstile verification and the admin notification email are stubbed.
 */
export async function POST(req: NextRequest) {
  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'validation', issues: parsed.error.flatten() },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Honeypot: silently accept (so bots think they succeeded) but don't store.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  // Abuse hardening (P4): app-level rate limit (hashed IP) + Turnstile verify.
  const ip = clientIp(req);
  if (!(await checkRateLimit('leads', ipIdentifier(ip), 10, 3600)).allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }
  if (!(await verifyTurnstile(data.turnstileToken, ip))) {
    return NextResponse.json({ error: 'captcha' }, { status: 400 });
  }

  const isContact = data.formType === 'contact';
  const channel = isContact ? 'contact_form' : 'website_seo_analysis';
  const lang = isContact ? data.lang : data.sourceLocale ?? 'de';

  const supabase = createAdminClient() as unknown as SupabaseClient;
  let leadId: string | null = null;
  let isReturning = false;
  try {
    // Deduplicate: one lead per person. Match an existing lead by email, then phone.
    let existing: { id: string; phone: string | null; company: string | null } | null = null;
    const { data: byEmail } = await supabase
      .from('leads')
      .select('id, phone, company')
      .ilike('email', data.email)
      .limit(1)
      .maybeSingle();
    existing = byEmail ?? null;
    if (!existing && isContact && data.phone) {
      const { data: byPhone } = await supabase
        .from('leads')
        .select('id, phone, company')
        .eq('phone', data.phone)
        .limit(1)
        .maybeSingle();
      existing = byPhone ?? null;
    }

    if (existing) {
      // Returning lead: no duplicate — just fill in any newly provided details.
      isReturning = true;
      leadId = existing.id;
      const patch: Record<string, unknown> = {};
      if (isContact && data.phone && !existing.phone) patch.phone = data.phone;
      if (isContact && data.company && !existing.company) patch.company = data.company;
      if (Object.keys(patch).length) await supabase.from('leads').update(patch).eq('id', existing.id);
    } else {
      const { data: inserted, error } = await supabase
        .from('leads')
        .insert({
          form_type: data.formType,
          firstname: data.firstname,
          lastname: data.lastname,
          email: data.email,
          company: isContact ? data.company ?? null : null,
          phone: isContact ? data.phone ?? null : null,
          message: data.message ?? null,
          lang,
          consent: data.consent,
          source_locale: data.sourceLocale ?? null,
          user_agent: req.headers.get('user-agent'),
          utm_source: data.utmSource ?? null,
          utm_medium: data.utmMedium ?? null,
          utm_campaign: data.utmCampaign ?? null,
          utm_term: data.utmTerm ?? null,
          utm_content: data.utmContent ?? null,
          gclid: data.gclid ?? null,
          referrer: data.referrer ?? null,
          page_path: data.pagePath ?? null,
          source: deriveSource(data),
          creation_source: 'inbound_web',
          channel,
        })
        .select('id')
        .single();
      if (error) throw error;
      leadId = inserted?.id ?? null;
    }

    // Record this submission on the lead's timeline (new + returning).
    if (leadId) {
      await supabase.from('lead_submissions').insert({
        lead_id: leadId,
        form_type: data.formType,
        channel,
        message: data.message ?? null,
        lang,
        page_path: data.pagePath ?? null,
        source: deriveSource(data),
      });
    }
  } catch (err) {
    console.error('[api/leads] insert failed:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  // Structured pricing configurator payload -> versioned configuration (P9).
  // Non-fatal: the lead is already stored, so a failure here never breaks the form.
  if (data.formType === 'contact' && data.config && leadId) {
    try {
      const cfg = data.config;
      const { data: conf, error: cErr } = await supabase
        .from('configurations')
        .insert({
          title: cfg.title,
          situation: cfg.situation,
          status: 'draft',
          current_version: 1,
          lead_id: leadId,
          source: 'inbound_web',
        })
        .select('id')
        .single();
      if (cErr || !conf) throw cErr ?? new Error('no configuration row');
      const { error: vErr } = await supabase.from('configuration_versions').insert({
        configuration_id: conf.id,
        version: 1,
        payload: cfg,
        monthly_total: cfg.monthly,
        onetime_total: cfg.oneTime,
        note: 'Inbound from website configurator',
      });
      if (vErr) throw vErr;
    } catch (err) {
      console.error('[api/leads] configuration creation failed:', err);
    }
  }

  // Admin notification — built here (where the union narrows), sent after the
  // response so a slow/failed send never blocks or breaks the form.
  const fullName = `${data.firstname} ${data.lastname}`.trim();
  const interestList = data.formType === 'contact' ? data.interests : undefined;
  const fields: Array<[string, string | null | undefined]> = [
    ['Typ', isContact ? 'Kontaktformular' : 'Start'],
    ['Name', fullName],
    ['Email', data.email],
    ['Firma', isContact ? data.company : null],
    ['Telefon', isContact ? data.phone : null],
    ['Interesse', interestLabels(interestList)],
    ['Sprache', isContact ? data.lang : data.sourceLocale ?? 'de'],
    ['Nachricht', data.message],
  ];
  const rowsHtml = fields
    .filter(([, v]) => v != null && String(v).trim() !== '')
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#888;vertical-align:top;white-space:nowrap">${esc(k)}</td><td style="padding:6px 0">${esc(v).replace(/\n/g, '<br>')}</td></tr>`,
    )
    .join('');
  const html =
    `<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1a1a1a">` +
    `<img src="${env.siteUrl}/amai-badge-dark.png" width="44" height="44" alt="amai" style="display:block;margin:0 0 12px" />` +
    `<h2 style="margin:0 0 12px">Neue Anfrage via amai.ch</h2>` +
    `<table style="border-collapse:collapse">${rowsHtml}</table></div>`;

  // Best-effort operator notification, AWAITED. sendEmail never throws (it
  // returns false on failure), so awaiting it cannot break the form. The lead
  // is already stored above regardless. (A previous `after()` fire-and-forget
  // did not run reliably on the serverless host, so contact emails went missing
  // while the funnel emails — which await — arrived.)
  await sendEmail({
    to: env.notificationTo,
    replyTo: data.email,
    subject: `${isReturning ? 'Erneute Anfrage' : 'Neue Anfrage'} von ${fullName}`,
    html,
  });

  return NextResponse.json({ ok: true });
}

/** Readable German labels for the contact form's "interests" values (email body only). */
const INTEREST_LABELS: Record<string, string> = {
  websites: 'Website',
  'email-marketing': 'Email Marketing',
  'marketing-automation': 'Workflow Automatisierung',
  'ai-native': 'AI-native Unternehmenssoftware',
  booking: 'Buchung und Termine',
  'business-systems': 'Business Dashboards',
  'customer-portals': 'Kundenportale',
  crm: 'CRM Systeme',
  'ai-assistants': 'AI Assistenten',
  'not-sure': 'Noch nicht sicher',
};
function interestLabels(v: string[] | undefined): string | null {
  if (!v || v.length === 0) return null;
  return v.map((x) => INTEREST_LABELS[x] ?? x).join(', ');
}

/** Normalize the marketing source/channel from the lead's last-touch attribution. */
function deriveSource(d: { utmSource?: string; utmMedium?: string; gclid?: string }): string {
  const med = (d.utmMedium ?? '').toLowerCase();
  if (d.gclid || med === 'cpc' || med === 'ppc') return 'google_ads';
  const s = (d.utmSource ?? '').toLowerCase();
  if (s) return s;
  if (med === 'organic') return 'organic_search';
  return 'direct_unknown';
}

/** Escape user-provided values before interpolating them into notification HTML. */
function esc(v: unknown): string {
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
