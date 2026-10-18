import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    qualities: [75, 100],
  },
  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Legacy / marketing aliases → canonical App Router paths (audit D03)
  async redirects() {
    return [
      { source: "/catalogue", destination: "/gifts", permanent: true },
      { source: "/build-a-box", destination: "/gifts/box", permanent: true },
      { source: "/gift-finder", destination: "/gifts/find", permanent: true },
      { source: "/brief", destination: "/gifts/brief", permanent: true },
    ];
  },
};

export default nextConfig;
