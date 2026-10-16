/** Contact form + start modal submissions (public.leads). The portal surfaces
 * these as a sales pipeline: `status` is the stage a teammate moves the lead
 * through, `channel` is how the lead came in / is being worked. */
export type LeadStatus =
  | 'to_contact'
  | 'new'
  | 'assigned'
  | 'contacting'
  | 'proposal'
  | 'won'
  | 'lost'
  | 'on_hold';

export const LEAD_STATUSES: readonly LeadStatus[] = [
  'to_contact',
  'new',
  'assigned',
  'contacting',
  'proposal',
  'won',
  'lost',
  'on_hold',
];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  to_contact: 'To contact',
  new: 'New',
  assigned: 'Assigned',
  contacting: 'Contacting',
  proposal: 'Proposal',
  won: 'Won',
  lost: 'Lost',
  on_hold: 'On Hold',
};

/** Column accent (portal.css CSS vars / hex) per pipeline stage. */
export const LEAD_STATUS_DOT: Record<LeadStatus, string> = {
  to_contact: '#64748B',
  new: 'var(--accent)',
  assigned: 'var(--info)',
  contacting: '#E08A1E',
  proposal: '#8B5CF6',
  won: 'var(--ok)',
  lost: 'var(--alert)',
  on_hold: 'var(--text-faint)',
};

/** How the lead reached us / the channel it is being worked through. */
export type LeadChannel =
  | 'call_inbound'
  | 'call_outbound'
  | 'email_inbound'
  | 'email_outbound'
  | 'contact_form'
  | 'website_seo_analysis'
  | 'social'
  | 'referral'
  | 'partner'
  | 'event'
  | 'import';

export const LEAD_CHANNELS: readonly LeadChannel[] = [
  'call_inbound',
  'call_outbound',
  'email_inbound',
  'email_outbound',
  'contact_form',
  'website_seo_analysis',
  'social',
  'referral',
  'partner',
  'event',
  'import',
];

export const LEAD_CHANNEL_LABELS: Record<LeadChannel, string> = {
  call_inbound: 'Call inbound',
  call_outbound: 'Call outbound',
  email_inbound: 'Email inbound',
  email_outbound: 'Email outbound',
  contact_form: 'Contact form',
  website_seo_analysis: 'Website SEO analysis',
  social: 'Social',
  referral: 'Referral',
  partner: 'Partner',
  event: 'Event',
  import: 'Import',
};

/** Reasons a lead can be marked Lost (a reason is always required). */
export type LostReason =
  | 'no_budget'
  | 'no_response'
  | 'went_with_competitor'
  | 'not_a_fit'
  | 'bad_timing'
  | 'duplicate'
  | 'other';

export const LOST_REASONS: readonly LostReason[] = [
  'no_budget',
  'no_response',
  'went_with_competitor',
  'not_a_fit',
  'bad_timing',
  'duplicate',
  'other',
];

export const LOST_REASON_LABELS: Record<LostReason, string> = {
  no_budget: 'No budget',
  no_response: 'No response',
  went_with_competitor: 'Went with a competitor',
  not_a_fit: 'Not a fit',
  bad_timing: 'Bad timing',
  duplicate: 'Duplicate',
  other: 'Other',
};

/** The pipeline stage from which a lead is mirrored into the CRM (company + contact). */
export const CRM_LINK_STATUSES: readonly LeadStatus[] = ['contacting', 'proposal', 'won'];

/** A lead's source form. `contact` = the contact page form; `start` = the start modal. */
export type LeadFormType = 'contact' | 'start';

/** One row in the leads list. DB snake_case is mapped to camelCase (like the other modules). */
export type LeadListRow = {
  id: string;
  formType: string;
  firstname: string;
  lastname: string;
  email: string;
  company: string | null;
  phone: string | null;
  message: string | null;
  lang: string;
  status: LeadStatus;
  channel: LeadChannel;
  source: string | null;
  createdAt: string;
  /** Number of website form submissions tied to this lead. */
  submissionCount: number;
  assignedToId: string | null;
  assignedToName: string | null;
};

/** A portal user a lead can be assigned to (admin or sales role). */
export type AssignableUser = { id: string; name: string; avatarUrl: string | null };

/** Result state for the create-lead form. */
export type LeadFormState = { error?: string };

/** Full lead for the detail view (adds the internal note + CRM link + lost reason). */
export type LeadDetail = LeadListRow & {
  notes: string | null;
  lostReason: string | null;
  companyId: string | null;
  contactId: string | null;
};
