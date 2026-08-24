import { RESERVATIONS, ROOMS, TODAY_ISO } from "./data";
import type {
  DashboardStats,
  OccupancyPoint,
  Reservation,
  Room,
  StayEvent,
} from "./types";

// Artificial latency so loading states are visible in dev — remove once this
// module is backed by real fetch() calls against the backend API.
function delay<T>(value: T, ms = 500): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const todayArrivals = RESERVATIONS.filter(
    (r) => r.checkIn === TODAY_ISO && r.status !== "cancelled"
  ).length;
  const todayDepartures = RESERVATIONS.filter(
    (r) => r.checkOut === TODAY_ISO && r.status !== "cancelled"
  ).length;
  const occupiedRooms = ROOMS.filter((r) => r.status === "occupied").length;
  const activeReservations = RESERVATIONS.filter(
    (r) => r.status === "confirmed" || r.status === "pending"
  ).length;
  const totalCollected = RESERVATIONS.reduce((sum, r) => sum + r.paidAmount, 0);

  return delay({
    todayArrivals,
    todayArrivalsDelta: 12.4,
    todayDepartures,
    todayDeparturesDelta: -4.1,
    occupiedRooms,
    occupiedRoomsDelta: 3.2,
    activeReservations,
    activeReservationsDelta: 8.7,
    totalCollected,
    roomsAvailable: ROOMS.filter((r) => r.status === "available").length,
    roomsOccupied: occupiedRooms,
    roomsMaintenance: ROOMS.filter((r) => r.status === "maintenance").length,
  });
}

export async function getOccupancySeries(): Promise<OccupancyPoint[]> {
  const totalRooms = ROOMS.length;
  const points: OccupancyPoint[] = [];
  const today = new Date(TODAY_ISO);

  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);

    const occupied = RESERVATIONS.filter(
      (r) =>
        r.status !== "cancelled" && r.checkIn <= iso && r.checkOut > iso
    ).length;

    points.push({
      date: iso,
      label: d.toLocaleDateString("en-US", { day: "2-digit", month: "short" }),
      occupancyRate: Math.min(100, Math.round((occupied / totalRooms) * 100 * 3.6)),
    });
  }
  return delay(points);
}

export interface ArrivalRow {
  reservation: Reservation;
  nights: number;
}

export async function getTodayArrivals(): Promise<ArrivalRow[]> {
  const rows = RESERVATIONS.filter(
    (r) => r.checkIn === TODAY_ISO && r.status !== "cancelled"
  ).map((reservation) => ({
    reservation,
    nights: Math.round(
      (new Date(reservation.checkOut).getTime() -
        new Date(reservation.checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    ),
  }));
  return delay(rows);
}

export async function getStayTimeline(): Promise<StayEvent[]> {
  const arrivals: StayEvent[] = RESERVATIONS.filter(
    (r) => r.checkIn === TODAY_ISO && r.status !== "cancelled"
  ).map((r) => ({
    id: `${r.id}-arrival`,
    guestName: r.guest.fullName,
    roomNumber: r.room.number,
    time: "14:00",
    kind: "arrival",
  }));

  const departures: StayEvent[] = RESERVATIONS.filter(
    (r) => r.checkOut === TODAY_ISO && r.status !== "cancelled"
  ).map((r) => ({
    id: `${r.id}-departure`,
    guestName: r.guest.fullName,
    roomNumber: r.room.number,
    time: "11:00",
    kind: "departure",
  }));

  const inHouse: StayEvent[] = RESERVATIONS.filter(
    (r) =>
      r.status === "confirmed" &&
      r.checkIn < TODAY_ISO &&
      r.checkOut > TODAY_ISO
  )
    .slice(0, 2)
    .map((r) => ({
      id: `${r.id}-inhouse`,
      guestName: r.guest.fullName,
      roomNumber: r.room.number,
      time: "—",
      kind: "in-house",
    }));

  return delay(
    [...arrivals, ...inHouse, ...departures].sort((a, b) =>
      a.time.localeCompare(b.time)
    )
  );
}

export async function getReservations(): Promise<Reservation[]> {
  return delay(
    [...RESERVATIONS].sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1)),
    650
  );
}

export async function getRooms(): Promise<Room[]> {
  return delay(ROOMS, 400);
}
