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
import axios from "axios";
import { api } from "./api";
import { fetchAllPages } from "./fetchAllPages";
import { extractFormError } from "./errors";
import type {
  Employee,
  EmployeeStatus,
  FormResult,
  Guest,
  Payment,
  PaymentMethod,
  Permission,
  Reservation,
  Role,
  Room,
  RoomService,
  RoomStatus,
  RoomTypeDefinition,
} from "./types";

function todayIsoNow(): string {
  return new Date().toISOString().split("T")[0];
}

interface StoreState {
  rooms: Room[];
  roomTypes: RoomTypeDefinition[];
  guests: Guest[];
  reservations: Reservation[];
  payments: Payment[];
  roomServices: RoomService[];
  permissions: Permission[];
  roles: Role[];
  employees: Employee[];
}

const INITIAL_STATE: StoreState = {
  rooms: [],
  roomTypes: [],
  guests: [],
  reservations: [],
  payments: [],
  roomServices: [],
  permissions: [],
  roles: [],
  employees: [],
};

type Action =
  | { type: "SET_COLLECTION"; key: keyof StoreState; payload: StoreState[keyof StoreState] }
  | { type: "SET"; payload: StoreState };

function reducer(state: StoreState, action: Action): StoreState {
  switch (action.type) {
    case "SET_COLLECTION":
      return { ...state, [action.key]: action.payload };
    case "SET":
      return action.payload;
    default:
      return state;
  }
}

/**
 * Every page used to gate its whole render on the single `hydrating` flag,
 * which only flips once ALL 8 endpoints resolve — so e.g. the roles page sat
 * behind the reservations/payments fetches (each 2 paginated round-trips on
 * the seeded dataset) despite reading neither. `loading` tracks each
 * collection independently so a page can wait only on what it actually reads.
 */
type LoadingFlags = Record<keyof StoreState, boolean>;

const ALL_LOADING: LoadingFlags = {
  rooms: true,
  roomTypes: true,
  guests: true,
  reservations: true,
  payments: true,
  roomServices: true,
  permissions: true,
  roles: true,
  employees: true,
};

interface StoreApi {
  state: StoreState;
  todayIso: string;
  /** True until every collection has loaded — kept for pages/gates that legitimately need the whole dataset. */
  hydrating: boolean;
  /** Per-collection loading state, for pages that only read a subset (e.g. roles/employees don't need reservations/payments). */
  loading: LoadingFlags;
  loadError: boolean;
  reload(): void;
  createReservation(input: {
    guestId: number;
    roomId: number;
    checkIn: string;
    checkOut: string;
    guestCount: number;
    companions?: number[];
  }): Promise<FormResult>;
  updateReservation(
    id: number,
    input: { checkIn: string; checkOut: string; guestCount: number; roomId: number; companions?: number[] }
  ): Promise<FormResult>;
  confirmReservation(id: number): Promise<FormResult>;
  cancelReservation(id: number): Promise<FormResult>;
  deleteReservation(id: number): Promise<FormResult>;
  checkIn(id: number): Promise<FormResult>;
  checkOut(id: number): Promise<FormResult>;
  addPayment(input: { reservationId: number; amount: number; method: PaymentMethod; note?: string; createdAt?: string }): Promise<FormResult>;
  createRoom(input: { number: string; roomTypeId: number }): Promise<FormResult>;
  updateRoom(id: number, input: { number: string; roomTypeId: number; status: RoomStatus }): Promise<FormResult>;
  deactivateRoom(id: number): Promise<FormResult>;
  activateRoom(id: number): Promise<FormResult>;
  createRoomType(input: {
    name: string;
    description: string | null;
    capacity: number;
    nightlyRate: number;
    amenities: string[];
    bedType: string | null;
    sizeM2: number | null;
    view: string | null;
  }): Promise<FormResult>;
  updateRoomType(
    id: number,
    input: {
      name: string;
      description: string | null;
      capacity: number;
      nightlyRate: number;
      amenities: string[];
      bedType: string | null;
      sizeM2: number | null;
      view: string | null;
      active: boolean;
    }
  ): Promise<FormResult>;
  deleteRoomType(id: number): Promise<FormResult>;
  updateHousekeeping(id: number, status: Room["housekeepingStatus"]): Promise<FormResult>;
  updateHousekeepingAdvanced(id: number, payload: Partial<Room>): Promise<FormResult>;
  createGuest(input: Omit<Guest, "id">): Promise<FormResult>;
  updateGuest(id: number, input: Omit<Guest, "id">): Promise<FormResult>;
  addRoomService(reservationId: number, input: { description: string; amount: number }): Promise<FormResult>;
  getRoomServices(reservationId: number): Promise<{ ok: true, data: import('./types').RoomService[] } | { ok: false, error: string }>;
  deleteRoomService(roomServiceId: number): Promise<FormResult>;
  createRole(input: { name: string; description: string; department: string | null; permissionIds: number[] }): Promise<FormResult>;
  updateRole(id: number, input: { name: string; description: string; department: string | null; permissionIds: number[] }): Promise<FormResult>;
  deleteRole(id: number): Promise<FormResult>;
  createEmployee(input: {
    fullName: string;
    profession: string;
    roleId: number | null;
    email?: string;
    phone?: string;
    hireDate?: string;
    notes?: string;
  }): Promise<FormResult>;
  updateEmployee(
    id: number,
    input: {
      fullName: string;
      profession: string;
      roleId: number | null;
      email?: string;
      phone?: string;
      hireDate?: string;
      status: EmployeeStatus;
      notes?: string;
    }
  ): Promise<FormResult>;
}

const StoreContext = createContext<StoreApi | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  
  useEffect(() => {
    stateRef.current = state;
  });
  
  const [loading, setLoading] = useState<LoadingFlags>(ALL_LOADING);
  const [loadError, setLoadError] = useState(false);
  const [todayIso, setTodayIso] = useState(todayIsoNow);
  const [reloadToken, setReloadToken] = useState(0);

  // OR of every per-collection flag — true until all 8 have loaded. Kept for
  // pages/gates that genuinely need the whole dataset (e.g. the dashboard).
  const hydrating = Object.values(loading).some(Boolean);

  // React StrictMode (on by default in `next dev`) deliberately mounts every
  // effect twice to surface missing cleanup — without this, that meant the
  // full 8-endpoint load ran twice back-to-back on every dev page load, and
  // on the single-threaded PHP dev server the second pass had to wait in
  // line behind the first, roughly doubling the real wait. `signal` lets the
  // first (StrictMode-simulated-unmount) pass's in-flight requests be
  // aborted instead of running to completion.
  // A 403 means the signed-in role simply lacks that resource's view
  // permission (every one of these 8 endpoints is permission-gated on the
  // backend, not just the 5 previously wrapped here) — that's normal and
  // should render as "nothing to show", not the hard error state. Anything
  // else (network failure, 5xx, aborts) still propagates so a real outage
  // is reported instead of silently hydrating with empty data.
  function ignorePermissionDenied<T>(promise: Promise<T>, fallback: T): Promise<T> {
    return promise.catch((err) => {
      if (axios.isCancel(err)) throw err;
      if (axios.isAxiosError(err) && err.response?.status === 403) return fallback;
      throw err;
    });
  }

  const loadData = async (signal: AbortSignal) => {
    setLoading(ALL_LOADING);
    setLoadError(false);

    // Dispatches each collection as soon as it resolves and clears only its
    // own flag, instead of waiting for Promise.all and replacing everything
    // at once — so a page gating on e.g. loading.roles alone doesn't sit
    // behind the reservations/payments fetches (each 2 paginated
    // round-trips on the seeded dataset) that it never reads.
    function load<K extends keyof StoreState>(key: K, fetcher: () => Promise<StoreState[K]>) {
      return fetcher()
        .then((data) => {
          dispatch({ type: "SET_COLLECTION", key, payload: data });
          setLoading((prev) => ({ ...prev, [key]: false }));
        })
        .catch((err) => {
          // Aborted means a newer loadData() run (StrictMode's second mount,
          // or an explicit reload()) already owns this key — don't dispatch
          // stale/empty data over it and don't touch its loading flag.
          if (axios.isCancel(err)) return;
          setLoading((prev) => ({ ...prev, [key]: false }));
          throw err;
        });
    }

    try {
      await Promise.all([
        // These endpoints are also paginated server-side (the backend clamps
        // per_page), so fetchAllPages is used everywhere to stay correct as
        // any of them grows past a single page. Every endpoint here is
        // permission-gated on the backend, so a role that lacks the
        // corresponding view permission gets a 403 — ignorePermissionDenied
        // treats that as "nothing to show" instead of failing the whole load.
        load('rooms', () => ignorePermissionDenied(fetchAllPages<Room>('/api/rooms', signal), [])),
        load('roomTypes', () => ignorePermissionDenied(fetchAllPages<RoomTypeDefinition>('/api/room-types', signal), [])),
        load('guests', () => ignorePermissionDenied(fetchAllPages<Guest>('/api/guests', signal), [])),
        load('reservations', () => ignorePermissionDenied(fetchAllPages<Reservation>('/api/reservations', signal), [])),
        load('payments', () => ignorePermissionDenied(fetchAllPages<Payment>('/api/payments', signal), [])),
        load('roomServices', () => ignorePermissionDenied(fetchAllPages<RoomService>('/api/room-services', signal), [])),
        load('permissions', () => ignorePermissionDenied(api.get('/api/permissions', { signal }).then(res => res.data.data), [])),
        load('roles', () => ignorePermissionDenied(api.get('/api/roles', { signal }).then(res => res.data.data), [])),
        load('employees', () => ignorePermissionDenied(fetchAllPages<Employee>('/api/employees', signal), [])),
      ]);
    } catch (err) {
      // A non-403 failure here means the backend itself is unreachable (or a
      // genuine server error) — surface that as a real error state instead
      // of silently rendering empty lists forever.
      console.error("Failed to load initial data", err);
      setLoadError(true);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    loadData(controller.signal);
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadToken]);

  useEffect(() => {
    // Functional form + an explicit equality check so a tick that lands
    // within the same calendar day (the common case) is a genuine no-op —
    // React already bails out of re-rendering on an unchanged primitive
    // state value, but being explicit here keeps this from silently
    // regressing if todayIsoNow() ever stops returning a stable primitive.
    const id = setInterval(() => setTodayIso((prev) => {
      const next = todayIsoNow();
      return prev === next ? prev : next;
    }), 60_000);
    return () => clearInterval(id);
  }, []);

  const set = useCallback((updater: (s: StoreState) => StoreState) => {
    dispatch({ type: "SET", payload: updater(stateRef.current) });
  }, []);

  // Every mutation method here only ever touches `set`/`stateRef` (never
  // `state` directly), so none of them actually need to change identity when
  // `state` changes — but they used to live inside a memo keyed on `state`,
  // so every SET_COLLECTION/SET dispatch rebuilt all 30+ closures and hence
  // the whole context value, re-rendering every `useStore()` consumer in the
  // app. Splitting them into their own memo (stable for the app's lifetime,
  // since `set` never changes) means only `state`/`todayIso`/`loading`
  // actually changing produces a new context value.
  type StoreActions = Omit<StoreApi, "state" | "todayIso" | "hydrating" | "loading" | "loadError">;
  const actions = useMemo<StoreActions>(() => {
    return {
      reload: () => setReloadToken((t) => t + 1),

      async createReservation(input) {
        try {
          const res = await api.post('/api/reservations', input);
          set((prev) => ({ ...prev, reservations: [res.data.data, ...prev.reservations] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Rezervasyon oluşturulamadı.");
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
          return extractFormError(err, "Rezervasyon güncellenemedi.");
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
          return extractFormError(err, "Hata oluştu.");
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
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async deleteReservation(id) {
        try {
          await api.delete(`/api/reservations/${id}`);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.filter((r) => r.id !== id),
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Silme işlemi başarısız oldu.");
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
          return extractFormError(err, "Hata oluştu.");
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
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async addPayment(input) {
        try {
          const res = await api.post('/api/payments', input);
          set((prev) => ({ ...prev, payments: [res.data.data, ...prev.payments] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Ödeme eklenemedi.");
        }
      },

      async createRoom(input) {
        try {
          const res = await api.post('/api/rooms', input);
          set((prev) => ({ ...prev, rooms: [...prev.rooms, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Oda eklenemedi.");
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
          return extractFormError(err, "Oda güncellenemedi.");
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
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async activateRoom(id) {
        try {
          const res = await api.patch(`/api/rooms/${id}/activate`);
          set((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async createRoomType(input) {
        try {
          const res = await api.post('/api/room-types', input);
          set((prev) => ({ ...prev, roomTypes: [...prev.roomTypes, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Oda tipi eklenemedi.");
        }
      },

      async updateRoomType(id, input) {
        try {
          const res = await api.put(`/api/room-types/${id}`, input);
          // The backend propagates the new capacity/rate/amenities to every
          // room on this type, so the in-memory `rooms` snapshot is stale —
          // re-fetch it rather than duplicating that propagation rule here.
          const rooms = await fetchAllPages<Room>('/api/rooms');
          set((prev) => ({
            ...prev,
            roomTypes: prev.roomTypes.map((t) => (t.id === id ? res.data.data : t)),
            rooms,
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Oda tipi güncellenemedi.");
        }
      },

      async deleteRoomType(id) {
        try {
          await api.delete(`/api/room-types/${id}`);
          set((prev) => ({ ...prev, roomTypes: prev.roomTypes.filter((t) => t.id !== id) }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Oda tipi silinemedi.");
        }
      },

      async updateHousekeeping(id, status) {
        try {
          const res = await api.patch(`/api/rooms/${id}/housekeeping`, { housekeeping_status: status });
          set((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async createGuest(input) {
        try {
          const res = await api.post('/api/guests', input);
          set((prev) => ({ ...prev, guests: [res.data.data, ...prev.guests] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Misafir eklenemedi.");
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
          return extractFormError(err, "Misafir güncellenemedi.");
        }
      },

      async addRoomService(reservationId, input) {
        try {
          const res = await api.post(`/api/reservations/${reservationId}/room-services`, input);
          const freshServices = await api.get(`/api/reservations/${reservationId}/room-services`).then((r) => r.data.data);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === reservationId ? res.data.data : r)),
            roomServices: [...prev.roomServices.filter((rs) => rs.reservationId !== reservationId), ...freshServices],
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Oda servisi eklenemedi.");
        }
      },

      async getRoomServices(reservationId) {
        try {
          const res = await api.get(`/api/reservations/${reservationId}/room-services`);
          return { ok: true, data: res.data.data };
        } catch (err: any) {
          return { ok: false, error: "Ekstre yüklenemedi." };
        }
      },

      async updateHousekeepingAdvanced(id, payload) {
        try {
          const res = await api.patch(`/api/rooms/${id}/housekeeping`, payload);
          set((prev) => ({
            ...prev,
            rooms: prev.rooms.map((r) => (r.id === id ? res.data.data : r)),
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Hata oluştu.");
        }
      },

      async deleteRoomService(roomServiceId) {
        try {
          const res = await api.delete(`/api/room-services/${roomServiceId}`);
          // res.data.data contains the updated reservation
          const updatedReservation = res.data.data;
          const freshServices = await api
            .get(`/api/reservations/${updatedReservation.id}/room-services`)
            .then((r) => r.data.data);
          set((prev) => ({
            ...prev,
            reservations: prev.reservations.map((r) => (r.id === updatedReservation.id ? updatedReservation : r)),
            roomServices: [...prev.roomServices.filter((rs) => rs.reservationId !== updatedReservation.id), ...freshServices],
          }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Silme işlemi başarısız oldu.");
        }
      },

      async createRole(input) {
        try {
          const res = await api.post('/api/roles', input);
          set((prev) => ({ ...prev, roles: [...prev.roles, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Rol oluşturulamadı.");
        }
      },

      async updateRole(id, input) {
        try {
          const res = await api.put(`/api/roles/${id}`, input);
          set((prev) => ({ ...prev, roles: prev.roles.map((r) => (r.id === id ? res.data.data : r)) }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Rol güncellenemedi.");
        }
      },

      async deleteRole(id) {
        try {
          await api.delete(`/api/roles/${id}`);
          set((prev) => ({ ...prev, roles: prev.roles.filter((r) => r.id !== id) }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Rol silinemedi.");
        }
      },

      async createEmployee(input) {
        try {
          const res = await api.post('/api/employees', input);
          set((prev) => ({ ...prev, employees: [...prev.employees, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Çalışan eklenemedi.");
        }
      },

      async updateEmployee(id, input) {
        try {
          const res = await api.put(`/api/employees/${id}`, input);
          set((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === id ? res.data.data : e)) }));
          return { ok: true };
        } catch (err: any) {
          return extractFormError(err, "Çalışan güncellenemedi.");
        }
      },
    };
  }, [set]);

  const storeApi = useMemo<StoreApi>(
    () => ({ ...actions, state, todayIso, hydrating, loading, loadError }),
    [actions, state, todayIso, hydrating, loading, loadError]
  );

  return <StoreContext.Provider value={storeApi}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
