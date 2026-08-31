"use client";

import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { useMemo, useState } from "react";
import { Sparkles, Brush, CheckCircle, AlertCircle, Search, Wrench, User, Star, XCircle, AlertTriangle, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import type { Room } from "@/lib/types";

export default function HousekeepingPage() {
  const { state, loading: loadingFlags, updateHousekeeping, updateHousekeepingAdvanced } = useStore();
  const { hasPermission } = useAuth();
  const canStatus = hasPermission("housekeeping.update_status");
  const canAssign = hasPermission("housekeeping.assign_staff");
  const canMaint = hasPermission("housekeeping.maintenance");
  // Only rooms + reservations (checkout-today priority) + employees
  // (cleaning-staff list) feed this page; don't wait on guests/payments/
  // roomServices/roles/permissions.
  const hydrating = loadingFlags.rooms || loadingFlags.reservations || loadingFlags.employees;
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

  // Rooms whose guest checked out today are dirty *right now* — clean those
  // before rooms that have simply sat dirty from an earlier day.
  const today = new Date().toISOString().slice(0, 10);
  const checkoutTodayRoomIds = useMemo(
    () =>
      new Set(
        state.reservations
          .filter(r => r.checkedOutAt && r.checkedOutAt.slice(0, 10) === today)
          .map(r => r.roomId)
      ),
    [state.reservations, today]
  );
  const isPriority = (r: Room) => r.isPriorityCleaning || checkoutTodayRoomIds.has(r.id);

  const rooms = useMemo(
    () =>
      state.rooms
        .filter(r => r.active)
        .filter(r => {
          if (filter === "all") return true;
          if (filter === "maintenance") return r.isMaintenance;
          return r.housekeepingStatus === filter && !r.isMaintenance;
        })
        .filter(r => r.number.toLowerCase().includes(search.toLowerCase()))
        .sort((a, b) => {
          const aPriority = isPriority(a);
          const bPriority = isPriority(b);
          if (aPriority && !bPriority) return -1;
          if (!aPriority && bPriority) return 1;
          return a.number.localeCompare(b.number);
        }),
    [state.rooms, filter, search, checkoutTodayRoomIds]
  );

  const stats = useMemo(
    () => ({
      dirty: state.rooms.filter(r => r.housekeepingStatus === "dirty" && !r.isMaintenance && r.active).length,
      cleaning: state.rooms.filter(r => r.housekeepingStatus === "cleaning" && !r.isMaintenance && r.active).length,
      clean: state.rooms.filter(r => r.housekeepingStatus === "clean" && !r.isMaintenance && r.active).length,
      maintenance: state.rooms.filter(r => r.isMaintenance && r.active).length,
    }),
    [state.rooms]
  );

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
    await handleUpdateAdvanced(maintenanceRoom, { isMaintenance: true, maintenanceNote: maintenanceNote }, `Oda ${maintenanceRoom.number} arızalı olarak işaretlendi.`);
    setMaintenanceRoom(null);
    setMaintenanceNote("");
  };

  const handleStaffSubmit = async (room: Room) => {
    await handleUpdateAdvanced(room, { assignedStaff: staffName || null }, `Oda ${room.number} personeli güncellendi.`);
    setEditingStaffId(null);
  };

  const handleFloorStaffSubmit = async (floor: string, staff: string, floorRooms: Room[]) => {
    try {
      await Promise.all(floorRooms.map(room => updateHousekeepingAdvanced(room.id, { assignedStaff: staff || null })));
      addToast(`${floor}. Kat personeli başarıyla güncellendi.`, "success");
    } catch (e) {
      addToast("Bir hata oluştu.", "error");
    }
  };

  const cleaningStaff = state.employees.filter(emp => emp.profession.toLowerCase().includes("temizlik"));

  const groupedRooms = useMemo(
    () =>
      rooms.reduce((acc, room) => {
        const floor = room.number.charAt(0);
        if (!acc[floor]) acc[floor] = [];
        acc[floor].push(room);
        return acc;
      }, {} as Record<string, Room[]>),
    [rooms]
  );

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

      {hydrating ? (
        <PageSkeleton />
      ) : (
        <>
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

              {canAssign && (
                <div className="flex items-center gap-2 text-sm bg-[var(--surface-alt)] px-3 py-1.5 rounded-[var(--radius-pill)] border border-[var(--line)] shadow-sm focus-within:border-[var(--accent)] transition-colors">
                   <User size={14} className="text-[var(--muted)]" />
                   <span className="text-[var(--muted)] font-medium">Tüm Kata Ata:</span>
                   <Select
                     className="bg-transparent border-none w-40 text-sm font-semibold text-[var(--ink)] cursor-pointer py-0 px-1 hover:bg-[var(--surface)]"
                     value=""
                     onChange={(e: any) => {
                       if (e.target.value) {
                         handleFloorStaffSubmit(floor, e.target.value, groupedRooms[floor]);
                       }
                     }}
                   >
                     <option value="" disabled>Personel seç...</option>
                     {cleaningStaff.map(emp => (
                       <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                     ))}
                   </Select>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedRooms[floor].map(room => (
                <div key={room.id} className={cn("relative rounded-xl border p-5 flex flex-col gap-4 shadow-sm hover:shadow transition-all", room.isMaintenance ? "border-[var(--ink)] bg-[var(--surface-alt)] opacity-90" : "border-[var(--line)] bg-[var(--surface)]")}>
                  
                  {/* Öncelik Badge */}
                  {room.isPriorityCleaning && !room.isMaintenance && (
                    <div className="absolute -top-3 -right-3 bg-[var(--accent)] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Star size={10} className="fill-yellow-400 text-yellow-400" />
                      Öncelikli
                    </div>
                  )}
                  {!room.isPriorityCleaning && checkoutTodayRoomIds.has(room.id) && !room.isMaintenance && (
                    <div className="absolute -top-3 -right-3 bg-[var(--crit)] text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <LogOut size={10} />
                      Bugün Çıkış
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
                      room.isMaintenance && "bg-[var(--ink)] text-[var(--surface)]",
                      !room.isMaintenance && room.housekeepingStatus === "clean" && "bg-[var(--ok-soft)] text-[var(--ok)]",
                      !room.isMaintenance && room.housekeepingStatus === "dirty" && "bg-[var(--crit-soft)] text-[var(--crit)]",
                      !room.isMaintenance && room.housekeepingStatus === "cleaning" && "bg-[var(--warn-soft)] text-[var(--warn)]",
                    )}>
                      {room.isMaintenance && <Wrench size={12} />}
                      {!room.isMaintenance && room.housekeepingStatus === "clean" && <CheckCircle size={12} />}
                      {!room.isMaintenance && room.housekeepingStatus === "dirty" && <AlertCircle size={12} />}
                      {!room.isMaintenance && room.housekeepingStatus === "cleaning" && <Brush size={12} />}
                      
                      {room.isMaintenance ? "Bakımda" : 
                       room.housekeepingStatus === "clean" ? "Temiz" : 
                       room.housekeepingStatus === "dirty" ? "Kirli" : "Temizleniyor"}
                    </div>
                  </div>

                  {/* Maintenance Note */}
                  {room.isMaintenance && room.maintenanceNote && (
                    <div className="bg-[var(--canvas)] border border-dashed border-[var(--ink)] p-3 rounded-lg text-sm text-[var(--ink)] font-medium flex items-start gap-2">
                      <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                      <p>{room.maintenanceNote}</p>
                    </div>
                  )}

                  {/* Staff Assignment */}
                  <div className="bg-[var(--canvas)] rounded-lg p-2 flex items-center justify-between border border-[var(--line)]">
                    <div className="flex items-center gap-2 text-xs text-[var(--muted)] font-semibold">
                      <User size={14} />
                      {editingStaffId === room.id ? (
                        <div className="flex items-center gap-1">
                          <Select 
                            className="bg-transparent border-none border-b border-[var(--accent)] rounded-none outline-none text-[var(--ink)] w-32 text-xs cursor-pointer py-0.5 px-1"
                            value={staffName}
                            onChange={(e: any) => {
                              const newStaffName = e.target.value;
                              setStaffName(newStaffName);
                              handleUpdateAdvanced(room, { assignedStaff: newStaffName || null }, `Oda ${room.number} personeli güncellendi.`);
                              setEditingStaffId(null);
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Escape') setEditingStaffId(null);
                            }}
                            autoFocus
                          >
                            <option value="">(Atanmadı)</option>
                            {cleaningStaff.map(emp => (
                               <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                            ))}
                          </Select>
                          <button onClick={() => setEditingStaffId(null)} className="text-[var(--muted)] hover:text-[var(--crit)]"><XCircle size={14}/></button>
                        </div>
                      ) : (
                        <span className="text-[var(--ink)]">
                          {room.assignedStaff || "Personel Atanmadı"}
                        </span>
                      )}
                    </div>
                    {editingStaffId !== room.id && canAssign && (
                      <button
                        onClick={() => { setEditingStaffId(room.id); setStaffName(room.assignedStaff || ""); }}
                        className="text-[10px] text-[var(--accent)] hover:underline font-bold uppercase"
                      >
                        {room.assignedStaff ? "Değiştir" : "Ata"}
                      </button>
                    )}
                  </div>

                  {/* Actions */}
                  {(canStatus || canMaint) && (
                    <div className="pt-2 border-t border-[var(--line)] flex flex-col gap-2">
                      {(canStatus || (room.isMaintenance && canMaint)) && (
                        <div className="flex gap-2">
                          {!room.isMaintenance && room.housekeepingStatus === "dirty" && canStatus && (
                            <button
                              onClick={() => updateStatus(room, "cleaning")}
                              disabled={updating === room.id}
                              className="flex-1 bg-orange-500 text-white hover:bg-orange-600 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Temizliğe Başla
                            </button>
                          )}
                          {!room.isMaintenance && room.housekeepingStatus === "cleaning" && canStatus && (
                            <button
                              onClick={() => updateStatus(room, "clean")}
                              disabled={updating === room.id}
                              className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Temizliği Bitir
                            </button>
                          )}
                          {!room.isMaintenance && room.housekeepingStatus === "clean" && canStatus && (
                            <button
                              onClick={() => updateStatus(room, "dirty")}
                              disabled={updating === room.id}
                              className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                              Kirli İşaretle
                            </button>
                          )}
                          {room.isMaintenance && canMaint && (
                            <button
                              onClick={() => handleUpdateAdvanced(room, { isMaintenance: false, maintenanceNote: null }, "Oda bakım modundan çıkarıldı.")}
                              disabled={updating === room.id}
                              className="flex-1 bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                              <CheckCircle size={16} /> Arıza Giderildi
                            </button>
                          )}
                        </div>
                      )}

                      {!room.isMaintenance && (canMaint || canStatus) && (
                        <div className="flex gap-2">
                          {canMaint && (
                            <button
                              onClick={() => setMaintenanceRoom(room)}
                              disabled={updating === room.id}
                              className="flex-1 border border-[var(--line)] bg-[var(--canvas)] hover:bg-[var(--surface-alt)] text-[var(--ink)] py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
                            >
                              <Wrench size={12} /> Arıza Bildir
                            </button>
                          )}
                          {canStatus && (
                            <button
                              onClick={() => handleUpdateAdvanced(room, { isPriorityCleaning: !room.isPriorityCleaning }, room.isPriorityCleaning ? "Öncelik kaldırıldı." : "Oda öncelikli olarak işaretlendi.")}
                              disabled={updating === room.id}
                              className={cn(
                                "flex-1 border py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1",
                                room.isPriorityCleaning
                                  ? "border-[var(--accent)] bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]"
                                  : "border-[var(--line)] bg-[var(--canvas)] hover:bg-[var(--surface-alt)] text-[var(--ink)]"
                              )}
                            >
                              <Star size={12} className={room.isPriorityCleaning ? "text-yellow-400 fill-yellow-400" : ""} /> Öncelikli
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
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
        </>
      )}

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

