"use client";

import { useState } from "react";
import { Plus, ShieldCheck, Users, Lock, Trash2, ShieldAlert } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Button } from "@/components/ui/Button";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";
import { RoleDrawer } from "@/components/roles/RoleDrawer";
import { DEPARTMENTS, getDepartment } from "@/lib/departments";
import type { Role } from "@/lib/types";

function RoleCard({
  role,
  icon: Icon,
  muted,
  onOpen,
  onDelete,
  canDelete,
}: {
  role: Role;
  icon: typeof ShieldCheck;
  muted?: boolean;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  canDelete: boolean;
}) {
  return (
    <div
      onClick={onOpen}
      className={
        muted
          ? "flex flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface-alt)]/50 p-5 shadow-sm opacity-80"
          : "group flex cursor-pointer flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
      }
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent-soft)] text-[var(--accent-ink)]">
            <Icon size={16} />
          </span>
          <h3 className="font-bold text-[var(--ink)]">{role.name}</h3>
        </div>
        {!role.isSystem && canDelete && (
          <button
            onClick={onDelete}
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
  );
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

  function openRole(role: Role) {
    setSelected(role);
    setDrawerOpen(true);
  }

  const adminRole: Role = {
    id: 0,
    name: "Admin",
    slug: "admin",
    description: "Sistem yöneticisi. Oteldeki tüm yetkilere, sayfalara ve verilere sınırsız erişime sahiptir.",
    isSystem: true,
    department: null,
    permissionIds: store.state.permissions.map((p) => p.id),
    employeeCount: 1,
  };

  const otherRoles = roles.filter((r) => !getDepartment(r.department));
  const hasAnyRoles = roles.length > 0;

  return (
    <>
      <Topbar
        title="Roller"
        subtitle="Departmanlara göre meslek rollerini ve sayfa/izin yetkilerini yönetin"
        action={
          hasPermission("roles.create") ? (
            <Button size="sm" onClick={() => setCreating(true)}>
              <Plus size={14} /> Yeni Rol
            </Button>
          ) : undefined
        }
      />

      <main className="flex-1 space-y-8 p-6 lg:p-8">
        {loading ? (
          <PageSkeleton />
        ) : !hasAnyRoles ? (
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
          <>
            <section className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                <ShieldAlert size={15} className="text-[var(--accent)]" /> Yönetim
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <RoleCard role={adminRole} icon={ShieldAlert} muted onOpen={() => {}} onDelete={() => {}} canDelete={false} />
              </div>
            </section>

            {DEPARTMENTS.map((dept) => {
              const deptRoles = roles.filter((r) => r.department === dept.key);
              if (deptRoles.length === 0) return null;
              return (
                <section key={dept.key} className="space-y-3">
                  <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                    <dept.icon size={15} className="text-[var(--accent)]" /> {dept.label}
                  </h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {deptRoles.map((role) => (
                      <RoleCard
                        key={role.id}
                        role={role}
                        icon={dept.icon}
                        onOpen={() => openRole(role)}
                        onDelete={(e) => handleDelete(role, e)}
                        canDelete={hasPermission("roles.delete")}
                      />
                    ))}
                  </div>
                </section>
              );
            })}

            {otherRoles.length > 0 && (
              <section className="space-y-3">
                <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]">
                  <ShieldCheck size={15} className="text-[var(--accent)]" /> Diğer
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {otherRoles.map((role) => (
                    <RoleCard
                      key={role.id}
                      role={role}
                      icon={ShieldCheck}
                      onOpen={() => openRole(role)}
                      onDelete={(e) => handleDelete(role, e)}
                      canDelete={hasPermission("roles.delete")}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      <RoleDrawer open={creating} onClose={() => setCreating(false)} />
      <RoleDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} role={selected ?? undefined} />
    </>
  );
}
