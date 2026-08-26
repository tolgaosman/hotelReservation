import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Bir şeyler ters gitti",
  description = "Bu veriler yüklenemedi. Lütfen tekrar deneyin.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--crit-soft)] text-[var(--crit)]">
        <AlertTriangle size={18} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium text-[var(--ink)]">{title}</p>
      <p className="max-w-xs text-xs text-[var(--muted)]">{description}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry} className="mt-2">
          Tekrar dene
        </Button>
      )}
    </div>
  );
}
