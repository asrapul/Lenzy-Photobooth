import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Next.js 16 uses Turbopack by default. gif.js is a client-side-only library
  // and works fine without any bundler config. The /public/gif.worker.js file
  // is served as a static asset.
  turbopack: {},

  // Increase the body parser size limit for API routes.
  // Default is ~1MB; our save-session API sends large base64 photo payloads.
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
