import { Users, BedDouble, Maximize2, Eye, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import type { RoomTypeDefinition } from "@/lib/types";

export function RoomTypeCard({
  roomType,
  onOpen,
  onDelete,
  canDelete,
}: {
  roomType: RoomTypeDefinition;
  onOpen: () => void;
  onDelete: (e: React.MouseEvent) => void;
  canDelete: boolean;
}) {
  return (
    <div
      onClick={onOpen}
      className="group flex cursor-pointer flex-col gap-3 rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm transition-all duration-200 [transition-timing-function:var(--ease-organic)] hover:-translate-y-0.5 hover:border-[var(--accent)] hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-[var(--ink)]">{roomType.name}</h3>
            {!roomType.active && (
              <span className="rounded-[var(--radius-pill)] bg-[var(--surface-alt)] px-2 py-0.5 text-[10px] font-semibold tracking-wide text-[var(--muted)] uppercase">
                Pasif
              </span>
            )}
          </div>
          <p className="mt-0.5 text-lg font-bold text-[var(--accent-ink)]">
            {formatCurrency(roomType.nightlyRate)} <span className="text-xs font-medium text-[var(--muted)]">/ gece</span>
          </p>
        </div>
        {canDelete && (
          <button
            onClick={onDelete}
            className="text-[var(--muted)] opacity-0 transition-opacity hover:text-[var(--crit)] group-hover:opacity-100"
            title="Oda Tipini Sil"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {roomType.description && (
        <p className="line-clamp-2 text-xs leading-relaxed text-[var(--muted)]">{roomType.description}</p>
      )}

      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-[var(--ink-soft)]">
        <span className="inline-flex items-center gap-1.5">
          <Users size={13} /> {roomType.capacity} Kişi
        </span>
        {roomType.bedType && (
          <span className="inline-flex items-center gap-1.5">
            <BedDouble size={13} /> {roomType.bedType}
          </span>
        )}
        {roomType.sizeM2 && (
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 size={13} /> {roomType.sizeM2} m²
          </span>
        )}
        {roomType.view && (
          <span className="inline-flex items-center gap-1.5">
            <Eye size={13} /> {roomType.view}
          </span>
        )}
      </div>

      {roomType.amenities.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {roomType.amenities.slice(0, 4).map((a) => (
            <span key={a} className="rounded-[var(--radius-pill)] border border-[var(--line)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-soft)]">
              {a}
            </span>
          ))}
          {roomType.amenities.length > 4 && (
            <span className="rounded-[var(--radius-pill)] border border-[var(--line)] bg-[var(--surface-alt)] px-2 py-0.5 text-[11px] font-medium text-[var(--muted)]">
              +{roomType.amenities.length - 4}
            </span>
          )}
        </div>
      )}

      <div className="mt-auto flex items-center border-t border-[var(--line)] pt-3 text-xs">
        <span className="font-medium text-[var(--ink-soft)]">{roomType.roomCount ?? 0} oda</span>
      </div>
    </div>
  );
}
