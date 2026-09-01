"use client";

import { useCallback, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Globe2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import type { CountryStat } from "@/lib/selectors";
import { useCountryBins, WorldMap, type CountryHover } from "./WorldMap";

const GEO_RAMP = ["var(--geo-1)", "var(--geo-2)", "var(--geo-3)", "var(--geo-4)", "var(--geo-5)"];

// Tooltip is wider than tall, so a small margin from the right/bottom edge
// is enough to decide it should flip rather than clip out of the viewport.
const TOOLTIP_EDGE_MARGIN = 180;

export function ReservationsByCountryCard({ total, countries }: { total: number; countries: CountryStat[] }) {
  const router = useRouter();
  const [hover, setHover] = useState<CountryHover | null>(null);
  // Hovering a list row highlights the matching country on the map but has
  // no cursor position to anchor a floating tooltip to, so it's tracked
  // separately from `hover` (which drives the tooltip).
  const [listHoverEn, setListHoverEn] = useState<string | null>(null);
  const { binFor } = useCountryBins(countries);

  function dotColor(count: number) {
    const bin = binFor(count);
    return bin === 0 ? "var(--geo-0)" : GEO_RAMP[bin - 1];
  }

  // `window.innerWidth/innerHeight` used to be read straight in the render
  // body — a layout-adjacent global lookup on every render, and a hydration
  // mismatch risk since SSR has no `window`. WorldMap only calls `onHover`
  // from a mousemove handler (already client-only), so computing the flip
  // there and storing it alongside `hover` moves the read off the render path
  // entirely.
  const handleHover = useCallback((info: CountryHover | null) => {
    if (!info) {
      setHover(null);
      return;
    }
    setHover({
      ...info,
      flipX: info.x > window.innerWidth - TOOLTIP_EDGE_MARGIN,
      flipY: info.y > window.innerHeight - TOOLTIP_EDGE_MARGIN,
    });
  }, []);

  return (
    <Card padded={false}>
      {countries.length === 0 ? (
        <div className="px-6 py-6">
          <EmptyState icon={Globe2} title="Henüz rezervasyon verisi yok" description="Rezervasyonlar oluşturuldukça ülke dağılımı burada görünecek." />
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row p-6">
          <div className="flex min-w-0 flex-1 flex-col gap-4 pb-6 lg:pb-0 lg:pr-6">
            <div className="flex flex-col gap-0.5">
              <h3 className="text-base font-bold tracking-tight text-[var(--color-ink)]">Ülkelere Göre Rezervasyonlar</h3>
              <p className="text-xs text-[var(--color-muted)]">Bugüne kadarki rezervasyonların ülke dağılımı</p>
            </div>
            
            <div className="relative h-[300px] lg:h-[400px]">
              <WorldMap
                countryStats={countries}
                activeCountryEn={hover?.name ?? listHoverEn}
                onHover={handleHover}
              />
              {hover &&
                typeof document !== "undefined" &&
                createPortal(
                  // Portalled to <body> — the Card has overflow-hidden and a
                  // hover:-translate-y-0.5 transform, and a transformed
                  // ancestor becomes the containing block for `fixed`
                  // descendants, which would otherwise send this tooltip's
                  // clientX/clientY-based position miles off and clip it.
                  <div
                    className="pointer-events-none fixed z-50 rounded-[var(--radius-control)] border border-[var(--color-line)] bg-[var(--color-surface)]/95 px-4 py-3 text-xs shadow-[var(--shadow-pop)] backdrop-blur-md"
                    style={{
                      left: hover.flipX ? undefined : hover.x + 14,
                      right: hover.flipX ? window.innerWidth - hover.x + 14 : undefined,
                      top: hover.flipY ? undefined : hover.y + 14,
                      bottom: hover.flipY ? window.innerHeight - hover.y + 14 : undefined,
                    }}
                  >
                    <p className="font-semibold text-[var(--ink)]">{hover.stat?.country ?? hover.name}</p>
                    <p className="text-[var(--muted)]">
                      {hover.stat && hover.stat.count > 0
                        ? `${hover.stat.count} rezervasyon (%${hover.stat.percent})`
                        : "Rezervasyon yok"}
                    </p>
                  </div>,
                  document.body
                )}
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[var(--muted)] mt-auto">
              <span>Az</span>
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: "var(--geo-0)" }} />
              {GEO_RAMP.map((color) => (
                <span key={color} className="size-2.5 rounded-sm" style={{ backgroundColor: color }} />
              ))}
              <span>Çok</span>
              <span className="ml-4 flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm" style={{ backgroundColor: "var(--geo-0)" }} />
                Rezervasyon yok
              </span>
            </div>
          </div>

          <div className="flex w-full shrink-0 flex-col border-t border-[var(--color-line)] pt-6 lg:w-96 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <p className="text-[11px] font-semibold tracking-[0.04em] text-[var(--muted)] uppercase">Toplam Rezervasyon</p>
            <p className="mt-1 text-3xl font-bold tabular-nums text-[var(--ink)]">{total.toLocaleString("tr-TR")}</p>
            <div className="mt-4 max-h-[340px] overflow-y-auto pr-6 lg:max-h-[440px]">
              <div className="flex flex-col">
                {countries.filter(c => c.percent > 0).map((c) => (
                  <div
                    key={c.country}
                    onMouseEnter={() => setListHoverEn(c.countryEn)}
                    onMouseLeave={() => setListHoverEn(null)}
                    className="flex items-center justify-between gap-2 px-2 py-2.5 text-xs transition-colors hover:bg-[var(--surface-alt)] border-b border-[var(--color-line)] last:border-b-0"
                  >
                    <span className="flex min-w-0 items-center gap-1.5 text-[var(--ink-soft)]">
                      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: dotColor(c.count) }} />
                      <span className="truncate">{c.country}</span>
                    </span>
                    <span className="shrink-0 font-semibold text-[var(--ink)]">%{c.percent}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
