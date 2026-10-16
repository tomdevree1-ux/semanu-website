import type { Database } from '@/lib/types/database';
import type { ChangeAction } from './schema';

/** Row from public.subscription_change_requests (Ring D, P12B1). */
export type SubscriptionChangeRequest = Database['public']['Tables']['subscription_change_requests']['Row'];

/** One row in the change-requests list. */
export type ChangeRequestListRow = {
  id: string;
  actionType: string;
  status: string;
  stripeSubscriptionId: string;
  customerSubscriptionId: string;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  requestedByName: string | null;
  hasPreview: boolean;
  createdAt: string;
  archivedAt: string | null;
};

/** A display-safe preview summary (never raw amounts in audit; shown to permitted users only). */
export type PreviewSummary = {
  currency: string | null;
  estimatedTotal: number | null;
  lineCount: number | null;
  periodEnd: string | null;
  target: string | null;
  prorationBehavior: string | null;
};

/** The change-request detail view. */
export type ChangeRequestDetail = {
  id: string;
  actionType: string;
  status: string;
  prorationBehavior: string | null;
  subscriptionItemId: string | null;
  stripeSubscriptionId: string;
  customerSubscriptionId: string;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  requestPayload: Record<string, unknown>;
  safeSummary: PreviewSummary | Record<string, unknown> | null;
  /** Raw preview payload — only populated for `audit.read_technical` holders. */
  previewPayload: Record<string, unknown> | null;
  errorSummary: string | null;
  requestedByName: string | null;
  requestedAt: string | null;
  notes: string | null;
  internalNotes: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
};

/** Eligibility of each action for a target subscription (for UI gating). */
export type AllowedAction = { action: ChangeAction; eligible: boolean; needsPreview: boolean; reason: string | null };

export type ChangeRequestFilters = {
  q?: string;
  status?: string;
  actionType?: string;
  companyId?: string;
  customerSubscriptionId?: string;
  showArchived?: boolean;
  page?: number;
};
