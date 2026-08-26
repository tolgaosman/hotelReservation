import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  context?: string;
  icon: LucideIcon;
}

export function StatCard({ label, value, delta, context, icon: Icon }: StatCardProps) {
  const isPositive = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5",
        "shadow-[var(--shadow-card)] transition-all duration-300",
        "[transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-[var(--muted)] uppercase">{label}</span>
        <span className="flex size-8 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-ink)]">
          <Icon size={15} strokeWidth={2.25} />
        </span>
      </div>

      <p className="mt-3 text-[32px] leading-none font-bold text-[var(--ink)]">{value}</p>

      {(context || delta !== undefined) && (
        <div className="mt-3 flex items-center gap-2 text-xs">
          {context && <span className="text-[var(--ink-soft)]">{context}</span>}
          {delta !== undefined && (
            <span
              className={cn(
                "ml-auto flex items-center gap-0.5 rounded-[var(--radius-pill)] px-1.5 py-0.5 font-semibold",
                isPositive ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--crit-soft)] text-[var(--crit)]"
              )}
            >
              {isPositive ? <ArrowUpRight size={12} strokeWidth={2.5} /> : <ArrowDownRight size={12} strokeWidth={2.5} />}
              {Math.abs(delta).toFixed(1)}%
            </span>
          )}
        </div>
      )}
    </div>
  );
}
