"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportToCsv } from "@/lib/exportCsv";
import { matchesQuery } from "@/lib/utils";
import type { Employee } from "@/lib/types";

export function EmployeesTable({ employees, onRowClick }: { employees: Employee[]; onRowClick?: (e: Employee) => void }) {
  const [query, setQuery] = useState("");

  const filteredByQuery = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) return employees;
    return employees.filter((e) => matchesQuery(e.fullName, q) || matchesQuery(e.email ?? "", q));
  }, [employees, query]);

  const professionOptions = useMemo(
    () =>
      Array.from(new Set(employees.map((e) => e.profession))).map((p) => ({ label: p, value: p })),
    [employees]
  );

  const columns: Column<Employee>[] = [
    {
      key: "fullName",
      header: "Ad Soyad",
      sortValue: (e) => e.fullName,
      render: (e) => (
        <div className="text-left">
          <p className="font-semibold text-[var(--ink)]">{e.fullName}</p>
          <p className="text-xs text-[var(--muted)]">{e.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "profession",
      header: "Meslek",
      filterOptions: professionOptions,
      filterFn: (e, val) => e.profession === val,
      sortValue: (e) => e.profession,
      render: (e) => <span className="text-sm font-medium text-[var(--ink)]">{e.profession}</span>,
    },
    {
      key: "role",
      header: "Rol",
      render: (e) => (
        <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-ink)]">
          {e.roleName || "Atanmadı"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Telefon",
      render: (e) => <span className="text-sm text-[var(--ink)]">{e.phone || "—"}</span>,
    },
    {
      key: "hireDate",
      header: "İşe Başlama",
      sortValue: (e) => e.hireDate ?? "",
      render: (e) => <span className="text-sm text-[var(--muted)]">{e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "—"}</span>,
    },
    {
      key: "status",
      header: "Durum",
      filterOptions: [
        { label: "Aktif", value: "active" },
        { label: "Pasif", value: "passive" },
      ],
      filterFn: (e, val) => e.status === val,
      render: (e) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] px-2.5 py-1 text-xs font-semibold ${
            e.status === "active" ? "bg-[var(--ok-soft)] text-[var(--ok)]" : "bg-[var(--surface-alt)] text-[var(--muted)]"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          {e.status === "active" ? "Aktif" : "Pasif"}
        </span>
      ),
    },
  ];

  const handleExportCsv = () => {
    exportToCsv(
      "calisanlar.csv",
      [
        { header: "Ad Soyad", value: (e: Employee) => e.fullName },
        { header: "Meslek", value: (e: Employee) => e.profession },
        { header: "Rol", value: (e: Employee) => e.roleName || "Atanmadı" },
        { header: "Telefon", value: (e: Employee) => e.phone || "" },
        { header: "E-posta", value: (e: Employee) => e.email || "" },
        { header: "İşe Başlama", value: (e: Employee) => (e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "") },
        { header: "Durum", value: (e: Employee) => (e.status === "active" ? "Aktif" : "Pasif") },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      title="Tüm Çalışanlar"
      subtitle={`${filteredByQuery.length} / ${employees.length} çalışan`}
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
        <EmptyState title="Eşleşen çalışan yok" description="Farklı bir arama terimi deneyin." />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredByQuery}
          getRowKey={(e) => e.id}
          onRowClick={onRowClick}
          pageSize={10}
          initialSort={{ key: "fullName", dir: "asc" }}
        />
      )}
    </Card>
  );
}
