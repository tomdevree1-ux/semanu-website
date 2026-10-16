'use client';

import { useEffect } from 'react';

/** True when the element is a text-entry control where Backspace must delete text. */
function isEditable(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (el.isContentEditable) return true;
  // Guard against contenteditable ancestors (rich text editors, etc.).
  return el.closest('[contenteditable=""], [contenteditable="true"]') !== null;
}

/**
 * Portal-wide Backspace navigation. When Backspace is pressed and focus is NOT in
 * an input / textarea / select / contenteditable, it goes back one page. Inside a
 * text field Backspace keeps deleting characters as normal. Modifier combos
 * (Cmd/Ctrl/Alt) are left alone so browser shortcuts still work.
 */
export function BackspaceNav() {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return;
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      if (isEditable(e.target) || isEditable(document.activeElement)) return;
      e.preventDefault();
      window.history.back();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return null;
}
