"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { ReservationStatus, ReservationView } from "@/lib/types";

const STATUS_FILTERS: { value: ReservationStatus | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "pending", label: "Beklemede" },
  { value: "confirmed", label: "Onaylandı" },
  { value: "checked_in", label: "Konaklamada" },
  { value: "completed", label: "Tamamlandı" },
  { value: "cancelled", label: "İptal" },
];

export function ReservationsTable({
  reservations,
  onRowClick,
}: {
  reservations: ReservationView[];
  onRowClick: (r: ReservationView) => void;
}) {
  const [query, setQuery] = useState("");

  const filteredByQuery = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length === 0) return reservations;
    return reservations.filter((r) => {
      return r.guest.fullName.toLowerCase().includes(q) || r.room.number.toLowerCase().includes(q);
    });
  }, [reservations, query]);

  const columns: Column<ReservationView>[] = [
    { key: "guest", header: "Misafir", render: (r) => <span className="text-[var(--ink)] font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", render: (r) => <span className="text-[var(--accent)] font-bold">{r.room.number}</span> },
    { key: "guests", header: "Kişi", render: (r) => <span className="text-[var(--info)] font-bold">{r.guestCount}</span>, align: "center" },
    { key: "checkIn", header: "Giriş", render: (r) => <span className="text-[var(--muted)] tabular-nums">{formatDate(r.checkIn)}</span> },
    { key: "checkOut", header: "Çıkış", render: (r) => <span className="text-[var(--muted)] tabular-nums">{formatDate(r.checkOut)}</span> },
    { key: "total", header: "Tutar", render: (r) => <span className="text-[var(--ink)] font-medium">{formatCurrency(r.totalAmount)}</span>, align: "right" },
    {
      key: "balance",
      header: "Bakiye",
      align: "right",
      render: (r) => (
        <span className={r.balance > 0 ? "font-medium text-[var(--crit)]" : "text-[var(--muted)]"}>
          {formatCurrency(r.balance)}
        </span>
      ),
    },
    { 
      key: "status", 
      header: "Durum", 
      render: (r) => <StatusBadge status={r.status} />,
      filterOptions: STATUS_FILTERS.filter(f => f.value !== "all"),
      filterFn: (r, val) => r.status === val,
    },
  ];

  return (
    <Card
      title="Rezervasyon Listesi"
      subtitle={`${filteredByQuery.length} / ${reservations.length} rezervasyon`}
      action={
        <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2">
          <Search size={14} className="text-[var(--muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Misafir veya oda ara"
            className="w-40 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
      }
    >
      {filteredByQuery.length === 0 ? (
        <EmptyState title="Eşleşen rezervasyon yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable columns={columns} rows={filteredByQuery} getRowKey={(r) => r.id} onRowClick={onRowClick} />
      )}
    </Card>
  );
}
