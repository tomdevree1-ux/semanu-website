'use client';

import { useActionState } from 'react';
import { updateCatalogItem, changeCatalogItemStatus, archiveCatalogItem, restoreCatalogItem } from '@/modules/catalog/actions';
import { CATALOG_ITEM_TYPES, CATALOG_BILLING_INTERVALS, type CatalogActionState } from '@/modules/catalog/schema';
import { CATALOG_SELECTABLE_STATUSES } from '@/modules/catalog/status';
import { formatCatalogPrice, formatSetupFee } from '@/modules/catalog/price';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { CatalogItemDetail } from '@/modules/catalog/types';

const empty: CatalogActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

function Notice({ s, okText = 'Saved.' }: { s: CatalogActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

// Each EditableBlock submits the full field set: it edits one half and carries the
// other half as hidden inputs (current values), so updateCatalogItem stays whole.
function pricingHidden(c: CatalogItemDetail): Record<string, string> {
  return {
    catalogItemId: c.id,
    name: c.name,
    code: c.code ?? '',
    description: c.description ?? '',
    itemType: c.itemType,
    category: c.category ?? '',
    isPublic: c.isPublic ? 'on' : '',
  };
}
function infoHidden(c: CatalogItemDetail): Record<string, string> {
  return {
    catalogItemId: c.id,
    basePrice: c.basePrice == null ? '' : String(c.basePrice),
    setupFee: c.setupFee == null ? '' : String(c.setupFee),
    priceIsFrom: c.priceIsFrom ? 'on' : '',
    billingInterval: c.billingInterval,
    currency: c.currency,
  };
}

export function CatalogDetailActions({
  item,
  canUpdate,
  canArchive,
}: {
  item: CatalogItemDetail;
  canUpdate: boolean;
  canArchive: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeCatalogItemStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreCatalogItem, empty);

  if (item.isArchived) {
    return (
      <div className="rounded-xl border border-ink/10 bg-white p-5">
        <h2 className="font-display text-lg text-ink">Archived</h2>
        <p className="mt-1 text-sm text-ink-soft">
          This catalog item is archived and hidden from the default list. Restore it to manage again.
        </p>
        <Notice s={restoreState} okText="Catalog item restored." />
        {canArchive ? (
          <form action={restoreAction} className="mt-3">
            <input type="hidden" name="catalogItemId" value={item.id} />
            <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
              {restorePending ? 'Restoring…' : 'Restore item'}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canUpdate ? (
        <EditableBlock
          title="Item info"
          action={updateCatalogItem}
          hiddenFields={infoHidden(item)}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Code" value={item.code} mono />
              <Read label="Type" value={statusLabel(item.itemType)} />
              <Read label="Category" value={item.category} />
              <Read label="Public" value={item.isPublic ? 'Yes' : 'No'} />
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-soft">Description</dt>
                <dd className="whitespace-pre-wrap text-ink">{item.description || '—'}</dd>
              </div>
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Name <span className="text-red">*</span></span>
                <input name="name" defaultValue={item.name} required maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Code</span>
                <input name="code" defaultValue={item.code ?? ''} maxLength={60} disabled={pending} className={`${input} font-mono`} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Category</span>
                <input name="category" defaultValue={item.category ?? ''} maxLength={120} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Type</span>
                <select name="itemType" defaultValue={item.itemType} disabled={pending} className={input}>
                  {CATALOG_ITEM_TYPES.map((t) => (
                    <option key={t} value={t}>{statusLabel(t)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink">
                <input type="checkbox" name="isPublic" value="on" defaultChecked={item.isPublic} disabled={pending} className="h-4 w-4" />
                Public (internal flag only)
              </label>
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Description</span>
                <textarea name="description" defaultValue={item.description ?? ''} rows={3} maxLength={5000} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      {canUpdate ? (
        <EditableBlock
          title="Pricing"
          action={updateCatalogItem}
          hiddenFields={pricingHidden(item)}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Price" value={formatCatalogPrice(item)} />
              <Read label="Setup fee" value={formatSetupFee(item.setupFee, item.currency)} />
              <Read label="Billing" value={statusLabel(item.billingInterval)} />
              <Read label="Currency" value={item.currency} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-ink">Base price (CHF)</span>
                <input name="basePrice" type="number" min="0" step="0.01" defaultValue={item.basePrice ?? ''} placeholder="blank = on request" disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Setup fee (CHF)</span>
                <input name="setupFee" type="number" min="0" step="0.01" defaultValue={item.setupFee ?? ''} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Billing interval</span>
                <select name="billingInterval" defaultValue={item.billingInterval} disabled={pending} className={input}>
                  {CATALOG_BILLING_INTERVALS.map((b) => (
                    <option key={b} value={b}>{statusLabel(b)}</option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 pt-6 text-sm text-ink">
                <input type="checkbox" name="priceIsFrom" value="on" defaultChecked={item.priceIsFrom} disabled={pending} className="h-4 w-4" />
                Show as starting price (&quot;From …&quot;)
              </label>
            </div>
          )}
        />
      ) : null}

      {canUpdate ? (
        <form action={statusAction} className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="catalogItemId" value={item.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={item.status} disabled={statusPending} className={`${input} max-w-xs`}>
              {CATALOG_SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the item from the default list. It is kept (no hard delete) and can be
            restored.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive item"
              triggerClassName={dangerBtn}
              title="Archive this catalog item"
              description={`This hides ${item.name} from the default list. It can be restored later.`}
              confirmWord={item.name}
              confirmLabel="Archive item"
              action={archiveCatalogItem}
              hiddenFields={{ catalogItemId: item.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Read({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className={`text-ink ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
