"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { fieldError } from "@/lib/errors";
import type { Employee, EmployeeStatus } from "@/lib/types";

export const PROFESSIONS = [
  "Muhasebeci",
  "Muhasebe Müdürü",
  "Resepsiyonist",
  "Resepsiyon Amiri",
  "Temizlikçi",
  "Temizlik Sorumlusu",
  "Garson",
  "Garson Şefi",
];

interface FormHandle {
  submit(): void;
}

const EmployeeForm = forwardRef<FormHandle, { employee?: Employee; isCreate: boolean; onClose: () => void }>(
  function EmployeeForm({ employee, isCreate, onClose }, ref) {
    const store = useStore();
    const showToast = useToast();

    const [fullName, setFullName] = useState(employee?.fullName ?? "");
    const [profession, setProfession] = useState(employee?.profession ?? PROFESSIONS[0]);
    const [roleId, setRoleId] = useState<string>(employee?.roleId ? String(employee.roleId) : "");
    const [email, setEmail] = useState(employee?.email ?? "");
    const [phone, setPhone] = useState(employee?.phone ?? "");
    const [hireDate, setHireDate] = useState(employee?.hireDate ?? "");
    const [status, setStatus] = useState<EmployeeStatus>(employee?.status ?? "active");
    const [notes, setNotes] = useState(employee?.notes ?? "");
    const [error, setError] = useState<string | null>(null);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | undefined>(undefined);

    useImperativeHandle(ref, () => ({
      async submit() {
        setFieldErrors(undefined);
        if (!fullName.trim()) return setError("Ad soyad gereklidir.");
        if (!profession.trim()) return setError("Meslek seçilmelidir.");

        const baseInput = {
          fullName: fullName.trim(),
          profession,
          roleId: roleId ? Number(roleId) : null,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          hireDate: hireDate || undefined,
          notes: notes.trim() || undefined,
        };

        const result = isCreate
          ? await store.createEmployee(baseInput)
          : await store.updateEmployee(employee!.id, { ...baseInput, status });

        if (!result.ok) {
          setFieldErrors(result.fieldErrors);
          return setError(result.error);
        }
        showToast(isCreate ? "Çalışan eklendi." : "Çalışan güncellendi.");
        onClose();
      },
    }));

    return (
      <div className="space-y-4">
        <FormField label="Ad Soyad" error={fieldError(fieldErrors, "fullName")}>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Örn. Ayşe Yıldız" />
        </FormField>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="Meslek" error={fieldError(fieldErrors, "profession")}>
            <Select value={profession} onChange={(e) => setProfession(e.target.value)}>
              {PROFESSIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Rol (İzin Grubu)" error={fieldError(fieldErrors, "roleId")}>
            <Select value={roleId} onChange={(e) => setRoleId(e.target.value)}>
              <option value="">Rol atanmadı</option>
              {store.state.roles.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  {r.name}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="E-posta" error={fieldError(fieldErrors, "email")}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ornek@hotel.test" />
          </FormField>
          <FormField label="Telefon" error={fieldError(fieldErrors, "phone")}>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0532 000 00 00" />
          </FormField>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField label="İşe Başlama Tarihi" error={fieldError(fieldErrors, "hireDate")}>
            <Input type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
          </FormField>
          {!isCreate && (
            <FormField label="Durum">
              <Select value={status} onChange={(e) => setStatus(e.target.value as EmployeeStatus)}>
                <option value="active">Aktif</option>
                <option value="passive">Pasif</option>
              </Select>
            </FormField>
          )}
        </div>

        <FormField label="Notlar">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="İsteğe bağlı notlar" />
        </FormField>

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}
      </div>
    );
  }
);

export function EmployeeDrawer({ open, onClose, employee }: { open: boolean; onClose: () => void; employee?: Employee }) {
  const formRef = useRef<FormHandle>(null);
  const isCreate = !employee;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isCreate ? "Yeni Çalışan" : employee!.fullName}
      subtitle={isCreate ? "Kadroya yeni bir çalışan ekleyin" : "Çalışan bilgilerini düzenleyin"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Vazgeç
          </Button>
          <Button onClick={() => formRef.current?.submit()}>{isCreate ? "Ekle" : "Kaydet"}</Button>
        </>
      }
    >
      <EmployeeForm key={open ? (employee?.id ?? "new") : "closed"} ref={formRef} employee={employee} isCreate={isCreate} onClose={onClose} />
    </Drawer>
  );
}
