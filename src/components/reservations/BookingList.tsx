"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import type { Reservation, ReservationStatus } from "@/lib/types";

const STATUS_FILTERS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "completed", label: "Completed" },
];

export function BookingList({ reservations }: { reservations: Reservation[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ReservationStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return reservations.filter((r) => {
      const matchesStatus = status === "all" || r.status === status;
      const matchesQuery =
        q.length === 0 ||
        r.guest.fullName.toLowerCase().includes(q) ||
        r.room.number.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [reservations, query, status]);

  const columns: Column<Reservation>[] = [
    {
      key: "guest",
      header: "Guest Name",
      render: (r) => <span className="font-medium">{r.guest.fullName}</span>,
    },
    { key: "room", header: "Room Number", render: (r) => r.room.number },
    { key: "guests", header: "Total Guest", render: (r) => r.guestCount, align: "center" },
    { key: "checkIn", header: "Check In", render: (r) => formatDate(r.checkIn) },
    { key: "checkOut", header: "Check Out", render: (r) => formatDate(r.checkOut) },
    { key: "phone", header: "Contact Number", render: (r) => r.guest.phone },
    { key: "country", header: "Country", render: (r) => r.guest.country },
    { key: "status", header: "Status", render: (r) => <Badge status={r.status} /> },
  ];

  return (
    <Card
      title="Booking List"
      subtitle={`${filtered.length} of ${reservations.length} reservations`}
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
            <Search size={14} className="text-[var(--color-muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search room, guest"
              className="w-36 bg-transparent text-xs text-[var(--color-ink)] outline-none placeholder:text-[var(--color-muted)]"
            />
          </div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ReservationStatus | "all")}
            className={cn(
              "rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)]",
              "px-3 py-2 text-xs font-medium text-[var(--color-ink)] outline-none"
            )}
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
      }
    >
      {filtered.length === 0 ? (
        <EmptyState
          title="No reservations match"
          description="Try a different search term or status filter."
        />
      ) : (
        <DataTable columns={columns} rows={filtered} getRowKey={(r) => r.id} />
      )}
    </Card>
  );
}
