"use client";

import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import type { Room, RoomStatus } from "@/lib/types";

const STATUS_TILE: Record<RoomStatus, string> = {
  available: "bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border)]",
  occupied: "bg-[var(--color-accent)] text-white border-[var(--color-accent)]",
  maintenance: "bg-[var(--color-danger)] text-white border-[var(--color-danger)]",
};

const LEGEND: { status: RoomStatus; label: string }[] = [
  { status: "available", label: "Available" },
  { status: "occupied", label: "Occupied" },
  { status: "maintenance", label: "Maintenance" },
];

export function RoomStatusGrid({ rooms }: { rooms: Room[] }) {
  return (
    <Card
      title="Room Status"
      subtitle={`${rooms.length} rooms`}
      action={
        <div className="hidden items-center gap-3 sm:flex">
          {LEGEND.map((item) => (
            <div key={item.status} className="flex items-center gap-1.5 text-[11px] text-[var(--color-muted)]">
              <span className={cn("size-2.5 rounded-full border", STATUS_TILE[item.status])} />
              {item.label}
            </div>
          ))}
        </div>
      }
    >
      <div className="grid grid-cols-6 gap-2 sm:grid-cols-8 lg:grid-cols-10">
        {rooms.map((room) => (
          <div
            key={room.id}
            title={`Room ${room.number} · ${room.type} · ${room.status}`}
            className={cn(
              "flex aspect-square items-center justify-center rounded-[var(--radius-control)] border text-xs font-medium",
              "transition-transform duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 hover:shadow-[var(--shadow-card)]",
              STATUS_TILE[room.status]
            )}
          >
            {room.number}
          </div>
        ))}
      </div>
    </Card>
  );
}
