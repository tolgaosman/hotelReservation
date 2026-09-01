"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Sil",
  cancelLabel = "Vazgeç",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-[60] flex items-center justify-center bg-[var(--ink)]/45 p-4 backdrop-blur-sm duration-200 [animation-timing-function:var(--ease-organic)] print:hidden"
      onClick={onCancel}
    >
      <div
        className="animate-in fade-in zoom-in-95 slide-in-from-bottom-2 w-full max-w-sm rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--shadow-pop)] duration-250 [animation-timing-function:var(--ease-organic)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--crit-soft)] text-[var(--crit)] ring-4 ring-[var(--crit-soft)]/50">
            <AlertTriangle size={19} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 pt-0.5">
            <h3 className="text-[15px] font-bold tracking-tight text-[var(--ink)]">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-[var(--muted)]">{description}</p>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2.5">
          <Button variant="secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant="danger" size="sm" onClick={onConfirm} autoFocus>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
