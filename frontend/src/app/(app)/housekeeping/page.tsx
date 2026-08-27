"use client";

import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { useState } from "react";
import { Sparkles, Brush, CheckCircle, AlertCircle, Search, Wrench, User, Star, XCircle, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Room } from "@/lib/types";

export default function HousekeepingPage() {
  const { state, updateHousekeeping, updateHousekeepingAdvanced } = useStore();
  const addToast = useToast();
  const [filter, setFilter] = useState<"all" | "dirty" | "cleaning" | "maintenance">("all");
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<number | null>(null);
  
  // State for inline editing staff
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [staffName, setStaffName] = useState("");
  
  // State for maintenance note modal
  const [maintenanceRoom, setMaintenanceRoom] = useState<Room | null>(null);
  const [maintenanceNote, setMaintenanceNote] = useState("");

  const rooms = state.rooms
    .filter(r => r.active)
    .filter(r => {
      if (filter === "all") return true;
      if (filter === "maintenance") return r.is_maintenance;
      return r.housekeepingStatus === filter && !r.is_maintenance;
    })
    .filter(r => r.number.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (a.is_priority_cleaning && !b.is_priority_cleaning) return -1;
      if (!a.is_priority_cleaning && b.is_priority_cleaning) return 1;
      return a.number.localeCompare(b.number);
    });

  const stats = {
    dirty: state.rooms.filter(r => r.housekeepingStatus === "dirty" && !r.is_maintenance && r.active).length,
    cleaning: state.rooms.filter(r => r.housekeepingStatus === "cleaning" && !r.is_maintenance && r.active).length,
    clean: state.rooms.filter(r => r.housekeepingStatus === "clean" && !r.is_maintenance && r.active).length,
    maintenance: state.rooms.filter(r => r.is_maintenance && r.active).length,
  };

  const updateStatus = async (room: Room, status: "clean" | "dirty" | "cleaning") => {
    setUpdating(room.id);
    const result = await updateHousekeeping(room.id, status);
    if (result.ok) {
      addToast(`Oda ${room.number} durumu güncellendi.`, "success");
    } else {
      addToast(result.error, "error");
    }
    setUpdating(null);
  };

  const handleUpdateAdvanced = async (room: Room, payload: Partial<Room>, successMsg: string) => {
    setUpdating(room.id);
    const result = await updateHousekeepingAdvanced(room.id, payload);
    if (result.ok) {
      addToast(successMsg, "success");
    } else {
      addToast(result.error, "error");
    }
    setUpdating(null);
  };

  const handleMaintenanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!maintenanceRoom) return;
    await handleUpdateAdvanced(maintenanceRoom, { is_maintenance: true, maintenance_note: maintenanceNote }, `Oda ${maintenanceRoom.number} arızalı olarak işaretlendi.`);
    setMaintenanceRoom(null);
    setMaintenanceNote("");
  };

  const handleStaffSubmit = async (room: Room) => {
    await handleUpdateAdvanced(room, { assigned_staff: staffName || null }, `Oda ${room.number} personeli güncellendi.`);
    setEditingStaffId(null);
  };

  const handleFloorStaffSubmit = async (floor: string, staff: string, floorRooms: Room[]) => {
    try {
      await Promise.all(floorRooms.map(room => updateHousekeepingAdvanced(room.id, { assigned_staff: staff || null })));
      addToast(`${floor}. Kat personeli başarıyla güncellendi.`, "success");
    } catch (e) {
      addToast("Bir hata oluştu.", "error");
    }
  };

  const groupedRooms = rooms.reduce((acc, room) => {
    const floor = room.number.charAt(0);
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {} as Record<string, Room[]>);

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
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
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
        <button 
          onClick={() => setFilter("maintenance")}
          className={cn("p-4 rounded-xl border flex flex-col gap-1 transition-all", filter === "maintenance" ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--surface)] shadow-sm" : "border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-alt)]/50")}
        >
          <span className={cn("text-sm font-semibold", filter === "maintenance" ? "text-[var(--surface)]/80" : "text-[var(--ink)]")}>Arızalı / Bakımda</span>
          <span className="text-2xl font-black">{stats.maintenance}</span>
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
      <div className="flex flex-col gap-10">
        {Object.keys(groupedRooms).sort().map((floor) => (
          <div key={floor}>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[var(--line)]">
              <h2 className="text-xl font-bold text-[var(--ink)]">{floor}. Kat Odaları</h2>
              
              <div className="flex items-center gap-2 text-sm bg-[var(--surface-alt)] px-3 py-1.5 rounded-[var(--radius-pill)] border border-[var(--line)] shadow-sm focus-within:border-[var(--accent)] transition-colors">
                 <User size={14} className="text-[var(--muted)]" />
                 <span className="text-[var(--muted)] font-medium">Tüm Kata Ata:</span>
                 <input 
                   type="text" 
                   placeholder="Personel adı + Enter" 
                   className="bg-transparent outline-none w-36 text-sm font-semibold text-[var(--ink)] placeholder:font-medium"
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       handleFloorStaffSubmit(floor, e.currentTarget.value.trim(), groupedRooms[floor]);
                       e.currentTarget.blur();
                     }
                   }}
                 />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedRooms[floor].map(room => (
                <div key={room.id} className={cn("relative rounded-xl border p-5 flex flex-col gap-4 shadow-sm hover:shadow transition-all", room.is_maintenance ? "border-[var(--ink)] bg-[var(--surface-alt)] opacity-90" : "border-[var(--line)] bg-[var(--surface)]")}>
                  
                  {/* Öncelik Badge */}
                  {room.is_priority_cleaning && !room.is_maintenance && (
                    <div className="absolute -top-3 -right-3 bg-[var(--crit)] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Star size={10} className="fill-white" />
                      Öncelikli
                    </div>
                  )}

                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-3xl font-black tracking-tighter text-[var(--ink)]">{room.number}</span>
                      <p className="text-xs font-semibold text-[var(--muted)] mt-1">{room.type}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <div className={cn(
                      "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
                      room.is_maintenance && "bg-[var(--ink)] text-[var(--surface)]",
                      !room.is_maintenance && room.housekeepingStatus === "clean" && "bg-[var(--ok-soft)] text-[var(--ok)]",
                      !room.is_maintenance && room.housekeepingStatus === "dirty" && "bg-[var(--crit-soft)] text-[var(--crit)]",
                      !room.is_maintenance && room.housekeepingStatus === "cleaning" && "bg-[var(--warn-soft)] text-[var(--warn)]",
                    )}>
                      {room.is_maintenance && <Wrench size={12} />}
                      {!room.is_maintenance && room.housekeepingStatus === "clean" && <CheckCircle size={12} />}
                      {!room.is_maintenance && room.housekeepingStatus === "dirty" && <AlertCircle size={12} />}
                      {!room.is_maintenance && room.housekeepingStatus === "cleaning" && <Brush size={12} />}
                      
                      {room.is_maintenance ? "Bakımda" : 
                       room.housekeepingStatus === "clean" ? "Temiz" : 
                       room.housekeepingStatus === "dirty" ? "Kirli" : "Temizleniyor"}
                    </div>
                  </div>

                  {/* Maintenance Note */}
                  {room.is_maintenance && room.maintenance_note && (
                    <div className="bg-[var(--canvas)] border border-dashed border-[var(--ink)] p-3 rounded-lg text-sm text-[var(--ink)] font-medium flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{room.maintenance_note}</p>
                    </div>
                  )}

                  {/* Staff Assignment */}
                  <div className="bg-[var(--canvas)] rounded-lg p-2 flex items-center justify-between border border-[var(--line)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-semibold">
                      <User size={14} />
                      {editingStaffId === room.id ? (
                        <div className="flex items-center gap-1">
                          <input 
                            type="text" 
                            className="bg-transparent border-b border-[var(--accent)] outline-none text-[var(--ink)] w-24"
                            placeholder="Personel adı"
                            value={staffName}
                            onChange={e => setStaffName(e.target.value)}
                            autoFocus
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleStaffSubmit(room);
                              if (e.key === 'Escape') setEditingStaffId(null);
                            }}
                          />
                          <button onClick={() => handleStaffSubmit(room)} className="text-[var(--ok)]"><CheckCircle size={14}/></button>
                        </div>
                      ) : (
                        <span className="text-[var(--ink)]">
                          {room.assigned_staff || "Personel Atanmadı"}
                        </span>
                      )}
                    </div>
                    {editingStaffId !== room.id && (
                      <button 
                        onClick={() => { setEditingStaffId(room.id); setStaffName(room.assigned_staff || ""); }}
                        className="text-[10px] text-[var(--accent)] hover:underline font-bold uppercase"
                      >
                        {room.assigned_staff ? "Değiştir" : "Ata"}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[var(--line)] flex flex-col gap-2">
                    <div className="flex gap-2">
                      {!room.is_maintenance && room.housekeepingStatus === "dirty" && (
                        <button 
                          onClick={() => updateStatus(room, "cleaning")}
                          disabled={updating === room.id}
                          className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          Temizliğe Başla
                        </button>
                      )}
                      {!room.is_maintenance && room.housekeepingStatus === "cleaning" && (
                        <button 
                          onClick={() => updateStatus(room, "clean")}
                          disabled={updating === room.id}
                          className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          Temizliği Bitir
                        </button>
                      )}
                      {!room.is_maintenance && room.housekeepingStatus === "clean" && (
                        <button 
                          onClick={() => updateStatus(room, "dirty")}
                          disabled={updating === room.id}
                          className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                        >
                          Kirli İşaretle
                        </button>
                      )}
                      {room.is_maintenance && (
                        <button 
                          onClick={() => handleUpdateAdvanced(room, { is_maintenance: false, maintenance_note: null }, "Oda bakım modundan çıkarıldı.")}
                          disabled={updating === room.id}
                          className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle size={16} /> Arıza Giderildi
                        </button>
                      )}
                    </div>
                    
                    {!room.is_maintenance && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setMaintenanceRoom(room)}
                          disabled={updating === room.id}
                          className="flex-1 border border-[var(--line)] bg-[var(--canvas)] hover:bg-[var(--surface-alt)] text-[var(--ink)] py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                        >
                          <Wrench size={12} /> Arıza Bildir
                        </button>
                        <button
                          onClick={() => handleUpdateAdvanced(room, { is_priority_cleaning: !room.is_priority_cleaning }, room.is_priority_cleaning ? "Öncelik kaldırıldı." : "Oda öncelikli olarak işaretlendi.")}
                          disabled={updating === room.id}
                          className={cn(
                            "flex-1 border py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1",
                            room.is_priority_cleaning 
                              ? "border-[var(--crit)] bg-[var(--crit-soft)] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white"
                              : "border-[var(--line)] bg-[var(--canvas)] hover:bg-[var(--surface-alt)] text-[var(--ink)]"
                          )}
                        >
                          <Star size={12} className={room.is_priority_cleaning ? "fill-current" : ""} /> Öncelikli
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
        {rooms.length === 0 && (
          <div className="col-span-full py-12 text-center text-[var(--muted)]">
            Kriterlere uygun oda bulunamadı.
          </div>
        )}
      </div>

      {/* Maintenance Modal */}
      {maintenanceRoom && (
        <div className="fixed inset-0 bg-[var(--ink)]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] w-full max-w-md rounded-2xl p-6 shadow-xl border border-[var(--line)]">
            <h3 className="text-lg font-bold flex items-center gap-2 text-[var(--ink)] mb-4">
              <Wrench size={20} className="text-[var(--accent)]" /> 
              {maintenanceRoom.number} Numaralı Odada Arıza Bildir
            </h3>
            <form onSubmit={handleMaintenanceSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold text-[var(--ink)] mb-2">Arıza/Bakım Notu</label>
                <textarea 
                  required
                  rows={3}
                  placeholder="Örn: Klima su damlatıyor..."
                  value={maintenanceNote}
                  onChange={e => setMaintenanceNote(e.target.value)}
                  className="w-full bg-[var(--canvas)] border border-[var(--line)] rounded-lg p-3 text-sm outline-none focus:border-[var(--accent)] resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => { setMaintenanceRoom(null); setMaintenanceNote(""); }}
                  className="flex-1 border border-[var(--line)] hover:bg-[var(--surface-alt)] py-2.5 rounded-lg font-bold text-sm"
                >
                  İptal
                </button>
                <button 
                  type="submit" 
                  className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2.5 rounded-lg font-bold text-sm"
                >
                  Arızalı İşaretle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
