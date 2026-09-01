import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // `next dev` blocks cross-origin requests to /_next/* (assets, HMR) unless
  // the requesting origin is allowlisted — without this, opening the app from
  // another machine's IP loads the initial HTML shell but the JS bundle never
  // finishes, which looks like an infinite loading spinner.
  allowedDevOrigins: ["192.168.128.217"],
};

export default nextConfig;
