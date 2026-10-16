'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { SupabaseClient } from '@supabase/supabase-js';
import { requirePermission } from '@/lib/security/rbac';
import { createAdminClient } from '@/lib/supabase/admin';

const db = () => createAdminClient() as unknown as SupabaseClient;

const spendSchema = z.object({
  date: z.string().min(8),
  channel: z.string().min(1),
  source: z.string().trim().optional(),
  campaign: z.string().trim().optional(),
  campaign_id: z.string().trim().optional(),
  currency: z.string().trim().length(3),
  spend_amount: z.coerce.number().min(0),
  exchange_rate_to_base: z.coerce.number().positive().optional(),
  impressions: z.coerce.number().int().min(0).optional(),
  clicks: z.coerce.number().int().min(0).optional(),
  notes: z.string().trim().optional(),
});

const SPEND = '/app/acquisition/spend';

/** Permission-gated manual ad-spend entry. Service-role insert; created_by recorded. */
export async function createSpendEntry(formData: FormData): Promise<void> {
  const profile = await requirePermission('acquisition.manage');
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = spendSchema.safeParse(raw);
  if (!parsed.success) redirect(`${SPEND}?error=invalid`);
  const v = parsed.data;

  const { data: tRow } = await db().from('acquisition_targets').select('base_currency').limit(1).maybeSingle();
  const base = (((tRow as { base_currency?: string } | null)?.base_currency ?? 'CHF')).toUpperCase();
  const cur = v.currency.toUpperCase();

  let spendBase: number;
  if (cur === base) spendBase = v.spend_amount;
  else if (v.exchange_rate_to_base) spendBase = v.spend_amount * v.exchange_rate_to_base;
  else redirect(`${SPEND}?error=fx`);

  await db()
    .from('marketing_spend_daily')
    .insert({
      date: v.date,
      channel: v.channel,
      source: v.source || null,
      campaign: v.campaign || null,
      campaign_id: v.campaign_id || null,
      currency: cur,
      spend_amount: v.spend_amount,
      exchange_rate_to_base: cur === base ? null : v.exchange_rate_to_base ?? null,
      spend_amount_base: spendBase!,
      impressions: v.impressions ?? null,
      clicks: v.clicks ?? null,
      notes: v.notes || null,
      created_by: profile.id,
    });

  revalidatePath('/app/acquisition');
  revalidatePath(SPEND);
  redirect(`${SPEND}?ok=1`);
}

/** Permission-gated marketing change-log entry (anti-doom-loop). */
export async function createChangeLogEntry(formData: FormData): Promise<void> {
  const profile = await requirePermission('acquisition.manage');
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const schema = z.object({
    channel: z.string().min(1),
    campaign: z.string().trim().optional(),
    change_type: z.string().min(1),
    reason: z.string().trim().optional(),
    cooldown_days: z.coerce.number().int().min(0).optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) redirect(`/app/acquisition?error=change`);
  const v = parsed.data;
  const cooldownUntil = v.cooldown_days ? new Date(Date.now() + v.cooldown_days * 86_400_000).toISOString() : null;
  await db().from('marketing_change_log').insert({
    channel: v.channel,
    campaign: v.campaign || null,
    change_type: v.change_type,
    reason: v.reason || null,
    cooldown_until: cooldownUntil,
    next_review_at: cooldownUntil,
    changed_by: profile.id,
  });
  revalidatePath('/app/acquisition');
  redirect('/app/acquisition?ok=change');
}
