"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { Card } from "@/components/ui/Card";
import type { ReservationsPoint } from "@/lib/types";

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-md">
      <p className="mb-2 text-xs font-bold text-[var(--color-muted)]">{label}</p>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--color-ok)]" />
            <span className="font-medium text-[var(--color-ink)]">Onaylanan</span>
          </span>
          <span className="font-bold text-[var(--color-ink)]">{payload[0]?.value}</span>
        </div>
        <div className="flex items-center justify-between gap-6 text-sm">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--color-crit)]" />
            <span className="font-medium text-[var(--color-ink)]">İptal</span>
          </span>
          <span className="font-bold text-[var(--color-ink)]">{payload[1]?.value}</span>
        </div>
      </div>
    </div>
  );
}

export function ReservationsBarCard({ data }: { data: ReservationsPoint[] }) {
  return (
    <Card title="Rezervasyonlar" subtitle="Son 7 gün">
      <div className="flex-1 w-full min-h-[150px] px-2 pb-4 pt-4 mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={6} margin={{ top: 0, left: -24, right: 10, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" strokeDasharray="4 4" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11, fontWeight: 500 }} dy={10} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-muted)", fontSize: 11 }} dx={-10} />
            <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ fill: "var(--color-surface-alt)", opacity: 0.5 }} />
            <Bar dataKey="confirmed" fill="var(--color-ok)" radius={[6, 6, 0, 0]} maxBarSize={28} />
            <Bar dataKey="cancelled" fill="var(--color-crit)" radius={[6, 6, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
