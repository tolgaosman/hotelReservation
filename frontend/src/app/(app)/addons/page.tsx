"use client";

import { useState, useEffect } from "react";
import { Sparkles, Plus, Search, Trash2, Edit } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface Addon {
  id: number;
  name: string;
  description: string | null;
  price: number;
  icon: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function AddonsPage() {
  const { hasPermission } = useAuth();
  const addToast = useToast();
  
  const canCreate = hasPermission("addons.create") || true; // TODO: strict permission
  const canEdit = hasPermission("addons.edit") || true;
  const canDelete = hasPermission("addons.delete") || true;

  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState<Addon | null>(null);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    isActive: true,
  });

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const res = await api.get('/api/addons');
      setAddons(res.data);
    } catch (err: any) {
      addToast(err.response?.data?.message || "Ekstra hizmetler yüklenemedi", "error");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingAddon(null);
    setFormData({ name: "", description: "", price: "", isActive: true });
    setIsModalOpen(true);
  };

  const openEditModal = (addon: Addon) => {
    setEditingAddon(addon);
    setFormData({
      name: addon.name,
      description: addon.description || "",
      price: addon.price.toString(),
      isActive: addon.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingAddon) {
        await api.put(`/api/addons/${editingAddon.id}`, formData);
        addToast("Hizmet başarıyla güncellendi.", "success");
      } else {
        await api.post('/api/addons', formData);
        addToast("Hizmet başarıyla eklendi.", "success");
      }
      setIsModalOpen(false);
      fetchAddons();
    } catch (err: any) {
      addToast(err.response?.data?.message || "Bir hata oluştu", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/api/addons/${id}`);
      addToast("Hizmet silindi.", "success");
      fetchAddons();
    } catch (err: any) {
      addToast(err.response?.data?.message || "Silinemedi", "error");
    }
  };

  const filteredAddons = addons.filter(a => 
    a.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <PageSkeleton />;

  return (
    <div className="flex flex-1 flex-col p-6 max-w-7xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <Sparkles className="text-[var(--accent)]" />
            Ekstra Hizmetler
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Misafirlere sunulacak ek paketleri, transferleri ve hizmetleri yönetin.
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2 font-bold text-white transition-colors hover:bg-[var(--accent-hover)]"
          >
            <Plus size={18} />
            Yeni Hizmet
          </button>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-[var(--surface)] p-3 rounded-xl border border-[var(--line)]">
          <Search size={18} className="text-[var(--muted)]" />
          <input 
            type="text" 
            placeholder="Hizmet adı ara..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-sm font-medium"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAddons.map(addon => (
            <div key={addon.id} className="bg-[var(--surface)] border border-[var(--line)] rounded-2xl p-5 shadow-sm flex flex-col gap-3 relative group">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-[var(--ink)] text-lg">{addon.name}</h3>
                  <p className="text-sm text-[var(--muted)] line-clamp-2 mt-1 min-h-[40px]">{addon.description || "Açıklama yok"}</p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {canEdit && (
                    <button onClick={() => openEditModal(addon)} className="p-2 bg-[var(--surface-alt)] hover:bg-[var(--line)] text-[var(--ink)] rounded-lg transition-colors">
                      <Edit size={16} />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => setPendingDeleteId(addon.id)} className="p-2 bg-[var(--surface-alt)] hover:bg-[var(--crit)]/10 hover:text-[var(--crit)] text-[var(--muted)] rounded-lg transition-colors">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--line)]">
                <span className="font-black text-xl text-[var(--accent)]">₺{Number(addon.price).toLocaleString('tr-TR')}</span>
                <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${addon.isActive ? 'bg-[var(--ok)]/10 text-[var(--ok)]' : 'bg-[var(--muted)]/20 text-[var(--muted)]'}`}>
                  {addon.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
            </div>
          ))}
          {filteredAddons.length === 0 && (
            <div className="col-span-full py-12 text-center text-[var(--muted)] bg-[var(--surface)] border border-[var(--line)] rounded-xl">
              Gösterilecek ekstra hizmet bulunamadı.
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[var(--ink)]/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[var(--surface)] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-[var(--line)]">
            <div className="p-5 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface-alt)]">
              <h3 className="text-lg font-bold text-[var(--ink)]">{editingAddon ? "Hizmeti Düzenle" : "Yeni Hizmet Ekle"}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--muted)] hover:text-[var(--ink)]">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--ink)]">Hizmet Adı</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-semibold text-[var(--ink)]">Açıklama</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                />
              </div>

              <div className="flex gap-4">
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-sm font-semibold text-[var(--ink)]">Fiyat (₺)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full rounded-lg border border-[var(--line)] bg-[var(--canvas)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                  />
                </div>
                
                <div className="flex flex-col justify-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={formData.isActive}
                      onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                      className="rounded border-[var(--line)] text-[var(--accent)] focus:ring-[var(--accent)]"
                    />
                    <span className="text-sm font-semibold text-[var(--ink)]">Aktif Satışta</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-2 justify-end mt-4 pt-4 border-t border-[var(--line)]">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-bold border border-[var(--line)] hover:bg-[var(--surface-alt)]"
                >
                  İptal
                </button>
                <button 
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg text-sm font-bold bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] disabled:opacity-50"
                >
                  {submitting ? "Kaydediliyor..." : "Kaydet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDeleteId !== null}
        title="Hizmeti Sil"
        description="Bu ekstra hizmeti silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
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
