import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/cn";
import type { Reservation } from "@/lib/types";

export function WeekSummary({ reservations }: { reservations: Reservation[] }) {
  const booked = reservations.filter((r) => r.status === "confirmed").length;
  const pending = reservations.filter((r) => r.status === "pending").length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;
  const revenue = reservations.reduce((sum, r) => sum + r.paidAmount, 0);

  const tiles = [
    { label: "Booked Rooms", value: booked.toString(), tint: "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]" },
    { label: "Pending", value: pending.toString(), tint: "bg-[var(--color-pending-soft)] text-[var(--color-pending)]" },
    { label: "Cancelled", value: cancelled.toString(), tint: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]" },
    { label: "Total Revenue", value: formatCurrency(revenue), tint: "bg-[var(--color-success-soft)] text-[var(--color-success)]" },
  ];

  return (
    <Card title="This Week" subtitle="Booking activity summary">
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((tile) => (
          <div key={tile.label} className={cn("rounded-[var(--radius-control)] p-3.5", tile.tint)}>
            <p className="text-lg font-semibold leading-tight">{tile.value}</p>
            <p className="mt-0.5 text-[11px] font-medium opacity-80">{tile.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
