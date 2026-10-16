import 'server-only';
import { env } from '@/lib/env';
import { isValidIp } from '@/lib/security/client-ip';
import type { AnalysisLeadInput, ContactLeadInput, ContactInterest } from '@/lib/validation';

/**
 * Forwards a public form submission to the SEMANU edge function
 * `submit-contact` (Supabase, see the Website repo). That function does the
 * spam scoring, rate limiting, MX check and dedupe, and calls create_lead()
 * so the submission lands as company + person + card on the SEMANU leads board,
 * plus a notification mail to the SEMANU inbox.
 *
 * Payload contract (submit-contact/index.ts): name, email, company, topic,
 * topic_label, message (max 5000), lang (nl|en|de|fr), utm_source, utm_medium,
 * utm_campaign, _company_url (honeypot), _ts (render time, 2 s .. 1 h).
 */

/** Our service ids → submit-contact topics. submit-contact maps the topic to a
 *  board service: configurator → 3d_configurator, custom → custom_software,
 *  ai → workflow_automation, anything else (no topic, e.g. only "not sure")
 *  → consultancy. That fallback is a backend board value only: consultancy is
 *  no longer offered as a service on the site (2026-10). */
const TOPIC_BY_INTEREST: Partial<Record<ContactInterest, string>> = {
  '3d-configurators': 'configurator',
  'ai-native': 'custom',
  'business-systems': 'custom',
  'marketing-automation': 'ai',
};

const INTEREST_LABEL: Record<ContactInterest, string> = {
  '3d-configurators': '3D-configurator',
  'ai-native': 'Bedrijfssoftware',
  'business-systems': 'Maatwerksoftware',
  'marketing-automation': 'Workflowautomatisering',
  'not-sure': 'Nog niet zeker',
};

/** Only the first ticked service decides the board service; all ticked
 *  services travel along in the topic label. */
function topicFor(interests: readonly ContactInterest[] | undefined): { topic: string; label: string } {
  const list = interests ?? [];
  const first = list.find((i) => TOPIC_BY_INTEREST[i]);
  return {
    topic: first ? (TOPIC_BY_INTEREST[first] ?? '') : '',
    label: list.map((i) => INTEREST_LABEL[i]).join(', '),
  };
}

function langFor(l: string | undefined): 'nl' | 'en' | 'de' | 'fr' {
  return l === 'en' || l === 'de' || l === 'fr' || l === 'nl' ? l : l === 'es' ? 'en' : 'nl';
}

type Attribution = {
  sourceLocale?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  gclid?: string;
  referrer?: string;
  pagePath?: string;
};

/** submit-contact has no columns for these, so they ride along as a tail line
 *  in the note (same convention as the semanu.be contact form). */
function originTail(a: Attribution): string {
  const bits = [
    'site: semanu.eu',
    a.pagePath ? `pagina: ${a.pagePath}` : '',
    a.sourceLocale ? `taal site: ${a.sourceLocale}` : '',
    a.utmTerm ? `zoekterm: ${a.utmTerm}` : '',
    a.gclid ? 'gclid: ja' : '',
    a.referrer ? `referrer: ${a.referrer}` : '',
  ].filter(Boolean);
  return `\n\n[herkomst: ${bits.join(' · ')}]`;
}

export type SubmitContactPayload = {
  name: string;
  email: string;
  company: string;
  topic: string;
  topic_label: string;
  message: string;
  lang: 'nl' | 'en' | 'de' | 'fr';
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  _company_url: string;
  _ts: number;
};

function clampMessage(body: string, tail: string): string {
  const max = 5000;
  return body.length + tail.length <= max ? body + tail : body.slice(0, max);
}

export function contactPayload(d: ContactLeadInput, now = Date.now()): SubmitContactPayload {
  const { topic, label } = topicFor(d.interests);
  const body = `${d.message}\n\nTelefoon: ${d.phone}`;
  return {
    name: `${d.firstname} ${d.lastname}`.trim(),
    email: d.email,
    company: d.company,
    topic,
    topic_label: label,
    message: clampMessage(body, originTail(d)),
    lang: langFor(d.lang),
    utm_source: d.utmSource ?? null,
    utm_medium: d.utmMedium ?? null,
    utm_campaign: d.utmCampaign ?? null,
    _company_url: d.website ?? '',
    _ts: d.renderedAt ?? now - 5000,
  };
}

export function analysisPayload(d: AnalysisLeadInput, now = Date.now()): SubmitContactPayload {
  const body =
    `Aanvraag website-analyse voor: ${d.website}` +
    `\nMarketingtoestemming: ${d.consentMarketing ? 'ja' : 'nee'}`;
  return {
    name: `${d.firstName} ${d.lastName}`.trim(),
    email: d.email,
    company: '',
    topic: 'website-analyse',
    topic_label: 'Website-analyse',
    message: clampMessage(body, originTail(d)),
    lang: langFor(d.sourceLocale),
    utm_source: d.utmSource ?? null,
    utm_medium: d.utmMedium ?? null,
    utm_campaign: d.utmCampaign ?? null,
    _company_url: d.companyUrl ?? '',
    _ts: d.renderedAt ?? now - 5000,
  };
}

/**
 * Request headers for submit-contact. X-Forward-Secret and X-Visitor-IP are only
 * sent when the shared secret is configured; X-Visitor-IP only for a valid IP
 * (from X-Real-IP, set by Caddy). submit-contact ignores X-Visitor-IP unless the
 * secret matches its own SEMANU_EU_FORWARD_SECRET.
 */
export function submitContactHeaders(
  anonKey: string,
  forwardSecret: string,
  visitorIp?: string,
): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  };
  if (forwardSecret) {
    headers['X-Forward-Secret'] = forwardSecret;
    if (visitorIp && isValidIp(visitorIp)) headers['X-Visitor-IP'] = visitorIp;
  }
  return headers;
}

export type ForwardResult = 'ok' | 'rate_limited' | 'error';

/** Maps the submit-contact answer onto our result. 429 only comes back for a
 *  trusted forward (valid secret); the public path always answers ok there. */
export function interpretSubmitContact(status: number, data: { ok?: boolean; error?: string } | null): ForwardResult {
  if (status === 429 || data?.error === 'rate_limited') return 'rate_limited';
  if (status < 200 || status >= 300 || !data || data.ok !== true) return 'error';
  return 'ok';
}

/**
 * POST the payload to submit-contact. Never throws. `visitorIp` (X-Real-IP from
 * Caddy) travels as X-Visitor-IP together with the shared secret, so the
 * function rate limits per visitor instead of per server.
 */
export async function forwardToSubmitContact(
  payload: SubmitContactPayload,
  visitorIp?: string,
): Promise<ForwardResult> {
  const key = env.semanuSupabaseAnonKey;
  if (!key) {
    console.error('[leads] SEMANU_SUPABASE_ANON_KEY is not set; submission not forwarded');
    return 'error';
  }
  try {
    const res = await fetch(`${env.semanuSupabaseUrl}/functions/v1/submit-contact`, {
      method: 'POST',
      headers: submitContactHeaders(key, env.semanuEuForwardSecret, visitorIp),
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string } | null;
    const result = interpretSubmitContact(res.status, data);
    if (result !== 'ok') console.error(`[leads] submit-contact answered ${res.status} (${result})`);
    return result;
  } catch (err) {
    console.error('[leads] submit-contact unreachable:', err);
    return 'error';
  }
}
