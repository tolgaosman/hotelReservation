import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)]",
        "px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]",
        "transition-colors duration-200 [transition-timing-function:var(--ease-organic)] focus:border-[var(--accent)] focus:bg-[var(--surface)]",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)]",
        "px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none placeholder:text-[var(--muted)]",
        "transition-colors duration-200 [transition-timing-function:var(--ease-organic)] focus:border-[var(--accent)] focus:bg-[var(--surface)]",
        className
      )}
      {...props}
    />
  );
}
