/**
 * Types mirror the Laravel admin-panel models 1:1 (see
 * hotelReservation/backend/app/Models + database/migrations) so the data
 * layer can later be swapped for real API calls without reshaping anything
 * that already renders. Fields marked "not in backend yet" are additions
 * this site needs (photos, descriptions, slugs) that don't exist as
 * columns yet — the admin schema only carries a flat room catalog.
 */

export type RoomType =
  | "Standart"
  | "Deluxe"
  | "Aile Odası"
  | "Suite"
  | "King Suite";

export type RoomStatus = "available" | "occupied" | "maintenance" | "passive";

export interface Room {
  id: number;
  number: string;
  type: RoomType;
  capacity: number;
  nightlyRate: number;
  amenities: string[];
  status: RoomStatus;
  availableCount?: number;
  // --- not in backend yet ---
  slug: string;
  title: string;
  description: string;
  size: number; // m²
  rating: number;
  reviewCount: number;
  reviews?: Review[];
  images: string[];
}

export interface Review {
  id: number;
  reservation_id: number;
  rating: number;
  comment: string;
  is_approved: boolean;
  created_at: string;
  reservation?: {
    guest?: {
      full_name: string;
    }
  };
}

export interface Addon {
  id: number;
  name: string;
  description: string;
  price: number;
  icon: string;
}

export interface HotelSettings {
  name: string;
  email: string;
  phone: string;
  taxRate: number;
  checkInTime: string; // "HH:mm"
  checkOutTime: string; // "HH:mm"
  address: string;
  location: string;
}

export interface Guest {
  id: number;
  fullName: string;
  phone: string;
  email?: string;
  identityNumber: string;
  country?: string;
}

export type ReservationStatus =
  | "pending"
  | "confirmed"
  | "checked_in"
  | "completed"
  | "cancelled";

export interface Reservation {
  id: number;
  guestId: number;
  roomId: number;
  checkIn: string; // ISO date
  checkOut: string; // ISO date
  guestCount: number;
  status: ReservationStatus;
  totalAmount: number;
  note?: string;
  /** Sadece ilişki yüklendiğinde gelir — bkz. ReservationResource. */
  room?: Room;
}

export interface BookingSearch {
  arrival: string;
  departure: string;
  guests: number;
  units: number;
}
