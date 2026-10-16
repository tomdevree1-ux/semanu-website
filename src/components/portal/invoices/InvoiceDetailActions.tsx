'use client';

import { useActionState, useState } from 'react';
import { updateInvoice, changeInvoiceStatus, archiveInvoice, restoreInvoice } from '@/modules/invoices/actions';
import type { InvoiceActionState } from '@/modules/invoices/schema';
import {
  legalNextStatuses,
  permissionForTransition,
  INVOICE_CONFIRM_STATUSES,
  type InvoiceStatus,
} from '@/modules/invoices/status';
import { formatMoney, suggestedTax } from '@/modules/invoices/totals';
import { statusLabel } from '@/components/portal/ui/StatusBadge';
import { EditableBlock } from '@/components/portal/ui/EditableBlock';
import { ConfirmDialog } from '@/components/portal/ui/ConfirmDialog';
import { Spinner } from '@/components/portal/ui/Spinner';
import { LineItemEditor } from './LineItemEditor';
import type { InvoiceDetail } from '@/modules/invoices/types';
import type { CatalogPickerItem } from '@/modules/invoices/queries';

const empty: InvoiceActionState = {};
const input = 'mt-1 w-full rounded-lg border border-ink/15 px-3 py-2 text-ink outline-none focus:border-mint focus:ring-2 focus:ring-mint/30';
const dangerBtn = 'rounded-pill border border-danger/40 px-4 py-1.5 text-sm text-danger transition-colors hover:bg-danger/5';

type Option = { id: string; name: string };

function Notice({ s, okText = 'Saved.' }: { s: InvoiceActionState; okText?: string }) {
  if (s.ok) return <p className="mt-2 rounded-lg bg-ok/10 px-3 py-2 text-sm text-ok" role="status">{okText}</p>;
  if (s.error) return <p className="mt-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{s.error}</p>;
  return null;
}

/** The full updateInvoice field set; each block edits a subset and carries the rest as hidden. */
function allFields(iv: InvoiceDetail): Record<string, string> {
  return {
    invoiceId: iv.id,
    title: iv.title,
    contactId: iv.contactId ?? '',
    projectId: iv.projectId ?? '',
    quoteId: iv.quoteId ?? '',
    dueDate: iv.dueDate ?? '',
    notes: iv.notes ?? '',
    internalNotes: iv.internalNotes ?? '',
    discountAmount: String(iv.discountAmount),
    taxAmount: String(iv.taxAmount),
  };
}
function hiddenExcept(iv: InvoiceDetail, edited: string[]): Record<string, string> {
  const all = allFields(iv);
  for (const k of edited) delete all[k];
  return all;
}

function fmt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString() : '—';
}

export function InvoiceDetailActions({
  invoice,
  contactOptions,
  projectOptions,
  quoteOptions,
  catalogItems,
  canUpdate,
  canArchive,
  canIssue,
  canMarkPaid,
  canVoid,
  hasPayments = false,
}: {
  invoice: InvoiceDetail;
  contactOptions: Option[];
  projectOptions: Option[];
  quoteOptions: Option[];
  catalogItems: CatalogPickerItem[];
  canUpdate: boolean;
  canArchive: boolean;
  canIssue: boolean;
  canMarkPaid: boolean;
  canVoid: boolean;
  hasPayments?: boolean;
}) {
  const [statusState, statusAction, statusPending] = useActionState(changeInvoiceStatus, empty);
  const [restoreState, restoreAction, restorePending] = useActionState(restoreInvoice, empty);

  const contacts: Option[] =
    invoice.contactId && !contactOptions.some((c) => c.id === invoice.contactId)
      ? [{ id: invoice.contactId, name: `${invoice.contactName ?? 'Contact'} (archived)` }, ...contactOptions]
      : contactOptions;
  const projects: Option[] =
    invoice.projectId && !projectOptions.some((p) => p.id === invoice.projectId)
      ? [{ id: invoice.projectId, name: `${invoice.projectName ?? 'Project'} (archived)` }, ...projectOptions]
      : projectOptions;
  const quotes: Option[] =
    invoice.quoteId && !quoteOptions.some((q) => q.id === invoice.quoteId)
      ? [{ id: invoice.quoteId, name: `${invoice.quoteNumber ?? 'Quote'} (archived)` }, ...quoteOptions]
      : quoteOptions;

  const permMap: Record<string, boolean> = {
    'invoices.issue': canIssue,
    'invoices.mark_paid': canMarkPaid,
    'invoices.void': canVoid,
    'invoices.update': canUpdate,
  };
  const targets = legalNextStatuses(invoice.status as InvoiceStatus)
    .filter((t) => permMap[permissionForTransition(invoice.status as InvoiceStatus, t)])
    // P10: when payment records exist, the paid figures are owned by the payments layer — hide the
    // manual mark-paid (→ paid) and un-pay (paid → issued) so the server-side guard is never hit.
    .filter((t) => !hasPayments || !(t === 'paid' || (invoice.status === 'paid' && t === 'issued')));

  if (invoice.isArchived) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Archived</h2>
          <p className="mt-1 text-sm text-ink-soft">
            This invoice is archived and hidden from the default list. Restore it to manage again.
          </p>
          <Notice s={restoreState} okText="Invoice restored." />
          {canArchive ? (
            <form action={restoreAction} className="mt-3">
              <input type="hidden" name="invoiceId" value={invoice.id} />
              <button type="submit" disabled={restorePending} className="pa-btn pa-btn-primary !py-1.5 disabled:opacity-70">
                {restorePending ? 'Restoring…' : 'Restore invoice'}
              </button>
            </form>
          ) : null}
        </div>
        <LineItemEditor invoiceId={invoice.id} items={invoice.items} catalogItems={catalogItems} currency={invoice.currency} canEdit={false} />
        <TotalsView invoice={invoice} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {targets.length > 0 ? (
        <form
          action={statusAction}
          onSubmit={(e) => {
            const v = (e.currentTarget.elements.namedItem('status') as HTMLSelectElement | null)?.value ?? '';
            if (INVOICE_CONFIRM_STATUSES.has(v as never) && !window.confirm(`Mark this invoice as "${statusLabel(v)}"?`)) {
              e.preventDefault();
            }
          }}
          className="rounded-xl border border-ink/10 bg-white p-5"
        >
          <h2 className="font-display text-lg text-ink">Status</h2>
          <Notice s={statusState} okText="Status updated." />
          <input type="hidden" name="invoiceId" value={invoice.id} />
          <div className="mt-2 flex items-center gap-2">
            <select name="status" defaultValue={targets[0]} disabled={statusPending} className={`${input} max-w-xs`}>
              {targets.map((s) => (
                <option key={s} value={s}>{statusLabel(s)}</option>
              ))}
            </select>
            <button type="submit" disabled={statusPending} className="pa-btn pa-btn-primary !py-2 disabled:opacity-70">
              {statusPending ? <Spinner size="sm" /> : 'Apply'}
            </button>
          </div>
          {invoice.status === 'draft' ? null : (
            <p className="mt-2 text-xs text-ink-soft">Issued invoices are read-only. Line items and money cannot be changed.</p>
          )}
        </form>
      ) : null}

      {invoice.isDraft && canUpdate ? (
        <EditableBlock
          title="Invoice details"
          action={updateInvoice}
          hiddenFields={hiddenExcept(invoice, ['title', 'contactId', 'projectId', 'quoteId', 'dueDate'])}
          readView={
            <dl className="grid gap-3 sm:grid-cols-2">
              <Read label="Title" value={invoice.title} />
              <Read label="Due date" value={invoice.dueDate} />
              <Read label="Contact" value={invoice.contactName} />
              <Read label="Project" value={invoice.projectName} />
              <Read label="Source quote" value={invoice.quoteNumber} />
            </dl>
          }
          editView={(pending) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="text-sm font-medium text-ink">Title <span className="text-red">*</span></span>
                <input name="title" defaultValue={invoice.title} required maxLength={200} disabled={pending} className={input} />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Contact</span>
                <select name="contactId" defaultValue={invoice.contactId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {contacts.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Project</span>
                <select name="projectId" defaultValue={invoice.projectId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Source quote</span>
                <select name="quoteId" defaultValue={invoice.quoteId ?? ''} disabled={pending} className={input}>
                  <option value="">— None</option>
                  {quotes.map((q) => <option key={q.id} value={q.id}>{q.name}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-ink">Due date</span>
                <input name="dueDate" type="date" defaultValue={invoice.dueDate ?? ''} disabled={pending} className={input} />
              </label>
            </div>
          )}
        />
      ) : (
        <div className="rounded-xl border border-ink/10 bg-white p-5">
          <h2 className="font-display text-lg text-ink">Invoice details</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <Read label="Title" value={invoice.title} />
            <Read label="Source quote" value={invoice.quoteNumber} />
            <Read label="Contact" value={invoice.contactName} />
            <Read label="Project" value={invoice.projectName} />
            <Read label="Issue date" value={fmt(invoice.issueDate)} />
            <Read label="Due date" value={fmt(invoice.dueDate)} />
            <Read label="Paid at" value={fmt(invoice.paidAt)} />
          </dl>
        </div>
      )}

      <LineItemEditor invoiceId={invoice.id} items={invoice.items} catalogItems={catalogItems} currency={invoice.currency} canEdit={invoice.isDraft && canUpdate} />

      {invoice.isDraft && canUpdate ? <TotalsEditor invoice={invoice} /> : <TotalsView invoice={invoice} />}

      {invoice.isDraft && canUpdate ? (
        <>
          <EditableBlock
            title="Notes (customer facing)"
            action={updateInvoice}
            hiddenFields={hiddenExcept(invoice, ['notes'])}
            readView={<p className="whitespace-pre-wrap text-ink">{invoice.notes || '—'}</p>}
            editView={(pending) => (
              <textarea name="notes" defaultValue={invoice.notes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
            )}
          />
          <EditableBlock
            title="Internal notes (never shown to the customer)"
            action={updateInvoice}
            hiddenFields={hiddenExcept(invoice, ['internalNotes'])}
            readView={<p className="whitespace-pre-wrap text-ink">{invoice.internalNotes || '—'}</p>}
            editView={(pending) => (
              <textarea name="internalNotes" defaultValue={invoice.internalNotes ?? ''} rows={3} maxLength={10000} disabled={pending} className={input} />
            )}
          />
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-base text-ink">Notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{invoice.notes || '—'}</p>
          </div>
          <div className="rounded-xl border border-ink/10 bg-white p-5">
            <h2 className="font-display text-base text-ink">Internal notes</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink">{invoice.internalNotes || '—'}</p>
          </div>
        </div>
      )}

      {canArchive && (invoice.status === 'draft' || invoice.status === 'void') ? (
        <div className="rounded-xl border border-red/20 bg-white p-5">
          <h2 className="font-display text-lg text-red">Danger zone</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Archiving hides the invoice from the default list. It is kept (no hard delete) and can be
            restored. Only draft or void invoices can be archived.
          </p>
          <div className="mt-3">
            <ConfirmDialog
              triggerLabel="Archive invoice"
              triggerClassName={dangerBtn}
              title="Archive this invoice"
              description={`This hides ${invoice.invoiceNumber} from the default list. It can be restored later.`}
              confirmWord={invoice.invoiceNumber}
              confirmLabel="Archive invoice"
              action={archiveInvoice}
              hiddenFields={{ invoiceId: invoice.id }}
              danger
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TotalsEditor({ invoice }: { invoice: InvoiceDetail }) {
  const [state, formAction, pending] = useActionState(updateInvoice, empty);
  const [discount, setDiscount] = useState(String(invoice.discountAmount));
  const [tax, setTax] = useState(String(invoice.taxAmount));

  return (
    <form action={formAction} className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Totals</h2>
      <Notice s={state} okText="Totals saved." />
      {Object.entries(hiddenExcept(invoice, ['discountAmount', 'taxAmount'])).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-soft">Discount ({invoice.currency})</dt>
          <input name="discountAmount" type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} disabled={pending} className={`${input} mt-0 w-32 text-right`} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-ink-soft">
            Tax ({invoice.currency}){' '}
            <button type="button" onClick={() => setTax(String(suggestedTax(invoice.subtotal, Number(discount) || 0)))} className="ml-1 rounded-pill border border-ink/15 px-2 py-0.5 text-xs text-ink hover:bg-ink/5">+8.1%</button>
          </dt>
          <input name="taxAmount" type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} disabled={pending} className={`${input} mt-0 w-32 text-right`} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 font-display text-base text-ink">
          <dt>Total</dt>
          <dd>{formatMoney(invoice.totalAmount, invoice.currency)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-xs text-ink-soft">Total recalculates on save. Prices are net (ex VAT).</p>
      <button type="submit" disabled={pending} className="pa-btn pa-btn-primary mt-3 !py-2 disabled:opacity-70">
        {pending ? <Spinner size="sm" /> : 'Save totals'}
      </button>
    </form>
  );
}

function TotalsView({ invoice }: { invoice: InvoiceDetail }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white p-5">
      <h2 className="font-display text-lg text-ink">Totals</h2>
      <dl className="mt-3 space-y-2 text-sm">
        <Row label="Subtotal" value={formatMoney(invoice.subtotal, invoice.currency)} />
        <Row label="Discount" value={formatMoney(invoice.discountAmount, invoice.currency)} />
        <Row label="Tax" value={formatMoney(invoice.taxAmount, invoice.currency)} />
        <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-2 font-display text-base text-ink">
          <dt>Total</dt>
          <dd>{formatMoney(invoice.totalAmount, invoice.currency)}</dd>
        </div>
        <Row label="Amount paid" value={formatMoney(invoice.amountPaid, invoice.currency)} />
        <div className="flex items-center justify-between gap-3 font-medium text-ink">
          <dt>Balance due</dt>
          <dd>{formatMoney(invoice.balanceDue, invoice.currency)}</dd>
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
