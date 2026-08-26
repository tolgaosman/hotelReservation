"use client";

import { useEffect } from "react";

export function ScaleWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    function handleResize() {
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

    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return <>{children}</>;
}
