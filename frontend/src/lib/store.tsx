"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { GUESTS, PAYMENTS, RESERVATIONS, ROOMS, TODAY_ISO } from "./data";
import { hasConflict } from "./availability";
import type {
  FormResult,
  Guest,
  Payment,
  PaymentMethod,
  Reservation,
  Room,
  RoomType,
} from "./types";

const STORAGE_KEY = "yunma-store-v1";

interface StoreState {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  payments: Payment[];
}

const SEED_STATE: StoreState = {
  rooms: ROOMS,
  guests: GUESTS,
  reservations: RESERVATIONS,
  payments: PAYMENTS,
};

type Action = { type: "REPLACE_ALL"; payload: StoreState } | { type: "SET"; payload: StoreState };

function reducer(_state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "REPLACE_ALL":
    case "SET":
      return action.payload;
    default:
      return _state;
  }
}

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter}`;
}

interface StoreApi {
  state: StoreState;
  todayIso: string;
  createReservation(input: {
    guestId: string;
    roomId: string;
    checkIn: string;
    checkOut: string;
    guestCount: number;
  }): FormResult;
  updateReservation(
    id: string,
    input: { checkIn: string; checkOut: string; guestCount: number; roomId: string }
  ): FormResult;
  confirmReservation(id: string): FormResult;
  cancelReservation(id: string): FormResult;
  checkIn(id: string): FormResult;
  checkOut(id: string): FormResult;
  addPayment(input: { reservationId: string; amount: number; method: PaymentMethod; note?: string }): FormResult;
  createRoom(input: {
    number: string;
    type: RoomType;
    capacity: number;
    nightlyRate: number;
    amenities: string[];
  }): FormResult;
  updateRoom(
    id: string,
    input: { number: string; type: RoomType; capacity: number; nightlyRate: number; amenities: string[] }
  ): FormResult;
  deactivateRoom(id: string): FormResult;
  createGuest(input: Omit<Guest, "id">): FormResult;
  updateGuest(id: string, input: Omit<Guest, "id">): FormResult;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, SEED_STATE);
  const stateRef = useRef(state);
  // Refs must not be mutated during render — keep it current via an effect
  // instead so action creators (below) always read the latest state.
  useEffect(() => {
    stateRef.current = state;
  });
  const hydrated = useRef(false);

  // Load any persisted session on mount. The server (and the first client
  // render) always start from the fixed seed so hydration never mismatches;
  // this effect only ever *replaces* state after that first paint.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as StoreState;
        if (parsed.rooms && parsed.guests && parsed.reservations && parsed.payments) {
          dispatch({ type: "REPLACE_ALL", payload: parsed });
        }
      }
    } catch {
      // Corrupt or missing storage — fall back to seed data silently.
    } finally {
      hydrated.current = true;
    }
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage full or unavailable (private mode) — not fatal, just skip persistence.
    }
  }, [state]);

  const set = useCallback((updater: (s: StoreState) => StoreState) => {
    dispatch({ type: "SET", payload: updater(stateRef.current) });
  }, []);

  const api = useMemo<StoreApi>(() => {
    return {
      state,
      todayIso: TODAY_ISO,

      createReservation(input) {
        const s = stateRef.current;
        if (input.checkOut <= input.checkIn) {
          return { ok: false, error: "Çıkış tarihi, giriş tarihinden sonra olmalıdır." };
        }
        const room = s.rooms.find((r) => r.id === input.roomId);
        if (!room) return { ok: false, error: "Oda bulunamadı." };
        if (input.guestCount > room.capacity) {
          return { ok: false, error: `Bu oda en fazla ${room.capacity} misafir alabilir.` };
        }
        if (hasConflict(input.roomId, input.checkIn, input.checkOut, s.reservations)) {
          return { ok: false, error: "Bu oda, seçilen tarihlerde başka bir rezervasyona ait." };
        }
        const totalAmount = room.nightlyRate * nightsBetween(input.checkIn, input.checkOut);
        const reservation: Reservation = {
          id: nextId("res"),
          guestId: input.guestId,
          roomId: input.roomId,
          checkIn: input.checkIn,
          checkOut: input.checkOut,
          guestCount: input.guestCount,
          status: "pending",
          totalAmount,
          createdAt: TODAY_ISO,
        };
        set((prev) => ({ ...prev, reservations: [reservation, ...prev.reservations] }));
        return { ok: true };
      },

      updateReservation(id, input) {
        const s = stateRef.current;
        const existing = s.reservations.find((r) => r.id === id);
        if (!existing) return { ok: false, error: "Rezervasyon bulunamadı." };
        if (input.checkOut <= input.checkIn) {
          return { ok: false, error: "Çıkış tarihi, giriş tarihinden sonra olmalıdır." };
        }
        const room = s.rooms.find((r) => r.id === input.roomId);
        if (!room) return { ok: false, error: "Oda bulunamadı." };
        if (input.guestCount > room.capacity) {
          return { ok: false, error: `Bu oda en fazla ${room.capacity} misafir alabilir.` };
        }
        if (hasConflict(input.roomId, input.checkIn, input.checkOut, s.reservations, id)) {
          return { ok: false, error: "Bu oda, seçilen tarihlerde başka bir rezervasyona ait." };
        }
        const totalAmount = room.nightlyRate * nightsBetween(input.checkIn, input.checkOut);
        set((prev) => ({
          ...prev,
          reservations: prev.reservations.map((r) =>
            r.id === id ? { ...r, ...input, totalAmount } : r
          ),
        }));
        return { ok: true };
      },

      confirmReservation(id) {
        const existing = stateRef.current.reservations.find((r) => r.id === id);
        if (!existing) return { ok: false, error: "Rezervasyon bulunamadı." };
        if (existing.status !== "pending") {
          return { ok: false, error: "Yalnızca beklemedeki rezervasyonlar onaylanabilir." };
        }
        set((prev) => ({
          ...prev,
          reservations: prev.reservations.map((r) => (r.id === id ? { ...r, status: "confirmed" } : r)),
        }));
        return { ok: true };
      },

      cancelReservation(id) {
        const existing = stateRef.current.reservations.find((r) => r.id === id);
        if (!existing) return { ok: false, error: "Rezervasyon bulunamadı." };
        if (existing.status === "checked_in" || existing.status === "completed") {
          return { ok: false, error: "Konaklaması başlamış bir rezervasyon iptal edilemez." };
        }
        set((prev) => ({
          ...prev,
          reservations: prev.reservations.map((r) => (r.id === id ? { ...r, status: "cancelled" } : r)),
        }));
        return { ok: true };
      },

      checkIn(id) {
        const s = stateRef.current;
        const existing = s.reservations.find((r) => r.id === id);
        if (!existing) return { ok: false, error: "Rezervasyon bulunamadı." };
        if (existing.status !== "confirmed") {
          return { ok: false, error: "Yalnızca onaylanmış rezervasyonlarda check-in yapılabilir." };
        }
        set((prev) => ({
          ...prev,
          reservations: prev.reservations.map((r) =>
            r.id === id ? { ...r, status: "checked_in", checkedInAt: TODAY_ISO } : r
          ),
          rooms: prev.rooms.map((room) => (room.id === existing.roomId ? { ...room, status: "occupied" } : room)),
        }));
        return { ok: true };
      },

      checkOut(id) {
        const s = stateRef.current;
        const existing = s.reservations.find((r) => r.id === id);
        if (!existing) return { ok: false, error: "Rezervasyon bulunamadı." };
        if (existing.status !== "checked_in") {
          return { ok: false, error: "Yalnızca konaklamadaki rezervasyonlarda check-out yapılabilir." };
        }
        set((prev) => ({
          ...prev,
          reservations: prev.reservations.map((r) =>
            r.id === id ? { ...r, status: "completed", checkedOutAt: TODAY_ISO } : r
          ),
          rooms: prev.rooms.map((room) => (room.id === existing.roomId ? { ...room, status: "available" } : room)),
        }));
        return { ok: true };
      },

      addPayment(input) {
        if (input.amount <= 0) return { ok: false, error: "Tutar sıfırdan büyük olmalıdır." };
        const s = stateRef.current;
        const reservation = s.reservations.find((r) => r.id === input.reservationId);
        if (!reservation) return { ok: false, error: "Rezervasyon bulunamadı." };
        const paidSoFar = s.payments
          .filter((p) => p.reservationId === input.reservationId)
          .reduce((sum, p) => sum + p.amount, 0);
        if (paidSoFar + input.amount > reservation.totalAmount) {
          return { ok: false, error: "Ödeme, kalan bakiyeden fazla olamaz." };
        }
        const payment: Payment = {
          id: nextId("pay"),
          reservationId: input.reservationId,
          amount: input.amount,
          method: input.method,
          note: input.note,
          createdAt: TODAY_ISO,
        };
        set((prev) => ({ ...prev, payments: [payment, ...prev.payments] }));
        return { ok: true };
      },

      createRoom(input) {
        const s = stateRef.current;
        if (s.rooms.some((r) => r.number === input.number)) {
          return { ok: false, error: "Bu oda numarası zaten kullanılıyor." };
        }
        const room: Room = {
          id: nextId("room"),
          ...input,
          status: "available",
          active: true,
        };
        set((prev) => ({ ...prev, rooms: [...prev.rooms, room] }));
        return { ok: true };
      },

      updateRoom(id, input) {
        const s = stateRef.current;
        if (s.rooms.some((r) => r.number === input.number && r.id !== id)) {
          return { ok: false, error: "Bu oda numarası zaten kullanılıyor." };
        }
        set((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === id ? { ...r, ...input } : r)),
        }));
        return { ok: true };
      },

      deactivateRoom(id) {
        const s = stateRef.current;
        const room = s.rooms.find((r) => r.id === id);
        if (!room) return { ok: false, error: "Oda bulunamadı." };
        if (room.status === "occupied") {
          return { ok: false, error: "Dolu bir oda pasife alınamaz." };
        }
        set((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) => (r.id === id ? { ...r, active: false } : r)),
        }));
        return { ok: true };
      },

      createGuest(input) {
        const guest: Guest = { id: nextId("guest"), ...input };
        set((prev) => ({ ...prev, guests: [guest, ...prev.guests] }));
        return { ok: true };
      },

      updateGuest(id, input) {
        set((prev) => ({
          ...prev,
          guests: prev.guests.map((g) => (g.id === id ? { ...g, ...input } : g)),
        }));
        return { ok: true };
      },
    };
  }, [state, set]);

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
