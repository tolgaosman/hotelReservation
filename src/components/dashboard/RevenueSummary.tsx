import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/cn";

export function RevenueSummary({ stats }: { stats: DashboardStats }) {
  const rows = [
    { label: "Available", value: stats.roomsAvailable, dot: "bg-[var(--color-success)]" },
    { label: "Occupied", value: stats.roomsOccupied, dot: "bg-[var(--color-accent)]" },
    { label: "Maintenance", value: stats.roomsMaintenance, dot: "bg-[var(--color-danger)]" },
  ];

  return (
    <Card title="Total Collected" subtitle="Across all reservations">
      <p className="text-3xl font-semibold tracking-tight text-[var(--color-ink)]">
        {formatCurrency(stats.totalCollected)}
      </p>

      <div className="mt-5 space-y-2.5 border-t border-[var(--color-border)] pt-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-2 text-[var(--color-muted)]">
              <span className={cn("size-2 rounded-full", row.dot)} />
              {row.label}
            </span>
            <span className="font-medium text-[var(--color-ink)]">{row.value} rooms</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
