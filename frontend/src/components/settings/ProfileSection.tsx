"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { fieldError } from "@/lib/errors";
import type { FormResult, HotelSettings } from "@/lib/types";

interface ProfileForm {
  name: string;
  email: string;
  phone: string;
}

function fromSettings(settings: HotelSettings): ProfileForm {
  return { name: settings.name, email: settings.email, phone: settings.phone ?? "" };
}

export function ProfileSection({
  settings,
  onSave,
}: {
  settings: HotelSettings | null;
  onSave: (input: Omit<HotelSettings, "id">) => Promise<FormResult>;
}) {
  const showToast = useToast();
  const [form, setForm] = useState<ProfileForm | null>(settings ? fromSettings(settings) : null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>();
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(fromSettings(settings));
  }, [settings]);

  async function save() {
    if (!settings || !form) return;
    setSaving(true);
    setFieldErrors(undefined);
    const result = await onSave({
      name: form.name,
      email: form.email,
      phone: form.phone || null,
      taxRate: settings.taxRate,
      checkInTime: settings.checkInTime,
      checkOutTime: settings.checkOutTime,
    });
    setSaving(false);
    if (result.ok) {
      showToast("Otel profili kaydedildi.", "success");
    } else {
      setFieldErrors(result.fieldErrors);
      showToast(result.error, "error");
    }
  }

  if (!form) {
    return (
      <Card title="Otel Profili" subtitle="Panelde gösterilen temel bilgiler" padded>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-[42px]" />
            <Skeleton className="h-[42px]" />
          </div>
          <Skeleton className="h-[42px]" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Otel Profili" subtitle="Panelde gösterilen temel bilgiler" padded>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Otel Adı" error={fieldError(fieldErrors, "name")}>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FormField>
          <FormField label="İletişim Telefonu" error={fieldError(fieldErrors, "phone")}>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </FormField>
        </div>
        <FormField label="İletişim E-postası" error={fieldError(fieldErrors, "email")}>
          <Input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            type="email"
          />
        </FormField>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save} disabled={saving}>
            {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
          </Button>
        </div>
      </div>
    </Card>
  );
}
