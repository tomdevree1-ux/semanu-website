import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { funnelSourceLabel } from './format';

const root = process.cwd();
const notifySrc = readFileSync(join(root, 'src/modules/funnels/notify.ts'), 'utf8');
const routeSrc = readFileSync(join(root, 'src/app/api/funnels/submit/route.ts'), 'utf8');

describe('funnel source label', () => {
  it('website_analysis reads "Free website analysis" (the portal tag)', () => {
    expect(funnelSourceLabel('website_analysis')).toBe('Free website analysis');
  });
});

describe('operator notification (notify.ts source invariants)', () => {
  it('is server-only and best-effort via the existing Resend wrapper', () => {
    expect(notifySrc).toContain("import 'server-only'");
    expect(notifySrc).toMatch(/from '@\/lib\/email'/);
    expect(notifySrc).toMatch(/sendEmail\(/);
  });
  it('emails the OPERATOR (LEAD_NOTIFICATION_TO), never the lead, with reply-to the lead', () => {
    expect(notifySrc).toMatch(/to:\s*env\.notificationTo/);
    expect(notifySrc).toMatch(/replyTo:\s*data\.email/);
    // the recipient must not be the lead's address
    expect(notifySrc).not.toMatch(/to:\s*data\.email/);
  });
  it('links to the submission in the portal and escapes interpolated values', () => {
    expect(notifySrc).toMatch(/\/app\/funnels\/\$\{id\}/);
    expect(notifySrc).toMatch(/function esc\(/);
  });
  it('stores nothing / mutates nothing (no DB writes, no CRM/funnel mutation)', () => {
    expect(notifySrc).not.toMatch(/\.from\(|\.insert\(|\.update\(|\.delete\(|createAdminClient/);
  });
});

describe('route wiring (submit route source)', () => {
  it('sends the notification only after a successful ingest, and still always returns ok:true', () => {
    expect(routeSrc).toMatch(/const result = await ingestFunnelSubmission/);
    expect(routeSrc).toMatch(/if \(result\.ok && result\.id\)/);
    expect(routeSrc).toMatch(/notifyNewFunnelSubmission\(data, result\.id\)/);
    expect(routeSrc).toMatch(/return NextResponse\.json\(\{ ok: true \}\)/);
    // notification happens after the rate-limit / turnstile gates (i.e. after ingest), not before
    expect(routeSrc.indexOf('notifyNewFunnelSubmission')).toBeGreaterThan(routeSrc.indexOf('verifyTurnstile'));
  });
});
