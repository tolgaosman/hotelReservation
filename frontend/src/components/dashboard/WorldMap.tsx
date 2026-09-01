"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { geoNaturalEarth1, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import { Maximize, ZoomIn, ZoomOut } from "lucide-react";
import worldTopology from "world-atlas/countries-110m.json";
import type { CountryStat } from "@/lib/selectors";

const WIDTH = 800;
const HEIGHT = 420;
const MIN_SCALE = 1;
const MAX_SCALE = 8;
const BUTTON_ZOOM_FACTOR = 1.5;

/** --geo-1..--geo-5 tokens — index 0 is unused (bin 0 = no data = --geo-0). */
const GEO_RAMP = ["", "var(--geo-1)", "var(--geo-2)", "var(--geo-3)", "var(--geo-4)", "var(--geo-5)"];

const INACTIVE_STROKE = "var(--surface)";
const INACTIVE_STROKE_WIDTH = "0.6";
const ACTIVE_STROKE = "var(--ink-soft)";
const ACTIVE_STROKE_WIDTH = "1.2";

export interface CountryHover {
  name: string;
  stat: CountryStat | null;
  x: number;
  y: number;
  /** Optional: set by consumers that want to decide tooltip-flip once, at
   *  hover time, instead of re-reading `window` dimensions on every render. */
  flipX?: boolean;
  flipY?: boolean;
}

interface CountryFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
}

interface CountryShape {
  name: string;
  d: string | undefined;
}

interface CountryInfo {
  fill: string;
  title: string;
}

interface View {
  scale: number;
  x: number;
  y: number;
}

const IDENTITY_VIEW: View = { scale: MIN_SCALE, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Keeps panned/zoomed content covering the viewBox instead of drifting off it. */
function clampView(view: View): View {
  const scale = clamp(view.scale, MIN_SCALE, MAX_SCALE);
  if (scale === MIN_SCALE) return IDENTITY_VIEW;
  return {
    scale,
    x: clamp(view.x, WIDTH * (1 - scale), 0),
    y: clamp(view.y, HEIGHT * (1 - scale), 0),
  };
}

/**
 * Quantile bin (1-5) for a count, given the sorted nonzero counts in the
 * dataset. Linear count/max binning collapses everything into the lightest
 * tier once one country (Türkiye) dominates — quantiles keep the mid/long
 * tail visually separated instead.
 *
 * Binning is precomputed as 5 upper-bound thresholds once per dataset
 * (`buildQuantileThresholds`) so looking up a single country's bin is an O(1)
 * threshold scan instead of re-filtering the whole sorted array per country —
 * this used to run once per rendered path, making it O(countries²) per render.
 */
function buildQuantileThresholds(sortedNonZero: number[]): number[] {
  if (sortedNonZero.length === 0) return [];
  if (sortedNonZero.length === 1) return [sortedNonZero[0]];
  const thresholds: number[] = [];
  for (let bin = 1; bin <= 5; bin++) {
    const idx = Math.ceil((bin / 5) * sortedNonZero.length) - 1;
    thresholds.push(sortedNonZero[Math.min(idx, sortedNonZero.length - 1)]);
  }
  return thresholds;
}

function quantileBin(count: number, thresholds: number[]): number {
  if (count <= 0 || thresholds.length === 0) return 0;
  if (thresholds.length === 1) return 5;
  for (let bin = 0; bin < thresholds.length; bin++) {
    if (count <= thresholds[bin]) return bin + 1;
  }
  return 5;
}

export function useCountryBins(countryStats: CountryStat[]) {
  return useMemo(() => {
    const statByEn = new Map<string, CountryStat>();
    for (const s of countryStats) statByEn.set(s.countryEn, s);
    const sortedNonZero = countryStats
      .map((s) => s.count)
      .filter((c) => c > 0)
      .sort((a, b) => a - b);
    const thresholds = buildQuantileThresholds(sortedNonZero);
    const binFor = (count: number) => quantileBin(count, thresholds);
    return { statByEn, binFor };
  }, [countryStats]);
}

function svgPointFromClient(svg: SVGSVGElement, clientX: number, clientY: number, inverse: DOMMatrix) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  return point.matrixTransform(inverse);
}

/**
 * All ~176 country paths, isolated behind React.memo so that hovering the
 * map (which re-renders the parent card via its `onHover` state) never
 * re-serializes or re-diffs this subtree — only a real data change (new
 * `shapes`/`info` identity) or a genuinely new callback does. Active-country
 * highlighting is applied straight to the DOM by WorldMap's effect below
 * instead of as a prop here, for the same reason.
 */
const CountryPaths = memo(function CountryPaths({
  shapes,
  info,
  onMove,
  onLeave,
}: {
  shapes: CountryShape[];
  info: Map<string, CountryInfo>;
  onMove: (name: string, e: React.MouseEvent<SVGPathElement>) => void;
  onLeave: () => void;
}) {
  return (
    <>
      {shapes.map((s) => {
        const entry = info.get(s.name);
        return (
          <path
            key={s.name}
            data-country={s.name}
            d={s.d}
            fill={entry?.fill ?? "var(--geo-0)"}
            stroke={INACTIVE_STROKE}
            strokeWidth={INACTIVE_STROKE_WIDTH}
            vectorEffect="non-scaling-stroke"
            onMouseMove={(e) => onMove(s.name, e)}
            onMouseLeave={onLeave}
          >
            <title>{entry?.title ?? s.name}</title>
          </path>
        );
      })}
    </>
  );
});

export function WorldMap({
  countryStats,
  activeCountryEn,
  onHover,
}: {
  countryStats: CountryStat[];
  activeCountryEn?: string | null;
  onHover: (info: CountryHover | null) => void;
}) {
  const { statByEn, binFor } = useCountryBins(countryStats);
  const svgRef = useRef<SVGSVGElement>(null);
  const [view, setView] = useState<View>(IDENTITY_VIEW);
  const dragRef = useRef<{ inverse: DOMMatrix; startX: number; startY: number; viewX: number; viewY: number } | null>(null);
  const pendingViewRef = useRef<{ x: number; y: number } | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const { features, path } = useMemo(() => {
    const geo = feature(
      worldTopology as any,
      worldTopology.objects.countries as any
    ) as unknown as { features: CountryFeature[] };
    // Antarctica adds a wide, hotel-irrelevant landmass at the bottom of the
    // map that also drags the projection's fitted bounds — dropping it both
    // declutters the map and lets the inhabited world render larger.
    const inhabited = { ...geo, features: geo.features.filter((f) => f.properties.name !== "Antarctica") };
    // Make the map natively render slightly larger than the viewBox to give
    // it a default "zoomed in" look, cropping just the empty ocean edges.
    const projection = geoNaturalEarth1().fitExtent(
      [
        [-WIDTH * 0.05, -HEIGHT * 0.05],
        [WIDTH * 1.05, HEIGHT * 1.1],
      ],
      inhabited as never
    );
    return { features: inhabited.features, path: geoPath(projection) };
  }, []);

  // Path geometry never depends on the live data, only on the fixed
  // projection above — serializing all ~176 `d` strings once here (instead
  // of inline in the render loop) means a hover-driven parent re-render
  // never re-runs `geoPath` at all.
  const shapes = useMemo<CountryShape[]>(
    () => features.map((f) => ({ name: f.properties.name, d: path(f as never) ?? undefined })),
    [features, path]
  );

  const countryInfo = useMemo(() => {
    const map = new Map<string, CountryInfo>();
    for (const f of features) {
      const name = f.properties.name;
      const stat = statByEn.get(name);
      const bin = stat ? binFor(stat.count) : 0;
      const fill = bin === 0 ? "var(--geo-0)" : GEO_RAMP[bin];
      const title =
        stat && stat.count > 0
          ? `${stat.country}: ${stat.count} rezervasyon (%${stat.percent})`
          : `${name}: rezervasyon yok`;
      map.set(name, { fill, title });
    }
    return map;
  }, [features, statByEn, binFor]);

  // Wheel-to-zoom needs preventDefault to stop the page from scrolling while
  // the cursor is over the map — React's onWheel is attached passively, so a
  // native, non-passive listener is required for the preventDefault to work.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const ctm = svg!.getScreenCTM();
      if (!ctm) return;
      const point = svgPointFromClient(svg!, e.clientX, e.clientY, ctm.inverse());
      setView((prev) => {
        const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
        const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
        const focal = { x: (point.x - prev.x) / prev.scale, y: (point.y - prev.y) / prev.scale };
        return clampView({ scale: nextScale, x: point.x - nextScale * focal.x, y: point.y - nextScale * focal.y });
      });
    }

    svg.addEventListener("wheel", handleWheel, { passive: false });
    return () => svg.removeEventListener("wheel", handleWheel);
  }, []);

  // Applies the hovered country's highlight straight to its <path> element
  // instead of threading `activeCountryEn` through CountryPaths as a prop —
  // that would force a full re-render (and re-diff) of all ~176 paths on
  // every hover change, exactly what CountryPaths' memo is meant to avoid.
  const lastActiveRef = useRef<string | null>(null);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const next = activeCountryEn ?? null;
    const prev = lastActiveRef.current;
    if (prev === next) return;

    if (prev) {
      const prevPath = svg.querySelector<SVGPathElement>(`path[data-country="${CSS.escape(prev)}"]`);
      prevPath?.setAttribute("stroke", INACTIVE_STROKE);
      prevPath?.setAttribute("stroke-width", INACTIVE_STROKE_WIDTH);
    }
    if (next) {
      const nextPath = svg.querySelector<SVGPathElement>(`path[data-country="${CSS.escape(next)}"]`);
      nextPath?.setAttribute("stroke", ACTIVE_STROKE);
      nextPath?.setAttribute("stroke-width", ACTIVE_STROKE_WIDTH);
    }
    lastActiveRef.current = next;
  }, [activeCountryEn, shapes]);

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) cancelAnimationFrame(dragRafRef.current);
    };
  }, []);

  function zoomBy(factor: number) {
    setView((prev) => {
      const nextScale = clamp(prev.scale * factor, MIN_SCALE, MAX_SCALE);
      // Zoom toward the map's center when triggered from the buttons (no cursor to anchor to).
      const cx = WIDTH / 2;
      const cy = HEIGHT / 2;
      const focal = { x: (cx - prev.x) / prev.scale, y: (cy - prev.y) / prev.scale };
      return clampView({ scale: nextScale, x: cx - nextScale * focal.x, y: cy - nextScale * focal.y });
    });
  }

  function resetZoom() {
    setView(IDENTITY_VIEW);
  }

  function handlePointerDown(e: React.PointerEvent<SVGSVGElement>) {
    if (view.scale <= MIN_SCALE) return;
    const svg = svgRef.current;
    if (!svg) return;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const inverse = ctm.inverse();
    const start = svgPointFromClient(svg, e.clientX, e.clientY, inverse);
    dragRef.current = { inverse, startX: start.x, startY: start.y, viewX: view.x, viewY: view.y };
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  // Reuses the CTM captured on pointerdown instead of calling
  // `getScreenCTM()` again on every move — that call forces a synchronous
  // layout read, so doing it per pointermove (previously twice) turned
  // dragging into a layout-thrashing loop. The `<svg>` itself never moves
  // during a pan (only the inner `<g>` transform does), so the cached CTM
  // stays valid for the whole gesture.
  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    const drag = dragRef.current;
    const svg = svgRef.current;
    if (!drag || !svg) return;
    const current = svgPointFromClient(svg, e.clientX, e.clientY, drag.inverse);
    pendingViewRef.current = {
      x: drag.viewX + (current.x - drag.startX),
      y: drag.viewY + (current.y - drag.startY),
    };
    if (dragRafRef.current !== null) return;
    dragRafRef.current = requestAnimationFrame(() => {
      dragRafRef.current = null;
      const pending = pendingViewRef.current;
      if (!pending) return;
      setView((prev) => clampView({ scale: prev.scale, x: pending.x, y: pending.y }));
    });
  }

  function endDrag() {
    dragRef.current = null;
    setIsDragging(false);
    if (dragRafRef.current !== null) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  }

  const handleMove = useCallback(
    (name: string, e: React.MouseEvent<SVGPathElement>) => {
      onHover({ name, stat: statByEn.get(name) ?? null, x: e.clientX, y: e.clientY });
    },
    [onHover, statByEn]
  );
  const handleLeave = useCallback(() => onHover(null), [onHover]);

  const canPan = view.scale > MIN_SCALE;

  return (
    <div className="relative h-full w-full">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className={`h-full w-full touch-none ${canPan ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"}`}
        role="img"
        aria-label="Ülkelere göre rezervasyon dağılımı haritası"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <g transform={`translate(${view.x} ${view.y}) scale(${view.scale})`}>
          <CountryPaths shapes={shapes} info={countryInfo} onMove={handleMove} onLeave={handleLeave} />
        </g>
      </svg>

      <div className="absolute right-2 top-2 flex flex-col overflow-hidden rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-surface)]/95 shadow-[var(--shadow-pop)] backdrop-blur-md">
        <button
          type="button"
          aria-label="Yakınlaştır"
          onClick={() => zoomBy(BUTTON_ZOOM_FACTOR)}
          disabled={view.scale >= MAX_SCALE}
          className="flex size-7 items-center justify-center text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-40"
        >
          <ZoomIn size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Uzaklaştır"
          onClick={() => zoomBy(1 / BUTTON_ZOOM_FACTOR)}
          disabled={view.scale <= MIN_SCALE}
          className="flex size-7 items-center justify-center border-t border-[var(--color-line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-40"
        >
          <ZoomOut size={14} strokeWidth={2} />
        </button>
        <button
          type="button"
          aria-label="Yakınlaştırmayı sıfırla"
          onClick={resetZoom}
          disabled={view.scale === MIN_SCALE}
          className="flex size-7 items-center justify-center border-t border-[var(--color-line)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-40"
        >
          <Maximize size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
