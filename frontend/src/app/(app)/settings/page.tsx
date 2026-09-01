"use client";

import { useCallback, useEffect, useState } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { ProfileSection } from "@/components/settings/ProfileSection";
import { PreferencesSection } from "@/components/settings/PreferencesSection";
import { NotificationSection } from "@/components/settings/NotificationSection";
import { SecuritySection } from "@/components/settings/SecuritySection";
import { ErrorState } from "@/components/ui/ErrorState";
import { api } from "@/lib/api";
import { extractFormError } from "@/lib/errors";
import type { FormResult, HotelSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<HotelSettings | null>(null);
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    setError(false);
    setSettings(null);
    api
      .get("/api/settings")
      .then((res) => setSettings(res.data.data))
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(input: Omit<HotelSettings, "id">): Promise<FormResult> {
    try {
      const res = await api.put("/api/settings", input);
      setSettings(res.data.data);
      return { ok: true };
    } catch (err) {
      return extractFormError(err, "Ayarlar kaydedilemedi.");
    }
  }

  return (
    <>
      <Topbar title="Ayarlar" subtitle="Otel profilinizi ve tercihlerinizi yönetin" />

      <main className="flex-1 space-y-6 p-6 lg:p-8">
        {error ? (
          <ErrorState description="Ayarlar yüklenemedi." onRetry={load} />
        ) : (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <ProfileSection settings={settings} onSave={save} />
              <PreferencesSection settings={settings} onSave={save} />
            </div>
            <div className="space-y-6">
              <NotificationSection />
              <SecuritySection />
            </div>
          </div>
        )}
      </main>
    </>
  );
}
