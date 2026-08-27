"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

export interface CountryHover {
  name: string;
  stat: CountryStat | null;
  x: number;
  y: number;
}

interface CountryFeature {
  type: "Feature";
  properties: { name: string };
  geometry: unknown;
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
 */
function quantileBin(count: number, sortedNonZero: number[]): number {
  if (count <= 0 || sortedNonZero.length === 0) return 0;
  if (sortedNonZero.length === 1) return 5;
  const rank = sortedNonZero.filter((v) => v <= count).length;
  const percentile = rank / sortedNonZero.length;
  return Math.max(1, Math.min(5, Math.ceil(percentile * 5)));
}

export function useCountryBins(countryStats: CountryStat[]) {
  return useMemo(() => {
    const statByEn = new Map<string, CountryStat>();
    for (const s of countryStats) statByEn.set(s.countryEn, s);
    const sortedNonZero = countryStats
      .map((s) => s.count)
      .filter((c) => c > 0)
      .sort((a, b) => a - b);
    const binFor = (count: number) => quantileBin(count, sortedNonZero);
    return { statByEn, binFor };
  }, [countryStats]);
}

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
  const dragRef = useRef<{ startClientX: number; startClientY: number; viewX: number; viewY: number } | null>(null);
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

  // Wheel-to-zoom needs preventDefault to stop the page from scrolling while
  // the cursor is over the map — React's onWheel is attached passively, so a
  // native, non-passive listener is required for the preventDefault to work.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function handleWheel(e: WheelEvent) {
      e.preventDefault();
      const point = toSvgPoint(svg!, e.clientX, e.clientY);
      if (!point) return;
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

  function toSvgPoint(svg: SVGSVGElement, clientX: number, clientY: number) {
    const ctm = svg.getScreenCTM();
    if (!ctm) return null;
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    return point.matrixTransform(ctm.inverse());
  }

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
    dragRef.current = { startClientX: e.clientX, startClientY: e.clientY, viewX: view.x, viewY: view.y };
    setIsDragging(true);
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!dragRef.current || !svgRef.current) return;
    const start = toSvgPoint(svgRef.current, dragRef.current.startClientX, dragRef.current.startClientY);
    const current = toSvgPoint(svgRef.current, e.clientX, e.clientY);
    if (!start || !current) return;
    setView(
      clampView({
        scale: view.scale,
        x: dragRef.current.viewX + (current.x - start.x),
        y: dragRef.current.viewY + (current.y - start.y),
      })
    );
  }

  function endDrag() {
    dragRef.current = null;
    setIsDragging(false);
  }

  function colorFor(name: string) {
    const stat = statByEn.get(name);
    const bin = stat ? binFor(stat.count) : 0;
    return bin === 0 ? "var(--geo-0)" : GEO_RAMP[bin];
  }

  function handleMove(name: string, e: React.MouseEvent<SVGPathElement>) {
    onHover({ name, stat: statByEn.get(name) ?? null, x: e.clientX, y: e.clientY });
  }

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
          {features.map((f, i) => {
            const name = f.properties.name;
            const stat = statByEn.get(name);
            const isActive = activeCountryEn === name;
            return (
              <path
                key={i}
                d={path(f as never) ?? undefined}
                fill={colorFor(name)}
                stroke={isActive ? "var(--ink-soft)" : "var(--surface)"}
                strokeWidth={isActive ? 1.2 : 0.6}
                vectorEffect="non-scaling-stroke"
                onMouseMove={(e) => handleMove(name, e)}
                onMouseLeave={() => onHover(null)}
                className="transition-colors duration-150 [transition-timing-function:var(--ease-organic)]"
              >
                <title>
                  {stat && stat.count > 0
                    ? `${stat.country}: ${stat.count} rezervasyon (%${stat.percent})`
                    : `${name}: rezervasyon yok`}
                </title>
              </path>
            );
          })}
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
