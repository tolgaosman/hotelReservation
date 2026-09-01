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
  maintenance: { className: "bg-[var(--amber-soft)] text-[var(--amber)]", label: "Bakımda" },
  passive: { className: "bg-[var(--crit-soft)] text-[var(--crit)]", label: "Pasif" },
  unpaid: { className: "bg-[var(--crit-soft)] text-[var(--crit)]", label: "Ödenmedi" },

  occupied: { className: "bg-[var(--line)] text-[var(--ink-soft)]", label: "Dolu" },
  checked_in: { className: "bg-[var(--accent-soft)] text-[var(--accent-ink)]", label: "Konaklamada" },

  completed: { className: "border border-[var(--line)] bg-[var(--surface-alt)] text-[var(--muted)]", label: "Tamamlandı" },
};

export function statusLabel(status: Variant): string {
  return VARIANT_MAP[status].label;
}

// Mirrors the on-screen badge colors above as ARGB fills, for Excel exports
// (StatusBadge uses CSS vars that a spreadsheet can't read).
export const STATUS_EXCEL_COLORS: Record<Variant, { bg: string; text: string }> = {
  confirmed: { bg: "FFE9F5ED", text: "FF4E9E72" },
  available: { bg: "FFE9F5ED", text: "FF4E9E72" },
  paid: { bg: "FFE9F5ED", text: "FF4E9E72" },

  pending: { bg: "FFE0E7FF", text: "FF312E81" },
  partial: { bg: "FFE0E7FF", text: "FF312E81" },
  reserved: { bg: "FFE0E7FF", text: "FF312E81" },

  cancelled: { bg: "FFFBECEA", text: "FFC25A4D" },
  maintenance: { bg: "FFF6ECDA", text: "FFC68A2E" },
  passive: { bg: "FFFBECEA", text: "FFC25A4D" },
  unpaid: { bg: "FFFBECEA", text: "FFC25A4D" },

  occupied: { bg: "FFE8EAE5", text: "FF5A5F58" },
  checked_in: { bg: "FFDBEAFE", text: "FF1E3A8A" },

  completed: { bg: "FFF7F8F5", text: "FF8B8F8A" },
};

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
