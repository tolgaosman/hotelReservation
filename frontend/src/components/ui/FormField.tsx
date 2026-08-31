import type { ReactNode } from "react";

export function FormField({ label, error, children }: { label: ReactNode; error?: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold text-[var(--ink-soft)]">{label}</span>
      {children}
      {error && <span className="text-xs font-medium text-[var(--crit)]">{error}</span>}
    </label>
  );
}
