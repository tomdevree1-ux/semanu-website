import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { funnelStatusToken } from '@/lib/status/colors';
import {
  FUNNEL_SOURCE_TYPES,
  FUNNEL_STATUSES,
  FUNNEL_EDITABLE_STATUSES,
  FUNNEL_SPAM_STATUSES,
} from './status';
import { normalizeEmail, normalizeDomain, funnelIsArchivable } from './guards';
import { funnelSourceLabel, fullName } from './format';
import {
  funnelStatusSchema,
  funnelLinkContactSchema,
  funnelLinkCompanySchema,
  funnelCreateContactSchema,
  funnelAssignSchema,
} from './schema';
import { funnelSubmitSchema } from '@/lib/validation';

const root = process.cwd();
const actionsSrc = readFileSync(join(root, 'src/modules/funnels/actions.ts'), 'utf8');
const ingestSrc = readFileSync(join(root, 'src/modules/funnels/ingest.ts'), 'utf8');
const queriesSrc = readFileSync(join(root, 'src/modules/funnels/queries.ts'), 'utf8');
const routeSrc = readFileSync(join(root, 'src/app/api/funnels/submit/route.ts'), 'utf8');
const formSrc = readFileSync(join(root, 'src/components/FunnelForm.tsx'), 'utf8');

// ── pure helpers ────────────────────────────────────────────────────────────────

describe('funnelStatusToken mapping (P13)', () => {
  it('maps each workflow status to a semantic token; unknown → system', () => {
    expect(funnelStatusToken('new')).toBe('draft');
    expect(funnelStatusToken('to_review')).toBe('waiting');
    expect(funnelStatusToken('in_progress')).toBe('waiting');
    expect(funnelStatusToken('follow_up_planned')).toBe('waiting');
    expect(funnelStatusToken('qualified')).toBe('sent');
    expect(funnelStatusToken('contacted')).toBe('sent');
    expect(funnelStatusToken('analyzed')).toBe('done');
    expect(funnelStatusToken('report_sent')).toBe('done');
    expect(funnelStatusToken('converted')).toBe('done');
    expect(funnelStatusToken('closed_not_relevant')).toBe('cancelled');
    expect(funnelStatusToken('archived')).toBe('cancelled');
    expect(funnelStatusToken('something_else')).toBe('system');
  });
});

describe('status constants', () => {
  it('source types + statuses + spam statuses', () => {
    expect(FUNNEL_SOURCE_TYPES).toContain('website_analysis');
    expect(FUNNEL_SOURCE_TYPES).toHaveLength(4);
    expect(FUNNEL_STATUSES).toContain('new');
    expect(FUNNEL_STATUSES).toContain('archived');
    expect(FUNNEL_SPAM_STATUSES).toEqual(['pending', 'ham', 'suspected', 'spam']);
  });
  it('editable statuses exclude archived (archive is a dedicated action)', () => {
    expect(FUNNEL_EDITABLE_STATUSES).not.toContain('archived');
    expect(FUNNEL_EDITABLE_STATUSES).toContain('new');
  });
});

describe('guards: normalization + archivability', () => {
  it('normalizeEmail lowercases and trims', () => {
    expect(normalizeEmail('  Tom@AMAI.CH ')).toBe('tom@amai.ch');
  });
  it('normalizeDomain strips scheme/path/port/www and requires a dot', () => {
    expect(normalizeDomain('https://www.Example.com/pricing?x=1')).toBe('example.com');
    expect(normalizeDomain('http://foo.ch:8080/a')).toBe('foo.ch');
    expect(normalizeDomain('Example.CH')).toBe('example.ch');
    expect(normalizeDomain('localhost')).toBeNull(); // no dot
    expect(normalizeDomain('a.b')).toBeNull(); // too short (< 4)
    expect(normalizeDomain('')).toBeNull();
    expect(normalizeDomain(null)).toBeNull();
  });
  it('funnelIsArchivable only when not already archived', () => {
    expect(funnelIsArchivable(null)).toBe(true);
    expect(funnelIsArchivable('2026-06-12')).toBe(false);
  });
});

describe('format helpers', () => {
  it('funnelSourceLabel + fullName', () => {
    expect(funnelSourceLabel('website_analysis')).toBe('Free website analysis');
    expect(funnelSourceLabel('unknown_thing')).toBe('Unknown Thing');
    expect(fullName('Tom', 'de Vree')).toBe('Tom de Vree');
    expect(fullName(null, null)).toBe('');
  });
});

// ── public ingest schema (honeypot, consent, conditional website) ────────────────

describe('funnelSubmitSchema (public ingest)', () => {
  const base = {
    sourceType: 'website_analysis' as const,
    firstName: 'Tom',
    lastName: 'de Vree',
    email: 'tom@example.ch',
    website: 'https://example.ch',
    consentPrivacy: true as const,
  };
  it('accepts a valid website_analysis submission', () => {
    expect(funnelSubmitSchema.safeParse(base).success).toBe(true);
  });
  it('requires privacy consent to be literally true', () => {
    expect(funnelSubmitSchema.safeParse({ ...base, consentPrivacy: false }).success).toBe(false);
  });
  it('requires a website when sourceType is website_analysis', () => {
    const r = funnelSubmitSchema.safeParse({ ...base, website: '' });
    expect(r.success).toBe(false);
  });
  it('rejects an invalid email', () => {
    expect(funnelSubmitSchema.safeParse({ ...base, email: 'not-an-email' }).success).toBe(false);
  });
  it('honeypot companyUrl must be empty (max length 0)', () => {
    expect(funnelSubmitSchema.safeParse({ ...base, companyUrl: '' }).success).toBe(true);
    expect(funnelSubmitSchema.safeParse({ ...base, companyUrl: 'http://bot.example' }).success).toBe(false);
  });
  it('defaults sourceType to website_analysis', () => {
    const { website, ...noSource } = base;
    const r = funnelSubmitSchema.safeParse({ ...noSource, website });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.sourceType).toBe('website_analysis');
  });
});

describe('portal action schemas', () => {
  it('status must be a known status; uuids enforced', () => {
    expect(funnelStatusSchema.safeParse({ id: crypto.randomUUID(), status: 'qualified' }).success).toBe(true);
    expect(funnelStatusSchema.safeParse({ id: crypto.randomUUID(), status: 'nope' }).success).toBe(false);
    expect(funnelStatusSchema.safeParse({ id: 'not-uuid', status: 'new' }).success).toBe(false);
  });
  it('link + create + assign schemas enforce uuids', () => {
    const id = crypto.randomUUID();
    expect(funnelLinkContactSchema.safeParse({ id, contactId: crypto.randomUUID() }).success).toBe(true);
    expect(funnelLinkContactSchema.safeParse({ id, contactId: 'x' }).success).toBe(false);
    expect(funnelLinkCompanySchema.safeParse({ id, companyId: crypto.randomUUID() }).success).toBe(true);
    expect(funnelCreateContactSchema.safeParse({ id, companyId: crypto.randomUUID() }).success).toBe(true);
    expect(funnelCreateContactSchema.safeParse({ id, companyId: '' }).success).toBe(false);
    expect(funnelAssignSchema.safeParse({ id, ownerId: '' }).success).toBe(true); // empty → unassign
    expect(funnelAssignSchema.safeParse({ id, ownerId: 'bad' }).success).toBe(false);
  });
});

// ── portal actions: security invariants (source check) ───────────────────────────

describe('actions: P13 security invariants (source check)', () => {
  it('is a server module gating each action by the exact permission', () => {
    expect(actionsSrc).toContain("'use server'");
    expect(actionsSrc).toMatch(/updateFunnelStatus[\s\S]*?hasPermission\('funnels\.update'\)/);
    expect(actionsSrc).toMatch(/updateFunnelNotes[\s\S]*?hasPermission\('funnels\.update'\)/);
    expect(actionsSrc).toMatch(/assignFunnelOwner[\s\S]*?hasPermission\('funnels\.assign'\)/);
    expect(actionsSrc).toMatch(/archiveFunnelSubmission[\s\S]*?hasPermission\('funnels\.archive'\)/);
    expect(actionsSrc).toMatch(/restoreFunnelSubmission[\s\S]*?hasPermission\('funnels\.archive'\)/);
    expect(actionsSrc).toMatch(/linkFunnelToContact[\s\S]*?hasPermission\('funnels\.update'\)/);
    expect(actionsSrc).toMatch(/linkFunnelToCompany[\s\S]*?hasPermission\('funnels\.update'\)/);
  });
  it('CRM-create actions additionally require the CRM create permission', () => {
    expect(actionsSrc).toMatch(/createCompanyFromFunnel[\s\S]*?hasPermission\('companies\.create'\)/);
    expect(actionsSrc).toMatch(/createContactFromFunnel[\s\S]*?hasPermission\('contacts\.create'\)/);
  });
  it('the status action refuses to set the archived status (archive is its own action)', () => {
    const i = actionsSrc.indexOf('updateFunnelStatus');
    const body = actionsSrc.slice(i, i + 900);
    expect(body).toMatch(/status === 'archived'/);
  });
  it('never touches checkout / Stripe / legacy billing tables', () => {
    for (const src of [actionsSrc, ingestSrc, queriesSrc]) {
      expect(src).not.toContain('/api/checkout');
      expect(src).not.toMatch(/\.from\('orders'\)/);
      expect(src).not.toMatch(/\.from\('payments'\)/);
      expect(src).not.toMatch(/\.from\('payment_links'\)/);
      expect(src).not.toMatch(/\.from\('subscriptions'\)/);
      expect(src).not.toMatch(/\.from\('stripe_events'\)/);
      expect(src).not.toMatch(/subscriptions\.(update|cancel|del)\(/);
    }
  });
  it('never hard-deletes; archive sets archived_at, restore clears it', () => {
    expect(actionsSrc).not.toMatch(/\.delete\(/);
    const a = actionsSrc.indexOf('archiveFunnelSubmission');
    expect(actionsSrc.slice(a, a + 900)).toContain('archived_at');
    const r = actionsSrc.indexOf('restoreFunnelSubmission');
    expect(actionsSrc.slice(r, r + 900)).toContain('archived_at: null');
  });
  it('ordinary audit metadata carries no secrets and no money/url', () => {
    expect(actionsSrc).not.toMatch(/STRIPE_SECRET|sk_(live|test)/);
    const metas = actionsSrc.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    for (const m of metas) {
      expect(m).not.toMatch(/\b(amount|unit_amount|balance)\b/);
      expect(m).not.toMatch(/sk_(live|test)/);
    }
  });
});

// ── public ingestion: link-only, hashed PII, consent (source check) ──────────────

describe('ingest: link-only, hashed PII, consent (source check)', () => {
  it('is server-only and never auto-creates CRM rows (insert only into funnel_submissions)', () => {
    expect(ingestSrc).toContain("import 'server-only'");
    // No company / contact creation from the public path.
    expect(ingestSrc).not.toMatch(/\.from\('companies'\)\.insert/);
    expect(ingestSrc).not.toMatch(/\.from\('company_contacts'\)\.insert/);
    // The only insert target is the funnel table itself.
    const inserts = ingestSrc.match(/\.from\('([^']+)'\)\.insert/g) ?? [];
    expect(inserts.every((s) => s.includes("'funnel_submissions'"))).toBe(true);
  });
  it('stores only hashed IP / user-agent and records consent', () => {
    expect(ingestSrc).toContain('ip_hash');
    expect(ingestSrc).toContain('user_agent_hash');
    expect(ingestSrc).toContain('consent_privacy');
    expect(ingestSrc).not.toMatch(/ip_address:/);
  });
  it('audits the public submission as an external actor over the public link', () => {
    expect(ingestSrc).toMatch(/funnel\.submitted/);
    expect(ingestSrc).toMatch(/actorType:\s*'external_user'/);
    expect(ingestSrc).toMatch(/source:\s*'public_link'/);
  });
});

// ── public API route: hardened + non-revealing (source check) ────────────────────

describe('public API /api/funnels/submit (source check)', () => {
  it('runs on node, rate-limits (IP + email), verifies Turnstile and honours the honeypot', () => {
    expect(routeSrc).toMatch(/runtime = 'nodejs'/);
    expect(routeSrc).toMatch(/checkRateLimit\('funnels'/);
    expect(routeSrc).toMatch(/checkRateLimit\('funnels_email'/);
    expect(routeSrc).toContain('verifyTurnstile');
    expect(routeSrc).toMatch(/data\.companyUrl/);
  });
  it('hashes IP + user-agent and always returns a non-revealing success', () => {
    expect(routeSrc).toMatch(/sha256/);
    expect(routeSrc).toMatch(/ok: true/);
    // never imports the service role directly into the route (ingest owns the write)
    expect(routeSrc).not.toMatch(/SERVICE_ROLE|service_role/);
  });
});

// ── public form: posts to the API, honeypot, no secrets (source check) ───────────

describe('FunnelForm (public component, source check)', () => {
  it('posts to the funnels API, includes the honeypot + Turnstile, leaks no secret', () => {
    expect(formSrc).toContain("'use client'");
    expect(formSrc).toContain('/api/funnels/submit');
    expect(formSrc).toContain('companyUrl');
    expect(formSrc).toContain('Turnstile');
    expect(formSrc).not.toMatch(/SERVICE_ROLE|service_role|sk_(live|test)/);
    expect(formSrc).not.toMatch(/createAdminClient/);
  });
});
