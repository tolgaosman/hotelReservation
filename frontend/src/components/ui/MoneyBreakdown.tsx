import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// A reservation's total is always room stay + (optional) room-service
// charges folded together server-side. Wherever that total is shown, split
// it back into its two lines — but only when there's actually a room-service
// charge to show, so the common case (no room service) stays a single line.
export function MoneyBreakdown({
  roomAmount,
  roomServiceAmount,
  className,
  align = "end",
}: {
  roomAmount: number;
  roomServiceAmount: number;
  className?: string;
  align?: "end" | "start";
}) {
  if (roomServiceAmount <= 0) {
    return <span className={className}>{formatCurrency(roomAmount)}</span>;
  }
  return (
    <span className={cn("flex flex-col leading-tight", align === "end" ? "items-end" : "items-start")}>
      <span className={className}>{formatCurrency(roomAmount)}</span>
      <span className="text-[10px] font-normal text-[var(--muted)]">+ {formatCurrency(roomServiceAmount)} servis</span>
    </span>
  );
}
