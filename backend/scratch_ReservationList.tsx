import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { BedDouble, CalendarRange, Users } from "lucide-react";
import { tr } from "@/lib/dictionary";
import { formatDate, formatTRY, nights } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ApiError, fetchMyReservations, cancelReservation } from "@/lib/api";
import type { Reservation, ReservationStatus } from "@/lib/types";
import { EditReservationModal } from "./EditReservationModal";
import { ReviewModal } from "./ReviewModal";

const STATUS_STYLES: Record<ReservationStatus, string> = {
  pending: "bg-amber-500/10 text-amber-700",
  confirmed: "bg-emerald-600/10 text-emerald-700",
  checked_in: "bg-brand/10 text-brand",
  completed: "bg-ink/5 text-ink/60",
  cancelled: "bg-red-500/10 text-red-700",
};

function startOfToday(): Date {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

export function ReservationList({ token }: { token: string }) {
  const reduceMotion = useReducedMotion();
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadReservations = () => {
    fetchMyReservations(token)
      .then((data) => setReservations(data))
      .catch((err) => setError(err instanceof ApiError ? err.message : tr.profile.reservations.error));
  };

  useEffect(() => {
    loadReservations();
  }, [token]);

  const { upcoming, past } = useMemo(() => {
    const today = startOfToday();
    const items = reservations ?? [];

    return {
      upcoming: items
        .filter((r) => new Date(r.checkOut) >= today && r.status !== "cancelled")
        .sort((a, b) => a.checkIn.localeCompare(b.checkIn)),
      past: items
        .filter((r) => new Date(r.checkOut) < today || r.status === "cancelled")
        .sort((a, b) => b.checkIn.localeCompare(a.checkIn)),
    };
  }, [reservations]);

  if (error) {
    return <p className="bg-surface p-8 text-center text-sm text-red-600 shadow-sm">{error}</p>;
  }

  if (reservations === null) {
    return (
      <div className="grid gap-4">
        {[0, 1].map((i) => (
          <div key={i} className="h-[132px] animate-pulse bg-surface shadow-sm" />
        ))}
      </div>
    );
  }

  if (reservations.length === 0) {
    return (
      <div className="bg-surface px-6 py-16 text-center shadow-sm">
        <CalendarRange className="mx-auto size-8 text-label" strokeWidth={1.25} />
        <p className="mt-5 font-serif text-lg text-ink">{tr.profile.reservations.empty}</p>
        <p className="mt-2 text-sm text-ink/70">{tr.profile.reservations.emptySubtitle}</p>
        <Link
          href="/rezervasyon"
          className="mt-8 inline-flex h-11 items-center justify-center border border-brand px-8 text-[11px] tracking-[0.14em] text-brand transition-colors hover:bg-brand hover:text-white"
        >
          {tr.profile.reservations.emptyCta}
        </Link>
      </div>
    );
  }

  let index = 0;

  return (
    <div className="flex flex-col gap-10">
      {[
        [tr.profile.reservations.upcoming, upcoming] as const,
        [tr.profile.reservations.past, past] as const,
      ].map(([heading, group]) =>
        group.length === 0 ? null : (
          <section key={heading}>
            <h3 className="text-[11px] tracking-[0.14em] text-label">{heading}</h3>
            <div className="mt-4 grid gap-4">
              {group.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  index={index++}
                  reduceMotion={Boolean(reduceMotion)}
                  token={token}
                  onReload={loadReservations}
                />
              ))}
            </div>
          </section>
        ),
      )}
    </div>
  );
}

function ReservationCard({
  reservation,
  index,
  reduceMotion,
  token,
  onReload,
}: {
  reservation: Reservation;
  index: number;
  reduceMotion: boolean;
  token: string;
  onReload: () => void;
}) {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const { room, checkIn, checkOut, guestCount, totalAmount, status } = reservation;
  const arrival = new Date(checkIn);
  const departure = new Date(checkOut);
  const image = room?.images?.[0];

  return (
    <motion.article
      initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reduceMotion ? 0 : 0.35,
        delay: reduceMotion ? 0 : index * 0.05,
        ease: [0.32, 0.72, 0, 1],
      }}
      className="group grid gap-5 overflow-hidden bg-surface p-5 shadow-sm transition-shadow hover:shadow-lg sm:grid-cols-[160px_1fr_auto] sm:items-center"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-canvas">
        {image ? (
          <Image
            src={image}
            alt={room?.title ?? ""}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
            sizes="160px"
          />
        ) : (
          <BedDouble
            className="absolute left-1/2 top-1/2 size-7 -translate-x-1/2 -translate-y-1/2 text-label"
            strokeWidth={1.25}
          />
        )}
      </div>

      <div className="min-w-0">
        <span className="text-[10px] tracking-[0.14em] text-label">
          {tr.profile.reservations.reservationNo(reservation.id)}
        </span>
        <h4 className="mt-1 font-serif text-lg text-ink">
          {room?.title ?? tr.reservation.summary.room}
        </h4>
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-label">
          <CalendarRange className="size-3.5 shrink-0" strokeWidth={1.5} />
          {formatDate(arrival)} — {formatDate(departure)}
          <span className="opacity-30">•</span>
          {tr.profile.reservations.nightCount(nights(arrival, departure))}
          <span className="opacity-30">•</span>
          <Users className="size-3.5 shrink-0" strokeWidth={1.5} />
          {tr.profile.reservations.guestCount(guestCount)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end sm:gap-3">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[10px] tracking-[0.1em]",
            STATUS_STYLES[status],
          )}
        >
          {tr.profile.status[status]}
        </span>
        <span className="text-lg text-ink">{formatTRY(totalAmount)}</span>
      </div>

      <div className="col-span-full mt-2 flex items-center justify-end gap-3 border-t border-line/50 pt-4 sm:col-span-1 sm:col-start-3 sm:row-start-2 sm:mt-0 sm:border-0 sm:pt-0">
        {status === "pending" && (
          <>
            <button
              onClick={async () => {
                if (!window.confirm("Bu rezervasyonu iptal etmek istediğinize emin misiniz?")) return;
                try {
                  await cancelReservation(reservation.id, token);
                  onReload();
                } catch (err) {
                  alert(err instanceof ApiError ? err.message : "İptal işlemi başarısız oldu.");
                }
              }}
              className="text-[11px] tracking-[0.14em] text-red-600 hover:text-red-700 transition-colors"
            >
              İptal Et
            </button>
            <button
              onClick={() => setEditModalOpen(true)}
              className="rounded-lg bg-surface px-4 py-2 text-[11px] tracking-[0.14em] text-ink border border-line hover:border-ink/20 hover:bg-canvas transition-colors"
            >
              Düzenle
            </button>
            <EditReservationModal
              reservation={reservation}
              token={token}
              open={editModalOpen}
              onOpenChange={setEditModalOpen}
              onSuccess={onReload}
            />
          </>
        )}
        {status === "completed" && (
          <>
            <button
              onClick={() => setReviewModalOpen(true)}
              className="rounded-none bg-brand px-4 py-2 text-[11px] tracking-[0.14em] text-white hover:bg-brand-hover transition-colors"
            >
              Değerlendir
            </button>
            <ReviewModal
              reservation={reservation}
              token={token}
              open={reviewModalOpen}
              onOpenChange={setReviewModalOpen}
            />
          </>
        )}
      </div>
    </motion.article>
  );
}
