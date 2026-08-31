"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getGuestSummaries } from "@/lib/selectors";
import { GuestsHeroBanner } from "@/components/guests/GuestsHeroBanner";
import { GuestsTable } from "@/components/guests/GuestsTable";
import { GuestDrawer } from "@/components/guests/GuestDrawer";

export default function GuestsPage() {
  const store = useStore();
  const { hasPermission } = useAuth();
  const guests = useMemo(() => getGuestSummaries(store.state), [store.state]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedGuest = selectedId ? guests.find((g) => g.id === selectedId) : undefined;

  return (
    <>
      <Topbar
        title="Misafirler"
        subtitle="Misafir profillerini ve rezervasyon geçmişini görüntüleyin"
        action={
          hasPermission("guests.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Yeni Misafir
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {store.hydrating ? (
          <PageSkeleton />
        ) : (
          <>
            <GuestsHeroBanner guests={guests} />
            <GuestsTable
              guests={guests}
              onRowClick={(g) => {
                setSelectedId(g.id);
                setDrawerOpen(true);
              }}
            />
          </>
        )}
      </main>

      <GuestDrawer open={creating} onClose={() => setCreating(false)} />
      <GuestDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} guest={selectedGuest} />
    </>
  );
}
