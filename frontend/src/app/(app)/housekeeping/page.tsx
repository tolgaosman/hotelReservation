"use client";

import { useStore } from "@/lib/store";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Sparkles, Brush, CheckCircle, AlertCircle, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/lib/types";

export default function HousekeepingPage() {
  const { state, dispatch } = useStore();
  const { addToast } = useToast();
  const [filter, setFilter] = useState<"all" | "dirty" | "cleaning">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);

  const rooms = state.rooms
    .filter(r => r.active)
    .filter(r => {
      if (filter === "all") return true;
      return r.housekeepingStatus === filter;
    })
    .filter(r => r.number.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.number.localeCompare(b.number));

  const stats = {
    dirty: state.rooms.filter(r => r.housekeepingStatus === "dirty" && r.active).length,
    cleaning: state.rooms.filter(r => r.housekeepingStatus === "cleaning" && r.active).length,
    clean: state.rooms.filter(r => r.housekeepingStatus === "clean" && r.active).length,
  };

  const updateStatus = async (room: Room, status: "clean" | "dirty" | "cleaning") => {
    setUpdating(room.id);
    try {
      const res = await api.patch(`/api/rooms/${room.id}/housekeeping`, {
        housekeeping_status: status
      });
      dispatch({ type: "UPDATE_ROOM", payload: res.data.data });
      addToast(`Oda ${room.number} durumu güncellendi.`, "success");
    } catch (e) {
      addToast("Güncelleme başarısız.", "error");
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <Sparkles className="text-[var(--accent)]" />
            Temizlik (Housekeeping)
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Odaların temizlik durumlarını buradan yönetebilirsiniz.
          </p>
        </div>
      </div>

      {/* Stats / Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <button 
          onClick={() => setFilter("all")}
          className={cn("p-4 rounded-xl border flex flex-col gap-1 transition-all", filter === "all" ? "border-[var(--ink)] bg-[var(--surface-alt)] shadow-sm" : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]/50")}
        >
          <span className="text-sm font-semibold text-[var(--muted)]">Tüm Odalar</span>
          <span className="text-2xl font-black text-[var(--ink)]">{state.rooms.filter(r=>r.active).length}</span>
        </button>
        <button 
          onClick={() => setFilter("dirty")}
          className={cn("p-4 rounded-xl border flex flex-col gap-1 transition-all", filter === "dirty" ? "border-[var(--crit)] bg-[var(--crit-soft)] shadow-sm" : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]/50")}
        >
          <span className="text-sm font-semibold text-[var(--crit)]">Kirli / Temizlenecek</span>
          <span className="text-2xl font-black text-[var(--crit)]">{stats.dirty}</span>
        </button>
        <button 
          onClick={() => setFilter("cleaning")}
          className={cn("p-4 rounded-xl border flex flex-col gap-1 transition-all", filter === "cleaning" ? "border-[var(--warn)] bg-[var(--warn-soft)] shadow-sm" : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]/50")}
        >
          <span className="text-sm font-semibold text-[var(--warn)]">Temizlik Aşamasında</span>
          <span className="text-2xl font-black text-[var(--warn)]">{stats.cleaning}</span>
        </button>
        <div className="p-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] flex flex-col gap-2 justify-center">
          <div className="flex items-center gap-2 bg-[var(--canvas)] p-2 rounded-lg border border-[var(--line)]">
            <Search size={16} className="text-[var(--muted)]" />
            <input 
              type="text" 
              placeholder="Oda ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map(room => (
          <div key={room.id} className="relative rounded-xl border border-[var(--line)] bg-[var(--surface)] p-5 flex flex-col gap-4 shadow-sm hover:shadow transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-3xl font-black tracking-tighter text-[var(--ink)]">{room.number}</span>
                <p className="text-xs font-semibold text-[var(--muted)] mt-1">{room.type}</p>
              </div>
              
              {/* Status Badge */}
              <div className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                room.housekeepingStatus === "clean" && "bg-[var(--ok-soft)] text-[var(--ok)]",
                room.housekeepingStatus === "dirty" && "bg-[var(--crit-soft)] text-[var(--crit)]",
                room.housekeepingStatus === "cleaning" && "bg-[var(--warn-soft)] text-[var(--warn)]",
              )}>
                {room.housekeepingStatus === "clean" && <CheckCircle size={12} />}
                {room.housekeepingStatus === "dirty" && <AlertCircle size={12} />}
                {room.housekeepingStatus === "cleaning" && <Brush size={12} />}
                {room.housekeepingStatus === "clean" ? "Temiz" : room.housekeepingStatus === "dirty" ? "Kirli" : "Temizleniyor"}
              </div>
            </div>

            <div className="pt-2 border-t border-[var(--line)] flex gap-2">
              {room.housekeepingStatus === "dirty" && (
                <button 
                  onClick={() => updateStatus(room, "cleaning")}
                  disabled={updating === room.id}
                  className="flex-1 bg-[var(--warn)] text-[var(--warn-ink)] hover:bg-[var(--warn-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Temizliğe Başla
                </button>
              )}
              {room.housekeepingStatus === "cleaning" && (
                <button 
                  onClick={() => updateStatus(room, "clean")}
                  disabled={updating === room.id}
                  className="flex-1 bg-[var(--ok)] text-[var(--ok-ink)] hover:bg-[var(--ok-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Temizliği Bitir
                </button>
              )}
              {room.housekeepingStatus === "clean" && (
                <button 
                  onClick={() => updateStatus(room, "dirty")}
                  disabled={updating === room.id}
                  className="flex-1 bg-[var(--surface-alt)] text-[var(--ink)] hover:bg-[var(--line)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                >
                  Kirli Olarak İşaretle
                </button>
              )}
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--muted)]">
            Kriterlere uygun oda bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}
