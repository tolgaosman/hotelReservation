"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { StatusBadge, statusLabel } from "@/components/ui/status-badge";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyBreakdown } from "@/components/ui/MoneyBreakdown";
import { exportToExcel } from "@/lib/exportExcel";
import { formatCurrency, formatDate } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import type { PaymentStatus, ReservationView } from "@/lib/types";

function paymentStatusOf(r: ReservationView): PaymentStatus {
  if (r.balance <= 0) return "paid";
  if (r.paidAmount > 0) return "partial";
  return "unpaid";
}

// Kısmi renders amber here, not the badge's indigo — requested explicitly for the Excel export.
const PAYMENT_STATUS_EXCEL_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  paid: { bg: "FFE9F5ED", text: "FF4E9E72" },
  partial: { bg: "FFF6ECDA", text: "FFC68A2E" },
  unpaid: { bg: "FFFBECEA", text: "FFC25A4D" },
};

const STATUS_FILTERS: { value: PaymentStatus | "all"; label: string }[] = [
  { value: "all", label: "Tümü" },
  { value: "paid", label: "Ödendi" },
  { value: "partial", label: "Kısmi" },
  { value: "unpaid", label: "Ödenmedi" },
];

export function PaymentsTable({ reservations, onRowClick }: { reservations: ReservationView[]; onRowClick: (r: ReservationView) => void }) {
  const [query, setQuery] = useState("");

  const filteredByQuery = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) return reservations;
    return reservations.filter((r) => matchesQuery(r.guest.fullName, q) || matchesQuery(r.room.number, q));
  }, [reservations, query]);

  const columns: Column<ReservationView>[] = [
    { key: "guest", header: "Misafir", sortValue: (r) => r.guest.fullName.toLocaleLowerCase("tr-TR"), render: (r) => <span className="text-[var(--ink)] font-medium">{r.guest.fullName}</span> },
    { key: "room", header: "Oda", sortValue: (r) => r.room.number, render: (r) => <span className="text-[var(--accent)] font-bold">{r.room.number}</span> },
    {
      key: "total",
      header: "Toplam",
      sortValue: (r) => r.totalAmount,
      render: (r) => <MoneyBreakdown roomAmount={r.roomAmount} roomServiceAmount={r.roomServiceAmount} className="text-[var(--ink)] font-medium tabular-nums" />,
    },
    { key: "paid", header: "Ödenen", sortValue: (r) => r.paidAmount, render: (r) => <span className="text-[var(--ok)] font-medium tabular-nums">{formatCurrency(r.paidAmount)}</span> },
    {
      key: "balance",
      header: "Bakiye",
      sortValue: (r) => r.balance,
      render: (r) => (
        <span className={r.balance > 0 ? "font-medium text-[var(--crit)] tabular-nums" : "text-[var(--muted)] tabular-nums"}>{formatCurrency(r.balance)}</span>
      ),
    },
    {
      key: "date",
      header: "Son Ödeme",
      // Rows with no payment yet sort to the bottom (in either direction)
      // instead of competing with real payment dates via a createdAt fallback.
      sortValue: (r) => r.lastPaymentAt ?? "",
      render: (r) => (
        <span className="text-[var(--muted)] tabular-nums">{r.lastPaymentAt ? formatDate(r.lastPaymentAt) : "—"}</span>
      ),
    },
    { 
      key: "status", 
      header: "Durum", 
      render: (r) => <StatusBadge status={paymentStatusOf(r)} />,
      filterOptions: STATUS_FILTERS.filter(f => f.value !== "all"),
      filterFn: (r, val) => paymentStatusOf(r) === val
    },
  ];

  const handleExportExcel = () => {
    exportToExcel(
      "odemeler.xlsx",
      "Ödemeler",
      [
        { header: "Misafir", value: (r: ReservationView) => r.guest.fullName },
        { header: "Oda", value: (r: ReservationView) => r.room.number },
        { header: "Toplam", value: (r: ReservationView) => String(r.totalAmount) },
        { header: "Ödenen", value: (r: ReservationView) => String(r.paidAmount) },
        { header: "Bakiye", value: (r: ReservationView) => String(r.balance) },
        { header: "Son Ödeme", value: (r: ReservationView) => (r.lastPaymentAt ? formatDate(r.lastPaymentAt) : "") },
        {
          header: "Durum",
          value: (r: ReservationView) => statusLabel(paymentStatusOf(r)),
          fill: (r: ReservationView) => PAYMENT_STATUS_EXCEL_COLORS[paymentStatusOf(r)],
        },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      hover={false}
      title="Ödeme Geçmişi"
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
        <EmptyState title="Eşleşen kayıt yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable columns={columns} rows={filteredByQuery} getRowKey={(r) => r.id} onRowClick={onRowClick} initialSort={{ key: "date", dir: "desc" }} />
      )}
    </Card>
  );
}
