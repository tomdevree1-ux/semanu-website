import type { StatusMachine, Transition } from '@/lib/status/types';
import type { ProjectStatus as ProjectStatusType } from '@/lib/types/database';

/**
 * Project lifecycle machine (Part V §V1). Tokens: draft→draft, active→done,
 * on_hold→waiting, completed→done, cancelled→cancelled, archived→cancelled.
 * `archived` is reached/left only via the dedicated archive/restore actions,
 * never via `changeProjectStatus`.
 */
export type ProjectStatus = ProjectStatusType;

export const PROJECT_UPDATE_PERMISSION = 'projects.update';
const EMITS = 'project.status_changed';

export const PROJECT_SELECTABLE_STATUSES: readonly ProjectStatus[] = [
  'draft',
  'active',
  'on_hold',
  'completed',
  'cancelled',
];

export const PROJECT_CONFIRM_STATUSES: ReadonlySet<ProjectStatus> = new Set(['cancelled']);

const PAIRS: ReadonlyArray<[ProjectStatus, ProjectStatus]> = [
  ['draft', 'active'],
  ['active', 'draft'],
  ['active', 'on_hold'],
  ['on_hold', 'active'],
  ['active', 'completed'],
  ['on_hold', 'completed'],
  ['completed', 'active'], // reopen
  ['draft', 'cancelled'],
  ['active', 'cancelled'],
  ['on_hold', 'cancelled'],
  ['cancelled', 'draft'], // reopen
];

export const projectStatusMachine: StatusMachine<ProjectStatus> = {
  states: {
    draft: { label: 'Draft', color: 'draft' },
    active: { label: 'Active', color: 'done' },
    on_hold: { label: 'On hold', color: 'waiting' },
    completed: { label: 'Completed', color: 'done' },
    cancelled: { label: 'Cancelled', color: 'cancelled' },
    archived: { label: 'Archived', color: 'cancelled' },
  },
  transitions: PAIRS.map(
    ([from, to]): Transition<ProjectStatus> => ({ from, to, permission: PROJECT_UPDATE_PERMISSION, emits: EMITS }),
  ),
};
