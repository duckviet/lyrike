import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    // The extension has its own lockfile one level up; this app is its own root.
    root: __dirname,
  },
};

export default nextConfig;
