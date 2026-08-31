"use client";

import { useState } from "react";
import { Plus, IdCard } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { EmployeeDrawer } from "@/components/employees/EmployeeDrawer";
import { EmployeesTable } from "@/components/employees/EmployeesTable";
import type { Employee } from "@/lib/types";

export default function EmployeesPage() {
  const store = useStore();
  const { hasPermission } = useAuth();
  const employees = store.state.employees;
  // Only employees + roles feed this page (the table + EmployeeDrawer's role
  // dropdown); don't wait on the far heavier reservations/payments fetches.
  const loading = store.loading.employees || store.loading.roles;

  const [selected, setSelected] = useState<Employee | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  return (
    <>
      <Topbar
        title="Çalışanlar"
        subtitle="Otel kadrosunu ve mesleklerini yönetin"
        action={
          hasPermission("employees.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Yeni Çalışan
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {loading ? (
          <PageSkeleton />
        ) : employees.length === 0 ? (
          <EmptyState
            icon={IdCard}
            title="Henüz çalışan eklenmemiş"
            description={
              hasPermission("employees.create")
                ? "Kadroya yeni bir çalışan ekleyerek başlayın."
                : "Görüntülenecek çalışan kaydı bulunmuyor."
            }
          />
        ) : (
          <EmployeesTable
            employees={employees}
            onRowClick={
              hasPermission("employees.edit")
                ? (e) => {
                    setSelected(e);
                    setDrawerOpen(true);
                  }
                : undefined
            }
          />
        )}
      </main>

      <EmployeeDrawer open={creating} onClose={() => setCreating(false)} />
      <EmployeeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} employee={selected ?? undefined} />
    </>
  );
}
