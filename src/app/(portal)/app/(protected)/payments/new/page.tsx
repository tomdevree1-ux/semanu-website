import Link from 'next/link';
import { requirePermission } from '@/lib/security/rbac';
import { getPayableInvoice, listInvoiceOptionsForPayment } from '@/modules/payments/queries';
import { invoiceAllowsPayment } from '@/modules/payments/guards';
import { PaymentForm } from '@/components/portal/payments/PaymentForm';

export default async function NewPaymentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await requirePermission('payments.create');
  const sp = await searchParams;
  const invoiceId = sp.invoiceId;

  const fixed = invoiceId ? await getPayableInvoice(invoiceId) : null;
  const backHref = fixed ? `/app/invoices/${fixed.id}` : '/app/payments';

  // If a specific invoice was requested but it can't take a payment, explain.
  if (invoiceId && (!fixed || !invoiceAllowsPayment(fixed.status, fixed.archived ? 'x' : null))) {
    return (
      <div className="mx-auto max-w-2xl">
        <Link href={backHref} className="text-sm text-red hover:underline">← Back</Link>
        <h1 className="mt-3 font-display text-3xl text-ink">Record a payment</h1>
        <div className="mt-5 rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
          {fixed ? 'This invoice is void or archived, so it cannot take a new payment.' : 'Invoice not found.'}
        </div>
      </div>
    );
  }

  const invoiceOptions = fixed ? [] : await listInvoiceOptionsForPayment();

  return (
    <div className="mx-auto max-w-2xl">
      <Link href={backHref} className="text-sm text-red hover:underline">← Back</Link>
      <h1 className="mt-3 font-display text-3xl text-ink">Record a payment</h1>
      <p className="mt-1 text-sm text-ink-soft">A payment always belongs to one invoice.</p>

      <div className="mt-5">
        {fixed || invoiceOptions.length ? (
          <PaymentForm fixedInvoice={fixed} invoiceOptions={invoiceOptions} />
        ) : (
          <div className="rounded-xl border border-ink/10 bg-white p-6 text-sm text-ink-soft">
            You need an issued invoice first.{' '}
            <Link href="/app/invoices" className="text-red hover:underline">Go to invoices</Link>.
          </div>
        )}
      </div>
    </div>
  );
}
