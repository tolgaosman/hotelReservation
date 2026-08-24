import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-muted)]">
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <p className="text-sm font-medium text-[var(--color-ink)]">{title}</p>
      {description && (
        <p className="max-w-xs text-xs text-[var(--color-muted)]">{description}</p>
      )}
    </div>
  );
}
