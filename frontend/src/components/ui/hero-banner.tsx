import React from "react";
import { cn } from "@/lib/utils";

export type HeroBannerTone = "accent" | "ok" | "warn" | "crit" | "info";

// Icon chip and value share one tone so a metric never shows a gray icon
// next to a colored number (or vice versa) — the color is one decision per
// metric, not two independent ones that can drift apart.
const TONE_CLASSES: Record<HeroBannerTone, { chip: string; value: string }> = {
  accent: { chip: "bg-[var(--color-accent-soft)] text-[var(--color-accent-ink)]", value: "text-[var(--color-accent-ink)]" },
  ok: { chip: "bg-[var(--color-ok-soft)] text-[var(--color-ok)]", value: "text-[var(--color-ok)]" },
  warn: { chip: "bg-[var(--color-warn-soft)] text-[var(--color-warn)]", value: "text-[var(--color-warn)]" },
  crit: { chip: "bg-[var(--color-crit-soft)] text-[var(--color-crit)]", value: "text-[var(--color-crit)]" },
  info: { chip: "bg-[var(--color-info-soft)] text-[var(--color-info)]", value: "text-[var(--color-info)]" },
};

export interface HeroBannerMetric {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  /** Defaults to "accent" when omitted. */
  tone?: HeroBannerTone;
}

interface HeroBannerProps {
  title: string;
  subtitle: string;
  metrics: HeroBannerMetric[];
  className?: string;
}

export function HeroBanner({ title, subtitle, metrics, className }: HeroBannerProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-[var(--color-surface)] p-6 md:p-8 shadow-[var(--shadow-card)]",
        className
      )}
    >
      {/* Background is now clean without decorative gradients as requested */}
      
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between relative z-10">
        <div className="max-w-md shrink-0">
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--color-ink)]">{title}</h2>
          <p className="mt-2.5 text-[15px] leading-relaxed text-[var(--color-muted)]">{subtitle}</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
          {metrics.map((metric, i) => {
            const tone = TONE_CLASSES[metric.tone ?? "accent"];
            return (
              <div
                key={i}
                className={cn(
                  "flex min-w-[140px] flex-col items-center text-center gap-2.5 rounded-2xl border border-[var(--color-line)] bg-[var(--color-canvas)]/40 p-4 md:p-5",
                  "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm hover:bg-[var(--color-surface)]",
                  "backdrop-blur-xl"
                )}
              >
                <span className="flex items-center justify-center gap-2">
                  {metric.icon && (
                    <span className={cn("flex size-7 items-center justify-center rounded-full", tone.chip)}>
                      {metric.icon}
                    </span>
                  )}
                  <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-muted)]">
                    {metric.label}
                  </span>
                </span>
                <span className={cn("text-3xl font-extrabold tracking-tight", tone.value)}>{metric.value}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
