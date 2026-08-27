import { getAvailableRooms, isRoomReserved } from "./availability";
import { COUNTRY_NAME_EN } from "./countries";
const TODAY_ISO = new Date().toISOString().split("T")[0];
import type {
  DashboardStats,
  Guest,
  GuestSummary,
  Payment,
  Reservation,
  ReservationsPoint,
  ReservationStatus,
  ReservationView,
  RevenuePoint,
  RevenueRange,
  Room,
  RoomStats,
} from "./types";

interface Store {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  payments: Payment[];
}

function paidAmountFor(reservationId: number, payments: Payment[]): number {
  return payments.filter((p) => p.reservationId === reservationId).reduce((sum, p) => sum + p.amount, 0);
}

export function toView(reservation: Reservation, store: Store): ReservationView | null {
  const guest = store.guests.find((g) => g.id === reservation.guestId);
  const room = store.rooms.find((r) => r.id === reservation.roomId);
  if (!guest || !room) return null;
  const paidAmount = paidAmountFor(reservation.id, store.payments);
  return { ...reservation, guest, room, paidAmount, balance: reservation.totalAmount - paidAmount };
}

export function getReservationViews(store: Store): ReservationView[] {
  return store.reservations
    .map((r) => toView(r, store))
    .filter((r): r is ReservationView => r !== null);
}

export { getAvailableRooms };

export function getRoomStats(store: Store): RoomStats {
  const active = store.rooms.filter((r) => r.active);
  return {
    total: active.length,
    available: active.filter((r) => r.status === "available").length,
    occupied: active.filter((r) => r.status === "occupied").length,
    maintenance: active.filter((r) => r.status === "maintenance").length,
    reserved: active.filter((r) => r.status === "available" && isRoomReserved(r.id, TODAY_ISO, store.reservations))
      .length,
  };
}

export function getDashboardStats(store: Store): DashboardStats {
  const roomStats = getRoomStats(store);
  const todayArrivals = store.reservations.filter(
    (r) => r.checkIn === TODAY_ISO && r.status !== "cancelled"
  ).length;
  const todayDepartures = store.reservations.filter(
    (r) => r.checkOut === TODAY_ISO && (r.status === "checked_in" || r.status === "completed")
  ).length;
  const activeReservations = store.reservations.filter(
    (r) => r.status === "confirmed" || r.status === "checked_in" || r.status === "pending"
  ).length;
  const totalCollected = store.payments.reduce((sum, p) => sum + p.amount, 0);

  return {
    todayArrivals,
    todayArrivalsDelta: 12.4,
    todayDepartures,
    todayDeparturesDelta: -4.1,
    occupiedRooms: roomStats.occupied,
    occupiedRoomsDelta: 3.2,
    activeReservations,
    activeReservationsDelta: 8.7,
    totalCollected,
    roomsAvailable: roomStats.available,
    roomsOccupied: roomStats.occupied,
    roomsMaintenance: roomStats.maintenance,
    roomsReserved: roomStats.reserved,
  };
}

function isoDate(offset: number): string {
  const d = new Date(TODAY_ISO);
  d.setDate(d.getDate() + offset);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function daysSince(iso: string): number {
  const diff = new Date(TODAY_ISO).getTime() - new Date(iso).getTime();
  return Math.round(diff / 86_400_000);
}

/** Gün farkı olarak, depoda gerçekten veri bulunan en eski kaydın yaşı. */
export function getDataSpanDays(store: Store): number {
  const oldest = [...store.reservations.map((r) => r.createdAt.slice(0, 10)), ...store.payments.map((p) => p.createdAt.slice(0, 10))]
    .reduce<string | null>((min, iso) => (min === null || iso < min ? iso : min), null);
  if (!oldest) return 7;
  return Math.max(daysSince(oldest), 0);
}

/**
 * Seçilen periyodu, gerçekten veri bulunan aralıkla sınırlar; böylece "6 Ay" /
 * "1 Yıl" / "Tüm Zamanlar" gibi geniş seçimler, mock veride karşılığı olmayan
 * uzun boş (sıfır) haftalar/aylar üretmez.
 */
export function clampDaysToData(store: Store, days: number): number {
  const span = getDataSpanDays(store);
  return Math.max(Math.min(days, span + 1), 7);
}

export function getRevenueSeries(store: Store, days = 30): RevenuePoint[] {
  const byDay = new Map<string, number>();
  for (const p of store.payments) {
    const day = p.createdAt.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + p.amount);
  }

  const points: RevenuePoint[] = [];

  if (days <= 31) {
    for (let i = days - 1; i >= 0; i--) {
      const iso = isoDate(-i);
      points.push({
        date: iso,
        label: new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        amount: byDay.get(iso) ?? 0,
      });
    }
  } else if (days <= 182) {
    const weeks = Math.ceil(days / 7);
    for (let w = weeks - 1; w >= 0; w--) {
      const start = -((w + 1) * 7 - 1);
      const end = -(w * 7);
      let amount = 0;
      for (let i = start; i <= end; i++) amount += byDay.get(isoDate(i)) ?? 0;
      points.push({
        date: isoDate(end),
        label: new Date(isoDate(end)).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        amount,
      });
    }
  } else {
    const months = Math.ceil(days / 30);
    for (let m = months - 1; m >= 0; m--) {
      const start = -((m + 1) * 30 - 1);
      const end = -(m * 30);
      let amount = 0;
      for (let i = start; i <= end; i++) amount += byDay.get(isoDate(i)) ?? 0;
      points.push({
        date: isoDate(end),
        label: new Date(isoDate(end)).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        amount,
      });
    }
  }
  return points;
}

export function getReservationsSeries(store: Store, days = 7): ReservationsPoint[] {
  const byDay = new Map<string, { confirmed: number, cancelled: number }>();
  for (const r of store.reservations) {
    const day = r.createdAt.slice(0, 10);
    if (!byDay.has(day)) byDay.set(day, { confirmed: 0, cancelled: 0 });
    const stat = byDay.get(day)!;
    if (r.status === "cancelled") stat.cancelled++;
    else stat.confirmed++;
  }

  const points: ReservationsPoint[] = [];

  if (days <= 31) {
    for (let i = days - 1; i >= 0; i--) {
      const iso = isoDate(-i);
      const stat = byDay.get(iso) || { confirmed: 0, cancelled: 0 };
      points.push({
        date: iso,
        label: new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        confirmed: stat.confirmed,
        cancelled: stat.cancelled,
      });
    }
  } else if (days <= 182) {
    const weeks = Math.ceil(days / 7);
    for (let w = weeks - 1; w >= 0; w--) {
      const start = -((w + 1) * 7 - 1);
      const end = -(w * 7);
      let confirmed = 0;
      let cancelled = 0;
      for (let i = start; i <= end; i++) {
        const stat = byDay.get(isoDate(i)) || { confirmed: 0, cancelled: 0 };
        confirmed += stat.confirmed;
        cancelled += stat.cancelled;
      }
      points.push({
        date: isoDate(end),
        label: new Date(isoDate(end)).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }),
        confirmed,
        cancelled,
      });
    }
  } else {
    const months = Math.ceil(days / 30);
    for (let m = months - 1; m >= 0; m--) {
      const start = -((m + 1) * 30 - 1);
      const end = -(m * 30);
      let confirmed = 0;
      let cancelled = 0;
      for (let i = start; i <= end; i++) {
        const stat = byDay.get(isoDate(i)) || { confirmed: 0, cancelled: 0 };
        confirmed += stat.confirmed;
        cancelled += stat.cancelled;
      }
      points.push({
        date: isoDate(end),
        label: new Date(isoDate(end)).toLocaleDateString("tr-TR", { month: "short", year: "2-digit" }),
        confirmed,
        cancelled,
      });
    }
  }
  return points;
}

const STATUS_LABEL: Record<ReservationStatus, string> = {
  pending: "Beklemede",
  confirmed: "Onaylandı",
  checked_in: "Konaklamada",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

export function getReservationStatusDistribution(
  store: Store
): { status: ReservationStatus; label: string; count: number; pct: number }[] {
  const total = store.reservations.length || 1;
  return (Object.keys(STATUS_LABEL) as ReservationStatus[]).map((status) => {
    const count = store.reservations.filter((r) => r.status === status).length;
    return { status, label: STATUS_LABEL[status], count, pct: Math.round((count / total) * 100) };
  });
}

export function getTodayArrivals(store: Store): ReservationView[] {
  return getReservationViews(store).filter((r) => r.checkIn === TODAY_ISO && r.status !== "cancelled");
}

export function getTodayDepartures(store: Store): ReservationView[] {
  return getReservationViews(store).filter(
    (r) => r.checkOut === TODAY_ISO && (r.status === "checked_in" || r.status === "completed")
  );
}

export function getUpcomingReservations(store: Store, limit = 6): ReservationView[] {
  return getReservationViews(store)
    .filter((r) => r.checkIn > TODAY_ISO && (r.status === "confirmed" || r.status === "pending"))
    .sort((a, b) => (a.checkIn < b.checkIn ? -1 : 1))
    .slice(0, limit);
}

export function getGuestSummaries(store: Store): GuestSummary[] {
  return store.guests.map((guest) => {
    const bookings = store.reservations.filter((r) => r.guestId === guest.id && r.status !== "cancelled");
    const totalSpent = bookings.reduce((sum, r) => sum + paidAmountFor(r.id, store.payments), 0);
    return { ...guest, totalBookings: bookings.length, totalSpent };
  });
}

export function getGuestReservations(store: Store, guestId: number): ReservationView[] {
  return getReservationViews(store)
    .filter((r) => r.guestId === guestId)
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));
}

export function getRoomReservations(store: Store, roomId: number): ReservationView[] {
  return getReservationViews(store)
    .filter((r) => r.roomId === roomId)
    .sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1));
}

export function getPaymentStats(store: Store) {
  const nonCancelled = store.reservations.filter((r) => r.status !== "cancelled");
  const totalCollected = store.payments.reduce((sum, p) => sum + p.amount, 0);
  const outstanding = nonCancelled.reduce(
    (sum, r) => sum + (r.totalAmount - paidAmountFor(r.id, store.payments)),
    0
  );
  const fullyPaidCount = nonCancelled.filter((r) => paidAmountFor(r.id, store.payments) >= r.totalAmount).length;
  const thisMonth = TODAY_ISO.slice(0, 7);
  const thisMonthCollected = store.payments
    .filter((p) => p.createdAt.slice(0, 7) === thisMonth)
    .reduce((sum, p) => sum + p.amount, 0);
  return { totalCollected, outstanding, fullyPaidCount, thisMonthCollected };
}

export function getPaymentsForReservation(store: Store, reservationId: number): Payment[] {
  return store.payments
    .filter((p) => p.reservationId === reservationId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export interface CountryStat {
  country: string;
  countryEn: string;
  count: number;
  percent: number;
}

export function getReservationCountryStats(store: Store): { total: number; countries: CountryStat[] } {
  const countryByGuestId = new Map(store.guests.map((g) => [g.id, g.country]));
  const byCountry = new Map<string, number>();
  let total = 0;
  for (const reservation of store.reservations) {
    if (reservation.status === "cancelled") continue;
    const country = countryByGuestId.get(reservation.guestId);
    if (!country) continue;
    byCountry.set(country, (byCountry.get(country) ?? 0) + 1);
    total++;
  }
  const countries = [...byCountry.entries()]
    .map(([country, count]) => ({
      country,
      countryEn: COUNTRY_NAME_EN[country] ?? country,
      count,
      percent: total === 0 ? 0 : Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count);
  return { total, countries };
}
