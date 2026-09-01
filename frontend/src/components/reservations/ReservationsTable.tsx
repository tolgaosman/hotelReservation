"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, statusLabel, STATUS_EXCEL_COLORS } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyBreakdown } from "@/components/ui/MoneyBreakdown";
import { exportToExcel } from "@/lib/exportExcel";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
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
    const q = query.trim();
    if (q.length === 0) return reservations;
    return reservations.filter((r) => matchesQuery(r.guest.fullName, q) || matchesQuery(r.room.number, q));
  }, [reservations, query]);

  // No dependencies: rebuilding this array every render was invalidating
  // DataTable's filteredRows/sortedRows memos on every keystroke in the
  // search box above, since those memoize on columns identity too.
  const columns: Column<ReservationView>[] = useMemo(() => [
    { key: "guest", header: "Misafir", sortValue: (r) => r.guest.fullName.toLocaleLowerCase("tr-TR"), render: (r) => <span className="text-[var(--ink)] font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", sortValue: (r) => r.room.number, render: (r) => <span className="text-[var(--accent)] font-bold">{r.room.number}</span> },
    { key: "guests", header: "Kişi", sortValue: (r) => r.guestCount, render: (r) => <span className="text-[var(--info)] font-bold">{r.guestCount}</span> },
    { key: "checkIn", header: "Giriş", sortValue: (r) => r.checkIn, render: (r) => <span className="text-[var(--muted)] tabular-nums">{formatDate(r.checkIn)}</span> },
    { key: "checkOut", header: "Çıkış", sortValue: (r) => r.checkOut, render: (r) => <span className="text-[var(--muted)] tabular-nums">{formatDate(r.checkOut)}</span> },
    {
      key: "total",
      header: "Tutar",
      sortValue: (r) => r.totalAmount,
      render: (r) => <MoneyBreakdown roomAmount={r.roomAmount} roomServiceAmount={r.roomServiceAmount} className="text-[var(--ink)] font-medium" />,
    },
    {
      key: "balance",
      header: "Bakiye",
      sortValue: (r) => r.balance,
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
  ], []);

  const handleExportExcel = () => {
    exportToExcel(
      "rezervasyonlar.xlsx",
      "Rezervasyonlar",
      [
        { header: "Misafir", value: (r: ReservationView) => r.guest.fullName },
        { header: "Oda", value: (r: ReservationView) => r.room.number },
        { header: "Kişi", value: (r: ReservationView) => String(r.guestCount) },
        { header: "Giriş", value: (r: ReservationView) => formatDate(r.checkIn) },
        { header: "Çıkış", value: (r: ReservationView) => formatDate(r.checkOut) },
        { header: "Tutar", value: (r: ReservationView) => String(r.totalAmount) },
        { header: "Bakiye", value: (r: ReservationView) => String(r.balance) },
        { header: "Durum", value: (r: ReservationView) => statusLabel(r.status), fill: (r: ReservationView) => STATUS_EXCEL_COLORS[r.status] },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      hover={false}
      title="Rezervasyon Listesi"
      subtitle={`${filteredByQuery.length} / ${reservations.length} rezervasyon`}
      action={
        <div className="flex items-center gap-2">
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
          <button
            onClick={handleExportExcel}
            title="Excel Olarak İndir"
            className="flex items-center justify-center rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] p-2 text-[var(--muted)] transition-colors hover:text-[var(--ink)]"
          >
            <FileSpreadsheet size={14} />
          </button>
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
