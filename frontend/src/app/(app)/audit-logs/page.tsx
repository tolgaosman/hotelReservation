"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { HeroBanner } from "@/components/ui/hero-banner";
import { AuditLogsTable } from "@/components/audit-logs/AuditLogsTable";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { AuditLog } from "@/lib/types";

// Audit log rows grow without bound, unlike every other list page's dataset —
// so this page fetches its own server-paginated page instead of going
// through the store's fetchAllPages (which loads a feature's entire table).
export default function AuditLogsPage() {
  const { hasPermission, user } = useAuth();
  const scopedToOwnDepartment = user?.role !== "admin" && !hasPermission("audit_logs.view_all");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [moduleStats, setModuleStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const params: Record<string, any> = { page, per_page: 20 };
        if (actionFilter) params.action = actionFilter;
        if (typeFilter) params.auditable_type = typeFilter;
        
        const res = await api.get("/api/audit-logs", { params, signal: controller.signal });
        setLogs(res.data.data.items);
        setPageCount(res.data.data.meta.lastPage);
        setTotal(res.data.data.meta.total);
        const rawStats = res.data.data.meta?.moduleStats || {};
        const normalizedStats: Record<string, number> = {};
        for (const [key, val] of Object.entries(rawStats)) {
          const simpleKey = key.split('\\').pop() || key;
          normalizedStats[simpleKey] = Number(val);
        }
        setModuleStats(normalizedStats);
      } catch {
        // ignore aborted/failed requests — the page keeps showing its last known state
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page, actionFilter, typeFilter]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [actionFilter, typeFilter]);

  return (
    <>
      <Topbar title="Aktivite Kayıtları" subtitle="Sistemde yapılan işlemlerin denetim izi" />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {loading && logs.length === 0 ? (
          <PageSkeleton />
        ) : (
          <>
            <HeroBanner
              title="Aktivite Kayıtları"
              subtitle="Sistemde yapılan işlemlerin detaylı denetim ve güvenlik izleri."
              rightContent={
                <div className="flex items-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-sm divide-x divide-[var(--color-line)]">
                  <div className="flex flex-col px-4 py-3 bg-[var(--color-surface-alt)]/50 justify-center min-h-full">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-muted)]">Toplam</span>
                    <span className="text-lg font-extrabold text-[var(--color-accent-ink)] leading-none mt-1.5">{total.toLocaleString("tr-TR")}</span>
                  </div>
                  <div className="flex flex-wrap items-stretch divide-x divide-[var(--color-line)]">
                    {Object.entries({
                      "Reservation": "Rezervasyon",
                      "Payment": "Ödeme",
                      "RoomService": "Oda Servisi",
                      "Room": "Oda",
                      "Role": "Rol",
                      "Guest": "Misafir",
                      "Employee": "Çalışan",
                      "User": "Kullanıcı"
                    }).map(([type, label]) => {
                      const count = moduleStats[type] || 0;
                      return (
                        <div key={type} className="flex flex-col items-center justify-center px-4 py-3 text-center">
                          <span className="text-[9px] font-semibold text-[var(--color-muted)] uppercase tracking-wider whitespace-nowrap">{label}</span>
                          <span className="text-[13px] font-bold text-[var(--color-ink)] leading-none mt-1.5">{count.toLocaleString("tr-TR")}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              }
            />

            {scopedToOwnDepartment && (
              <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] px-4 py-2.5 text-xs font-medium text-[var(--muted)]">
                <Info size={14} className="shrink-0 text-[var(--accent)]" />
                Yalnızca kendi departmanınıza ait aktivite kayıtları gösteriliyor.
              </div>
            )}
            <AuditLogsTable 
              logs={logs} 
              page={page} 
              pageCount={pageCount} 
              total={total} 
              onPageChange={setPage}
              actionFilter={actionFilter}
              onActionFilterChange={setActionFilter}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
            />
          </>
        )}
      </main>
    </>
  );
}
