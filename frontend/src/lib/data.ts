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

const LOCALIZED_NAMES: Record<string, { first: string[], last: string[] }> = {
  tr: {
    first: ["Hakan", "Arda", "Burak", "Semih", "Cenk", "Kerem", "Ferdi", "Ozan", "Volkan", "Emre", "Barış", "Çağlar", "Ayşe", "Fatma", "Zeynep", "Elif", "Deniz", "Selin", "Buse", "Ece", "Gizem", "Sude", "İrem", "Melis", "Beren"],
    last: ["Şükür", "Turan", "Yılmaz", "Kılıçsoy", "Tosun", "Aktürkoğlu", "Kadıoğlu", "Tufan", "Demirel", "Belözoğlu", "Alper", "Söyüncü", "Demir", "Kaya", "Şahin", "Çelik", "Aydın"]
  },
  en: {
    first: ["David", "Wayne", "Harry", "Steven", "Frank", "Marcus", "Jude", "Phil", "Bukayo", "Raheem", "Declan", "Mary", "Patricia", "Jennifer", "Linda", "Elizabeth", "Emily", "Sarah", "Jessica", "Lisa"],
    last: ["Beckham", "Rooney", "Kane", "Gerrard", "Lampard", "Rashford", "Bellingham", "Foden", "Saka", "Sterling", "Rice", "Smith", "Johnson", "Williams", "Brown", "Jones", "Taylor"]
  },
  de: {
    first: ["Thomas", "Toni", "Manuel", "Bastian", "Miroslav", "Philipp", "Lukas", "Leroy", "Jamal", "Ilkay", "Joshua", "Hannah", "Mia", "Emma", "Anna", "Lea", "Clara", "Sophie", "Marie"],
    last: ["Müller", "Kroos", "Neuer", "Schweinsteiger", "Klose", "Lahm", "Podolski", "Sané", "Musiala", "Gündogan", "Kimmich", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer"]
  },
  ru: {
    first: ["Andrey", "Artem", "Igor", "Aleksandr", "Yuri", "Lev", "Valeriy", "Anatoliy", "Andriy", "Anna", "Maria", "Elena", "Daria", "Ekaterina", "Natalia", "Olga"],
    last: ["Arshavin", "Dzyuba", "Akinfeev", "Golovin", "Zhirkov", "Yashin", "Karpin", "Tymoshchuk", "Shevchenko", "Ivanov", "Smirnov", "Kuznetsov", "Popov"]
  },
  fr: {
    first: ["Zinedine", "Thierry", "Kylian", "Antoine", "Olivier", "N'Golo", "Paul", "Karim", "Michel", "Franck", "Ousmane", "Emma", "Jade", "Louise", "Alice", "Chloé", "Juliette"],
    last: ["Zidane", "Henry", "Mbappé", "Griezmann", "Giroud", "Kanté", "Pogba", "Benzema", "Platini", "Ribéry", "Dembélé", "Martin", "Bernard", "Thomas", "Petit"]
  },
  es: {
    first: ["Lionel", "Diego", "Andrés", "Xavi", "Sergio", "Iker", "Fernando", "Luis", "Carlos", "Alexis", "Arturo", "Sofía", "Isabella", "Camila", "Valentina", "Valeria", "Lucía"],
    last: ["Messi", "Maradona", "Iniesta", "Hernández", "Ramos", "Casillas", "Torres", "Suárez", "Tevez", "Sánchez", "Vidal", "García", "Fernández", "González", "Rodríguez", "López"]
  },
  it: {
    first: ["Roberto", "Paolo", "Francesco", "Gianluigi", "Alessandro", "Andrea", "Giorgio", "Leonardo", "Marco", "Fabio", "Sofia", "Giulia", "Aurora", "Alice", "Ginevra", "Chiara"],
    last: ["Baggio", "Maldini", "Totti", "Buffon", "Del Piero", "Pirlo", "Chiellini", "Bonucci", "Verratti", "Cannavaro", "Rossi", "Russo", "Ferrari", "Esposito"]
  },
  ar: {
    first: ["Mohamed", "Riyad", "Hakim", "Achraf", "Youssef", "Sami", "Yasser", "Omar", "Ali", "Hassan", "Fatima", "Aisha", "Maryam", "Zainab", "Huda", "Noor", "Salma"],
    last: ["Salah", "Mahrez", "Ziyech", "Hakimi", "En-Nesyri", "Al-Jaber", "Al-Qahtani", "Abdulrahman", "Al-Dawsari", "Al-Muwallad", "Ibrahim", "Abdullah", "Rahman"]
  },
  gr: {
    first: ["Theodoros", "Giorgos", "Kostas", "Angelos", "Sokratis", "Orestis", "Nikos", "Vasilis", "Stelios", "Maria", "Eleni", "Katerina", "Vasiliki", "Sofia", "Anna"],
    last: ["Zagorakis", "Karagounis", "Manolas", "Basinas", "Papastathopoulos", "Karnezis", "Machlas", "Torosidis", "Giannakopoulos", "Papadopoulos", "Pappas"]
  }
};

function getCountryRegion(country: string): keyof typeof LOCALIZED_NAMES {
  switch (country) {
    case "Türkiye": case "Azerbaycan": return "tr";
    case "Almanya": case "Avusturya": case "İsviçre": case "Hollanda": return "de";
    case "Rusya": case "Ukrayna": case "Belarus": case "Kazakistan": case "Bulgaristan": case "Gürcistan": case "Moldova": return "ru";
    case "Birleşik Krallık": case "Amerika Birleşik Devletleri": case "Kanada": case "Avustralya": case "Yeni Zelanda": case "İrlanda": return "en";
    case "Fransa": case "Belçika": return "fr";
    case "İspanya": case "Meksika": case "Kolombiya": case "Şili": case "Arjantin": case "Portekiz": case "Brezilya": return "es";
    case "İtalya": return "it";
    case "Suudi Arabistan": case "Birleşik Arap Emirlikleri": case "Irak": case "Kuveyt": case "Katar": case "Ürdün": case "Lübnan": case "Mısır": case "Fas": case "Cezayir": case "Tunus": case "Umman": case "İran": return "ar";
    case "Yunanistan": case "Kıbrıs": return "gr";
    default: return "en";
  }
}
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
    const country = pickWeightedCountry();
    const region = getCountryRegion(country);
    const names = LOCALIZED_NAMES[region];
    
    // Pick deterministic but varied names
    const first = names.first[(i * 7) % names.first.length];
    const last = names.last[(i * 11) % names.last.length];
    
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
interface DraftReservation extends Reservation {
  room: Room;
  payments: DraftPayment[];
}

const METHODS: PaymentMethod[] = ["card", "cash", "transfer"];

function getRealisticLeadTime(): number {
  const r = rand();
  if (r < 0.15) return randInt(0, 3); // Last minute (15%)
  if (r < 0.50) return randInt(4, 21); // Short term (35%)
  if (r < 0.85) return randInt(22, 60); // Medium term (35%)
  return randInt(61, 150); // Early booking (15%)
}

function getRealisticLengthOfStay(): number {
  const r = rand();
  if (r < 0.40) return 1; // 1 night business/transit (40%)
  if (r < 0.75) return 2; // 2 nights weekend/short (35%)
  if (r < 0.90) return 3; // 3 nights (15%)
  if (r < 0.97) return randInt(4, 5); // 4-5 nights (7%)
  return randInt(6, 14); // Extended stay (3%)
}

function applyDynamicPricing(baseTotal: number, leadTime: number): number {
  // Early booking discount vs Last minute markup
  if (leadTime > 60) return Math.round(baseTotal * 0.85); // 15% discount
  if (leadTime > 30) return Math.round(baseTotal * 0.90); // 10% discount
  if (leadTime < 3) return Math.round(baseTotal * 1.15); // 15% markup for last minute
  if (leadTime < 7) return Math.round(baseTotal * 1.05); // 5% markup
  return baseTotal;
}

function buildSeed(): { reservations: Reservation[]; payments: Payment[] } {
  const drafts: DraftReservation[] = [];
  let resCounter = 0;
  const nextId = () => `res-${(1000 + resCounter++).toString()}`;

  function pushDraft(
    room: Room,
    guest: Guest,
    checkInOffset: number,
    checkOutOffset: number,
    status: ReservationStatus,
    opts: { paidRatio: number; checkedInAt?: string; checkedOutAt?: string; guestCount?: number; forceLeadTime?: number }
  ) {
    const checkIn = addDays(TODAY, checkInOffset);
    const checkOut = addDays(TODAY, checkOutOffset);
    const nights = nightsBetween(checkIn, checkOut);
    
    // Booking date calculation (Lead time)
    // If it's a historical booking or future booking, lead time is relative to check-in.
    const leadTime = opts.forceLeadTime ?? getRealisticLeadTime();
    // createdAt is checkIn - leadTime
    const createdOffset = checkInOffset - leadTime;
    
    // Dynamic Pricing
    const baseTotal = room.nightlyRate * nights;
    const finalTotal = applyDynamicPricing(baseTotal, leadTime);
    
    const paid = Math.round(finalTotal * opts.paidRatio);
    const payments: DraftPayment[] = [];
    if (paid > 0) {
      const splitFirst = paid > 5000 && rand() > 0.6 ? Math.round(paid * 0.5) : paid;
      payments.push({
        amount: splitFirst,
        method: pick(METHODS),
        createdAt: addDays(TODAY, createdOffset), // Deposit paid at booking
      });
      if (splitFirst < paid) {
        // Second payment usually at check-in or check-out
        const secondPaymentOffset = status === "completed" || status === "checked_in" 
          ? checkInOffset 
          : Math.min(createdOffset + randInt(3, 10), 0);
          
        payments.push({
          amount: paid - splitFirst,
          method: pick(METHODS),
          createdAt: addDays(TODAY, secondPaymentOffset),
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
      totalAmount: finalTotal, // Store dynamic price temporarily for mapping later
      createdAt: addDays(TODAY, createdOffset),
      checkedInAt: opts.checkedInAt,
      checkedOutAt: opts.checkedOutAt,
      payments,
    });
  }

  // 1. "Occupied" rooms: active stays. A room's status is only ever
  // "occupied" once a guest has physically checked in — otherwise it stays
  // "available" and shows up via the separate "reserved" stat — so every
  // occupied room here must have a genuine checked_in reservation, or the
  // room drawer would show "Dolu" with no one actually staying there.
  const occupiedRooms = ROOMS.filter((r) => r.status === "occupied");
  occupiedRooms.forEach((room, i) => {
    const nights = getRealisticLengthOfStay();
    const offset = -randInt(0, nights - 1); // Started sometime in the last few days
    const guest = GUESTS[i % GUESTS.length];

    pushDraft(room, guest, offset, offset + nights, "checked_in", {
      paidRatio: 1,
      checkedInAt: addDays(TODAY, offset),
    });
  });

  const availableRooms = ROOMS.filter((r) => r.status === "available");

  // 2. Pending (Awaiting confirmation) - usually booked very recently
  for (let i = 0; i < 20; i++) {
    const room = availableRooms[i % availableRooms.length];
    const nights = getRealisticLengthOfStay();
    const start = randInt(1, 45); // Future stay
    pushDraft(room, GUESTS[(i + 40) % GUESTS.length], start, start + nights, "pending", {
      paidRatio: 0,
      forceLeadTime: randInt(0, 3), // Pending means they literally just booked it
    });
  }

  // 3. Confirmed future reservations
  for (let i = 0; i < 60; i++) {
    const room = availableRooms[(i + 15) % availableRooms.length];
    const nights = getRealisticLengthOfStay();
    const start = randInt(1, 120); // Distributed over next 4 months
    pushDraft(room, GUESTS[(i + 80) % GUESTS.length], start, start + nights, "confirmed", {
      paidRatio: rand() > 0.5 ? 0.3 : 1, // Either 30% deposit or fully prepaid
    });
  }

  // 4. Cancelled reservations (usually cancelled close to arrival)
  for (let i = 0; i < 30; i++) {
    const room = availableRooms[(i + 55) % availableRooms.length];
    const nights = getRealisticLengthOfStay();
    const start = randInt(-15, 60); // Could have been for past dates or future dates
    pushDraft(room, GUESTS[(i + 120) % GUESTS.length], start, start + nights, "cancelled", {
      paidRatio: 0,
    });
  }

  // 5. 36 months of historical data with deep seasonality
  for (let month = 35; month >= 0; month--) {
    // True city hotel seasonality logic: High in Spring (Mar-May) and Autumn (Sep-Nov)
    // Lower in deep winter (Jan-Feb) and mid-summer (Jul-Aug) for business.
    const monthIndex = (TODAY.getMonth() - month + 36) % 12; 
    const isHighSeason = [2, 3, 4, 8, 9, 10].includes(monthIndex); // March, April, May, Sep, Oct, Nov
    const isLowSeason = [0, 1, 6, 7].includes(monthIndex); // Jan, Feb, Jul, Aug
    
    let baseStays = 40;
    if (isHighSeason) baseStays = 70;
    if (isLowSeason) baseStays = 20;
    
    const stayCount = randInt(baseStays - 10, baseStays + 10);

    for (let j = 0; j < stayCount; j++) {
      const dayOffsetInMonth = randInt(1, 28);
      const totalOffset = -(month * 30 + (30 - dayOffsetInMonth));
      if (totalOffset >= -1) continue; // Skip collisions with today
      
      const room = pick(ROOMS);
      const nights = getRealisticLengthOfStay();
      const guest = pick(GUESTS);
      const cancelled = rand() < 0.15; // 15% historical cancellation rate
      
      pushDraft(room, guest, totalOffset, totalOffset + nights, cancelled ? "cancelled" : "completed", {
        paidRatio: cancelled ? 0 : 1,
        checkedInAt: cancelled ? undefined : addDays(TODAY, totalOffset),
        checkedOutAt: cancelled ? undefined : addDays(TODAY, totalOffset + nights),
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
    totalAmount: d.totalAmount,
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
