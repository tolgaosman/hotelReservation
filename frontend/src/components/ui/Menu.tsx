"use client";

import { useEffect, useRef, useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MenuAction {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

export function Menu({ actions }: { actions: MenuAction[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label="Kart seçenekleri"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex size-7 items-center justify-center rounded-full text-[var(--muted)]",
          "transition-colors duration-150 hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
        )}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          className={cn(
            "absolute right-0 top-9 z-20 min-w-32 w-max max-h-60 overflow-y-auto rounded-[var(--radius-control)]",
            "border border-[var(--line)] bg-[var(--surface)] py-1 shadow-[var(--shadow-pop)]"
          )}
        >
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              className={cn(
                "block w-full px-4 py-2 text-center text-[13px] font-medium",
                "transition-colors duration-150 hover:bg-[var(--surface-alt)]",
                action.danger ? "text-[var(--crit)]" : "text-[var(--ink)]"
              )}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
