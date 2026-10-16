import type { Database } from '@/lib/types/database';

/** Row from public.website_report_deliveries (Ring E, P15). */
export type ReportDelivery = Database['public']['Tables']['website_report_deliveries']['Row'];

/** P16 engagement slice (Resend webhook). Reliable: delivered/bounced/complained. Indicative: opened/clicked. */
export type DeliveryEngagement = {
  deliveredAt: string | null;
  bouncedAt: string | null;
  complainedAt: string | null;
  firstOpenedAt: string | null;
  openedAt: string | null;
  openCount: number;
  clickedAt: string | null;
  clickCount: number;
  lastEventAt: string | null;
  bounceType: string | null;
};

export type DeliveryListRow = {
  id: string;
  reportId: string;
  funnelSubmissionId: string;
  toEmail: string;
  status: string;
  displayStatus: string;
  domain: string | null;
  companyName: string | null;
  contactName: string | null;
  followUpStatus: string;
  followUpAt: string | null;
  sentAt: string | null;
  createdAt: string;
  archivedAt: string | null;
  engagement: DeliveryEngagement;
};

export type DeliveryDetail = {
  id: string;
  reportId: string;
  funnelSubmissionId: string;
  contactId: string | null;
  companyId: string | null;
  toEmail: string;
  status: string;
  displayStatus: string;
  errorSummary: string | null;
  subject: string | null;
  pdfBucket: string | null;
  pdfPath: string | null;
  pdfSizeBytes: number | null;
  outboxId: string | null;
  providerMessageId: string | null;
  sentAt: string | null;
  failedAt: string | null;
  followUpAt: string | null;
  followUpStatus: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  engagement: DeliveryEngagement;
};

export type DeliveryFilters = {
  status?: string;
  followUpDue?: boolean;
  showArchived?: boolean;
  page?: number;
};
