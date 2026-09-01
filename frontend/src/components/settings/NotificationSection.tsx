"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Switch } from "@/components/ui/Switch";

export function NotificationSection() {
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(false);
  const [reportNotifs, setReportNotifs] = useState(true);

  return (
    <Card title="Bildirim Ayarları" subtitle="Sistem uyarıları ve raporlar" padded>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">E-posta Bildirimleri</p>
            <p className="text-xs text-[var(--muted)]">Yeni rezervasyon ve ödemelerde e-posta alın.</p>
          </div>
          <Switch checked={emailNotifs} onCheckedChange={setEmailNotifs} label="E-posta Bildirimleri" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">SMS Bildirimleri</p>
            <p className="text-xs text-[var(--muted)]">Acil durumlar ve iptallerde SMS alın.</p>
          </div>
          <Switch checked={smsNotifs} onCheckedChange={setSmsNotifs} label="SMS Bildirimleri" />
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-[var(--ink)]">Haftalık Raporlar</p>
            <p className="text-xs text-[var(--muted)]">Otel performans özetini her pazartesi alın.</p>
          </div>
          <Switch checked={reportNotifs} onCheckedChange={setReportNotifs} label="Haftalık Raporlar" />
        </div>
      </div>
    </Card>
  );
}
