import React, { useState, useRef, useEffect, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Select({ className, children, value, onChange, disabled, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const options = React.Children.toArray(children)
    .filter(React.isValidElement)
    .filter((child) => child.type === "option")
    .map((child: any) => ({
      value: child.props.value,
      label: child.props.children,
    }));

  const selectedOption = options.find((o) => o.value === value) || options[0];

  function handleSelect(val: string) {
    if (onChange) {
      onChange({ target: { value: val } } as any);
    }
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={cn(
          "flex items-center justify-between rounded-[var(--radius-control)] border border-[var(--line)] bg-[var(--surface-alt)]",
          "px-3.5 py-2.5 text-sm text-[var(--ink)] outline-none transition-colors duration-200",
          open && "border-[var(--accent)] bg-[var(--surface)]",
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
          className
        )}
      >
        <span className="truncate flex-1 text-center pr-2">{selectedOption?.label}</span>
        <ChevronDown
          size={14}
          className={cn("shrink-0 text-[var(--muted)] transition-transform duration-200", open && "rotate-180")}
        />
      </div>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 max-h-60 min-w-full w-max overflow-y-auto rounded-[var(--radius-card)] border border-[var(--line)] bg-[var(--surface)] shadow-lg">
          <div className="flex flex-col divide-y divide-[var(--color-line)]/60">
            {options.map((opt) => (
              <div
                key={opt.value}
                onClick={() => handleSelect(opt.value)}
                className={cn(
                  "cursor-pointer px-4 py-3 text-sm text-center transition-colors hover:bg-[var(--surface-alt)]",
                  value === opt.value ? "bg-[var(--accent-soft)] font-medium text-[var(--accent-ink)]" : "text-[var(--ink)]"
                )}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Hidden native select for form compatibility if needed */}
      <select value={value} onChange={onChange} disabled={disabled} className="hidden" {...props}>
        {children}
      </select>
    </div>
  );
}
