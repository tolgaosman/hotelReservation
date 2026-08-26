import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRange } from "@/lib/format";
import type { ReservationView } from "@/lib/types";

export function UpcomingReservationsCard({ rows }: { rows: ReservationView[] }) {
  return (
    <Card title="Yaklaşan Rezervasyonlar" subtitle={`${rows.length} rezervasyon`} padded>
      {rows.length === 0 ? (
        <EmptyState icon={CalendarClock} title="Yaklaşan rezervasyon yok" />
      ) : (
        <div className="flex flex-col divide-y divide-[var(--color-line)]/60">
          {rows.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-2 py-3 first:pt-0 last:pb-0">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--ink)]">{r.guest.fullName}</p>
                <p className="text-xs text-[var(--muted)]">
                  Oda {r.room.number} · {formatDateRange(r.checkIn, r.checkOut)}
                </p>
              </div>
              <StatusBadge status={r.status} className="shrink-0" />
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
