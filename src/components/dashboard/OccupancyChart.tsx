"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import type { TooltipContentProps } from "recharts/types/component/Tooltip";
import { Card } from "@/components/ui/Card";
import type { OccupancyPoint } from "@/lib/types";

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-panel)] px-3 py-2 shadow-[var(--shadow-card-hover)]">
      <p className="text-[10px] font-medium text-[var(--color-muted)]">{label}</p>
      <p className="text-sm font-semibold text-[var(--color-ink)]">
        {payload[0].value}% occupancy
      </p>
    </div>
  );
}

export function OccupancyChart({ data }: { data: OccupancyPoint[] }) {
  return (
    <Card title="Occupancy Trend" subtitle="Last 14 days">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f39c6b" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#f39c6b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e7e5df" strokeDasharray="3 5" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#72705b", fontSize: 11 }}
              interval={2}
            />
            <Tooltip
              content={(props) => <ChartTooltip {...props} />}
              cursor={{ stroke: "#e7e5df" }}
            />
            <Area
              type="monotone"
              dataKey="occupancyRate"
              stroke="#f39c6b"
              strokeWidth={2.5}
              fill="url(#occupancyFill)"
              activeDot={{ r: 4, fill: "#f39c6b", stroke: "#fff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
