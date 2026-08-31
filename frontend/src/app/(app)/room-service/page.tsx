"use client";

import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { useState, useMemo, useEffect } from "react";
import { UtensilsCrossed, Plus, Search, Trash2, List, X, Download } from "lucide-react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import type { ReservationView, RoomService } from "@/lib/types";

const MENU_DATA = [
  {
    category: "İçecekler",
    items: [
      { id: "cay", name: "Çay", price: 25 },
      { id: "kahve", name: "Türk Kahvesi", price: 60 },
      { id: "su", name: "Su (0.5L)", price: 20 },
      { id: "cola", name: "Kutu Kola", price: 50 },
      { id: "ayran", name: "Ayran", price: 30 },
    ]
  },
  {
    category: "Yiyecekler",
    items: [
      { id: "tost", name: "Karışık Tost", price: 150 },
      { id: "burger", name: "Hamburger Menü", price: 280 },
      { id: "pizza", name: "Karışık Pizza", price: 320 },
      { id: "makarna", name: "Spagetti Bolonez", price: 220 },
    ]
  },
  {
    category: "Tatlılar",
    items: [
      { id: "sutlac", name: "Fırın Sütlaç", price: 100 },
      { id: "brownie", name: "Brownie", price: 130 },
      { id: "cheesecake", name: "Cheesecake", price: 150 },
    ]
  }
];

export default function RoomServicePage() {
  const { state, hydrating, addRoomService, getRoomServices, deleteRoomService } = useStore();
  const { hasPermission } = useAuth();
  const canCreate = hasPermission("room_service.create");
  const canDelete = hasPermission("room_service.delete");
  const addToast = useToast();
  
  const [search, setSearch] = useState("");
  const [selectedReservation, setSelectedReservation] = useState<ReservationView | null>(null);
  
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [statement, setStatement] = useState<RoomService[]>([]);
  const [loadingStatement, setLoadingStatement] = useState(false);

  // Menu Modal State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(MENU_DATA[0].category);
  const [selectedMenuItems, setSelectedMenuItems] = useState<{id: string, name: string, price: number, quantity: number}[]>([]);

  useEffect(() => {
    if (!selectedReservation) {
      setStatement([]);
      return;
    }
    
    let active = true;
    setLoadingStatement(true);
    getRoomServices(selectedReservation.id).then(res => {
      if (active && res.ok) {
        setStatement(res.data);
      }
      if (active) setLoadingStatement(false);
    });
    
    return () => { active = false; };
  }, [selectedReservation, getRoomServices]);

  // Sadece konaklayan (checked_in) odaları listele
  const activeReservations = useMemo(() => {
    return state.reservations
      .filter((r) => r.status === "checked_in")
      .map((r) => {
        const guest = state.guests.find((g) => g.id === r.guestId)!;
        const room = state.rooms.find((rm) => rm.id === r.roomId)!;
        const paidAmount = state.payments.filter(p => p.reservationId === r.id).reduce((sum, p) => sum + p.amount, 0);
        
        return {
          ...r,
          guest,
          room,
          paidAmount,
          balance: r.totalAmount - paidAmount,
        } as ReservationView;
      })
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.room.number.toLowerCase().includes(q) || r.guest.fullName.toLowerCase().includes(q);
      })
      .sort((a, b) => a.room.number.localeCompare(b.room.number));
  }, [state.reservations, state.guests, state.rooms, state.payments, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReservation) return;
    
    setSubmitting(true);
    const result = await addRoomService(selectedReservation.id, {
      description,
      amount: parseFloat(amount),
    });
    
    setSubmitting(false);
    
    if (result.ok) {
      addToast("Oda servisi başarıyla eklendi ve hesaba yansıtıldı.", "success");
      setDescription("");
      setAmount("");
      
      // Güncel ekstreyi tekrar çek
      getRoomServices(selectedReservation.id).then(res => {
        if (res.ok) setStatement(res.data);
      });
    } else {
      addToast(result.error, "error");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Bu siparişi silmek istediğinize emin misiniz? Tutar hesaptan düşülecektir.")) return;
    const result = await deleteRoomService(id);
    if (result.ok) {
      addToast("Sipariş iptal edildi ve hesaptan düşüldü.", "success");
      if (selectedReservation) {
        getRoomServices(selectedReservation.id).then(res => {
          if (res.ok) setStatement(res.data);
        });
      }
    } else {
      addToast(result.error, "error");
    }
  };

  const updateItemQuantity = (item: {id: string, name: string, price: number}, delta: number) => {
    setSelectedMenuItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        const newQuantity = existing.quantity + delta;
        if (newQuantity <= 0) {
          return prev.filter(i => i.id !== item.id);
        }
        return prev.map(i => i.id === item.id ? { ...i, quantity: newQuantity } : i);
      } else {
        if (delta > 0) {
          return [...prev, { ...item, quantity: delta }];
        }
        return prev;
      }
    });
  };

  const confirmMenuSelection = async () => {
    if (selectedMenuItems.length === 0 || !selectedReservation) return;
    
    setSubmitting(true);
    let allOk = true;

    const promises = selectedMenuItems.map(item => {
      const desc = item.quantity > 1 ? `${item.quantity}x ${item.name}` : item.name;
      const total = item.price * item.quantity;
      return addRoomService(selectedReservation.id, {
        description: desc,
        amount: total,
      });
    });

    const results = await Promise.all(promises);
    results.forEach(res => {
      if (!res.ok) allOk = false;
    });

    setSubmitting(false);

    if (allOk) {
      addToast("Menü siparişi başarıyla eklendi.", "success");
    } else {
      addToast("Bazı ürünler eklenirken hata oluştu.", "error");
    }

    getRoomServices(selectedReservation.id).then(res => {
      if (res.ok) setStatement(res.data);
    });
    
    setIsMenuOpen(false);
    setSelectedMenuItems([]);
  };

  const handleDownloadPDF = async () => {
    if (!selectedReservation) return;

    // jsPDF/jsPDF-autotable are heavy and only needed for this one action —
    // load them on demand instead of shipping them in the page's initial bundle.
    const [{ jsPDF }, { default: autoTable }] = await Promise.all([
      import("jspdf"),
      import("jspdf-autotable"),
    ]);

    const doc = new jsPDF();
    
    // Font settings (using standard fonts to avoid loading custom ttf for simplicity, tr-TR chars might not render perfectly in base fonts, but it's okay for numbers/ascii)
    // English mapping for common TR chars just in case:
    const safeStr = (str: string) => str.replace(/ç/g, 'c').replace(/Ç/g, 'C').replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ü/g, 'u').replace(/Ü/g, 'U');

    doc.setFontSize(18);
    doc.text(`Oda ${selectedReservation.room.number} - Adisyon`, 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Misafir: ${safeStr(selectedReservation.guest.fullName)}`, 14, 30);
    doc.text(`Tarih: ${new Date().toLocaleDateString('tr-TR')} ${new Date().toLocaleTimeString('tr-TR')}`, 14, 36);

    const tableData = statement.map(item => [
      safeStr(item.description),
      new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
      `TL ${Number(item.amount).toLocaleString('tr-TR')}`
    ]);

    const totalAmount = statement.reduce((sum, item) => sum + Number(item.amount), 0);

    tableData.push([
      "TOPLAM",
      "",
      `TL ${totalAmount.toLocaleString('tr-TR')}`
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Urun/Hizmet', 'Saat', 'Tutar']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138] }, // Navy blue
      styles: { font: 'helvetica' }
    });

    doc.save(`Adisyon_Oda_${selectedReservation.room.number}.pdf`);
  };

  return (
    <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <UtensilsCrossed className="text-[var(--accent)]" />
            Oda Servisi
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Konaklayan misafirlerin oda servisi harcamalarını buradan girebilirsiniz.
          </p>
        </div>
      </div>

      {hydrating ? (
        <PageSkeleton />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 print:block">
        {/* Odalar Listesi */}
        <div className="lg:col-span-2 flex flex-col gap-4 print:hidden">
          <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
            <Search size={18} className="text-[var(--muted)]" />
            <input 
              type="text" 
              placeholder="Oda no veya misafir adı ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeReservations.map((res) => (
              <div 
                key={res.id} 
                onClick={() => setSelectedReservation(res)}
                className={`relative rounded-xl border p-5 flex flex-col gap-3 cursor-pointer transition-all ${
                  selectedReservation?.id === res.id 
                    ? "border-[var(--accent)] bg-[var(--accent)]/5 shadow-md ring-1 ring-[var(--accent)]" 
                    : "border-[var(--line)] bg-[var(--surface)] hover:border-[var(--muted)]"
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-2xl font-black tracking-tighter text-[var(--accent)]">{res.room.number}</span>
                    <p className="text-sm font-semibold text-[var(--muted)] mt-0.5">{res.guest.fullName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[var(--muted)] font-medium">Güncel Hesap</p>
                    <p className="text-lg font-bold text-[var(--ok)]">₺{res.balance.toLocaleString('tr-TR')}</p>
                  </div>
                </div>
              </div>
            ))}
            {activeReservations.length === 0 && (
              <div className="col-span-full py-12 text-center text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-xl">
                Otelde şu an konaklayan misafir bulunmuyor veya aramaya uygun sonuç yok.
              </div>
            )}
          </div>
        </div>

        {/* Sipariş Ekleme Formu */}
        <div className="lg:col-span-1 print:w-full print:block">
          <div className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-6 shadow-sm print:shadow-none print:border-none print:p-0">
            <h3 className="text-lg font-bold text-[var(--ink)] mb-4 flex items-center gap-2 print:hidden">
              {canCreate && <Plus size={18} className="text-[var(--accent)]"/>}
              {canCreate ? "Yeni Sipariş Ekle" : "Oda Ekstresi"}
            </h3>

            {!selectedReservation ? (
              <div className="py-8 text-center text-sm font-medium text-[var(--muted)] bg-[var(--surface-alt)] rounded-xl border border-dashed border-[var(--line)]">
                {canCreate
                  ? "Lütfen sipariş girmek için yandaki listeden bir oda seçin."
                  : "Detayları görüntülemek için yandaki listeden bir oda seçin."}
              </div>
            ) : (
              <>
                {canCreate && (
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4 print:hidden">
                    <div className="p-3 bg-[var(--surface-alt)] rounded-lg mb-2">
                      <p className="text-xs text-[var(--muted)] font-semibold uppercase tracking-wider mb-1">Seçili Oda</p>
                      <p className="text-[var(--ink)] font-bold text-[var(--accent)]">{selectedReservation.room.number} <span className="text-[var(--ink)]">- {selectedReservation.guest.fullName}</span></p>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-[var(--ink)]">Ürün / Hizmet Açıklaması</label>
                        <button
                          type="button"
                          onClick={() => setIsMenuOpen(true)}
                          className="text-xs font-bold text-[var(--accent)] hover:underline flex items-center gap-1 bg-[var(--accent)]/10 px-2 py-1 rounded-md"
                        >
                          <List size={12}/> Menüden Seç
                        </button>
                      </div>
                      <input
                        type="text"
                        required
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Örn: Karışık Tost ve Ayran"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-[var(--ink)]">Tutar (₺)</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="mt-4 w-full bg-[var(--ink)] text-[var(--surface)] hover:bg-[var(--ink)]/90 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Ekleniyor..." : "Hesaba Ekle"}
                    </button>
                  </form>
                )}

                {/* Ekstre Listesi */}
                <div id="print-receipt" className="mt-8 border-t border-[var(--line)] pt-6 print:mt-0 print:border-none print:pt-0">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-[var(--ink)] flex items-center gap-2">
                      <span>Oda Ekstresi (Oda Servisi)</span>
                      <span className="text-xs text-[var(--muted)] font-normal">{statement.length} sipariş</span>
                    </h4>
                    <button 
                      onClick={handleDownloadPDF}
                      className="text-[var(--muted)] hover:text-[var(--ink)]"
                      title="PDF Olarak İndir"
                    >
                      <Download size={16} />
                    </button>
                  </div>
                  
                  {loadingStatement ? (
                    <p className="text-xs text-[var(--muted)] print:hidden">Yükleniyor...</p>
                  ) : statement.length === 0 ? (
                    <p className="text-xs text-[var(--muted)] print:hidden">Henüz bir sipariş bulunmuyor.</p>
                  ) : (
                    <div className="flex flex-col rounded-xl border border-[var(--line)] overflow-hidden">
                      <div className="bg-[var(--canvas)]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-[var(--surface-alt)] text-[var(--muted)] border-b border-[var(--line)]">
                            <tr>
                              <th className="px-3 py-2 font-semibold">Açıklama</th>
                              <th className="px-3 py-2 font-semibold text-right">Tutar</th>
                              {canDelete && <th className="px-2 py-2 w-8 print:hidden"></th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            {statement.map(item => (
                              <tr key={item.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                                <td className="px-3 py-2 text-[var(--ink)]">
                                  <p className="font-medium">{item.description}</p>
                                  <p className="text-[10px] text-[var(--muted)]">{new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                </td>
                                <td className="px-3 py-2 font-bold text-[var(--ok)] text-right">
                                  ₺{Number(item.amount).toLocaleString('tr-TR')}
                                </td>
                                {canDelete && (
                                  <td className="px-2 py-2 text-right print:hidden">
                                    <button
                                      onClick={() => handleDelete(item.id)}
                                      className="text-[var(--muted)] hover:text-[var(--crit)] transition-colors p-1"
                                      title="İptal Et / Sil"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {/* Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:hidden">
          <div className="bg-[var(--surface)] w-full max-w-2xl max-h-[80vh] flex flex-col rounded-2xl shadow-xl overflow-hidden border border-[var(--line)]">
            <div className="p-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-alt)]">
              <h3 className="text-lg font-bold text-[var(--ink)] flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-[var(--accent)]"/> 
                Oda Servisi Menüsü
              </h3>
              <button onClick={() => { setIsMenuOpen(false); setSelectedMenuItems([]); }} className="text-[var(--muted)] hover:text-[var(--ink)]">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex flex-1 overflow-hidden">
              {/* Categories Sidebar */}
              <div className="w-1/3 bg-[var(--surface-alt)] border-r border-[var(--line)] flex flex-col">
                {MENU_DATA.map(category => (
                  <button 
                    key={category.category}
                    onClick={() => setActiveCategory(category.category)}
                    className={`text-left px-4 py-3 text-sm font-semibold transition-colors border-l-4 ${
                      activeCategory === category.category 
                        ? "bg-[var(--surface)] border-[var(--accent)] text-[var(--accent)]" 
                        : "border-transparent text-[var(--muted)] hover:bg-[var(--line)]"
                    }`}
                  >
                    {category.category}
                  </button>
                ))}
              </div>
              
              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-[var(--canvas)]">
                <div className="grid grid-cols-1 gap-2">
                  {MENU_DATA.find(c => c.category === activeCategory)?.items.map(item => {
                    const selected = selectedMenuItems.find(i => i.id === item.id);
                    const quantity = selected ? selected.quantity : 0;
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          quantity > 0 ? "bg-[var(--accent)]/10 border-[var(--accent)]" : "bg-[var(--surface)] border-[var(--line)] hover:border-[var(--muted)]"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-sm text-[var(--ink)]">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold text-[var(--ok)] text-sm">₺{item.price.toLocaleString('tr-TR')}</span>
                          <div className="flex items-center gap-1.5">
                            {quantity > 0 ? (
                              <>
                                <button type="button" onClick={() => updateItemQuantity(item, -1)} className="w-7 h-7 rounded-md bg-[var(--surface)] border border-[var(--line)] text-[var(--ink)] hover:bg-[var(--line)] flex items-center justify-center font-bold shadow-sm">-</button>
                                <span className="text-sm font-bold w-5 text-center">{quantity}</span>
                                <button type="button" onClick={() => updateItemQuantity(item, 1)} className="w-7 h-7 rounded-md bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] flex items-center justify-center font-bold shadow-sm">+</button>
                              </>
                            ) : (
                              <button type="button" onClick={() => updateItemQuantity(item, 1)} className="px-3 py-1 text-xs rounded-md border border-[var(--line)] bg-[var(--surface-alt)] hover:bg-[var(--line)] font-bold text-[var(--ink)] shadow-sm transition-colors">
                                Ekle
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
              <div className="text-sm font-semibold text-[var(--ink)]">
                Seçilen Ürün Çeşidi: <span className="text-[var(--accent)]">{selectedMenuItems.length}</span>
                {selectedMenuItems.length > 0 && (
                  <span className="ml-2 text-[var(--muted)] text-xs">
                    (Toplam ₺{selectedMenuItems.reduce((s, i) => s + (i.price * i.quantity), 0).toLocaleString('tr-TR')})
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setIsMenuOpen(false); setSelectedMenuItems([]); }}
                  className="px-4 py-2 rounded-lg text-sm font-bold border border-[var(--line)] hover:bg-[var(--surface-alt)]"
                >
                  İptal
                </button>
                <button 
                  onClick={confirmMenuSelection}
                  disabled={selectedMenuItems.length === 0 || submitting}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--ink)] text-[var(--surface)] hover:bg-[var(--ink)]/90 disabled:opacity-50"
                >
                  {submitting ? "Ekleniyor..." : "Siparişi Onayla"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
