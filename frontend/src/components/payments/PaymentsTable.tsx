"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentStatus, ReservationView } from "@/lib/types";

function paymentStatusOf(r: ReservationView): PaymentStatus {
  if (r.balance <= 0) return "paid";
  if (r.paidAmount > 0) return "partial";
  return "unpaid";
}

const STATUS_FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "paid", label: "Ödendi" },
  { value: "partial", label: "Kısmi" },
  { value: "unpaid", label: "Ödenmedi" },
];

export function PaymentsTable({ reservations, onRowClick }: { reservations: ReservationView[]; onRowClick: (r: ReservationView) => void }) {
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
    { key: "total", header: "Toplam", render: (r) => <span className="text-[var(--ink)] font-medium tabular-nums">{formatCurrency(r.totalAmount)}</span>, align: "right" },
    { key: "paid", header: "Ödenen", render: (r) => <span className="text-[var(--ok)] font-medium tabular-nums">{formatCurrency(r.paidAmount)}</span>, align: "right" },
    {
      key: "balance",
      header: "Bakiye",
      align: "right",
      render: (r) => (
        <span className={r.balance > 0 ? "font-medium text-[var(--crit)] tabular-nums" : "text-[var(--muted)] tabular-nums"}>{formatCurrency(r.balance)}</span>
      ),
    },
    { key: "date", header: "Tarih", render: (r) => <span className="text-[var(--muted)] tabular-nums">{formatDate(r.createdAt)}</span> },
    { 
      key: "status", 
      header: "Durum", 
      render: (r) => <StatusBadge status={paymentStatusOf(r)} />,
      filterOptions: STATUS_FILTERS.filter(f => f.value !== "all"),
      filterFn: (r, val) => paymentStatusOf(r) === val
    },
  ];

  return (
    <Card
      title="Ödeme Geçmişi"
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
        <EmptyState title="Eşleşen kayıt yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable columns={columns} rows={filteredByQuery} getRowKey={(r) => r.id} onRowClick={onRowClick} />
      )}
    </Card>
  );
}
