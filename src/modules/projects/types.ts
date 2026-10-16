import type { Database, ProjectStatus } from '@/lib/types/database';

/** A row from public.projects — Ring D project record. */
export type Project = Database['public']['Tables']['projects']['Row'];
export type { ProjectStatus };

/** One row in the projects list. */
export type ProjectListRow = {
  id: string;
  name: string;
  status: string;
  companyId: string;
  companyName: string | null;
  ownerName: string | null;
  primaryContactName: string | null;
  dueDate: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** A project summary shown on the company detail page. */
export type CompanyProjectRow = {
  id: string;
  name: string;
  status: string;
  ownerName: string | null;
  dueDate: string | null;
  archivedAt: string | null;
};

/** The project detail view. */
export type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  companyId: string;
  companyName: string | null;
  companyArchived: boolean;
  primaryContactId: string | null;
  primaryContactName: string | null;
  primaryContactArchived: boolean;
  ownerId: string | null;
  ownerName: string | null;
  startDate: string | null;
  dueDate: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  archivedBy: string | null;
  isArchived: boolean;
};
