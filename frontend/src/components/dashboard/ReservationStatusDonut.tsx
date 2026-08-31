"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "@/components/ui/Card";
import type { ReservationStatus } from "@/lib/types";

const COLOR: Record<ReservationStatus, string> = {
  confirmed: "var(--color-ok)",
  checked_in: "var(--color-info)",
  pending: "var(--color-warn)",
  completed: "var(--color-muted)",
  cancelled: "var(--color-crit)",
};

interface Row {
  status: ReservationStatus;
  label: string;
  count: number;
  pct: number;
}

export function ReservationStatusDonut({ rows }: { rows: Row[] }) {
  const terminalStatuses = ["completed", "cancelled"];
  const terminalRows = rows.filter((r) => terminalStatuses.includes(r.status));
  const activeRows = rows.filter((r) => !terminalStatuses.includes(r.status));
  
  const total = rows.reduce((sum, r) => sum + r.count, 0);
  const activeTotal = activeRows.reduce((sum, r) => sum + r.count, 0);

  const activeRowsWithPct = activeRows.map((r) => ({
    ...r,
    pct: activeTotal > 0 ? Math.round((r.count / activeTotal) * 100) : 0,
  }));

  return (
    <Card title="Rezervasyon Durumu" subtitle={`${total} toplam işlem`} padded className="flex flex-col h-full">
      <div className="mt-2 flex flex-1 flex-col xl:flex-row items-center justify-center gap-6 px-4">
        <div className="relative size-32 shrink-0">
          {/* debounce absorbs the resize burst while the flex-wrap row above is
              still settling widths — without it recharts replays its mount
              animation on every intermediate measurement, reading as judder. */}
          <ResponsiveContainer width="100%" height="100%" debounce={150}>
            <PieChart>
              <Pie 
                data={activeRowsWithPct} 
                dataKey="count" 
                innerRadius={48} 
                outerRadius={60} 
                startAngle={90} 
                endAngle={-270} 
                stroke="var(--color-surface)"
                strokeWidth={2}
                paddingAngle={2}
              >
                {activeRowsWithPct.map((r) => (
                  <Cell key={r.status} fill={COLOR[r.status]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: '1px solid var(--color-line)', boxShadow: 'var(--shadow-pop)', padding: '4px 8px' }}
                itemStyle={{ color: 'var(--color-ink)', fontWeight: 600, fontSize: '12px' }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-extrabold text-[var(--color-ink)]">{activeTotal}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--color-muted)]">Aktif</span>
          </div>
        </div>
        
        <div className="flex flex-1 flex-col justify-center gap-1.5 w-full">
          {activeRowsWithPct
            .filter((r) => r.count > 0)
            .sort((a, b) => b.count - a.count)
            .map((r) => (
              <div
                key={r.status}
                className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/30 px-4 py-2 transition-colors hover:bg-[var(--color-surface-alt)]"
              >
                <div className="flex items-center gap-2">
                  <span className="size-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: COLOR[r.status] }} />
                  <span className="text-xs font-medium text-[var(--color-ink)] truncate max-w-[80px]" title={r.label}>{r.label}</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="font-bold text-[var(--color-ink)]">{r.count}</span>
                  <span className="w-7 text-right font-semibold text-[var(--color-muted)]">%{r.pct}</span>
                </div>
              </div>
            ))}
        </div>
      </div>

      {terminalRows.length > 0 && (
        <div className="mt-5 flex flex-col gap-2 px-4 pb-2">
          {terminalRows.map((row) => (
            <div key={row.status} className="flex items-center justify-between rounded-xl border border-[var(--color-line)] bg-[var(--color-canvas)]/50 px-5 py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="size-2 shrink-0 rounded-full shadow-sm" style={{ backgroundColor: COLOR[row.status] }} />
                <span className="text-sm font-semibold text-[var(--color-muted)]">{row.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--color-ink)]">{row.count}</span>
                <span className="text-[11px] font-medium text-[var(--color-muted)]">
                  (%{total > 0 ? Math.round((row.count / total) * 100) : 0})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
