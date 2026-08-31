"use client";

import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuditLog } from "@/lib/types";

const COLUMNS = ["Tarih", "Kullanıcı", "Aksiyon", "Konu", "IP Adresi"];

export function AuditLogsTable({
  logs,
  page,
  pageCount,
  total,
  onPageChange,
}: {
  logs: AuditLog[];
  page: number;
  pageCount: number;
  total: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <Card title="Aktivite Kayıtları" subtitle={`${total} kayıt`}>
      {logs.length === 0 ? (
        <EmptyState title="Henüz aktivite kaydı yok" description="Sistemde işlem yapıldıkça burada listelenecek." />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-[var(--surface-alt)]">
                  {COLUMNS.map((c) => (
                    <th key={c} className="whitespace-nowrap px-2 py-3 text-center text-[10px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id} className={cn("transition-colors duration-150 hover:bg-[var(--surface-alt)]", i > 0 && "border-t border-[var(--line)]")}>
                    <td className="whitespace-nowrap px-2 py-3 text-center tabular-nums text-[var(--muted)]">{formatDateTime(log.createdAt)}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-center text-[var(--ink)] font-medium">{log.userName ?? "—"}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-center text-[var(--accent)] font-mono text-[11px]">{log.action}</td>
                    <td className="whitespace-nowrap px-2 py-3 text-center text-[var(--ink)]">
                      {log.auditableType ? `${log.auditableType} #${log.auditableId}` : "—"}
                    </td>
                    <td className="whitespace-nowrap px-2 py-3 text-center tabular-nums text-[var(--muted)]">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageCount={pageCount} onPageChange={onPageChange} totalLabel={`${total} kayıttan sayfa ${page}/${pageCount}`} />
        </>
      )}
    </Card>
  );
}
