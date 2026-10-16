/**
 * Shared, house-style email layout (amai! "Marine + Mint").
 *
 * PURE module — no `server-only`, no React, no next-intl — so it can be reused by
 * the Stripe webhook, the outbox worker AND a standalone preview script. The copy
 * for each email lives in `./copy` (one block per locale); this file only lays it
 * out: navy header with the amai! wordmark, a white card, an optional mint info
 * box and a navy pill CTA, a localized "Tom von amai!" sign off and a branded
 * footer.
 *
 * Localization: every email is keyed by EmailLocale. To add a 4th language, add
 * its block to SIGNOFF here and to every table in ./copy — nothing else changes.
 */
import { SIGNATURE_CID } from './signature-photo';

export type EmailLocale = 'de' | 'fr' | 'en' | 'es' | 'nl';

/** The brand wordmark for email HTML (rebrand: "amai", no exclamation). "amai.ch" is left alone. */
const WORDMARK = 'amai';

/** Personal sign off, per the approved copy ("Tom", not "Team"). "amai!" renders as the wordmark. */
const SIGNOFF: Record<EmailLocale, { regards: string; line: string }> = {
  de: { regards: 'Herzliche Grüsse', line: 'Tom von amai!' },
  fr: { regards: 'Meilleures salutations', line: 'Tom de amai!' },
  en: { regards: 'Kind regards', line: 'Tom from amai!' },
  es: { regards: 'Un cordial saludo', line: 'Tom de amai!' },
  nl: { regards: 'Met vriendelijke groet', line: 'Tom van amai!' },
};

/** Brand wordmark styled for the signature (rebrand: navy "amai", no exclamation). */
const WORDMARK_SIG = '<span style="font-weight:bold;color:#16233d">amai</span>';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Escape user/copy text, then render the wordmark for any literal "amai!". "amai.ch" stays plain. */
function brandify(s: string): string {
  return escapeHtml(s).split('amai!').join(WORDMARK);
}

export type BrandedEmailOpts = {
  locale: EmailLocale;
  /** Greeting line incl. name + comma, e.g. "Hallo Tom,". */
  greeting: string;
  /** Body paragraphs (plain text; may contain "amai!"). */
  paragraphs: string[];
  /** Optional mint highlight box (e.g. the chosen plan). */
  infoBox?: { value: string; sub?: string };
  /** Optional navy pill button. */
  cta?: { label: string; url: string };
  /** Paragraphs rendered after the box/CTA (e.g. a reassurance line). */
  paragraphsAfter?: string[];
  /** Append the localized sign off (default true). */
  signoff?: boolean;
};

const P = (html: string) => `<p style="margin:0 0 18px;color:#5b667c">${html}</p>`;

/** Full house-style HTML email. Table based + inline styles for email-client safety. */
export function brandedEmailHtml(o: BrandedEmailOpts): string {
  const body: string[] = [];
  body.push(
    `<p style="margin:0 0 18px;font-size:19px;font-weight:bold;color:#16233d">${brandify(o.greeting)}</p>`,
  );
  for (const p of o.paragraphs) body.push(P(brandify(p)));
  if (o.infoBox) {
    body.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 18px"><tr><td style="background:#e9f3ee;padding:14px 16px;border-radius:10px;font-size:16px;font-weight:bold;color:#16233d">${brandify(
        o.infoBox.value,
      )}${
        o.infoBox.sub
          ? `<br/><span style="font-size:13px;font-weight:normal;color:#5b667c">${brandify(o.infoBox.sub)}</span>`
          : ''
      }</td></tr></table>`,
    );
  }
  if (o.cta) {
    body.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:2px 0 20px"><tr><td bgcolor="#16233d" style="background:#16233d;border-radius:8px"><a href="${escapeHtml(
        o.cta.url,
      )}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:bold;text-decoration:none">${escapeHtml(
        o.cta.label,
      )}</a></td></tr></table>`,
    );
  }
  for (const p of o.paragraphsAfter ?? []) body.push(P(brandify(p)));
  if (o.signoff !== false) {
    const s = SIGNOFF[o.locale];
    body.push(
      `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0"><tr>` +
        `<td style="vertical-align:middle;padding-right:14px"><img src="cid:${SIGNATURE_CID}" width="72" height="62" alt="Tom de Vree" style="display:block;width:72px;height:62px;border-radius:12px;object-fit:cover;border:0"/></td>` +
        `<td style="vertical-align:middle;color:#16233d;font-size:15px;line-height:1.55">${escapeHtml(s.regards)}<br/>${s.line.split('amai!').join(WORDMARK_SIG)}</td>` +
        `</tr></table>`,
    );
  }

  return `<div style="margin:0;padding:0;background:#f4f6fa">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4f6fa" style="background:#f4f6fa;font-family:Arial,Helvetica,sans-serif">
    <tr><td align="center" style="padding:28px 16px">
      <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="width:560px;max-width:100%">
        <tr><td bgcolor="#16233d" style="background:#16233d;border-radius:8px 8px 0 0;padding:22px 30px">
          <span style="font-size:26px;font-weight:bold;letter-spacing:-0.5px;color:#ffffff"><span style="color:#93e6be">&#8250;</span> amai</span>
        </td></tr>
        <tr><td bgcolor="#ffffff" style="background:#ffffff;padding:34px 30px;color:#16233d;font-size:15px;line-height:1.65">
          ${body.join('\n          ')}
        </td></tr>
        <tr><td bgcolor="#ffffff" style="background:#ffffff;border-top:1px solid #e9eef6;border-radius:0 0 8px 8px;padding:18px 30px;color:#5b667c;font-size:12px;line-height:1.6">
          <a href="https://amai.ch" style="color:#16233d;text-decoration:none">amai.ch</a> &nbsp;&middot;&nbsp; <a href="mailto:hello@amai.ch" style="color:#16233d;text-decoration:none">hello@amai.ch</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`;
}

/** Plain-text counterpart (multipart text+HTML improves deliverability). "amai!" stays literal. */
export function brandedEmailText(o: BrandedEmailOpts): string {
  const lines: string[] = [o.greeting, ''];
  for (const p of o.paragraphs) lines.push(p, '');
  if (o.infoBox) lines.push(o.infoBox.value + (o.infoBox.sub ? ` — ${o.infoBox.sub}` : ''), '');
  if (o.cta) lines.push(`${o.cta.label}: ${o.cta.url}`, '');
  for (const p of o.paragraphsAfter ?? []) lines.push(p, '');
  if (o.signoff !== false) {
    const s = SIGNOFF[o.locale];
    lines.push(s.regards, s.line, '');
  }
  lines.push('amai.ch · hello@amai.ch');
  return lines.join('\n');
}
