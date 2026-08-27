"use client";

import { useMemo, useState } from "react";
import { Plus, IdCard } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useStore } from "@/lib/store";
import { EmployeeDrawer } from "@/components/employees/EmployeeDrawer";
import type { Employee } from "@/lib/types";

export default function EmployeesPage() {
  const store = useStore();
  const employees = store.state.employees;

  const [selected, setSelected] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

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

  return (
    <>
      <Topbar
        title="Çalışanlar"
        subtitle="Otel kadrosunu ve mesleklerini yönetin"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Yeni Çalışan
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {store.hydrating ? (
          <PageSkeleton />
        ) : employees.length === 0 ? (
          <EmptyState icon={IdCard} title="Henüz çalışan eklenmemiş" description="Kadroya yeni bir çalışan ekleyerek başlayın." />
        ) : (
          <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-sm">
            <DataTable
              columns={columns}
              rows={employees}
              getRowKey={(e) => e.id}
              onRowClick={(e) => {
                setSelected(e);
                setDrawerOpen(true);
              }}
              pageSize={10}
              initialSort={{ key: "fullName", dir: "asc" }}
            />
          </div>
        )}
      </main>

      <EmployeeDrawer open={creating} onClose={() => setCreating(false)} />
      <EmployeeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} employee={selected ?? undefined} />
    </>
  );
}
