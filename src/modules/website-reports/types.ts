import type { Database } from '@/lib/types/database';

/** Row from public.website_analysis_reports (Ring E, P14). */
export type WebsiteReport = Database['public']['Tables']['website_analysis_reports']['Row'];

/** Safe, bounded data extracted from a single homepage fetch (stored in crawl_snapshot). */
export type CrawlSnapshot = {
  final_url: string;
  http_status: number;
  title: string | null;
  meta_description: string | null;
  headings: { h1: string[]; h2: string[]; h3: string[] };
  visible_text: string;
  counts: { images: number; links: number; forms: number };
  has_viewport: boolean;
  has_og: boolean;
  detected_language: string | null;
  same_domain_links: string[];
};

/** Funnel + CRM snapshot used as AI input + stored in input_snapshot (keeps the report reproducible). */
export type ReportInputContext = {
  website_url: string;
  normalized_domain: string | null;
  locale: 'de' | 'fr' | 'en';
  funnel: {
    first_name: string | null;
    last_name: string | null;
    email: string;
    payload: Record<string, unknown>;
  };
  company: { name: string | null } | null;
  contact: { name: string | null } | null;
};

export type WebsiteReportListRow = {
  id: string;
  funnelSubmissionId: string;
  version: number;
  isCurrent: boolean;
  websiteUrl: string;
  normalizedDomain: string | null;
  generationStatus: string;
  reviewStatus: string;
  displayStatus: string;
  scoreOverall: number | null;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type WebsiteReportDetail = {
  id: string;
  funnelSubmissionId: string;
  version: number;
  isCurrent: boolean;
  websiteUrl: string;
  normalizedDomain: string | null;
  generationStatus: string;
  reviewStatus: string;
  displayStatus: string;
  modelProvider: string | null;
  modelName: string | null;
  promptVersion: string | null;
  inputSnapshot: Record<string, unknown>;
  crawlSnapshot: Record<string, unknown>;
  reportJson: Record<string, unknown> | null;
  reportMarkdown: string | null;
  scores: {
    overall: number | null; seo: number | null; ux: number | null; conversion: number | null;
    performance: number | null; trust: number | null; content: number | null; mobile: number | null;
  };
  recommendations: Array<Record<string, unknown>>;
  internalSalesNotes: string | null;
  errorSummary: string | null;
  costEstimate: number | null;
  tokenUsage: Record<string, unknown>;
  generatedAt: string | null;
  reviewedAt: string | null;
  reviewedById: string | null;
  reviewedByName: string | null;
  companyId: string | null;
  companyName: string | null;
  companyArchived: boolean;
  contactId: string | null;
  contactName: string | null;
  contactArchived: boolean;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  // funnel context
  funnelSourceType: string;
  funnelStatus: string;
};

export type WebsiteReportFilters = {
  q?: string;
  generationStatus?: string;
  reviewStatus?: string;
  showArchived?: boolean;
  page?: number;
};
