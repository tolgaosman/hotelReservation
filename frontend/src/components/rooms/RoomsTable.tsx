"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, statusLabel } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportToCsv } from "@/lib/exportCsv";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
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
    const q = query.trim();
    if (q.length === 0) return rooms;
    return rooms.filter((r) => matchesQuery(r.number, q) || matchesQuery(r.type, q));
  }, [rooms, query]);

  // Extract unique room types for the filter dropdown
  const ROOM_TYPES = useMemo(() => {
    const types = Array.from(new Set(rooms.map(r => r.type)));
    return types.map(t => ({ label: t, value: t }));
  }, [rooms]);

  const columns: Column<Room>[] = [
    { key: "number", header: "Oda No", render: (r) => <span className="text-[var(--accent)] font-bold">{r.number}</span>, sortValue: (r) => r.number },
    {
      key: "type",
      header: "Tip",
      render: (r) => <span className="text-[var(--info)] font-medium">{r.type}</span>,
      filterOptions: ROOM_TYPES,
      filterFn: (r, val) => r.type === val
    },
    { key: "capacity", header: "Kapasite", render: (r) => <span className="text-[var(--muted)]">{r.capacity} kişi</span>, sortValue: (r) => r.capacity },
    { key: "rate", header: "Gecelik Ücret", render: (r) => <span className="text-[var(--ok)] font-medium tabular-nums">{formatCurrency(r.nightlyRate)}</span>, sortValue: (r) => r.nightlyRate },
    {
      key: "amenities",
      header: "Özellikler",
      render: (r) =>
        r.amenities.length === 0 ? (
          <span className="text-[var(--muted)]">—</span>
        ) : (
          <div className="flex flex-wrap justify-center gap-1">
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

  const handleExportCsv = () => {
    exportToCsv(
      "odalar.csv",
      [
        { header: "Oda No", value: (r: Room) => r.number },
        { header: "Tip", value: (r: Room) => r.type },
        { header: "Kapasite", value: (r: Room) => String(r.capacity) },
        { header: "Gecelik Ücret", value: (r: Room) => String(r.nightlyRate) },
        { header: "Özellikler", value: (r: Room) => r.amenities.join("; ") },
        { header: "Durum", value: (r: Room) => statusLabel(r.status) },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      title="Tüm Odalar"
      subtitle={`${filteredByQuery.length} / ${rooms.length} oda`}
      action={
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleExportCsv}
            title="CSV Olarak İndir"
            className="flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] p-2 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <FileSpreadsheet size={14} />
          </button>
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
