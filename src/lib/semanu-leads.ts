import 'server-only';
import { env } from '@/lib/env';
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
 *  ai → workflow_automation, anything else → consultancy. */
const TOPIC_BY_INTEREST: Partial<Record<ContactInterest, string>> = {
  '3d-configurators': 'configurator',
  'ai-native': 'custom',
  'business-systems': 'custom',
  'marketing-automation': 'ai',
  consultancy: 'consultancy',
};

const INTEREST_LABEL: Record<ContactInterest, string> = {
  '3d-configurators': '3D-configurator',
  'ai-native': 'Bedrijfssoftware',
  'business-systems': 'Maatwerksoftware',
  'marketing-automation': 'Workflowautomatisering',
  consultancy: 'Consultancy',
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
 * POST the payload to submit-contact. Returns true only when the function
 * answered ok. Never throws. `clientIp` is forwarded as X-Forwarded-For so the
 * function can rate limit per visitor (see the report: submit-contact reads
 * cf-connecting-ip first, which will be our server's address).
 */
export async function forwardToSubmitContact(
  payload: SubmitContactPayload,
  clientIp?: string,
): Promise<boolean> {
  const key = env.semanuSupabaseAnonKey;
  if (!key) {
    console.error('[leads] SEMANU_SUPABASE_ANON_KEY is not set; submission not forwarded');
    return false;
  }
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: key,
      Authorization: `Bearer ${key}`,
    };
    if (clientIp && clientIp !== 'unknown') headers['X-Forwarded-For'] = clientIp;
    const res = await fetch(`${env.semanuSupabaseUrl}/functions/v1/submit-contact`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });
    const data = (await res.json().catch(() => null)) as { ok?: boolean } | null;
    if (!res.ok || !data || data.ok !== true) {
      console.error(`[leads] submit-contact answered ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[leads] submit-contact unreachable:', err);
    return false;
  }
}
