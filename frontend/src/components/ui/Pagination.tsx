import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  totalLabel?: string;
}

export function Pagination({ page, pageCount, onPageChange, totalLabel }: PaginationProps) {
  if (pageCount <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 border-t border-[var(--line)] px-6 py-3.5">
      {totalLabel && <span className="text-xs text-[var(--muted)]">{totalLabel}</span>}
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="flex size-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-alt)] disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="px-2 text-xs font-medium text-[var(--ink)]">
          {page} / {pageCount}
        </span>
        <button
          type="button"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          className={cn(
            "flex size-7 items-center justify-center rounded-[var(--radius-control)] text-[var(--ink-soft)]",
            "transition-colors hover:bg-[var(--surface-alt)] disabled:pointer-events-none disabled:opacity-30"
          )}
        >
          <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}
