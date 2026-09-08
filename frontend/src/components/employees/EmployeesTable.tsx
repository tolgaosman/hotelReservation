"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Search } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { exportToExcel } from "@/lib/exportExcel";
import { matchesQuery } from "@/lib/utils";
import type { Employee } from "@/lib/types";

function initials(fullName: string): string {
  return fullName.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

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
      width: "26%",
      sortValue: (e) => e.fullName,
      render: (e) => (
        <div className="text-center">
          <p className="font-semibold text-[var(--ink)]">{e.fullName}</p>
          <p className="text-xs text-[var(--muted)]">{e.email || "—"}</p>
        </div>
      ),
    },
    {
      key: "profession",
      header: "Meslek",
      width: "16%",
      filterOptions: professionOptions,
      filterFn: (e, val) => e.profession === val,
      sortValue: (e) => e.profession,
      render: (e) => <span className="text-sm font-medium text-[var(--ink)]">{e.profession}</span>,
    },
    {
      key: "role",
      header: "Rol",
      width: "16%",
      render: (e) => (
        <span className="inline-flex items-center rounded-[var(--radius-pill)] bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-ink)]">
          {e.roleName || "Atanmadı"}
        </span>
      ),
    },
    {
      key: "phone",
      header: "Telefon",
      width: "16%",
      render: (e) => <span className="text-sm text-[var(--ink)]">{e.phone || "—"}</span>,
    },
    {
      key: "hireDate",
      header: "İşe Başlama",
      width: "14%",
      sortValue: (e) => e.hireDate ?? "",
      render: (e) => <span className="text-sm text-[var(--muted)]">{e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "—"}</span>,
    },
    {
      key: "status",
      header: "Durum",
      width: "12%",
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

  const handleExportExcel = () => {
    exportToExcel(
      "calisanlar.xlsx",
      "Çalışanlar",
      [
        { header: "Ad Soyad", value: (e: Employee) => e.fullName },
        { header: "Meslek", value: (e: Employee) => e.profession },
        { header: "Rol", value: (e: Employee) => e.roleName || "Atanmadı" },
        { header: "Telefon", value: (e: Employee) => e.phone || "" },
        { header: "E-posta", value: (e: Employee) => e.email || "" },
        { header: "İşe Başlama", value: (e: Employee) => (e.hireDate ? new Date(e.hireDate).toLocaleDateString("tr-TR") : "") },
        {
          header: "Durum",
          value: (e: Employee) => (e.status === "active" ? "Aktif" : "Pasif"),
          fill: (e: Employee) =>
            e.status === "active"
              ? { bg: "FFE9F5ED", text: "FF4E9E72" }
              : { bg: "FFFBECEA", text: "FFC25A4D" },
        },
      ],
      filteredByQuery
    );
  };

  return (
    <Card
      hover={false}
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
