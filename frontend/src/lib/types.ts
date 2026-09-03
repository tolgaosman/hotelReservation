export type RoomStatus = "available" | "occupied" | "maintenance" | "passive";

// Room types are a user-managed catalog (see /rooms/types), so — unlike the
// old hardcoded 5-value union this replaced — the set of names is open and
// can't be expressed as a compile-time union.
export interface RoomTypeDefinition {
  id: number;
  name: string;
  description: string | null;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  bedType: string | null;
  sizeM2: number | null;
  view: string | null;
  images: string[] | null;
  active: boolean;
  roomCount?: number;
}

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
  // Server-written snapshot of the room's RoomType at assignment time — the
  // source of truth is `roomTypeId`; `type`/capacity/nightlyRate/amenities
  // below are read-only copies that only change when the room's type is
  // reassigned or that type is edited (see RoomTypeDefinition).
  type: string;
  roomTypeId: number | null;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  status: RoomStatus;
  housekeepingStatus: "clean" | "dirty" | "cleaning";
  isMaintenance: boolean;
  maintenanceNote: string | null;
  assignedStaff: string | null;
  isPriorityCleaning: boolean;
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

export interface HotelSettings {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  taxRate: number;
  checkInTime: string;
  checkOutTime: string;
}

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
  department: string | null;
  departmentLabel?: string | null;
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

export interface AuditLog {
  id: number;
  userId: number | null;
  userName: string | null;
  action: string;
  auditableType: string | null;
  auditableId: number | null;
  changes: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
  department?: string | null;
  departmentLabel?: string | null;
}
