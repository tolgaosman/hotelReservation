"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import Link from "next/link";
import { Info } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { MoneyBreakdown } from "@/components/ui/MoneyBreakdown";
import { Tabs } from "@/components/ui/Tabs";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getRoomStayBuckets } from "@/lib/selectors";
import { fieldError } from "@/lib/errors";
import { formatDate, formatCurrency, formatDateRange } from "@/lib/format";
import type { Room, RoomStatus, ReservationView } from "@/lib/types";

interface FormHandle {
  submit(): void;
  deactivate(): void;
  activate(): void;
}

// Shared row layout for both the "Gelecek Rezervasyonlar" and "Geçmiş
// Konaklamalar" tabs — they differ only in which bucket of reservations
// and which empty-state copy they're given.
function ReservationList({ reservations, emptyTitle }: { reservations: ReservationView[]; emptyTitle: string }) {
  if (reservations.length === 0) {
    return <EmptyState title={emptyTitle} />;
  }
  return (
    <div className="space-y-2.5">
      {reservations.map((r) => (
        <div
          key={r.id}
          className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--line)] px-3.5 py-2.5"
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--ink)]">{r.guest.fullName}</p>
            <p className="text-xs text-[var(--muted)]">{formatDateRange(r.checkIn, r.checkOut)}</p>
            {r.companions && r.companions.length > 0 && (
              <p className="truncate text-xs text-[var(--muted)]">+ {r.companions.map((c) => c.fullName).join(", ")}</p>
            )}
          </div>
          <div className="text-right">
            <MoneyBreakdown roomAmount={r.roomAmount} roomServiceAmount={r.roomServiceAmount} className="text-sm font-semibold text-[var(--ink)]" />
            <StatusBadge status={r.status} className="mt-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Form state is initialized straight from props (useState initializer, no
// effect) and reset by remounting via `key` whenever the drawer re-opens —
// the recommended alternative to "sync state from props in an effect".
const RoomForm = forwardRef<FormHandle, { room?: Room; isCreate: boolean; readOnly: boolean; onClose: () => void }>(
  function RoomForm({ room, isCreate, readOnly, onClose }, ref) {
    const store = useStore();
    const showToast = useToast();
    const { hasPermission } = useAuth();

    // Only types still on offer for a *new* assignment — but if this room is
    // already on a type that's since been deactivated, that type must stay
    // selectable here so its current assignment doesn't just vanish from the
    // list out from under the form.
    const selectableTypes = store.state.roomTypes.filter((t) => t.active || t.id === room?.roomTypeId);

    const [number, setNumber] = useState(room?.number ?? "");
    const [roomTypeId, setRoomTypeId] = useState<number | null>(
      room?.roomTypeId ?? selectableTypes[0]?.id ?? null
    );
    const [status, setStatus] = useState<RoomStatus>(room?.status ?? "available");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);
    const [tab, setTab] = useState<"details" | "upcoming" | "past">("details");

    const selectedType = store.state.roomTypes.find((t) => t.id === roomTypeId);

    // Date-driven, matching the calendar page: a stay is "active" the
    // moment today falls inside its check-in/check-out range, regardless of
    // whether the front desk has actually pressed check-in yet.
    const { active: activeRes, upcoming: upcomingReservations, past: pastReservations } = room
      ? getRoomStayBuckets(store.state, room.id, store.todayIso)
      : { active: undefined, upcoming: [], past: [] };

    useImperativeHandle(ref, () => ({
      async submit() {
        setFieldErrors(undefined);
        if (!number.trim()) return setError("Oda numarası gereklidir.");
        if (!roomTypeId) return setError("Oda tipi seçilmelidir.");
        const result = isCreate
          ? await store.createRoom({ number: number.trim(), roomTypeId })
          : await store.updateRoom(room!.id, { number: number.trim(), roomTypeId, status });
        if (!result.ok) {
          setFieldErrors(result.fieldErrors);
          return setError(result.error);
        }
        showToast(isCreate ? "Oda eklendi." : "Oda güncellendi.");
        onClose();
      },
      async deactivate() {
        if (!room) return;
        const result = await store.deactivateRoom(room.id);
        showToast(result.ok ? "Oda pasife alındı." : result.error, result.ok ? "success" : "error");
        if (result.ok) onClose();
      },
      async activate() {
        if (!room) return;
        const result = await store.activateRoom(room.id);
        showToast(result.ok ? "Oda aktifleştirildi." : result.error, result.ok ? "success" : "error");
        if (result.ok) onClose();
      },
    }));

    // No room types exist yet — there's nothing to assign a room to, so show
    // the empty state instead of a form that can never validly submit.
    if (store.state.roomTypes.length === 0) {
      return (
        <div className="space-y-3">
          <EmptyState
            title="Henüz oda tipi yok"
            description="Bir oda ekleyebilmek için önce en az bir oda tipi tanımlanmalı."
          />
          {hasPermission("room_types.view") && (
            <div className="flex justify-center">
              <Link href="/rooms/types" className="text-xs font-semibold text-[var(--accent-ink)] hover:underline">
                Oda Tipleri sayfasına git
              </Link>
            </div>
          )}
        </div>
      );
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

        {!isCreate && (
          <Tabs
            value={tab}
            onChange={(id) => setTab(id as typeof tab)}
            tabs={[
              { id: "details", label: "Detaylar" },
              { id: "upcoming", label: "Gelecek Rezervasyonlar", badge: upcomingReservations.length },
              { id: "past", label: "Geçmiş Konaklamalar", badge: pastReservations.length },
            ]}
          />
        )}

        {(isCreate || tab === "details") && (
          <div className="space-y-4">
            <FormField label="Oda Numarası" error={fieldError(fieldErrors, "number")}>
              <Input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Örn. 101" disabled={readOnly} />
            </FormField>

            <FormField label="Oda Tipi" error={fieldError(fieldErrors, "roomTypeId") ?? fieldError(fieldErrors, "room_type_id")}>
              <Select
                value={roomTypeId ?? ""}
                onChange={(e) => setRoomTypeId(Number(e.target.value))}
                disabled={readOnly}
              >
                {selectableTypes.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {formatCurrency(t.nightlyRate)}/gece
                  </option>
                ))}
              </Select>
            </FormField>

            {!isCreate && (
              <FormField label="Oda Durumu">
                <Select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as RoomStatus)}
                  disabled={readOnly || room?.status === "occupied"}
                >
                  <option value="available">Müsait</option>
                  <option value="maintenance">Bakımda</option>
                  <option value="passive">Pasif</option>
                  {room?.status === "occupied" && <option value="occupied">Dolu</option>}
                </Select>
              </FormField>
            )}

            {/* Everything below is inherited from the selected room type —
                read only here by design (the user's requested workflow: pick
                a type in "Oda İşlemleri", edit its details in "Oda Tipleri"). */}
            {selectedType && (
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-4">
                <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-[var(--muted)]">
                  <Info size={13} />
                  <span>
                    Bu bilgiler oda tipinden gelir.
                    {hasPermission("room_types.view") && (
                      <>
                        {" "}
                        Değiştirmek için{" "}
                        <Link href="/rooms/types" className="font-semibold text-[var(--accent-ink)] hover:underline">
                          Oda Tipleri
                        </Link>{" "}
                        sayfasını kullanın.
                      </>
                    )}
                  </span>
                </div>
                {selectedType.images?.[0] && (
                  <div className="mb-4 aspect-video overflow-hidden rounded-md border border-[var(--line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedType.images[0]} alt={selectedType.name} className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                  <div>
                    <p className="mb-0.5 text-[var(--muted)]">Kapasite</p>
                    <p className="font-medium text-[var(--ink)]">{selectedType.capacity} Kişi</p>
                  </div>
                  <div>
                    <p className="mb-0.5 text-[var(--muted)]">Gecelik Ücret</p>
                    <p className="font-medium text-[var(--ink)]">{formatCurrency(selectedType.nightlyRate)}</p>
                  </div>
                  {selectedType.bedType && (
                    <div>
                      <p className="mb-0.5 text-[var(--muted)]">Yatak Tipi</p>
                      <p className="font-medium text-[var(--ink)]">{selectedType.bedType}</p>
                    </div>
                  )}
                  {selectedType.sizeM2 && (
                    <div>
                      <p className="mb-0.5 text-[var(--muted)]">Büyüklük</p>
                      <p className="font-medium text-[var(--ink)]">{selectedType.sizeM2} m²</p>
                    </div>
                  )}
                  {selectedType.view && (
                    <div>
                      <p className="mb-0.5 text-[var(--muted)]">Manzara</p>
                      <p className="font-medium text-[var(--ink)]">{selectedType.view}</p>
                    </div>
                  )}
                </div>
                {selectedType.amenities.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {selectedType.amenities.map((a) => (
                      <span
                        key={a}
                        className="rounded-[var(--radius-pill)] border border-[var(--line)] bg-[var(--surface)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-soft)]"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
          </div>
        )}

        {!isCreate && tab === "upcoming" && (
          <ReservationList reservations={upcomingReservations} emptyTitle="Gelecek rezervasyon yok" />
        )}

        {!isCreate && tab === "past" && (
          <ReservationList reservations={pastReservations} emptyTitle="Konaklama geçmişi yok" />
        )}
      </div>
    );
  }
);

export function RoomDrawer({ open, onClose, room }: { open: boolean; onClose: () => void; room?: Room }) {
  const { hasPermission } = useAuth();
  const store = useStore();
  const formRef = useRef<FormHandle>(null);
  const isCreate = !room;
  const canSave = (isCreate ? hasPermission("rooms.create") : hasPermission("rooms.edit")) && store.state.roomTypes.length > 0;
  const canDeactivate = hasPermission("rooms.deactivate");
  const readOnly = !canSave;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Yeni Oda" : `Oda ${room!.number}`}
      subtitle={isCreate ? "Envantere yeni bir oda ekleyin" : "Oda bilgilerini düzenleyin"}
      footer={
        <>
          {!isCreate && room!.status !== "occupied" && canDeactivate && (
            room!.status === "passive" ? (
              <Button variant="secondary" onClick={() => formRef.current?.activate()} className="mr-auto">
                Aktif Et
              </Button>
            ) : (
              <Button variant="danger" onClick={() => formRef.current?.deactivate()} className="mr-auto">
                Pasife Al
              </Button>
            )
          )}
          <Button variant="secondary" onClick={onClose}>
            {canSave ? "Vazgeç" : "Kapat"}
          </Button>
          {canSave && <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Ekle" : "Kaydet"}</Button>}
        </>
      }
    >
      <RoomForm key={open ? (room?.id ?? "new") : "closed"} ref={formRef} room={room} isCreate={isCreate} readOnly={readOnly} onClose={onClose} />
    </Drawer>
  );
}
