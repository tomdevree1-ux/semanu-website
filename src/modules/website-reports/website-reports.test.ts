import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { websiteReportStatusToken } from '@/lib/status/colors';
import {
  WEBSITE_REPORT_GENERATION_STATUSES,
  WEBSITE_REPORT_REVIEW_STATUSES,
  SCORE_AXES,
  PROMPT_VERSION,
} from './status';
import { websiteReportDisplayStatus, reportIsArchivable, shouldAdvanceFunnelToAnalyzed, roundScore, scoresFromContent } from './guards';
import { websiteReportStatusLabel, formatScore, renderReportMarkdown } from './format';
import { websiteReportContentSchema, generateReportSchema, reviewReportSchema, reportNotesSchema } from './schema';
import type { WebsiteReportContent } from './schema';
import { fetchHomepage } from './fetch';
import { callWithRepair, tryParseJson } from './generate';
import type { AiProvider } from '@/lib/ai/provider';

const root = process.cwd();
const actionsSrc = readFileSync(join(root, 'src/modules/website-reports/actions.ts'), 'utf8');
const generateSrc = readFileSync(join(root, 'src/modules/website-reports/generate.ts'), 'utf8');
const fetchSrc = readFileSync(join(root, 'src/modules/website-reports/fetch.ts'), 'utf8');
const providerSrc = readFileSync(join(root, 'src/lib/ai/provider.ts'), 'utf8');
const panelSrc = readFileSync(join(root, 'src/components/portal/website-reports/GenerateReportPanel.tsx'), 'utf8');
const detailSrc = readFileSync(join(root, 'src/components/portal/website-reports/WebsiteReportDetailActions.tsx'), 'utf8');

const validContent: WebsiteReportContent = {
  executive_summary: 'Solid site, room to improve conversion.',
  scorecard: { overall: 7, seo: 6.5, ux: 8, conversion: 5, performance: 6, trust: 7, content: 6, mobile: 8 },
  first_impression: 'a', positioning_message: 'a', conversion_lead_generation: 'a', ux_structure: 'a',
  visual_design_impression: 'a', seo_findability: 'a', performance_technical_impression: 'a', trust_proof: 'a', mobile_impression: 'a',
  concrete_improvement_opportunities: ['Add a clear CTA'],
  impact_effort_recommendations: [{ title: 'Add CTA', impact: 'high', effort: 'low', rationale: 'Lifts conversion' }],
  commercial_conclusion: 'Good fit for a Business plan.',
  internal_sales_note: 'Warm lead; pitch Business + SEO.',
};

function fakeProvider(responses: string[]): AiProvider {
  let i = 0;
  return {
    provider: 'fake', model: 'fake-1',
    async generate() {
      const text = responses[Math.min(i, responses.length - 1)];
      i++;
      return { text, usage: { input: 10, output: 20, total: 30 }, costEstimate: 0.001, model: 'fake-1', provider: 'fake' };
    },
  };
}

function makeRes(opts: { status?: number; contentType?: string; location?: string; body?: string; url?: string }): Response {
  const headers = new Headers();
  if (opts.contentType) headers.set('content-type', opts.contentType);
  if (opts.location) headers.set('location', opts.location);
  return {
    status: opts.status ?? 200,
    url: opts.url ?? '',
    body: null,
    headers,
    text: async () => opts.body ?? '',
  } as unknown as Response;
}

describe('status model', () => {
  it('token mapping incl. unknown → system', () => {
    expect(websiteReportStatusToken('queued')).toBe('draft');
    expect(websiteReportStatusToken('fetching')).toBe('waiting');
    expect(websiteReportStatusToken('analyzing')).toBe('opened');
    expect(websiteReportStatusToken('failed')).toBe('failed');
    expect(websiteReportStatusToken('review_needed')).toBe('waiting');
    expect(websiteReportStatusToken('approved')).toBe('done');
    expect(websiteReportStatusToken('rejected')).toBe('cancelled');
    expect(websiteReportStatusToken('archived')).toBe('cancelled');
    expect(websiteReportStatusToken('???')).toBe('system');
  });
  it('constants', () => {
    expect(WEBSITE_REPORT_GENERATION_STATUSES).toContain('succeeded');
    expect(WEBSITE_REPORT_REVIEW_STATUSES).toEqual(['review_needed', 'approved', 'rejected']);
    expect(SCORE_AXES).toHaveLength(8);
    expect(PROMPT_VERSION).toBe('wa-report-v1');
  });
});

describe('guards', () => {
  it('displayStatus collapses the two fields', () => {
    expect(websiteReportDisplayStatus({ generation_status: 'fetching', review_status: 'review_needed', archived_at: null })).toBe('fetching');
    expect(websiteReportDisplayStatus({ generation_status: 'succeeded', review_status: 'approved', archived_at: null })).toBe('approved');
    expect(websiteReportDisplayStatus({ generation_status: 'succeeded', review_status: 'approved', archived_at: '2026-01-01' })).toBe('archived');
  });
  it('archivable + forward-only funnel advance', () => {
    expect(reportIsArchivable(null)).toBe(true);
    expect(reportIsArchivable('2026-01-01')).toBe(false);
    for (const s of ['new', 'to_review', 'qualified', 'in_progress']) expect(shouldAdvanceFunnelToAnalyzed(s)).toBe(true);
    for (const s of ['analyzed', 'report_sent', 'contacted', 'follow_up_planned', 'converted', 'closed_not_relevant', 'archived']) {
      expect(shouldAdvanceFunnelToAnalyzed(s)).toBe(false);
    }
  });
  it('roundScore clamps to 0..10 with one decimal; scoresFromContent maps axes', () => {
    expect(roundScore(7.46)).toBe(7.5);
    expect(roundScore(-3)).toBe(0);
    expect(roundScore(99)).toBe(10);
    expect(roundScore(null)).toBeNull();
    const s = scoresFromContent(validContent);
    expect(s.score_overall).toBe(7);
    expect(s.score_seo).toBe(6.5);
  });
});

describe('format', () => {
  it('labels + score formatting', () => {
    expect(websiteReportStatusLabel('review_needed')).toBe('Review needed');
    expect(formatScore(null)).toBe('—');
    expect(formatScore(7)).toBe('7.0');
  });
  it('renders markdown from validated content', () => {
    const md = renderReportMarkdown(validContent);
    expect(md).toContain('# Website analysis report');
    expect(md).toContain('## Executive summary');
    expect(md).toContain('## Scorecard');
    expect(md).toContain('Internal sales note');
    expect(md).toContain('Add CTA');
  });
});

describe('schema', () => {
  it('content schema accepts valid and rejects bad scores / missing keys', () => {
    expect(websiteReportContentSchema.safeParse(validContent).success).toBe(true);
    expect(websiteReportContentSchema.safeParse({ ...validContent, scorecard: { ...validContent.scorecard, overall: 11 } }).success).toBe(false);
    const { executive_summary, ...missing } = validContent;
    expect(websiteReportContentSchema.safeParse(missing).success).toBe(false);
  });
  it('action input schemas', () => {
    expect(generateReportSchema.safeParse({ funnelSubmissionId: crypto.randomUUID() }).success).toBe(true);
    expect(generateReportSchema.safeParse({ funnelSubmissionId: 'x' }).success).toBe(false);
    expect(reviewReportSchema.safeParse({ id: crypto.randomUUID(), decision: 'approved' }).success).toBe(true);
    expect(reviewReportSchema.safeParse({ id: crypto.randomUUID(), decision: 'nope' }).success).toBe(false);
    expect(reportNotesSchema.safeParse({ id: crypto.randomUUID(), notes: '', internalNotes: 'x' }).success).toBe(true);
  });
});

describe('fetch: SSRF-safe homepage fetch (injected deps)', () => {
  const publicLookup = async () => ['93.184.216.34'];

  it('blocks a host that resolves to a private IP WITHOUT fetching', async () => {
    const calls: string[] = [];
    const r = await fetchHomepage('http://rebind.example', {
      lookup: async () => ['127.0.0.1'],
      fetchImpl: async (u) => { calls.push(u); return makeRes({}); },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('url_blocked_ssrf');
    expect(calls).toHaveLength(0);
  });

  it('blocks bad schemes before any fetch', async () => {
    const calls: string[] = [];
    const r = await fetchHomepage('file:///etc/passwd', { fetchImpl: async (u) => { calls.push(u); return makeRes({}); } });
    expect(r.ok).toBe(false);
    expect(calls).toHaveLength(0);
  });

  it('extracts safe data on success', async () => {
    const html = '<html lang="de"><head><title>Acme</title><meta name="description" content="We do things"><meta name="viewport" content="x"></head><body><h1>Welcome</h1><h2>About</h2><a href="/pricing">p</a><a href="https://other.com/x">o</a><img><form></form></body></html>';
    const r = await fetchHomepage('https://example.com', { lookup: publicLookup, fetchImpl: async () => makeRes({ contentType: 'text/html; charset=utf-8', body: html, url: 'https://example.com/' }) });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.snapshot.title).toBe('Acme');
      expect(r.snapshot.meta_description).toBe('We do things');
      expect(r.snapshot.headings.h1).toEqual(['Welcome']);
      expect(r.snapshot.counts.images).toBe(1);
      expect(r.snapshot.counts.forms).toBe(1);
      expect(r.snapshot.has_viewport).toBe(true);
      expect(r.snapshot.detected_language).toBe('de');
      expect(r.snapshot.same_domain_links).toContain('https://example.com/pricing');
      expect(r.snapshot.same_domain_links.every((l) => !l.includes('other.com'))).toBe(true);
    }
  });

  it('rejects non-allowlisted content-type', async () => {
    const r = await fetchHomepage('https://example.com', { lookup: publicLookup, fetchImpl: async () => makeRes({ contentType: 'application/json', body: '{}' }) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('bad_content_type');
  });

  it('maps http >= 400 to http_error', async () => {
    const r = await fetchHomepage('https://example.com', { lookup: publicLookup, fetchImpl: async () => makeRes({ status: 404, contentType: 'text/html' }) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('http_error');
  });

  it('re-validates redirects and blocks a redirect to an internal address', async () => {
    let fetches = 0;
    const r = await fetchHomepage('https://example.com', {
      lookup: publicLookup,
      fetchImpl: async () => { fetches++; return makeRes({ status: 301, location: 'http://169.254.169.254/latest/meta-data' }); },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('url_blocked_ssrf');
    expect(fetches).toBe(1); // fetched origin once; refused to fetch the internal redirect target
  });

  it('caps oversized responses', async () => {
    const big = 'a'.repeat(2_100_000);
    const r = await fetchHomepage('https://example.com', { lookup: publicLookup, fetchImpl: async () => makeRes({ contentType: 'text/html', body: big }) });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('too_large');
  });
});

describe('AI validation + repair (no DB)', () => {
  it('tryParseJson tolerates fences + surrounding text', () => {
    expect(tryParseJson('```json\n{"a":1}\n```')).toEqual({ a: 1 });
    expect(tryParseJson('garbage')).toBeNull();
  });
  it('accepts valid JSON on first try', async () => {
    const r = await callWithRepair(fakeProvider([JSON.stringify(validContent)]), 'sys', 'user');
    expect(r.ok).toBe(true);
    if (r.ok) { expect(r.content.scorecard.overall).toBe(7); expect(r.usage.total).toBe(30); }
  });
  it('repairs once then succeeds', async () => {
    const r = await callWithRepair(fakeProvider(['not json at all', JSON.stringify(validContent)]), 'sys', 'user');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.usage.total).toBe(60); // two provider calls
  });
  it('fails closed after the repair retry', async () => {
    const r = await callWithRepair(fakeProvider(['nope', 'still nope']), 'sys', 'user');
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.reason).toBe('ai_invalid_output'); expect(r.usage.total).toBe(60); }
  });
});

describe('source invariants', () => {
  it('actions: server module, exact permission gates, flag gate, override = admin (archive perm)', () => {
    expect(actionsSrc).toContain("'use server'");
    expect(actionsSrc).toMatch(/generateWebsiteAnalysisReport[\s\S]*?websiteReportsEnabled/);
    expect(actionsSrc).toMatch(/generateWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.generate'\)/);
    expect(actionsSrc).toMatch(/retryWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.generate'\)/);
    expect(actionsSrc).toMatch(/reviewWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.review'\)/);
    expect(actionsSrc).toMatch(/archiveWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.archive'\)/);
    expect(actionsSrc).toMatch(/restoreWebsiteAnalysisReport[\s\S]*?hasPermission\('website_reports\.archive'\)/);
    // override path requires the archive permission (only admin holds it) + a reason
    expect(actionsSrc).toMatch(/overrideNoContact[\s\S]*?hasPermission\('website_reports\.archive'\)/);
    expect(actionsSrc).toMatch(/override reason is required/i);
  });
  it('never hard-deletes; archive sets archived_at; restore clears it', () => {
    expect(actionsSrc).not.toMatch(/\.delete\(/);
    const a = actionsSrc.indexOf('archiveWebsiteAnalysisReport');
    expect(actionsSrc.slice(a, a + 700)).toContain('archived_at');
    const r = actionsSrc.indexOf('restoreWebsiteAnalysisReport');
    expect(actionsSrc.slice(r, r + 700)).toContain('archived_at: null');
  });
  it('no delivery: no email/PDF/send/public-URL anywhere in the engine (imports/calls, not comments)', () => {
    for (const src of [actionsSrc, generateSrc, fetchSrc]) {
      expect(src).not.toMatch(/resend|sendEmail|nodemailer|sendReport/i);
      expect(src).not.toMatch(/report_url|reportUrl|share[_-]?link/i);
      expect(src).not.toMatch(/\.pdf\b/i);
      expect(src).not.toMatch(/\.from\('(orders|payments|subscriptions|stripe_events|outbox)'\)/);
      expect(src).not.toMatch(/from ['"][^'"]*\/stripe['"]|stripe\.(subscriptions|checkout|customers|prices)/i);
      expect(src).not.toMatch(/fetch\(\s*['"][^'"]*\/api\/checkout/);
    }
  });
  it('generate audits carry safe metadata only (no raw crawl/report/key)', () => {
    const metas = generateSrc.match(/metadata:\s*\{[^}]*\}/g) ?? [];
    expect(metas.length).toBeGreaterThan(0);
    for (const m of metas) {
      expect(m).not.toMatch(/report_json|report_markdown|visible_text|crawl_snapshot|api[_-]?key|apiKey/i);
    }
  });
  it('fetch + provider are server-only and never bypass the guard / log the key', () => {
    expect(fetchSrc).toContain("import 'server-only'");
    expect(fetchSrc).toContain('assertPublicUrl');
    expect(providerSrc).toContain("import 'server-only'");
    expect(providerSrc).not.toMatch(/console\.(log|info|warn|error)\([^)]*apiKey/);
  });
  it('client components carry no service-role / AI key', () => {
    for (const src of [panelSrc, detailSrc]) {
      expect(src).toContain("'use client'");
      expect(src).not.toMatch(/createAdminClient|SERVICE_ROLE|service_role|ANTHROPIC_API_KEY|anthropicApiKey|getAiProvider/);
    }
  });
});

describe('actor-based generation rate limit (P14 corrective patch)', () => {
  const genBody = actionsSrc.slice(
    actionsSrc.indexOf('export async function generateWebsiteAnalysisReport'),
    actionsSrc.indexOf('export async function retryWebsiteAnalysisReport'),
  );
  const retryBody = actionsSrc.slice(
    actionsSrc.indexOf('export async function retryWebsiteAnalysisReport'),
    actionsSrc.indexOf('export async function reviewWebsiteAnalysisReport'),
  );

  it('uses the shared limiter with one conservative per-actor bucket (8/hour)', () => {
    expect(actionsSrc).toMatch(/import \{ checkRateLimit, userIdentifier \} from '@\/lib\/security\/ratelimit'/);
    expect(actionsSrc).toMatch(/RL_BUCKET = 'website_reports'/);
    expect(actionsSrc).toMatch(/RL_LIMIT = 8\b/);
    expect(actionsSrc).toMatch(/RL_WINDOW_SECONDS = 3600/);
    expect(actionsSrc).toMatch(/checkRateLimit\(RL_BUCKET, userIdentifier\(actorId\), RL_LIMIT, RL_WINDOW_SECONDS\)/);
  });

  it('generate: throttle is after auth+flag+permission and BEFORE any row insert / fetch / AI', () => {
    const rl = genBody.indexOf('withinGenerationRateLimit');
    expect(rl).toBeGreaterThan(-1);
    expect(genBody.indexOf('requireAuth')).toBeLessThan(rl);
    expect(genBody.indexOf('websiteReportsEnabled')).toBeLessThan(rl);
    expect(genBody.indexOf("hasPermission('website_reports.generate')")).toBeLessThan(rl);
    // nothing destructive/expensive may run before the throttle
    expect(genBody.indexOf('.insert(')).toBeGreaterThan(rl);
    expect(genBody.indexOf('runReportPipeline')).toBeGreaterThan(rl);
    expect(genBody).toContain('return { error: RATE_LIMITED }');
  });

  it('retry: throttle runs before the generation pipeline (fetch/AI)', () => {
    const rl = retryBody.indexOf('withinGenerationRateLimit');
    expect(rl).toBeGreaterThan(-1);
    expect(retryBody.indexOf('requireAuth')).toBeLessThan(rl);
    expect(retryBody.indexOf("hasPermission('website_reports.generate')")).toBeLessThan(rl);
    expect(retryBody.indexOf('runReportPipeline')).toBeGreaterThan(rl);
    expect(retryBody).toContain('return { error: RATE_LIMITED }');
  });

  it('reuses the server-only, fail-open limiter (unchanged)', () => {
    const rlSrc = readFileSync(join(root, 'src/lib/security/ratelimit.ts'), 'utf8');
    expect(rlSrc).toContain("import 'server-only'");
    expect(rlSrc).toMatch(/if \(error\) return \{ allowed: true \}/);
    expect(rlSrc).toMatch(/export function userIdentifier/);
  });
});
