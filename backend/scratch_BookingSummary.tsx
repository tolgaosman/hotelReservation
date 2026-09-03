import { GlassCard } from "@/components/rooms/stage/GlassCard";
import { tr } from "@/lib/dictionary";
import { formatDate, formatTRY, nights } from "@/lib/format";
import { priceStay } from "@/lib/pricing";
import type { Room, Addon } from "@/lib/types";

export interface GuestDetails {
  fullName: string;
  email: string;
  phone: string;
  identityNumber: string;
  country: string;
  note: string;
}

export function BookingSummary({
  room,
  arrival,
  departure,
  guests,
  guestDetails,
  taxRate,
  selectedAddons = [],
}: {
  room: Room;
  arrival: Date;
  departure: Date;
  guests: number;
  guestDetails: GuestDetails;
  taxRate: number;
  selectedAddons?: Addon[];
}) {
  const n = nights(arrival, departure);
  const { roomTotal, taxAmount, total: roomBaseTotal } = priceStay(
    room.nightlyRate,
    taxRate,
    n,
  );

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + Number(a.price), 0);
  const total = roomBaseTotal + addonsTotal;

  const rows: [string, string][] = [
    [tr.reservation.summary.room, room.title],
    [
      tr.reservation.summary.dates,
      `${formatDate(arrival)} — ${formatDate(departure)}`,
    ],
    [tr.reservation.summary.nights, String(n)],
    [tr.reservation.summary.guests, String(guests)],
    [tr.reservation.guestDetails.fullName, guestDetails.fullName],
    [tr.reservation.guestDetails.email, guestDetails.email],
    [tr.reservation.guestDetails.phone, guestDetails.phone],
    [tr.rooms.roomRate, formatTRY(roomTotal)],
    [tr.rooms.taxLabel(taxRate), formatTRY(taxAmount)],
  ];

  return (
    <GlassCard variant="plain" className="p-6 sm:p-8">
      <dl className="divide-y divide-line">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between py-3">
            <dt className="text-[11px] tracking-[0.1em] text-label">{label}</dt>
            <dd className="text-sm text-ink">{value}</dd>
          </div>
        ))}
        {selectedAddons.length > 0 && (
          <div className="py-3">
            <dt className="text-[11px] tracking-[0.1em] text-label mb-2">EKSTRA HİZMETLER</dt>
            {selectedAddons.map(addon => (
              <div key={addon.id} className="flex items-center justify-between py-1">
                <dd className="text-sm text-ink">{addon.name}</dd>
                <dd className="text-sm text-ink">{formatTRY(Number(addon.price))}</dd>
              </div>
            ))}
          </div>
        )}
      </dl>
      <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
        <span className="text-[11px] tracking-[0.1em] text-label">
          {tr.reservation.summary.total}
        </span>
        <span className="text-xl font-medium text-ink">{formatTRY(total)}</span>
      </div>
    </GlassCard>
  );
}
