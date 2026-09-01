"use client";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  /** Shown as a small count pill next to the label when set (0 is hidden). */
  badge?: number;
}

// Equal-width tabs so the indicator's position/size is a pure function of
// the active index — no ref measurement needed to keep it in sync.
export function Tabs({ tabs, value, onChange }: { tabs: TabItem[]; value: string; onChange: (id: string) => void }) {
  const index = Math.max(0, tabs.findIndex((t) => t.id === value));

  return (
    <div className="relative flex rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] p-1">
      <div
        className="absolute inset-y-1 rounded-[calc(var(--radius-control)-4px)] bg-[var(--surface)] shadow-sm transition-transform duration-300 [transition-timing-function:var(--ease-organic)]"
        style={{ width: `calc(${100 / tabs.length}% - 4px)`, transform: `translateX(calc(${index * 100}% + ${index * 4}px))` }}
      />
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            "relative z-10 flex flex-1 flex-wrap items-center justify-center gap-x-1.5 gap-y-0.5 px-2 py-2 text-center text-xs leading-tight font-semibold transition-colors duration-200",
            value === tab.id ? "text-[var(--ink)]" : "text-[var(--muted)] hover:text-[var(--ink-soft)]"
          )}
        >
          {tab.label}
          {!!tab.badge && (
            <span
              className={cn(
                "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold",
                value === tab.id ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : "bg-[var(--line)] text-[var(--muted)]"
              )}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
