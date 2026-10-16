import type { Database, ContactStatus } from '@/lib/types/database';

/** A row from public.company_contacts — the CRM contact (Ring C). */
export type Contact = Database['public']['Tables']['company_contacts']['Row'];
export type { ContactStatus };

/** One row in the contacts list (with the linked company name). */
export type ContactListRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  contactStatus: string;
  isPrimary: boolean;
  companyId: string;
  companyName: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** The contact detail view. */
export type ContactDetail = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string | null;
  contactStatus: string;
  isPrimary: boolean;
  companyId: string;
  companyName: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};
