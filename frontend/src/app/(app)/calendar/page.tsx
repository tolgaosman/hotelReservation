"use client";

import { useState, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "@/components/ui/status-badge";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function daysBetween(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 86400000);
}

const CELL_WIDTH = 60; // px
const ROW_HEIGHT = 48; // px

export default function CalendarPage() {
  const { state, todayIso } = useStore();
  
  // View window starts 3 days ago to show recent past
  const [startDate, setStartDate] = useState(addDays(todayIso, -3));
  const daysToShow = 30;

  const dates = useMemo(() => {
    const arr = [];
    for (let i = 0; i < daysToShow; i++) {
      arr.push(addDays(startDate, i));
    }
    return arr;
  }, [startDate, daysToShow]);

  const rooms = useMemo(() => {
    return state.rooms.filter(r => r.active).sort((a, b) => a.number.localeCompare(b.number));
  }, [state.rooms]);

  const nextPeriod = () => setStartDate(addDays(startDate, 7));
  const prevPeriod = () => setStartDate(addDays(startDate, -7));
  const goToToday = () => setStartDate(addDays(todayIso, -3));

  return (
    <div className="flex h-full flex-col p-6 bg-[var(--canvas)] overflow-hidden">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--ink)] flex items-center gap-2">
            <CalendarIcon className="text-[var(--accent)]" />
            Rezervasyon Takvimi
          </h1>
          <p className="text-[var(--muted)] mt-1">
            Odaların 30 günlük doluluk durumunu harita üzerinden inceleyin.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goToToday} className="px-3 py-1.5 text-sm font-semibold border border-[var(--line)] rounded-md hover:bg-[var(--surface-alt)]">
            Bugün
          </button>
          <div className="flex items-center border border-[var(--line)] rounded-md bg-[var(--surface)] overflow-hidden">
            <button onClick={prevPeriod} className="p-1.5 hover:bg-[var(--surface-alt)] border-r border-[var(--line)]">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextPeriod} className="p-1.5 hover:bg-[var(--surface-alt)]">
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-sm overflow-hidden flex flex-col">
        {/* Timeline Header */}
        <div className="flex border-b border-[var(--line)] bg-[var(--surface-alt)] shrink-0 overflow-hidden">
          <div className="w-[120px] shrink-0 border-r border-[var(--line)] p-3 flex items-center justify-center font-bold text-[var(--muted)] text-xs">
            ODA / TARİH
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex h-full">
              {dates.map((date) => {
                const d = new Date(date);
                const isToday = date === todayIso;
                const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                return (
                  <div 
                    key={date} 
                    className={cn(
                      "shrink-0 flex flex-col items-center justify-center border-r border-[var(--line)] text-xs font-medium",
                      isToday ? "bg-[var(--accent-soft)] text-[var(--accent-ink)]" : (isWeekend ? "bg-[var(--surface)] text-[var(--muted)]" : "text-[var(--ink)]")
                    )}
                    style={{ width: CELL_WIDTH }}
                  >
                    <span className="opacity-70">{d.toLocaleDateString('tr-TR', { weekday: 'short' })}</span>
                    <span className={cn("font-bold text-sm", isToday && "text-[var(--accent)]")}>{d.getDate()}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Timeline Body */}
        <div className="flex-1 overflow-auto flex">
          {/* Room Labels (Sticky Left) */}
          <div className="w-[120px] shrink-0 border-r border-[var(--line)] bg-[var(--surface)] z-10 sticky left-0">
            {rooms.map(room => (
              <div 
                key={room.id} 
                className="flex flex-col justify-center border-b border-[var(--line)] px-3 py-1"
                style={{ height: ROW_HEIGHT }}
              >
                <span className="font-bold text-sm text-[var(--ink)]">{room.number}</span>
                <span className="text-[10px] text-[var(--muted)] truncate">{room.type}</span>
              </div>
            ))}
          </div>

          {/* Grid Area */}
          <div className="relative">
            {/* Vertical grid lines */}
            <div className="absolute inset-0 flex pointer-events-none">
              {dates.map(date => (
                <div key={date} className={cn(
                  "shrink-0 h-full border-r border-[var(--line)]/50",
                  date === todayIso && "bg-[var(--accent)]/5"
                )} style={{ width: CELL_WIDTH }} />
              ))}
            </div>

            {/* Rows */}
            {rooms.map((room) => {
              // Get reservations for this room that overlap with the current view window
              const endDate = addDays(startDate, daysToShow);
              const roomReservations = state.reservations.filter(r => 
                r.roomId === room.id && 
                r.status !== "cancelled" &&
                r.checkOut > startDate && 
                r.checkIn < endDate
              );

              return (
                <div 
                  key={room.id} 
                  className="flex border-b border-[var(--line)] relative group hover:bg-[var(--surface-alt)]/30"
                  style={{ height: ROW_HEIGHT, width: CELL_WIDTH * daysToShow }}
                >
                  {roomReservations.map(res => {
                    // Calculate left offset (can be negative if checkIn is before startDate)
                    const offsetDays = daysBetween(startDate, res.checkIn);
                    const lengthDays = daysBetween(res.checkIn, res.checkOut);
                    
                    const left = offsetDays * CELL_WIDTH;
                    const width = lengthDays * CELL_WIDTH;

                    let bgClass = "bg-[var(--info-soft)] border-[var(--info)] text-[var(--info-ink)]";
                    if (res.status === "checked_in") bgClass = "bg-[var(--ok-soft)] border-[var(--ok)] text-[var(--ok-ink)]";
                    if (res.status === "completed") bgClass = "bg-[var(--muted)]/20 border-[var(--muted)] text-[var(--ink)]";

                    const guestName = state.guests.find(g => g.id === res.guestId)?.fullName ?? "Unknown";

                    return (
                      <div 
                        key={res.id}
                        className={cn(
                          "absolute top-1 bottom-1 rounded-md border-l-4 px-2 py-1 overflow-hidden shadow-sm flex flex-col justify-center cursor-pointer transition-transform hover:scale-[1.01] hover:shadow-md z-10 text-[11px]",
                          bgClass
                        )}
                        style={{ left, width: Math.max(width - 2, 0) }}
                        title={`${guestName} (${res.checkIn} - ${res.checkOut})`}
                      >
                        <span className="font-bold truncate">{guestName}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
