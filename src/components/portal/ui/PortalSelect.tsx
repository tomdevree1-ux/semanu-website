'use client';

import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from 'react';

export type PortalSelectOption = { value: string; label: string };

/** Read {value,label} from <option> children so a native <select> can be swapped 1:1. */
function optionsFromChildren(children: ReactNode): PortalSelectOption[] {
  const out: PortalSelectOption[] = [];
  Children.toArray(children).forEach((c) => {
    if (isValidElement(c) && c.type === 'option') {
      const p = c.props as { value?: string | number; children?: ReactNode };
      const label = Array.isArray(p.children) ? p.children.join('') : String(p.children ?? '');
      out.push({ value: String(p.value ?? ''), label });
    }
  });
  return out;
}

/**
 * Fully styled dropdown that renders the OPEN option list in the portal design too
 * (a native <select> popup is drawn by the OS and cannot be styled). Works as a
 * form control (via `name` + a hidden input) or controlled (`value` + `onChange`).
 * Accepts either an `options` array or plain <option> children.
 */
export function PortalSelect({
  name,
  options,
  children,
  defaultValue,
  value: controlledValue,
  onChange,
  disabled,
  id,
  className,
  placeholder,
  pill,
  block,
  'aria-label': ariaLabel,
}: {
  name?: string;
  options?: PortalSelectOption[];
  children?: ReactNode;
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  id?: string;
  className?: string;
  placeholder?: string;
  /** Pill shape (rounded, compact) for toolbars and inline controls. */
  pill?: boolean;
  /** Full-width block for form fields. */
  block?: boolean;
  'aria-label'?: string;
}) {
  const opts = options ?? optionsFromChildren(children);
  const [open, setOpen] = useState(false);
  const [internal, setInternal] = useState(defaultValue ?? '');
  const value = controlledValue ?? internal;
  const ref = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    function onDocDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDocDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocDown);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function choose(v: string) {
    if (controlledValue === undefined) setInternal(v);
    onChange?.(v);
    setOpen(false);
  }

  const selected = opts.find((o) => o.value === value);
  const triggerLabel = selected?.label || placeholder || opts[0]?.label || '';

  return (
    <div className={`portal-select${block ? ' is-block' : ''}${disabled ? ' is-disabled' : ''}`} ref={ref}>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        type="button"
        id={id}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={ariaLabel}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`portal-select-trigger${pill ? ' portal-select-trigger--pill' : ''} ${className ?? ''}`}
      >
        <span className={`portal-select-value${!selected && placeholder ? ' is-placeholder' : ''}`}>{triggerLabel}</span>
        <svg className={`portal-select-chevron${open ? ' is-open' : ''}`} viewBox="0 0 20 20" aria-hidden>
          <path d="M6 8l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <ul id={listId} role="listbox" className="portal-select-list">
          {opts.map((o) => (
            <li
              key={o.value}
              role="option"
              aria-selected={o.value === value}
              onClick={() => choose(o.value)}
              className={`portal-select-option${o.value === value ? ' is-active' : ''}`}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
