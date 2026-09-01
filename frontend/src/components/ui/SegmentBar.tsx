interface Segment {
  value: number;
  color: string;
}

function pctOf(seg: Segment, safeTotal: number): number {
  return (seg.value / safeTotal) * 100;
}

export function SegmentBar({ segments, total }: { segments: Segment[]; total: number }) {
  const safeTotal = total || 1;
  // Each segment's cumulative offset is derived purely from the segments
  // before it — no mutable accumulator reassigned across the map callback,
  // which the segments list (typically 3-4 items) makes cheap even as an
  // O(n²) scan. Segments are then positioned and sized purely with
  // `transform: translateX() scaleX()` (left-anchored via transform-origin)
  // instead of animating `width`: width changes force a layout pass on
  // every frame, transform is compositor-only. The rounded pill shape comes
  // from the container's own `overflow-hidden`, so the segments themselves
  // don't need corner rounding.
  const placedSegments = segments.map((seg, i) => ({
    ...seg,
    pct: pctOf(seg, safeTotal),
    offsetPct: segments.slice(0, i).reduce((sum, s) => sum + pctOf(s, safeTotal), 0),
  }));

  return (
    <div className="relative h-3 w-full overflow-hidden rounded-[var(--radius-pill)] bg-[var(--surface-alt)]">
      {placedSegments.map((seg, i) => {
        if (seg.pct <= 0) return null;
        return (
          <div
            key={i}
            className="absolute inset-y-0 left-0 h-full w-full origin-left transition-transform duration-500 [transition-timing-function:var(--ease-organic)]"
            style={{ transform: `translateX(${seg.offsetPct}%) scaleX(${seg.pct / 100})`, backgroundColor: seg.color }}
          />
        );
      })}
    </div>
  );
}
