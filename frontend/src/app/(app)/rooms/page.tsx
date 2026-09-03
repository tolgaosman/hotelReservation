"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { getRoomStats } from "@/lib/selectors";
import { RoomsHeroBanner } from "@/components/rooms/RoomsHeroBanner";
import { RoomsStatsGrid } from "@/components/rooms/RoomsStatsGrid";
import { RoomStatusGrid } from "@/components/rooms/RoomStatusGrid";
import { RoomsTable } from "@/components/rooms/RoomsTable";
import { RoomDrawer } from "@/components/rooms/RoomDrawer";
import type { Room } from "@/lib/types";

export default function RoomsPage() {
  const store = useStore();
  const { hasPermission } = useAuth();
  // Stats / hero banner reflect operational rooms only; the status grid and
  // table below list everything (including passive) so a deactivated room
  // stays visible — in its own red tile — and reactivatable, not hidden.
  const activeRooms = useMemo(() => store.state.rooms.filter((r) => r.status !== "passive"), [store.state.rooms]);
  const stats = useMemo(() => getRoomStats(store.state), [store.state]);
  // Only rooms + reservations feed this page (getRoomStats, RoomsHeroBanner);
  // roomTypes is added because RoomDrawer's type picker needs it — don't
  // wait on guests/payments/roomServices/roles/permissions/employees.
  const loading = store.loading.rooms || store.loading.reservations || store.loading.roomTypes;

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedRoom = selectedId ? store.state.rooms.find((r) => r.id === selectedId) : undefined;

  function openRoom(room: Room) {
    setSelectedId(room.id);
    setDrawerOpen(true);
  }

  return (
    <>
      <Topbar
        title="Odalar"
        subtitle="Oda envanterini ve müsaitlik durumunu yönetin"
        action={
          hasPermission("rooms.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Oda Ekle
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {loading ? (
          <PageSkeleton />
        ) : (
          <>
            <RoomsHeroBanner rooms={activeRooms} reservations={store.state.reservations} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RoomStatusGrid rooms={store.state.rooms} reservations={store.state.reservations} onSelect={openRoom} />
              </div>
              <div className="lg:col-span-1">
                <RoomsStatsGrid stats={stats} />
              </div>
            </div>
            <RoomsTable rooms={store.state.rooms} reservations={store.state.reservations} roomTypes={store.state.roomTypes} onRowClick={openRoom} />
          </>
        )}
      </main>

      <RoomDrawer open={creating} onClose={() => setCreating(false)} />
      <RoomDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} room={selectedRoom} />
    </>
  );
}
