"use client";

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import type { DashboardStats, StayEvent } from "@/lib/types";
import { CalendarClock, DoorOpen, LogIn, LogOut } from "lucide-react";

const KIND_ICON = {
  arrival: LogIn,
  "in-house": DoorOpen,
  departure: LogOut,
} as const;

const KIND_LABEL = {
  arrival: "Checked in",
  "in-house": "In-house",
  departure: "Checked out",
} as const;

export function OccupancyTracking({
  stats,
  timeline,
}: {
  stats: DashboardStats;
  timeline: StayEvent[];
}) {
  const totalRooms = stats.roomsAvailable + stats.roomsOccupied + stats.roomsMaintenance;
  const occupancyRate = totalRooms
    ? Math.round((stats.roomsOccupied / totalRooms) * 100)
    : 0;

  const chartData = [
    { name: "Occupied", value: stats.roomsOccupied, color: "#f39c6b" },
    { name: "Available", value: stats.roomsAvailable, color: "#eaf1ec" },
    { name: "Maintenance", value: stats.roomsMaintenance, color: "#561d25" },
  ];

  return (
    <Card title="Tracking" subtitle="Live occupancy & today's stay events">
      <div className="flex flex-col items-center gap-2">
        <div className="relative size-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                innerRadius={44}
                outerRadius={60}
                startAngle={90}
                endAngle={-270}
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold text-[var(--color-ink)]">
              {occupancyRate}%
            </span>
            <span className="text-[10px] text-[var(--color-muted)]">Occupied</span>
          </div>
        </div>

        <div className="flex gap-4 text-xs">
          {chartData.map((entry) => (
            <div key={entry.name} className="flex items-center gap-1.5">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-[var(--color-muted)]">{entry.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 border-t border-[var(--color-border)] pt-5">
        {timeline.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No stay events today"
            description="Arrivals, in-house stays, and departures show up here."
          />
        ) : (
          <ol className="space-y-4">
            {timeline.map((event, i) => {
              const Icon = KIND_ICON[event.kind];
              return (
                <li key={event.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full",
                        event.kind === "departure"
                          ? "bg-[var(--color-danger-soft)] text-[var(--color-danger)]"
                          : "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]"
                      )}
                    >
                      <Icon size={13} strokeWidth={2} />
                    </span>
                    {i < timeline.length - 1 && (
                      <span className="mt-1 w-px flex-1 bg-[var(--color-border)]" />
                    )}
                  </div>
                  <div className="pb-1">
                    <p className="text-xs font-medium text-[var(--color-ink)]">
                      {KIND_LABEL[event.kind]} — Room {event.roomNumber}
                    </p>
                    <p className="text-[11px] text-[var(--color-muted)]">
                      {event.guestName} · {event.time}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </Card>
  );
}
