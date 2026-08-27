"use client";

import { useMemo, useState } from "react";
import { LayoutDashboard } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Select } from "@/components/ui/Select";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import {
  clampDaysToData,
  getDashboardStats,
  getReservationCountryStats,
  getPaymentStats,
  getReservationStatusDistribution,
  getReservationViews,
  getRoomStats,
  getTodayArrivals,
  getTodayDepartures,
  getUpcomingReservations,
} from "@/lib/selectors";
import { RoomAvailabilityCard } from "@/components/dashboard/RoomAvailabilityCard";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { ReservationStatusDonut } from "@/components/dashboard/ReservationStatusDonut";
import { ReservationsByCountryCard } from "@/components/dashboard/ReservationsByCountryCard";
import { TodayCheckInsCard } from "@/components/dashboard/TodayCheckInsCard";
import { TodayCheckOutsCard } from "@/components/dashboard/TodayCheckOutsCard";
import { TotalRevenueCard } from "@/components/dashboard/TotalRevenueCard";
import { UpcomingReservationsCard } from "@/components/dashboard/UpcomingReservationsCard";

export default function DashboardPage() {
  const store = useStore();
  const showToast = useToast();
  const { user, hasPermission } = useAuth();
  const [timeFilter, setTimeFilter] = useState("1_year");
  const { state } = store;

  // A user with no permission assignment yet (no role picked) sees every
  // widget — the roles page only starts trimming the dashboard once a role
  // with an actual widget selection has been assigned to them.
  const unrestricted = user?.role === "admin" || (user?.permissions?.length ?? 0) === 0;
  const canSee = (key: string) => unrestricted || hasPermission(key);
  const anyWidgetVisible = [
    "dashboard.widget_room_availability",
    "dashboard.widget_revenue",
    "dashboard.widget_status_donut",
    "dashboard.widget_country",
    "dashboard.widget_today_checkins",
    "dashboard.widget_total_revenue",
    "dashboard.widget_today_checkouts",
    "dashboard.widget_upcoming",
  ].some(canSee);

  const daysMap: Record<string, number> = {
    "7_days": 7,
    "15_days": 15,
    "1_month": 30,
    "6_months": 180,
    "1_year": 365,
  };
  const labelsMap: Record<string, string> = {
    "7_days": "Son 7 Gün",
    "15_days": "Son 15 Gün",
    "1_month": "Son 1 Ay",
    "6_months": "Son 6 Ay",
    "1_year": "Son 1 Yıl",
  };
  const days = daysMap[timeFilter] ?? 7;
  const effectiveDays = useMemo(() => clampDaysToData(state, days), [state, days]);

  const stats = useMemo(() => getDashboardStats(state), [state]);
  const roomStats = useMemo(() => getRoomStats(state), [state]);
  const statusRows = useMemo(() => getReservationStatusDistribution(state), [state]);
  const arrivals = useMemo(() => getTodayArrivals(state), [state]);
  const departures = useMemo(() => getTodayDepartures(state), [state]);
  const upcoming = useMemo(() => getUpcomingReservations(state, 4), [state]);
  const paymentStats = useMemo(() => getPaymentStats(state), [state]);
  const countryStats = useMemo(() => getReservationCountryStats(state), [state]);

  const recentPayments = useMemo(() => {
    const views = getReservationViews(state);
    const byReservation = new Map(views.map((v) => [v.id, v]));
    return [...state.payments]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 50)
      .map((payment) => {
        const view = byReservation.get(payment.reservationId);
        return {
          payment,
          guestName: view?.guest.fullName ?? "Bilinmiyor",
          roomNumber: view?.room.number ?? "—",
        };
      });
  }, [state]);

  async function handleConfirm(id: number) {
    const result = await store.confirmReservation(id);
    showToast(result.ok ? "Rezervasyon onaylandı." : result.error, result.ok ? "success" : "error");
  }
  async function handleCheckIn(id: number) {
    const result = await store.checkIn(id);
    showToast(result.ok ? "Check-in tamamlandı." : result.error, result.ok ? "success" : "error");
  }
  async function handleCheckOut(id: number) {
    const result = await store.checkOut(id);
    showToast(result.ok ? "Check-out tamamlandı." : result.error, result.ok ? "success" : "error");
  }

  return (
    <>
      <Topbar 
        title="Panel" 
        subtitle="Otelin bugünkü genel durumu" 
        action={
          <div className="z-50 relative flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
              Veri Periyodu:
            </span>
            <div className="w-36">
              <Select 
                value={timeFilter} 
                onChange={(e) => setTimeFilter(e.target.value)} 
                className="py-1.5 px-3 h-8 text-xs font-semibold shadow-sm hover:border-[var(--accent)]"
              >
                <option value="7_days">7 Gün</option>
                <option value="15_days">15 Gün</option>
                <option value="1_month">1 Ay</option>
                <option value="6_months">6 Ay</option>
                <option value="1_year">1 Yıl</option>
              </Select>
            </div>
          </div>
        }
      />

      <main className="relative flex-1 overflow-hidden p-6 lg:p-8">
        {/* Decorative background orbs for Hero Banner vibe */}
        <div className="pointer-events-none absolute -left-40 -top-40 size-[600px] rounded-full bg-[var(--color-accent)]/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 size-[500px] rounded-full bg-[var(--color-info)]/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 size-[800px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/[0.02] blur-3xl" />

        <div className="relative z-10 space-y-6">
          {store.hydrating ? (
            <PageSkeleton />
          ) : !anyWidgetVisible ? (
            <EmptyState
              icon={LayoutDashboard}
              title="Görüntüleyebileceğiniz bir bileşen yok"
              description="Rolünüze dashboard bileşeni izni tanımlanmamış. Roller sayfasından ekleyebilirsiniz."
            />
          ) : (
            <>
              {/* Brick layout: each row is a flex-wrap group where every visible
                  widget carries flex-grow, so hiding a sibling (per role/permission)
                  makes the rest stretch to fill the row instead of leaving a gap. */}
              <div className="flex flex-wrap gap-6">
                {canSee("dashboard.widget_room_availability") && (
                  <div className="min-w-[260px] flex-1 basis-72">
                    <RoomAvailabilityCard stats={roomStats} />
                  </div>
                )}
                {canSee("dashboard.widget_revenue") && (
                  <div className="min-w-[380px] flex-[2] basis-[26rem]">
                    <RevenueCard store={state} days={effectiveDays} subtitle={labelsMap[timeFilter]} />
                  </div>
                )}
                {canSee("dashboard.widget_status_donut") && (
                  <div className="min-w-[260px] flex-1 basis-72">
                    <ReservationStatusDonut rows={statusRows} />
                  </div>
                )}
              </div>

              {canSee("dashboard.widget_country") && (
                <ReservationsByCountryCard total={countryStats.total} countries={countryStats.countries} />
              )}

              <div className="flex flex-wrap gap-6">
                {canSee("dashboard.widget_today_checkins") && (
                  <div className="min-w-[360px] flex-[2] basis-[28rem]">
                    <TodayCheckInsCard rows={arrivals} onConfirm={handleConfirm} onCheckIn={handleCheckIn} />
                  </div>
                )}
                {canSee("dashboard.widget_total_revenue") && (
                  <div className="min-w-[300px] flex-1 basis-80">
                    <TotalRevenueCard
                      totalCollected={stats.totalCollected}
                      outstanding={paymentStats.outstanding}
                      activeReservations={stats.activeReservations}
                      recentPayments={recentPayments}
                    />
                  </div>
                )}
                {canSee("dashboard.widget_today_checkouts") && (
                  <div className="min-w-[300px] flex-1 basis-80">
                    <TodayCheckOutsCard rows={departures} onCheckOut={handleCheckOut} />
                  </div>
                )}
                {canSee("dashboard.widget_upcoming") && (
                  <div className="min-w-[300px] flex-1 basis-80">
                    <UpcomingReservationsCard rows={upcoming} />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
