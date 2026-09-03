"use client";

import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { useState, useMemo, useEffect } from "react";
import { UtensilsCrossed, Plus, Search, Trash2, List, X, Download, Receipt } from "lucide-react";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { ReservationView, RoomService } from "@/lib/types";
import { getReservationViews } from "@/lib/selectors";

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
  const { state, loading, addRoomService, getRoomServices, deleteRoomService } = useStore();
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
  const statementTotal = useMemo(() => statement.reduce((sum, item) => sum + Number(item.amount), 0), [statement]);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

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
    return getReservationViews(state)
      .filter((r) => r.status === "checked_in")
      .filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return r.room.number.toLowerCase().includes(q) || r.guest.fullName.toLowerCase().includes(q);
      })
      .sort((a, b) => a.room.number.localeCompare(b.room.number));
  }, [state, search]);

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

    const safeStr = (str: string) => str.replace(/ç/g, 'c').replace(/Ç/g, 'C').replace(/ğ/g, 'g').replace(/Ğ/g, 'G').replace(/ı/g, 'i').replace(/İ/g, 'I').replace(/ö/g, 'o').replace(/Ö/g, 'O').replace(/ş/g, 's').replace(/Ş/g, 'S').replace(/ü/g, 'u').replace(/Ü/g, 'U');

    // Muted slate palette with a real accent (white-on-slate bands) instead of the
    // previous dark-text-on-pale-band combo, which read as flat and low-contrast.
    const cardBg = [247, 248, 250] as [number, number, number];
    const rowAlt = [239, 241, 245] as [number, number, number];
    const textColor = [30, 41, 59] as [number, number, number];
    const mutedColor = [110, 118, 138] as [number, number, number];
    const accent = [71, 85, 105] as [number, number, number];
    const hairline = [221, 224, 230] as [number, number, number];

    const roomNumber = safeStr(String(selectedReservation.room.number));

    // 1) Card background + a crisp hairline border stands in for elevation/shadow
    doc.setFillColor(...cardBg);
    doc.roundedRect(10, 10, 190, 277, 8, 8, 'F');
    doc.setDrawColor(...hairline);
    doc.setLineWidth(0.4);
    doc.roundedRect(10, 10, 190, 277, 8, 8, 'S');

    // 2) Title — room-centric: "ODA SERVISI" eyebrow, room number as the headline, "ADISYONU" subtitle
    doc.setTextColor(...mutedColor);
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("O D A   S E R V I S I", 20, 27);

    doc.setTextColor(...textColor);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text(`ODA ${roomNumber}`, 20, 42);

    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...mutedColor);
    doc.text("A D I S Y O N U", 20, 50);

    // 3) Meta info (Top Right) — muted label / bold value pairs
    const receiptNo = Math.floor(Math.random() * 90000) + 10000;
    const metaRow = (label: string, value: string, y: number) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...mutedColor);
      doc.text(label, 190, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...textColor);
      doc.text(value, 190, y + 5, { align: "right" });
    };
    metaRow("ADISYON NO", String(receiptNo), 24);
    metaRow("TARIH", new Date().toLocaleDateString('tr-TR'), 36);
    metaRow("MISAFIR", safeStr(selectedReservation.guest.fullName), 48);

    // Hairline separating the header from the table
    doc.setDrawColor(...hairline);
    doc.setLineWidth(0.3);
    doc.line(20, 58, 190, 58);

    // 4) Table
    const tableData = statement.map(item => [
      safeStr(item.description),
      "1", // Adet (default 1)
      `${Number(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`
    ]);

    const totalAmount = statement.reduce((sum, item) => sum + Number(item.amount), 0);
    const tax = totalAmount * 0.18;
    const subtotal = totalAmount - tax;

    autoTable(doc, {
      startY: 66,
      head: [['URUN ACIKLAMASI', 'ADET', 'FIYAT']],
      body: tableData,
      theme: 'plain',
      headStyles: {
        fillColor: accent,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
        valign: 'middle',
        cellPadding: 6
      },
      bodyStyles: {
        fillColor: cardBg,
        textColor: textColor,
        fontSize: 10,
        cellPadding: 6
      },
      alternateRowStyles: {
        fillColor: rowAlt
      },
      columnStyles: {
        0: { cellWidth: 100 },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 50, halign: 'right' }
      },
      margin: { left: 10, right: 10 }
    });

    const finalY = (doc as any).lastAutoTable.finalY || 66;

    // 5) Totals band — rounded to match the card's language, white-on-slate for contrast
    const totalsY = finalY + 6;
    doc.setFillColor(...accent);
    doc.roundedRect(10, totalsY, 190, 32, 4, 4, 'F');

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(255, 255, 255);
    doc.text("ARA TOPLAM", 120, totalsY + 10, { align: "right" });
    doc.text("VERGI (%18)", 120, totalsY + 18, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.text("GENEL TOPLAM", 120, totalsY + 27, { align: "right" });

    doc.setFont("helvetica", "normal");
    doc.text(`${subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 190, totalsY + 10, { align: "right" });
    doc.text(`${tax.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 190, totalsY + 18, { align: "right" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(`${totalAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL`, 190, totalsY + 27, { align: "right" });

    // 6) Footer — hairline separator, muted contact block, small closing note
    const footerY = totalsY + 44;
    doc.setDrawColor(...hairline);
    doc.setLineWidth(0.3);
    doc.line(20, footerY, 190, footerY);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...mutedColor);
    doc.text("+90 212 123 24 25", 20, footerY + 8);
    doc.text("info@oasisresort.com", 20, footerY + 13);
    doc.text("Ataturk Mah. Gazi Bulvari No: 12", 20, footerY + 18);
    doc.text("34000 Istanbul / Turkiye", 20, footerY + 23);

    doc.setFont("helvetica", "italic");
    doc.text("Tesekkur ederiz", 190, footerY + 8, { align: "right" });

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

      {/* getReservationViews reads reservations/guests/rooms/payments/
          roomServices — narrowed off the store-wide `hydrating` flag, which
          also waited on permissions/roles/employees. */}
      {loading.reservations || loading.guests || loading.rooms || loading.payments || loading.roomServices ? (
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
                    <p className="text-xs text-[var(--muted)] font-medium">Oda Servisi Hesabı</p>
                    <p className="text-lg font-bold text-[var(--ok)]">₺{res.roomServiceAmount.toLocaleString('tr-TR')}</p>
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
                      className="mt-4 w-full bg-[var(--accent)] text-white hover:bg-[var(--accent)]/90 font-bold py-2.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {submitting ? "Ekleniyor..." : "Hesaba Ekle"}
                    </button>
                  </form>
                )}

                {/* Ekstre / Adisyon */}
                <div id="print-receipt" className="mt-8 print:mt-0">
                  <div className="rounded-2xl border border-[var(--line)] overflow-hidden shadow-sm print:shadow-none print:border-none">
                    <div className="flex items-center justify-between gap-3 bg-[var(--accent)] px-5 py-4 print:border-b print:border-[var(--line)]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white">
                          <Receipt size={16} />
                        </span>
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/70">Oda Servisi</p>
                          <h4 className="text-base font-black tracking-tight text-white">Adisyon</h4>
                        </div>
                      </div>
                      <button
                        onClick={handleDownloadPDF}
                        className="flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/15 hover:text-white print:hidden"
                        title="PDF Olarak İndir"
                      >
                        <Download size={16} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-b border-[var(--line)] bg-[var(--surface-alt)] px-5 py-4 text-xs">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Oda</p>
                        <p className="font-bold text-[var(--ink)]">{selectedReservation.room.number}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Misafir</p>
                        <p className="font-bold text-[var(--ink)]">{selectedReservation.guest.fullName}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Tarih</p>
                        <p className="font-medium text-[var(--ink)]">{new Date().toLocaleDateString('tr-TR')}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">Sipariş Sayısı</p>
                        <p className="font-medium text-[var(--ink)]">{statement.length}</p>
                      </div>
                    </div>

                    {loadingStatement ? (
                      <p className="px-5 py-8 text-center text-xs text-[var(--muted)] print:hidden">Yükleniyor...</p>
                    ) : statement.length === 0 ? (
                      <div className="print:hidden">
                        <EmptyState icon={Receipt} title="Henüz bir sipariş yok" description="Bu odaya eklenen oda servisi siparişleri burada listelenecek." />
                      </div>
                    ) : (
                      <>
                        <table className="w-full text-left text-sm whitespace-nowrap">
                          <thead className="bg-[var(--surface-alt)] text-[var(--muted)] border-b border-[var(--line)]">
                            <tr>
                              <th className="px-5 py-2 font-semibold">Açıklama</th>
                              <th className="px-3 py-2 font-semibold">Saat</th>
                              <th className="px-5 py-2 font-semibold text-right">Tutar</th>
                              {canDelete && <th className="px-2 py-2 w-8 print:hidden"></th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[var(--line)]">
                            {statement.map(item => (
                              <tr key={item.id} className="hover:bg-[var(--surface-alt)]/50 transition-colors">
                                <td className="px-5 py-2.5 font-medium text-[var(--ink)]">{item.description}</td>
                                <td className="px-3 py-2.5 text-[var(--muted)] tabular-nums">{new Date(item.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="px-5 py-2.5 font-bold text-[var(--ok)] text-right tabular-nums">
                                  ₺{Number(item.amount).toLocaleString('tr-TR')}
                                </td>
                                {canDelete && (
                                  <td className="px-2 py-2.5 text-right print:hidden">
                                    <button
                                      onClick={() => setPendingDeleteId(item.id)}
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
                        <div className="flex items-center justify-between border-t border-[var(--line)] bg-[var(--surface-alt)] px-5 py-4">
                          <span className="text-xs font-bold uppercase tracking-wide text-[var(--ink)]">Toplam</span>
                          <span className="text-xl font-black tabular-nums text-[var(--accent)]">₺{statementTotal.toLocaleString('tr-TR')}</span>
                        </div>
                      </>
                    )}
                  </div>
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

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Siparişi sil"
        description="Bu siparişi silmek istediğinize emin misiniz? Tutar hesaptan düşülecektir."
        confirmLabel="Sil"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </div>
  );
}
