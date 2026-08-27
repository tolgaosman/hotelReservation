import { BedDouble, CalendarCheck, Clock, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { Room, Reservation } from "@/lib/types";
import { HeroBanner, type HeroBannerMetric } from "@/components/ui/hero-banner";

export function RoomsHeroBanner({ rooms, reservations }: { rooms: Room[]; reservations: Reservation[] }) {
  const totalRooms = rooms.length;
  const activeStays = reservations.filter(r => r.status === "checked_in").length;
  const pendingBookings = reservations.filter(r => r.status === "pending" || r.status === "confirmed").length;
  const avgRate = rooms.length > 0 ? rooms.reduce((sum, r) => sum + r.nightlyRate, 0) / rooms.length : 0;

  const metrics: HeroBannerMetric[] = [
    { label: "Toplam Oda", value: totalRooms.toString(), icon: <BedDouble size={16} />, tone: "info" },
    { label: "Aktif Konaklama", value: activeStays.toString(), icon: <CalendarCheck size={16} />, tone: "ok" },
    { label: "Bekleyen Rezervasyon", value: pendingBookings.toString(), icon: <Clock size={16} />, tone: "warn" },
  ];

  return (
    <HeroBanner
      title="Oda ve Kapasite Yönetimi"
      subtitle="Otelinizin anlık oda durumunu, müsaitlik oranlarını ve yaklaşan konaklamaları buradan takip edebilirsiniz."
      metrics={metrics}
    />
  );
}
