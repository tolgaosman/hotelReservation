"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import { getPaymentStats, getReservationViews } from "@/lib/selectors";
import { PaymentsHeroBanner } from "@/components/payments/PaymentsHeroBanner";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentDrawer } from "@/components/payments/PaymentDrawer";
import { ReservationDrawer } from "@/components/reservations/ReservationDrawer";

export default function PaymentsPage() {
  const store = useStore();
  const stats = useMemo(() => getPaymentStats(store.state), [store.state]);
  const views = useMemo(
    () => getReservationViews(store.state).filter((r) => r.status !== "cancelled"),
    [store.state]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedView = selectedId ? views.find((v) => v.id === selectedId) : undefined;

  return (
    <>
      <Topbar
        title="Ödemeler"
        subtitle="Tahsilatları ve kalan bakiyeleri takip edin"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Ödeme Ekle
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <PaymentsHeroBanner stats={stats} />
        <PaymentsTable
          reservations={views}
          onRowClick={(r) => {
            setSelectedId(r.id);
            setDetailOpen(true);
          }}
        />
      </main>

      <PaymentDrawer open={creating} onClose={() => setCreating(false)} reservations={views} />
      <ReservationDrawer open={detailOpen} onClose={() => setDetailOpen(false)} reservation={selectedView} />
    </>
  );
}
