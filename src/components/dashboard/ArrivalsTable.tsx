import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ArrivalRow } from "@/lib/api";
import { CalendarCheck } from "lucide-react";

export function ArrivalsTable({ rows }: { rows: ArrivalRow[] }) {
  const columns: Column<ArrivalRow>[] = [
    {
      key: "guest",
      header: "Guest",
      render: (row) => (
        <span className="font-medium">{row.reservation.guest.fullName}</span>
      ),
    },
    {
      key: "room",
      header: "Room",
      render: (row) => row.reservation.room.number,
    },
    {
      key: "type",
      header: "Type",
      render: (row) => (
        <span className="text-[var(--color-muted)]">{row.reservation.room.type}</span>
      ),
    },
    {
      key: "nights",
      header: "Nights",
      render: (row) => row.nights,
      align: "center",
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <Badge status={row.reservation.status} />,
    },
  ];

  return (
    <Card title="Today's Arrivals" subtitle={`${rows.length} guests checking in`}>
      {rows.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No arrivals today"
          description="Reservations checking in today will appear here."
        />
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.reservation.id} />
      )}
    </Card>
  );
}
