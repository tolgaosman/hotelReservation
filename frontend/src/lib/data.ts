import type {
  Guest,
  Payment,
  PaymentMethod,
  Reservation,
  ReservationStatus,
  Room,
  RoomStatus,
  RoomType,
} from "./types";

// Deterministic PRNG (mulberry32) so the seed data looks organically varied
// on every load but never changes between runs — screenshots and manual
// QA stay reproducible.
function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20260824);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

const ROOM_TYPES: { type: RoomType; capacity: number; rate: number }[] = [
  { type: "Standart", capacity: 2, rate: 1450 },
  { type: "Deluxe", capacity: 3, rate: 2200 },
  { type: "Aile Odası", capacity: 4, rate: 2800 },
  { type: "Suite", capacity: 4, rate: 3600 },
  { type: "King Suite", capacity: 5, rate: 5500 },
];

const AMENITY_POOL = ["Deniz Manzarası", "Balkon", "Klima", "Mini Bar", "Jakuzi", "Wi-Fi", "Kasa"];

function seededAmenities(seed: number): string[] {
  return AMENITY_POOL.filter((_, i) => (seed + i) % 3 === 0);
}

function buildRooms(): Room[] {
  const rooms: Room[] = [];
  const floors = [1, 2, 3, 4, 5];
  let counter = 0;

  for (const floor of floors) {
    for (let unit = 1; unit <= 12; unit++) {
      const number = `${floor}${unit.toString().padStart(2, "0")}`;
      const { type, capacity, rate } = ROOM_TYPES[counter % ROOM_TYPES.length];

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
        active: true,
      });
      counter++;
    }
  }
  return rooms;
}

export const ROOMS: Room[] = buildRooms();

const FIRST_NAMES = [
  "Ahmet", "Mehmet", "Ayşe", "Fatma", "Ali", "Zeynep", "Mustafa", "Elif",
  "Can", "Deniz", "Mert", "Selin", "Kaan", "Buse", "Emre", "Ece",
  "Burak", "Gizem", "Onur", "Sude", "Ege", "İrem", "Arda", "Melis",
  "Yusuf", "Beren", "Berk", "Nisan", "Kerem", "Aslı", "Tolga", "Osman",
  "Cem", "Defne", "Oğuz", "Ceren", "Volkan", "Damla", "Sinan", "Bahar"
];
const LAST_NAMES = [
  "Yılmaz", "Demir", "Kaya", "Şahin", "Çelik", "Aydın", "Doğan", "Öztürk",
  "Arslan", "Koç", "Aksoy", "Polat", "Güneş", "Erdem", "Bulut", "Yıldız",
  "Kurt", "Özkan", "Kara", "Şimşek", "Falay", "Yavuz", "Tekin", "Sönmez"
];
// Ağırlıklar gerçek bir Türkiye şehir oteli misafir profilini yansıtır:
// yerli pazar baskın, ardından Avrupa/BDT/Körfez, uzun kuyrukta ~65 ülke
// (her kıtadan temsil olsun diye Afrika ve Güney Amerika da dahil).
const COUNTRY_WEIGHTS: [string, number][] = [
  ["Türkiye", 300],
  ["Almanya", 90], ["Rusya", 70], ["Birleşik Krallık", 55], ["Hollanda", 40],
  ["Fransa", 35], ["Ukrayna", 30], ["İran", 28], ["Bulgaristan", 25], ["Gürcistan", 22],
  ["Amerika Birleşik Devletleri", 20], ["İtalya", 20], ["İspanya", 18], ["Suudi Arabistan", 18],
  ["Birleşik Arap Emirlikleri", 17], ["Polonya", 15], ["Yunanistan", 14], ["Azerbaycan", 14],
  ["Irak", 13], ["Kuveyt", 12], ["Katar", 11], ["Belçika", 10], ["İsveç", 10],
  ["Avusturya", 9], ["İsviçre", 9], ["Romanya", 9], ["Çek Cumhuriyeti", 8], ["Norveç", 8],
  ["Danimarka", 8], ["Macaristan", 7], ["Portekiz", 7], ["Ürdün", 7], ["Lübnan", 6], ["İsrail", 6],
  ["Kıbrıs", 4], ["Çin", 5], ["Japonya", 5], ["Güney Kore", 5], ["Hindistan", 5],
  ["Kanada", 5], ["Avustralya", 5], ["Brezilya", 4], ["Meksika", 4], ["Fas", 4], ["Mısır", 4],
  ["Cezayir", 3], ["Tunus", 3], ["Endonezya", 3], ["Malezya", 3], ["Tayland", 3],
  ["Arjantin", 3], ["Güney Afrika", 3], ["Kazakistan", 3], ["Ermenistan", 3], ["Sırbistan", 3],
  ["Hırvatistan", 3], ["Finlandiya", 3], ["İrlanda", 3], ["Vietnam", 2], ["Filipinler", 2],
  ["Şili", 2], ["Kolombiya", 2], ["Nijerya", 2], ["Kenya", 2], ["Özbekistan", 2],
  ["Slovenya", 2], ["Slovakya", 2], ["Yeni Zelanda", 2], ["Pakistan", 2], ["Umman", 2],
  ["Kuzey Makedonya", 2], ["Arnavutluk", 2], ["Moldova", 2], ["Belarus", 2],
  ["Litvanya", 2], ["Letonya", 2], ["Estonya", 2], ["Bangladeş", 1],
];
const COUNTRY_TOTAL_WEIGHT = COUNTRY_WEIGHTS.reduce((sum, [, w]) => sum + w, 0);

/** Ağırlıklı kümülatif seçim — deterministik `rand()` PRNG'sini kullanır. */
function pickWeightedCountry(): string {
  let r = rand() * COUNTRY_TOTAL_WEIGHT;
  for (const [country, weight] of COUNTRY_WEIGHTS) {
    r -= weight;
    if (r <= 0) return country;
  }
  return COUNTRY_WEIGHTS[0][0];
}

import { COUNTRY_PHONE_CODES } from "./countries";

function generatePhone(code: string): string {
  switch (code) {
    case "+90": // Turkey: +90 5xx xxx xx xx
      return `+90 5${randInt(30, 59)} ${randInt(100, 999)} ${randInt(10, 99)} ${randInt(10, 99)}`;
    case "+1": // US/Canada: +1 (xxx) xxx-xxxx
      return `+1 (${randInt(200, 999)}) ${randInt(200, 999)}-${randInt(1000, 9999)}`;
    case "+44": // UK: +44 7xxx xxxxxx
      return `+44 7${randInt(100, 999)} ${randInt(100000, 999999)}`;
    case "+49": // Germany: +49 15x xxxxxxx
      return `+49 15${randInt(0, 9)} ${randInt(1000000, 9999999)}`;
    case "+33": // France: +33 6 xx xx xx xx
      return `+33 6 ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)} ${randInt(10, 99)}`;
    case "+7": // Russia/Kazakhstan: +7 (xxx) xxx-xx-xx
      return `+7 (${randInt(900, 999)}) ${randInt(100, 999)}-${randInt(10, 99)}-${randInt(10, 99)}`;
    default: // Generic fallback
      return `${code} ${randInt(100, 999)} ${randInt(100, 999)} ${randInt(1000, 9999)}`;
  }
}

function normalizeEmail(text: string): string {
  return text
    .toLowerCase()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "");
}

function buildGuests(count: number): Guest[] {
  const guests: Guest[] = [];
  for (let i = 0; i < count; i++) {
    const first = FIRST_NAMES[i % FIRST_NAMES.length];
    const last = LAST_NAMES[(i * 3 + 1) % LAST_NAMES.length];
    const country = pickWeightedCountry();
    const phoneCode = COUNTRY_PHONE_CODES[country] || "+90";
    
    const cleanFirst = normalizeEmail(first);
    const cleanLast = normalizeEmail(last);
    
    guests.push({
      id: `guest-${i + 1}`,
      fullName: `${first} ${last}`,
      phone: generatePhone(phoneCode),
      email: `${cleanFirst}.${cleanLast}${i}@mail.com`,
      identityNumber: `${randInt(10000000000, 99999999999)}`,
      country,
    });
  }
  return guests;
}

export const GUESTS: Guest[] = buildGuests(350);

// Dynamic anchor date so the app always feels "live" and relative to today.
const TODAY = new Date();
export const TODAY_ISO = [
  TODAY.getFullYear(),
  String(TODAY.getMonth() + 1).padStart(2, "0"),
  String(TODAY.getDate()).padStart(2, "0")
].join("-");

function addDays(date: Date, days: number): string {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0")
  ].join("-");
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

interface DraftPayment {
  amount: number;
  method: PaymentMethod;
  createdAt: string;
  note?: string;
}
interface DraftReservation extends Omit<Reservation, "totalAmount"> {
  room: Room;
  payments: DraftPayment[];
}

const METHODS: PaymentMethod[] = ["card", "cash", "transfer"];

function buildSeed(): { reservations: Reservation[]; payments: Payment[] } {
  const drafts: DraftReservation[] = [];
  let resCounter = 0;
  const nextId = () => `res-${(1000 + resCounter++).toString()}`;

  function pushDraft(
    room: Room,
    guest: Guest,
    checkIn: string,
    checkOut: string,
    status: ReservationStatus,
    opts: { paidRatio: number; createdOffset: number; checkedInAt?: string; checkedOutAt?: string; guestCount?: number }
  ) {
    const nights = nightsBetween(checkIn, checkOut);
    const total = room.nightlyRate * nights;
    const paid = Math.round(total * opts.paidRatio);
    const payments: DraftPayment[] = [];
    if (paid > 0) {
      const splitFirst = paid > 3000 && rand() > 0.5 ? Math.round(paid * 0.5) : paid;
      payments.push({
        amount: splitFirst,
        method: pick(METHODS),
        createdAt: addDays(TODAY, opts.createdOffset),
      });
      if (splitFirst < paid) {
        payments.push({
          amount: paid - splitFirst,
          method: pick(METHODS),
          createdAt: addDays(TODAY, Math.min(opts.createdOffset + randInt(1, 3), 0)),
        });
      }
    }
    drafts.push({
      id: nextId(),
      guestId: guest.id,
      roomId: room.id,
      room,
      checkIn,
      checkOut,
      guestCount: opts.guestCount ?? 1 + Math.floor(rand() * room.capacity),
      status,
      createdAt: addDays(TODAY, opts.createdOffset),
      checkedInAt: opts.checkedInAt,
      checkedOutAt: opts.checkedOutAt,
      payments,
    });
  }

  // 1. Every "occupied" room gets a reservation spanning today — most
  // already checked in ("Konaklamada"), a few still just "confirmed" so
  // both states exist in the seed.
  const occupiedRooms = ROOMS.filter((r) => r.status === "occupied");
  occupiedRooms.forEach((room, i) => {
    const nights = 2 + (i % 4);
    const offset = -(i % nights);
    const checkIn = addDays(TODAY, offset);
    const checkOut = addDays(TODAY, offset + nights);
    const guest = GUESTS[i % GUESTS.length];
    const checkedIn = i % 4 !== 0;
    pushDraft(room, guest, checkIn, checkOut, checkedIn ? "checked_in" : "confirmed", {
      paidRatio: checkedIn ? 1 : 0.5,
      createdOffset: offset - 2,
      checkedInAt: checkedIn ? addDays(TODAY, offset) : undefined,
    });
  });

  const availableRooms = ROOMS.filter((r) => r.status === "available");

  // 2. Pending reservations (awaiting confirmation, future dates).
  for (let i = 0; i < 15; i++) {
    const room = availableRooms[i % availableRooms.length];
    const nights = randInt(2, 6);
    const start = 2 + randInt(0, 30);
    pushDraft(room, GUESTS[(i + 40) % GUESTS.length], addDays(TODAY, start), addDays(TODAY, start + nights), "pending", {
      paidRatio: 0,
      createdOffset: -randInt(1, 10),
    });
  }

  // 3. Confirmed future reservations ("reserved" rooms).
  for (let i = 0; i < 40; i++) {
    const room = availableRooms[(i + 15) % availableRooms.length];
    const nights = randInt(2, 8);
    const start = 1 + randInt(0, 90);
    pushDraft(room, GUESTS[(i + 80) % GUESTS.length], addDays(TODAY, start), addDays(TODAY, start + nights), "confirmed", {
      paidRatio: 0.3,
      createdOffset: -randInt(2, 30),
    });
  }

  // 4. Cancelled reservations.
  for (let i = 0; i < 25; i++) {
    const room = availableRooms[(i + 55) % availableRooms.length];
    const nights = randInt(1, 4);
    const start = randInt(-10, 40);
    pushDraft(room, GUESTS[(i + 120) % GUESTS.length], addDays(TODAY, start), addDays(TODAY, start + nights), "cancelled", {
      paidRatio: 0,
      createdOffset: start - randInt(3, 20),
    });
  }

  // 5. 36 months of completed historical stays with seasonality.
  for (let month = 35; month >= 0; month--) {
    // Seasonality logic: Summer months have more bookings.
    // Our anchor TODAY is August (month index 7 if we consider year boundaries, but we just want an alternating pattern)
    const isHighSeason = month % 12 <= 3 || month % 12 >= 10;
    const baseStays = isHighSeason ? 55 : 25;
    const stayCount = randInt(baseStays - 10, baseStays + 20);

    for (let j = 0; j < stayCount; j++) {
      const dayOffsetInMonth = randInt(1, 27);
      const totalOffset = -(month * 30 + (30 - dayOffsetInMonth));
      // Skip anything that would land in the future or collide with "today".
      if (totalOffset >= -1) continue;
      
      const room = pick(ROOMS);
      const nights = randInt(1, 7);
      const checkIn = addDays(TODAY, totalOffset);
      const checkOut = addDays(TODAY, totalOffset + nights);
      const guest = pick(GUESTS);
      const cancelled = rand() < 0.12; // 12% historic cancellation rate
      pushDraft(room, guest, checkIn, checkOut, cancelled ? "cancelled" : "completed", {
        paidRatio: cancelled ? 0 : 1,
        createdOffset: totalOffset - randInt(2, 30),
        checkedInAt: cancelled ? undefined : checkIn,
        checkedOutAt: cancelled ? undefined : checkOut,
      });
    }
  }

  const reservations: Reservation[] = drafts.map((d) => ({
    id: d.id,
    guestId: d.guestId,
    roomId: d.roomId,
    checkIn: d.checkIn,
    checkOut: d.checkOut,
    guestCount: d.guestCount,
    status: d.status,
    totalAmount: d.room.nightlyRate * nightsBetween(d.checkIn, d.checkOut),
    createdAt: d.createdAt,
    checkedInAt: d.checkedInAt,
    checkedOutAt: d.checkedOutAt,
  }));

  const payments: Payment[] = [];
  let payCounter = 0;
  for (const d of drafts) {
    for (const p of d.payments) {
      payments.push({
        id: `pay-${(1000 + payCounter++).toString()}`,
        reservationId: d.id,
        amount: p.amount,
        method: p.method,
        createdAt: p.createdAt,
        note: p.note,
      });
    }
  }

  return {
    reservations: reservations.sort((a, b) => (a.checkIn < b.checkIn ? 1 : -1)),
    payments,
  };
}

const SEED = buildSeed();
export const RESERVATIONS: Reservation[] = SEED.reservations;
export const PAYMENTS: Payment[] = SEED.payments;
