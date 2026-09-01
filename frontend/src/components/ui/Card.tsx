import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Menu, type MenuAction } from "./Menu";

interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  menu?: MenuAction[];
  children: ReactNode;
  className?: string;
  /** Set false for cards that manage their own inner padding (tables). */
  padded?: boolean;
  /** Defaults to true. Set false if the card contains dropdowns that need to break out of bounds. */
  overflowHidden?: boolean;
  /** Defaults to true. Set false for table cards: no lift-on-hover, just a slow-filling accent border. */
  hover?: boolean;
}

export function Card({ title, subtitle, action, menu, children, className, padded = false, overflowHidden = true, hover = true }: CardProps) {
  return (
    <div
      className={cn(
        // backdrop-blur-xl used to sit here — with a solid canvas behind
        // every card it added no visible effect, only a full re-rasterization
        // of everything under the card (176-path map, chart canvases) on
        // every repaint, including its own hover transition below.
        "flex flex-col rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)]/85 shadow-[var(--shadow-card)]",
        hover
          ? "transition-[transform,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-md"
          : "transition-[border-color] duration-700 [transition-timing-function:var(--ease-organic)] hover:border-[var(--color-accent)]",
        overflowHidden && "overflow-hidden",
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
