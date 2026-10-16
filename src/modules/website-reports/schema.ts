import { z } from 'zod';

/**
 * Zod schemas for P14. Two groups: (1) the AI report content schema used to VALIDATE the model's
 * structured JSON output before it is stored (only validated JSON is persisted; markdown is rendered from
 * it); (2) the portal action input schemas. Scores are 0..10.
 */

const scoreNum = z.number().min(0).max(10);
const sectionText = z.string().max(6000);

export const recommendationSchema = z.object({
  title: z.string().min(1).max(300),
  impact: z.enum(['low', 'medium', 'high']),
  effort: z.enum(['low', 'medium', 'high']),
  rationale: z.string().max(2000).optional().default(''),
});
export type WebsiteReportRecommendation = z.infer<typeof recommendationSchema>;

export const websiteReportScorecardSchema = z.object({
  overall: scoreNum,
  seo: scoreNum,
  ux: scoreNum,
  conversion: scoreNum,
  performance: scoreNum,
  trust: scoreNum,
  content: scoreNum,
  mobile: scoreNum,
});

export const websiteReportContentSchema = z.object({
  executive_summary: z.string().min(1).max(6000),
  scorecard: websiteReportScorecardSchema,
  first_impression: sectionText,
  positioning_message: sectionText,
  conversion_lead_generation: sectionText,
  ux_structure: sectionText,
  visual_design_impression: sectionText,
  seo_findability: sectionText,
  performance_technical_impression: sectionText,
  trust_proof: sectionText,
  mobile_impression: sectionText,
  concrete_improvement_opportunities: z.array(z.string().max(1000)).max(40).default([]),
  impact_effort_recommendations: z.array(recommendationSchema).max(40).default([]),
  commercial_conclusion: sectionText,
  internal_sales_note: sectionText,
});
export type WebsiteReportContent = z.infer<typeof websiteReportContentSchema>;

// ── portal action inputs ────────────────────────────────────────────────────────
const blankToUndef = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? undefined : v);
const optNotes = z.preprocess(blankToUndef, z.string().trim().max(10000).optional());

export const reportIdSchema = z.object({ id: z.string().uuid('Invalid report') });

export const generateReportSchema = z.object({
  funnelSubmissionId: z.string().uuid('Invalid submission'),
  overrideNoContact: z.boolean().optional().default(false),
  overrideReason: z.preprocess(blankToUndef, z.string().trim().max(500).optional()),
});

export const reviewReportSchema = z.object({
  id: z.string().uuid('Invalid report'),
  decision: z.enum(['approved', 'rejected']),
});

export const reportNotesSchema = z.object({
  id: z.string().uuid('Invalid report'),
  notes: optNotes,
  internalNotes: optNotes,
  internalSalesNotes: optNotes,
});

export type WebsiteReportActionState = { ok?: boolean; error?: string; id?: string };
