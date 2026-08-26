interface Segment {
  value: number;
  color: string;
}

export function SegmentBar({ segments, total }: { segments: Segment[]; total: number }) {
  const safeTotal = total || 1;
  return (
    <div className="flex h-3 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-alt)]">
      {segments.map((seg, i) => {
        const pct = (seg.value / safeTotal) * 100;
        if (pct <= 0) return null;
        return (
          <div
            key={i}
            className="h-full transition-all duration-500 [transition-timing-function:var(--ease-organic)] first:rounded-l-[var(--radius-pill)] last:rounded-r-[var(--radius-pill)]"
            style={{ width: `${pct}%`, backgroundColor: seg.color }}
          />
        );
      })}
    </div>
  );
}
