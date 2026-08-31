"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState, useEffect } from "react";
import { X } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { getAvailableRooms, getPaymentsForReservation } from "@/lib/selectors";
import { api } from "@/lib/api";
import { fieldError } from "@/lib/errors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Guest, PaymentMethod, ReservationView, RoomService } from "@/lib/types";

function nightsBetween(checkIn: string, checkOut: string): number {
  return Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86400000);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const METHOD_LABEL: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

interface FormHandle {
  submit(): void;
}

// Fields are seeded straight from props via useState initializers (no
// effect) and reset by remounting the whole form via `key` whenever the
// drawer opens for a different reservation (or a fresh "create").
const ReservationForm = forwardRef<
  FormHandle,
  { reservation?: ReservationView; isCreate: boolean; todayIso: string; onSaved: () => void }
>(function ReservationForm({ reservation, isCreate, todayIso, onSaved }, ref) {
  const store = useStore();
  const [guestQuery, setGuestQuery] = useState("");
  const [guestId, setGuestId] = useState(reservation?.guestId ?? "");
  const [roomId, setRoomId] = useState(reservation?.roomId ?? "");
  const [checkIn, setCheckIn] = useState(reservation?.checkIn ?? todayIso);
  const [checkOut, setCheckOut] = useState(reservation?.checkOut ?? addDaysIso(todayIso, 1));
  const [guestCount, setGuestCount] = useState(reservation?.guestCount ?? 1);
  const [companionQuery, setCompanionQuery] = useState("");
  const [companionIds, setCompanionIds] = useState<number[]>(reservation?.companions?.map((c) => c.id) ?? []);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);

  const companionCandidates = useMemo(() => {
    const q = companionQuery.trim().toLowerCase();
    return store.state.guests
      .filter((g) => g.id !== Number(guestId) && !companionIds.includes(g.id))
      .filter((g) => q.length === 0 || g.fullName.toLowerCase().includes(q))
      .slice(0, 20);
  }, [companionQuery, store.state.guests, guestId, companionIds]);

  function addCompanion(id: number) {
    setCompanionIds((prev) => [...prev, id]);
    setCompanionQuery("");
  }

  function removeCompanion(id: number) {
    setCompanionIds((prev) => prev.filter((c) => c !== id));
  }

  useImperativeHandle(ref, () => ({
    async submit() {
      setFieldErrors(undefined);
      if (!guestId) return setError("Bir misafir seçin.");
      if (checkOut <= checkIn) return setError("Çıkış tarihi, giriş tarihinden sonra olmalı.");
      if (!roomId) return setError("Bir oda seçin.");
      if (companionIds.length + 1 > guestCount) {
        return setError("Misafir sayısı, ana misafir dahil belirtilen kişi sayısından az olamaz.");
      }
      const result = isCreate
        ? await store.createReservation({ guestId: Number(guestId), roomId: Number(roomId), checkIn, checkOut, guestCount, companions: companionIds })
        : await store.updateReservation(reservation!.id, { checkIn, checkOut, guestCount, roomId: Number(roomId), companions: companionIds });
      if (!result.ok) {
        setFieldErrors(result.fieldErrors);
        return setError(result.error);
      }
      onSaved();
    },
  }));

  const filteredGuests = useMemo(() => {
    const q = guestQuery.trim().toLowerCase();
    const list = q.length === 0 ? store.state.guests : store.state.guests.filter((g) => g.fullName.toLowerCase().includes(q));
    return list.slice(0, 40);
  }, [guestQuery, store.state.guests]);

  const availableRooms = useMemo(() => {
    if (checkOut <= checkIn) return [];
    return getAvailableRooms(checkIn, checkOut, store.state.rooms, store.state.reservations, reservation?.id);
  }, [checkIn, checkOut, store.state.rooms, store.state.reservations, reservation?.id]);

  const nights = checkOut > checkIn ? nightsBetween(checkIn, checkOut) : 0;
  const selectedRoom = store.state.rooms.find((r) => r.id === roomId) ?? reservation?.room;
  const estimatedTotal = selectedRoom ? selectedRoom.nightlyRate * nights : 0;

  return (
    <div className="space-y-4">
      {isCreate && (
        <FormField label="Misafir" error={fieldError(fieldErrors, "guestId")}>
          <Input placeholder="İsimle ara..." value={guestQuery} onChange={(e) => setGuestQuery(e.target.value)} className="mb-2" />
          <Select value={guestId} onChange={(e) => setGuestId(e.target.value)}>
            <option value="">Seçin</option>
            {filteredGuests.map((g: Guest) => (
              <option key={g.id} value={g.id}>
                {g.fullName} — {g.phone}
              </option>
            ))}
          </Select>
        </FormField>
      )}

      <div className="grid grid-cols-2 gap-4">
        <FormField label="Giriş Tarihi" error={fieldError(fieldErrors, "checkIn")}>
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </FormField>
        <FormField label="Çıkış Tarihi" error={checkOut && checkOut <= checkIn ? "Girişten sonra olmalı." : fieldError(fieldErrors, "checkOut")}>
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </FormField>
      </div>

      <FormField label={`Oda (${availableRooms.length} müsait)`} error={fieldError(fieldErrors, "roomId")}>
        <Select value={roomId} onChange={(e) => setRoomId(e.target.value)}>
          <option value="">Seçin</option>
          {reservation && !availableRooms.some((r) => r.id === reservation.roomId) && (
            <option value={reservation.roomId}>
              {reservation.room.number} — {reservation.room.type} (mevcut)
            </option>
          )}
          {availableRooms.map((r) => (
            <option key={r.id} value={r.id}>
              {r.number} — {r.type} — {formatCurrency(r.nightlyRate)}/gece
            </option>
          ))}
        </Select>
      </FormField>

      <FormField label="Misafir Sayısı" error={fieldError(fieldErrors, "guestCount")}>
        <Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
      </FormField>

      <FormField label="Diğer Misafirler (opsiyonel)" error={fieldError(fieldErrors, "companions")}>
        <Input
          placeholder="Kayıtlı misafirlerde ara..."
          value={companionQuery}
          onChange={(e) => setCompanionQuery(e.target.value)}
          className="mb-2"
        />
        {companionQuery.trim().length > 0 && (
          <div className="mb-2 max-h-32 overflow-y-auto rounded-[var(--radius-control)] border border-[var(--line)]">
            {companionCandidates.length === 0 ? (
              <p className="px-3 py-2 text-xs text-[var(--muted)]">Eşleşen misafir bulunamadı.</p>
            ) : (
              companionCandidates.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => addCompanion(g.id)}
                  className="block w-full px-3 py-2 text-left text-sm transition-colors hover:bg-[var(--surface-alt)]"
                >
                  {g.fullName} — {g.phone}
                </button>
              ))
            )}
          </div>
        )}
        {companionIds.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {companionIds.map((id) => {
              const g = store.state.guests.find((candidate) => candidate.id === id);
              if (!g) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--ink)]"
                >
                  {g.fullName}
                  <button type="button" onClick={() => removeCompanion(id)} aria-label={`${g.fullName} kaldır`} className="text-[var(--muted)] transition-colors hover:text-[var(--crit)]">
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </FormField>

      {nights > 0 && selectedRoom && (
        <div className="rounded-[var(--radius-control)] bg-[var(--accent-soft)] px-3.5 py-3 text-sm">
          <span className="text-[var(--accent-ink)]">
            {nights} gece × {formatCurrency(selectedRoom.nightlyRate)} = <span className="font-bold">{formatCurrency(estimatedTotal)}</span>
          </span>
        </div>
      )}

      {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
    </div>
  );
});

interface Props {
  open: boolean;
  onClose: () => void;
  reservation?: ReservationView;
}

export function ReservationDrawer({ open, onClose, reservation }: Props) {
  const store = useStore();
  const showToast = useToast();
  const { hasPermission } = useAuth();
  const isCreate = !reservation;
  const [editing, setEditing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [paymentDate, setPaymentDate] = useState(store.todayIso);
  const formRef = useRef<FormHandle>(null);

  const canEdit = hasPermission("reservations.edit");
  const canConfirm = hasPermission("reservations.confirm");
  const canCheckIn = hasPermission("reservations.checkin");
  const canCheckOut = hasPermission("reservations.checkout");
  const canCancel = hasPermission("reservations.cancel");
  const canPay = hasPermission("payments.create");

  const showForm = isCreate || (editing && canEdit);
  const canShowInvoice = reservation && (reservation.status === "completed" || reservation.status === "checked_in");
  const anyDetailAction = canConfirm || canCheckIn || canCheckOut || canCancel || canEdit || canShowInvoice;
  const payments = reservation ? getPaymentsForReservation(store.state, reservation.id) : [];
  
  const [roomServices, setRoomServices] = useState<RoomService[]>([]);
  const roomServicesTotal = useMemo(() => roomServices.reduce((sum, rs) => sum + rs.amount, 0), [roomServices]);

  useEffect(() => {
    if (reservation) {
      store.getRoomServices(reservation.id).then(res => {
        if (res.ok) setRoomServices(res.data);
      });
    } else {
      setRoomServices([]);
    }
  }, [reservation?.id, store]);

  function handleClose() {
    setEditing(false);
    setPaymentAmount("");
    onClose();
  }

  async function runAction(fn: () => Promise<{ ok: true } | { ok: false; error: string }>, successMessage: string) {
    const result = await fn();
    showToast(result.ok ? successMessage : result.error, result.ok ? "success" : "error");
  }

  async function submitPayment() {
    const amount = Number(paymentAmount);
    if (!reservation) return;
    if (!amount || amount <= 0) {
      showToast("Geçerli bir tutar girin.", "error");
      return;
    }
    const result = await store.addPayment({ reservationId: reservation.id, amount, method: paymentMethod, createdAt: paymentDate });
    showToast(result.ok ? "Ödeme eklendi." : result.error, result.ok ? "success" : "error");
    if (result.ok) {
      setPaymentAmount("");
      setPaymentDate(store.todayIso);
    }
  }

  async function downloadInvoice() {
    if (!reservation) return;
    try {
      const res = await api.get(`/api/reservations/${reservation.id}/invoice`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fatura-${reservation.id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (e) {
      showToast("Fatura indirilemedi.", "error");
    }
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isCreate ? "Yeni Rezervasyon" : reservation!.guest.fullName}
      subtitle={isCreate ? "Yeni bir rezervasyon oluşturun" : `Oda ${reservation!.room.number} · ${reservation!.room.type}`}
      footer={
        showForm ? (
          <>
            <Button variant="secondary" onClick={() => (isCreate ? handleClose() : setEditing(false))}>
              Vazgeç
            </Button>
            {(isCreate ? hasPermission("reservations.create") : canEdit) && (
              <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Oluştur" : "Kaydet"}</Button>
            )}
          </>
        ) : reservation && anyDetailAction ? (
          <>
            {reservation.status === "pending" && canConfirm && (
              <Button variant="secondary" onClick={() => runAction(() => store.confirmReservation(reservation!.id), "Onaylandı.")}>
                Onayla
              </Button>
            )}
            {reservation.status === "confirmed" && canCheckIn && (
              <Button onClick={() => runAction(() => store.checkIn(reservation!.id), "Check-in yapıldı.")}>Check-in</Button>
            )}
            {reservation.status === "checked_in" && canCheckOut && (
              <Button onClick={() => runAction(() => store.checkOut(reservation!.id), "Check-out yapıldı.")}>Check-out</Button>
            )}
            {canShowInvoice && (
              <Button variant="secondary" onClick={downloadInvoice}>
                Fatura İndir
              </Button>
            )}
            {(reservation.status === "pending" || reservation.status === "confirmed") && canCancel && (
              <Button variant="danger" onClick={() => runAction(() => store.cancelReservation(reservation!.id), "Rezervasyon iptal edildi.")}>
                İptal Et
              </Button>
            )}
            {(reservation.status === "pending" || reservation.status === "confirmed") && canEdit && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Düzenle
              </Button>
            )}
          </>
        ) : undefined
      }
    >
      {showForm ? (
        <ReservationForm
          key={open ? (reservation?.id ?? "new") : "closed"}
          ref={formRef}
          reservation={reservation}
          isCreate={isCreate}
          todayIso={store.todayIso}
          onSaved={() => {
            showToast(isCreate ? "Rezervasyon oluşturuldu." : "Rezervasyon güncellendi.");
            if (isCreate) handleClose();
            else setEditing(false);
          }}
        />
      ) : (
        reservation && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <StatusBadge status={reservation.status} />
              <span className="text-xs text-[var(--muted)]">Oluşturuldu: {formatDate(reservation.createdAt)}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Giriş</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{formatDate(reservation.checkIn)}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Çıkış</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{formatDate(reservation.checkOut)}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Misafir Sayısı</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{reservation.guestCount}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Telefon</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{reservation.guest.phone}</p>
              </div>
            </div>

            {reservation.companions && reservation.companions.length > 0 && (
              <div className="rounded-[var(--radius-control)] border border-[var(--line)] p-4">
                <p className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">Diğer Misafirler</p>
                <div className="flex flex-wrap gap-2">
                  {reservation.companions.map((g) => (
                    <span
                      key={g.id}
                      className="rounded-[var(--radius-pill)] bg-[var(--surface-alt)] px-3 py-1 text-xs font-medium text-[var(--ink)]"
                    >
                      {g.fullName}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-[var(--radius-control)] border border-[var(--line)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Oda Konaklama</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(reservation.totalAmount - roomServicesTotal)}</span>
              </div>
              {roomServicesTotal > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-[var(--muted)]">Oda Servisi</span>
                  <span className="font-semibold text-[var(--ink)]">{formatCurrency(roomServicesTotal)}</span>
                </div>
              )}
              <div className="mt-2 pt-2 border-t border-[var(--line)] flex items-center justify-between text-sm">
                <span className="text-[var(--ink)] font-bold">Genel Toplam</span>
                <span className="font-bold text-[var(--ink)]">{formatCurrency(reservation.totalAmount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Ödenen</span>
                <span className="font-semibold text-[var(--ok)]">{formatCurrency(reservation.paidAmount)}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Kalan Bakiye</span>
                <span className={`font-semibold ${reservation.balance > 0 ? "text-[var(--crit)]" : "text-[var(--muted)]"}`}>
                  {formatCurrency(reservation.balance)}
                </span>
              </div>
            </div>

            {canPay && reservation.balance > 0 && reservation.status !== "cancelled" && (
              <div className="space-y-2 rounded-[var(--radius-control)] bg-[var(--surface-alt)] p-4">
                <p className="text-xs font-semibold text-[var(--ink-soft)]">Ödeme Ekle</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Tutar"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-24">
                    {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABEL[m]}
                      </option>
                    ))}
                  </Select>
                  <Input type="date" value={paymentDate} max={store.todayIso} onChange={(e) => setPaymentDate(e.target.value)} className="w-40" />
                  <Button size="sm" onClick={submitPayment}>
                    Ekle
                  </Button>
                </div>
              </div>
            )}

            {roomServices.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">Oda Servisi</p>
                <div className="space-y-2">
                  {roomServices.map((rs) => (
                    <div key={rs.id} className="flex items-center justify-between text-sm border-b border-[var(--line)] last:border-b-0 pb-2 last:pb-0">
                      <span className="text-[var(--muted)]">
                        {rs.description} <br/> <span className="text-[10px]">{formatDateTime(rs.createdAt)}</span>
                      </span>
                      <span className="font-medium text-[var(--ink)]">{formatCurrency(rs.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">Ödeme Geçmişi</p>
                <div className="space-y-2">
                  {payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between text-sm">
                      <span className="text-[var(--muted)]">
                        {METHOD_LABEL[p.method]} · {formatDateTime(p.createdAt)}
                      </span>
                      <span className="font-medium text-[var(--ink)]">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}
    </Drawer>
  );
}
