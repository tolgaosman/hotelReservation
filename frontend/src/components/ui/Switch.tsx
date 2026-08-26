import { cn } from "@/lib/utils";

interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onCheckedChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative flex h-6 w-11 shrink-0 items-center rounded-full p-0.5",
        "transition-colors duration-200 [transition-timing-function:var(--ease-organic)]",
        checked ? "bg-[var(--accent)]" : "bg-[var(--line)]"
      )}
    >
      <span
        className={cn(
          "size-5 rounded-full bg-white shadow-[var(--shadow-sm)]",
          "transition-transform duration-200 [transition-timing-function:var(--ease-organic)]",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}
