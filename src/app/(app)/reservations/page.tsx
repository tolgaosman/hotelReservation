"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { Card } from "@/components/ui/Card";
import { ErrorState } from "@/components/ui/ErrorState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { RoomStatusGrid } from "@/components/reservations/RoomStatusGrid";
import { WeekSummary } from "@/components/reservations/WeekSummary";
import { BookingList } from "@/components/reservations/BookingList";
import { getReservations, getRooms } from "@/lib/api";
import { cn } from "@/lib/cn";
import type { Reservation, Room } from "@/lib/types";

type LoadState = "loading" | "ready" | "error";

export default function ReservationsPage() {
  const [state, setState] = useState<LoadState>("loading");
  const [rooms, setRooms] = useState<Room[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    Promise.all([getRooms(), getReservations()])
      .then(([r, res]) => {
        if (cancelled) return;
        setRooms(r);
        setReservations(res);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  return (
    <>
      <Topbar
        title="Bookings"
        subtitle="Manage reservations, cancellations, and booking activity"
      />

      <main className="flex-1 p-6 lg:p-8">
        <div className="mb-4 flex items-center justify-end">
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-[var(--radius-control)] bg-[var(--color-accent)] px-4 py-2.5 text-sm font-medium text-white",
              "transition-transform duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 active:translate-y-0"
            )}
          >
            <Plus size={15} strokeWidth={2.5} />
            Add Booking
          </button>
        </div>

        {state === "error" ? (
          <Card>
            <ErrorState
              onRetry={() => {
                setState("loading");
                setReloadKey((k) => k + 1);
              }}
            />
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              <div className="xl:col-span-2">
                {state === "loading" ? (
                  <Card title="Room Status">
                    <TableSkeleton rows={4} />
                  </Card>
                ) : (
                  <RoomStatusGrid rooms={rooms} />
                )}
              </div>
              <div>
                {state === "loading" ? (
                  <Card title="This Week">
                    <TableSkeleton rows={4} />
                  </Card>
                ) : (
                  <WeekSummary reservations={reservations} />
                )}
              </div>
            </div>

            {state === "loading" ? (
              <Card title="Booking List">
                <TableSkeleton rows={6} />
              </Card>
            ) : (
              <BookingList reservations={reservations} />
            )}
          </div>
        )}
      </main>
    </>
  );
}
