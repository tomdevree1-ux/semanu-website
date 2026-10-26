'use client';

import { useEffect, useId, useRef, useState } from 'react';

export type SelectOption = { value: string; label: string };

/**
 * Fully styled select (on-brand), replacing the native browser dropdown so the
 * open list matches the design too. Keeps a hidden input so it submits normally
 * inside a <form> via FormData.
 */
export function CustomSelect({
  name,
  options,
  defaultValue,
  id,
  value: controlledValue,
  onChange,
}: {
  name: string;
  options: SelectOption[];
  defaultValue?: string;
  id?: string;
  /** Controlled value (optional). When set, the parent owns the value. */
  value?: string;
  /** Called with the new value on selection (for controlled use). */
  onChange?: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value ?? '');
  const value = controlledValue ?? internalValue;
  const choose = (v: string) => {
    if (controlledValue === undefined) setInternalValue(v);
    onChange?.(v);
    setOpen(false);
  };
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const selected = options.find((o) => o.value === value) ?? options[0];

  return (
    <div className="relative" ref={ref}>
      <input type="hidden" name={name} value={value} />
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-2xl border border-transparent bg-[#EEF1F6] px-5 py-4 text-left text-[17px] text-ink transition focus:border-navy/40 focus:bg-white focus:outline-none focus:ring-4 focus:ring-navy/10"
      >
        <span>{selected?.label}</span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-5 w-5 text-ink-soft transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="M6 8l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-[var(--shadow-pop)]"
        >
          {options.map((o) => {
            const active = o.value === value;
            return (
              <li
                key={o.value}
                role="option"
                aria-selected={active}
                onClick={() => choose(o.value)}
                className={[
                  'cursor-pointer px-5 py-3 text-[16px] transition-colors',
                  active ? 'bg-paper font-semibold text-red' : 'text-ink hover:bg-paper',
                ].join(' ')}
              >
                {o.label}
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
