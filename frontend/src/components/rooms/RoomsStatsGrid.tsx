import { Calendar, CheckCircle2, Clock, XCircle, DollarSign } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/format";
import type { RoomStats } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RoomsStatsGrid({ stats }: { stats: RoomStats }) {
  // We mock total revenue since it's not in RoomStats directly, but we use the other valid stats
  const tiles = [
    { 
      label: "Dolu Odalar", 
      value: stats.occupied, 
      icon: CheckCircle2, 
      color: "text-[#059669]", 
      bg: "bg-[#D1FAE5]", 
      iconBg: "bg-[#A7F3D0]" 
    },
    { 
      label: "Rezerve", 
      value: stats.reserved, 
      icon: Clock, 
      color: "text-[#DB2777]", 
      bg: "bg-[#FCE7F3]", 
      iconBg: "bg-[#FBCFE8]" 
    },
    { 
      label: "Bakımda", 
      value: stats.maintenance, 
      icon: XCircle, 
      color: "text-[#DC2626]", 
      bg: "bg-[#FEE2E2]", 
      iconBg: "bg-[#FECACA]" 
    },
    { 
      label: "Müsait Odalar", 
      value: stats.available, 
      icon: CheckCircle2, 
      color: "text-[#EA580C]", 
      bg: "bg-[#FFEDD5]", 
      iconBg: "bg-[#FED7AA]" 
    },
  ];

  return (
    <Card 
      title={
        <div className="flex items-center gap-2">
          <Calendar size={15} className="text-[var(--muted)]" />
          <span className="text-[13px] font-semibold text-[var(--ink)]">Oda Durumu (Anlık)</span>
        </div>
      }
      className="bg-[var(--surface)] shadow-sm h-full"
      padded
    >
      <div className="grid h-[380px] grid-cols-2 gap-3.5">
        {tiles.map((t) => (
          <div key={t.label} className={cn("flex flex-col justify-between rounded-[20px] p-4", t.bg)}>
            <div className={cn("flex size-8 items-center justify-center rounded-full", t.iconBg, t.color)}>
              <t.icon size={16} />
            </div>
            <div>
              <p className={cn("text-2xl font-black", t.color)}>{t.value}</p>
              <p className={cn("text-[11px] font-semibold opacity-70", t.color)}>{t.label}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
