"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyBreakdown } from "@/components/ui/MoneyBreakdown";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { getRoomReservations } from "@/lib/selectors";
import { formatDate, formatCurrency, formatDateRange } from "@/lib/format";
import type { Room, RoomType, RoomStatus } from "@/lib/types";

const ROOM_TYPES: RoomType[] = ["Standart", "Deluxe", "Aile Odası", "Suite", "King Suite"];
const AMENITY_OPTIONS = ["Deniz Manzarası", "Balkon", "Klima", "Mini Bar", "Jakuzi", "Wi-Fi", "Kasa"];

interface FormHandle {
  submit(): void;
  deactivate(): void;
}

// Form state is initialized straight from props (useState initializer, no
// effect) and reset by remounting via `key` whenever the drawer re-opens —
// the recommended alternative to "sync state from props in an effect".
const RoomForm = forwardRef<FormHandle, { room?: Room; isCreate: boolean; onClose: () => void }>(
  function RoomForm({ room, isCreate, onClose }, ref) {
    const store = useStore();
    const showToast = useToast();

    const [number, setNumber] = useState(room?.number ?? "");
    const [type, setType] = useState<RoomType>(room?.type ?? "Standart");
    const [capacity, setCapacity] = useState(room?.capacity ?? 2);
    const [nightlyRate, setNightlyRate] = useState(room?.nightlyRate ?? 1450);
    const [amenities, setAmenities] = useState<string[]>(room?.amenities ?? []);
    const [status, setStatus] = useState<RoomStatus>(room?.status ?? "available");
    const [error, setError] = useState<string | null>(null);

    const allReservations = room ? getRoomReservations(store.state, room.id) : [];
    const activeRes = room?.status === "occupied" 
      ? allReservations.find(r => r.status === "checked_in")
      : null;
    const pastReservations = allReservations.filter(r => r.status !== "checked_in" && r.status !== "pending");

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!number.trim()) return setError("Oda numarası gereklidir.");
        if (!Number.isInteger(capacity) || capacity < 1) return setError("Kapasite en az 1 kişi olmalıdır.");
        if (!Number.isFinite(nightlyRate) || nightlyRate <= 0) return setError("Gecelik ücret sıfırdan büyük olmalıdır.");
        const baseInput = { number: number.trim(), type, capacity, nightlyRate, amenities };
        const result = isCreate 
          ? await store.createRoom(baseInput) 
          : await store.updateRoom(room!.id, { ...baseInput, status });
        if (!result.ok) return setError(result.error);
        showToast(isCreate ? "Oda eklendi." : "Oda güncellendi.");
        onClose();
      },
      async deactivate() {
        if (!room) return;
        const result = await store.deactivateRoom(room.id);
        showToast(result.ok ? "Oda pasife alındı." : result.error, result.ok ? "success" : "error");
        if (result.ok) onClose();
      },
    }));

    function toggleAmenity(a: string) {
      setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
    }

    return (
      <div className="space-y-4">
        {activeRes && (
          <div className="border-b border-[var(--color-line)] pb-5 mb-5">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.04em] text-[var(--color-muted)] uppercase">Aktif Konaklama</p>
            <div className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface-alt)] p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-bold text-[var(--color-ink)]">{activeRes.guest.fullName}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted)]">{activeRes.guest.phone}</p>
                </div>
                <span className="rounded-[var(--radius-pill)] bg-[var(--info-soft)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--info)] uppercase">
                  Konaklamada
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-xs">
                <div>
                  <p className="mb-0.5 text-[var(--color-muted)]">Giriş</p>
                  <p className="font-medium text-[var(--color-ink)]">{formatDate(activeRes.checkIn)}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-[var(--color-muted)]">Çıkış</p>
                  <p className="font-medium text-[var(--color-ink)]">{formatDate(activeRes.checkOut)}</p>
                </div>
                <div>
                  <p className="mb-0.5 text-[var(--color-muted)]">Kişi</p>
                  <p className="font-medium text-[var(--color-ink)]">{activeRes.guestCount} Yetişkin</p>
                </div>
              </div>
            </div>
            
            <div className="mt-3 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-surface)] p-3 shadow-sm">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--color-muted)]">Toplam Tutar</span>
                <MoneyBreakdown
                  roomAmount={activeRes.roomAmount}
                  roomServiceAmount={activeRes.roomServiceAmount}
                  className="font-medium text-[var(--color-ink)]"
                />
              </div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-[var(--color-muted)]">Ödenen</span>
                <span className="font-medium text-[var(--ok)]">{formatCurrency(activeRes.paidAmount)}</span>
              </div>
              <div className="flex items-center justify-between text-sm border-t border-[var(--color-line)] pt-1.5">
                <span className="text-[var(--color-ink)] font-semibold">Kalan Bakiye (Açık Hesap)</span>
                <span className={`font-bold ${activeRes.balance > 0 ? "text-[var(--crit)]" : "text-[var(--color-muted)]"}`}>
                  {formatCurrency(activeRes.balance)}
                </span>
              </div>
            </div>
          </div>
        )}

        <FormField label="Oda Numarası">
          <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Örn. 101" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Oda Tipi">
            <Select value={type} onChange={(e) => setType(e.target.value as RoomType)}>
              {ROOM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Kapasite">
            <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} />
          </FormField>
        </div>

        {!isCreate && (
          <FormField label="Oda Durumu">
            <Select 
              value={status} 
              onChange={(e) => setStatus(e.target.value as RoomStatus)} 
              disabled={room?.status === "occupied"}
            >
              <option value="available">Müsait</option>
              <option value="maintenance">Bakımda</option>
              {room?.status === "occupied" && <option value="occupied">Dolu</option>}
            </Select>
          </FormField>
        )}

        <FormField label="Gecelik Ücret (₺)">
          <Input type="number" min={0} value={nightlyRate} onChange={(e) => setNightlyRate(Number(e.target.value))} />
        </FormField>

        <FormField label="Özellikler">
          <div className="flex flex-wrap gap-2">
            {AMENITY_OPTIONS.map((a) => (
              <button
                key={a}
                type="button"
                onClick={() => toggleAmenity(a)}
                className={`rounded-[var(--radius-pill)] border px-3 py-1.5 text-xs font-medium transition-colors ${
                  amenities.includes(a)
                    ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
                    : "border-[var(--line)] bg-[var(--surface-alt)] text-[var(--ink-soft)]"
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        </FormField>

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}

        {!isCreate && (
          <div className="mt-8 border-t border-[var(--color-line)] pt-5">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.04em] text-[var(--color-muted)] uppercase">Geçmiş Konaklamalar</p>
            {pastReservations.length === 0 ? (
              <EmptyState title="Konaklama geçmişi yok" />
            ) : (
              <div className="space-y-2.5">
                {pastReservations.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--line)] px-3.5 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--ink)]">{r.guest.fullName}</p>
                      <p className="text-xs text-[var(--muted)]">{formatDateRange(r.checkIn, r.checkOut)}</p>
                      {r.companions && r.companions.length > 0 && (
                        <p className="truncate text-xs text-[var(--muted)]">
                          + {r.companions.map((c) => c.fullName).join(", ")}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <MoneyBreakdown roomAmount={r.roomAmount} roomServiceAmount={r.roomServiceAmount} className="text-sm font-semibold text-[var(--ink)]" />
                      <StatusBadge status={r.status} className="mt-1" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

export function RoomDrawer({ open, onClose, room }: { open: boolean; onClose: () => void; room?: Room }) {
  const formRef = useRef<FormHandle>(null);
  const isCreate = !room;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Yeni Oda" : `Oda ${room!.number}`}
      subtitle={isCreate ? "Envantere yeni bir oda ekleyin" : "Oda bilgilerini düzenleyin"}
      footer={
        <>
          {!isCreate && room!.status !== "occupied" && (
            <Button variant="danger" onClick={() => formRef.current?.deactivate()} className="mr-auto">
              Pasife Al
            </Button>
          )}
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Ekle" : "Kaydet"}</Button>
        </>
      }
    >
      <RoomForm key={open ? (room?.id ?? "new") : "closed"} ref={formRef} room={room} isCreate={isCreate} onClose={onClose} />
    </Drawer>
  );
}
