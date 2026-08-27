"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { toView } from "@/lib/selectors";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageSkeleton } from "@/components/ui/Skeleton";
import { ReservationDrawer } from "@/components/reservations/ReservationDrawer";
import type { ReservationView } from "@/lib/types";

const ROW_HEIGHT = 68; // px
const LABEL_WIDTH = 200; // px

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toIso(year: number, monthIndex: number, day: number): string {
  const d = new Date(year, monthIndex, day);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return toIso(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000);
}

interface LaneItem<T> {
  item: T;
  checkIn: string;
  checkOut: string;
}

// Greedy interval-partitioning: reservations whose date ranges actually
// overlap (per the same touching-allowed rule availability.ts uses to block
// bookings) get assigned separate lanes so their bars stack instead of
// painting over each other.
function assignLanes<T>(items: LaneItem<T>[]): { laneOf: Map<T, number>; laneCount: number } {
  const sorted = [...items].sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  const laneEnds: string[] = [];
  const laneOf = new Map<T, number>();
  for (const entry of sorted) {
    // A lane is free once its last reservation's checkOut has passed — a
    // same-day turnover (new checkIn === existing checkOut) is explicitly
    // allowed, matching the touching rule in availability.ts's rangesOverlap.
    let lane = laneEnds.findIndex((end) => entry.checkIn >= end);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(entry.checkOut);
    } else {
      laneEnds[lane] = entry.checkOut;
    }
    laneOf.set(entry.item, lane);
  }
  return { laneOf, laneCount: Math.max(1, laneEnds.length) };
}

// Fixed half-month windows (1st–15th, 16th–end of month) rather than an
// arbitrary rolling window, so the grid always lines up with how the front
// desk actually thinks about a booking period.
function getPeriodBounds(iso: string): { start: string; end: string } {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = d.getMonth();
  if (d.getDate() <= 15) {
    return { start: toIso(year, month, 1), end: toIso(year, month, 15) };
  }
  const lastDay = new Date(year, month + 1, 0).getDate();
  return { start: toIso(year, month, 16), end: toIso(year, month, lastDay) };
}

function shiftPeriod(iso: string, direction: 1 | -1): string {
  const { start } = getPeriodBounds(iso);
  const d = new Date(start);
  if (direction === 1) {
    if (d.getDate() === 1) return toIso(d.getFullYear(), d.getMonth(), 16);
    return toIso(d.getFullYear(), d.getMonth() + 1, 1);
  }
  if (d.getDate() === 16) return toIso(d.getFullYear(), d.getMonth(), 1);
  return toIso(d.getFullYear(), d.getMonth() - 1, 16);
}

function formatPeriodLabel(start: string, end: string): string {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const month = endDate.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return `${startDate.getDate()} – ${endDate.getDate()} ${month}`;
}

const STATUS_ACCENT: Record<string, string> = {
  pending: "bg-[var(--warn)]",
  confirmed: "bg-[var(--info)]",
  checked_in: "bg-[var(--accent)]",
  completed: "bg-[var(--muted)]",
};

const STATUS_SURFACE: Record<string, string> = {
  pending: "bg-[var(--warn-soft)] text-[var(--warn)]",
  confirmed: "bg-[var(--info-soft)] text-[var(--info-ink)]",
  checked_in: "bg-[var(--accent-soft)] text-[var(--accent-ink)]",
  completed: "bg-[var(--surface-alt)] text-[var(--muted)]",
};

export default function CalendarPage() {
  const store = useStore();
  const { state, todayIso } = store;
  const [periodAnchor, setPeriodAnchor] = useState(todayIso);
  const [selectedReservationId, setSelectedReservationId] = useState<number | null>(null);

  const { start: periodStart, end: periodEnd } = useMemo(() => getPeriodBounds(periodAnchor), [periodAnchor]);
  const daysToShow = daysBetween(periodStart, periodEnd) + 1;

  const dates = useMemo(() => {
    const arr: string[] = [];
    for (let i = 0; i < daysToShow; i++) arr.push(addDays(periodStart, i));
    return arr;
  }, [periodStart, daysToShow]);

  const rooms = useMemo(
    () => state.rooms.filter((r) => r.active).sort((a, b) => a.number.localeCompare(b.number)),
    [state.rooms]
  );

  const goPrev = () => setPeriodAnchor(shiftPeriod(periodAnchor, -1));
  const goNext = () => setPeriodAnchor(shiftPeriod(periodAnchor, 1));
  const goToday = () => setPeriodAnchor(todayIso);

  const periodEndExclusive = addDays(periodEnd, 1);
  const gridTemplateColumns = `repeat(${daysToShow}, minmax(0, 1fr))`;

  const selectedReservation: ReservationView | undefined = useMemo(() => {
    if (selectedReservationId === null) return undefined;
    const res = state.reservations.find((r) => r.id === selectedReservationId);
    if (!res) return undefined;
    return toView(res, state) ?? undefined;
  }, [selectedReservationId, state]);

  return (
    <div className="flex flex-col gap-6 bg-[var(--canvas)] p-6 lg:p-8">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 text-2xl font-bold tracking-tight text-[var(--ink)]">
            <CalendarIcon className="text-[var(--accent)]" size={26} />
            Rezervasyon Takvimi
          </h1>
          <p className="mt-1.5 text-sm text-[var(--muted)]">Odaların doluluk durumunu 15 günlük periyotlar halinde inceleyin.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={goToday}
            className="rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--ink)] transition-colors duration-150 hover:bg-[var(--surface-alt)]"
          >
            Bugün
          </button>
          <div className="flex items-center gap-1 rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface)] p-1">
            <button
              onClick={goPrev}
              aria-label="Önceki periyot"
              className="flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="min-w-[168px] px-2 text-center text-sm font-semibold text-[var(--ink)]">
              {formatPeriodLabel(periodStart, periodEnd)}
            </span>
            <button
              onClick={goNext}
              aria-label="Sonraki periyot"
              className="flex size-8 items-center justify-center rounded-md text-[var(--muted)] transition-colors duration-150 hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {store.hydrating ? (
        <PageSkeleton />
      ) : rooms.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--line)] bg-[var(--surface)] text-center">
          <Inbox className="text-[var(--muted)]" size={32} />
          <p className="font-semibold text-[var(--ink)]">Henüz aktif oda yok</p>
          <p className="max-w-xs text-sm text-[var(--muted)]">Odalar sekmesinden bir oda ekleyip aktif hale getirdiğinizde burada görünecek.</p>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-sm">
          {/* Header and rows are direct siblings sharing one non-scrolling
              width context, so the shared gridTemplateColumns always computes
              to pixel-identical column widths — no drift between them. */}
          <div className="flex border-b border-[var(--line)] bg-[var(--surface-alt)]">
            <div
              className="flex shrink-0 items-center px-4 py-3.5 text-xs font-bold tracking-wider text-[var(--muted)] uppercase"
              style={{ width: LABEL_WIDTH }}
            >
              Oda
            </div>
            <div className="grid flex-1" style={{ gridTemplateColumns }}>
              {dates.map((date) => {
                const d = new Date(date);
                const isToday = date === todayIso;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div
                    key={date}
                    className={cn(
                      "flex flex-col items-center justify-center gap-0.5 border-l border-[var(--line)] py-2.5 first:border-l-0",
                      isWeekend && !isToday && "bg-[var(--surface)]/60"
                    )}
                  >
                    <span className="text-[11px] font-medium text-[var(--muted)] capitalize">
                      {d.toLocaleDateString("tr-TR", { weekday: "short" })}
                    </span>
                    <span
                      className={cn(
                        "flex size-7 items-center justify-center rounded-full text-sm font-bold text-[var(--ink)]",
                        isToday && "bg-[var(--accent)] text-white"
                      )}
                    >
                      {d.getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {rooms.map((room) => {
              // Active bookings for this room, independent of the visible
              // window — needed to detect same-day turnovers even when the
              // departing reservation's checkout falls right at the edge of
              // the current period.
              const roomAllReservations = state.reservations.filter(
                (r) => r.roomId === room.id && r.status !== "cancelled"
              );
              const roomReservations = roomAllReservations.filter(
                (r) => r.checkOut > periodStart && r.checkIn < periodEndExclusive
              );
              // Genuine overlaps (not just a same-day turnover) shouldn't
              // happen — both the API and the reservation form block them —
              // but this keeps stale/dirty data from rendering bars on top of
              // each other instead of failing loudly.
              const { laneOf, laneCount } = assignLanes(
                roomReservations.map((r) => ({ item: r, checkIn: r.checkIn, checkOut: r.checkOut }))
              );
              const rowHeight = laneCount * ROW_HEIGHT;

              return (
                <div
                  key={room.id}
                  className="flex border-b border-[var(--line)] transition-colors duration-150 last:border-b-0 hover:bg-[var(--surface-alt)]/40"
                  style={{ height: rowHeight }}
                >
                  <div
                    className="flex shrink-0 flex-col justify-center border-r border-[var(--line)] px-4"
                    style={{ width: LABEL_WIDTH }}
                  >
                    <span className="text-sm font-bold text-[var(--ink)]">{room.number}</span>
                    <span className="text-xs text-[var(--muted)]">{room.type}</span>
                  </div>

                  <div className="relative flex-1" style={{ height: rowHeight }}>
                    <div className="absolute inset-0 grid" style={{ gridTemplateColumns }}>
                      {dates.map((date) => {
                        const d = new Date(date);
                        const isToday = date === todayIso;
                        const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                        return (
                          <div
                            key={date}
                            className={cn(
                              "h-full border-l border-[var(--line)] first:border-l-0",
                              isToday ? "bg-[var(--accent)]/[0.04]" : isWeekend && "bg-[var(--surface-alt)]/40"
                            )}
                          />
                        );
                      })}
                    </div>

                    {roomReservations.map((res) => {
                      // A reservation always keeps only the first half of its
                      // checkout day (the guest leaves that morning); if it
                      // arrived on someone else's checkout day, it in turn
                      // only takes the second half of its own arrival day.
                      const turnoverIn = roomAllReservations.some(
                        (other) => other.id !== res.id && other.checkOut === res.checkIn
                      );
                      const inOffset = daysBetween(periodStart, res.checkIn);
                      const outOffset = daysBetween(periodStart, res.checkOut);
                      const left = Math.max(inOffset + (turnoverIn ? 0.5 : 0), 0);
                      const right = Math.min(outOffset + 0.5, daysToShow);
                      if (right <= left) return null;

                      const view = toView(res, state);
                      const guestName = view?.guest.fullName ?? "Bilinmiyor";
                      const lane = laneOf.get(res) ?? 0;

                      return (
                        <button
                          key={res.id}
                          onClick={() => setSelectedReservationId(res.id)}
                          className={cn(
                            "absolute z-10 flex items-center gap-2 overflow-hidden rounded-[10px] px-2.5 text-left text-xs font-semibold shadow-sm transition-all duration-150 [transition-timing-function:var(--ease-organic)] hover:z-20 hover:-translate-y-px hover:shadow-md",
                            STATUS_SURFACE[res.status] ?? STATUS_SURFACE.confirmed
                          )}
                          style={{
                            left: `${(left / daysToShow) * 100}%`,
                            width: `${((right - left) / daysToShow) * 100}%`,
                            top: lane * ROW_HEIGHT + 10,
                            height: ROW_HEIGHT - 20,
                          }}
                          title={`${guestName} · ${res.checkIn} – ${res.checkOut}`}
                        >
                          <span className={cn("h-[60%] w-[3px] shrink-0 rounded-full", STATUS_ACCENT[res.status] ?? STATUS_ACCENT.confirmed)} />
                          <span className="truncate">{guestName}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      <ReservationDrawer
        open={selectedReservationId !== null}
        onClose={() => setSelectedReservationId(null)}
        reservation={selectedReservation}
      />
    </div>
  );
}
