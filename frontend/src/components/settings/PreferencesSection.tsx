"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { fieldError } from "@/lib/errors";
import type { FormResult, HotelSettings } from "@/lib/types";

interface PreferencesForm {
  taxRate: string;
  checkInTime: string;
  checkOutTime: string;
}

function fromSettings(settings: HotelSettings): PreferencesForm {
  return {
    taxRate: String(settings.taxRate),
    checkInTime: settings.checkInTime,
    checkOutTime: settings.checkOutTime,
  };
}

export function PreferencesSection({
  settings,
  onSave,
}: {
  settings: HotelSettings | null;
  onSave: (input: Omit<HotelSettings, "id">) => Promise<FormResult>;
}) {
  const showToast = useToast();
  const [form, setForm] = useState<PreferencesForm | null>(settings ? fromSettings(settings) : null);
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
      name: settings.name,
      email: settings.email,
      phone: settings.phone,
      taxRate: Number(form.taxRate),
      checkInTime: form.checkInTime,
      checkOutTime: form.checkOutTime,
    });
    setSaving(false);
    if (result.ok) {
      showToast("Otel tercihleri kaydedildi.", "success");
    } else {
      setFieldErrors(result.fieldErrors);
      showToast(result.error, "error");
    }
  }

  if (!form) {
    return (
      <Card title="Otel Tercihleri" subtitle="Varsayılan yapılandırmalar" padded>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          <Skeleton className="h-[42px]" />
          <Skeleton className="h-[42px]" />
          <Skeleton className="h-[42px]" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Otel Tercihleri" subtitle="Varsayılan yapılandırmalar" padded>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <FormField label="Vergi Oranı (%)" error={fieldError(fieldErrors, "taxRate")}>
          <Input
            type="number"
            min={0}
            max={100}
            value={form.taxRate}
            onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
          />
        </FormField>
        <FormField label="Check-in Saati" error={fieldError(fieldErrors, "checkInTime")}>
          <Input
            type="time"
            value={form.checkInTime}
            onChange={(e) => setForm({ ...form, checkInTime: e.target.value })}
          />
        </FormField>
        <FormField label="Check-out Saati" error={fieldError(fieldErrors, "checkOutTime")}>
          <Input
            type="time"
            value={form.checkOutTime}
            onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })}
          />
        </FormField>
      </div>
      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor..." : "Değişiklikleri Kaydet"}
        </Button>
      </div>
    </Card>
  );
}
