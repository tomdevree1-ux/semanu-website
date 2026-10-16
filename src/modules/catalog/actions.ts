'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireAuth } from '@/lib/security/rbac';
import { hasPermission } from '@/lib/security/authorize';
import { logEvent } from '@/lib/audit/log';
import { catalogCreateSchema, catalogUpdateSchema, catalogStatusChangeSchema, type CatalogActionState } from './schema';
import { isLegalCatalogTransition, confirmMatches } from './guards';

const GENERIC = 'Something went wrong. Please try again.';
const NOT_ALLOWED = 'You do not have permission to do this.';
const CODE_TAKEN = 'That code is already in use.';

type Admin = ReturnType<typeof createAdminClient>;
type CatalogFields = ReturnType<typeof catalogCreateSchema.parse>;

function readFields(fd: FormData) {
  return {
    name: fd.get('name'),
    code: fd.get('code'),
    description: fd.get('description'),
    itemType: fd.get('itemType'),
    category: fd.get('category'),
    basePrice: fd.get('basePrice'),
    currency: fd.get('currency'),
    priceIsFrom: fd.get('priceIsFrom'),
    billingInterval: fd.get('billingInterval'),
    setupFee: fd.get('setupFee'),
    isPublic: fd.get('isPublic'),
  };
}

function toRow(input: CatalogFields) {
  return {
    name: input.name,
    code: input.code ?? null,
    description: input.description ?? null,
    item_type: input.itemType,
    category: input.category ?? null,
    base_price: input.basePrice ?? null,
    currency: input.currency,
    price_is_from: input.priceIsFrom,
    billing_interval: input.billingInterval,
    setup_fee: input.setupFee ?? null,
    is_public: input.isPublic,
  };
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isNaN(n) ? null : n;
}

/** Case-insensitive code uniqueness pre-check (the DB unique index is the backstop). */
async function codeTaken(admin: Admin, code: string | null, excludeId?: string): Promise<boolean> {
  if (!code) return false;
  const escaped = code.replace(/[\\%_]/g, (c) => '\\' + c); // ilike exact match
  const { data } = await admin.from('catalog_items').select('id').ilike('code', escaped);
  return (data ?? []).some((r) => r.id !== excludeId);
}

/** Create a catalog item. Redirects to its detail page on success. */
export async function createCatalogItem(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('catalog.create'))) return { error: NOT_ALLOWED };

  const parsed = catalogCreateSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  if (await codeTaken(admin, input.code ?? null)) return { error: CODE_TAKEN };

  const { data, error } = await admin
    .from('catalog_items')
    .insert({ ...toRow(input), status: 'draft', created_by: actor.id, updated_by: actor.id })
    .select('id')
    .single();
  if (error || !data) return { error: error?.code === '23505' ? CODE_TAKEN : GENERIC };

  await logEvent({
    action: 'catalog.created',
    actorId: actor.id,
    entityType: 'catalog_item',
    entityId: data.id,
    entityDisplayName: input.name,
    newStatus: 'draft',
    metadata: input.code ? { code: input.code } : null,
    source: 'portal',
  });

  revalidatePath('/app/catalog');
  redirect(`/app/catalog/${data.id}`);
}

/** Edit a catalog item (EditableBlock). */
export async function updateCatalogItem(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('catalog.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('catalogItemId') ?? '');
  if (!id) return { error: GENERIC };

  const parsed = catalogUpdateSchema.safeParse(readFields(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Invalid input.' };
  const input = parsed.data;

  const admin = createAdminClient();
  const { data: before } = await admin
    .from('catalog_items')
    .select('name,code,description,item_type,category,base_price,currency,price_is_from,billing_interval,setup_fee,is_public')
    .eq('id', id)
    .maybeSingle();
  if (!before) return { error: 'Catalog item not found.' };
  if (await codeTaken(admin, input.code ?? null, id)) return { error: CODE_TAKEN };

  const next = { ...toRow(input), updated_by: actor.id };
  const { error } = await admin.from('catalog_items').update(next).eq('id', id);
  if (error) return { error: error?.code === '23505' ? CODE_TAKEN : GENERIC };

  // Changed field NAMES only in ordinary metadata (no commercial price values); full before/after
  // goes to old_values/new_values (technical-only, audit.read_technical).
  const compare = toRow(input);
  const beforeNorm = { ...before, base_price: num(before.base_price), setup_fee: num(before.setup_fee) };
  const changed = Object.keys(compare).filter(
    (k) => (beforeNorm as Record<string, unknown>)[k] !== (compare as Record<string, unknown>)[k],
  );
  await logEvent({
    action: 'catalog.updated',
    actorId: actor.id,
    entityType: 'catalog_item',
    entityId: id,
    entityDisplayName: input.name,
    metadata: { fields: changed },
    oldValues: beforeNorm,
    newValues: compare,
    source: 'portal',
  });

  revalidatePath(`/app/catalog/${id}`);
  revalidatePath('/app/catalog');
  return { ok: true };
}

/** Change a catalog item's lifecycle status (machine-validated). */
export async function changeCatalogItemStatus(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('catalog.update'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('catalogItemId') ?? '');
  const parsed = catalogStatusChangeSchema.safeParse({ status: formData.get('status') });
  if (!id || !parsed.success) return { error: parsed.success ? GENERIC : 'Choose a valid status.' };
  const to = parsed.data.status;

  const admin = createAdminClient();
  const { data: c } = await admin.from('catalog_items').select('status, name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Catalog item not found.' };
  if (c.archived_at) return { error: 'Restore this item before changing its status.' };
  if (c.status === to) return { ok: true };
  if (!isLegalCatalogTransition(c.status, to)) return { error: 'That status change is not allowed.' };

  const { error } = await admin.from('catalog_items').update({ status: to, updated_by: actor.id }).eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'catalog.status_changed',
    actorId: actor.id,
    entityType: 'catalog_item',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: c.status,
    newStatus: to,
    source: 'portal',
  });

  revalidatePath(`/app/catalog/${id}`);
  revalidatePath('/app/catalog');
  return { ok: true };
}

/** Archive a catalog item (soft, reversible). Type-to-confirm the item name. No hard delete. */
export async function archiveCatalogItem(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('catalog.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('catalogItemId') ?? '');
  const typed = String(formData.get('confirmationEmail') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin.from('catalog_items').select('status, name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Catalog item not found.' };
  if (c.archived_at) return { ok: true };
  if (!confirmMatches(typed, c.name)) return { error: 'The name you typed does not match.' };

  const { error } = await admin
    .from('catalog_items')
    .update({ status: 'archived', archived_at: new Date().toISOString(), archived_by: actor.id, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'catalog.archived',
    actorId: actor.id,
    severity: 'warning',
    entityType: 'catalog_item',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: c.status,
    newStatus: 'archived',
    source: 'portal',
  });

  revalidatePath(`/app/catalog/${id}`);
  revalidatePath('/app/catalog');
  return { ok: true };
}

/** Restore an archived catalog item to `draft`. */
export async function restoreCatalogItem(_prev: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const actor = await requireAuth();
  if (!(await hasPermission('catalog.archive'))) return { error: NOT_ALLOWED };
  const id = String(formData.get('catalogItemId') ?? '');
  if (!id) return { error: GENERIC };

  const admin = createAdminClient();
  const { data: c } = await admin.from('catalog_items').select('name, archived_at').eq('id', id).maybeSingle();
  if (!c) return { error: 'Catalog item not found.' };
  if (!c.archived_at) return { error: 'This item is not archived.' };

  const { error } = await admin
    .from('catalog_items')
    .update({ status: 'draft', archived_at: null, archived_by: null, updated_by: actor.id })
    .eq('id', id);
  if (error) return { error: GENERIC };

  await logEvent({
    action: 'catalog.restored',
    actorId: actor.id,
    entityType: 'catalog_item',
    entityId: id,
    entityDisplayName: c.name,
    oldStatus: 'archived',
    newStatus: 'draft',
    source: 'portal',
  });

  revalidatePath(`/app/catalog/${id}`);
  revalidatePath('/app/catalog');
  return { ok: true };
}
