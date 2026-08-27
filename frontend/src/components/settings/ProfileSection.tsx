"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

const STORAGE_KEY = "yunma-hotel-profile-v1";

interface HotelProfile {
  name: string;
  email: string;
  phone: string;
}

const DEFAULT_PROFILE: HotelProfile = {
  name: "Ertaz Otel",
  email: "iletisim@ertazotel.com",
  phone: "+90 212 555 10 00",
};

function loadProfile(): HotelProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<HotelProfile>;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileSection() {
  const showToast = useToast();
  const [profile, setProfile] = useState<HotelProfile>(loadProfile);
  const [error, setError] = useState<string | null>(null);

  function save() {
    if (!profile.name.trim()) return setError("Otel adı gereklidir.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) {
      return setError("Geçerli bir e-posta adresi girin.");
    }
    setError(null);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
      showToast("Otel profili kaydedildi.", "success");
    } catch {
      showToast("Kaydedilemedi, tarayıcı depolama alanı kullanılamıyor.", "error");
    }
  }

  return (
    <Card title="Otel Profili" subtitle="Panelde gösterilen temel bilgiler" padded>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Otel Adı">
            <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          </FormField>
          <FormField label="İletişim Telefonu">
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </FormField>
        </div>
        <FormField label="İletişim E-postası">
          <Input
            value={profile.email}
            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
            type="email"
          />
        </FormField>

        {error && <p className="text-sm font-medium text-[var(--crit)]">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={save}>Değişiklikleri Kaydet</Button>
        </div>
      </div>
    </Card>
  );
}
