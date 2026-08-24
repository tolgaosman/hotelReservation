export type RoomType = "Standart" | "Deluxe" | "Suite";

export type RoomStatus = "available" | "occupied" | "maintenance";

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

export interface Room {
  id: string;
  number: string;
  type: RoomType;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  status: RoomStatus;
}

export interface Guest {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  identityNumber: string;
  country: string;
}

export interface Reservation {
  id: string;
  guest: Guest;
  room: Room;
  checkIn: string;
  checkOut: string;
  guestCount: number;
  status: ReservationStatus;
  totalAmount: number;
  paidAmount: number;
  createdAt: string;
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
}

export interface OccupancyPoint {
  date: string;
  label: string;
  occupancyRate: number;
}

export interface StayEvent {
  id: string;
  guestName: string;
  roomNumber: string;
  time: string;
  kind: "arrival" | "in-house" | "departure";
}
