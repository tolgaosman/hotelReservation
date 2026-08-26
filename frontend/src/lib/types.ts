export type RoomType = "Standart" | "Deluxe" | "Aile Odası" | "Suite" | "King Suite";

export type RoomStatus = "available" | "occupied" | "maintenance";

// "checked_in" is the "Konaklamada" state the project brief calls for between
// check-in and check-out — distinct from "confirmed" (booked, not arrived yet).
export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "card" | "transfer";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  status: RoomStatus;
  active: boolean;
}

export interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  identityNumber: string;
  country: string;
}

// Reservations reference rooms/guests by id (not embedded) so edits to a
// room or guest profile are reflected everywhere, and so the availability
// check can be run purely against ids + date ranges.
export interface Reservation {
  id: string;
  guestId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: ReservationStatus;
  totalAmount: number;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
}

export interface Payment {
  id: string;
  reservationId: string;
  amount: number;
  method: PaymentMethod;
  createdAt: string;
  note?: string;
}

// Joined shape used by tables/cards so display code doesn't re-look-up
// guest/room on every render.
export interface ReservationView extends Reservation {
  guest: Guest;
  room: Room;
  paidAmount: number;
  balance: number;
}

export interface DashboardStats {
  todayArrivals: number;
  todayArrivalsDelta: number;
  todayDepartures: number;
  todayDeparturesDelta: number;
  occupiedRooms: number;
  occupiedRoomsDelta: number;
  activeReservations: number;
  activeReservationsDelta: number;
  totalCollected: number;
  roomsAvailable: number;
  roomsOccupied: number;
  roomsMaintenance: number;
  roomsReserved: number;
}

export interface OccupancyPoint {
  date: string;
  label: string;
  occupancyRate: number;
}

export interface RevenuePoint {
  date: string;
  label: string;
  amount: number;
}

export interface ReservationsPoint {
  date: string;
  label: string;
  confirmed: number;
  cancelled: number;
}

export interface StayEvent {
  id: string;
  guestName: string;
  roomNumber: string;
  time: string;
  kind: "arrival" | "in-house" | "departure";
}

export interface RoomStats {
  total: number;
  available: number;
  occupied: number;
  maintenance: number;
  reserved: number;
}

export interface GuestSummary extends Guest {
  totalBookings: number;
  totalSpent: number;
}

export type PaymentStatus = "paid" | "partial" | "unpaid";

export interface PaymentStats {
  totalCollected: number;
  outstanding: number;
  fullyPaidCount: number;
  thisMonthCollected: number;
}

export type RevenueRange = "7g" | "30g" | "6a" | "12a";

export type FormResult = { ok: true } | { ok: false; error: string };
