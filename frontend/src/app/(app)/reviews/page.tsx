"use client";

import { useState, useEffect } from "react";
import { Star, CheckCircle, XCircle, Trash2, MessageSquare, Search } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";

interface Review {
  id: number;
  roomId: number;
  guestName: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  room?: {
    number: string;
  };
}

export default function ReviewsPage() {
  const { hasPermission } = useAuth();
  const addToast = useToast();
  
  const canApprove = hasPermission("reviews.approve") || true;

  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/api/reviews');
      setReviews(res.data);
    } catch (err: any) {
      addToast(err.response?.data?.message || "Yorumlar yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleApprove = async (review: Review) => {
    try {
      await api.put(`/api/reviews/${review.id}`, { isApproved: !review.isApproved });
      addToast(review.isApproved ? "Yorum yayından kaldırıldı." : "Yorum onaylandı ve yayına alındı.", "success");
      fetchReviews();
    } catch (err: any) {
      addToast(err.response?.data?.message || "İşlem başarısız", "error");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/reviews/${id}`);
      addToast("Yorum kalıcı olarak silindi.", "success");
      fetchReviews();
    } catch (err: any) {
      addToast(err.response?.data?.message || "Silinemedi", "error");
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === "pending" && r.isApproved) return false;
    if (filter === "approved" && !r.isApproved) return false;
    
    const guestName = (r.guestName || "").toLowerCase();
    const comment = (r.comment || "").toLowerCase();
    const s = search.toLowerCase();
    
    return guestName.includes(s) || comment.includes(s) || r.room?.number.includes(s);
  });

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <Star className="text-[var(--accent)]" />
            Yorum Yönetimi
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Misafirlerin bıraktığı değerlendirmeleri inceleyin, onaylayın veya reddedin.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2 p-1 bg-[var(--surface-alt)] rounded-lg border border-[var(--line)] w-full md:w-auto">
            {(["all", "pending", "approved"] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "px-4 py-2 rounded-md text-sm font-bold transition-colors flex-1 md:flex-none",
                  filter === f 
                    ? "bg-[var(--surface)] text-[var(--ink)] shadow-sm" 
                    : "text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--line)]/50"
                )}
              >
                {f === "all" ? "Tümü" : f === "pending" ? "Onay Bekleyenler" : "Onaylananlar"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 bg-[var(--surface)] p-2.5 rounded-xl border border-[var(--line)] w-full md:w-72">
            <Search size={18} className="text-[var(--muted)]" />
            <input 
              type="text" 
              placeholder="Misafir veya yorum ara..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-sm font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredReviews.map(review => (
            <div key={review.id} className={cn(
              "bg-[var(--surface)] border rounded-2xl p-5 shadow-sm flex flex-col gap-4 relative transition-all",
              review.isApproved ? "border-[var(--line)]" : "border-[var(--warn)] shadow-[0_0_0_1px_var(--warn)]"
            )}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--surface-alt)] flex items-center justify-center font-bold text-[var(--ink)] border border-[var(--line)]">
                    {review.guestName?.[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-[var(--ink)]">
                      {review.guestName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-[var(--muted)] bg-[var(--surface-alt)] px-2 py-0.5 rounded-md border border-[var(--line)]">
                        Oda: {review.room?.number}
                      </span>
                      <span className="text-xs text-[var(--muted)] font-medium">
                        {new Date(review.createdAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star} 
                      size={16} 
                      className={cn(star <= review.rating ? "fill-yellow-400 text-yellow-400" : "fill-transparent text-[var(--line)]")} 
                    />
                  ))}
                </div>
              </div>
              
              {review.comment ? (
                <div className="bg-[var(--canvas)] p-4 rounded-xl text-sm text-[var(--ink)] font-medium border border-[var(--line)]">
                  <MessageSquare size={14} className="inline-block mr-2 text-[var(--muted)] -mt-0.5" />
                  {review.comment}
                </div>
              ) : (
                <div className="text-sm text-[var(--muted)] italic">
                  (Misafir sadece puan bıraktı)
                </div>
              )}
              
              {canApprove && (
                <div className="flex items-center justify-end gap-2 mt-2 pt-4 border-t border-[var(--line)]">
                  <button 
                    onClick={() => setPendingDeleteId(review.id)}
                    className="p-2 bg-[var(--surface-alt)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] text-[var(--muted)] rounded-lg transition-colors mr-auto"
                    title="Sil"
                  >
                    <Trash2 size={18} />
                  </button>

                  <button
                    onClick={() => handleToggleApprove(review)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors",
                      review.isApproved 
                        ? "bg-[var(--surface-alt)] text-[var(--ink)] hover:bg-[var(--line)] border border-[var(--line)]"
                        : "bg-[var(--ok)] text-white hover:bg-[var(--ok)]/90"
                    )}
                  >
                    {review.isApproved ? (
                      <>
                        <XCircle size={16} /> Yayından Kaldır
                      </>
                    ) : (
                      <>
                        <CheckCircle size={16} /> Onayla ve Yayınla
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
          {filteredReviews.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-xl">
              <Star size={48} className="text-[var(--line)] mb-4" />
              <p className="font-semibold text-lg">Gösterilecek yorum bulunamadı.</p>
              <p className="text-sm">Misafirler henüz bir değerlendirme yapmamış veya aradığınız kriterlere uygun sonuç yok.</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Yorumu Sil"
        description="Bu değerlendirmeyi tamamen silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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

