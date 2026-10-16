/** Client-safe display helpers for subscription change requests (P12B1). */

const ACTION_LABELS: Record<string, string> = {
  change_plan: 'Change plan',
  change_quantity: 'Change quantity',
  cancel_at_period_end: 'Cancel at period end',
  undo_cancel_at_period_end: 'Undo cancel at period end',
  cancel_immediately: 'Cancel immediately',
  pause_collection: 'Pause collection',
  resume_collection: 'Resume collection',
};

export function changeActionLabel(action: string): string {
  return ACTION_LABELS[action] ?? action.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatPreviewAmount(amount: number | null, currency: string | null): string {
  if (amount == null) return '—';
  const cur = (currency || 'CHF').toUpperCase();
  try {
    return new Intl.NumberFormat('de-CH', { style: 'currency', currency: cur }).format(amount);
  } catch {
    return `${cur} ${amount.toFixed(2)}`;
  }
}
