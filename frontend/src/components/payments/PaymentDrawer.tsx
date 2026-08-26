"use client";

import { useMemo, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/format";
import type { PaymentMethod, ReservationView } from "@/lib/types";

const METHOD_LABEL: Record<PaymentMethod, string> = { cash: "Nakit", card: "Kart", transfer: "Havale" };

export function PaymentDrawer({
  open,
  onClose,
  reservations,
}: {
  open: boolean;
  onClose: () => void;
  reservations: ReservationView[];
}) {
  const store = useStore();
  const showToast = useToast();

  const payable = useMemo(() => reservations.filter((r) => r.balance > 0), [reservations]);
  const [reservationId, setReservationId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [error, setError] = useState<string | null>(null);

  const selected = payable.find((r) => r.id === reservationId);

  function submit() {
    if (!selected) return setError("Bir rezervasyon seçin.");
    const value = Number(amount);
    if (!value || value <= 0) return setError("Geçerli bir tutar girin.");
    const result = store.addPayment({ reservationId: selected.id, amount: value, method });
    if (!result.ok) return setError(result.error);
    showToast("Ödeme eklendi.");
    setReservationId("");
    setAmount("");
    setError(null);
    onClose();
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Ödeme Ekle"
      subtitle="Bakiyesi olan bir rezervasyon seçin"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={submit}>Ekle</Button>
        </>
      }
    >
      <div className="space-y-4">
        <FormField label={`Rezervasyon (${payable.length} bakiyesi olan)`}>
          <Select value={reservationId} onChange={(e) => setReservationId(e.target.value)}>
            <option value="">Seçin</option>
            {payable.map((r) => (
              <option key={r.id} value={r.id}>
                {r.guest.fullName} — Oda {r.room.number} — Kalan {formatCurrency(r.balance)}
              </option>
            ))}
          </Select>
        </FormField>

        {selected && (
          <div className="rounded-[var(--radius-control)] bg-[var(--surface-alt)] px-3.5 py-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--muted)]">Toplam</span>
              <span className="font-medium text-[var(--ink)]">{formatCurrency(selected.totalAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[var(--muted)]">Ödenen</span>
              <span className="font-medium text-[var(--ink)]">{formatCurrency(selected.paidAmount)}</span>
            </div>
            <div className="mt-1 flex justify-between">
              <span className="text-[var(--muted)]">Kalan Bakiye</span>
              <span className="font-semibold text-[var(--crit)]">{formatCurrency(selected.balance)}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Tutar (₺)">
            <Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
          </FormField>
          <FormField label="Yöntem">
            <Select value={method} onChange={(e) => setMethod(e.target.value as PaymentMethod)}>
              {(Object.keys(METHOD_LABEL) as PaymentMethod[]).map((m) => (
                <option key={m} value={m}>
                  {METHOD_LABEL[m]}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
      </div>
    </Drawer>
  );
}
