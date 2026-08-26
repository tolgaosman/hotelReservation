import { formatCurrency } from "@/lib/format";
import type { Reservation } from "@/lib/types";
import { HeroBanner, type HeroBannerMetric } from "@/components/ui/hero-banner";

export function ReservationsHeroBanner({ reservations, totalCollected }: { reservations: Reservation[]; totalCollected: number }) {
  const confirmed = reservations.filter((r) => r.status === "confirmed" || r.status === "checked_in").length;
  const pending = reservations.filter((r) => r.status === "pending").length;
  const cancelled = reservations.filter((r) => r.status === "cancelled").length;

  const metrics: HeroBannerMetric[] = [
    { label: "Onaylanan", value: confirmed.toString(), tone: "ok" },
    { label: "Beklemede", value: pending.toString(), tone: "warn" },
    { label: "İptal", value: cancelled.toString(), tone: "crit" },
    { label: "Toplam Tahsilat", value: formatCurrency(totalCollected), tone: "accent" },
  ];

  return (
    <HeroBanner
      title="Rezervasyon Özeti"
      subtitle="Otelinizdeki tüm rezervasyonların güncel durumlarını ve finansal özetini inceleyin."
      metrics={metrics}
    />
  );
}
