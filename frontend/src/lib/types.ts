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
  id: number;
  number: string;
  type: RoomType;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  status: RoomStatus;
  housekeepingStatus: "clean" | "dirty" | "cleaning";
  isMaintenance: boolean;
  maintenanceNote: string | null;
  assignedStaff: string | null;
  isPriorityCleaning: boolean;
  active: boolean;
}

export interface Guest {
  id: number;
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
  id: number;
  guestId: number;
  roomId: number;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: ReservationStatus;
  totalAmount: number;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
  // Other people staying alongside the primary guest — informational only,
  // the reservation/room still belongs to exactly one guest.
  companions?: Guest[];
}

export interface RoomService {
  id: number;
  reservationId: number;
  description: string;
  amount: number;
  createdAt: string;
}

export interface Payment {
  id: number;
  reservationId: number;
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
  // totalAmount split into its two components — room stay vs. room-service
  // charges — so any UI showing money for a reservation can list them as
  // separate lines instead of one merged figure.
  roomAmount: number;
  roomServiceAmount: number;
  // Most recent payment's date, if any — used to sort payment views by
  // recent activity rather than booking date.
  lastPaymentAt?: string;
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

export type FormResult =
  | { ok: true }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export interface Permission {
  id: number;
  key: string;
  label: string;
  group: string;
  groupLabel: string;
  isPagePermission: boolean;
  sortOrder: number;
}

export interface Role {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  employeeCount?: number;
  permissionIds: number[];
}

export type EmployeeStatus = "active" | "passive";

export interface Employee {
  id: number;
  fullName: string;
  profession: string;
  roleId: number | null;
  roleName?: string | null;
  email: string | null;
  phone: string | null;
  hireDate: string | null;
  status: EmployeeStatus;
  notes: string | null;
}
