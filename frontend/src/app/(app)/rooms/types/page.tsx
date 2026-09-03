"use client";

import { useState } from "react";
import { Plus, BedDouble } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { RoomTypeCard } from "@/components/room-types/RoomTypeCard";
import { RoomTypeDrawer } from "@/components/room-types/RoomTypeDrawer";
import type { RoomTypeDefinition } from "@/lib/types";

export default function RoomTypesPage() {
  const store = useStore();
  const showToast = useToast();
  const { hasPermission } = useAuth();
  const roomTypes = store.state.roomTypes;
  // Only room types feed this page's cards — don't wait on the heavier
  // rooms/reservations/payments fetches the rest of the app needs.
  const loading = store.loading.roomTypes;

  const [selected, setSelected] = useState<RoomTypeDefinition | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleDelete(roomType: RoomTypeDefinition, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`"${roomType.name}" oda tipini silmek istediğinize emin misiniz?`)) return;
    const result = await store.deleteRoomType(roomType.id);
    showToast(result.ok ? "Oda tipi silindi." : result.error, result.ok ? "success" : "error");
  }

  function openRoomType(roomType: RoomTypeDefinition) {
    setSelected(roomType);
    setDrawerOpen(true);
  }

  return (
    <>
      <Topbar
        title="Oda Tipleri"
        subtitle="Oda tiplerini, kapasitelerini ve özelliklerini yönetin"
        action={
          hasPermission("room_types.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Oda Tipi Ekle
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-8 p-6 lg:p-8">
        {loading ? (
          <PageSkeleton />
        ) : roomTypes.length === 0 ? (
          <EmptyState
            icon={BedDouble}
            title="Henüz oda tipi yok"
            description={
              hasPermission("room_types.create")
                ? "İlk oda tipini ekleyerek başlayın; odalar tüm detaylarını buradan alır."
                : "Görüntülenecek oda tipi kaydı bulunmuyor."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {roomTypes.map((roomType) => (
              <RoomTypeCard
                key={roomType.id}
                roomType={roomType}
                onOpen={() => openRoomType(roomType)}
                onDelete={(e) => handleDelete(roomType, e)}
                canDelete={hasPermission("room_types.delete")}
              />
            ))}
          </div>
        )}
      </main>

      <RoomTypeDrawer open={creating} onClose={() => setCreating(false)} />
      <RoomTypeDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} roomType={selected ?? undefined} />
    </>
  );
}
