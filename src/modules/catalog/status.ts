import type { StatusMachine, Transition } from '@/lib/status/types';
import type { CatalogStatus as CatalogStatusType } from '@/lib/types/database';

/**
 * Catalog item lifecycle machine (Part V §V1). Tokens: draft→draft, active→done,
 * inactive→system, archived→cancelled. `archived` is reached/left only via the
 * dedicated archive/restore actions, never via `changeCatalogItemStatus`.
 */
export type CatalogStatus = CatalogStatusType;

export const CATALOG_UPDATE_PERMISSION = 'catalog.update';
const EMITS = 'catalog.status_changed';

export const CATALOG_SELECTABLE_STATUSES: readonly CatalogStatus[] = ['draft', 'active', 'inactive'];

/** No status change needs a confirm (archive has its own type-to-confirm action). */
export const CATALOG_CONFIRM_STATUSES: ReadonlySet<CatalogStatus> = new Set();

const PAIRS: ReadonlyArray<[CatalogStatus, CatalogStatus]> = [
  ['draft', 'active'],
  ['active', 'draft'],
  ['active', 'inactive'],
  ['inactive', 'active'],
];

export const catalogStatusMachine: StatusMachine<CatalogStatus> = {
  states: {
    draft: { label: 'Draft', color: 'draft' },
    active: { label: 'Active', color: 'done' },
    inactive: { label: 'Inactive', color: 'system' },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<CatalogStatus> => ({ from, to, permission: CATALOG_UPDATE_PERMISSION, emits: EMITS }),
  ),
};
