"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency } from "@/lib/format";
import type { Room, RoomStatus } from "@/lib/types";

const STATUS_FILTERS: { value: RoomStatus | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "available", label: "Müsait" },
  { value: "occupied", label: "Dolu" },
  { value: "maintenance", label: "Bakımda" },
];

export function RoomsTable({ rooms, onRowClick }: { rooms: Room[]; onRowClick: (room: Room) => void }) {
  const [query, setQuery] = useState("");

  const filteredByQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return rooms;
    return rooms.filter((r) => {
      return r.number.toLowerCase().includes(q) || r.type.toLowerCase().includes(q);
    });
  }, [rooms, query]);

  // Extract unique room types for the filter dropdown
  const ROOM_TYPES = useMemo(() => {
    const types = Array.from(new Set(rooms.map(r => r.type)));
    return types.map(t => ({ label: t, value: t }));
  }, [rooms]);

  const columns: Column<Room>[] = [
    { key: "number", header: "Oda No", render: (r) => <span className="text-[var(--accent)] font-bold">{r.number}</span> },
    { 
      key: "type", 
      header: "Tip", 
      render: (r) => <span className="text-[var(--info)] font-medium">{r.type}</span>,
      filterOptions: ROOM_TYPES,
      filterFn: (r, val) => r.type === val
    },
    { key: "capacity", header: "Kapasite", render: (r) => <span className="text-[var(--muted)]">{r.capacity} kişi</span>, align: "center" },
    { key: "rate", header: "Gecelik Ücret", render: (r) => <span className="text-[var(--ok)] font-medium tabular-nums">{formatCurrency(r.nightlyRate)}</span> },
    {
      key: "amenities",
      header: "Özellikler",
      render: (r) =>
        r.amenities.length === 0 ? (
          <span className="text-[var(--muted)]">—</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {r.amenities.slice(0, 2).map((a) => (
              <span key={a} className="rounded-[var(--radius-pill)] border border-[var(--line)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] text-[var(--muted)]">
                {a}
              </span>
            ))}
            {r.amenities.length > 2 && <span className="text-[11px] text-[var(--muted)]">+{r.amenities.length - 2}</span>}
          </div>
        ),
    },
    { 
      key: "status", 
      header: "Durum", 
      render: (r) => <StatusBadge status={r.status} />,
      filterOptions: STATUS_FILTERS.filter(f => f.value !== "all"),
      filterFn: (r, val) => r.status === val
    },
  ];

  return (
    <Card
      title="Tüm Odalar"
      subtitle={`${filteredByQuery.length} / ${rooms.length} oda`}
      action={
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Numara veya tip ara"
            className="w-36 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
      }
    >
      {filteredByQuery.length === 0 ? (
        <EmptyState title="Eşleşen oda yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable columns={columns} rows={filteredByQuery} getRowKey={(r) => r.id} onRowClick={onRowClick} />
      )}
    </Card>
  );
}
