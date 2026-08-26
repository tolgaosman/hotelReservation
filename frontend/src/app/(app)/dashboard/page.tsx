"use client";

import { useMemo } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import {
  getDashboardStats,
  getReservationCountryStats,
  getPaymentStats,
  getReservationsSeries,
  getReservationStatusDistribution,
  getReservationViews,
  getRoomStats,
  getTodayArrivals,
  getTodayDepartures,
  getUpcomingReservations,
} from "@/lib/selectors";
import { RoomAvailabilityCard } from "@/components/dashboard/RoomAvailabilityCard";
import { ReservationsBarCard } from "@/components/dashboard/ReservationsBarCard";
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
  const { state } = store;

  const stats = useMemo(() => getDashboardStats(state), [state]);
  const roomStats = useMemo(() => getRoomStats(state), [state]);
  const reservationsSeries = useMemo(() => getReservationsSeries(state, 7), [state]);
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

  function handleConfirm(id: string) {
    const result = store.confirmReservation(id);
    showToast(result.ok ? "Rezervasyon onaylandı." : result.error, result.ok ? "success" : "error");
  }
  function handleCheckIn(id: string) {
    const result = store.checkIn(id);
    showToast(result.ok ? "Check-in tamamlandı." : result.error, result.ok ? "success" : "error");
  }
  function handleCheckOut(id: string) {
    const result = store.checkOut(id);
    showToast(result.ok ? "Check-out tamamlandı." : result.error, result.ok ? "success" : "error");
  }

  return (
    <>
      <Topbar title="Panel" subtitle="Otelin bugünkü genel durumu" />

      <main className="relative flex-1 overflow-hidden p-6 lg:p-8">
        {/* Decorative background orbs for Hero Banner vibe */}
        <div className="pointer-events-none absolute -left-40 -top-40 size-[600px] rounded-full bg-[var(--color-accent)]/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute -right-40 top-20 size-[500px] rounded-full bg-[var(--color-info)]/[0.03] blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 size-[800px] -translate-x-1/2 rounded-full bg-[var(--color-accent)]/[0.02] blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <RoomAvailabilityCard stats={roomStats} />
          <ReservationsBarCard data={reservationsSeries} />
          <RevenueCard store={state} />
          <ReservationStatusDonut rows={statusRows} />
        </div>

        <ReservationsByCountryCard total={countryStats.total} countries={countryStats.countries} />

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <TodayCheckInsCard rows={arrivals} onConfirm={handleConfirm} onCheckIn={handleCheckIn} />
          </div>
          <div className="xl:row-span-2">
            <TotalRevenueCard
              totalCollected={stats.totalCollected}
              outstanding={paymentStats.outstanding}
              activeReservations={stats.activeReservations}
              recentPayments={recentPayments}
            />
          </div>
          <TodayCheckOutsCard rows={departures} onCheckOut={handleCheckOut} />
          <UpcomingReservationsCard rows={upcoming} />
        </div>
        </div>
      </main>
    </>
  );
}
