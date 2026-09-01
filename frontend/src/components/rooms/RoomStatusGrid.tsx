"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Info, Settings2, Calendar } from "lucide-react";
import { isRoomReserved } from "@/lib/availability";
import type { Room, RoomStatus, Reservation } from "@/lib/types";

// "occupied" only ever means a guest is currently checked in — a room with a
// future pending/confirmed booking still has status "available", so that
// case is derived per-room (below) rather than stored as its own RoomStatus.
type DisplayStatus = RoomStatus | "reserved";

const STATUS_TILE: Record<DisplayStatus, string> = {
  available: "bg-[var(--ok)] text-white border-transparent shadow-[0_2px_8px_rgba(78,158,114,0.25)]", // green
  reserved: "bg-[var(--warn)] text-white border-transparent shadow-[0_2px_8px_rgba(49,46,129,0.25)]", // indigo
  occupied: "bg-[var(--ink-soft)] text-white border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.06)]", // gray
  maintenance: "bg-[var(--amber)] text-white border-transparent shadow-[0_2px_8px_rgba(198,138,46,0.25)]", // yellow/amber
  passive: "bg-[var(--crit)] text-white border-transparent shadow-[0_2px_8px_rgba(194,90,77,0.25)]", // red
};

const LEGEND_COLORS: Record<DisplayStatus, string> = {
  available: "bg-[var(--ok)]",
  reserved: "bg-[var(--warn)]",
  occupied: "bg-[var(--ink-soft)]",
  maintenance: "bg-[var(--amber)]",
  passive: "bg-[var(--crit)]",
};

const LEGEND: { status: DisplayStatus; label: string }[] = [
  { status: "reserved", label: "Rezerve" },
  { status: "occupied", label: "Konaklamada" },
  { status: "maintenance", label: "Bakımda" },
  { status: "passive", label: "Pasif" },
  { status: "available", label: "Müsait" },
];

export function RoomStatusGrid({ rooms, reservations, onSelect }: { rooms: Room[]; reservations: Reservation[]; onSelect: (room: Room) => void }) {
  const today = new Date().toISOString().slice(0, 10);

  function displayStatus(room: Room): DisplayStatus {
    if (room.status === "available" && isRoomReserved(room.id, today, reservations)) return "reserved";
    return room.status;
  }

  return (
    <Card
      title="Room Status"
      action={
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 px-3 text-xs bg-[var(--surface)] shadow-sm">
            <Settings2 size={13} className="text-[var(--muted)]" /> Filter
          </Button>
          <Button variant="secondary" size="sm" className="h-8 gap-1.5 px-3 text-xs bg-[var(--surface)] shadow-sm">
            <Calendar size={13} className="text-[var(--muted)]" /> Today
          </Button>
        </div>
      }
      padded
      className="bg-[var(--surface)] shadow-sm relative overflow-hidden"
    >
      <div className="relative mt-2 h-[380px]">
        <div className="absolute inset-0 overflow-y-auto pb-24 scrollbar-hide">
          <div className="grid grid-cols-6 gap-2.5 sm:grid-cols-8 md:grid-cols-9 lg:grid-cols-11 xl:grid-cols-11">
            {[...rooms].sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })).map((room) => {
              const displayNum = room.number.length === 1 ? `0${room.number}` : room.number;
              const status = displayStatus(room);

              return (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => onSelect(room)}
                  title={`Oda ${room.number} · ${room.type} · ${status}`}
                  className={cn(
                    "flex aspect-square items-center justify-center rounded-xl text-[13px] font-bold tracking-wide",
                    "transition-all duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 hover:shadow-md",
                    STATUS_TILE[status]
                  )}
                >
                  {displayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Fade Mask */}
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--surface)] to-transparent" />

        {/* Floating Legend */}
        <div className="absolute bottom-2 left-2 inline-flex items-center gap-4 rounded-full border border-[var(--line)] bg-[var(--surface-alt)]/90 px-4 py-2.5 shadow-sm backdrop-blur-sm">
          <Info size={14} className="text-[var(--muted)]" />
          <div className="h-3.5 w-px bg-[var(--line)]" />
          <div className="flex items-center gap-4">
            {LEGEND.map((item) => (
              <div key={item.status} className="flex items-center gap-1.5 text-xs font-semibold text-[var(--muted)]">
                <span className={cn("size-2 rounded-sm", LEGEND_COLORS[item.status])} />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
