import type { Database, CompanyCrmStatus } from '@/lib/types/database';

/** A row from public.companies — the CRM company master (Ring C). */
export type Company = Database['public']['Tables']['companies']['Row'];
export type { CompanyCrmStatus };

/** One row in the companies list (CRM-relevant projection). */
export type CompanyListRow = {
  id: string;
  companyName: string;
  domain: string | null;
  email: string | null;
  city: string | null;
  canton: string | null;
  crmStatus: string;
  leadStatus: string;
  source: string;
  ownerName: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** A contact summary shown on the company detail page. */
export type CompanyContactRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  contactStatus: string;
  isPrimary: boolean;
  archivedAt: string | null;
};

/** The company detail view. */
export type CompanyDetail = {
  id: string;
  companyName: string;
  domain: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  canton: string | null;
  country: string;
  language: string | null;
  industry: string | null;
  notes: string | null;
  source: string;
  crmStatus: string;
  leadStatus: string;
  leadPriority: string | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  lastScannedAt: string | null;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
  contacts: CompanyContactRow[];
};
