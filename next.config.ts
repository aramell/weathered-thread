import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The Etsy hand-off and per-motif checkout routes were removed; keep old links working.
  async redirects() {
    return [
      { source: "/go/:slug", destination: "/shop", permanent: true },
      { source: "/checkout/:motif((?!thank-you$).+)", destination: "/shop", permanent: true },
    ];
  },
};

export default nextConfig;
