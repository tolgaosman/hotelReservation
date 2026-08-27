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
import { api } from "./api";
import { hasConflict } from "./availability";
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
  RoomType,
} from "./types";

const TODAY_ISO = new Date().toISOString().split("T")[0];

interface StoreState {
  rooms: Room[];
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
  guests: [],
  reservations: [],
  payments: [],
  roomServices: [],
  permissions: [],
  roles: [],
  employees: [],
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
    companions?: number[];
  }): Promise<FormResult>;
  updateReservation(
    id: number,
    input: { checkIn: string; checkOut: string; guestCount: number; roomId: number; companions?: number[] }
  ): Promise<FormResult>;
  confirmReservation(id: number): Promise<FormResult>;
  cancelReservation(id: number): Promise<FormResult>;
  checkIn(id: number): Promise<FormResult>;
  checkOut(id: number): Promise<FormResult>;
  addPayment(input: { reservationId: number; amount: number; method: PaymentMethod; note?: string; createdAt?: string }): Promise<FormResult>;
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
  updateHousekeeping(id: number, status: Room["housekeepingStatus"]): Promise<FormResult>;
  updateHousekeepingAdvanced(id: number, payload: Partial<Room>): Promise<FormResult>;
  createGuest(input: Omit<Guest, "id">): Promise<FormResult>;
  updateGuest(id: number, input: Omit<Guest, "id">): Promise<FormResult>;
  addRoomService(reservationId: number, input: { description: string; amount: number }): Promise<FormResult>;
  getRoomServices(reservationId: number): Promise<{ ok: true, data: import('./types').RoomService[] } | { ok: false, error: string }>;
  deleteRoomService(roomServiceId: number): Promise<FormResult>;
  createRole(input: { name: string; description: string; permissionIds: number[] }): Promise<FormResult>;
  updateRole(id: number, input: { name: string; description: string; permissionIds: number[] }): Promise<FormResult>;
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
  
  const [hydrating, setHydrating] = useState(true);

  const loadData = async () => {
    try {
      const [rooms, guests, reservations, payments, roomServices] = await Promise.all([
        api.get('/api/rooms?per_page=1000').then(res => res.data.data.items),
        api.get('/api/guests?per_page=1000').then(res => res.data.data.items),
        api.get('/api/reservations?per_page=1000').then(res => res.data.data.items),
        api.get('/api/payments?per_page=1000').then(res => res.data.data.items),
        api.get('/api/room-services?per_page=1000').then(res => res.data.data.items),
      ]);

      // Roles/employees/permissions are admin-gated on the backend — a
      // non-admin user without those permissions gets a 403, which we treat
      // as "nothing to show" rather than failing the whole app's hydration.
      const [permissions, roles, employees] = await Promise.all([
        api.get('/api/permissions').then(res => res.data.data).catch(() => []),
        api.get('/api/roles').then(res => res.data.data).catch(() => []),
        api.get('/api/employees?per_page=1000').then(res => res.data.data.items).catch(() => []),
      ]);

      dispatch({ type: "REPLACE_ALL", payload: { rooms, guests, reservations, payments, roomServices, permissions, roles, employees } });
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

      async updateHousekeeping(id, status) {
        try {
          const res = await api.patch(`/api/rooms/${id}/housekeeping`, { housekeeping_status: status });
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
          return { ok: false, error: err.response?.data?.message || "Oda servisi eklenemedi." };
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
          return { ok: false, error: err.response?.data?.message || "Hata oluştu." };
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
          return { ok: false, error: err.response?.data?.message || "Silme işlemi başarısız oldu." };
        }
      },

      async createRole(input) {
        try {
          const res = await api.post('/api/roles', input);
          set((prev) => ({ ...prev, roles: [...prev.roles, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Rol oluşturulamadı." };
        }
      },

      async updateRole(id, input) {
        try {
          const res = await api.put(`/api/roles/${id}`, input);
          set((prev) => ({ ...prev, roles: prev.roles.map((r) => (r.id === id ? res.data.data : r)) }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Rol güncellenemedi." };
        }
      },

      async deleteRole(id) {
        try {
          await api.delete(`/api/roles/${id}`);
          set((prev) => ({ ...prev, roles: prev.roles.filter((r) => r.id !== id) }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Rol silinemedi." };
        }
      },

      async createEmployee(input) {
        try {
          const res = await api.post('/api/employees', input);
          set((prev) => ({ ...prev, employees: [...prev.employees, res.data.data] }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Çalışan eklenemedi." };
        }
      },

      async updateEmployee(id, input) {
        try {
          const res = await api.put(`/api/employees/${id}`, input);
          set((prev) => ({ ...prev, employees: prev.employees.map((e) => (e.id === id ? res.data.data : e)) }));
          return { ok: true };
        } catch (err: any) {
          return { ok: false, error: err.response?.data?.message || "Çalışan güncellenemedi." };
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
