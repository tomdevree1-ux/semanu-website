'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from './icons';

export type CommandItem = {
  group: string;
  icon: string;
  label: string;
  hint: string;
  href: string;
};

/**
 * Global ⌘K command palette. Open/close + the ⌘K shortcut are owned by PortalShell;
 * this renders the modal, filters live, and is fully keyboard driven
 * (up/down to move, enter to go, esc to close). Every command navigates to a route.
 */
export function CommandPalette({
  open,
  onClose,
  commands,
}: {
  open: boolean;
  onClose: () => void;
  commands: CommandItem[];
}) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return commands;
    return commands.filter(
      (c) =>
        c.label.toLowerCase().includes(s) ||
        c.group.toLowerCase().includes(s) ||
        c.hint.toLowerCase().includes(s),
    );
  }, [q, commands]);

  useEffect(() => {
    setSel(0);
  }, [q]);

  useEffect(() => {
    if (open) {
      setQ('');
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSel((s) => Math.min(s + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSel((s) => Math.max(s - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const c = filtered[sel];
        if (c) {
          router.push(c.href);
          onClose();
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, filtered, sel, router, onClose]);

  if (!open) return null;

  let lastGroup: string | null = null;
  return (
    <div className="cmd-scrim" onMouseDown={onClose}>
      <div className="cmd" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Command palette">
        <div className="cmd-input">
          <Icon n="search" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command or search…"
            aria-label="Search commands"
          />
          <span className="esc">ESC</span>
        </div>
        <div className="cmd-list">
          {filtered.length === 0 && <div className="cmd-group">No results for “{q}”</div>}
          {filtered.map((c, i) => {
            const head = c.group !== lastGroup ? <div className="cmd-group">{c.group}</div> : null;
            lastGroup = c.group;
            return (
              <Fragment key={c.href + i}>
                {head}
                <div
                  className={'cmd-item' + (i === sel ? ' sel' : '')}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => {
                    router.push(c.href);
                    onClose();
                  }}
                >
                  <span className="ci">
                    <Icon n={c.icon} />
                  </span>
                  <span className="cl">
                    {c.label}
                    <span className="cd">{c.hint}</span>
                  </span>
                  <span className="ck">↵</span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
