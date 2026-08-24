import { cn } from "@/lib/cn";
import type { ReservationStatus, RoomStatus } from "@/lib/types";

type Variant = ReservationStatus | RoomStatus;

const VARIANT_STYLES: Record<Variant, string> = {
  // Reservation statuses
  pending: "bg-[var(--color-pending-soft)] text-[var(--color-pending)]",
  confirmed: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  cancelled: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
  completed: "bg-[var(--color-border)] text-[var(--color-muted)]",
  // Room statuses
  available: "bg-[var(--color-success-soft)] text-[var(--color-success)]",
  occupied: "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]",
  maintenance: "bg-[var(--color-danger-soft)] text-[var(--color-danger)]",
};

const VARIANT_LABELS: Record<Variant, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
  completed: "Completed",
  available: "Available",
  occupied: "Occupied",
  maintenance: "Maintenance",
};

interface BadgeProps {
  status: Variant;
  className?: string;
}

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANT_STYLES[status],
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {VARIANT_LABELS[status]}
    </span>
  );
}
