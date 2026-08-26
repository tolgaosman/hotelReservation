import { Card } from "@/components/ui/Card";
import { SegmentBar } from "@/components/ui/SegmentBar";
import type { RoomStats } from "@/lib/types";

export function RoomAvailabilityCard({ stats }: { stats: RoomStats }) {
  const tiles = [
    { label: "Dolu", value: stats.occupied, color: "var(--accent)" },
    { label: "Rezerve", value: stats.reserved, color: "var(--warn)" },
    { label: "Müsait", value: stats.available, color: "var(--ok)" },
    { label: "Bakımda", value: stats.maintenance, color: "var(--crit)" },
  ];

  return (
    <Card title="Oda Doluluk" subtitle={`${stats.total} oda`} padded>
      <SegmentBar
        total={stats.total}
        segments={tiles.map((t) => ({ value: t.value, color: t.color }))}
      />
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)]/40 p-4 transition-colors hover:bg-[var(--color-surface)]">
            <div className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full" style={{ backgroundColor: t.color }} />
              <span className="text-[11px] font-medium text-[var(--muted)]">{t.label}</span>
            </div>
            <p className="mt-1 text-lg font-bold text-[var(--ink)]">{t.value}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
