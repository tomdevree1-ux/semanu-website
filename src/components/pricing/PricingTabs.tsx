'use client';

// Tab bar for the pricing page. All panels stay mounted (hidden when inactive)
// so the configurator keeps its state when the visitor switches tabs.

import { useState } from 'react';

export type PricingTab = { id: string; label: string; badge?: string; content: React.ReactNode };

export function PricingTabs({ tabs }: { tabs: PricingTab[] }) {
  const [active, setActive] = useState(tabs[0]?.id);

  return (
    <div>
      <div role="tablist" aria-label="Dienste" className="flex flex-wrap gap-2.5">
        {tabs.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => setActive(t.id)}
              className={`rounded-pill px-4 py-2 font-display text-base transition-colors ${
                on ? 'bg-navy text-white shadow-[0_8px_22px_-12px_rgba(27,42,74,0.7)]' : 'border border-[var(--line)] bg-white text-ink-soft hover:border-navy/40 hover:text-ink'
              }`}
            >
              {t.label}
              {t.badge ? <span className={`ml-1.5 align-middle font-mono text-[11px] font-normal ${on ? 'text-white/70' : 'text-ink-soft/70'}`}>{t.badge}</span> : null}
            </button>
          );
        })}
      </div>
      <div className="mt-10">
        {tabs.map((t) => (
          <div key={t.id} role="tabpanel" hidden={active !== t.id}>
            {t.content}
          </div>
        ))}
      </div>
    </div>
  );
}
