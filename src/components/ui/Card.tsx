import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  bodyClassName,
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-panel)]",
        "shadow-[var(--shadow-card)] transition-shadow duration-300",
        "[transition-timing-function:var(--ease-organic)]",
        "hover:shadow-[var(--shadow-card-hover)]",
        className
      )}
    >
      {(title || action) && (
        <div className="flex items-start justify-between gap-3 px-5 pt-5">
          <div>
            {title && (
              <h3 className="text-[0.9375rem] font-semibold text-[var(--color-ink)]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-[var(--color-muted)]">
                {subtitle}
              </p>
            )}
          </div>
          {action}
        </div>
      )}
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </div>
  );
}
