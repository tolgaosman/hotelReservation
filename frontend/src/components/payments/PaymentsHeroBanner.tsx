import { CalendarClock, CheckCircle2, Wallet, WalletCards } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { PaymentStats } from "@/lib/types";
import { HeroBanner, type HeroBannerMetric } from "@/components/ui/hero-banner";

export function PaymentsHeroBanner({ stats }: { stats: PaymentStats }) {
  const metrics: HeroBannerMetric[] = [
    { label: "Toplam Tahsilat", value: formatCurrency(stats.totalCollected), icon: <Wallet size={16} />, tone: "accent" },
    { label: "Kalan Bakiye", value: formatCurrency(stats.outstanding), icon: <WalletCards size={16} />, tone: "warn" },
    { label: "Tam Ödenen", value: stats.fullyPaidCount.toString(), icon: <CheckCircle2 size={16} />, tone: "ok" },
    { label: "Bu Ay", value: formatCurrency(stats.thisMonthCollected), icon: <CalendarClock size={16} />, tone: "accent" },
  ];

  return (
    <HeroBanner
      title="Finansal Durum"
      subtitle="Otelinizin genel ödeme performansını, kalan bakiyeleri ve tahsilatları takip edin."
      metrics={metrics}
    />
  );
}
