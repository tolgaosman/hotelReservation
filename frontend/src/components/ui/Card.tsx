import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Menu, type MenuAction } from "./Menu";

interface CardProps {
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  menu?: MenuAction[];
  children: ReactNode;
  className?: string;
  /** Set false for cards that manage their own inner padding (tables). */
  padded?: boolean;
}

export function Card({ title, subtitle, action, menu, children, className, padded = false }: CardProps) {
  return (
    <div
      className={cn(
        "overflow-hidden flex flex-col rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]/85 backdrop-blur-xl shadow-[var(--shadow-card)]",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        className
      )}
    >
      {(title || subtitle || action || menu) && (
        <div className="flex items-center justify-between gap-4 px-6 pt-5 pb-3">
          <div className="flex flex-col gap-0.5">
            {title && <h3 className="text-base font-bold tracking-tight text-[var(--color-ink)]">{title}</h3>}
            {subtitle && <p className="text-xs text-[var(--color-muted)]">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {action}
            {menu && <Menu actions={menu} />}
          </div>
        </div>
      )}
      <div className={cn("flex flex-1 flex-col", padded ? "px-6 pb-6" : undefined)}>{children}</div>
    </div>
  );
}
