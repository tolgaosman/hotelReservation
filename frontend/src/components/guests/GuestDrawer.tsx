"use client";

import { forwardRef, useImperativeHandle, useLayoutEffect, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { getGuestReservations } from "@/lib/selectors";
import { formatCurrency, formatDateRange } from "@/lib/format";
import type { Guest, GuestSummary } from "@/lib/types";

interface Props {
  open: boolean;
  onClose: () => void;
  guest?: GuestSummary;
}

const EMPTY: Omit<Guest, "id"> = { fullName: "", phone: "", email: "", identityNumber: "", country: "" };

/** Shrinks font-size until `text` fits its container on one line, so long values never wrap or overflow. */
function FitText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const MAX_SIZE = 12;
  const MIN_SIZE = 8;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = MAX_SIZE;
    el.style.fontSize = `${size}px`;
    while (el.scrollWidth > el.clientWidth && size > MIN_SIZE) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
  }, [text]);

  return (
    <p ref={ref} className={`whitespace-nowrap overflow-hidden ${className ?? ""}`}>
      {text}
    </p>
  );
}

interface FormHandle {
  submit(): void;
}

// Fields are initialized straight from props (useState initializer, no
// effect) and reset by remounting via `key` whenever the drawer re-opens.
const GuestForm = forwardRef<FormHandle, { guest?: GuestSummary; isCreate: boolean; onSaved: () => void }>(
  function GuestForm({ guest, isCreate, onSaved }, ref) {
    const store = useStore();
    const showToast = useToast();
    const [form, setForm] = useState<Omit<Guest, "id">>(guest ?? EMPTY);
    const [error, setError] = useState<string | null>(null);

    useImperativeHandle(ref, () => ({
      async submit() {
        if (!form.fullName.trim()) return setError("Ad soyad gereklidir.");
        if (!form.phone.trim()) return setError("Telefon gereklidir.");
        if (form.phone.replace(/\D/g, "").length < 7) return setError("Geçerli bir telefon numarası girin.");
        if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
          return setError("Geçerli bir e-posta adresi girin.");
        }
        const result = isCreate ? await store.createGuest(form) : await store.updateGuest(guest!.id, form);
        if (!result.ok) return setError(result.error);
        showToast(isCreate ? "Misafir eklendi." : "Misafir güncellendi.");
        onSaved();
      },
    }));

    return (
      <div className="space-y-4">
        <FormField label="Ad Soyad">
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
        </FormField>
        <div className="grid grid-cols-2 gap-4">
          <FormField label="Telefon">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
          <FormField label="Ülke">
            <Input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </FormField>
        </div>
        <FormField label="E-posta">
          <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </FormField>
        <FormField label="Kimlik / Pasaport No">
          <Input value={form.identityNumber} onChange={(e) => setForm({ ...form, identityNumber: e.target.value })} />
        </FormField>
        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
      </div>
    );
  }
);

export function GuestDrawer({ open, onClose, guest }: Props) {
  const store = useStore();
  const isCreate = !guest;
  const [editing, setEditing] = useState(false);
  const formRef = useRef<FormHandle>(null);

  function handleClose() {
    setEditing(false);
    onClose();
  }

  const showForm = isCreate || editing;
  const reservations = guest ? getGuestReservations(store.state, guest.id) : [];

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isCreate ? "Yeni Misafir" : guest!.fullName}
      subtitle={isCreate ? "Yeni bir misafir profili oluşturun" : guest!.country}
      footer={
        showForm ? (
          <>
            <Button variant="secondary" onClick={() => (isCreate ? handleClose() : setEditing(false))}>
              Vazgeç
            </Button>
            <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Ekle" : "Kaydet"}</Button>
          </>
        ) : (
          <Button variant="secondary" onClick={() => setEditing(true)}>
            Düzenle
          </Button>
        )
      }
    >
      {showForm ? (
        <GuestForm
          key={open ? (guest?.id ?? "new") : "closed"}
          ref={formRef}
          guest={guest}
          isCreate={isCreate}
          onSaved={() => (isCreate ? handleClose() : setEditing(false))}
        />
      ) : (
        guest && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Telefon</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{guest.phone}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">E-posta</p>
                <FitText text={guest.email} className="font-semibold text-[var(--ink)]" />
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Kimlik / Pasaport</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{guest.identityNumber}</p>
              </div>
              <div className="rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)] p-3.5 shadow-sm transition-all hover:border-[var(--muted)] hover:shadow-md">
                <p className="mb-1 text-[10px] font-bold tracking-wider text-[var(--muted)] uppercase">Toplam Harcama</p>
                <p className="break-words text-xs font-semibold text-[var(--ink)]">{formatCurrency(guest.totalSpent)}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-[var(--ink-soft)]">Geçmiş Rezervasyonlar</p>
              {reservations.length === 0 ? (
                <EmptyState title="Rezervasyon geçmişi yok" />
              ) : (
                <div className="space-y-2.5">
                  {reservations.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--line)] px-3.5 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--ink)]">Oda {r.room.number}</p>
                        <p className="text-xs text-[var(--muted)]">{formatDateRange(r.checkIn, r.checkOut)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-[var(--ink)]">{formatCurrency(r.totalAmount)}</p>
                        <StatusBadge status={r.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      )}
    </Drawer>
  );
}
