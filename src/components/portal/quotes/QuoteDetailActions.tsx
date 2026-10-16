'use client';

import { useActionState, useState } from 'react';
import { updateQuote, changeQuoteStatus, archiveQuote, restoreQuote } from '@/modules/quotes/actions';
import { createInvoiceFromQuote } from '@/modules/invoices/actions';
import type { QuoteActionState } from '@/modules/quotes/schema';
import type { InvoiceActionState } from '@/modules/invoices/schema';
import { QUOTE_SELECTABLE_STATUSES, QUOTE_CONFIRM_STATUSES } from '@/modules/quotes/status';
import { formatMoney, suggestedTax } from '@/modules/quotes/totals';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import { LineItemEditor } from './LineItemEditor';
import type { QuoteDetail } from '@/modules/quotes/types';
import type { CatalogPickerItem } from '@/modules/quotes/queries';

const empty: QuoteActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

type Option = { id: string; name: string };

function Notice({ s, okText = 'Saved.' }: { s: QuoteActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

/** The full updateQuote field set; each block edits a subset and carries the rest as hidden. */
function allFields(q: QuoteDetail): Record<string, string> {
  return {
    quoteId: q.id,
    title: q.title,
    contactId: q.contactId ?? '',
    projectId: q.projectId ?? '',
    validUntil: q.validUntil ?? '',
    notes: q.notes ?? '',
    internalNotes: q.internalNotes ?? '',
    discountAmount: String(q.discountAmount),
    taxAmount: String(q.taxAmount),
  };
}
function hiddenExcept(q: QuoteDetail, edited: string[]): Record<string, string> {
  const all = allFields(q);
  for (const k of edited) delete all[k];
  return all;
}

export function QuoteDetailActions({
  quote,
  contactOptions,
  projectOptions,
  catalogItems,
  canUpdate,
  canArchive,
  canCreateInvoice,
}: {
  quote: QuoteDetail;
  contactOptions: Option[];
  projectOptions: Option[];
  catalogItems: CatalogPickerItem[];
  canUpdate: boolean;
  canArchive: boolean;
  canCreateInvoice: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeQuoteStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreQuote, empty);

  const contacts: Option[] =
    quote.contactId && !contactOptions.some((c) => c.id === quote.contactId)
      ? [{ id: quote.contactId, name: `${quote.contactName ?? 'Contact'} (archived)` }, ...contactOptions]
      : contactOptions;
  const projects: Option[] =
    quote.projectId && !projectOptions.some((p) => p.id === quote.projectId)
      ? [{ id: quote.projectId, name: `${quote.projectName ?? 'Project'} (archived)` }, ...projectOptions]
      : projectOptions;

  if (quote.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">
            This quote is archived and hidden from the default list. Restore it to manage again.
          </p>
          <Notice s={restoreState} okText="Quote restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="quoteId" value={quote.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore quote'}
              </button>
            </form>
          ) : null}
        </div>
        <LineItemEditor quoteId={quote.id} items={quote.items} catalogItems={catalogItems} currency={quote.currency} canEdit={false} />
        <TotalsView quote={quote} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {canCreateInvoice ? <CreateInvoiceButton quoteId={quote.id} accepted={quote.status === 'accepted'} /> : null}
      {canUpdate ? (
        <form
          action={statusAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('status') as HTMLSelectElement | null)?.value ?? '';
            if (QUOTE_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Mark this quote as "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="quoteId" value={quote.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={quote.status} disabled={statusPending} className={`${input} max-w-xs`}>
              {QUOTE_SELECTABLE_STATUSES.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Update'}
            </button>
          </div>
        </form>
      ) : null}

      {canUpdate ? (
        <EditableBlock
          title="Quote details"
          action={updateQuote}
          hiddenFields={hiddenExcept(quote, ['title', 'contactId', 'projectId', 'validUntil'])}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Title" value={quote.title} />
              <Read label="Valid until" value={quote.validUntil} />
              <Read label="Contact" value={quote.contactName} />
              <Read label="Project" value={quote.projectName} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Title <span className="text-red">*</span></span>
                <input name="title" defaultValue={quote.title} required maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Contact</span>
                <select name="contactId" defaultValue={quote.contactId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Project</span>
                <select name="projectId" defaultValue={quote.projectId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Valid until</span>
                <input name="validUntil" type="date" defaultValue={quote.validUntil ?? ''} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : null}

      <LineItemEditor quoteId={quote.id} items={quote.items} catalogItems={catalogItems} currency={quote.currency} canEdit={canUpdate} />

      {canUpdate ? <TotalsEditor quote={quote} /> : <TotalsView quote={quote} />}

      {canUpdate ? (
        <>
          <EditableBlock
            title="Notes (customer facing)"
            action={updateQuote}
            hiddenFields={hiddenExcept(quote, ['notes'])}
            readView={<p className="whitespace-pre-wrap text-ink">{quote.notes || '—'}</p>}
            editView={(pending) => (
              <textarea name="notes" defaultValue={quote.notes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
            )}
          />
          <EditableBlock
            title="Internal notes (never shown to the customer)"
            action={updateQuote}
            hiddenFields={hiddenExcept(quote, ['internalNotes'])}
            readView={<p className="whitespace-pre-wrap text-ink">{quote.internalNotes || '—'}</p>}
            editView={(pending) => (
              <textarea name="internalNotes" defaultValue={quote.internalNotes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
            )}
          />
        </>
      ) : null}

      {canArchive ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the quote from the default list. It is kept (no hard delete) and can be
            restored.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive quote"
              triggerClassName={dangerBtn}
              title="Archive this quote"
              description={`This hides ${quote.quoteNumber} from the default list. It can be restored later.`}
              confirmWord={quote.quoteNumber}
              confirmLabel="Archive quote"
              action={archiveQuote}
              hiddenFields={{ quoteId: quote.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TotalsEditor({ quote }: { quote: QuoteDetail }) {
  const [state, formAction, pending] = useActionState(updateQuote, empty);
  const [discount, setDiscount] = useState(String(quote.discountAmount));
  const [tax, setTax] = useState(String(quote.taxAmount));

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Totals</h2>
      <Notice s={state} okText="Totals saved." />
      {Object.entries(hiddenExcept(quote, ['discountAmount', 'taxAmount'])).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(quote.subtotal, quote.currency)} />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-soft">Discount ({quote.currency})</dt>
          <input name="discountAmount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={pending} className={`${input} mt-0 w-32 text-right`} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-soft">
            Tax ({quote.currency}){' '}
            <button type="button" onClick={() => setTax(String(suggestedTax(quote.subtotal, Number(discount) || 0)))} className="ml-1 rounded-pill border border-ink/15 px-2 py-0.5 text-xs text-ink hover:bg-ink/5">+8.1%</button>
          </dt>
          <input name="taxAmount" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} disabled={pending} className={`${input} mt-0 w-32 text-right`} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 font-display text-base text-ink">
          <dt>Total</dt>
          <dd>{formatMoney(quote.totalAmount, quote.currency)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-ink-soft">Total recalculates on save. Prices are net (ex VAT).</p>
      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-3 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Save totals'}
      </button>
    </form>
  );
}

function TotalsView({ quote }: { quote: QuoteDetail }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Totals</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(quote.subtotal, quote.currency)} />
        <Row label="Discount" value={formatMoney(quote.discountAmount, quote.currency)} />
        <Row label="Tax" value={formatMoney(quote.taxAmount, quote.currency)} />
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 font-display text-base text-ink">
          <dt>Total</dt>
          <dd>{formatMoney(quote.totalAmount, quote.currency)}</dd>
        </div>
      </dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-ink">{value}</dd>
    </div>
  );
}

function Read({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs text-ink-soft">{label}</dt>
      <dd className="text-ink">{value || '—'}</dd>
    </div>
  );
}

const emptyInvoice: InvoiceActionState = {};

/** Additive (P9): turn this quote into a draft invoice. Gated by invoices.create; prominent on accepted quotes. */
function CreateInvoiceButton({ quoteId, accepted }: { quoteId: string; accepted: boolean }) {
  const [state, formAction, pending] = useActionState(createInvoiceFromQuote, emptyInvoice);
  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg text-ink">Invoice</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Create an invoice from this quote. Lines, discount and tax are copied into a draft you can
            edit before issuing.
          </p>
        </div>
        <input type="hidden" name="quoteId" value={quoteId} />
        <button
          type="submit"
          disabled={pending}
          className={accepted
            ? 'pa-btn pa-btn-primary !py-2 disabled:opacity-70'
            : 'shrink-0 rounded-pill border border-ink/15 px-4 py-2 text-sm text-ink transition-colors hover:bg-ink/5 disabled:opacity-70'}
        >
          {pending ? 'Creating…' : 'Create invoice'}
        </button>
      </div>
      {state.error ? <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{state.error}</p> : null}
    </form>
  );
}
