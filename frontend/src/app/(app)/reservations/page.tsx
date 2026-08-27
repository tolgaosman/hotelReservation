"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/lib/store";
import { getReservationViews } from "@/lib/selectors";
import { ReservationsHeroBanner } from "@/components/reservations/ReservationsHeroBanner";
import { ReservationsTable } from "@/components/reservations/ReservationsTable";
import { ReservationDrawer } from "@/components/reservations/ReservationDrawer";

export default function ReservationsPage() {
  const store = useStore();
  const views = useMemo(() => getReservationViews(store.state), [store.state]);
  const totalCollected = useMemo(() => store.state.payments.reduce((sum, p) => sum + p.amount, 0), [store.state]);

  // Track the id, not the object — actions taken inside the drawer mutate the
  // store, and re-deriving the view from fresh state on every render keeps
  // the open drawer's status/badges/buttons in sync with what just happened.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedView = selectedId ? views.find((v) => v.id === selectedId) : undefined;

  return (
    <>
      <Topbar
        title="Rezervasyonlar"
        subtitle="Rezervasyonları, check-in/check-out işlemlerini ve iptalleri yönetin"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Yeni Rezervasyon
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {store.hydrating ? (
          <PageSkeleton />
        ) : (
          <>
            <ReservationsHeroBanner reservations={store.state.reservations} totalCollected={totalCollected} />
            <ReservationsTable
              reservations={views}
              onRowClick={(r) => {
                setSelectedId(r.id);
                setDetailOpen(true);
              }}
            />
          </>
        )}
      </main>

      <ReservationDrawer open={creating} onClose={() => setCreating(false)} />
      <ReservationDrawer open={detailOpen} onClose={() => setDetailOpen(false)} reservation={selectedView} />
    </>
  );
}
