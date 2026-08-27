"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { autoLogin, api } from "./api";
import { hasConflict } from "./availability";
import type {
  FormResult,
  Guest,
  Payment,
  PaymentMethod,
  Reservation,
  Room,
  RoomStatus,
  RoomType,
} from "./types";

const TODAY_ISO = new Date().toISOString().split("T")[0];

interface StoreState {
  rooms: Room[];
  guests: Guest[];
  reservations: Reservation[];
  payments: Payment[];
}

const INITIAL_STATE: StoreState = {
  rooms: [],
  guests: [],
  reservations: [],
  payments: [],
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

interface StoreApi {
  state: StoreState;
  todayIso: string;
  hydrating: boolean;
  createReservation(input: {
    guestId: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
  }): Promise<FormResult>;
  updateReservation(
    id: number,
    input: { checkIn: string; checkOut: string; guestCount: number; roomId: number }
  ): Promise<FormResult>;
  confirmReservation(id: number): Promise<FormResult>;
  cancelReservation(id: number): Promise<FormResult>;
  checkIn(id: number): Promise<FormResult>;
  checkOut(id: number): Promise<FormResult>;
  addPayment(input: { reservationId: number; amount: number; method: PaymentMethod; note?: string }): Promise<FormResult>;
  createRoom(input: {
    number: string;
    type: RoomType;
    capacity: number;
    nightlyRate: number;
    amenities: string[];
  }): Promise<FormResult>;
  updateRoom(
    id: number,
    input: { number: string; type: RoomType; capacity: number; nightlyRate: number; amenities: string[]; status: RoomStatus }
  ): Promise<FormResult>;
  deactivateRoom(id: number): Promise<FormResult>;
  createGuest(input: Omit<Guest, "id">): Promise<FormResult>;
  updateGuest(id: number, input: Omit<Guest, "id">): Promise<FormResult>;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  });
  
  const [hydrating, setHydrating] = useState(true);

  const loadData = async () => {
    try {
      const [rooms, guests, reservations, payments] = await Promise.all([
        api.get('/api/rooms?per_page=1000').then(res => res.data.data),
        api.get('/api/guests?per_page=1000').then(res => res.data.data),
        api.get('/api/reservations?per_page=1000').then(res => res.data.data),
        api.get('/api/payments?per_page=1000').then(res => res.data.data),
      ]);
      
      dispatch({ type: "REPLACE_ALL", payload: { rooms, guests, reservations, payments } });
    } catch (err) {
      console.error("Failed to load initial data", err);
    } finally {
      setHydrating(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const set = useCallback((updater: (s: StoreState) => StoreState) => {
    dispatch({ type: "SET", payload: updater(stateRef.current) });
  }, []);

  const storeApi = useMemo<StoreApi>(() => {
    return {
      state,
      todayIso: TODAY_ISO,
      hydrating,

      async createReservation(input) {
        try {
          const res = await api.post('/api/reservations', input);
          set((prev) => ({ ...prev, reservations: [res.data.data, ...prev.reservations] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Rezervasyon oluşturulamadı." };
        }
      },

      async updateReservation(id, input) {
        try {
          const res = await api.put(`/api/reservations/${id}`, input);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Rezervasyon güncellenemedi." };
        }
      },

      async confirmReservation(id) {
        try {
          const res = await api.post(`/api/reservations/${id}/confirm`);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
        }
      },

      async cancelReservation(id) {
        try {
          const res = await api.post(`/api/reservations/${id}/cancel`);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
        }
      },

      async checkIn(id) {
        try {
          const res = await api.post(`/api/reservations/${id}/check-in`);
          const updatedRes = res.data.data;
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? updatedRes : r)),
            rooms: prev.rooms.map((room) => (room.id === updatedRes.roomId ? { ...room, status: "occupied" } : room)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
        }
      },

      async checkOut(id) {
        try {
          const res = await api.post(`/api/reservations/${id}/check-out`);
          const updatedRes = res.data.data;
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === id ? updatedRes : r)),
            rooms: prev.rooms.map((room) => (room.id === updatedRes.roomId ? { ...room, status: "available" } : room)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
        }
      },

      async addPayment(input) {
        try {
          const res = await api.post('/api/payments', input);
          set((prev) => ({ ...prev, payments: [res.data.data, ...prev.payments] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Ödeme eklenemedi." };
        }
      },

      async createRoom(input) {
        try {
          const res = await api.post('/api/rooms', input);
          set((prev) => ({ ...prev, rooms: [...prev.rooms, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Oda eklenemedi." };
        }
      },

      async updateRoom(id, input) {
        try {
          const res = await api.put(`/api/rooms/${id}`, input);
          set((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Oda güncellenemedi." };
        }
      },

      async deactivateRoom(id) {
        try {
          const res = await api.patch(`/api/rooms/${id}/deactivate`);
          set((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
        }
      },

      async createGuest(input) {
        try {
          const res = await api.post('/api/guests', input);
          set((prev) => ({ ...prev, guests: [res.data.data, ...prev.guests] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Misafir eklenemedi." };
        }
      },

      async updateGuest(id, input) {
        try {
          const res = await api.put(`/api/guests/${id}`, input);
          set((prev) => ({
            ...prev,
            guests: prev.guests.map((g) => (g.id === id ? res.data.data : g)),
          }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Misafir güncellenemedi." };
        }
      },
    };
  }, [state, set, hydrating]);

  return <StoreContext.Provider value={storeApi}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
