import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * WAF-4 auto-pilot (quickscan path) safety invariants, source-asserted like the other website-report tests.
 * These lock the cost + privacy + brand guarantees the runtime depends on but that pure unit tests can't reach.
 */
const root = process.cwd();
const jobSrc = readFileSync(join(root, 'src/modules/website-reports/auto/job.ts'), 'utf8');
const workerSrc = readFileSync(join(root, 'src/lib/outbox/worker.ts'), 'utf8');
const routeSrc = readFileSync(join(root, 'src/app/api/funnels/submit/route.ts'), 'utf8');
const enqueueSrc = readFileSync(join(root, 'src/lib/outbox/enqueue.ts'), 'utf8');
const contentSrc = readFileSync(join(root, 'src/modules/website-reports/auto/quickscan-content.ts'), 'utf8');
const pdfSrc = readFileSync(join(root, 'src/modules/website-reports/auto/pdf-service.ts'), 'utf8');

describe('WAF-4 auto job — cost wall', () => {
  it('evaluates the policy (cap + dedup) before any report row is created', () => {
    const decideIdx = jobSrc.indexOf('decideAutoGeneration(');
    const insertIdx = jobSrc.indexOf(".from('website_analysis_reports')\n    .insert(");
    expect(decideIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(-1);
    expect(decideIdx).toBeLessThan(insertIdx);
  });
  it('counts today auto-generations by the system marker (created_by IS NULL)', () => {
    expect(jobSrc).toMatch(/\.is\('created_by', null\)/);
  });
  it('enforces the per-report cost cap before sending', () => {
    expect(jobSrc).toMatch(/gen\.cost > env\.websiteReportMaxCost/);
  });
  it('does an SSRF-safe fetch before any AI spend', () => {
    const fetchIdx = jobSrc.indexOf('fetchImpl(websiteUrl');
    const genIdx = jobSrc.indexOf('generateQuickscanContent(');
    expect(fetchIdx).toBeGreaterThan(-1);
    expect(genIdx).toBeGreaterThan(fetchIdx);
  });
});

describe('WAF-4 auto job — system attribution + no CRM mutation', () => {
  it('writes the report as a system report (created_by null)', () => {
    expect(jobSrc).toMatch(/created_by: null/);
  });
  it('never auto-creates CRM rows (companies / contacts are read-only here)', () => {
    expect(jobSrc).not.toMatch(/\.from\('companies'\)\s*\.insert/);
    expect(jobSrc).not.toMatch(/\.from\('company_contacts'\)\s*\.insert/);
  });
  it('stores the quickscan site dict on the report (report_json)', () => {
    expect(jobSrc).toMatch(/report_json: site/);
  });
});

describe('WAF-4 auto job — approve + send gating', () => {
  it('generates, then approves, then renders/sends in that order', () => {
    const gen = jobSrc.indexOf('generateQuickscanContent(');
    const approve = jobSrc.indexOf("review_status: 'approved'");
    const render = jobSrc.indexOf('renderQuickscanPdf(site)');
    expect(gen).toBeGreaterThan(-1);
    expect(approve).toBeGreaterThan(gen);
    expect(render).toBeGreaterThan(approve);
  });
  it('auto-send requires BOTH the auto-send flag and the delivery flag', () => {
    expect(jobSrc).toMatch(/!env\.autoSendEnabled \|\| !env\.websiteReportDeliveryEnabled/);
  });
  it('renders via the external service and emails the submitter', () => {
    expect(jobSrc).toMatch(/const email = \(funnel\.email \?\? ''\)\.trim\(\)/);
    expect(jobSrc).toMatch(/renderQuickscanPdf\(site\)/);
    expect(jobSrc).toMatch(/to_email: email/);
    expect(jobSrc).toMatch(/template: 'website_report'/);
  });
  it('does NOT use the P14 react-pdf pipeline for the auto path', () => {
    expect(jobSrc).not.toMatch(/runReportPipeline|runDeliveryPipeline/);
  });
});

describe('WAF-4 content generation', () => {
  it('writes Swiss-German and forbids comma-before-conjunction in the copy rules', () => {
    expect(contentSrc).toMatch(/Schweizer Hochdeutsch/);
    expect(contentSrc).toMatch(/Kein Komma vor einem nebenordnenden Bindewort/);
  });
  it('requires the exact score order and a JSON-only response', () => {
    expect(contentSrc).toMatch(/Erster Eindruck/);
    expect(contentSrc).toMatch(/NUR ein JSON Objekt/);
  });
});

describe('WAF-4 PDF service call', () => {
  it('authenticates with the shared secret and is unconfigured-safe', () => {
    expect(pdfSrc).toMatch(/'x-service-secret': secret/);
    expect(pdfSrc).toMatch(/pdf_service_unconfigured/);
  });
});

describe('WAF-4 worker dispatch', () => {
  it('routes report_generation jobs to the auto handler, not the email sender', () => {
    expect(workerSrc).toMatch(/row\.channel === 'report_generation'/);
    expect(workerSrc).toMatch(/runAutoReportJob\(gp\.funnelSubmissionId\)/);
  });
});

describe('WAF-4 public submit trigger', () => {
  it('only enqueues when the flag + source + website gate pass, and never blocks the response', () => {
    expect(routeSrc).toMatch(/shouldEnqueueAutoGeneration\(\{ enabled: env\.autoGenerateEnabled/);
    expect(routeSrc).toMatch(/enqueueReportGeneration\(result\.id, dedupeKey\)/);
    expect(routeSrc).toMatch(/return NextResponse\.json\(\{ ok: true \}\)/);
  });
  it('does NOT run AI in the public request (only enqueues)', () => {
    expect(routeSrc).not.toMatch(/runReportPipeline|runAutoReportJob|generateQuickscanContent|callWithRepair/);
  });
});

describe('WAF-4 enqueue', () => {
  it('marks the job with the report_generation channel', () => {
    expect(enqueueSrc).toMatch(/channel: 'report_generation'/);
  });
});
