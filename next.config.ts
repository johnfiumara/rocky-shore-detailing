import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  turbopack: {
    root: import.meta.dirname,
  },
  images: {
    // next/image's optimizer requires a Node runtime; static export ships HTML
    // only, so we use the unoptimized loader and serve images as-is.
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
