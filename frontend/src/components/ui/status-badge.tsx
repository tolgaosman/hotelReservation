import { cn } from "@/lib/utils";
import type { PaymentStatus, ReservationStatus, RoomStatus } from "@/lib/types";

type Variant = ReservationStatus | RoomStatus | PaymentStatus | "reserved";

const VARIANT_MAP: Record<Variant, { className: string; label: string }> = {
  confirmed: { className: "bg-[var(--ok-soft)] text-[var(--ok)]", label: "Onaylandı" },
  available: { className: "bg-[var(--ok-soft)] text-[var(--ok)]", label: "Müsait" },
  paid: { className: "bg-[var(--ok-soft)] text-[var(--ok)]", label: "Ödendi" },

  pending: { className: "bg-[var(--warn-soft)] text-[var(--warn)]", label: "Beklemede" },
  partial: { className: "bg-[var(--warn-soft)] text-[var(--warn)]", label: "Kısmi" },
  reserved: { className: "bg-[var(--warn-soft)] text-[var(--warn)]", label: "Rezerve" },

  cancelled: { className: "bg-[var(--crit-soft)] text-[var(--crit)]", label: "İptal" },
  maintenance: { className: "bg-[var(--crit-soft)] text-[var(--crit)]", label: "Bakımda" },
  unpaid: { className: "bg-[var(--crit-soft)] text-[var(--crit)]", label: "Ödenmedi" },

  occupied: { className: "bg-[var(--accent-soft)] text-[var(--accent-ink)]", label: "Dolu" },
  checked_in: { className: "bg-[var(--accent-soft)] text-[var(--accent-ink)]", label: "Konaklamada" },

  completed: { className: "border border-[var(--line)] bg-[var(--surface-alt)] text-[var(--muted)]", label: "Tamamlandı" },
};

export function statusLabel(status: Variant): string {
  return VARIANT_MAP[status].label;
}

export function StatusBadge({ status, className }: { status: Variant; className?: string }) {
  const config = VARIANT_MAP[status];
  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
        config.className,
        className
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  );
}
