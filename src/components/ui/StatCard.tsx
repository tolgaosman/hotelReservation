import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/cn";

interface StatCardProps {
  label: string;
  value: string;
  delta?: number;
  icon: LucideIcon;
}

export function StatCard({ label, value, delta, icon: Icon }: StatCardProps) {
  const isPositive = (delta ?? 0) >= 0;

  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-panel)] p-5",
        "shadow-[var(--shadow-card)] transition-all duration-300",
        "[transition-timing-function:var(--ease-organic)]",
        "hover:shadow-[var(--shadow-card-hover)] hover:-translate-y-0.5"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--color-muted)]">
          {label}
        </span>
        <span className="flex size-8 items-center justify-center rounded-[var(--radius-control)] bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]">
          <Icon size={16} strokeWidth={2} />
        </span>
      </div>
      <div className="mt-3 flex items-end justify-between">
        <span className="text-2xl font-semibold tracking-tight text-[var(--color-ink)]">
          {value}
        </span>
        {delta !== undefined && (
          <span
            className={cn(
              "flex items-center gap-0.5 text-xs font-medium",
              isPositive ? "text-[var(--color-success)]" : "text-[var(--color-danger)]"
            )}
          >
            {isPositive ? (
              <ArrowUpRight size={13} strokeWidth={2.5} />
            ) : (
              <ArrowDownRight size={13} strokeWidth={2.5} />
            )}
            {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
    </div>
  );
}
