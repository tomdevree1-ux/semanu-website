import type { Database } from '@/lib/types/database';

/** Row from public.funnel_submissions (Ring E, P13). */
export type FunnelSubmission = Database['public']['Tables']['funnel_submissions']['Row'];

export type FunnelListRow = {
  id: string;
  sourceType: string;
  status: string;
  spamStatus: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  websiteUrl: string | null;
  normalizedDomain: string | null;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  archivedAt: string | null;
};

export type FunnelDetail = {
  id: string;
  sourceType: string;
  status: string;
  spamStatus: string;
  spamScore: number | null;
  firstName: string | null;
  lastName: string | null;
  email: string;
  phone: string | null;
  websiteUrl: string | null;
  normalizedDomain: string | null;
  companyName: string | null;
  payload: Record<string, unknown>;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmTerm: string | null;
  utmContent: string | null;
  referrer: string | null;
  pagePath: string | null;
  locale: string | null;
  consentPrivacy: boolean;
  consentMarketing: boolean;
  companyId: string | null;
  companyNameLinked: string | null;
  companyArchived: boolean;
  contactId: string | null;
  contactName: string | null;
  contactArchived: boolean;
  ownerId: string | null;
  ownerName: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  /** Other non-archived submissions with the same email or domain (possible duplicates). */
  duplicateCount: number;
};

export type OwnerOption = { id: string; name: string };
export type CompanyOption = { id: string; name: string; archived: boolean };
export type ContactOption = { id: string; name: string; archived: boolean };

export type FunnelFilters = {
  q?: string;
  sourceType?: string;
  status?: string;
  spamStatus?: string;
  ownerId?: string;
  companyId?: string;
  showArchived?: boolean;
  page?: number;
};
