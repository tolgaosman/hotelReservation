import type { Guest, Reservation, Room, RoomStatus, RoomType } from "./types";

const ROOM_TYPES: { type: RoomType; capacity: number; rate: number }[] = [
  { type: "Standart", capacity: 2, rate: 1450 },
  { type: "Deluxe", capacity: 3, rate: 2200 },
  { type: "Suite", capacity: 4, rate: 3600 },
];

const AMENITY_POOL = [
  "Deniz Manzarası",
  "Balkon",
  "Klima",
  "Mini Bar",
  "Jakuzi",
  "Wi-Fi",
  "Kasa",
];

function seededAmenities(seed: number): string[] {
  return AMENITY_POOL.filter((_, i) => (seed + i) % 3 === 0);
}

function buildRooms(): Room[] {
  const rooms: Room[] = [];
  const floors = [1, 2, 3, 4];
  let counter = 0;

  for (const floor of floors) {
    for (let unit = 1; unit <= 10; unit++) {
      const number = `${floor}${unit.toString().padStart(2, "0")}`;
      const typeIndex = counter % ROOM_TYPES.length;
      const { type, capacity, rate } = ROOM_TYPES[typeIndex];

      let status: RoomStatus = "available";
      if (counter % 7 === 0) status = "maintenance";
      else if (counter % 3 !== 0) status = "occupied";

      rooms.push({
        id: `room-${number}`,
        number,
        type,
        capacity,
        nightlyRate: rate,
        amenities: seededAmenities(counter),
        status,
      });
      counter++;
    }
  }
  return rooms;
}

export const ROOMS: Room[] = buildRooms();

const FIRST_NAMES = [
  "Lucas", "James", "Elijah", "Noah", "Isabella", "Ayşe", "Mehmet", "Elif",
  "Can", "Zeynep", "Mert", "Deniz", "Kendal", "Allison", "Omar", "Sara",
  "Liam", "Olivia", "Mia", "Ethan", "Ege", "Buse", "Kaan", "Selin", "Arda",
];
const LAST_NAMES = [
  "Thomas", "Wilson", "Garcia", "Smith", "Anderson", "Yılmaz", "Demir",
  "Kaya", "Şahin", "Çelik", "Aydın", "Doğan", "Öztürk", "Arslan", "Koç",
  "Aksoy", "Polat", "Güneş", "Erdem", "Bulut",
];
const COUNTRIES = [
  "Türkiye", "United States", "Netherlands", "Bangladesh", "Germany",
  "United Kingdom", "France", "Italy", "Spain",
];

function buildGuests(count: number): Guest[] {
  const guests: Guest[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3) % LAST_NAMES.length];
    guests.push({
      id: `guest-${i + 1}`,
      fullName: `${first} ${last}`,
      phone: `+1 (555) 010-${(1000 + i).toString().slice(-4)}`,
      email: `${first.toLowerCase()}.${last.toLowerCase()}@mail.com`,
      identityNumber: `${1200 + i * 37} 5678`,
      country: COUNTRIES[i % COUNTRIES.length],
    });
  }
  return guests;
}

const GUESTS: Guest[] = buildGuests(30);

// Anchor date matches the session's "today" so the dashboard reads as live data.
const TODAY = new Date("2026-08-24T00:00:00");

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const RESERVATION_STATUSES: Reservation["status"][] = [
  "confirmed",
  "confirmed",
  "pending",
  "confirmed",
  "completed",
  "cancelled",
];

function buildReservations(): Reservation[] {
  const reservations: Reservation[] = [];
  const availableRooms = ROOMS.filter((r) => r.status !== "maintenance");

  for (let i = 0; i < 26; i++) {
    const room = availableRooms[i % availableRooms.length];
    const guest = GUESTS[i % GUESTS.length];
    const status = RESERVATION_STATUSES[i % RESERVATION_STATUSES.length];

    // Spread check-ins across a window so "today" has real arrivals/departures.
    const offset = ((i * 5) % 20) - 10;
    const nights = 2 + (i % 5);
    const checkIn = addDays(TODAY, offset);
    const checkOut = addDays(TODAY, offset + nights);
    const guestCount = 1 + (i % room.capacity);
    const totalAmount = room.nightlyRate * nights;
    const paidRatio = status === "completed" ? 1 : status === "cancelled" ? 0 : (i % 4) / 4;
    const paidAmount = Math.round(totalAmount * paidRatio);

    reservations.push({
      id: `res-${1000 + i}`,
      guest,
      room,
      checkIn,
      checkOut,
      guestCount,
      status,
      totalAmount,
      paidAmount,
      createdAt: addDays(TODAY, offset - 3),
    });
  }

  // Force a handful of reservations to check in / out exactly today, keeping
  // each pair's night count intact so checkOut always lands after checkIn.
  const pinCheckIn = (index: number, status: Reservation["status"]) => {
    const nights = Math.round(
      (new Date(reservations[index].checkOut).getTime() -
        new Date(reservations[index].checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    reservations[index] = {
      ...reservations[index],
      checkIn: addDays(TODAY, 0),
      checkOut: addDays(TODAY, nights),
      status,
    };
  };

  const pinCheckOut = (index: number, status: Reservation["status"]) => {
    const nights = Math.round(
      (new Date(reservations[index].checkOut).getTime() -
        new Date(reservations[index].checkIn).getTime()) /
        (1000 * 60 * 60 * 24)
    );
    reservations[index] = {
      ...reservations[index],
      checkIn: addDays(TODAY, -nights),
      checkOut: addDays(TODAY, 0),
      status,
    };
  };

  pinCheckIn(0, "confirmed");
  pinCheckIn(1, "confirmed");
  pinCheckIn(2, "pending");
  pinCheckOut(3, "confirmed");
  pinCheckOut(4, "confirmed");

  return reservations;
}

export const RESERVATIONS: Reservation[] = buildReservations();
export const TODAY_ISO = TODAY.toISOString().slice(0, 10);
