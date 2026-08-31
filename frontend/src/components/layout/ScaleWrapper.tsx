"use client";

import { useEffect } from "react";

export function ScaleWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function applyScale() {
      // 1440px is a standard desktop width
      const baseWidth = 1440;

      // Temporarily reset zoom to 1 to get the true window width without zoom interference
      const rootStyle = document.documentElement.style as any;
      rootStyle.zoom = "1";

      const currentWidth = window.innerWidth;
      // Cap the scale at 1.0 so it never zooms in (enlarges) on large screens,
      // it only zooms out (shrinks) on small screens to prevent the layout from breaking.
      const scale = Math.min(1, currentWidth / baseWidth);

      // Apply CSS zoom to the html element.
      rootStyle.zoom = scale.toString();
    }

    // Coalesce a resize drag's flood of events into one zoom write per
    // frame — an unthrottled write here forces a full-document reflow on
    // every single event.
    let rafId: number | null = null;
    function handleResize() {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        applyScale();
      });
    }

    applyScale();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return <>{children}</>;
}
