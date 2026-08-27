"use client";

import { useState } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import { getRevenueSeries } from "@/lib/selectors";
import { cn } from "@/lib/utils";
import type { Guest, Payment, Reservation, RevenueRange, Room } from "@/lib/types";

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 py-3 shadow-[var(--shadow-pop)] backdrop-blur-md">
      <p className="mb-1 text-xs font-bold text-[var(--color-muted)]">{label}</p>
      <p className="text-lg font-bold text-[var(--color-ink)]">{formatCurrency(Number(payload[0].value))}</p>
    </div>
  );
}

export function RevenueCard({
  store,
  days,
  subtitle,
  className,
}: {
  store: { rooms: Room[]; guests: Guest[]; reservations: Reservation[]; payments: Payment[] };
  days: number;
  subtitle?: string;
  className?: string;
}) {
  const data = getRevenueSeries(store, days);
  const total = data.reduce((sum, p) => sum + p.amount, 0);

  return (
    <Card
      title="Gelir Raporu"
      subtitle={subtitle || "Son 7 gün"}
      className={className}
      action={
        <span className="text-sm font-bold text-[var(--accent)] bg-[var(--accent-soft)] px-2 py-1 rounded-md">
          {formatCurrency(total)}
        </span>
      }
    >
      <div className="flex-1 w-full min-h-[150px] px-2 pb-4 pt-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 16, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.35} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={false} height={0} />
            <Tooltip content={(props) => <ChartTooltip {...props} />} cursor={{ stroke: "var(--line-strong)", strokeDasharray: "3 3" }} />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="var(--accent-hover)"
              strokeWidth={2}
              fill="url(#revenueFill)"
              activeDot={{ r: 4, fill: "var(--accent-hover)", stroke: "var(--surface)", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
