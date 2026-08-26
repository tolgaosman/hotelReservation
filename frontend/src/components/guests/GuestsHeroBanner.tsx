import { Globe, Repeat, Users, Wallet } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { GuestSummary } from "@/lib/types";
import { HeroBanner, type HeroBannerMetric } from "@/components/ui/hero-banner";

export function GuestsHeroBanner({ guests }: { guests: GuestSummary[] }) {
  const countries = new Set(guests.map((g) => g.country)).size;
  const repeatGuests = guests.filter((g) => g.totalBookings > 1).length;
  const totalRevenue = guests.reduce((sum, g) => sum + g.totalSpent, 0);

  const metrics: HeroBannerMetric[] = [
    { label: "Toplam Misafir", value: guests.length.toString(), icon: <Users size={16} />, tone: "info" },
    { label: "Ülke Sayısı", value: countries.toString(), icon: <Globe size={16} />, tone: "info" },
    { label: "Tekrar Eden Misafir", value: repeatGuests.toString(), icon: <Repeat size={16} />, tone: "ok" },
    { label: "Misafir Geliri", value: formatCurrency(totalRevenue), icon: <Wallet size={16} />, tone: "accent" },
  ];

  return (
    <HeroBanner
      title="Misafir İstatistikleri"
      subtitle="Kayıtlı misafirlerinizin genel özetini ve gelir katkılarını buradan takip edebilirsiniz."
      metrics={metrics}
    />
  );
}
