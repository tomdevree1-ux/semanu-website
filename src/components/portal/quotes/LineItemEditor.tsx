'use client';

import { useActionState, useEffect, useState } from 'react';
import { addQuoteItem, updateQuoteItem, removeQuoteItem, reorderQuoteItems } from '@/modules/quotes/actions';
import type { QuoteActionState } from '@/modules/quotes/schema';
import { formatMoney, computeLine } from '@/modules/quotes/totals';
import { Spinner } from '@/components/portal/ui/Spinner';
import type { QuoteLineRow } from '@/modules/quotes/types';
import type { CatalogPickerItem } from '@/modules/quotes/queries';

const empty: QuoteActionState = {};
const input = 'rounded-lg border border-ink/15 px-2.5 py-1.5 text-sm text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const intervals = [
  { value: '', label: '—' },
  { value: 'one_time', label: 'One time' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
];

export function LineItemEditor({
  quoteId,
  items,
  catalogItems,
  currency,
  canEdit,
}: {
  quoteId: string;
  items: QuoteLineRow[];
  catalogItems: CatalogPickerItem[];
  currency: string;
  canEdit: boolean;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const ids = items.map((i) => i.id);

  return (
    <section className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Line items</h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink/10 text-xs uppercase tracking-wide text-ink-soft">
            <tr>
              <th className="py-2 pr-2 font-medium">#</th>
              <th className="py-2 pr-2 font-medium">Item</th>
              <th className="py-2 pr-2 font-medium">Qty</th>
              <th className="py-2 pr-2 font-medium">Unit price</th>
              <th className="py-2 pr-2 font-medium">Line total</th>
              {canEdit ? <th className="py-2" /> : null}
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={canEdit ? 6 : 5} className="py-4 text-center text-ink-soft">No line items yet.</td></tr>
            ) : null}
            {items.map((it, idx) =>
              canEdit && editingId === it.id ? (
                <EditRow key={it.id} item={it} currency={currency} onDone={() => setEditingId(null)} />
              ) : (
                <tr key={it.id} className="border-b border-ink/5 last:border-0 align-top">
                  <td className="py-2 pr-2 text-ink-soft">{it.position}</td>
                  <td className="py-2 pr-2">
                    <div className="text-ink">{it.name}</div>
                    {it.description ? <div className="text-xs text-ink-soft">{it.description}</div> : null}
                    {it.billingInterval ? <div className="text-xs text-ink-soft">{it.billingInterval.replace('_', ' ')}</div> : null}
                  </td>
                  <td className="py-2 pr-2 text-ink-soft">{it.quantity}</td>
                  <td className="py-2 pr-2 text-ink-soft">{formatMoney(it.unitPrice, currency)}</td>
                  <td className="py-2 pr-2 text-ink">{formatMoney(it.lineTotal, currency)}</td>
                  {canEdit ? (
                    <td className="py-2 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ReorderButton quoteId={quoteId} ids={ids} index={idx} dir={-1} />
                        <ReorderButton quoteId={quoteId} ids={ids} index={idx} dir={1} />
                        <button type="button" onClick={() => setEditingId(it.id)} className="rounded-pill border border-ink/15 px-2 py-1 text-xs text-ink hover:bg-ink/5">Edit</button>
                        <RemoveButton itemId={it.id} name={it.name} />
                      </div>
                    </td>
                  ) : null}
                </tr>
              ),
            )}
          </tbody>
        </table>
      </div>

      {canEdit ? <AddRow quoteId={quoteId} catalogItems={catalogItems} currency={currency} /> : null}
    </section>
  );
}

function AddRow({ quoteId, catalogItems, currency }: { quoteId: string; catalogItems: CatalogPickerItem[]; currency: string }) {
  const [state, formAction, pending] = useActionState(addQuoteItem, empty);
  const [catalogId, setCatalogId] = useState('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unitPrice, setUnitPrice] = useState('');
  const [billing, setBilling] = useState('');

  useEffect(() => {
    if (state.ok) {
      setCatalogId(''); setName(''); setQuantity('1'); setUnitPrice(''); setBilling('');
    }
  }, [state]);

  function pickCatalog(id: string) {
    setCatalogId(id);
    const ci = catalogItems.find((c) => c.id === id);
    if (ci) {
      setName(ci.name);
      setUnitPrice(ci.basePrice == null ? '' : String(ci.basePrice));
      setBilling(ci.billingInterval ?? '');
    }
  }

  const preview = computeLine(Number(quantity) || 0, Number(unitPrice) || 0).lineTotal;

  return (
    <form action={formAction} className="mt-4 rounded-lg border border-ink/10 bg-paper/40 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-soft">Add a line</p>
      {state.error ? <p className="mt-1 text-sm text-danger" role="alert">{state.error}</p> : null}
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="catalogItemId" value={catalogId} />
      <input type="hidden" name="billingInterval" value={billing} />
      <div className="mt-2 grid gap-2 sm:grid-cols-12">
        <label className="sm:col-span-3">
          <span className="text-xs text-ink-soft">From catalog</span>
          <select value={catalogId} onChange={(e) => pickCatalog(e.target.value)} disabled={pending} className={`${input} w-full`}>
            <option value="">Manual line…</option>
            {catalogItems.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </label>
        <label className="sm:col-span-4">
          <span className="text-xs text-ink-soft">Name</span>
          <input name="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} disabled={pending} className={`${input} w-full`} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs text-ink-soft">Qty</span>
          <input name="quantity" type="number" min="0" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)} disabled={pending} className={`${input} w-full`} />
        </label>
        <label className="sm:col-span-2">
          <span className="text-xs text-ink-soft">Unit price</span>
          <input name="unitPrice" type="number" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} placeholder="0.00" disabled={pending} className={`${input} w-full`} />
        </label>
        <div className="sm:col-span-1 sm:self-end sm:pb-1 text-xs text-ink-soft">{formatMoney(preview, currency)}</div>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <label className="text-xs text-ink-soft">
          Billing
          <select value={billing} onChange={(e) => setBilling(e.target.value)} disabled={pending} className={`${input} ml-2`}>
            {intervals.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
          </select>
        </label>
        <button type="submit" disabled={pending} className="pa-btn pa-btn-primary ml-auto !py-1.5 disabled:opacity-70">
          {pending ? <Spinner size="sm" /> : 'Add line'}
        </button>
      </div>
    </form>
  );
}

function EditRow({ item, currency, onDone }: { item: QuoteLineRow; currency: string; onDone: () => void }) {
  const [state, formAction, pending] = useActionState(updateQuoteItem, empty);
  useEffect(() => { if (state.ok) onDone(); }, [state, onDone]);
  return (
    <tr className="border-b border-ink/5 align-top">
      <td colSpan={6} className="py-2">
        <form action={formAction} className="rounded-lg border border-ink/10 bg-paper/40 p-3">
          {state.error ? <p className="mb-1 text-sm text-danger" role="alert">{state.error}</p> : null}
          <input type="hidden" name="itemId" value={item.id} />
          <div className="grid gap-2 sm:grid-cols-12">
            <label className="sm:col-span-5">
              <span className="text-xs text-ink-soft">Name</span>
              <input name="name" defaultValue={item.name} required maxLength={200} disabled={pending} className={`${input} w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-ink-soft">Qty</span>
              <input name="quantity" type="number" min="0" step="0.01" defaultValue={item.quantity} disabled={pending} className={`${input} w-full`} />
            </label>
            <label className="sm:col-span-2">
              <span className="text-xs text-ink-soft">Unit price</span>
              <input name="unitPrice" type="number" min="0" step="0.01" defaultValue={item.unitPrice} disabled={pending} className={`${input} w-full`} />
            </label>
            <label className="sm:col-span-3">
              <span className="text-xs text-ink-soft">Billing</span>
              <select name="billingInterval" defaultValue={item.billingInterval ?? ''} disabled={pending} className={`${input} w-full`}>
                {intervals.map((i) => <option key={i.value} value={i.value}>{i.label}</option>)}
              </select>
            </label>
            <label className="sm:col-span-12">
              <span className="text-xs text-ink-soft">Description</span>
              <input name="description" defaultValue={item.description ?? ''} maxLength={2000} disabled={pending} className={`${input} w-full`} />
            </label>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-ink-soft">{formatMoney(item.lineTotal, currency)}</span>
            <button type="submit" disabled={pending} className="pa-btn pa-btn-primary ml-auto !py-1.5 disabled:opacity-70">
              {pending ? <Spinner size="sm" /> : 'Save line'}
            </button>
            <button type="button" onClick={onDone} disabled={pending} className="rounded-pill border border-ink/15 px-3 py-1.5 text-xs text-ink hover:bg-ink/5">Cancel</button>
          </div>
        </form>
      </td>
    </tr>
  );
}

function RemoveButton({ itemId, name }: { itemId: string; name: string }) {
  const [, formAction] = useActionState(removeQuoteItem, empty);
  return (
    <form
      action={formAction}
      onSubmit={(e) => { if (!window.confirm(`Remove "${name}" from this quote?`)) e.preventDefault(); }}
      className="inline"
    >
      <input type="hidden" name="itemId" value={itemId} />
      <button type="submit" className="rounded-pill border border-danger/40 px-2 py-1 text-xs text-danger hover:bg-danger/5">Remove</button>
    </form>
  );
}

function ReorderButton({ quoteId, ids, index, dir }: { quoteId: string; ids: string[]; index: number; dir: -1 | 1 }) {
  const [, formAction] = useActionState(reorderQuoteItems, empty);
  const target = index + dir;
  const disabled = target < 0 || target >= ids.length;
  const next = ids.slice();
  if (!disabled) {
    [next[index], next[target]] = [next[target], next[index]];
  }
  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="quoteId" value={quoteId} />
      <input type="hidden" name="orderedIds" value={JSON.stringify(next)} />
      <button type="submit" disabled={disabled} aria-label={dir < 0 ? 'Move up' : 'Move down'} className="rounded-pill border border-ink/15 px-1.5 py-1 text-xs text-ink hover:bg-ink/5 disabled:opacity-30">
        {dir < 0 ? '↑' : '↓'}
      </button>
    </form>
  );
}
