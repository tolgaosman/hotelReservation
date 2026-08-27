"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { useStore } from "@/lib/store";
import { getRoomStats } from "@/lib/selectors";
import { RoomsHeroBanner } from "@/components/rooms/RoomsHeroBanner";
import { RoomsStatsGrid } from "@/components/rooms/RoomsStatsGrid";
import { RoomStatusGrid } from "@/components/rooms/RoomStatusGrid";
import { RoomsTable } from "@/components/rooms/RoomsTable";
import { RoomDrawer } from "@/components/rooms/RoomDrawer";
import type { Room } from "@/lib/types";

export default function RoomsPage() {
  const store = useStore();
  const activeRooms = useMemo(() => store.state.rooms.filter((r) => r.active), [store.state.rooms]);
  const stats = useMemo(() => getRoomStats(store.state), [store.state]);

  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const selectedRoom = selectedId ? activeRooms.find((r) => r.id === selectedId) : undefined;

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
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus size={14} /> Oda Ekle
          </Button>
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {store.hydrating ? (
          <PageSkeleton />
        ) : (
          <>
            <RoomsHeroBanner rooms={activeRooms} reservations={store.state.reservations} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <RoomStatusGrid rooms={activeRooms} onSelect={openRoom} />
              </div>
              <div className="lg:col-span-1">
                <RoomsStatsGrid stats={stats} />
              </div>
            </div>
            <RoomsTable rooms={activeRooms} onRowClick={openRoom} />
          </>
        )}
      </main>

      <RoomDrawer open={creating} onClose={() => setCreating(false)} />
      <RoomDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} room={selectedRoom} />
    </>
  );
}
