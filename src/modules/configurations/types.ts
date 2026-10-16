/** One computed price line inside a configuration version payload. */
export type ConfigLine = { key: string; amount: number; per: 'month' | 'once' | string };

/** The client computed configurator payload stored per version (jsonb). */
export type ConfigPayload = {
  title?: string;
  situation?: 'new' | 'existing' | string;
  monthly?: number;
  oneTime?: number;
  state?: Record<string, unknown>;
  lines?: ConfigLine[];
};

/** One row in the configurations list. */
export type ConfigListRow = {
  id: string;
  configNumber: string;
  title: string;
  situation: string;
  status: string;
  currentVersion: number;
  monthly: number;
  oneTime: number;
  leadName: string | null;
  leadEmail: string | null;
  companyId: string | null;
  quoteId: string | null;
  updatedAt: string;
  archivedAt: string | null;
};

/** One immutable version in the history (who + when). */
export type ConfigVersionRow = {
  id: string;
  version: number;
  monthly: number;
  oneTime: number;
  note: string | null;
  createdAt: string;
  createdByName: string;
  payload: ConfigPayload;
};

/** The configuration detail view with the full version history. */
export type ConfigDetail = {
  id: string;
  configNumber: string;
  title: string;
  situation: string;
  status: string;
  currentVersion: number;
  source: string;
  leadId: string | null;
  leadName: string | null;
  leadEmail: string | null;
  leadCompany: string | null;
  companyId: string | null;
  companyName: string | null;
  quoteId: string | null;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  isArchived: boolean;
  versions: ConfigVersionRow[];
};
