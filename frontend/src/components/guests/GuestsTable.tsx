"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportToExcel } from "@/lib/exportExcel";
import { formatCurrency } from "@/lib/format";
import { matchesQuery } from "@/lib/utils";
import type { GuestSummary } from "@/lib/types";

function initials(fullName: string): string {
  return fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function GuestsTable({ guests, onRowClick }: { guests: GuestSummary[]; onRowClick: (g: GuestSummary) => void }) {
  const [query, setQuery] = useState("");

  const filteredByQuery = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) return guests;
    return guests.filter((g) => matchesQuery(g.fullName, q) || matchesQuery(g.email, q));
  }, [guests, query]);

  const COUNTRIES = useMemo(() => {
    const countries = Array.from(new Set(guests.map(g => g.country).filter(Boolean)));
    return countries.map(c => ({ label: c, value: c })).sort((a, b) => a.label.localeCompare(b.label));
  }, [guests]);

  const columns: Column<GuestSummary>[] = [
    {
      key: "guest",
      header: "Misafir",
      sortValue: (g) => g.fullName.toLocaleLowerCase("tr-TR"),
      render: (g) => (
        <div className="flex items-center justify-center gap-2.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-xs font-semibold text-[var(--accent-ink)]">
            {initials(g.fullName)}
          </span>
          <span className="font-medium">{g.fullName}</span>
        </div>
      ),
    },
    {
      key: "country",
      header: "Ülke",
      render: (g) => <span className="text-[var(--ink)]">{g.country}</span>,
      filterOptions: COUNTRIES,
      filterFn: (g, val) => g.country === val,
      filterFixedHeight: true
    },
    { key: "phone", header: "Telefon", render: (g) => <span className="text-[var(--muted)] tabular-nums">{g.phone}</span> },
    { key: "email", header: "E-posta", render: (g) => <span className="text-[var(--accent)] font-medium">{g.email}</span> },
    { key: "bookings", header: "Rezervasyon", sortValue: (g) => g.totalBookings, render: (g) => <span className="text-[var(--info)] font-bold">{g.totalBookings}</span> },
    { key: "spent", header: "Toplam Harcama", sortValue: (g) => g.totalSpent, render: (g) => <span className="text-[var(--ok)] font-medium">{formatCurrency(g.totalSpent)}</span> },
  ];

  const handleExportExcel = () => {
    exportToExcel(
      "misafirler.xlsx",
      "Misafirler",
      [
        { header: "Ad Soyad", value: (g: GuestSummary) => g.fullName },
        { header: "Ülke", value: (g: GuestSummary) => g.country },
        { header: "Telefon", value: (g: GuestSummary) => g.phone },
        { header: "E-posta", value: (g: GuestSummary) => g.email },
        { header: "Rezervasyon", value: (g: GuestSummary) => String(g.totalBookings) },
        { header: "Toplam Harcama", value: (g: GuestSummary) => String(g.totalSpent) },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      hover={false}
      title="Tüm Misafirler"
      subtitle={`${filteredByQuery.length} / ${guests.length} misafir`}
      action={
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2">
            <Search size={14} className="text-[var(--muted)]" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="İsim veya e-posta ara"
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
        <EmptyState title="Eşleşen misafir yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable columns={columns} rows={filteredByQuery} getRowKey={(g) => g.id} onRowClick={onRowClick} />
      )}
    </Card>
  );
}
