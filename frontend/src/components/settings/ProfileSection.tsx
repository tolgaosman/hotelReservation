"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";

export function ProfileSection() {
  const [name, setName] = useState("Ertaz Otel");
  const [email, setEmail] = useState("iletisim@ertazotel.com");
  const [phone, setPhone] = useState("+90 212 555 10 00");
  const [saved, setSaved] = useState(false);

  return (
    <Card title="Otel Profili" subtitle="Panelde gösterilen temel bilgiler" padded>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Otel Adı">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </FormField>
          <FormField label="İletişim Telefonu">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
        </div>
        <FormField label="İletişim E-postası">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
        </FormField>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={() => setSaved(true)}>Değişiklikleri Kaydet</Button>
          {saved && <span className="text-xs font-medium text-[var(--ok)]">Kaydedildi</span>}
        </div>
      </div>
    </Card>
  );
}
