import type { Reservation, Room } from "./types";

// Statuses that still hold the room for their date range. Cancelled
// reservations never block; completed ones are historical and their date
// range has already passed, so they never overlap a *future* check either.
const BLOCKING_STATUSES = new Set<Reservation["status"]>([
  "pending",
  "confirmed",
  "checked_in",
]);

/**
 * True if [checkIn, checkOut) overlaps [existing.checkIn, existing.checkOut).
 * A same-day turnover — new checkIn === existing checkOut — is NOT a
 * conflict, per the brief's explicit requirement.
 */
function rangesOverlap(aStart: string, aEnd: string, bStart: string, bEnd: string): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function hasConflict(
  roomId: number,
  checkIn: string,
  checkOut: string,
  reservations: Reservation[],
  ignoreReservationId?: number
): boolean {
  return reservations.some((r) => {
    if (r.roomId !== roomId) return false;
    if (r.id === ignoreReservationId) return false;
    if (!BLOCKING_STATUSES.has(r.status)) return false;
    return rangesOverlap(checkIn, checkOut, r.checkIn, r.checkOut);
  });
}

/** Rooms with no conflicting reservation for the given date range. */
export function getAvailableRooms(
  checkIn: string,
  checkOut: string,
  rooms: Room[],
  reservations: Reservation[],
  ignoreReservationId?: number
): Room[] {
  return rooms.filter(
    (room) =>
      room.active &&
      room.status !== "maintenance" &&
      !hasConflict(room.id, checkIn, checkOut, reservations, ignoreReservationId)
  );
}

/** A room is "reserved" if it's currently available but has a future confirmed stay. */
export function isRoomReserved(roomId: number, todayIso: string, reservations: Reservation[]): boolean {
  return reservations.some(
    (r) =>
      r.roomId === roomId &&
      (r.status === "confirmed" || r.status === "pending") &&
      r.checkIn > todayIso
  );
}
