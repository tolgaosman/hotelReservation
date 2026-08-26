"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { useStore } from "@/lib/store";
import { getGuestSummaries } from "@/lib/selectors";
import { GuestsHeroBanner } from "@/components/guests/GuestsHeroBanner";
import { GuestsTable } from "@/components/guests/GuestsTable";
import { GuestDrawer } from "@/components/guests/GuestDrawer";

export default function GuestsPage() {
  const store = useStore();
  const guests = useMemo(() => getGuestSummaries(store.state), [store.state]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedGuest = selectedId ? guests.find((g) => g.id === selectedId) : undefined;

  return (
    <>
      <Topbar
        title="Misafirler"
        subtitle="Misafir profillerini ve rezervasyon geçmişini görüntüleyin"
        action={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Yeni Misafir
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <GuestsHeroBanner guests={guests} />
        <GuestsTable
          guests={guests}
          onRowClick={(g) => {
            setSelectedId(g.id);
            setDrawerOpen(true);
          }}
        />
      </main>

      <GuestDrawer open={creating} onClose={() => setCreating(false)} />
      <GuestDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} guest={selectedGuest} />
    </>
  );
}
