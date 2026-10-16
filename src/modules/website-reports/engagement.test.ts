import { describe, it, expect } from 'vitest';
import crypto from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  parseResendEvent,
  verifyResendSignature,
  computeEngagementEffect,
  SUPPORTED_EVENTS,
  RELIABLE_EVENTS,
  OPEN_CLICK_EVENTS,
  type ParsedResendEvent,
  type CurrentDelivery,
} from './engagement-events';

const root = process.cwd();
const eventsSrc = readFileSync(join(root, 'src/modules/website-reports/engagement-events.ts'), 'utf8');
const engagementSrc = readFileSync(join(root, 'src/modules/website-reports/engagement.ts'), 'utf8');
const routeSrc = readFileSync(join(root, 'src/app/api/webhooks/resend/route.ts'), 'utf8');
const migrationSrc = readFileSync(join(root, 'supabase/migrations/0035_resend_engagement.sql'), 'utf8');
const displaySrc = readFileSync(join(root, 'src/lib/audit/display.ts'), 'utf8');
const summarySrc = readFileSync(join(root, 'src/components/portal/website-reports/EngagementSummary.tsx'), 'utf8');
const tableSrc = readFileSync(join(root, 'src/components/portal/website-reports/DeliveryTable.tsx'), 'utf8');
const panelSrc = readFileSync(join(root, 'src/components/portal/website-reports/DeliverPanel.tsx'), 'utf8');
const workerSrc = readFileSync(join(root, 'src/lib/outbox/worker.ts'), 'utf8');
const stripeSrc = readFileSync(join(root, 'src/app/api/stripe/webhook/route.ts'), 'utf8');

// ── signing helper (mirrors the Svix scheme the verifier expects) ───────────
const keyBytes = crypto.randomBytes(24);
const SECRET = 'whsec_' + keyBytes.toString('base64');
function sign(id: string, ts: string, body: string): string {
  return crypto.createHmac('sha256', keyBytes).update(`${id}.${ts}.${body}`).digest('base64');
}

const NOW = '2026-06-12T10:00:00.000Z';
const fresh: CurrentDelivery = { status: 'sent', delivered_at: null, bounced_at: null, complained_at: null, first_opened_at: null, open_count: 0, click_count: 0 };
function ev(type: string, extra: Partial<ParsedResendEvent> = {}): ParsedResendEvent {
  return { type, providerMessageId: 'abc', createdAt: null, bounceType: null, ...extra };
}

describe('Resend signature verification (Svix HMAC)', () => {
  const id = 'msg_123';
  const ts = String(Math.floor(Date.parse(NOW) / 1000));
  const body = JSON.stringify({ type: 'email.delivered', data: { email_id: 'abc' } });
  const goodSig = 'v1,' + sign(id, ts, body);

  it('accepts a valid signature', () => {
    const r = verifyResendSignature({ payload: body, headers: { id, timestamp: ts, signature: goodSig }, secret: SECRET, nowMs: Number(ts) * 1000 });
    expect(r.ok).toBe(true);
  });
  it('accepts when one of several v1 entries matches', () => {
    const multi = `v1,bogusBOGUSbogus v1,${sign(id, ts, body)}`;
    expect(verifyResendSignature({ payload: body, headers: { id, timestamp: ts, signature: multi }, secret: SECRET, nowMs: Number(ts) * 1000 }).ok).toBe(true);
  });
  it('rejects a tampered body', () => {
    const r = verifyResendSignature({ payload: body + ' ', headers: { id, timestamp: ts, signature: goodSig }, secret: SECRET, nowMs: Number(ts) * 1000 });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('no_match');
  });
  it('rejects missing svix headers', () => {
    expect(verifyResendSignature({ payload: body, headers: { id: null, timestamp: ts, signature: goodSig }, secret: SECRET }).ok).toBe(false);
    expect(verifyResendSignature({ payload: body, headers: { id, timestamp: ts, signature: null }, secret: SECRET }).reason).toBe('missing_headers');
  });
  it('rejects a stale timestamp (> 5 min)', () => {
    const oldTs = String(Math.floor(Date.parse(NOW) / 1000) - 600);
    const r = verifyResendSignature({ payload: body, headers: { id, timestamp: oldTs, signature: 'v1,' + sign(id, oldTs, body) }, secret: SECRET, nowMs: Date.parse(NOW) });
    expect(r.ok).toBe(false);
    expect(r.reason).toBe('stale_timestamp');
  });
  it('rejects when the secret is missing', () => {
    expect(verifyResendSignature({ payload: body, headers: { id, timestamp: ts, signature: goodSig }, secret: '' }).reason).toBe('no_secret');
  });
});

describe('parseResendEvent (safe, IP/UA-free)', () => {
  it('extracts type + provider message id + bounce type only', () => {
    expect(parseResendEvent({ type: 'email.delivered', data: { email_id: 'x' } })).toEqual({ type: 'email.delivered', providerMessageId: 'x', createdAt: null, bounceType: null });
    expect(parseResendEvent({ type: 'email.bounced', data: { email_id: 'x', bounce: { type: 'Permanent' } } })?.bounceType).toBe('Permanent');
  });
  it('drops IP / user-agent carried on open/click events', () => {
    const parsed = parseResendEvent({ type: 'email.opened', data: { email_id: 'x', open: { ipAddress: '1.2.3.4', userAgent: 'UA' } } });
    expect(parsed).toEqual({ type: 'email.opened', providerMessageId: 'x', createdAt: null, bounceType: null });
    expect(JSON.stringify(parsed)).not.toMatch(/1\.2\.3\.4|UA/);
  });
  it('returns null for non-events', () => {
    expect(parseResendEvent({ data: {} })).toBe(null);
    expect(parseResendEvent('nope')).toBe(null);
    expect(parseResendEvent(null)).toBe(null);
  });
});

describe('event taxonomy', () => {
  it('supported set = reliable ∪ open/click', () => {
    expect([...SUPPORTED_EVENTS].sort()).toEqual(['email.bounced', 'email.clicked', 'email.complained', 'email.delivered', 'email.delivery_delayed', 'email.opened', 'email.sent'].sort());
    expect(RELIABLE_EVENTS.has('email.delivered')).toBe(true);
    expect(OPEN_CLICK_EVENTS.has('email.opened')).toBe(true);
    expect(OPEN_CLICK_EVENTS.has('email.clicked')).toBe(true);
  });
});

describe('computeEngagementEffect — reliable signals', () => {
  it('delivered sets delivered_at (once) + audits first time + reflects email_log', () => {
    const e = computeEngagementEffect(ev('email.delivered'), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.applied).toBe(true);
    expect(e.update.delivered_at).toBe(NOW);
    expect(e.update.last_event_at).toBe(NOW);
    expect('status' in e.update).toBe(false);
    expect(e.auditAction).toBe('report_delivery.delivered');
    expect(e.emailLogStatus).toBe('delivered');
    // already delivered → keep original timestamp, no repeat audit
    const e2 = computeEngagementEffect(ev('email.delivered'), { openClickEnabled: false, current: { ...fresh, delivered_at: '2026-01-01T00:00:00Z' }, nowIso: NOW });
    expect(e2.update.delivered_at).toBe('2026-01-01T00:00:00Z');
    expect(e2.auditAction).toBe(null);
  });
  it('delivery_delayed only stamps last_event_at', () => {
    const e = computeEngagementEffect(ev('email.delivery_delayed'), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.update).toEqual({ last_event_at: NOW });
    expect(e.auditAction).toBe(null);
    expect(e.emailLogStatus).toBe(null);
  });
  it('bounced sets bounced_at + status=bounced + bounce_type, audits, reflects email_log', () => {
    const e = computeEngagementEffect(ev('email.bounced', { bounceType: 'Permanent' }), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.update.bounced_at).toBe(NOW);
    expect(e.update.status).toBe('bounced');
    expect(e.update.bounce_type).toBe('Permanent');
    expect(e.auditAction).toBe('report_delivery.bounced');
    expect(e.auditNewStatus).toBe('bounced');
    expect(e.emailLogStatus).toBe('bounced');
  });
  it('bounced never overrides a cancelled status, and is idempotent on repeat', () => {
    const onCancelled = computeEngagementEffect(ev('email.bounced'), { openClickEnabled: false, current: { ...fresh, status: 'cancelled' }, nowIso: NOW });
    expect('status' in onCancelled.update).toBe(false);
    const repeat = computeEngagementEffect(ev('email.bounced'), { openClickEnabled: false, current: { ...fresh, bounced_at: '2026-01-01T00:00:00Z' }, nowIso: NOW });
    expect(repeat.auditAction).toBe(null);
    expect('status' in repeat.update).toBe(false);
    expect(repeat.update.bounced_at).toBe('2026-01-01T00:00:00Z');
  });
  it('complained sets complained_at with NO status change, audits, reflects email_log', () => {
    const e = computeEngagementEffect(ev('email.complained'), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.update.complained_at).toBe(NOW);
    expect('status' in e.update).toBe(false);
    expect(e.auditAction).toBe('report_delivery.complained');
    expect(e.emailLogStatus).toBe('complained');
  });
});

describe('computeEngagementEffect — open/click gating', () => {
  it('opened is ignored when tracking is off', () => {
    const e = computeEngagementEffect(ev('email.opened'), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.applied).toBe(false);
    expect(e.reason).toBe('tracking_disabled');
    expect(e.update).toEqual({});
  });
  it('clicked is ignored when tracking is off', () => {
    const e = computeEngagementEffect(ev('email.clicked'), { openClickEnabled: false, current: fresh, nowIso: NOW });
    expect(e.applied).toBe(false);
    expect(e.reason).toBe('tracking_disabled');
  });
  it('opened updates timestamps + count (first audits), never sets email_log', () => {
    const first = computeEngagementEffect(ev('email.opened'), { openClickEnabled: true, current: fresh, nowIso: NOW });
    expect(first.update.first_opened_at).toBe(NOW);
    expect(first.update.opened_at).toBe(NOW);
    expect(first.update.open_count).toBe(1);
    expect(first.auditAction).toBe('report_delivery.opened');
    expect(first.emailLogStatus).toBe(null);
    const second = computeEngagementEffect(ev('email.opened'), { openClickEnabled: true, current: { ...fresh, first_opened_at: '2026-01-01T00:00:00Z', open_count: 1 }, nowIso: NOW });
    expect(second.update.open_count).toBe(2);
    expect(second.update.first_opened_at).toBe('2026-01-01T00:00:00Z');
    expect(second.auditAction).toBe(null);
  });
  it('clicked updates timestamps + count (first audits)', () => {
    const first = computeEngagementEffect(ev('email.clicked'), { openClickEnabled: true, current: fresh, nowIso: NOW });
    expect(first.update.clicked_at).toBe(NOW);
    expect(first.update.click_count).toBe(1);
    expect(first.auditAction).toBe('report_delivery.clicked');
    const second = computeEngagementEffect(ev('email.clicked'), { openClickEnabled: true, current: { ...fresh, click_count: 3 }, nowIso: NOW });
    expect(second.update.click_count).toBe(4);
    expect(second.auditAction).toBe(null);
  });
  it('unsupported event types are not applied', () => {
    const e = computeEngagementEffect(ev('email.weird'), { openClickEnabled: true, current: fresh, nowIso: NOW });
    expect(e.applied).toBe(false);
    expect(e.reason).toBe('unsupported');
  });
});

describe('reconciler invariants (engagement.ts source)', () => {
  it('matches by provider_message_id; unmatched / no-id are no-ops', () => {
    expect(engagementSrc).toContain("import 'server-only'");
    expect(engagementSrc).toMatch(/\.eq\('provider_message_id', messageId\)/);
    expect(engagementSrc).toMatch(/reason: 'no_delivery'/);
    expect(engagementSrc).toMatch(/reason: 'no_message_id'/);
  });
  it('reflects reliable state onto email_log, gated by emailLogStatus', () => {
    expect(engagementSrc).toMatch(/reflectEmailLog/);
    expect(engagementSrc).toMatch(/from\('email_log'\)/);
    expect(engagementSrc).toMatch(/if \(effect\.emailLogStatus\)/);
  });
  it('writes only website_report_deliveries + email_log — no CRM, funnel, outbound, billing', () => {
    for (const src of [engagementSrc, eventsSrc]) {
      expect(src).not.toMatch(/\.from\('(companies|company_contacts|funnel_submissions|quotes|projects|invoices|orders|payments|subscriptions|customer_subscriptions)'\)/);
      expect(src).not.toMatch(/enqueueEmail|sendViaResend|api\.resend\.com|\/api\/checkout|stripe\./i);
      expect(src).not.toMatch(/report_sent|advanceFunnel/);
    }
  });
  it('stores no IP / user-agent / raw payload (privacy by omission)', () => {
    // strip comments so the assertions test actual code, not the privacy notes in the doc comments
    const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');
    for (const src of [eventsSrc, engagementSrc, routeSrc]) {
      expect(strip(src)).not.toMatch(/ip_address|ipAddress|user_agent|userAgent/);
    }
    // the parser never reaches into the open/click sub-objects that carry IP/UA
    expect(strip(eventsSrc)).not.toMatch(/data\.(open|click)[.[]/);
    // the reconciler never persists a raw provider payload / email body / report content
    expect(strip(engagementSrc)).not.toMatch(/JSON\.stringify|email_body|report_json|report_markdown|\.\.\.event\b/i);
  });
  it('audit events are system/webhook-sourced', () => {
    expect(engagementSrc).toMatch(/actorType: 'system'/);
    expect(engagementSrc).toMatch(/source: 'webhook'/);
  });
});

describe('webhook route invariants (route.ts source)', () => {
  it('node runtime; flag-off → ignored; verify before parse; dedup before apply', () => {
    expect(routeSrc).toMatch(/export const runtime = 'nodejs'/);
    // target call sites, not the import lines at the top of the file
    const flagIdx = routeSrc.indexOf('if (!env.enableResendWebhook)');
    const verifyIdx = routeSrc.indexOf('verifyResendSignature({');
    const parseIdx = routeSrc.indexOf('JSON.parse');
    const dedupIdx = routeSrc.indexOf("from('resend_events')");
    const applyIdx = routeSrc.indexOf('applyResendEvent(event)');
    expect(flagIdx).toBeGreaterThan(-1);
    expect(verifyIdx).toBeGreaterThan(flagIdx);
    expect(parseIdx).toBeGreaterThan(verifyIdx); // JSON parsed ONLY after signature verification
    expect(dedupIdx).toBeGreaterThan(parseIdx);
    expect(applyIdx).toBeGreaterThan(dedupIdx); // dedup before apply
  });
  it('response policy: 400 invalid sig, 200 ignored, 500 only on dedup infra failure', () => {
    expect(routeSrc).toMatch(/error: 'invalid_signature' \}, \{ status: 400 \}/);
    expect(routeSrc).toMatch(/ignored: true/);
    expect(routeSrc).toMatch(/23505/);
    expect(routeSrc).toMatch(/status: 500/);
    expect(routeSrc).not.toMatch(/enqueueEmail|sendViaResend|api\.resend\.com|\/api\/checkout|stripe\./i);
  });
});

describe('migration 0035 (source)', () => {
  it('creates resend_events with RLS on + NO policies; adds engagement columns; no CHECK change', () => {
    expect(migrationSrc).toMatch(/create table if not exists public\.resend_events/);
    expect(migrationSrc).toMatch(/enable row level security/);
    expect(migrationSrc).not.toMatch(/create policy/i); // service-role only, like stripe_events
    expect(migrationSrc).toMatch(/add column if not exists delivered_at/);
    expect(migrationSrc).toMatch(/add column if not exists open_count\s+integer not null default 0/);
    expect(migrationSrc).toMatch(/add column if not exists engagement\s+jsonb not null default '\{\}'/);
    expect(migrationSrc).not.toMatch(/status_check|check \(status/i); // no status CHECK touched
  });
});

describe('audit display + portal UI', () => {
  it('registers the four new engagement audit events', () => {
    for (const a of ['report_delivery.delivered', 'report_delivery.complained', 'report_delivery.opened', 'report_delivery.clicked']) {
      expect(displaySrc).toContain(a);
    }
  });
  it('EngagementSummary is presentational and read-only (no actions/secrets)', () => {
    expect(summarySrc).not.toMatch(/<form|<button|useActionState|'use server'|action=\{/);
    expect(summarySrc).toMatch(/indicative/); // the open/click caveat caption
  });
  it('no client surface leaks service-role / Resend / webhook secrets', () => {
    for (const src of [summarySrc, tableSrc, panelSrc]) {
      expect(src).not.toMatch(/createAdminClient|SERVICE_ROLE|service_role|RESEND_API_KEY|resendApiKey|RESEND_WEBHOOK_SECRET|resendWebhookSecret|ANTHROPIC_API_KEY/);
    }
  });
});

describe('no regression to the P15 send path or the Stripe webhook', () => {
  it('outbox worker still renders the report email + invite/reset path', () => {
    expect(workerSrc).toMatch(/template === 'website_report'/);
    expect(workerSrc).toMatch(/template === 'password_reset'/);
    expect(workerSrc).toContain('actionUrl');
  });
  it('Stripe webhook signature verification is untouched', () => {
    expect(stripeSrc).toMatch(/constructEvent/);
  });
});
