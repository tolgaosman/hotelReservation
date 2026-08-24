import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-control)] bg-[var(--color-border)]/60",
        className
      )}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-panel)] p-5">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="size-8 rounded-[var(--radius-control)]" />
      </div>
      <Skeleton className="mt-4 h-7 w-24" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 w-1/6" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
