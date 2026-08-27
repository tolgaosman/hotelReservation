"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { StatusBadge } from "@/components/ui/status-badge";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { getAvailableRooms, getPaymentsForReservation } from "@/lib/selectors";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { Guest, PaymentMethod, ReservationView } from "@/lib/types";

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
  const [error, setError] = useState<string | null>(null);

  useImperativeHandle(ref, () => ({
    submit() {
      if (!guestId) return setError("Bir misafir seçin.");
      if (!roomId) return setError("Bir oda seçin.");
      const result = isCreate
        ? store.createReservation({ guestId, roomId, checkIn, checkOut, guestCount })
        : store.updateReservation(reservation!.id, { checkIn, checkOut, guestCount, roomId });
      if (!result.ok) return setError(result.error);
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
        <FormField label="Misafir">
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
        <FormField label="Giriş Tarihi">
          <Input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
        </FormField>
        <FormField label="Çıkış Tarihi">
          <Input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} />
        </FormField>
      </div>

      <FormField label={`Oda (${availableRooms.length} müsait)`}>
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

      <FormField label="Misafir Sayısı">
        <Input type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))} />
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
  const isCreate = !reservation;
  const [editing, setEditing] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const formRef = useRef<FormHandle>(null);

  const showForm = isCreate || editing;
  const payments = reservation ? getPaymentsForReservation(store.state, reservation.id) : [];

  function handleClose() {
    setEditing(false);
    setPaymentAmount("");
    onClose();
  }

  function runAction(fn: () => { ok: true } | { ok: false; error: string }, successMessage: string) {
    const result = fn();
    showToast(result.ok ? successMessage : result.error, result.ok ? "success" : "error");
  }

  function submitPayment() {
    const amount = Number(paymentAmount);
    if (!reservation) return;
    if (!amount || amount <= 0) {
      showToast("Geçerli bir tutar girin.", "error");
      return;
    }
    const result = store.addPayment({ reservationId: reservation.id, amount, method: paymentMethod });
    showToast(result.ok ? "Ödeme eklendi." : result.error, result.ok ? "success" : "error");
    if (result.ok) setPaymentAmount("");
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
            <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Oluştur" : "Kaydet"}</Button>
          </>
        ) : (
          <>
            {reservation!.status === "pending" && (
              <Button variant="secondary" onClick={() => runAction(() => store.confirmReservation(reservation!.id), "Onaylandı.")}>
                Onayla
              </Button>
            )}
            {reservation!.status === "confirmed" && (
              <Button onClick={() => runAction(() => store.checkIn(reservation!.id), "Check-in yapıldı.")}>Check-in</Button>
            )}
            {reservation!.status === "checked_in" && (
              <Button onClick={() => runAction(() => store.checkOut(reservation!.id), "Check-out yapıldı.")}>Check-out</Button>
            )}
            {(reservation!.status === "pending" || reservation!.status === "confirmed") && (
              <Button variant="danger" onClick={() => runAction(() => store.cancelReservation(reservation!.id), "Rezervasyon iptal edildi.")}>
                İptal Et
              </Button>
            )}
            {(reservation!.status === "pending" || reservation!.status === "confirmed") && (
              <Button variant="ghost" onClick={() => setEditing(true)}>
                Düzenle
              </Button>
            )}
          </>
        )
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

            <div className="rounded-[var(--radius-control)] border border-[var(--line)] p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">Toplam Tutar</span>
                <span className="font-semibold text-[var(--ink)]">{formatCurrency(reservation.totalAmount)}</span>
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

            {reservation.balance > 0 && reservation.status !== "cancelled" && (
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
                  <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)} className="w-28">
                    {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                      <option key={m} value={m}>
                        {METHOD_LABEL[m]}
                      </option>
                    ))}
                  </Select>
                  <Button size="sm" onClick={submitPayment}>
                    Ekle
                  </Button>
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
