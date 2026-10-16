'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { lineLabel } from './labels';
import type { ConfigLine, ConfigPayload } from './types';

function num(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? 0 : n;
}

/**
 * One-click: turn a configuration into a draft quote. Creates (or reuses) a
 * company + primary contact from the linked lead, a draft quote, and one line
 * item per configurator line. Operator-initiated (requires quotes.create).
 * On any problem it redirects back with ?error=<code>; on success it opens the quote.
 */
export async function createQuoteFromConfiguration(formData: FormData): Promise<void> {
  const configId = String(formData.get('configurationId') ?? '');
  if (!configId) redirect('/app/configurations');
  const back = `/app/configurations/${configId}`;

  const actor = await requireAuth();
  if (!(await hasPermission('quotes.create'))) redirect(`${back}?error=permission`);

  const admin = createAdminClient();
  const { data: cfg } = await admin
    .from('configurations')
    .select('id, title, status, company_id, lead_id, current_version, quote_id, archived_at')
    .eq('id', configId)
    .maybeSingle();
  if (!cfg) redirect(`${back}?error=notfound`);
  if (cfg.archived_at) redirect(`${back}?error=archived`);
  if (cfg.quote_id) redirect(`/app/quotes/${cfg.quote_id}`);

  const { data: ver } = await admin
    .from('configuration_versions')
    .select('payload')
    .eq('configuration_id', configId)
    .eq('version', cfg.current_version)
    .maybeSingle();
  const payload = (ver?.payload ?? {}) as ConfigPayload;
  const lines: ConfigLine[] = Array.isArray(payload.lines) ? payload.lines : [];
  if (!lines.length) redirect(`${back}?error=nolines`);

  // Ensure a company + primary contact from the lead.
  let companyId = cfg.company_id as string | null;
  if (!companyId) {
    const { data: lead } = cfg.lead_id
      ? await admin.from('leads').select('firstname, lastname, email, company, phone').eq('id', cfg.lead_id).maybeSingle()
      : { data: null };
    const leadName = lead ? [lead.firstname, lead.lastname].filter(Boolean).join(' ').trim() : '';
    const companyName = lead?.company || leadName || 'Website lead';
    const { data: comp } = await admin
      .from('companies')
      .insert({ company_name: companyName, email: lead?.email ?? null, phone: lead?.phone ?? null, source: 'configurator', crm_status: 'lead' })
      .select('id')
      .single();
    if (!comp) redirect(`${back}?error=company`);
    companyId = comp.id;
    if (lead?.email) {
      await admin.from('company_contacts').insert({
        company_id: companyId,
        name: leadName || lead.email,
        email: lead.email,
        phone: lead.phone ?? null,
        is_primary: true,
        created_by: actor.id,
      });
    }
    await admin.from('configurations').update({ company_id: companyId }).eq('id', configId);
  }

  // Create the draft quote.
  const { data: quote } = await admin
    .from('quotes')
    .insert({
      title: cfg.title || 'Website configuration',
      company_id: companyId,
      status: 'draft',
      created_by: actor.id,
      updated_by: actor.id,
    })
    .select('id, quote_number')
    .single();
  if (!quote) redirect(`${back}?error=quote`);

  const items = lines.map((l, i) => {
    const amount = num(l.amount);
    return {
      quote_id: quote.id,
      position: i + 1,
      name: lineLabel(l.key),
      quantity: 1,
      unit_price: amount,
      billing_interval: l.per === 'month' ? 'monthly' : 'one_time',
      line_subtotal: amount,
      line_total: amount,
    };
  });
  await admin.from('quote_items').insert(items);
  await admin.from('configurations').update({ status: 'quoted', quote_id: quote.id, updated_by: actor.id }).eq('id', configId);

  await logEvent({
    action: 'configuration.quote_created',
    actorId: actor.id,
    entityType: 'configuration',
    entityId: configId,
    entityDisplayName: quote.quote_number,
    metadata: { quote_id: quote.id, quote_number: quote.quote_number, company_id: companyId, lines: items.length },
    source: 'portal',
  });

  revalidatePath(`/app/configurations/${configId}`);
  redirect(`/app/quotes/${quote.id}`);
}
