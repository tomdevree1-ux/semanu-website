'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createLeadNote, deleteLeadNote, listLeadNoteVersions, updateLeadNote } from '@/modules/lead-notes/actions';
import type { LeadNote, LeadNoteVersion } from '@/modules/lead-notes/types';
import { Spinner } from '@/components/portal/ui/Spinner';

const df = new Intl.DateTimeFormat('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmt = (iso: string) => df.format(new Date(iso));

const textarea =
  'w-full resize-y rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-mint focus:ring-4 focus:ring-mint/25';

export function LeadNotes({ leadId, notes, canManage }: { leadId: string; notes: LeadNote[]; canManage: boolean }) {
  const router = useRouter();
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState('');
  const [history, setHistory] = useState<{ noteId: string; rows: LeadNoteVersion[] | null } | null>(null);
  const [pending, startTransition] = useTransition();

  function add() {
    if (!draft.trim()) return;
    startTransition(async () => {
      await createLeadNote(leadId, draft);
      setDraft('');
      router.refresh();
    });
  }

  function saveEdit() {
    if (!editingId || !editBody.trim()) return;
    const id = editingId;
    startTransition(async () => {
      await updateLeadNote(id, editBody);
      setEditingId(null);
      setEditBody('');
      router.refresh();
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteLeadNote(id);
      router.refresh();
    });
  }

  function openHistory(noteId: string) {
    setHistory({ noteId, rows: null });
    startTransition(async () => {
      const rows = await listLeadNoteVersions(noteId);
      setHistory({ noteId, rows });
    });
  }

  return (
    <div className="space-y-7">
      {canManage ? (
        <div>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            placeholder="Add a note about this lead..."
            className={textarea}
          />
          <div className="mt-3">
            <button type="button" onClick={add} disabled={pending || !draft.trim()} className="pa-btn pa-btn-primary pa-btn-sm disabled:opacity-50">
              {pending ? <Spinner size="sm" /> : 'Add note'}
            </button>
          </div>
        </div>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-ink-soft">No notes yet.</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl border border-ink/10 bg-paper/50 p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-[11px] text-ink-soft">
                  {n.authorName} · {fmt(n.createdAt)}
                  {n.version > 1 ? <span className="text-ink-soft"> · edited {fmt(n.updatedAt)}</span> : null}
                </p>
                <div className="flex items-center gap-1">
                  {n.version > 1 ? (
                    <button type="button" onClick={() => openHistory(n.id)} className="note-ic" aria-label="Version history" title="Version history">
                      <svg viewBox="0 0 24 24" aria-hidden><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>
                    </button>
                  ) : null}
                  {canManage ? (
                    <>
                      <button type="button" onClick={() => { setEditingId(n.id); setEditBody(n.body); }} className="note-ic" aria-label="Edit note" title="Edit note">
                        <svg viewBox="0 0 24 24" aria-hidden><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></svg>
                      </button>
                      <button type="button" onClick={() => remove(n.id)} className="note-ic note-ic--danger" aria-label="Delete note" title="Delete note">
                        <svg viewBox="0 0 24 24" aria-hidden><path d="M3 6h18" /><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                      </button>
                    </>
                  ) : null}
                </div>
              </div>

              {editingId === n.id ? (
                <div className="mt-3">
                  <textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={3} className={textarea} />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={saveEdit} disabled={pending || !editBody.trim()} className="pa-btn pa-btn-primary pa-btn-sm disabled:opacity-50">
                      {pending ? <Spinner size="sm" /> : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)} className="pa-btn pa-btn-ghost pa-btn-sm">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{n.body}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {history ? (
        <div className="fixed inset-0 z-[70] grid place-items-center p-4" role="dialog" aria-modal="true" aria-label="Note history">
          <div className="absolute inset-0 bg-ink/30" onClick={() => setHistory(null)} aria-hidden />
          <div className="relative flex max-h-[80vh] w-full max-w-lg flex-col rounded-2xl bg-paper p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg text-ink">Note history</h2>
              <button type="button" onClick={() => setHistory(null)} className="pa-btn pa-btn-ghost pa-btn-sm">Close</button>
            </div>
            <div className="mt-4 space-y-3 overflow-y-auto">
              {history.rows === null ? (
                <p className="text-sm text-ink-soft">Loading…</p>
              ) : (
                history.rows.map((v) => (
                  <div key={v.version} className="rounded-xl border border-ink/10 bg-white p-4">
                    <p className="font-mono text-[11px] text-ink-soft">v{v.version} · {v.authorName} · {fmt(v.createdAt)}</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{v.body}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
