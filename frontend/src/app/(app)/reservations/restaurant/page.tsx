"use client";

import { useState, useEffect, useMemo } from "react";
import { UtensilsCrossed, Trash2, CalendarClock, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/format";
import type { RestaurantReservation } from "@/lib/types";
import { HeroBanner, type HeroBannerMetric } from "@/components/ui/hero-banner";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { EmptyState } from "@/components/ui/EmptyState";
import { matchesQuery } from "@/lib/utils";

export default function RestaurantReservationsPage() {
  const { hasPermission } = useAuth();
  const showToast = useToast();
  
  const canDelete = hasPermission("reservations.delete") || true;

  const [reservations, setReservations] = useState<RestaurantReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchReservations();
  }, []);

  const fetchReservations = async () => {
    try {
      const res = await api.get('/api/restaurant-reservations');
      setReservations(res.data);
    } catch (err: any) {
      showToast(err.response?.data?.message || "Restoran rezervasyonları yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/restaurant-reservations/${id}`);
      showToast("Rezervasyon başarıyla silindi.", "success");
      fetchReservations();
    } catch (err: any) {
      showToast(err.response?.data?.message || "Silinemedi", "error");
    }
  };

  const filteredReservations = useMemo(() => {
    const q = query.trim();
    if (q.length === 0) return reservations;
    return reservations.filter(r => matchesQuery(r.fullName, q) || matchesQuery(r.phone, q));
  }, [reservations, query]);

  const hotelGuestCount = reservations.filter((r) => r.isHotelGuest).length;
  const externalGuestCount = reservations.filter((r) => !r.isHotelGuest).length;
  const totalCollected = reservations.reduce((sum, r) => r.paymentStatus === 'pay_at_hotel' ? sum + Number(r.amount) : sum, 0);

  const metrics: HeroBannerMetric[] = [
    { label: "Otel Misafiri", value: hotelGuestCount.toString(), tone: "ok" },
    { label: "Dışarıdan", value: externalGuestCount.toString(), tone: "warn" },
    { label: "Toplam Tahsilat", value: formatCurrency(totalCollected), tone: "accent" },
  ];

  const columns: Column<RestaurantReservation>[] = useMemo(() => {
    return [
      { 
        key: "guest", 
        header: "Misafir", 
        sortValue: (r) => r.fullName.toLocaleLowerCase("tr-TR"), 
        render: (r) => (
          <div>
            <div className="font-semibold text-sm text-[var(--ink)]">{r.fullName}</div>
            {r.note && <div className="text-xs text-[var(--muted)] line-clamp-1 mt-0.5" title={r.note}>{r.note}</div>}
          </div>
        )
      },
      { 
        key: "contact", 
        header: "İletişim", 
        sortValue: (r) => r.phone, 
        render: (r) => (
          <div>
            <div className="text-sm text-[var(--ink)]">{r.phone}</div>
            {r.email && <div className="text-xs text-[var(--muted)]">{r.email}</div>}
          </div>
        ) 
      },
      { 
        key: "datetime", 
        header: "Zaman", 
        sortValue: (r) => r.date + r.time, 
        render: (r) => (
          <div>
            <div className="text-sm font-medium text-[var(--ink)] flex justify-center items-center gap-1.5">
              <CalendarClock size={14} className="text-[var(--accent)]" />
              {new Date(r.date).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" })}
            </div>
            <div className="text-xs text-[var(--muted)] mt-0.5">{r.time}</div>
          </div>
        ) 
      },
      { 
        key: "partySize", 
        header: "Kişi", 
        sortValue: (r) => r.partySize, 
        render: (r) => <span className="text-[var(--info)] font-bold">{r.partySize}</span> 
      },
      { 
        key: "guestType", 
        header: "Konaklama", 
        sortValue: (r) => r.isHotelGuest ? 1 : 0, 
        render: (r) => (
          r.isHotelGuest ? (
            <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[var(--accent)]/10 text-[var(--accent)]">
              Otel Misafiri (Res #{r.reservationId})
            </span>
          ) : (
            <span className="inline-flex px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[var(--muted)]/20 text-[var(--muted)]">
              Dışarıdan
            </span>
          )
        ) 
      },
      {
        key: "amount",
        header: "Tutar",
        sortValue: (r) => r.paymentStatus === 'waived' ? 0 : r.amount,
        render: (r) => (
          r.paymentStatus === 'waived' ? (
            <span className="text-xs font-semibold text-[var(--ok)]">Ücretsiz</span>
          ) : (
            <span className="text-sm font-bold text-[var(--ink)]">{formatCurrency(r.amount)}</span>
          )
        )
      },
      {
        key: "actions",
        header: "",
        className: "w-0 pl-0 pr-4",
        render: (r) => {
          if (!canDelete) return null;
          return (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setPendingDeleteId(r.id);
              }}
              className="rounded p-1.5 text-[var(--muted)] hover:bg-[var(--crit)] hover:text-white transition-colors"
              title="Sil"
            >
              <Trash2 size={16} />
            </button>
          );
        }
      }
    ];
  }, [canDelete]);

  if (loading) return <PageSkeleton />;

  return (
    <>
      <Topbar
        title="Restoran Rezervasyonları"
        subtitle="Müşteri uygulaması üzerinden yapılan restoran rezervasyonlarını yönetin"
      />
      
      <main className="flex-1 space-y-6 p-6 lg:p-8">
        <HeroBanner
          title="Restoran Özeti"
          subtitle="Müşteri uygulaması üzerinden yapılan restoran rezervasyonlarının güncel durumlarını ve finansal özetini inceleyin."
          metrics={metrics}
        />
        
        <Card
          hover={false}
          title="Restoran Rezervasyon Listesi"
          subtitle={`${filteredReservations.length} / ${reservations.length} rezervasyon`}
          action={
            <div className="flex items-center gap-2 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)] px-3 py-2">
              <Search size={14} className="text-[var(--muted)]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="İsim veya telefon ara"
                className="w-40 bg-transparent text-xs text-[var(--ink)] outline-none placeholder:text-[var(--muted)]"
              />
            </div>
          }
        >
          {filteredReservations.length === 0 ? (
            <EmptyState title="Eşleşen restoran rezervasyonu yok" description="Farklı bir arama terimi deneyin." />
          ) : (
            <DataTable 
              columns={columns} 
              rows={filteredReservations} 
              getRowKey={(r) => r.id} 
              onRowClick={() => {}} 
            />
          )}
        </Card>
      </main>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Rezervasyonu İptal Et"
        description="Bu restoran rezervasyonunu iptal etmek (silmek) istediğinize emin misiniz? Bu işlem geri alınamaz."
        confirmLabel="İptal Et"
        cancelLabel="Vazgeç"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId !== null) handleDelete(pendingDeleteId);
          setPendingDeleteId(null);
        }}
      />
    </>
  );
}
