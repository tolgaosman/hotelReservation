"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { StatsGrid, StatsGridSkeleton } from "@/components/dashboard/StatsGrid";
import { OccupancyChart } from "@/components/dashboard/OccupancyChart";
import { ArrivalsTable } from "@/components/dashboard/ArrivalsTable";
import { OccupancyTracking } from "@/components/dashboard/OccupancyTracking";
import { RevenueSummary } from "@/components/dashboard/RevenueSummary";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/Skeleton";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import {
  getDashboardStats,
  getOccupancySeries,
  getStayTimeline,
  getTodayArrivals,
  type ArrivalRow,
} from "@/lib/api";
import type { DashboardStats, OccupancyPoint, StayEvent } from "@/lib/types";

type LoadState = "loading" | "ready" | "error";

export default function DashboardPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [occupancy, setOccupancy] = useState<OccupancyPoint[]>([]);
  const [arrivals, setArrivals] = useState<ArrivalRow[]>([]);
  const [timeline, setTimeline] = useState<StayEvent[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getDashboardStats(),
      getOccupancySeries(),
      getTodayArrivals(),
      getStayTimeline(),
    ])
      .then(([s, o, a, t]) => {
        if (cancelled) return;
        setStats(s);
        setOccupancy(o);
        setArrivals(a);
        setTimeline(t);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <>
      <Topbar title="Dashboard" subtitle="Overview of today's hotel activity" />

      <main className="flex-1 space-y-4 p-6 lg:p-8">
        {state === "error" ? (
          <Card>
            <ErrorState
              onRetry={() => {
                setState("loading");
                setReloadKey((k) => k + 1);
              }}
            />
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="space-y-4 xl:col-span-2">
              {state === "loading" || !stats ? (
                <StatsGridSkeleton />
              ) : (
                <StatsGrid stats={stats} />
              )}

              {state === "loading" ? (
                <Card title="Occupancy Trend" subtitle="Last 14 days">
                  <ChartSkeleton />
                </Card>
              ) : (
                <OccupancyChart data={occupancy} />
              )}

              {state === "loading" ? (
                <Card title="Today's Arrivals">
                  <TableSkeleton />
                </Card>
              ) : (
                <ArrivalsTable rows={arrivals} />
              )}
            </div>

            <div className="space-y-4">
              {state === "loading" || !stats ? (
                <Card title="Total Collected">
                  <TableSkeleton rows={3} />
                </Card>
              ) : (
                <RevenueSummary stats={stats} />
              )}

              {state === "loading" || !stats ? (
                <Card title="Tracking">
                  <TableSkeleton rows={4} />
                </Card>
              ) : (
                <OccupancyTracking stats={stats} timeline={timeline} />
              )}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
