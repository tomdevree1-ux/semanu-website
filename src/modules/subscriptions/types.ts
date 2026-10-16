import type { Database } from '@/lib/types/database';

/** Row from public.customer_subscriptions (Ring D, P12A registry). */
export type CustomerSubscription = Database['public']['Tables']['customer_subscriptions']['Row'];

/** One row in the subscriptions list. */
export type SubscriptionListRow = {
  id: string;
  status: string;
  syncStatus: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  planKey: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  quantity: number | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  companyId: string | null;
  companyName: string | null;
  contactId: string | null;
  contactName: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  archivedAt: string | null;
};

/** The subscription detail view (registry snapshot + resolved CRM names). */
export type SubscriptionDetail = {
  id: string;
  status: string;
  syncStatus: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string;
  stripeProductId: string | null;
  stripePriceId: string | null;
  planKey: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  quantity: number | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  cancelledAt: string | null;
  trialStart: string | null;
  trialEnd: string | null;
  companyId: string | null;
  companyName: string | null;
  companyArchived: boolean;
  contactId: string | null;
  contactName: string | null;
  contactArchived: boolean;
  customerId: string | null;
  customerLabel: string | null;
  notes: string | null;
  internalNotes: string | null;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};

/** A subscription row shown inside the company-detail Subscriptions section. */
export type CompanySubscriptionRow = {
  id: string;
  status: string;
  stripeSubscriptionId: string;
  planKey: string | null;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  archivedAt: string | null;
};

/** Picker option for linking a company. */
export type CompanyOption = { id: string; name: string; archived: boolean };
/** Picker option for linking a contact. */
export type ContactOption = { id: string; name: string; archived: boolean };
/** Picker option for linking a legacy Stripe customer row. */
export type CustomerOption = { id: string; label: string };

export type SubscriptionFilters = {
  q?: string;
  status?: string;
  syncStatus?: string;
  companyId?: string;
  contactId?: string;
  stripeCustomerId?: string;
  showArchived?: boolean;
  page?: number;
};
