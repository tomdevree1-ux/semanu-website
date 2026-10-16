import type { StatusToken } from './colors';

/**
 * State-machine framework (client-safe types). Every domain with statuses
 * defines one StatusMachine; transitions declare the required permission, the
 * audit event emitted, and whether an outbound action fires. No domain machines
 * exist yet in P0 — this only fixes the shape so P1+ plug in (no status logic
 * scattered in UI or ad-hoc actions).
 */
export type StatusDef = {
  label: string;
  color: StatusToken;
  terminal?: boolean;
};

export type Transition<S extends string> = {
  from: S;
  to: S;
  /** Permission key required to perform this transition (server-checked). */
  permission?: string;
  /** Audit action emitted when this transition succeeds. */
  emits?: string;
  /** Outbound side effect to enqueue (e.g. an email) when this transition fires. */
  sideEffect?: 'email' | 'webhook' | 'none';
};

export type StatusMachine<S extends string> = {
  states: Record<S, StatusDef>;
  transitions: ReadonlyArray<Transition<S>>;
};

export function canTransition<S extends string>(machine: StatusMachine<S>, from: S, to: S): boolean {
  return machine.transitions.some((t) => t.from === from && t.to === to);
}

export function transition<S extends string>(
  machine: StatusMachine<S>,
  from: S,
  to: S,
): Transition<S> | null {
  return machine.transitions.find((t) => t.from === from && t.to === to) ?? null;
}
