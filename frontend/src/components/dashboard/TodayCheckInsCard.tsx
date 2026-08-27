import { LogIn } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ReservationView } from "@/lib/types";

interface Props {
  rows: ReservationView[];
  onConfirm: (id: number) => void;
  onCheckIn: (id: number) => void;
}

export function TodayCheckInsCard({ rows, onConfirm, onCheckIn }: Props) {
  const columns: Column<ReservationView>[] = [
    { key: "guest", header: "Misafir", render: (r) => <span className="font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", render: (r) => r.room.number },
    { key: "type", header: "Tip", render: (r) => <span className="text-[var(--muted)]">{r.room.type}</span> },
    { key: "status", header: "Durum", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "action",
      header: "",
      render: (r) =>
        r.status === "pending" ? (
          <Button size="sm" variant="secondary" onClick={() => onConfirm(r.id)}>
            Onayla
          </Button>
        ) : r.status === "confirmed" ? (
          <Button size="sm" onClick={() => onCheckIn(r.id)}>
            <LogIn size={13} /> Check-in
          </Button>
        ) : (
          <span className="text-xs text-[var(--muted)]">İçeride</span>
        ),
    },
  ];

  return (
    <Card title="Bugünkü Girişler" subtitle={`${rows.length} misafir bekleniyor`}>
      {rows.length === 0 ? (
        <EmptyState icon={LogIn} title="Bugün giriş yok" description="Bugün için beklenen bir rezervasyon bulunmuyor." />
      ) : (
        <DataTable columns={columns} rows={rows} getRowKey={(r) => r.id} pageSize={5} />
      )}
    </Card>
  );
}
