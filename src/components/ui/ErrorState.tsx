import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/cn";

interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "Something went wrong",
  description = "We couldn't load this data. Please try again.",
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--color-danger-soft)] text-[var(--color-danger)]">
        <AlertTriangle size={18} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
      <p className="max-w-xs text-xs text-[var(--color-muted)]">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className={cn(
            "mt-2 rounded-[var(--radius-control)] bg-[var(--color-ink)] px-3.5 py-1.5 text-xs font-medium text-white",
            "transition-transform duration-200 [transition-timing-function:var(--ease-organic)]",
            "hover:-translate-y-0.5 active:translate-y-0"
          )}
        >
          Try again
        </button>
      )}
    </div>
  );
}
