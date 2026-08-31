"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Topbar } from "@/components/layout/Topbar";
import { Select } from "@/components/ui/Select";
import { PageSkeleton, CountryMapCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { LayoutDashboard } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getFirstAccessibleRoute } from "@/lib/nav";
import {
  clampDaysToData,
  getDashboardStats,
  getReservationCountryStats,
  getPaymentStats,
  getReservationStatusDistribution,
  getRoomStats,
  getTodayArrivals,
  getTodayDepartures,
  getUpcomingReservations,
} from "@/lib/selectors";
import { RoomAvailabilityCard } from "@/components/dashboard/RoomAvailabilityCard";
import { RevenueCard } from "@/components/dashboard/RevenueCard";
import { ReservationStatusDonut } from "@/components/dashboard/ReservationStatusDonut";
// d3-geo/topojson-client/world-atlas (the whole world map topology JSON)
// are only needed once this card actually renders — dynamic-importing it
// keeps them out of the dashboard's initial JS bundle.
const ReservationsByCountryCard = dynamic(
  () => import("@/components/dashboard/ReservationsByCountryCard").then((m) => m.ReservationsByCountryCard),
  { ssr: false, loading: () => <CountryMapCardSkeleton /> }
);
import { TodayCheckInsCard } from "@/components/dashboard/TodayCheckInsCard";
import { TodayCheckOutsCard } from "@/components/dashboard/TodayCheckOutsCard";
import { TotalRevenueCard } from "@/components/dashboard/TotalRevenueCard";
import { UpcomingReservationsCard } from "@/components/dashboard/UpcomingReservationsCard";

export default function DashboardPage() {
  const store = useStore();
  const showToast = useToast();
  const router = useRouter();
  const { hasPermission } = useAuth();
  const [timeFilter, setTimeFilter] = useState("1_year");
  const { state } = store;

  const anyWidgetVisible = [
    "dashboard.widget_room_availability",
    "dashboard.widget_revenue",
    "dashboard.widget_status_donut",
    "dashboard.widget_country",
    "dashboard.widget_today_checkins",
    "dashboard.widget_total_revenue",
    "dashboard.widget_today_checkouts",
    "dashboard.widget_upcoming",
  ].some(hasPermission);

  // A role with no dashboard widgets shouldn't land on an empty dashboard —
  // send it straight to the first page it does have access to.
  const redirectTarget = !anyWidgetVisible ? getFirstAccessibleRoute({ unrestricted: false, hasPermission }) : null;

  // Each row's own widgets, so a hidden sibling doesn't leave an empty flex
  // group or an empty grid column taking up space next to the ones that did
  // render — see the layout comment below for how these get consumed.
  const showTopRow =
    hasPermission("dashboard.widget_room_availability") ||
    hasPermission("dashboard.widget_revenue") ||
    hasPermission("dashboard.widget_status_donut");
  const showActivityColumn =
    hasPermission("dashboard.widget_today_checkins") ||
    hasPermission("dashboard.widget_today_checkouts") ||
    hasPermission("dashboard.widget_upcoming");
  const showTotalRevenue = hasPermission("dashboard.widget_total_revenue");

  useEffect(() => {
    if (redirectTarget && redirectTarget !== "/dashboard") {
      router.replace(redirectTarget);
    }
  }, [redirectTarget, router]);

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
  const upcoming = useMemo(() => getUpcomingReservations(state), [state]);
  const paymentStats = useMemo(() => getPaymentStats(state), [state]);
  const countryStats = useMemo(() => getReservationCountryStats(state), [state]);

  const recentPayments = useMemo(() => {
    // Built straight from reservations/guests/rooms rather than
    // getReservationViews(), which drops a reservation entirely when either
    // side is missing — a role with guests.view but not rooms.view (e.g.
    // Muhasebeci) would otherwise lose the guest name too, even though it's
    // fully available.
    const reservationById = new Map(state.reservations.map((r) => [r.id, r]));
    const guestById = new Map(state.guests.map((g) => [g.id, g]));
    const roomById = new Map(state.rooms.map((r) => [r.id, r]));
    return [...state.payments]
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .slice(0, 50)
      .map((payment) => {
        const reservation = reservationById.get(payment.reservationId);
        const guest = reservation ? guestById.get(reservation.guestId) : undefined;
        const room = reservation ? roomById.get(reservation.roomId) : undefined;
        return {
          payment,
          guestName: guest?.fullName ?? "Bilinmiyor",
          roomNumber: room?.number ?? "—",
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
            <div className="w-24">
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
          {store.hydrating || redirectTarget ? (
            <PageSkeleton />
          ) : !anyWidgetVisible ? (
            // Only reachable when no other page exists to redirect to either.
            <EmptyState
              icon={LayoutDashboard}
              title="Görüntüleyebileceğiniz bir bileşen yok"
              description="Rolünüze dashboard bileşeni izni tanımlanmamış. Roller sayfasından ekleyebilirsiniz."
            />
          ) : (
            <>
              {/* Brick layout: each row is a flex-wrap group where every visible
                  widget carries flex-grow, so hiding a sibling (per role/permission)
                  makes the rest stretch to fill the row instead of leaving a gap.
                  The row itself is skipped when every widget in it is hidden, so
                  it doesn't leave an empty gap in the page's vertical spacing. */}
              {showTopRow && (
                <div className="flex flex-wrap gap-6">
                  {hasPermission("dashboard.widget_room_availability") && (
                    <div className="min-w-[260px] flex-1 basis-72 [&>*]:h-full">
                      <RoomAvailabilityCard stats={roomStats} />
                    </div>
                  )}
                  {hasPermission("dashboard.widget_revenue") && (
                    <div className="min-w-[380px] flex-[2] basis-[26rem] [&>*]:h-full">
                      <RevenueCard store={state} days={effectiveDays} subtitle={labelsMap[timeFilter]} />
                    </div>
                  )}
                  {hasPermission("dashboard.widget_status_donut") && (
                    <div className="min-w-[260px] flex-1 basis-72 [&>*]:h-full">
                      <ReservationStatusDonut rows={statusRows} />
                    </div>
                  )}
                </div>
              )}

              {hasPermission("dashboard.widget_country") && (
                <ReservationsByCountryCard total={countryStats.total} countries={countryStats.countries} />
              )}

              {(showActivityColumn || showTotalRevenue) && (
                <div className="flex flex-wrap items-start gap-6 [&>*]:min-w-[320px] [&>*]:flex-1">
                  {showActivityColumn && (
                    <div className="flex flex-col gap-6 [&>*]:max-h-[380px]">
                      {hasPermission("dashboard.widget_today_checkins") && (
                        <TodayCheckInsCard
                          rows={arrivals}
                          onConfirm={hasPermission("reservations.confirm") ? handleConfirm : undefined}
                          onCheckIn={hasPermission("reservations.checkin") ? handleCheckIn : undefined}
                        />
                      )}
                      {hasPermission("dashboard.widget_today_checkouts") && (
                        <TodayCheckOutsCard
                          rows={departures}
                          onCheckOut={hasPermission("reservations.checkout") ? handleCheckOut : undefined}
                        />
                      )}
                      {hasPermission("dashboard.widget_upcoming") && <UpcomingReservationsCard rows={upcoming} />}
                    </div>
                  )}
                  {showTotalRevenue && (
                    <TotalRevenueCard
                      totalCollected={stats.totalCollected}
                      outstanding={paymentStats.outstanding}
                      activeReservations={stats.activeReservations}
                      recentPayments={recentPayments}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </>
  );
}
