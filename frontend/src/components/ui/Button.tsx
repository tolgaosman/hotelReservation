import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
  secondary: "border border-[var(--line-strong)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-alt)]",
  ghost: "text-[var(--ink-soft)] hover:bg-[var(--surface-alt)] hover:text-[var(--ink)]",
  danger: "bg-[var(--crit-soft)] text-[var(--crit)] hover:bg-[var(--crit)] hover:text-white",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "px-4 py-2.5 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

export function Button({ variant = "primary", size = "md", className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-1.5 rounded-[var(--radius-control)] font-semibold",
        "transition-all duration-200 [transition-timing-function:var(--ease-organic)]",
        "hover:-translate-y-0.5 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className
      )}
      {...props}
    />
  );
}
