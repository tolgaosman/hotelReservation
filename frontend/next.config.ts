import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
  // `next dev` blocks cross-origin requests to /_next/* (assets, HMR) unless
  // the requesting origin is allowlisted — without this, opening the app from
  // another machine's IP loads the initial HTML shell but the JS bundle never
  // finishes, which looks like an infinite loading spinner.
  allowedDevOrigins: ["192.168.128.217"],
  async rewrites() {
    // Server-side proxy: the browser only ever talks to this Next.js server,
    // which forwards to the backend. BACKEND_INTERNAL_URL lets docker-compose
    // point this at the backend container's service name in production.
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:8000';
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ]
  },
};

export default nextConfig;
