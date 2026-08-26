"use client";

import { useEffect, useId } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: "md" | "lg";
}

export function Drawer({ open, onClose, title, subtitle, children, footer, width = "md" }: DrawerProps) {
  const titleId = useId();
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div
      aria-hidden={!open}
      // Closed drawers stay mounted (for the slide-out transition) but must
      // not be reachable by Tab or hit-testing — pointer-events-none alone
      // only blocks the mouse, not keyboard focus.
      inert={!open}
      className={cn("fixed inset-0 z-50 transition-opacity duration-300", open ? "pointer-events-auto" : "pointer-events-none opacity-0")}
    >
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-[var(--ink)]/25 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute top-0 right-0 flex h-full flex-col bg-[var(--surface)] shadow-[var(--shadow-pop)]",
          "transition-transform duration-300 [transition-timing-function:var(--ease-organic)]",
          width === "lg" ? "w-full max-w-xl" : "w-full max-w-md",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] px-6 py-5">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-[var(--ink)]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[var(--muted)]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-[var(--muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex items-center justify-end gap-2 border-t border-[var(--line)] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}
