/**
 * Send one of each branded email to a preview inbox, using the EXACT same layout
 * (src/lib/email/branded) + copy (src/lib/email/copy) the app sends in production,
 * so what lands in the inbox is what customers get.
 *
 * Run:  npx tsx scripts/send-email-previews.ts
 * Reads RESEND_API_KEY + LEAD_NOTIFICATION_FROM from the environment or .env.local.
 * Target inbox: PREVIEW_TO env or tomdevree1@gmail.com. Subjects are prefixed
 * "[preview]". Sends nothing else and stores nothing.
 */
import { readFileSync } from 'node:fs';
import { brandedEmailHtml, type EmailLocale } from '../src/lib/email/branded';
import { CONFIRMATION, RESET, INVITE, REPORT, greet } from '../src/lib/email/copy';
import { signatureAttachment } from '../src/lib/email/signature-photo';

function fromEnvLocal(key: string): string | undefined {
  try {
    const txt = readFileSync(new URL('../.env.local', import.meta.url), 'utf8');
    const m = txt.match(new RegExp(`^${key}=(.*)$`, 'm'));
    return m ? m[1].trim().replace(/^["']|["']$/g, '') : undefined;
  } catch {
    return undefined;
  }
}

const KEY = process.env.RESEND_API_KEY ?? fromEnvLocal('RESEND_API_KEY');
const FROM = process.env.LEAD_NOTIFICATION_FROM ?? fromEnvLocal('LEAD_NOTIFICATION_FROM') ?? 'amai.ch <hello@amai.ch>';
const TO = process.env.PREVIEW_TO ?? 'tomdevree1@gmail.com';
const LINK = 'https://amai.ch/app/auth/confirm?token_hash=preview';

if (!KEY) {
  console.error('RESEND_API_KEY not found (env or .env.local). Aborting.');
  process.exit(1);
}

type Sample = { id: string; subject: string; html: string };
const samples: Sample[] = [];

// 1. Order confirmation (Business plan, no add on) — DE / FR / EN
for (const locale of ['de', 'fr', 'en'] as EmailLocale[]) {
  const c = CONFIRMATION[locale];
  samples.push({
    id: `confirmation-${locale}`,
    subject: c.subject,
    html: brandedEmailHtml({
      locale,
      greeting: greet(locale, 'Tom'),
      paragraphs: c.paragraphs,
      infoBox: { value: `${c.aboLabel}: Business Website` },
      paragraphsAfter: [c.questions],
    }),
  });
}

// 2. Password reset (EN)
{
  const c = RESET.en;
  samples.push({
    id: 'reset-en',
    subject: c.subject,
    html: brandedEmailHtml({
      locale: 'en',
      greeting: greet('en', 'Tom'),
      paragraphs: c.paragraphs,
      cta: { label: c.ctaLabel, url: LINK },
      paragraphsAfter: [c.after],
    }),
  });
}

// 3. Platform invite (EN)
{
  const c = INVITE.en;
  samples.push({
    id: 'invite-en',
    subject: c.subject,
    html: brandedEmailHtml({
      locale: 'en',
      greeting: greet('en', 'Tom'),
      paragraphs: c.paragraphs,
      cta: { label: c.ctaLabel, url: LINK },
      paragraphsAfter: [c.after],
    }),
  });
}

// 4. Website analysis delivery (DE)
{
  const c = REPORT.de;
  samples.push({
    id: 'report-de',
    subject: c.subject,
    html: brandedEmailHtml({ locale: 'de', greeting: greet('de', 'Tom'), paragraphs: c.paragraphs }),
  });
}

async function main() {
  for (const s of samples) {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [TO], subject: `[preview] ${s.subject}`, html: s.html, attachments: [signatureAttachment()] }),
    });
    console.log(`${s.id.padEnd(18)} → ${res.status} ${res.ok ? 'sent' : await res.text()}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
