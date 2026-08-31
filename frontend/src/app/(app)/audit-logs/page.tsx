"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { AuditLogsTable } from "@/components/audit-logs/AuditLogsTable";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { api } from "@/lib/api";
import type { AuditLog } from "@/lib/types";

// Audit log rows grow without bound, unlike every other list page's dataset —
// so this page fetches its own server-paginated page instead of going
// through the store's fetchAllPages (which loads a feature's entire table).
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      try {
        const res = await api.get("/api/audit-logs", { params: { page, per_page: 20 }, signal: controller.signal });
        setLogs(res.data.data.items);
        setPageCount(res.data.data.meta.lastPage);
        setTotal(res.data.data.meta.total);
      } catch {
        // ignore aborted/failed requests — the page keeps showing its last known state
      } finally {
        setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, [page]);

  return (
    <>
      <Topbar title="Aktivite Kayıtları" subtitle="Sistemde yapılan işlemlerin denetim izi" />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {loading && logs.length === 0 ? (
          <PageSkeleton />
        ) : (
          <AuditLogsTable logs={logs} page={page} pageCount={pageCount} total={total} onPageChange={setPage} />
        )}
      </main>
    </>
  );
}
