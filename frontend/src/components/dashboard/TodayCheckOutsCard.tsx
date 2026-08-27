import { LogOut } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ReservationView } from "@/lib/types";

export function TodayCheckOutsCard({
  rows,
  onCheckOut,
}: {
  rows: ReservationView[];
  onCheckOut: (id: number) => void;
}) {
  const columns: Column<ReservationView>[] = [
    { key: "guest", header: "Misafir", render: (r) => <span className="font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", render: (r) => r.room.number },
    { key: "status", header: "Durum", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "action",
      header: "",
      render: (r) =>
        r.status === "checked_in" ? (
          <Button size="sm" variant="secondary" onClick={() => onCheckOut(r.id)}>
            <LogOut size={13} /> Check-out
          </Button>
        ) : (
          <span className="text-xs text-[var(--muted)]">Tamamlandı</span>
        ),
    },
  ];

  return (
    <Card title="Bugünkü Çıkışlar" subtitle={`${rows.length} misafir`}>
      {rows.length === 0 ? (
        <EmptyState icon={LogOut} title="Bugün çıkış yok" description="Bugün için planlanmış bir çıkış bulunmuyor." />
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} pageSize={5} />
      )}
    </Card>
  );
}
