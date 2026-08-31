import { CalendarClock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDateRange } from "@/lib/format";
import type { ReservationView } from "@/lib/types";

export function UpcomingReservationsCard({ rows }: { rows: ReservationView[] }) {
  const columns: Column<ReservationView>[] = [
    { key: "guest", header: "Misafir", render: (r) => <span className="font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", render: (r) => r.room.number },
    { key: "date", header: "Tarih", render: (r) => <span className="text-[var(--muted)]">{formatDateRange(r.checkIn, r.checkOut)}</span> },
    { key: "status", header: "Durum", render: (r) => <StatusBadge status={r.status} /> },
  ];

  return (
    <Card title="Yaklaşan Rezervasyonlar" subtitle={`${rows.length} rezervasyon`} className="flex h-full flex-col">
      {rows.length === 0 ? (
        <div className="flex flex-1 items-center justify-center">
          <EmptyState icon={CalendarClock} title="Yaklaşan rezervasyon yok" />
        </div>
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} pageSize={5} dense />
      )}
    </Card>
  );
}
