"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Check, LayoutDashboard } from "lucide-react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { fieldError } from "@/lib/errors";
import type { Permission, Role } from "@/lib/types";

interface FormHandle {
  submit(): void;
}

function groupPermissions(permissions: Permission[]) {
  const byGroup = new Map<string, { groupLabel: string; page: Permission | null; sub: Permission[] }>();
  for (const p of permissions) {
    if (!byGroup.has(p.group)) byGroup.set(p.group, { groupLabel: p.groupLabel, page: null, sub: [] });
    const entry = byGroup.get(p.group)!;
    if (p.isPagePermission) entry.page = p;
    else entry.sub.push(p);
  }
  return Array.from(byGroup.values());
}

function PermissionCheckbox({
  label,
  checked,
  disabled,
  onChange,
  emphasis,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: () => void;
  emphasis?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onChange}
      className={cn(
        "flex w-full items-center gap-2.5 rounded-[var(--radius-control)] border px-3 py-2 text-left text-sm transition-colors duration-150",
        disabled
          ? "cursor-not-allowed border-[var(--line)] bg-[var(--surface-alt)]/50 text-[var(--muted)] opacity-50"
          : checked
          ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[var(--accent-ink)]"
          : "border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:border-[var(--muted)]",
        emphasis && "font-semibold"
      )}
    >
      <span
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-[4px] border transition-colors duration-150",
          checked ? "border-[var(--accent)] bg-[var(--accent)] text-white" : "border-[var(--line-strong)] bg-[var(--surface)]"
        )}
      >
        {checked && <Check size={11} strokeWidth={3} />}
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

const RoleForm = forwardRef<FormHandle, { role?: Role; isCreate: boolean; onClose: () => void }>(
  function RoleForm({ role, isCreate, onClose }, ref) {
    const store = useStore();
    const showToast = useToast();

    const [name, setName] = useState(role?.name ?? "");
    const [description, setDescription] = useState(role?.description ?? "");
    const [selected, setSelected] = useState<Set<number>>(new Set(role?.permissionIds ?? []));
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);

    const groups = useMemo(() => groupPermissions(store.state.permissions), [store.state.permissions]);

    function togglePage(page: Permission, subIds: number[]) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(page.id)) {
          // Turning off page access makes every in-page permission meaningless too.
          next.delete(page.id);
          subIds.forEach((id) => next.delete(id));
        } else {
          next.add(page.id);
        }
        return next;
      });
    }

    function toggleSub(id: number) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    }

    useImperativeHandle(ref, () => ({
      async submit() {
        setFieldErrors(undefined);
        if (!name.trim()) return setError("Rol adı gereklidir.");

        const input = { name: name.trim(), description: description.trim(), permissionIds: Array.from(selected) };
        const result = isCreate ? await store.createRole(input) : await store.updateRole(role!.id, input);

        if (!result.ok) {
          setFieldErrors(result.fieldErrors);
          return setError(result.error);
        }
        showToast(isCreate ? "Rol oluşturuldu." : "Rol güncellendi.");
        onClose();
      },
    }));

    return (
      <div className="space-y-5">
        <FormField label="Rol Adı" error={fieldError(fieldErrors, "name")}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn. Resepsiyonist" />
        </FormField>

        <FormField label="Görev Tanımı">
          <Textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Bu rolün sorumluluklarını kısaca açıklayın"
          />
        </FormField>

        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase">İzinler</p>
          <div className="space-y-4">
            {groups.map((g) => {
              const pageChecked = g.page ? selected.has(g.page.id) : false;
              const subIds = g.sub.map((s) => s.id);
              return (
                <div key={g.groupLabel} className="rounded-[var(--radius-card)] border border-[var(--line)] p-3.5">
                  {g.page && (
                    <div className="mb-2.5 flex items-center gap-2">
                      {g.groupLabel === "Dashboard" && <LayoutDashboard size={14} className="text-[var(--accent)]" />}
                      <div className="flex-1">
                        <PermissionCheckbox
                          label={`${g.groupLabel} — Sayfayı Görüntüleme`}
                          checked={pageChecked}
                          onChange={() => togglePage(g.page!, subIds)}
                          emphasis
                        />
                      </div>
                    </div>
                  )}
                  {g.sub.length > 0 && (
                    <div className="grid grid-cols-1 gap-1.5 pl-1 sm:grid-cols-2">
                      {g.sub.map((p) => (
                        <PermissionCheckbox
                          key={p.id}
                          label={p.label}
                          checked={selected.has(p.id)}
                          disabled={!pageChecked}
                          onChange={() => toggleSub(p.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
      </div>
    );
  }
);

export function RoleDrawer({ open, onClose, role }: { open: boolean; onClose: () => void; role?: Role }) {
  const formRef = useRef<FormHandle>(null);
  const isCreate = !role;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Yeni Rol" : role!.name}
      subtitle={isCreate ? "Yeni bir rol ve izin grubu tanımlayın" : "Görev tanımını ve izinleri düzenleyin"}
      width="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Oluştur" : "Kaydet"}</Button>
        </>
      }
    >
      <RoleForm key={open ? (role?.id ?? "new") : "closed"} ref={formRef} role={role} isCreate={isCreate} onClose={onClose} />
    </Drawer>
  );
}
