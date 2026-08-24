import { CalendarCheck, CalendarX, DoorOpen, Users } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";
import { StatCardSkeleton } from "@/components/ui/Skeleton";
import type { DashboardStats } from "@/lib/types";

export function StatsGrid({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard
        label="Today's Check-ins"
        value={stats.todayArrivals.toString()}
        delta={stats.todayArrivalsDelta}
        icon={CalendarCheck}
      />
      <StatCard
        label="Today's Check-outs"
        value={stats.todayDepartures.toString()}
        delta={stats.todayDeparturesDelta}
        icon={CalendarX}
      />
      <StatCard
        label="Occupied Rooms"
        value={stats.occupiedRooms.toString()}
        delta={stats.occupiedRoomsDelta}
        icon={DoorOpen}
      />
      <StatCard
        label="Active Reservations"
        value={stats.activeReservations.toString()}
        delta={stats.activeReservationsDelta}
        icon={Users}
      />
    </div>
  );
}

export function StatsGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <StatCardSkeleton key={i} />
      ))}
    </div>
  );
}
