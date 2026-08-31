"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Users, Lock, Trash2, Utensils, Calculator, ConciergeBell, Sparkles, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { RoleDrawer } from "@/components/roles/RoleDrawer";
import type { Role } from "@/lib/types";

function getRoleIcon(name: string) {
  const n = name.toLocaleLowerCase("tr-TR");
  if (n.includes("garson")) return Utensils;
  if (n.includes("muhasebe")) return Calculator;
  if (n.includes("resepsiyon")) return ConciergeBell;
  if (n.includes("temizlik")) return Sparkles;
  if (n.includes("admin")) return ShieldAlert;
  return ShieldCheck;
}

export default function RolesPage() {
  const store = useStore();
  const showToast = useToast();
  const { hasPermission } = useAuth();
  const roles = store.state.roles;
  // Only roles + permissions feed this page (the cards + RoleDrawer's
  // permission checkboxes); don't wait on the far heavier
  // rooms/guests/reservations/payments/roomServices fetches.
  const loading = store.loading.roles || store.loading.permissions;

  const [selected, setSelected] = useState<Role | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleDelete(role: Role, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm(`"${role.name}" rolünü silmek istediğinize emin misiniz?`)) return;
    const result = await store.deleteRole(role.id);
    showToast(result.ok ? "Rol silindi." : result.error, result.ok ? "success" : "error");
  }

  const adminRole: Role = {
    id: 0,
    name: "Admin",
    slug: "admin",
    description: "Sistem yöneticisi. Oteldeki tüm yetkilere, sayfalara ve verilere sınırsız erişime sahiptir.",
    isSystem: true,
    permissionIds: store.state.permissions.map((p) => p.id),
    employeeCount: 1,
  };

  const displayRoles = [adminRole, ...roles];

  return (
    <>
      <Topbar
        title="Roller"
        subtitle="Meslek rollerini ve sayfa/izin yetkilerini yönetin"
        action={
          hasPermission("roles.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Yeni Rol
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {loading ? (
          <PageSkeleton />
        ) : displayRoles.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="Henüz rol tanımlanmamış"
            description={
              hasPermission("roles.create")
                ? "Bir meslek için rol oluşturarak izinleri yönetmeye başlayın."
                : "Görüntülenecek rol kaydı bulunmuyor."
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {displayRoles.map((role) => (
              <div
                key={role.id}
                onClick={() => {
                  if (role.id === 0) return;
                  setSelected(role);
                  setDrawerOpen(true);
                }}
                className={role.id === 0 
                  ? "flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)]/50 p-5 shadow-sm opacity-80" 
                  : "group flex cursor-pointer flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)]">
                      {(() => {
                        const Icon = getRoleIcon(role.name);
                        return <Icon size={16} />;
                      })()}
                    </span>
                    <h3 className="font-bold text-[var(--ink)]">{role.name}</h3>
                  </div>
                  {!role.isSystem && hasPermission("roles.delete") && (
                    <button
                      onClick={(e) => handleDelete(role, e)}
                      className="text-[var(--muted)] opacity-0 transition-opacity hover:text-[var(--crit)] group-hover:opacity-100"
                      title="Rolü Sil"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>

                <p className="line-clamp-3 text-xs leading-relaxed text-[var(--muted)]">
                  {role.description || "Görev tanımı eklenmemiş."}
                </p>

                <div className="mt-auto flex items-center justify-between border-t border-[var(--line)] pt-3 text-xs">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ink-soft)]">
                    <Users size={13} /> {role.employeeCount ?? 0} çalışan
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--ink-soft)]">
                    <Lock size={13} /> {role.permissionIds.length} izin
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <RoleDrawer open={creating} onClose={() => setCreating(false)} />
      <RoleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} role={selected ?? undefined} />
    </>
  );
}
