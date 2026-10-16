import 'server-only';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Json, Database } from '@/lib/types/database';
import { logEvent } from '@/lib/audit/log';
import { env } from '@/lib/env';
import { getAiProvider, AiRequestError, type AiProvider, type AiUsage } from '@/lib/ai/provider';
import { fetchHomepage } from './fetch';
import { websiteReportContentSchema, type WebsiteReportContent } from './schema';
import { renderReportMarkdown } from './format';
import { scoresFromContent, shouldAdvanceFunnelToAnalyzed } from './guards';
import { buildSystemPrompt, buildUserPrompt, PROMPT_VERSION } from './prompts/wa-report-v1';
import type { ReportInputContext, WebsiteReport } from './types';
import type { WebsiteReportErrorCode } from './status';

/**
 * SERVER ONLY P14 generation pipeline. Called by the `generate`/`retry` server actions AFTER the report row
 * exists. Runs SSRF-safe fetch → AI analysis (with one repair retry) → zod validation → deterministic
 * markdown → store, writing the two status fields through the lifecycle and auditing each step with SAFE
 * metadata only. Fails closed (status 'failed' + a safe error_summary). `fetchHomepageImpl`/`getProvider`
 * are injectable so tests run without network or a real key.
 */
const MAX_INPUT_CHARS = 60_000;
const MAX_OUTPUT_TOKENS = 4000;

type Admin = ReturnType<typeof createAdminClient>;
export type GenerationDeps = {
  fetchHomepageImpl?: typeof fetchHomepage;
  getProvider?: () => AiProvider;
};

function addUsage(a: AiUsage, b: AiUsage): AiUsage {
  return { input: a.input + b.input, output: a.output + b.output, total: a.total + b.total };
}

export function tryParseJson(text: string): unknown | null {
  const stripped = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  const start = stripped.indexOf('{');
  const end = stripped.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  try {
    return JSON.parse(stripped.slice(start, end + 1));
  } catch {
    return null;
  }
}

type AiOutcome =
  | { ok: true; content: WebsiteReportContent; usage: AiUsage; cost: number }
  | { ok: false; reason: WebsiteReportErrorCode; usage: AiUsage; cost: number };

export async function callWithRepair(provider: AiProvider, system: string, userPrompt: string): Promise<AiOutcome> {
  let usage: AiUsage = { input: 0, output: 0, total: 0 };
  let cost = 0;
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? userPrompt
        : `${userPrompt}\n\nYour previous answer was not valid JSON matching the required schema. Return ONLY the corrected JSON object, nothing else.`;
    const r = await provider.generate({ system, prompt, maxOutputTokens: MAX_OUTPUT_TOKENS, temperature: 0.3 });
    usage = addUsage(usage, r.usage);
    cost += r.costEstimate;
    const parsed = tryParseJson(r.text);
    if (parsed) {
      const val = websiteReportContentSchema.safeParse(parsed);
      if (val.success) return { ok: true, content: val.data, usage, cost };
    }
  }
  return { ok: false, reason: 'ai_invalid_output', usage, cost };
}

async function fail(
  admin: Admin,
  report: WebsiteReport,
  reason: WebsiteReportErrorCode,
  step: 'fetch' | 'analyze',
  extra?: { usage?: AiUsage; cost?: number; provider?: AiProvider },
): Promise<{ ok: false; error: string }> {
  const update: Database['public']['Tables']['website_analysis_reports']['Update'] = { generation_status: 'failed', error_summary: reason };
  if (extra?.usage) update.token_usage = extra.usage as unknown as Json;
  if (extra?.cost != null) update.cost_estimate = extra.cost;
  if (extra?.provider) {
    update.model_provider = extra.provider.provider;
    update.model_name = extra.provider.model;
    update.prompt_version = PROMPT_VERSION;
  }
  await admin.from('website_analysis_reports').update(update).eq('id', report.id);
  if (step === 'fetch') {
    await logEvent({
      action: 'website_report.fetch_failed', actorId: report.created_by ?? null, actorType: 'internal_user',
      entityType: 'website_report', entityId: report.id, severity: 'warning',
      metadata: { domain: report.normalized_domain, reason }, source: 'portal',
    });
  }
  await logEvent({
    action: 'website_report.failed', actorId: report.created_by ?? null, actorType: 'internal_user',
    entityType: 'website_report', entityId: report.id, severity: 'warning', newStatus: 'failed',
    metadata: { domain: report.normalized_domain, reason, step }, source: 'portal',
  });
  return { ok: false, error: reason };
}

async function maybeAdvanceFunnel(admin: Admin, report: WebsiteReport): Promise<void> {
  const { data: funnel } = await admin
    .from('funnel_submissions')
    .select('id, status')
    .eq('id', report.funnel_submission_id)
    .maybeSingle();
  if (!funnel) return;
  // Always record that a report was generated for the funnel.
  await logEvent({
    action: 'funnel.report_generated', actorId: report.created_by ?? null, actorType: 'internal_user',
    entityType: 'funnel', entityId: funnel.id, metadata: { report_id: report.id, version: report.version }, source: 'portal',
  });
  // Forward-only status advance.
  if (shouldAdvanceFunnelToAnalyzed(funnel.status)) {
    await admin.from('funnel_submissions').update({ status: 'analyzed', updated_by: report.created_by ?? null }).eq('id', funnel.id);
    await logEvent({
      action: 'funnel.status_changed', actorId: report.created_by ?? null, actorType: 'internal_user',
      entityType: 'funnel', entityId: funnel.id, oldStatus: funnel.status, newStatus: 'analyzed',
      metadata: { via: 'website_report', report_id: report.id }, source: 'portal',
    });
  }
}

export async function runReportPipeline(
  report: WebsiteReport,
  context: ReportInputContext,
  deps: GenerationDeps = {},
): Promise<{ ok: boolean; error?: string }> {
  const admin = createAdminClient();
  const fetchImpl = deps.fetchHomepageImpl ?? fetchHomepage;
  const startedAt = Date.now();

  // 1) fetch
  await admin.from('website_analysis_reports').update({ generation_status: 'fetching' }).eq('id', report.id);
  await logEvent({
    action: 'website_report.fetch_started', actorId: report.created_by ?? null, actorType: 'internal_user',
    entityType: 'website_report', entityId: report.id, metadata: { domain: report.normalized_domain }, source: 'portal',
  });

  let fetchRes;
  try {
    fetchRes = await fetchImpl(report.website_url, {});
  } catch {
    return fail(admin, report, 'unreachable', 'fetch');
  }
  if (!fetchRes.ok) return fail(admin, report, fetchRes.reason, 'fetch');

  const crawl = fetchRes.snapshot;
  await admin.from('website_analysis_reports').update({ crawl_snapshot: crawl as unknown as Json }).eq('id', report.id);

  if (JSON.stringify(crawl).length > MAX_INPUT_CHARS) {
    return fail(admin, report, 'input_too_large', 'analyze');
  }

  // 2) analyze
  await admin.from('website_analysis_reports').update({ generation_status: 'analyzing' }).eq('id', report.id);
  await logEvent({
    action: 'website_report.analysis_started', actorId: report.created_by ?? null, actorType: 'internal_user',
    entityType: 'website_report', entityId: report.id, metadata: { domain: report.normalized_domain }, source: 'portal',
  });

  let provider: AiProvider;
  try {
    provider = deps.getProvider ? deps.getProvider() : getAiProvider();
  } catch {
    return fail(admin, report, 'ai_not_configured', 'analyze');
  }

  const system = buildSystemPrompt(context.locale);
  const userPrompt = buildUserPrompt(crawl, context);

  let outcome: AiOutcome;
  try {
    outcome = await callWithRepair(provider, system, userPrompt);
  } catch (err) {
    const reason: WebsiteReportErrorCode = err instanceof AiRequestError ? 'ai_request_failed' : 'unknown';
    return fail(admin, report, reason, 'analyze', { provider });
  }
  if (!outcome.ok) {
    return fail(admin, report, outcome.reason, 'analyze', { usage: outcome.usage, cost: outcome.cost, provider });
  }
  if (outcome.cost > env.websiteReportMaxCost) {
    return fail(admin, report, 'cost_exceeded', 'analyze', { usage: outcome.usage, cost: outcome.cost, provider });
  }

  // 3) store
  const scores = scoresFromContent(outcome.content);
  await admin
    .from('website_analysis_reports')
    .update({
      generation_status: 'succeeded',
      review_status: 'review_needed',
      report_json: outcome.content as unknown as Json,
      report_markdown: renderReportMarkdown(outcome.content),
      recommendations: outcome.content.impact_effort_recommendations as unknown as Json,
      internal_sales_notes: outcome.content.internal_sales_note,
      model_provider: provider.provider,
      model_name: provider.model,
      prompt_version: PROMPT_VERSION,
      token_usage: outcome.usage as unknown as Json,
      cost_estimate: outcome.cost,
      error_summary: null,
      generated_at: new Date().toISOString(),
      ...scores,
    })
    .eq('id', report.id);

  await logEvent({
    action: 'website_report.generated', actorId: report.created_by ?? null, actorType: 'internal_user',
    entityType: 'website_report', entityId: report.id, newStatus: 'succeeded',
    metadata: {
      domain: report.normalized_domain, model_provider: provider.provider, model_name: provider.model,
      prompt_version: PROMPT_VERSION, input_tokens: outcome.usage.input, output_tokens: outcome.usage.output,
      cost_estimate: outcome.cost, duration_ms: Date.now() - startedAt,
    },
    source: 'portal',
  });

  await maybeAdvanceFunnel(admin, report);
  return { ok: true };
}
